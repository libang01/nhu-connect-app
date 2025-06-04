// src/screens/events/CreateEventScreen.js

"use client"

import { useState } from "react"
import { View, StyleSheet, ScrollView, Alert } from "react-native"
import { TextInput, Button, Text, Card, Title } from "react-native-paper"
import { collection, addDoc } from "firebase/firestore"
import { db } from "../../firebase/firebase.config" // <--- CORRECTED PATH HERE
import { useAuth } from "../../contexts/AuthContext" // This path is correct from src/screens/events/

// Note: This component doesn't import `colors` from `../../styles/theme`.
// For consistency, you might consider replacing hardcoded colors in `styles`
// with values from your `theme` file if you have one.
// Example: `backgroundColor: colors.background,` instead of `backgroundColor: "#FFFFFF",`

export default function CreateEventScreen({ navigation }) {
  const { user } = useAuth()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [date, setDate] = useState("")
  const [registrationDeadline, setRegistrationDeadline] = useState("")
  const [loading, setLoading] = useState(false)

  const handleCreateEvent = async () => {
    if (!title || !description || !date) {
      Alert.alert("Error", "Please fill in all required fields")
      return
    }

    setLoading(true)
    try {
      await addDoc(collection(db, "events"), {
        title: title,
        description: description,
        location: location,
        date: new Date(date),
        registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
        createdBy: user.uid,
        createdAt: new Date(),
        entries: [],
      })

      Alert.alert("Success", "Event created successfully!", [{ text: "OK", onPress: () => navigation.goBack() }])
    } catch (error) {
      console.error("Error creating event:", error)
      Alert.alert("Error", "Failed to create event")
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Button icon="arrow-left" onPress={() => navigation.goBack()}>
          Back
        </Button>
        <Title style={styles.headerTitle}>Create New Event</Title>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <TextInput label="Event Title *" value={title} onChangeText={setTitle} mode="outlined" style={styles.input} />

          <TextInput
            label="Description *"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            style={styles.input}
            multiline
            numberOfLines={4}
          />

          <TextInput
            label="Location"
            value={location}
            onChangeText={setLocation}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Event Date * (YYYY-MM-DD)"
            value={date}
            onChangeText={setDate}
            mode="outlined"
            style={styles.input}
            placeholder="2024-12-25"
          />

          <TextInput
            label="Registration Deadline (YYYY-MM-DD)"
            value={registrationDeadline}
            onChangeText={setRegistrationDeadline}
            mode="outlined"
            style={styles.input}
            placeholder="2024-12-20"
          />

          <Text style={styles.note}>* Required fields</Text>

          <Button mode="contained" onPress={handleCreateEvent} loading={loading} style={styles.button}>
            Create Event
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF", // Consider using colors.background here for consistency
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#F5F5F5", // Consider using a color from your theme
  },
  headerTitle: {
    marginTop: 10,
    color: "#1E88E5", // Consider using colors.primary or similar
  },
  card: {
    margin: 20,
    elevation: 2,
  },
  input: {
    marginBottom: 15,
  },
  note: {
    fontSize: 12,
    color: "#757575", // Consider using colors.textSecondary or similar
    marginBottom: 20,
    fontStyle: "italic",
  },
  button: {
    marginTop: 10,
  },
})