"use client"
import { View, StyleSheet } from "react-native"
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer"
import { Avatar, Title, Caption, Drawer } from "react-native-paper"
import { Ionicons } from "@expo/vector-icons"
import { signOut } from "firebase/auth"
import { auth } from "../../firebase.config"
import { useAuth } from "../contexts/AuthContext"
import { colors } from "../styles/theme"

export default function CustomDrawerContent(props) {
  const { user, userRole } = useAuth()

  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <View style={styles.container}>
      <DrawerContentScrollView {...props}>
        <View style={styles.drawerContent}>
          <View style={styles.userInfoSection}>
            <View style={styles.userInfo}>
              <Avatar.Text size={50} label={user?.email?.charAt(0).toUpperCase() || "U"} style={styles.avatar} />
              <View style={styles.userDetails}>
                <Title style={styles.title}>{user?.email}</Title>
                <Caption style={styles.caption}>{userRole}</Caption>
              </View>
            </View>
          </View>

          <Drawer.Section style={styles.drawerSection}>
            <DrawerItem
              icon={({ color, size }) => <Ionicons name="home-outline" color={color} size={size} />}
              label="Home"
              onPress={() => props.navigation.navigate("MainTabs")}
            />
            <DrawerItem
              icon={({ color, size }) => <Ionicons name="people-outline" color={color} size={size} />}
              label="Teams"
              onPress={() => props.navigation.navigate("MainTabs", { screen: "Teams" })}
            />
            <DrawerItem
              icon={({ color, size }) => <Ionicons name="person-outline" color={color} size={size} />}
              label="Players"
              onPress={() => props.navigation.navigate("Players")}
            />
            <DrawerItem
              icon={({ color, size }) => <Ionicons name="calendar-outline" color={color} size={size} />}
              label="Events"
              onPress={() => props.navigation.navigate("MainTabs", { screen: "Events" })}
            />
            <DrawerItem
              icon={({ color, size }) => <Ionicons name="newspaper-outline" color={color} size={size} />}
              label="News"
              onPress={() => props.navigation.navigate("MainTabs", { screen: "News" })}
            />
            <DrawerItem
              icon={({ color, size }) => <Ionicons name="person-circle-outline" color={color} size={size} />}
              label="Profile"
              onPress={() => props.navigation.navigate("Profile")}
            />
          </Drawer.Section>
        </View>
      </DrawerContentScrollView>

      <Drawer.Section style={styles.bottomDrawerSection}>
        <DrawerItem
          icon={({ color, size }) => <Ionicons name="log-out-outline" color={color} size={size} />}
          label="Sign Out"
          onPress={handleLogout}
        />
      </Drawer.Section>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  drawerContent: {
    flex: 1,
  },
  userInfoSection: {
    paddingLeft: 20,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    backgroundColor: colors.primary,
  },
  userDetails: {
    marginLeft: 15,
    flexDirection: "column",
  },
  title: {
    fontSize: 16,
    marginTop: 3,
    fontWeight: "bold",
  },
  caption: {
    fontSize: 14,
    lineHeight: 14,
    textTransform: "capitalize",
  },
  drawerSection: {
    marginTop: 15,
  },
  bottomDrawerSection: {
    marginBottom: 15,
    borderTopColor: colors.surface,
    borderTopWidth: 1,
  },
})
