// src/screens/RegisterScreen.js
"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator } from "react-native"
import { TextInput, Button, Text, Card, Title, RadioButton } from "react-native-paper"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc, updateDoc, increment, collection, query, getDocs, addDoc, where, getDoc } from "firebase/firestore"
import DropDownPicker from "react-native-dropdown-picker"
import { auth, db } from "../../firebase/firebase.config"
import { colors } from "../../styles/theme"

export default function RegisterScreen({ navigation }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    team: null,
    teamName: "",
    role: "player",
  })
  const [loading, setLoading] = useState(false)
  const [openTeamDropDown, setOpenTeamDropDown] = useState(false)
  const [teamsList, setTeamsList] = useState([])
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const q = query(
          collection(db, "teams"), 
          where("status", "==", "approved")
        )
        const querySnapshot = await getDocs(q)
        const fetchedTeams = querySnapshot.docs.map((doc) => ({
          label: doc.data().name,
          value: doc.id,
          managerId: doc.data().managerId
        }))
        setTeamsList(fetchedTeams)

        if (fetchedTeams.length > 0 && !formData.team) {
          setFormData((prev) => ({
            ...prev,
            team: fetchedTeams[0].value,
            teamName: fetchedTeams[0].label,
          }))
        }
      } catch (error) {
        console.error("Error fetching teams:", error)
        Alert.alert("Error", "Failed to load teams. Please try again later.")
      } finally {
        setInitializing(false)
      }
    }

    if (formData.role === "player") {
      fetchTeams()
    } else {
      setFormData((prev) => ({
        ...prev,
        team: null,
        teamName: "",
      }))
      setTeamsList([])
      setInitializing(false)
    }
  }, [formData.role])

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleTeamChange = (callback) => {
    setFormData((prev) => {
      const newValue = callback(prev.team)
      const selectedTeamData = teamsList.find((team) => team.value === newValue)
      return {
        ...prev,
        team: newValue,
        teamName: selectedTeamData ? selectedTeamData.label : "",
      }
    })
  }

  const validateForm = () => {
    const { email, password, confirmPassword, firstName, lastName, role, team } = formData

    if (!email || !password || !firstName || !lastName) {
      Alert.alert("Error", "Please fill in all required fields.")
      return false
    }

    if (!email.includes("@")) {
      Alert.alert("Error", "Please enter a valid email address.")
      return false
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters.")
      return false
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.")
      return false
    }

    if (role === "player" && (!team || teamsList.length === 0)) {
      Alert.alert("Error", "Please select a team. If no teams are listed, contact an administrator.")
      return false
    }

    return true
  }

  const handleRegister = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      )
      const user = userCredential.user

      // Prepare user data for Firestore
      const userData = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        fullName: `${formData.firstName} ${formData.lastName}`,
        role: formData.role,
        createdAt: new Date(),
        status: formData.role === "player" ? "pending_team_approval" : "active"
      }

      const userRef = doc(db, "users", user.uid)
      await setDoc(userRef, userData)

      if (formData.role === "player" && formData.team) {
        // Get team manager ID
        const teamDoc = await getDoc(doc(db, "teams", formData.team))
        if (!teamDoc.exists()) {
          throw new Error("Selected team not found")
        }
        const managerId = teamDoc.data().managerId

        // Create team join request
        await addDoc(collection(db, "teamRequests"), {
          playerId: user.uid,
          playerName: userData.fullName,
          playerEmail: userData.email,
          teamId: formData.team,
          teamName: formData.teamName,
          managerId: managerId,
          status: "pending",
          type: "join",
          createdAt: new Date(),
        })
      }

      // Update statistics
      try {
        const statsRef = doc(db, "statistics", "users")
        await updateDoc(statsRef, {
          [`${formData.role}Count`]: increment(1),
        })
      } catch (statsError) {
        console.log("Statistics update skipped:", statsError)
      }

      // Show success message
      Alert.alert(
        "Success", 
        formData.role === "player" 
          ? "Registration successful! Your request to join the team has been sent for approval."
          : `Registration successful! You are now registered as a ${formData.role}.`,
        [{ 
          text: "OK", 
          onPress: () => navigation.navigate("Login") 
        }]
      )

    } catch (error) {
      console.error("Registration error:", error)
      let errorMessage = "Registration failed. Please try again."

      if (error.code === "auth/email-already-in-use") {
        errorMessage = "This email is already registered."
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password should be at least 6 characters."
      } else if (error.code === "permission-denied") {
        errorMessage = "Permission denied. Please check your credentials or contact support."
      }

      Alert.alert("Registration Error", errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Create Account</Title>
          <Text style={styles.subtitle}>Join the NHU community</Text>

          <View style={styles.nameRow}>
            <TextInput
              label="First Name"
              value={formData.firstName}
              onChangeText={(text) => handleChange("firstName", text)}
              mode="outlined"
              style={[styles.input, styles.nameInput]}
              autoCapitalize="words"
              disabled={loading}
            />
            <TextInput
              label="Last Name"
              value={formData.lastName}
              onChangeText={(text) => handleChange("lastName", text)}
              mode="outlined"
              style={[styles.input, styles.nameInput]}
              autoCapitalize="words"
              disabled={loading}
            />
          </View>

          <TextInput
            label="Email"
            value={formData.email}
            onChangeText={(text) => handleChange("email", text)}
            mode="outlined"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            disabled={loading}
          />

          <TextInput
            label="Password"
            value={formData.password}
            onChangeText={(text) => handleChange("password", text)}
            mode="outlined"
            style={styles.input}
            secureTextEntry
            disabled={loading}
          />

          <TextInput
            label="Confirm Password"
            value={formData.confirmPassword}
            onChangeText={(text) => handleChange("confirmPassword", text)}
            mode="outlined"
            style={styles.input}
            secureTextEntry
            disabled={loading}
          />

          <Text style={styles.sectionTitle}>Select Your Role</Text>
          <RadioButton.Group
            onValueChange={(value) => handleChange("role", value)}
            value={formData.role}
          >
            <View style={styles.radioOption}>
              <RadioButton value="player" color={colors.primary} disabled={loading} />
              <Text>Player</Text>
            </View>
            <View style={styles.radioOption}>
              <RadioButton value="manager" color={colors.primary} disabled={loading} />
              <Text>Team Manager</Text>
            </View>
            <View style={styles.radioOption}>
              <RadioButton value="admin" color={colors.primary} disabled={loading} />
              <Text>Administrator</Text>
            </View>
          </RadioButton.Group>

          {formData.role === "player" && (
            <>
              {teamsList.length > 0 ? (
                <View style={[styles.dropdownContainer, { zIndex: 1000 }]}>
                  <DropDownPicker
                    open={openTeamDropDown}
                    value={formData.team}
                    items={teamsList}
                    setOpen={setOpenTeamDropDown}
                    setValue={handleTeamChange}
                    setItems={setTeamsList}
                    placeholder="Select Your Team"
                    style={styles.dropdownPickerStyle}
                    containerStyle={styles.dropdownPickerContainer}
                    textStyle={{ color: colors.textPrimary }}
                    dropDownContainerStyle={[styles.dropdownPickerListStyle, { zIndex: 2000, elevation: 2000 }]}
                    searchable={true}
                    disabled={loading}
                    listMode="SCROLLVIEW"
                  />
                </View>
              ) : (
                <View style={styles.noTeamsContainer}>
                  <Text style={styles.noTeamsMessage}>
                    No approved teams available. Please contact an administrator.
                  </Text>
                </View>
              )}
              <View style={styles.noteContainer}>
                <Text style={styles.noteText}>
                  After registration, your request to join the selected team will be sent for approval.
                </Text>
              </View>
            </>
          )}

          <Button
            mode="contained"
            onPress={handleRegister}
            loading={loading}
            disabled={loading}
            style={styles.button}
            labelStyle={styles.buttonLabel}
          >
            Create Account
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.navigate("Login")}
            style={styles.textButton}
            labelStyle={styles.textButtonLabel}
            disabled={loading}
          >
            Already have an account? Sign In
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background
  },
  scrollContent: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  card: {
    elevation: 4,
    borderRadius: 8,
  },
  title: {
    textAlign: "center",
    marginBottom: 8,
    color: colors.primary,
    fontSize: 24,
    fontWeight: "bold",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 30,
    color: colors.textSecondary,
    fontSize: 14,
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  nameInput: {
    flex: 1,
    marginRight: 10,
  },
  input: {
    marginBottom: 16,
    backgroundColor: colors.surface,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  button: {
    marginTop: 24,
    marginBottom: 16,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  buttonLabel: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: "bold",
  },
  textButton: {
    marginTop: 8,
  },
  textButtonLabel: {
    color: colors.primary,
  },
  dropdownContainer: {
    marginBottom: 16,
  },
  dropdownPickerStyle: {
    backgroundColor: colors.surface,
    borderColor: colors.outline,
    minHeight: 56,
  },
  dropdownPickerContainer: {},
  dropdownPickerListStyle: {
    backgroundColor: colors.surface,
    borderColor: colors.outline,
  },
  noTeamsContainer: {
    marginBottom: 16,
    padding: 8,
    backgroundColor: colors.surface,
    borderRadius: 4,
  },
  noteContainer: {
    marginBottom: 16,
  },
  noTeamsMessage: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
  noteText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 10,
  }
})