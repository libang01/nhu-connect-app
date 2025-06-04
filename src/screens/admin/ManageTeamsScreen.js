// src/screens/admin/ManageTeamsScreen.js

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Title, Paragraph, DataTable, Searchbar } from 'react-native-paper';
import { collection, query, getDocs, doc, updateDoc, orderBy, startAt, endAt } from 'firebase/firestore';
import { db } from '../../firebase/firebase.config'; // CORRECTED PATH
import { colors } from '../../styles/theme';

export default function ManageTeamsScreen({ navigation }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTeams = async () => {
    setLoading(true);
    try {
      let q = collection(db, "teams");

      // Implement basic search
      if (searchQuery) {
        // This is a basic prefix search. For more advanced search, consider
        // client-side filtering or a dedicated search service.
        q = query(q, 
          orderBy("name"), 
          startAt(searchQuery), 
          endAt(searchQuery + '\uf8ff') // '\uf8ff' is a high Unicode character, ensures prefix match
        );
      } else {
        // If no search query, just order by name
        q = query(q, orderBy("name"));
      }
      
      const querySnapshot = await getDocs(q);
      const teamsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTeams(teamsData);
    } catch (error) {
      console.error("Error fetching teams:", error);
      Alert.alert("Error", "Failed to load teams.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [searchQuery]); // Re-fetch when search query changes

  const onRefresh = () => {
    setRefreshing(true);
    fetchTeams();
  };

  const handleStatusToggle = async (teamId, currentStatus) => {
    const newStatus = currentStatus === 'approved' ? 'pending' : 'approved'; // Or 'rejected' for a third option
    Alert.alert(
      "Confirm Action",
      `Are you sure you want to change this team's status to '${newStatus}'?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            try {
              await updateDoc(doc(db, "teams", teamId), {
                status: newStatus,
                updatedAt: new Date(),
              });
              Alert.alert("Success", `Team status updated to '${newStatus}'.`);
              fetchTeams(); // Refresh the list
            } catch (error) {
              console.error("Error updating team status:", error);
              Alert.alert("Error", "Failed to update team status.");
            }
          },
        },
      ]
    );
  };

  const TeamRow = ({ team }) => (
    <DataTable.Row>
      <DataTable.Cell>{team.name}</DataTable.Cell>
      <DataTable.Cell>{team.managerName || 'N/A'}</DataTable.Cell>
      <DataTable.Cell>{team.status}</DataTable.Cell>
      <DataTable.Cell numeric>
        <Button
          mode="contained"
          compact
          onPress={() => handleStatusToggle(team.id, team.status)}
          style={{
            backgroundColor: team.status === 'approved' ? colors.warning : colors.success,
            marginHorizontal: 5
          }}
          labelStyle={{ fontSize: 12 }}
        >
          {team.status === 'approved' ? 'Set Pending' : 'Approve'}
        </Button>
        {/* You could add a 'Reject' button or 'View Details' here */}
        <Button
          mode="outlined"
          compact
          onPress={() => navigation.navigate("TeamDetails", { teamId: team.id })}
          style={{ marginHorizontal: 5 }}
          labelStyle={{ fontSize: 12 }}
        >
          Details
        </Button>
      </DataTable.Cell>
    </DataTable.Row>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Title style={styles.headerTitle}>Manage Teams</Title>

        <Searchbar
          placeholder="Search teams by name"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />

        <Card style={styles.card}>
          <Card.Content>
            {loading ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 20 }} />
            ) : teams.length === 0 ? (
              <Paragraph style={{ textAlign: 'center', paddingVertical: 20 }}>
                {searchQuery ? "No teams found matching your search." : "No teams registered yet."}
              </Paragraph>
            ) : (
              <DataTable>
                <DataTable.Header>
                  <DataTable.Title>Team Name</DataTable.Title>
                  <DataTable.Title>Manager</DataTable.Title>
                  <DataTable.Title>Status</DataTable.Title>
                  <DataTable.Title numeric>Actions</DataTable.Title>
                </DataTable.Header>

                {teams.map((team) => (
                  <TeamRow key={team.id} team={team} />
                ))}

                <DataTable.Pagination
                  page={0} // Example: For a real pagination, this would be dynamic
                  numberOfPages={1} // Example: totalPages
                  onPageChange={(page) => console.log(page)}
                  label={`${teams.length} of ${teams.length}`} // Example: itemsPerPage * currentPage + 1- totalItems
                  optionsPerPage={[10, 20, 30]}
                  itemsPerPage={10}
                  setItemsPerPage={(itemsPerPage) => console.log(itemsPerPage)}
                  showFastPaginationControls
                  selectPageDropdownLabel="Rows per page"
                />
              </DataTable>
            )}
          </Card.Content>
        </Card>

        <Button
          mode="outlined"
          icon="plus-circle"
          onPress={() => navigation.navigate("RegisterTeam")} // Or a dedicated AdminCreateTeamScreen
          style={styles.addTeamButton}
          labelStyle={styles.addTeamButtonText}
        >
          Add New Team
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollViewContent: {
    padding: 20,
    paddingBottom: 50, // Give some space at the bottom
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 25,
    marginTop: 10,
    textAlign: 'center',
  },
  searchBar: {
    marginBottom: 20,
    borderRadius: 8,
    elevation: 2, // Android shadow
  },
  card: {
    width: '100%',
    borderRadius: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 20,
  },
  addTeamButton: {
    marginTop: 20,
    borderColor: colors.primary,
    borderWidth: 1,
    paddingVertical: 8,
  },
  addTeamButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});