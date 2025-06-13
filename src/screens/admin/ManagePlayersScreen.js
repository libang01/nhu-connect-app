// src/screens/ManagePlayersScreen.js

import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, ActivityIndicator, Alert } from "react-native";
import { Text, Card, Title, Paragraph, Portal, Dialog, Button } from "react-native-paper";
import { collection, query, where, getDocs, getDoc, doc } from "firebase/firestore";
import { db } from "../../firebase/firebase.config"; 
import { colors } from "../../styles/theme";

export default function ManagePlayersScreen() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlayersData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch all teams to get team names and manager IDs
        const teamsQuery = query(collection(db, "teams"), where("status", "==", "approved"));
        const teamsSnapshot = await getDocs(teamsQuery);
        const teamsMap = new Map();
        teamsSnapshot.docs.forEach(doc => {
          teamsMap.set(doc.id, { name: doc.data().name, managerId: doc.data().managerId });
        });
        console.log("Teams Map:", teamsMap);

        // 2. Fetch all managers to get their full names
        const managersQuery = query(collection(db, "users"), where("role", "==", "manager"));
        const managersSnapshot = await getDocs(managersQuery);
        const managersMap = new Map();
        managersSnapshot.docs.forEach(doc => {
          managersMap.set(doc.id, doc.data().fullName || `${doc.data().firstName} ${doc.data().lastName}`);
        });
        console.log("Managers Map:", managersMap);

        // 3. Fetch all players (users with role "player")
        const playersQuery = query(collection(db, "users"), where("role", "==", "player"));
        const playersSnapshot = await getDocs(playersQuery);

        const fetchedPlayers = playersSnapshot.docs.map(doc => {
          const playerData = doc.data();
          const teamDetails = teamsMap.get(playerData.teamId); // This teamId is where the player is *officially* assigned
          const managerName = teamDetails ? managersMap.get(teamDetails.managerId) : "N/A";

          return {
            id: doc.id,
            fullName: playerData.fullName || `${playerData.firstName} ${playerData.lastName}`,
            email: playerData.email,
            teamName: teamDetails ? teamDetails.name : "Unassigned", 
            managerName: managerName,
            status: playerData.status, 
          };
        });

        
        const pendingPlayersQuery = query(collection(db, "users"), where("role", "==", "player"), where("status", "==", "pending_team_approval"));
        const pendingPlayersSnapshot = await getDocs(pendingPlayersQuery);
        
        pendingPlayersSnapshot.docs.forEach(doc => {
          const playerData = doc.data();
          
          const isAlreadyIncluded = fetchedPlayers.some(p => p.id === doc.id);

          if (!isAlreadyIncluded) {
            
            const teamRequestsQuery = query(
              collection(db, "teamRequests"),
              where("playerId", "==", doc.id),
              where("status", "==", "pending")
            );
            getDocs(teamRequestsQuery).then(requestSnapshot => {
              let requestedTeamName = "Pending (no team specified)";
              if (!requestSnapshot.empty) {
                const requestData = requestSnapshot.docs[0].data();
                requestedTeamName = `${requestData.teamName} (Pending)`;
              }

              fetchedPlayers.push({
                id: doc.id,
                fullName: playerData.fullName || `${playerData.firstName} ${playerData.lastName}`,
                email: playerData.email,
                teamName: requestedTeamName,
                managerName: "N/A (Pending Approval)",
                status: playerData.status,
              });
              setPlayers([...fetchedPlayers]); 
            }).catch(requestError => {
              console.error("Error fetching team request for pending player:", requestError);
              fetchedPlayers.push({ 
                id: doc.id,
                fullName: playerData.fullName || `${playerData.firstName} ${playerData.lastName}`,
                email: playerData.email,
                teamName: "Error loading pending team",
                managerName: "N/A",
                status: playerData.status,
              });
              setPlayers([...fetchedPlayers]);
            });
          }
        });

        setPlayers(fetchedPlayers);
      } catch (e) {
        console.error("Error fetching players for admin view:", e);
        setError("Failed to load players. Please check your network and permissions.");
        Alert.alert("Error", "Failed to load players: " + e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayersData();
  }, []); 

  const renderPlayerCard = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <Title style={styles.cardTitle}>{item.fullName}</Title>
        <Paragraph>Email: {item.email}</Paragraph>
        <Paragraph>Team: {item.teamName}</Paragraph>
        <Paragraph>Manager: {item.managerName}</Paragraph>
        <Paragraph>Status: {item.status ? item.status.replace(/_/g, ' ') : 'N/A'}</Paragraph>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 10 }}>Loading players...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Title style={styles.headerTitle}>Manage Players</Title>
      {players.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No players found.</Text>
        </View>
      ) : (
        <FlatList
          data={players}
          renderItem={renderPlayerCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 20,
    textAlign: "center",
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    marginBottom: 15,
    borderRadius: 8,
    elevation: 2,
    backgroundColor: colors.surface,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: colors.textSecondary,
  },
});