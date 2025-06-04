"use client"

import { useState } from "react"
import { View, StyleSheet, ScrollView, Alert } from "react-native"
import { TextInput, Button, Text, Card, Title } from "react-native-paper"
import { collection, addDoc } from "firebase/firestore"
import { db } from "../../firebase/firebase.config"
import { useAuth } from "../../contexts/AuthContext"

export default function CreateNewsScreen({ navigation }) {
  const { user } = useAuth()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)

  const handleCreateNews = async () => {
    if (!title || !content) {
      Alert.alert("Error", "Please fill in all fields")
      return
    }

    setLoading(true)
    try {
      await addDoc(collection(db, "news"), {
        title: title,
        content: content,
        author: user.email,
        createdBy: user.uid,
        createdAt: new Date(),
      })

      Alert.alert("Success", "News article published successfully!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ])
    } catch (error) {
      console.error("Error creating news:", error)
      Alert.alert("Error", "Failed to publish news")
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
        <Title style={styles.headerTitle}>Create News Article</Title>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <TextInput
            label="Article Title *"
            value={title}
            onChangeText={setTitle}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Article Content *"
            value={content}
            onChangeText={setContent}
            mode="outlined"
            style={styles.input}
            multiline
            numberOfLines={10}
          />

          <Text style={styles.note}>* Required fields</Text>

          <Button mode="contained" onPress={handleCreateNews} loading={loading} style={styles.button}>
            Publish Article
          </Button>
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
  input: {
    marginBottom: 15,
  },
  note: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 20,
    fontStyle: "italic",
  },
  button: {
    marginTop: 10,
  },
})
