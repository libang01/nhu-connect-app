"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator } from "react-native"
import { TextInput, Button, Text, Card, Title } from "react-native-paper"
import { collection, addDoc, doc, updateDoc, arrayUnion } from "firebase/firestore"
import { db } from "../../firebase/firebase.config"
import { useAuth } from "../../contexts/AuthContext"
import { colors } from "../../styles/theme"

export default function RegisterTeamScreen({ navigation }) {
  const { user } = useAuth()
  const [teamName, setTeamName] = useState("")
  const [clubName, setClubName] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [error, setError] = useState(null)

  // Verify authentication status
  useEffect(() => {
    if (!user) {
      setError(new Error('You must be logged in to register a team'))
    }
    setAuthChecked(true)
  }, [user])

  const handleRegisterTeam = async () => {
    if (!user) {
      Alert.alert("Authentication Required", "Please log in to register a team")
      return
    }

    if (!teamName.trim() || !clubName.trim()) {
      Alert.alert("Error", "Please fill in all required fields")
      return
    }

    if (teamName.length < 3 || clubName.length < 3) {
      Alert.alert("Error", "Team and club names must be at least 3 characters")
      return
    }

    setLoading(true)
    try {
      const teamRef = await addDoc(collection(db, "teams"), {
        name: teamName.trim(),
        club: clubName.trim(),
        description: description.trim(),
        managerId: user.uid,
        managerEmail: user.email,
        managerName: user.displayName || user.email,
        status: "pending",
        createdAt: new Date(),
        players: [],
        updatedAt: new Date()
      })

      await updateDoc(doc(db, "users", user.uid), {
        managedTeams: arrayUnion(teamRef.id)
      })

      Alert.alert(
        "Success", 
        "Team registration submitted for approval!",
        [
          { 
            text: "OK", 
            onPress: () => navigation.replace("Teams") 
          }
        ]
      )
    } catch (error) {
      console.error("Error registering team:", error)
      setError(error)
      Alert.alert(
        "Registration Failed",
        error.code === 'permission-denied'
          ? "You don't have permission to register teams"
          : "Failed to register team. Please try again later."
      )
    } finally {
      setLoading(false)
    }
  }

  if (!authChecked) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (error && !user) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error.message}</Text>
        <Button 
          mode="contained" 
          onPress={() => navigation.navigate("Login")}
          style={styles.authButton}
          labelStyle={styles.buttonLabel}
        >
          Go to Login
        </Button>
      </View>
    )
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Button 
          icon="arrow-left" 
          onPress={() => navigation.goBack()}
          labelStyle={styles.backButton}
          disabled={loading}
        >
          Back
        </Button>
        <Title style={styles.headerTitle}>Register New Team</Title>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <TextInput
            label="Team Name *"
            value={teamName}
            onChangeText={setTeamName}
            mode="outlined"
            style={styles.input}
            maxLength={50}
            autoCapitalize="words"
            placeholder="e.g., NHU Lions"
            disabled={loading}
            error={teamName.length > 0 && teamName.length < 3}
            right={
              teamName.length > 0 && teamName.length < 3 ? (
                <TextInput.Icon icon="alert-circle" color={colors.error} />
              ) : null
            }
          />

          <TextInput
            label="Club Affiliation *"
            value={clubName}
            onChangeText={setClubName}
            mode="outlined"
            style={styles.input}
            maxLength={50}
            autoCapitalize="words"
            placeholder="e.g., NHU Hockey Club"
            disabled={loading}
            error={clubName.length > 0 && clubName.length < 3}
            right={
              clubName.length > 0 && clubName.length < 3 ? (
                <TextInput.Icon icon="alert-circle" color={colors.error} />
              ) : null
            }
          />

          <TextInput
            label="Team Description"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            style={[styles.input, styles.descriptionInput]}
            multiline
            numberOfLines={4}
            maxLength={200}
            placeholder="Brief description of your team..."
            disabled={loading}
          />

          <Text style={styles.note}>
            * Required fields. Team registration requires admin approval.
          </Text>

          <Text style={styles.charCount}>
            {description.length}/200 characters
          </Text>

          <Button 
            mode="contained" 
            onPress={handleRegisterTeam} 
            loading={loading}
            disabled={loading || !teamName.trim() || !clubName.trim() || teamName.length < 3 || clubName.length < 3}
            style={styles.button}
            labelStyle={styles.buttonLabel}
            contentStyle={styles.buttonContent}
          >
            {loading ? "Submitting..." : "Submit Registration"}
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    color: colors.primary,
  },
  headerTitle: {
    marginLeft: 20,
    color: colors.primary,
    fontSize: 22,
    flex: 1,
  },
  card: {
    margin: 20,
    marginTop: 10,
    elevation: 2,
    borderRadius: 8,
  },
  input: {
    marginBottom: 15,
    backgroundColor: colors.surfaceVariant,
  },
  descriptionInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  note: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 5,
    fontStyle: "italic",
  },
  charCount: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 20,
    textAlign: 'right',
  },
  button: {
    marginTop: 10,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  buttonLabel: {
    color: colors.onPrimary,
    fontSize: 16,
  },
  buttonContent: {
    height: 48,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: 18,
    color: colors.error,
    marginBottom: 20,
    textAlign: 'center',
  },
  authButton: {
    marginTop: 20,
    backgroundColor: colors.primary,
    borderRadius: 8,
    width: '80%',
  },
})