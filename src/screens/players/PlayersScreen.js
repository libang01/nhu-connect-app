// src/screens/PlayersScreen.js

import { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, Alert, Text } from "react-native";
import { Card, Title, Paragraph, Button, Searchbar, Chip } from "react-native-paper";
import { collection, query, getDocs, orderBy, where, doc, addDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase.config";
import { auth } from "../../firebase/firebase.config";
import { signOut } from 'firebase/auth';
import { useAuth } from "../../contexts/AuthContext";
import { colors } from "../../styles/theme";

// --- NEW TeamItem Component ---
const TeamItem = ({ team, user, playerTeamId, onJoinSuccess }) => {
  const [hasPendingRequest, setHasPendingRequest] = useState(false);

  // Effect to check for pending join requests
  useEffect(() => {
    const checkPendingRequest = async () => {
      if (user && team.id) {
        try {
          const q = query(
            collection(db, "teamRequests"),
            where("playerId", "==", user.uid),
            where("teamId", "==", team.id),
            where("status", "==", "pending")
          );
          const querySnapshot = await getDocs(q);
          setHasPendingRequest(!querySnapshot.empty);
        } catch (error) {
          console.error("Error checking pending request:", error);
          // Handle error, e.g., show a small message or log
        }
      }
    };
    checkPendingRequest();
  }, [user, team.id]); // Dependencies: user and the specific team's ID

  const handleJoinTeam = async () => {
    Alert.alert(
      "Join Team",
      `Are you sure you want to request to join ${team.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Join",
          onPress: async () => {
            try {
              await addDoc(collection(db, "teamRequests"), {
                teamId: team.id,
                teamName: team.name,
                playerId: user.uid,
                playerName: user.displayName || user.email,
                playerEmail: user.email,
                managerId: team.managerId || null, // Ensure managerId exists, might be null if not set on team
                status: "pending",
                type: "join",
                createdAt: new Date(),
              });
              Alert.alert("Request Sent", `Your request to join ${team.name} has been sent for approval.`);
              setHasPendingRequest(true); // Update UI immediately
              // Optionally, you might want to refresh the main list or update status
              if (onJoinSuccess) {
                onJoinSuccess(); // Callback to trigger a re-fetch in parent component
              }
            } catch (error) {
              console.error("Error sending join request:", error);
              Alert.alert("Error", "Failed to send join request.");
            }
          },
        },
      ]
    );
  };

  const isTeamFull = team.maxPlayers && team.players && team.players.length >= team.maxPlayers;

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Title>{team.name}</Title>
        <Paragraph>{team.description}</Paragraph>
        <Paragraph>Players: {team.players?.length || 0} / {team.maxPlayers || 'N/A'}</Paragraph>
        {team.managerName && <Paragraph>Manager: {team.managerName}</Paragraph>}
      </Card.Content>
      <Card.Actions>
        {playerTeamId ? (
          <Chip style={{ backgroundColor: colors.info }} textStyle={{ color: "white" }}>
            Already on a team
          </Chip>
        ) : hasPendingRequest ? (
          <Chip style={{ backgroundColor: colors.warning }} textStyle={{ color: "white" }}>
            Request Pending
          </Chip>
        ) : isTeamFull ? (
          <Chip style={{ backgroundColor: colors.error }} textStyle={{ color: "white" }}>
            Team Full
          </Chip>
        ) : (
          <Button
            mode="contained"
            onPress={handleJoinTeam}
            buttonColor={colors.success}
          >
            Join Team
          </Button>
        )}
      </Card.Actions>
    </Card>
  );
};
// --- END NEW TeamItem Component ---


export default function PlayersScreen({ navigation }) {
  const { user, userRole } = useAuth();
  const [data, setData] = useState([]); // Will hold either players or teams
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [playerTeamId, setPlayerTeamId] = useState(null); // To store current player's teamId
  const [currentPlayerData, setCurrentPlayerData] = useState(null); // State for logged-in player's full data

  const fetchContent = async () => {
    setLoading(true);
    try {
      if (!user) {
        setLoading(false);
        return;
      }

      // 1. Always fetch current player's detailed profile first if it's a player,
      // as `user.uid` is needed for filtering teams.
      let fetchedUserData = null;
      if (userRole === "player") {
        const currentUserSnap = await getDocs(query(collection(db, "users"), where("__name__", "==", user.uid)));
        fetchedUserData = currentUserSnap.docs[0]?.data();
        setCurrentPlayerData(fetchedUserData);
        setPlayerTeamId(fetchedUserData?.teamId || null);
      }


      if (userRole === "player") {
        // --- For Player Role: Fetch available teams ---
        if (fetchedUserData && fetchedUserData.teamId) {
          // If player is already on a team, no "available" teams to show for joining
          setData([]);
          setFilteredData([]);
        } else {
          // Fetch approved teams that the player is NOT already part of
          const teamsQuery = query(
            collection(db, "teams"),
            where("status", "==", "approved"),
            orderBy("name", "asc")
          );
          const teamsSnapshot = await getDocs(teamsQuery);
          const teamsData = teamsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

          // Filter out teams the player might already be part of (though the initial fetch from Firestore should exclude this)
          const availableTeams = teamsData.filter(team => !team.players || !team.players.includes(user.uid));

          setData(availableTeams);
          setFilteredData(availableTeams);
        }
      } else {
        // --- For Admin/Manager Role: Fetch all players ---
        const playersQuery = query(collection(db, "users"), orderBy("firstName", "asc"));
        const playersSnapshot = await getDocs(playersQuery);
        const playersData = playersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setData(playersData);
        setFilteredData(playersData);
      }
    } catch (error) {
      console.error("Error fetching data for PlayersScreen:", error);
      Alert.alert("Error", "Failed to load content.");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and re-fetch on user/role change
  useEffect(() => {
    fetchContent();
  }, [user, userRole]); // Re-fetch data when user or userRole changes

  // Search filter effect
  useEffect(() => {
    if (searchQuery) {
      const filtered = data.filter((item) => {
        if (userRole === "player") {
          // Searching teams by name or description
          return item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                   item.description.toLowerCase().includes(searchQuery.toLowerCase());
        } else {
          // Searching players by name or email
          return (
            `${item.firstName} ${item.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.email.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
      });
      setFilteredData(filtered);
    } else {
      setFilteredData(data);
    }
  }, [data, searchQuery, userRole]);


  // --- Logout Handler ---
  const handleLogout = async () => {
    try {
      await signOut(auth);
      // AppNavigation.js will handle redirect automatically on auth state change
    } catch (error) {
      console.error("Logout failed:", error);
      Alert.alert("Logout Error", "Failed to log out. Please try again.");
    }
  };

  // --- Render function for Players (Admin/Manager Role) ---
  const renderPlayer = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.playerHeader}>
          <Title style={styles.playerName}>
            {item.firstName} {item.lastName}
          </Title>
          <Chip style={[styles.roleChip, { backgroundColor: colors.primary }]} textStyle={{ color: "white" }}>
            {item.role}
          </Chip>
        </View>
        <Paragraph style={styles.playerEmail}>{item.email}</Paragraph>
        {item.teamName && <Paragraph style={styles.teamInfo}>Team: {item.teamName}</Paragraph>}
        {item.position && <Paragraph style={styles.positionInfo}>Position: {item.position}</Paragraph>}
      </Card.Content>
      <Card.Actions>
        <Button onPress={() => navigation.navigate("PlayerDetails", { playerId: item.id })}>View Profile</Button>
      </Card.Actions>
    </Card>
  );

  // --- Component for Empty List State ---
  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      {loading ? (
        <Paragraph>Loading...</Paragraph>
      ) : (
        <Paragraph>
          {userRole === "player" && playerTeamId
            ? "" // Handled by Player Profile Card now, but FlatList still needs to be "empty"
            : userRole === "player"
            ? "No available teams to join at the moment."
            : "No players found."}
        </Paragraph>
      )}
    </View>
  );


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.headerTitle}>
          {userRole === "player" && playerTeamId
            ? "My Profile" // Changed title when player is on a team
            : userRole === "player"
            ? "Available Teams"
            : "Players"}
        </Title>
        <Searchbar
          placeholder={userRole === "player" ? "Search teams..." : "Search players..."}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>

      {/* Player's Own Profile Card (Visible only for player role and when on a team) */}
      {userRole === "player" && currentPlayerData && playerTeamId && (
        <Card style={styles.playerProfileCard}>
          <Card.Content>
            <Title style={styles.playerProfileTitle}>My Profile</Title>
            <Paragraph style={styles.playerProfileText}>
              Name: {currentPlayerData.firstName} {currentPlayerData.lastName}
            </Paragraph>
            <Paragraph style={styles.playerProfileText}>
              Email: {currentPlayerData.email}
            </Paragraph>
            <Paragraph style={styles.playerProfileText}>
              Role: {currentPlayerData.role}
            </Paragraph>
            {currentPlayerData.teamName && (
              <Paragraph style={styles.playerProfileText}>
                Team: {currentPlayerData.teamName}
              </Paragraph>
            )}
            {currentPlayerData.position && (
              <Paragraph style={styles.playerProfileText}>
                Position: {currentPlayerData.position}
              </Paragraph>
            )}
            <Button
              mode="outlined"
              onPress={() => navigation.navigate("EditProfile")} // Assuming you have an 'EditProfile' screen
              style={styles.editProfileButton}
              textColor={colors.primary}
            >
              Edit Profile
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* Conditionally render FlatList only if player is not on a team OR if it's not a player role */}
      {!(userRole === "player" && playerTeamId) && (
        <FlatList
          data={filteredData}
          renderItem={({ item }) =>
            userRole === "player" ? (
              <TeamItem
                team={item}
                user={user}
                playerTeamId={playerTeamId}
                onJoinSuccess={fetchContent} // Pass a callback to re-fetch on successful join
              />
            ) : (
              renderPlayer({ item })
            )
          }
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={fetchContent}
          ListEmptyComponent={ListEmptyComponent}
        />
      )}


      {/* Buttons for Player Role (View Events, View News, Logout) */}
      {userRole === "player" && (
        <View style={styles.playerActionButtons}>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Events')}
            style={styles.playerActionButton}
            buttonColor={colors.secondary}
          >
            View Events
          </Button>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('News')}
            style={styles.playerActionButton}
            buttonColor={colors.secondary}
          >
            View News
          </Button>
          <Button
            mode="outlined"
            onPress={handleLogout}
            style={[styles.playerActionButton, styles.logoutButton]}
            textColor={colors.error}
            rippleColor={colors.errorLight}
          >
            Logout
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    marginBottom: 15,
    color: colors.primary,
  },
  searchbar: {
    marginBottom: 15,
  },
  listContainer: {
    padding: 20,
  },
  card: { // Unified style for player and team cards
    marginBottom: 15,
    elevation: 2,
    borderRadius: 8,
  },
  playerHeader: { // Specific to player cards
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  playerName: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
  },
  roleChip: {
    marginLeft: 10,
  },
  playerEmail: {
    color: colors.textSecondary,
    marginBottom: 5,
  },
  teamInfo: {
    color: colors.primary,
    fontWeight: "bold",
    marginBottom: 2,
  },
  positionInfo: {
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
  },
  // Styles for player's own profile card
  playerProfileCard: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 15,
    elevation: 3,
    borderRadius: 10,
    backgroundColor: colors.cardBackground,
  },
  playerProfileTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: colors.textPrimary,
  },
  playerProfileText: {
    fontSize: 16,
    marginBottom: 5,
    color: colors.textSecondary,
  },
  editProfileButton: {
    marginTop: 15,
    borderColor: colors.primary,
  },
  // Styles for player action buttons (View Events, View News, Logout)
  playerActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
    paddingTop: 10,
  },
  playerActionButton: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 5,
    borderRadius: 8,
  },
  logoutButton: {
    borderColor: colors.error,
  }
});