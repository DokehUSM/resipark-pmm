import { View, Text, Button } from 'react-native';

export default function LoginScreen({ navigation }) {
  return (
    <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
      <Text>Pantalla Login</Text>
      <Button title="Ingresar" onPress={() => navigation.navigate('Onboarding')} />
    </View>
  );
}
