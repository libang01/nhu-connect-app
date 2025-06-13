// src/navigation/AppNavigation.js

import { useEffect, useState } from 'react';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase.config';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// --- Import all your screens ---
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';

// Admin Screens
import AdminDashboard from '../screens/admin/AdminDashboard';
// Ensure this path is correct if ManageTeamsScreen is also in src/screens/admin/
import ManageTeamsScreen from '../screens/admin/ManageTeamsScreen'; 
import ManagePlayersScreen from '../screens/admin/ManagePlayersScreen';
import CreateEventScreen from '../screens/events/CreateEventScreen';
import CreateNewsScreen from '../screens/news/CreateNewsScreen';

// Event Screens (Accessible by multiple roles)
import EventsScreen from '../screens/events/EventsScreen';
import EventDetailsScreen from '../screens/events/EventDetailsScreen';

// Manager Screens
import ManagerDashboard from '../screens/manager/ManagerDashboard';
import TeamManagement from '../screens/manager/TeamManagement';
import PlayerManagementScreen from '../screens/manager/PlayerManagement';

// News Screens (Accessible by multiple roles)
import NewsDetailsScreen from '../screens/news/NewsDetailsScreen';
import NewsScreen from '../screens/news/NewsScreen';

// Player Screens (Accessible by multiple roles)
import PlayerDetailsScreen from '../screens/players/PlayerDetailsScreen';
import PlayersScreen from '../screens/players/PlayersScreen';

// Team Screens (Accessible by multiple roles)
import RegisterTeamScreen from '../screens/teams/RegisterTeamScreen';
import TeamDetailsScreen from '../screens/teams/TeamDetailsScreen';
import TeamScreen from '../screens/teams/TeamsScreen';


const Stack = createNativeStackNavigator();

// --- Define separate Stack Navigators for each role ---

function AdminStackScreens() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
      <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
      <Stack.Screen name="CreateNews" component={CreateNewsScreen} />
      <Stack.Screen name="ManageTeams" component={ManageTeamsScreen} />
      <Stack.Screen name="ManagePlayers" component={ManagePlayersScreen} />
      {/* Assuming ManageEvents and ManageNews are separate screens, you would add them here too */}
      {/* <Stack.Screen name="ManageEvents" component={ManageEventsScreen} /> */}
      {/* <Stack.Screen name="ManageNews" component={ManageNewsScreen} /> */}
      {/* You might want to make Profile and EditProfile also accessible to admins from here */}
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Events" component={EventsScreen} />
      <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
      <Stack.Screen name="News" component={NewsScreen} />
      <Stack.Screen name="NewsDetails" component={NewsDetailsScreen} />
      <Stack.Screen name="Team" component={TeamScreen} />
      <Stack.Screen name="TeamDetails" component={TeamDetailsScreen} />
      <Stack.Screen name="PlayersScreen" component={PlayersScreen} />
      <Stack.Screen name="PlayerDetails" component={PlayerDetailsScreen} />
      <Stack.Screen name="RegisterTeam" component={RegisterTeamScreen} />
    </Stack.Navigator>
  );
}

function ManagerStackScreens() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ManagerDashboard" component={ManagerDashboard} />
      <Stack.Screen name="TeamManagement" component={TeamManagement} />
      <Stack.Screen name="PlayerManagement" component={PlayerManagementScreen} />
      <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
      <Stack.Screen name="CreateNews" component={CreateNewsScreen} />
      {/* Also make general screens accessible to managers */}
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Events" component={EventsScreen} />
      <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
      <Stack.Screen name="News" component={NewsScreen} />
      <Stack.Screen name="NewsDetails" component={NewsDetailsScreen} />
      <Stack.Screen name="Team" component={TeamScreen} />
      <Stack.Screen name="TeamDetails" component={TeamDetailsScreen} />
      <Stack.Screen name="PlayersScreen" component={PlayersScreen} />
      <Stack.Screen name="PlayerDetails" component={PlayerDetailsScreen} />
      <Stack.Screen name="RegisterTeam" component={RegisterTeamScreen} />
    </Stack.Navigator>
  );
}

function PlayerStackScreens() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PlayersScreen" component={PlayersScreen} />
      <Stack.Screen name="PlayerDetails" component={PlayerDetailsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Events" component={EventsScreen} />
      <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
      <Stack.Screen name="News" component={NewsScreen} />
      <Stack.Screen name="NewsDetails" component={NewsDetailsScreen} />
      <Stack.Screen name="Team" component={TeamScreen} />
      <Stack.Screen name="TeamDetails" component={TeamDetailsScreen} />
      <Stack.Screen name="RegisterTeam" component={RegisterTeamScreen} />
    </Stack.Navigator>
  );
}


export default function AppNavigation() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          const role = userDoc.exists() ? (userDoc.data()?.role || 'player') : 'player';
          setUserRole(role);
        } catch (error) {
          console.error("Error fetching user role:", error);
          setUserRole('player'); 
        }
      } else {
        setUserRole('guest');
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading App...</Text>
      </View>
    );
  }

  
  let AppRootNavigator;
  if (user && userRole) {
    if (userRole === 'admin') {
      AppRootNavigator = AdminStackScreens;
    } else if (userRole === 'manager') {
      AppRootNavigator = ManagerStackScreens;
    } else if (userRole === 'player') {
      AppRootNavigator = PlayerStackScreens;
    } else {
      AppRootNavigator = GuestStackScreens; 
    }
  } else {
    AppRootNavigator = GuestStackScreens; 
  }

  return (
    
    <AppRootNavigator />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f4f7',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 18,
    color: '#555',
    fontWeight: '500',
  },
});