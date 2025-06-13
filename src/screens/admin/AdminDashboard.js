// src/screens/admin/AdminDashboard.js

import { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator } from "react-native";
import { Card, Title, Paragraph, Button, DataTable } from "react-native-paper";
import { collection, query, getDocs, where, doc, updateDoc } from "firebase/firestore";
import { db, auth } from "../../firebase/firebase.config";
import { signOut } from "firebase/auth";
import { colors } from "../../styles/theme";

export default function AdminDashboard({ navigation }) {
  const [stats, setStats] = useState({
    totalTeams: 0,
    pendingTeams: 0,
    totalPlayers: 0,
    totalEvents: 0,
  });
  const [pendingTeams, setPendingTeams] = useState([]);
  const [loading, setLoading] = useState(true); 

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const teamsSnapshot = await getDocs(collection(db, "teams"));
      const pendingTeamsSnapshot = await getDocs(query(collection(db, "teams"), where("status", "==", "pending")));

      const playersQuery = query(collection(db, "users"), where("role", "==", "player"));
      const playersSnapshot = await getDocs(playersQuery);

      const eventsSnapshot = await getDocs(collection(db, "events"));

      setStats({
        totalTeams: teamsSnapshot.size,
        pendingTeams: pendingTeamsSnapshot.size,
        totalPlayers: playersSnapshot.size,
        totalEvents: eventsSnapshot.size,
      });

      const pendingTeamsData = pendingTeamsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPendingTeams(pendingTeamsData);
    } catch (error) {
      console.error("Error fetching admin data:", error);
      Alert.alert("Error", "Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleTeamApproval = async (teamId, status) => {
    try {
      await updateDoc(doc(db, "teams", teamId), {
        status: status,
        updatedAt: new Date(),
      });

      Alert.alert("Success", `Team ${status === "approved" ? "approved" : "rejected"} successfully.`);
      fetchAdminData();
    } catch (error) {
      console.error("Error updating team status:", error);
      Alert.alert("Error", "Failed to update team status.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
      Alert.alert("Logout Error", "Failed to log out. Please try again.");
    }
  };

  const StatCard = ({ title, value, color }) => (
    <Card style={[styles.statCard, { borderLeftColor: color }]}>
      <Card.Content>
        <Title style={styles.statValue}>{value}</Title>
        <Paragraph style={styles.statTitle}>{title}</Paragraph>
      </Card.Content>
    </Card>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.headerTitle}>Admin Dashboard</Title>
        <Button
          icon="logout"
          mode="text"
          onPress={handleLogout}
          labelStyle={styles.logoutButtonText}
          contentStyle={styles.logoutButtonContent}
        >
          Logout
        </Button>
      </View>

      {loading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Paragraph>Loading dashboard data...</Paragraph>
        </View>
      ) : (
        <>
          <View style={styles.statsContainer}>
            <StatCard title="Total Teams" value={stats.totalTeams} color={colors.primary} />
            <StatCard title="Pending Teams" value={stats.pendingTeams} color={colors.warning} />
            <StatCard title="Total Players" value={stats.totalPlayers} color={colors.secondary} />
            <StatCard title="Total Events" value={stats.totalEvents} color={colors.success} />
          </View>

          <Card style={styles.actionCard}>
            <Card.Content>
              <Title style={styles.sectionTitle}>Quick Actions</Title>
              <View style={styles.actionButtons}>
                <Button
                  mode="contained"
                  icon="plus"
                  onPress={() => navigation.navigate("CreateEvent")}
                  style={styles.actionButton}
                >
                  Create Event
                </Button>
                <Button
                  mode="contained"
                  icon="newspaper"
                  onPress={() => navigation.navigate("CreateNews")}
                  style={styles.actionButton}
                >
                  Post News
                </Button>
              </View>
            </Card.Content>
          </Card>

          {pendingTeams.length > 0 && (
            <Card style={styles.pendingCard}>
              <Card.Content>
                <Title style={styles.sectionTitle}>Pending Team Approvals</Title>
                <DataTable>
                  <DataTable.Header>
                    <DataTable.Title>Team Name</DataTable.Title>
                    <DataTable.Title>Manager</DataTable.Title>
                    <DataTable.Title>Actions</DataTable.Title>
                  </DataTable.Header>

                  {pendingTeams.map((team) => (
                    <DataTable.Row key={team.id}>
                      <DataTable.Cell>{team.name}</DataTable.Cell>
                      <DataTable.Cell>{team.managerName || team.managerId || 'N/A'}</DataTable.Cell>
                      <DataTable.Cell>
                        <View style={styles.approvalButtons}>
                          <Button
                            mode="contained"
                            compact
                            onPress={() => handleTeamApproval(team.id, "approved")}
                            style={[styles.approvalButton, { backgroundColor: colors.success }]}
                          >
                            Approve
                          </Button>
                          <Button
                            mode="contained"
                            compact
                            onPress={() => handleTeamApproval(team.id, "rejected")}
                            style={[styles.approvalButton, { backgroundColor: colors.error }]}
                          >
                            Reject
                          </Button>
                        </View>
                      </DataTable.Cell>
                    </DataTable.Row>
                  ))}
                </DataTable>
              </Card.Content>
            </Card>
          )}

          <Card style={styles.managementCard}>
            <Card.Content>
              <Title style={styles.sectionTitle}>Management</Title>
              <View style={styles.managementButtons}>
                <Button
                  mode="outlined"
                  icon="account-group"
                  onPress={() => navigation.navigate("ManageTeams")}
                  style={styles.managementButton}
                >
                  Manage Teams
                </Button>
                <Button
                  mode="outlined"
                  icon="account"
                  onPress={() => navigation.navigate("ManagePlayers")}
                  style={styles.managementButton}
                >
                  Manage Players
                </Button>
                <Button
                  mode="outlined"
                  icon="calendar"
                  onPress={() => navigation.navigate("ManageEvents")}
                  style={styles.managementButton}
                >
                  Manage Events
                </Button>
                <Button
                  mode="outlined"
                  icon="newspaper"
                  onPress={() => navigation.navigate("ManageNews")}
                  style={styles.managementButton}
                >
                  Manage News
                </Button>
              </View>
            </Card.Content>
          </Card>
        </>
      )}
    </ScrollView>
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
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: "white",
    fontSize: 24,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 14,
  },
  logoutButtonContent: {
    // Adjust as needed
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 20,
    paddingBottom: 10,
  },
  statCard: {
    width: "48%",
    margin: "1%",
    borderLeftWidth: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 0,
  },
  statTitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  actionCard: {
    margin: 20,
    marginTop: 10,
  },
  sectionTitle: {
    marginBottom: 15,
    color: colors.primary,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  pendingCard: {
    margin: 20,
    marginTop: 10,
  },
  approvalButtons: {
    flexDirection: "row",
  },
  approvalButton: {
    minWidth: 60,
    marginHorizontal: 2.5,
  },
  managementCard: {
    margin: 20,
    marginTop: 10,
  },
  managementButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  managementButton: {
    width: "48%",
    marginBottom: 10,
  },
  loadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },
});