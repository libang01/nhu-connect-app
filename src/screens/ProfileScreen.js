// src/screens/ProfileScreen.js

"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, Alert } from "react-native"
import { Card, Title, Paragraph, Button, TextInput, Avatar } from "react-native-paper"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { signOut } from "firebase/auth"
import { auth, db } from "../firebase/firebase.config" // <--- CORRECTED PATH HERE
import { useAuth } from "../contexts/AuthContext" // This path is also correct from src/screens/
import { colors } from "../styles/theme" // This path is also correct from src/screens/

export default function ProfileScreen() {
  const { user, userRole } = useAuth()
  const [userProfile, setUserProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [loading, setLoading] = useState(true)

  const fetchUserProfile = async () => {
    try {
      if (!user?.uid) { // Ensure user.uid exists before fetching
        setLoading(false);
        return;
      }
      const userDoc = await getDoc(doc(db, "users", user.uid))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        setUserProfile(userData)
        setFirstName(userData.firstName || "")
        setLastName(userData.lastName || "")
      } else {
        Alert.alert("Error", "User profile not found in database.")
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
      Alert.alert("Error", "Failed to load profile")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) { // Only fetch if user object is available from AuthContext
      fetchUserProfile()
    } else {
      setLoading(false); // If no user, stop loading state
    }
  }, [user]) // Re-run when user object changes (e.g., after login/logout)

  const handleSaveProfile = async () => {
    try {
      if (!user?.uid) {
        Alert.alert("Error", "User not logged in.");
        return;
      }
      await updateDoc(doc(db, "users", user.uid), {
        firstName: firstName,
        lastName: lastName,
        updatedAt: new Date(),
      })

      setUserProfile((prev) => ({
        ...prev,
        firstName: firstName,
        lastName: lastName,
      }))

      setEditing(false)
      Alert.alert("Success", "Profile updated successfully")
    } catch (error) {
      console.error("Error updating profile:", error)
      Alert.alert("Error", "Failed to update profile")
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      // Navigation should be handled by AuthContext listener,
      // which would navigate to Login screen after logout.
    } catch (error) {
      console.error("Error signing out:", error)
      Alert.alert("Error", "Failed to sign out")
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Paragraph>Loading profile...</Paragraph>
      </View>
    )
  }

  // If user is null after loading, means not logged in
  if (!user || !userProfile) {
    return (
      <View style={styles.loadingContainer}>
        <Paragraph>Please log in to view your profile.</Paragraph>
        {/* You might want to add a button to navigate to login */}
      </View>
    );
  }


  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Avatar.Text size={80} label={userProfile?.firstName?.charAt(0) || "U"} style={styles.avatar} />
        <Title style={styles.headerTitle}>My Profile</Title>
      </View>

      <Card style={styles.profileCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Personal Information</Title>

          {editing ? (
            <>
              <TextInput
                label="First Name"
                value={firstName}
                onChangeText={setFirstName}
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="Last Name"
                value={lastName}
                onChangeText={setLastName}
                mode="outlined"
                style={styles.input}
              />
            </>
          ) : (
            <>
              <View style={styles.infoRow}>
                <Paragraph style={styles.label}>Name:</Paragraph>
                <Paragraph style={styles.value}>
                  {userProfile?.firstName} {userProfile?.lastName}
                </Paragraph>
              </View>
              <View style={styles.infoRow}>
                <Paragraph style={styles.label}>Email:</Paragraph>
                <Paragraph style={styles.value}>{user?.email}</Paragraph>
              </View>
              <View style={styles.infoRow}>
                <Paragraph style={styles.label}>Role:</Paragraph>
                <Paragraph style={styles.value}>{userRole?.charAt(0).toUpperCase() + userRole?.slice(1)}</Paragraph>
              </View>
              {userProfile?.team && (
                <View style={styles.infoRow}>
                  <Paragraph style={styles.label}>Team:</Paragraph>
                  <Paragraph style={styles.value}>{userProfile.team}</Paragraph>
                </View>
              )}
            </>
          )}
        </Card.Content>

        <Card.Actions>
          {editing ? (
            <>
              <Button onPress={() => setEditing(false)}>Cancel</Button>
              <Button mode="contained" onPress={handleSaveProfile}>
                Save Changes
              </Button>
            </>
          ) : (
            <Button mode="contained" onPress={() => setEditing(true)}>
              Edit Profile
            </Button>
          )}
        </Card.Actions>
      </Card>

      <Card style={styles.actionsCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Account Actions</Title>
          <Button
            mode="outlined"
            icon="lock-reset"
            onPress={() => Alert.alert("Feature Coming Soon", "Password change feature will be available soon")}
            style={styles.actionButton}
          >
            Change Password
          </Button>
          <Button
            mode="contained"
            icon="logout"
            onPress={handleLogout}
            style={[styles.actionButton, { backgroundColor: colors.error }]}
          >
            Sign Out
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
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    padding: 30,
    paddingTop: 60,
    backgroundColor: colors.primary,
  },
  avatar: {
    backgroundColor: colors.secondary,
    marginBottom: 15,
  },
  headerTitle: {
    color: "white",
    fontSize: 24,
  },
  profileCard: {
    margin: 20,
    marginTop: -20,
    elevation: 4,
  },
  sectionTitle: {
    marginBottom: 15,
    color: colors.primary,
  },
  input: {
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 10,
    alignItems: "center",
  },
  label: {
    fontWeight: "bold",
    width: 80,
    color: colors.textSecondary,
  },
  value: {
    flex: 1,
    fontSize: 16,
  },
  actionsCard: {
    margin: 20,
    marginTop: 10,
  },
  actionButton: {
    marginBottom: 10,
  },
})