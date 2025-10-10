import { Stack } from 'expo-router'

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{headerShown: false}}>
        <Stack.Screen name='langue'/>
        <Stack.Screen name='notification'/>
        <Stack.Screen name='updatePassword'/>   
        <Stack.Screen name='deleteAccount'/>   
    </Stack>
  )
}
