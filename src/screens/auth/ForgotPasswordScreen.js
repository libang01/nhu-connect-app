"use client"

import { useState } from "react"
import { View, StyleSheet, Alert } from "react-native"
import { TextInput, Button, Text, Card, Title } from "react-native-paper"
import { sendPasswordResetEmail } from "firebase/auth"
import { auth } from "../../firebase/firebase.config" 
import { colors } from "../../styles/theme"

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address")
      return
    }

    setLoading(true)
    try {
      await sendPasswordResetEmail(auth, email)
      Alert.alert("Success", "Password reset email sent! Check your inbox.", [
        { text: "OK", onPress: () => navigation.navigate("Login") },
      ])
    } catch (error) {
      Alert.alert("Error", error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Reset Password</Title>
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you a link to reset your password.
          </Text>

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Button mode="contained" onPress={handleResetPassword} loading={loading} style={styles.button}>
            Send Reset Email
          </Button>

          <Button mode="text" onPress={() => navigation.navigate("Login")} style={styles.textButton}>
            Back to Sign In
          </Button>
        </Card.Content>
      </Card>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: colors.background,
  },
  card: {
    elevation: 4,
  },
  title: {
    textAlign: "center",
    marginBottom: 10,
    color: colors.primary,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 30,
    color: colors.textSecondary,
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 20,
    marginBottom: 10,
  },
  textButton: {
    marginTop: 5,
  },
})