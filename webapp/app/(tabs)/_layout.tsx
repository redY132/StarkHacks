import { Tabs } from 'expo-router';
import type { ReactElement } from 'react';

export default function TabsLayout(): ReactElement {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="run" options={{ title: 'Run' }} />
    </Tabs>
  );
}
