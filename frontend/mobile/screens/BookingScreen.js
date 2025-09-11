import { View, Text, Button } from 'react-native';

export default function BookingScreen({ navigation }) {
  return (
    <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
      <Text>Pantalla Booking</Text>
      <Button title="Cuenta" onPress={() => navigation.navigate('Account')} />
    </View>
  );
}
