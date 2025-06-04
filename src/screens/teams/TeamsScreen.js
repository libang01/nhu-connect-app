"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, FlatList, Alert } from "react-native"
import { Card, Title, Paragraph, Button, FAB, Searchbar, Chip } from "react-native-paper"
import { collection, query, getDocs, orderBy } from "firebase/firestore"
import { db } from "../../firebase/firebase.config"
import { useAuth } from "../../contexts/AuthContext"
import { colors } from "../../styles/theme"

export default function TeamsScreen({ navigation }) {
  const { userRole } = useAuth()
  const [teams, setTeams] = useState([])
  const [filteredTeams, setFilteredTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const fetchTeams = async () => {
    try {
      const teamsSnapshot = await getDocs(query(collection(db, "teams"), orderBy("createdAt", "desc")))

      const teamsData = teamsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      setTeams(teamsData)
      setFilteredTeams(teamsData)
    } catch (error) {
      console.error("Error fetching teams:", error)
      Alert.alert("Error", "Failed to load teams")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeams()
  }, [])

  useEffect(() => {
    let filtered = teams

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (team) =>
          team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          team.club.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((team) => team.status === statusFilter)
    }

    setFilteredTeams(filtered)
  }, [teams, searchQuery, statusFilter])

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return colors.success
      case "pending":
        return colors.warning
      case "rejected":
        return colors.error
      default:
        return colors.textSecondary
    }
  }

  const renderTeam = ({ item }) => (
    <Card style={styles.teamCard}>
      <Card.Content>
        <View style={styles.teamHeader}>
          <Title style={styles.teamName}>{item.name}</Title>
          <Chip
            style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
            textStyle={{ color: "white" }}
          >
            {item.status}
          </Chip>
        </View>
        <Paragraph style={styles.clubName}>{item.club}</Paragraph>
        <Paragraph style={styles.managerInfo}>Manager: {item.managerName}</Paragraph>
        <Paragraph style={styles.contactInfo}>Contact: {item.managerEmail}</Paragraph>
        {item.description && <Paragraph style={styles.description}>{item.description}</Paragraph>}
      </Card.Content>
      <Card.Actions>
        <Button onPress={() => navigation.navigate("TeamDetails", { teamId: item.id })}>View Details</Button>
      </Card.Actions>
    </Card>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.headerTitle}>Teams</Title>
        <Searchbar
          placeholder="Search teams..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        <View style={styles.filterContainer}>
          <Chip selected={statusFilter === "all"} onPress={() => setStatusFilter("all")} style={styles.filterChip}>
            All
          </Chip>
          <Chip
            selected={statusFilter === "approved"}
            onPress={() => setStatusFilter("approved")}
            style={styles.filterChip}
          >
            Approved
          </Chip>
          <Chip
            selected={statusFilter === "pending"}
            onPress={() => setStatusFilter("pending")}
            style={styles.filterChip}
          >
            Pending
          </Chip>
        </View>
      </View>

      <FlatList
        data={filteredTeams}
        renderItem={renderTeam}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshing={loading}
        onRefresh={fetchTeams}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Paragraph>No teams found</Paragraph>
          </View>
        }
      />

      {(userRole === "manager" || userRole === "admin") && (
        <FAB style={styles.fab} icon="plus" onPress={() => navigation.navigate("RegisterTeam")} />
      )}
    </View>
  )
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
  filterContainer: {
    flexDirection: "row",
    gap: 10,
  },
  filterChip: {
    marginRight: 5,
  },
  listContainer: {
    padding: 20,
  },
  teamCard: {
    marginBottom: 15,
    elevation: 2,
  },
  teamHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  teamName: {
    flex: 1,
    fontSize: 18,
  },
  statusChip: {
    marginLeft: 10,
  },
  clubName: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 5,
  },
  managerInfo: {
    color: colors.textSecondary,
    marginBottom: 2,
  },
  contactInfo: {
    color: colors.textSecondary,
    marginBottom: 5,
  },
  description: {
    fontStyle: "italic",
    marginTop: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: colors.secondary,
  },
})
