"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, Alert } from "react-native"
import { Card, Title, Paragraph, Button } from "react-native-paper"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../../firebase/firebase.config"

export default function NewsDetailsScreen({ route, navigation }) {
  const { newsId } = route.params
  const [news, setNews] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchNewsDetails = async () => {
    try {
      const newsDoc = await getDoc(doc(db, "news", newsId))
      if (newsDoc.exists()) {
        setNews({ id: newsDoc.id, ...newsDoc.data() })
      }
    } catch (error) {
      console.error("Error fetching news details:", error)
      Alert.alert("Error", "Failed to load news details")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNewsDetails()
  }, [newsId])

  const formatDate = (date) => {
    if (date?.toDate) {
      return date.toDate().toLocaleDateString()
    }
    return new Date(date).toLocaleDateString()
  }

  if (loading || !news) {
    return (
      <View style={styles.loadingContainer}>
        <Paragraph>Loading news...</Paragraph>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Button icon="arrow-left" onPress={() => navigation.goBack()}>
          Back
        </Button>
        <Title style={styles.headerTitle}>News Article</Title>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.newsTitle}>{news.title}</Title>
          <Paragraph style={styles.newsDate}>{formatDate(news.createdAt)}</Paragraph>
          {news.author && <Paragraph style={styles.newsAuthor}>By: {news.author}</Paragraph>}
          <Paragraph style={styles.newsContent}>{news.content}</Paragraph>
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
  newsTitle: {
    fontSize: 24,
    marginBottom: 10,
  },
  newsDate: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 5,
  },
  newsAuthor: {
    fontSize: 12,
    color: "#1E88E5",
    fontStyle: "italic",
    marginBottom: 20,
  },
  newsContent: {
    lineHeight: 22,
  },
})
