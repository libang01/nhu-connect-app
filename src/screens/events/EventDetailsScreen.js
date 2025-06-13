// src/screens/events/EventDetailsScreen.js

"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, Alert } from "react-native"
import { Card, Title, Paragraph, Button } from "react-native-paper"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../../firebase/firebase.config" 

export default function EventDetailsScreen({ route, navigation }) {
  const { eventId } = route.params
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchEventDetails = async () => {
    try {
      const eventDoc = await getDoc(doc(db, "events", eventId))
      if (eventDoc.exists()) {
        setEvent({ id: eventDoc.id, ...eventDoc.data() })
      } else {
        Alert.alert("Error", "Event not found.")
        navigation.goBack(); 
      }
    } catch (error) {
      console.error("Error fetching event details:", error)
      Alert.alert("Error", "Failed to load event details")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEventDetails()
  }, [eventId]) 

  const formatDate = (date) => {
    if (date?.toDate) {
      return date.toDate().toLocaleDateString()
    }
    
    try {
      const d = new Date(date);
      if (!isNaN(d.getTime())) { 
        return d.toLocaleDateString();
      }
    } catch (e) {
      console.error("Error parsing date:", e);
    }
    return 'N/A'; 
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Paragraph>Loading event details...</Paragraph>
      </View>
    )
  }

  if (!event) { 
    return (
      <View style={styles.loadingContainer}>
        <Paragraph>Event not found.</Paragraph>
        <Button onPress={() => navigation.goBack()}>Go Back</Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Button icon="arrow-left" onPress={() => navigation.goBack()}>
          Back
        </Button>
        <Title style={styles.headerTitle}>Event Details</Title>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.eventTitle}>{event.title}</Title>
          <Paragraph style={styles.eventDate}>📅 {formatDate(event.date)}</Paragraph>
          {event.location && <Paragraph style={styles.eventLocation}>📍 {event.location}</Paragraph>}
          <Paragraph style={styles.eventDescription}>{event.description}</Paragraph>
          {event.registrationDeadline && (
            <Paragraph style={styles.deadline}>
              Registration Deadline: {formatDate(event.registrationDeadline)}
            </Paragraph>
          )}
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
  eventTitle: {
    fontSize: 24,
    marginBottom: 15,
  },
  eventDate: {
    fontSize: 16,
    color: "#1E88E5",
    marginBottom: 10,
  },
  eventLocation: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 15,
  },
  eventDescription: {
    lineHeight: 22,
    marginBottom: 15,
  },
  deadline: {
    fontSize: 12,
    color: "#FF9800",
    fontStyle: "italic",
  },
})