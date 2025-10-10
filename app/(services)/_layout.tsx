import { Stack } from 'expo-router'

export default function ServicesLayout() {
  return (
    <Stack screenOptions={{headerShown: false}}>
        <Stack.Screen name='zem'/>
        <Stack.Screen name='tricycle'/>
        <Stack.Screen name='voiture'/>
        <Stack.Screen name='eco'/>
        <Stack.Screen name='heure'/>
        <Stack.Screen name='porto'/>
        <Stack.Screen name='ouidah'/>
        <Stack.Screen name='evenement'/>      
        <Stack.Screen name='aide'/>      
    </Stack>
  )
}
