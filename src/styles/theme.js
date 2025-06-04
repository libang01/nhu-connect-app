import { DefaultTheme } from "react-native-paper"

export const colors = {
  primary: "#1E88E5", // Cool blue
  secondary: "#D32F2F", // Vibrant red
  background: "#FFFFFF", // White
  surface: "#F5F5F5",
  text: "#212121",
  textSecondary: "#757575",
  accent: "#FF5722",
  success: "#4CAF50",
  warning: "#FF9800",
  error: "#F44336",
}

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    accent: colors.secondary,
    background: colors.background,
    surface: colors.surface,
    text: colors.text,
  },
}
