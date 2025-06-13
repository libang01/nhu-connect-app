// src/screens/EditProfileScreen.js
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, TextInput, Title, Text, Card } from 'react-native-paper';
import { auth, db } from '../firebase/firebase.config'; 
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateProfile, updateEmail, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth'; 
import { colors } from '../styles/theme'; 

export default function EditProfileScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: '',
    email: '', 
    phoneNumber: '',
  });
  const [originalEmail, setOriginalEmail] = useState('');
  const [password, setPassword] = useState(''); 

  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!currentUser) {
        Alert.alert("Error", "User not logged in.");
        setLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          setProfileData({
            displayName: data.displayName || '',
            email: currentUser.email || '', 
            phoneNumber: data.phoneNumber || '',
          
          });
          setOriginalEmail(currentUser.email || ''); 
        } else {
          
          setProfileData({
            displayName: currentUser.displayName || '',
            email: currentUser.email || '',
            phoneNumber: '',
          });
          setOriginalEmail(currentUser.email || '');
          Alert.alert("Info", "No detailed profile found. Using basic user data.");
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        Alert.alert("Error", "Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [currentUser]); 

  const handleChange = (field, value) => {
    setProfileData(prevData => ({ ...prevData, [field]: value }));
  };

  const handleSaveProfile = async () => {
    if (!currentUser) {
      Alert.alert("Error", "No user logged in to save profile.");
      return;
    }

    setIsSaving(true);
    let emailChanged = profileData.email !== originalEmail;

    if (emailChanged && !password) {
      Alert.alert("Re-authentication Required", "Please enter your current password to change your email address.");
      setIsSaving(false);
      return;
    }

    try {
      
      if (profileData.displayName !== currentUser.displayName) {
        await updateProfile(currentUser, { displayName: profileData.displayName });
      }

      // Email update (requires re-authentication)
      if (emailChanged) {
        const credential = EmailAuthProvider.credential(originalEmail, password);
        await reauthenticateWithCredential(currentUser, credential);
        await updateEmail(currentUser, profileData.email); 
        setOriginalEmail(profileData.email); 
        setPassword(''); 
      }

      
      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, {
        displayName: profileData.displayName,
        phoneNumber: profileData.phoneNumber,
        updatedAt: new Date(),
      });

      Alert.alert("Success", "Profile updated successfully!");
      navigation.goBack(); 
    } catch (error) {
      console.error("Error saving profile:", error);
      let errorMessage = "Failed to update profile.";
      if (error.code === 'auth/requires-recent-login') {
        errorMessage = "Please log out and log in again to update your email (due to recent login requirement).";
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = "Incorrect password. Please try again.";
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = "The new email is already in use by another account.";
      }
      Alert.alert("Error", errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Title style={styles.headerTitle}>Edit Profile</Title>

        <Card style={styles.card}>
          <Card.Content>
            <TextInput
              label="Display Name"
              value={profileData.displayName}
              onChangeText={(text) => handleChange('displayName', text)}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="account" />}
            />

            <TextInput
              label="Email"
              value={profileData.email}
              onChangeText={(text) => handleChange('email', text)}
              mode="outlined"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              left={<TextInput.Icon icon="email" />}
            />

            {profileData.email !== originalEmail && (
              <TextInput
                label="Current Password (required for email change)"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry
                style={styles.input}
                left={<TextInput.Icon icon="lock" />}
              />
            )}

            <TextInput
              label="Phone Number (Optional)"
              value={profileData.phoneNumber}
              onChangeText={(text) => handleChange('phoneNumber', text)}
              mode="outlined"
              style={styles.input}
              keyboardType="phone-pad"
              left={<TextInput.Icon icon="phone" />}
            />

      

            <Button
              mode="contained"
              onPress={handleSaveProfile}
              loading={isSaving}
              disabled={isSaving}
              style={styles.saveButton}
              labelStyle={styles.saveButtonText}
            >
              Save Profile
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background, 
  },
  scrollViewContent: {
    padding: 20,
    alignItems: 'center', 
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary, 
    marginBottom: 25,
    marginTop: 10,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 500, 
    borderRadius: 10,
    elevation: 4, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  input: {
    marginBottom: 15,
  },
  saveButton: {
    marginTop: 20,
    paddingVertical: 8,
    backgroundColor: colors.primary, 
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textSecondary,
  },
});