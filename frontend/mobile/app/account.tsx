import { View, Text, Button } from 'react-native';

export default function AccountScreen({ navigation }) {
  return (
    <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
      <Text>Pantalla Account</Text>
      <Button title="Cerrar sesión" onPress={() => navigation.navigate('Login')} />
    </View>
  );
}
