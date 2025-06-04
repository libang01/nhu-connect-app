import { View, StyleSheet } from "react-native"
import { ActivityIndicator, Text } from "react-native-paper"
import { colors } from "../styles/theme"

export default function LoadingScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.text}>Loading NHU Connect...</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  text: {
    marginTop: 20,
    fontSize: 16,
    color: colors.textSecondary,
  },
})
