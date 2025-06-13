"use client"

import { useState } from "react"
import { View, StyleSheet, ScrollView, Alert } from "react-native"
import { TextInput, Button, Text, Card, Title } from "react-native-paper"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "../../firebase/firebase.config" 
import { colors } from "../../styles/theme"

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields")
      return
    }

    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      Alert.alert("Login Error", error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>Welcome to NamHockeyUnion</Title>
            <Text style={styles.subtitle}>Sign in to continue</Text>

            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              style={styles.input}
              secureTextEntry
            />

            <Button mode="contained" onPress={handleLogin} loading={loading} style={styles.button}>
              Sign In
            </Button>

            <Button mode="text" onPress={() => navigation.navigate("ForgotPassword")} style={styles.textButton}>
              Forgot Password?
            </Button>

            <Button mode="text" onPress={() => navigation.navigate("Register")} style={styles.textButton}>
              Don't have an account? Sign Up
            </Button>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    paddingTop: 100,
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