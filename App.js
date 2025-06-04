import { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { Provider as PaperProvider } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./src/firebase/firebase.config";
import { AuthContext } from "./src/contexts/AuthContext";
import { theme } from "./src/styles/theme";
import AuthNavigator from "./src/navigation/AuthNavigator";
import AppNavigator from "./src/navigation/AppNavigator";
import LoadingScreen from "./src/screens/LoadingScreen";

async function fetchUserRoleWithRetry(uid) {
  const userDocRef = doc(db, "users", uid);
  const maxAttempts = 5;
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        return userDoc.data().role;
      } else {
        return null; // user doc not found
      }
    } catch (error) {
      // Check for offline or unavailable errors and retry
      if (error.code === 'unavailable' || error.message?.toLowerCase().includes('client is offline')) {
        attempts++;
        await new Promise((res) => setTimeout(res, 3000)); // wait 3 seconds before retry
      } else {
        throw error; // rethrow if it's a different error
      }
    }
  }
  throw new Error("Failed to fetch user role after multiple attempts due to offline/unavailable error.");
}

export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          setUser(currentUser);
          try {
            const role = await fetchUserRoleWithRetry(currentUser.uid);
            setUserRole(role);
          } catch (fetchError) {
            console.error("Error fetching user role with retry:", fetchError);
            setUserRole(null);
          }
        } else {
          setUser(null);
          setUserRole(null);
        }
      } catch (error) {
        console.error("Error in auth state or user role fetch:", error);
      } finally {
        setLoading(false);
        setAppReady(true);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  if (loading || !appReady) {
    return (
      <PaperProvider theme={theme}>
        <LoadingScreen />
      </PaperProvider>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <AuthContext.Provider value={{ user, userRole, setUser, setUserRole }}>
        <NavigationContainer>
          <StatusBar style="auto" />
          {user ? <AppNavigator /> : <AuthNavigator />}
        </NavigationContainer>
      </AuthContext.Provider>
    </PaperProvider>
  );
}
