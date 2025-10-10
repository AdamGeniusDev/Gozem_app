import { Stack } from 'expo-router'

export default function ServicesLayout() {
  return (
    <Stack screenOptions={{headerShown: false}}>
        <Stack.Screen name='reduction'/>   
        <Stack.Screen name='tickets'/>   
        <Stack.Screen name='parrainage'/>   
        <Stack.Screen name='settings'/>   
    </Stack>
  )
}
