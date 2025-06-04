"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, Alert } from "react-native"
import { Card, Title, Paragraph, Button } from "react-native-paper"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../../firebase/firebase.config"

export default function PlayerDetailsScreen({ route, navigation }) {
  const { playerId } = route.params
  const [player, setPlayer] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchPlayerDetails = async () => {
    try {
      const playerDoc = await getDoc(doc(db, "users", playerId))
      if (playerDoc.exists()) {
        setPlayer({ id: playerDoc.id, ...playerDoc.data() })
      }
    } catch (error) {
      console.error("Error fetching player details:", error)
      Alert.alert("Error", "Failed to load player details")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlayerDetails()
  }, [playerId])

  if (loading || !player) {
    return (
      <View style={styles.loadingContainer}>
        <Paragraph>Loading player details...</Paragraph>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Button icon="arrow-left" onPress={() => navigation.goBack()}>
          Back
        </Button>
        <Title style={styles.headerTitle}>Player Profile</Title>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.playerName}>
            {player.firstName} {player.lastName}
          </Title>
          <Paragraph style={styles.playerEmail}>{player.email}</Paragraph>
          <Paragraph style={styles.playerRole}>Role: {player.role}</Paragraph>
          {player.teamName && <Paragraph style={styles.teamInfo}>Team: {player.teamName}</Paragraph>}
          {player.position && <Paragraph style={styles.positionInfo}>Position: {player.position}</Paragraph>}
        </Card.Content>
      </Card>
    </ScrollView>
  )
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
    elevation: 2,
  },
  playerName: {
    fontSize: 24,
    marginBottom: 10,
  },
  playerEmail: {
    color: "#757575",
    marginBottom: 10,
  },
  playerRole: {
    color: "#1E88E5",
    fontWeight: "bold",
    marginBottom: 5,
  },
  teamInfo: {
    color: "#1E88E5",
    marginBottom: 5,
  },
  positionInfo: {
    color: "#757575",
  },
})
