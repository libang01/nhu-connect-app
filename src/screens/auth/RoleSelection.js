import { View, Text, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function RoleSelection() {
  const navigation = useNavigation();

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Text>Select your role:</Text>
      <Button 
        title="Register as Player" 
        onPress={() => navigation.navigate('Register', { role: 'player' })}
      />
      <Button
        title="Register as Manager"
        onPress={() => navigation.navigate('Register', { role: 'manager' })}
      />
    </View>
  );
}