// src/screens/manager/ManagerDashboard.js

import { View, Text, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { auth } from '../../firebase/firebase.config'; 
import { signOut } from 'firebase/auth'; 
import { colors } from '../../styles/theme'; 

export default function ManagerDashboard({ navigation }) {
  const handleLogout = async () => {
    try {
      await signOut(auth); 
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
        buttonColor={colors.primary} 
      >
        Manage Teams
      </Button>

      <Button
        mode="contained"
        onPress={() => navigation.navigate('PlayerManagement')}
        style={styles.button}
        buttonColor={colors.primary} 
      >
        Manage Players
      </Button>

      {}
      <Button
        mode="contained"
        onPress={() => navigation.navigate('Events')} 
        style={styles.button}
        buttonColor={colors.secondary} 
      >
        View Events
      </Button>

      {}
      <Button
        mode="contained"
        onPress={() => navigation.navigate('News')} 
        style={styles.button}
        buttonColor={colors.secondary} 
      >
        View News
      </Button>

      <Button
        mode="outlined"
        onPress={handleLogout}
        style={[styles.button, styles.logoutButton]}
        textColor={colors.primary} 
        rippleColor={colors.primaryLight} 
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
    backgroundColor: colors.background, 
    justifyContent: 'center',
    alignItems: 'center', 
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: colors.textPrimary, 
  },
  button: {
    width: '80%', 
    marginVertical: 10,
    paddingVertical: 5,
    borderRadius: 8, 
  },
  logoutButton: {
    marginTop: 30,
    borderColor: colors.primary, 
  }
});