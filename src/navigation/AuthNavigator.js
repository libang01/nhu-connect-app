// src/navigation/AuthNavigator.js

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import your authentication screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import RoleSelectionScreen from '../screens/auth/RoleSelection'; // Confirm file name and path

const AuthStack = createNativeStackNavigator();

export default function AuthNavigator() {
  return (
    <AuthStack.Navigator
      initialRouteName="Login"  // explicitly set initial screen
      screenOptions={{ headerShown: false }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <AuthStack.Screen name="RoleSelection" component={RoleSelectionScreen} />
    </AuthStack.Navigator>
  );
}
