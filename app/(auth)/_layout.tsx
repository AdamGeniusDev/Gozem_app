// app/(auth)/_layout.tsx
import React from 'react'
import { Redirect, Stack, useSegments } from 'expo-router'
import { useAuth } from '@clerk/clerk-expo'

export default function AuthLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();            // p.ex. ['(auth)', 'info']
  if (!isLoaded) return null;

  const onInfo = segments[1] === 'info';

  // 🔑 Si connecté, on autorise seulement /info. Tout le reste renvoie à /
  if (isSignedIn && !onInfo) return <Redirect href='/' />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="info" />
      <Stack.Screen name="sign" />
      <Stack.Screen name="verification" />
      <Stack.Screen name="password" />
      <Stack.Screen name="signIn" />
      <Stack.Screen name="forgotPassword" />
    </Stack>
  );
}
