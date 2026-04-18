import 'react-native-gesture-handler';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { ReactElement } from 'react';

import { AuthProvider, AuthRouterShell } from '@/hooks/useAuth';

export default function RootLayout(): ReactElement {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <AuthRouterShell>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthRouterShell>
    </AuthProvider>
  );
}
