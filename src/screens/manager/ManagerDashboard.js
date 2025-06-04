// src/screens/manager/ManagerDashboard.js

import { View, Text, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { auth } from '../../firebase/firebase.config'; // <--- CORRECTED PATH HERE
import { signOut } from 'firebase/auth'; // Make sure signOut is imported
import { colors } from '../../styles/theme'; // Assuming you have a theme file with colors

export default function ManagerDashboard({ navigation }) {
  const handleLogout = async () => {
    try {
      await signOut(auth); // Use signOut(auth) as auth.signOut() is an older syntax
      // The onAuthStateChanged listener in AppNavigation.js will automatically
      // handle redirecting to the appropriate public screen (e.g., login) upon logout.
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manager Dashboard</Text>

      <Button
        mode="contained"
        onPress={() => navigation.navigate('TeamManagement')}
        style={styles.button}
        buttonColor={colors.primary} // Using theme colors for consistency
      >
        Manage Teams
      </Button>

      <Button
        mode="contained"
        onPress={() => navigation.navigate('PlayerManagement')}
        style={styles.button}
        buttonColor={colors.primary} // Using theme colors for consistency
      >
        Manage Players
      </Button>

      {/* NEW: Button to View Events */}
      <Button
        mode="contained"
        onPress={() => navigation.navigate('Events')} // Assuming 'Events' is the name of your general events screen
        style={styles.button}
        buttonColor={colors.secondary} // Using a different color for "view" actions
      >
        View Events
      </Button>

      {/* NEW: Button to View News */}
      <Button
        mode="contained"
        onPress={() => navigation.navigate('News')} // Assuming 'News' is the name of your general news screen
        style={styles.button}
        buttonColor={colors.secondary} // Using a different color for "view" actions
      >
        View News
      </Button>

      <Button
        mode="outlined"
        onPress={handleLogout}
        style={[styles.button, styles.logoutButton]}
        textColor={colors.primary} // Text color for outlined button
        rippleColor={colors.primaryLight} // Ripple effect for outlined button
      >
        Logout
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background, // Use background color from theme
    justifyContent: 'center', // Center content vertically
    alignItems: 'center', // Center content horizontally
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: colors.textPrimary, // Use text primary color from theme
  },
  button: {
    width: '80%', // Make buttons take up more width
    marginVertical: 10,
    paddingVertical: 5,
    borderRadius: 8, // Slightly rounded corners for a modern look
  },
  logoutButton: {
    marginTop: 30,
    borderColor: colors.primary, // Border color for the outlined logout button
  }
});