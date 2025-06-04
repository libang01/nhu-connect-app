import { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert, RefreshControl } from 'react-native';
import { Card, Title, Paragraph, Button, List, Searchbar, ActivityIndicator } from 'react-native-paper';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, arrayRemove, addDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase.config';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../styles/theme';

export default function PlayerManagement({ route, navigation }) {
  // Safely extract route params with defaults
  const { teamId = null, teamName = 'Team' } = route.params || {};
  const { user, userRole } = useAuth();
  
  // State management
  const [teamPlayers, setTeamPlayers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!teamId) {
        throw new Error('Team ID is required');
      }

      // Fetch team document
      const teamRef = doc(db, "teams", teamId);
      const teamSnap = await getDoc(teamRef);
      
      if (!teamSnap.exists()) {
        throw new Error('Team not found');
      }

      const teamData = teamSnap.data();
      
      // Fetch team players
      if (teamData.players?.length > 0) {
        const playersQuery = query(collection(db, "users"), where("__name__", "in", teamData.players));
        const playersSnapshot = await getDocs(playersQuery);
        const playersData = playersSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          fullName: `${doc.data().firstName} ${doc.data().lastName}`
        }));
        setTeamPlayers(playersData);
      } else {
        setTeamPlayers([]);
      }

      // Fetch pending requests
      const requestsQuery = query(
        collection(db, "teamRequests"),
        where("teamId", "==", teamId),
        where("status", "==", "pending")
      );
      const requestsSnapshot = await getDocs(requestsQuery);
      const requestsData = requestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPendingRequests(requestsData);

      // Fetch all players for invitation
      const allPlayersQuery = query(
        collection(db, "users"), 
        where("role", "==", "player")
      );
      const allPlayersSnapshot = await getDocs(allPlayersQuery);
      const allPlayersData = allPlayersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fullName: `${doc.data().firstName} ${doc.data().lastName}`
      }));
      
      setAllPlayers(allPlayersData);
      setFilteredPlayers(
        allPlayersData.filter(player => !teamData.players?.includes(player.id))
      );

    } catch (error) {
      console.error("Error fetching team data:", error);
      setError(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (teamId) {
      fetchTeamData();
    }
  }, [teamId]);

  useEffect(() => {
    const filtered = allPlayers.filter(player => {
      const matchesSearch = searchQuery 
        ? player.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          player.email.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      
      const notInTeam = !teamPlayers.some(tp => tp.id === player.id);
      
      return matchesSearch && notInTeam;
    });
    
    setFilteredPlayers(filtered.slice(0, 10)); // Limit to 10 results
  }, [searchQuery, allPlayers, teamPlayers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTeamData();
  };

  const handlePlayerRequest = async (requestId, playerId, action) => {
    try {
      const requestRef = doc(db, "teamRequests", requestId);
      const playerRef = doc(db, "users", playerId);
      const teamRef = doc(db, "teams", teamId);

      if (action === "approve") {
        // Batch these operations for atomic updates
        await Promise.all([
          updateDoc(teamRef, { players: arrayUnion(playerId) }),
          updateDoc(playerRef, { 
            teamId: teamId,
            teamName: teamName,
            status: 'active'
          }),
          updateDoc(requestRef, { 
            status: "approved",
            updatedAt: new Date() 
          })
        ]);

        // Optimistically update UI
        const playerDoc = await getDoc(playerRef);
        if (playerDoc.exists()) {
          setTeamPlayers(prev => [...prev, { 
            id: playerId, 
            ...playerDoc.data(),
            fullName: `${playerDoc.data().firstName} ${playerDoc.data().lastName}`
          }]);
        }
      } else {
        await updateDoc(requestRef, { 
          status: "rejected",
          updatedAt: new Date() 
        });
      }

      setPendingRequests(prev => prev.filter(req => req.id !== requestId));
      Alert.alert("Success", `Request ${action}d successfully`);
    } catch (error) {
      console.error("Error handling request:", error);
      Alert.alert("Error", `Failed to ${action} request`);
    }
  };

  const handleRemovePlayer = async (playerId, playerName) => {
    Alert.alert(
      "Confirm Removal",
      `Remove ${playerName} from ${teamName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await Promise.all([
                updateDoc(doc(db, "teams", teamId), {
                  players: arrayRemove(playerId)
                }),
                updateDoc(doc(db, "users", playerId), {
                  teamId: null,
                  teamName: null,
                  status: 'inactive'
                })
              ]);

              setTeamPlayers(prev => prev.filter(p => p.id !== playerId));
              Alert.alert("Success", `${playerName} removed from team`);
            } catch (error) {
              console.error("Error removing player:", error);
              Alert.alert("Error", "Failed to remove player");
            }
          }
        }
      ]
    );
  };

  const handleInvitePlayer = async (player) => {
    try {
      await addDoc(collection(db, "teamRequests"), {
        teamId,
        teamName,
        playerId: player.id,
        playerName: player.fullName,
        playerEmail: player.email,
        managerId: user.uid,
        managerName: user.displayName || user.email,
        status: "pending",
        type: "invitation",
        createdAt: new Date(),
        updatedAt: new Date()
      });

      Alert.alert("Invitation Sent", `${player.fullName} has been invited to join ${teamName}`);
      fetchTeamData();
    } catch (error) {
      console.error("Error sending invitation:", error);
      Alert.alert("Error", "Failed to send invitation");
    }
  };

  const renderPendingRequests = () => {
    if (pendingRequests.length === 0) return null;
    
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title>Pending Requests ({pendingRequests.length})</Title>
          {pendingRequests.map(request => (
            <List.Item
              key={request.id}
              title={request.playerName}
              description={request.playerEmail}
              left={props => <List.Icon {...props} icon="account-clock" />}
              right={() => (
                <View style={styles.requestActions}>
                  <Button
                    mode="contained"
                    compact
                    onPress={() => handlePlayerRequest(request.id, request.playerId, "approve")}
                    style={styles.approveButton}
                  >
                    Approve
                  </Button>
                  <Button
                    mode="outlined"
                    compact
                    onPress={() => handlePlayerRequest(request.id, request.playerId, "reject")}
                    style={styles.rejectButton}
                    textColor={colors.error}
                  >
                    Reject
                  </Button>
                </View>
              )}
            />
          ))}
        </Card.Content>
      </Card>
    );
  };

  const renderCurrentPlayers = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Title>Team Players ({teamPlayers.length})</Title>
        {teamPlayers.length > 0 ? (
          <FlatList
            data={teamPlayers}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <List.Item
                title={item.fullName}
                description={item.email}
                left={props => <List.Icon {...props} icon="account" />}
                right={props => (
                  <Button
                    mode="outlined"
                    onPress={() => handleRemovePlayer(item.id, item.fullName)}
                    style={styles.removeButton}
                    textColor={colors.error}
                  >
                    Remove
                  </Button>
                )}
              />
            )}
          />
        ) : (
          <Paragraph style={styles.emptyText}>No players on this team</Paragraph>
        )}
      </Card.Content>
    </Card>
  );

  const renderAvailablePlayers = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Title>Invite Players</Title>
        <Searchbar
          placeholder="Search by name or email"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        {filteredPlayers.length > 0 ? (
          <FlatList
            data={filteredPlayers}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <List.Item
                title={item.fullName}
                description={item.email}
                left={props => <List.Icon {...props} icon="account-plus" />}
                right={() => (
                  <Button
                    mode="contained"
                    onPress={() => handleInvitePlayer(item)}
                    style={styles.inviteButton}
                    labelStyle={styles.inviteButtonLabel}
                  >
                    Invite
                  </Button>
                )}
              />
            )}
          />
        ) : (
          <Paragraph style={styles.emptyText}>
            {searchQuery ? "No matching players found" : "No available players to invite"}
          </Paragraph>
        )}
      </Card.Content>
    </Card>
  );

  // Early returns for error states
  if (!teamId) {
    return (
      <View style={styles.container}>
        <Card style={styles.errorCard}>
          <Card.Content>
            <Title>Error</Title>
            <Paragraph>Team information is missing</Paragraph>
            <Button 
              mode="contained" 
              onPress={() => navigation.goBack()}
              style={styles.button}
            >
              Go Back
            </Button>
          </Card.Content>
        </Card>
      </View>
    );
  }

  if (userRole !== "manager") {
    return (
      <View style={styles.container}>
        <Card style={styles.errorCard}>
          <Card.Content>
            <Title>Access Denied</Title>
            <Paragraph>Only team managers can access this screen</Paragraph>
            <Button 
              mode="contained" 
              onPress={() => navigation.goBack()}
              style={styles.button}
            >
              Go Back
            </Button>
          </Card.Content>
        </Card>
      </View>
    );
  }

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Paragraph style={styles.loadingText}>Loading team data...</Paragraph>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Card style={styles.errorCard}>
          <Card.Content>
            <Title>Error</Title>
            <Paragraph>{error.message}</Paragraph>
            <Button 
              mode="contained" 
              onPress={fetchTeamData}
              style={styles.button}
            >
              Retry
            </Button>
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button 
          icon="arrow-left" 
          onPress={() => navigation.goBack()} 
          textColor={colors.primary}
        >
          Back
        </Button>
        <Title style={styles.headerTitle}>{teamName} - Player Management</Title>
      </View>

      <FlatList
        data={[1]} // Dummy item for single render
        renderItem={() => (
          <>
            {renderPendingRequests()}
            {renderCurrentPlayers()}
            {renderAvailablePlayers()}
          </>
        )}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={styles.scrollContent}
        keyExtractor={() => 'playerManagementContent'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    color: colors.textSecondary,
  },
  header: {
    padding: 16,
    paddingTop: 50,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  headerTitle: {
    marginLeft: 16,
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  card: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  errorCard: {
    margin: 16,
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginVertical: 16,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  approveButton: {
    backgroundColor: colors.success,
    minWidth: 80,
  },
  rejectButton: {
    borderColor: colors.error,
    minWidth: 80,
  },
  removeButton: {
    borderColor: colors.error,
    minWidth: 100,
  },
  inviteButton: {
    backgroundColor: colors.primaryContainer,
    minWidth: 100,
  },
  inviteButtonLabel: {
    color: colors.onPrimaryContainer,
  },
  searchbar: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
  },
});