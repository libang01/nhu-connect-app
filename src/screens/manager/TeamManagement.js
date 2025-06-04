import { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Button, Card } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { collection, query, where, getDocs, orderBy, startAfter, limit, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/firebase.config';
import { useAuth } from '../../contexts/AuthContext';

export default function TeamManagement() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastVisible, setLastVisible] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchTeams = async (loadMore = false) => {
    try {
      if (loadMore) {
        if (!hasMore || loadingMore) return;
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }
      
      const teamsQuery = loadMore 
        ? query(
            collection(db, "teams"),
            where("managerId", "==", user.uid),
            orderBy("name"),
            startAfter(lastVisible),
            limit(10)
          )
        : query(
            collection(db, "teams"),
            where("managerId", "==", user.uid),
            orderBy("name"),
            limit(10)
          );
      
      const teamsSnapshot = await getDocs(teamsQuery);
      
      if (teamsSnapshot.empty) {
        if (loadMore) {
          setHasMore(false);
        } else {
          setTeams([]);
        }
        return;
      }
      
      const teamsData = teamsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (loadMore) {
        setTeams([...teams, ...teamsData]);
      } else {
        setTeams(teamsData);
      }
      
      setLastVisible(teamsSnapshot.docs[teamsSnapshot.docs.length-1]);
      setHasMore(teamsSnapshot.docs.length >= 10);
    } catch (error) {
      console.error("Error fetching teams:", error);
      setError(error);
      Alert.alert(
        "Error Loading Teams",
        error.code === 'permission-denied'
          ? "You don't have permission to view teams"
          : "Failed to load teams. Please try again later."
      );
    } finally {
      if (loadMore) {
        setLoadingMore(false);
      } else {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [user]);

  const handleAddTeam = () => {
    navigation.navigate('RegisterTeam');
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setLastVisible(null);
    setHasMore(true);
    fetchTeams();
  };

  const loadMoreTeams = () => {
    if (!loadingMore && hasMore) {
      fetchTeams(true);
    }
  };

  const deleteTeam = async (teamId) => {
    try {
      await deleteDoc(doc(db, "teams", teamId));
      setTeams(teams.filter(team => team.id !== teamId));
      Alert.alert("Success", "Team deleted successfully");
    } catch (error) {
      console.error("Error deleting team:", error);
      Alert.alert("Error", "Failed to delete team. Please try again.");
    }
  };

  const handleDeleteTeam = (teamId) => {
    Alert.alert(
      "Delete Team",
      "Are you sure you want to delete this team? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => deleteTeam(teamId)
        }
      ]
    );
  };

  if (loading && teams.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading your teams...</Text>
      </View>
    );
  }

  if (error && teams.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load teams</Text>
        <Button 
          mode="contained" 
          onPress={handleRefresh}
          style={styles.retryButton}
        >
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Teams</Text>

      <Button
        mode="contained"
        onPress={handleAddTeam}
        style={styles.addButton}
        icon="plus"
        contentStyle={styles.buttonContent}
        labelStyle={styles.buttonLabel}
      >
        Register New Team
      </Button>

      {teams.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Card.Content>
            <Text style={styles.emptyText}>You haven't created any teams yet</Text>
            <Button 
              mode="outlined" 
              onPress={handleAddTeam}
              style={styles.emptyButton}
            >
              Create Your First Team
            </Button>
          </Card.Content>
        </Card>
      ) : (
        <FlatList
          data={teams}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          }
          onEndReached={loadMoreTeams}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() => (
            loadingMore ? (
              <ActivityIndicator size="small" style={styles.loadMoreIndicator} />
            ) : null
          )}
          renderItem={({ item }) => (
            <Card style={styles.teamCard}>
              <Card.Content>
                <Text style={styles.teamName}>{item.name}</Text>
                <Text style={styles.teamDetails}>
                  {item.players?.length || 0} players • {item.status || 'pending'}
                </Text>
                <View style={styles.buttonGroup}>
                  <Button
                    mode="contained-tonal"
                    onPress={() => navigation.navigate('PlayerManagement', { 
                      teamId: item.id,
                      teamName: item.name
                    })}
                    style={styles.manageButton}
                    icon="account-group"
                    contentStyle={styles.buttonContent}
                    labelStyle={styles.buttonLabel}
                  >
                    Manage Players
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => navigation.navigate('TeamDetails', { 
                      teamId: item.id 
                    })}
                    style={styles.detailsButton}
                    icon="information"
                    contentStyle={styles.buttonContent}
                    labelStyle={styles.buttonLabel}
                  >
                    Details
                  </Button>
                </View>
                <Button
                  mode="text"
                  onPress={() => handleDeleteTeam(item.id)}
                  style={styles.deleteButton}
                  icon="delete"
                  textColor="#d32f2f"
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.buttonLabel}
                >
                  Delete Team
                </Button>
              </Card.Content>
            </Card>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#d32f2f',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  addButton: {
    marginBottom: 20,
    borderRadius: 8,
    backgroundColor: '#6200ee',
  },
  buttonContent: {
    height: 48,
  },
  buttonLabel: {
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  teamCard: {
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
  },
  teamName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  teamDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  manageButton: {
    flex: 1,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#e8def8',
  },
  detailsButton: {
    flex: 1,
    borderRadius: 8,
    borderColor: '#6200ee',
  },
  deleteButton: {
    marginTop: 8,
  },
  emptyCard: {
    marginTop: 20,
    padding: 20,
    alignItems: 'center',
    borderRadius: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    color: '#666',
  },
  emptyButton: {
    borderRadius: 8,
    borderColor: '#6200ee',
  },
  retryButton: {
    borderRadius: 8,
    backgroundColor: '#6200ee',
    width: '60%',
  },
  loadMoreIndicator: {
    marginVertical: 16,
  },
});