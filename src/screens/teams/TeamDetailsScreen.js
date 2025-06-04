"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, Alert } from "react-native"
import { Card, Title, Paragraph, Button, List, Chip } from "react-native-paper"
import { doc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion } from "firebase/firestore"
import { db } from "../../firebase/firebase.config"
import { useAuth } from "../../contexts/AuthContext"
import { colors } from "../../styles/theme"

export default function TeamDetailsScreen({ route, navigation }) {
  const { teamId } = route.params
  const { user, userRole } = useAuth()
  const [team, setTeam] = useState(null)
  const [players, setPlayers] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchTeamDetails = async () => {
    try {
      const teamDoc = await getDoc(doc(db, "teams", teamId))
      if (teamDoc.exists()) {
        const teamData = { id: teamDoc.id, ...teamDoc.data() }
        setTeam(teamData)

        // Fetch team players
        if (teamData.players && teamData.players.length > 0) {
          const playersQuery = query(collection(db, "users"), where("__name__", "in", teamData.players))
          const playersSnapshot = await getDocs(playersQuery)
          const playersData = playersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          setPlayers(playersData)
        }

        // Fetch pending join requests if user is team manager
        if (user.uid === teamData.managerId) {
          const requestsQuery = query(
            collection(db, "teamRequests"),
            where("teamId", "==", teamId),
            where("status", "==", "pending"),
          )
          const requestsSnapshot = await getDocs(requestsQuery)
          const requestsData = requestsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          setPendingRequests(requestsData)
        }
      }
    } catch (error) {
      console.error("Error fetching team details:", error)
      Alert.alert("Error", "Failed to load team details")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeamDetails()
  }, [teamId])

  const handlePlayerRequest = async (requestId, playerId, action) => {
    try {
      if (action === "approve") {
        // Add player to team
        await updateDoc(doc(db, "teams", teamId), {
          players: arrayUnion(playerId),
        })

        // Update user's team affiliation
        await updateDoc(doc(db, "users", playerId), {
          teamId: teamId,
          teamName: team.name,
        })
      }

      // Update request status
      await updateDoc(doc(db, "teamRequests", requestId), {
        status: action === "approve" ? "approved" : "rejected",
        updatedAt: new Date(),
      })

      Alert.alert("Success", `Player request ${action}d successfully`)
      fetchTeamDetails() // Refresh data
    } catch (error) {
      console.error("Error handling player request:", error)
      Alert.alert("Error", "Failed to process request")
    }
  }

  if (loading || !team) {
    return (
      <View style={styles.loadingContainer}>
        <Paragraph>Loading team details...</Paragraph>
      </View>
    )
  }

  const isTeamManager = user.uid === team.managerId

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Button icon="arrow-left" onPress={() => navigation.goBack()}>
          Back
        </Button>
        <Title style={styles.headerTitle}>{team.name}</Title>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.teamHeader}>
            <Title>{team.name}</Title>
            <Chip style={[styles.statusChip, { backgroundColor: getStatusColor(team.status) }]}>{team.status}</Chip>
          </View>
          <Paragraph style={styles.clubName}>{team.club}</Paragraph>
          <Paragraph>Manager: {team.managerName}</Paragraph>
          <Paragraph>Contact: {team.managerEmail}</Paragraph>
          {team.description && <Paragraph style={styles.description}>{team.description}</Paragraph>}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Team Players ({players.length})</Title>
          {players.length > 0 ? (
            players.map((player) => (
              <List.Item
                key={player.id}
                title={`${player.firstName} ${player.lastName}`}
                description={player.email}
                left={(props) => <List.Icon {...props} icon="account" />}
              />
            ))
          ) : (
            <Paragraph>No players in this team yet</Paragraph>
          )}
        </Card.Content>
      </Card>

      {isTeamManager && pendingRequests.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Pending Join Requests ({pendingRequests.length})</Title>
            {pendingRequests.map((request) => (
              <View key={request.id} style={styles.requestItem}>
                <View style={styles.requestInfo}>
                  <Paragraph style={styles.playerName}>{request.playerName}</Paragraph>
                  <Paragraph style={styles.playerEmail}>{request.playerEmail}</Paragraph>
                </View>
                <View style={styles.requestActions}>
                  <Button
                    mode="contained"
                    compact
                    onPress={() => handlePlayerRequest(request.id, request.playerId, "approve")}
                    style={[styles.actionButton, { backgroundColor: colors.success }]}
                  >
                    Approve
                  </Button>
                  <Button
                    mode="contained"
                    compact
                    onPress={() => handlePlayerRequest(request.id, request.playerId, "reject")}
                    style={[styles.actionButton, { backgroundColor: colors.error }]}
                  >
                    Reject
                  </Button>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  )
}

const getStatusColor = (status) => {
  switch (status) {
    case "approved":
      return "#4CAF50"
    case "pending":
      return "#FF9800"
    case "rejected":
      return "#F44336"
    default:
      return "#757575"
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#F5F5F5",
  },
  headerTitle: {
    marginTop: 10,
    color: "#1E88E5",
  },
  card: {
    margin: 20,
    marginTop: 10,
    elevation: 2,
  },
  teamHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  statusChip: {
    marginLeft: 10,
  },
  clubName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1E88E5",
    marginBottom: 10,
  },
  description: {
    fontStyle: "italic",
    marginTop: 10,
  },
  requestItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  requestInfo: {
    flex: 1,
  },
  playerName: {
    fontWeight: "bold",
  },
  playerEmail: {
    color: "#757575",
    fontSize: 12,
  },
  requestActions: {
    flexDirection: "row",
    gap: 5,
  },
  actionButton: {
    minWidth: 70,
  },
})
