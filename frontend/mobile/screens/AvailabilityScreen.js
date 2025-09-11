import { View, Text, Button } from 'react-native';

export default function AvailabilityScreen({ navigation }) {
  return (
    <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
      <Text>Pantalla Availability</Text>
      <Button title="Reservar espacio" onPress={() => navigation.navigate('Booking')} />
      <Button title="Cuenta" onPress={() => navigation.navigate('Account')} />
    </View>
  );
}
