"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, FlatList, Alert, RefreshControl } from "react-native"
import { Card, Title, Paragraph, Button, FAB, Chip } from "react-native-paper"
import { collection, query, getDocs, orderBy, where } from "firebase/firestore"
import { db } from "../../firebase/firebase.config" 
import { useAuth } from "../../contexts/AuthContext"
import { colors } from "../../styles/theme"

export default function EventsScreen({ navigation }) {
  const { userRole } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState("upcoming")

  const fetchEvents = async () => {
    try {
      let eventsQuery
      const now = new Date()

      if (filter === "upcoming") {
        eventsQuery = query(
          collection(db, "events"),
          where("date", ">=", now),
          orderBy("date", "asc")
        )
      } else {
        eventsQuery = query(
          collection(db, "events"),
          orderBy("date", "desc")
        )
      }

      const eventsSnapshot = await getDocs(eventsQuery)
      const eventsData = eventsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      setEvents(eventsData)
    } catch (error) {
      console.error("Error fetching events:", error)
      Alert.alert("Error", "Failed to load events")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [filter])

  const onRefresh = () => {
    setRefreshing(true)
    fetchEvents()
  }

  const formatDate = (date) => {
    if (!date) return "Date not set"
    try {
      const jsDate = date?.toDate?.() || new Date(date)
      return jsDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    } catch {
      return "Invalid date"
    }
  }

  const renderEvent = ({ item }) => (
    <Card style={styles.eventCard}>
      <Card.Content>
        <View style={styles.eventHeader}>
          <Title style={styles.eventTitle}>{item.title}</Title>
          <Chip
            style={[
              styles.statusChip,
              {
                backgroundColor: item.date?.toDate?.() >= new Date() 
                  ? colors.success 
                  : colors.textSecondary,
              },
            ]}
            textStyle={{ color: "white" }}
          >
            {item.date?.toDate?.() >= new Date() ? "Upcoming" : "Past"}
          </Chip>
        </View>

        <Paragraph style={styles.eventDate}>📅 {formatDate(item.date)}</Paragraph>
        {item.location && <Paragraph style={styles.eventLocation}>📍 {item.location}</Paragraph>}
        <Paragraph style={styles.eventDescription} numberOfLines={2}>
          {item.description}
        </Paragraph>

        {item.registrationDeadline && (
          <Paragraph style={styles.deadline}>
            Registration until: {formatDate(item.registrationDeadline)}
          </Paragraph>
        )}
      </Card.Content>

      <Card.Actions>
        <Button onPress={() => navigation.navigate("EventDetails", { eventId: item.id })}>
          Details
        </Button>
        {userRole === "manager" && item.date?.toDate?.() >= new Date() && (
          <Button 
            mode="contained" 
            onPress={() => navigation.navigate("EventEntry", { eventId: item.id })}
          >
            Register Team
          </Button>
        )}
      </Card.Actions>
    </Card>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.headerTitle}>Events</Title>
        <View style={styles.filterContainer}>
          <Chip 
            selected={filter === "upcoming"} 
            onPress={() => setFilter("upcoming")} 
            style={styles.filterChip}
          >
            Upcoming
          </Chip>
          <Chip 
            selected={filter === "all"} 
            onPress={() => setFilter("all")} 
            style={styles.filterChip}
          >
            All Events
          </Chip>
        </View>
      </View>

      <FlatList
        data={events}
        renderItem={renderEvent}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Paragraph>No {filter === "upcoming" ? "upcoming" : ""} events found</Paragraph>
          </View>
        }
      />

      {userRole === "admin" && (
        <FAB 
          style={styles.fab} 
          icon="plus" 
          color="white"
          onPress={() => navigation.navigate("CreateEvent")}
        />
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
    fontSize: 24,
  },
  filterContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  filterChip: {
    backgroundColor: colors.surfaceVariant,
  },
  listContainer: {
    padding: 15,
    paddingBottom: 30,
  },
  eventCard: {
    marginBottom: 15,
    elevation: 2,
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  eventTitle: {
    flex: 1,
    fontSize: 18,
  },
  statusChip: {
    marginLeft: 10,
  },
  eventDate: {
    fontSize: 16,
    color: colors.primary,
    marginBottom: 5,
  },
  eventLocation: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 5,
  },
  eventDescription: {
    marginBottom: 10,
    color: colors.onSurface,
  },
  deadline: {
    fontSize: 12,
    color: colors.error,
    fontStyle: "italic",
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
    backgroundColor: colors.primary,
  },
})