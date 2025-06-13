"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, FlatList, Alert, RefreshControl } from "react-native"
import { Card, Title, Paragraph, FAB, Button } from "react-native-paper" 
import { collection, query, getDocs, orderBy } from "firebase/firestore"
import { db } from "../../firebase/firebase.config"
import { useAuth } from "../../contexts/AuthContext"
import { colors } from "../../styles/theme"

export default function NewsScreen({ navigation }) {
  const { userRole } = useAuth()
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchNews = async () => {
    try {
      const newsSnapshot = await getDocs(query(collection(db, "news"), orderBy("createdAt", "desc")))

      const newsData = newsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      setNews(newsData)
    } catch (error) {
      console.error("Error fetching news:", error)
      Alert.alert("Error", "Failed to load news")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchNews()
  }, [])

  const onRefresh = () => {
    setRefreshing(true)
    fetchNews()
  }

  const formatDate = (date) => {
    if (date?.toDate) {
      return date.toDate().toLocaleDateString()
    }
    return new Date(date).toLocaleDateString()
  }

  const renderNewsItem = ({ item }) => (
    <Card style={styles.newsCard}>
      <Card.Content>
        <Title style={styles.newsTitle}>{item.title}</Title>
        <Paragraph style={styles.newsDate}>{formatDate(item.createdAt)}</Paragraph>
        <Paragraph style={styles.newsContent}>
          {item.content.length > 150 ? `${item.content.substring(0, 150)}...` : item.content}
        </Paragraph>
        {item.author && <Paragraph style={styles.newsAuthor}>By: {item.author}</Paragraph>}
      </Card.Content>
      <Card.Actions>
        <Button 
          mode="contained" 
          onPress={() => navigation.navigate("NewsDetails", { newsId: item.id })}
          style={styles.readMoreButton}
        >
          Read More
        </Button>
      </Card.Actions>
    </Card>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.headerTitle}>News & Announcements</Title>
      </View>

      <FlatList
        data={news}
        renderItem={renderNewsItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Paragraph style={styles.emptyText}>No news available</Paragraph>
          </View>
        }
      />

      {userRole === "admin" && (
        <FAB 
          style={styles.fab} 
          icon="plus" 
          onPress={() => navigation.navigate("CreateNews")} 
          color={colors.onSecondary}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    color: colors.primary,
    fontSize: 24,
  },
  listContainer: {
    padding: 20,
    paddingBottom: 80,
  },
  newsCard: {
    marginBottom: 20,
    elevation: 2,
    backgroundColor: colors.surface,
  },
  newsTitle: {
    fontSize: 18,
    marginBottom: 5,
    color: colors.textPrimary,
  },
  newsDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  newsContent: {
    marginBottom: 10,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  newsAuthor: {
    fontSize: 12,
    color: colors.primary,
    fontStyle: "italic",
  },
  readMoreButton: {
    marginTop: 10,
    backgroundColor: colors.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
  },
  emptyText: {
    color: colors.textSecondary,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: colors.secondary,
  },
})