// src/screens/HomeScreen.js

"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native"
import { Card, Title, Paragraph, Button, FAB } from "react-native-paper"
import { Ionicons } from "@expo/vector-icons"
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore"
import { db } from "../firebase/firebase.config" 
import { useAuth } from "../contexts/AuthContext" 
import { colors } from "../styles/theme" 

export default function HomeScreen({ navigation }) {
  const { user, userRole } = useAuth()
  const [stats, setStats] = useState({
    totalTeams: 0,
    totalPlayers: 0,
    upcomingEvents: 0,
  })
  const [recentNews, setRecentNews] = useState([])
  const [refreshing, setRefreshing] = useState(false)

  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const teamsSnapshot = await getDocs(collection(db, "teams"))
      const playersSnapshot = await getDocs(collection(db, "users"))
      const eventsSnapshot = await getDocs(
        query(collection(db, "events"), where("date", ">=", new Date()), orderBy("date", "asc")),
      )

      setStats({
        totalTeams: teamsSnapshot.size,
        totalPlayers: playersSnapshot.size,
        upcomingEvents: eventsSnapshot.size,
      })

      // Fetch recent news
      const newsSnapshot = await getDocs(query(collection(db, "news"), orderBy("createdAt", "desc"), limit(3)))

      const newsData = newsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setRecentNews(newsData)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchDashboardData()
    setRefreshing(false)
  }

  const StatCard = ({ title, value, icon, color }) => (
    <Card style={[styles.statCard, { borderLeftColor: color }]}>
      <Card.Content style={styles.statContent}>
        <View style={styles.statInfo}>
          <Title style={styles.statValue}>{value}</Title>
          <Paragraph style={styles.statTitle}>{title}</Paragraph>
        </View>
        <Ionicons name={icon} size={30} color={color} />
      </Card.Content>
    </Card>
  )

  return (
    <View style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.header}>
          <Title style={styles.welcomeText}>Welcome back, {user?.email?.split("@")[0]}!</Title>
          <Paragraph style={styles.roleText}>Role: {userRole?.charAt(0).toUpperCase() + userRole?.slice(1)}</Paragraph>
        </View>

        <View style={styles.statsContainer}>
          <StatCard title="Total Teams" value={stats.totalTeams} icon="people" color={colors.primary} />
          <StatCard title="Total Players" value={stats.totalPlayers} icon="person" color={colors.secondary} />
          <StatCard title="Upcoming Events" value={stats.upcomingEvents} icon="calendar" color={colors.success} />
        </View>

        <Card style={styles.newsCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Recent News</Title>
            {recentNews.length > 0 ? (
              recentNews.map((news) => (
                <View key={news.id} style={styles.newsItem}>
                  <Title style={styles.newsTitle}>{news.title}</Title>
                  <Paragraph style={styles.newsContent}>{news.content.substring(0, 100)}...</Paragraph>
                  <Paragraph style={styles.newsDate}>{news.createdAt?.toDate().toLocaleDateString()}</Paragraph>
                </View>
              ))
            ) : (
              <Paragraph>No recent news available</Paragraph>
            )}
            <Button
              mode="outlined"
              onPress={() => navigation.navigate("MainTabs", { screen: "News" })}
              style={styles.viewAllButton}
            >
              View All News
            </Button>
          </Card.Content>
        </Card>

        <View style={styles.quickActions}>
          <Title style={styles.sectionTitle}>Quick Actions</Title>
          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              icon="people"
              onPress={() => navigation.navigate("MainTabs", { screen: "Teams" })}
              style={styles.actionButton}
            >
              View Teams
            </Button>
            <Button
              mode="contained"
              icon="calendar"
              onPress={() => navigation.navigate("MainTabs", { screen: "Events" })}
              style={styles.actionButton}
            >
              View Events
            </Button>
          </View>
        </View>
      </ScrollView>

      {userRole === "admin" && (
        <FAB style={styles.fab} icon="plus" onPress={() => navigation.navigate("MainTabs", { screen: "Admin" })} />
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
    backgroundColor: colors.primary,
  },
  welcomeText: {
    color: "white",
    fontSize: 24,
  },
  roleText: {
    color: "white",
    opacity: 0.8,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    paddingBottom: 10,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 5,
    borderLeftWidth: 4,
  },
  statContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 0,
  },
  statTitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  newsCard: {
    margin: 20,
    marginTop: 10,
  },
  sectionTitle: {
    marginBottom: 15,
    color: colors.primary,
  },
  newsItem: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  newsTitle: {
    fontSize: 16,
    marginBottom: 5,
  },
  newsContent: {
    color: colors.textSecondary,
    marginBottom: 5,
  },
  newsDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  viewAllButton: {
    marginTop: 10,
  },
  quickActions: {
    padding: 20,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: colors.secondary,
  },
})