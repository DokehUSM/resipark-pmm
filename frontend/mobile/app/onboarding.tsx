import { View, Text, Button } from 'react-native';

export default function OnboardingScreen({ navigation }) {
  return (
    <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
      <Text>Pantalla Onboarding</Text>
      <Button title="Reservar" onPress={() => navigation.navigate('Availability')} />
      <Button title="Cuenta" onPress={() => navigation.navigate('Account')} />
    </View>
  );
}
