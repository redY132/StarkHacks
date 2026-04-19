import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ComponentProps, ReactElement } from 'react';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

const ACTIVE_COLOR = '#5C3D2E';
const INACTIVE_COLOR = '#7C6B5E';

function tabIcon(outline: IoniconsName, filled: IoniconsName) {
  return ({ color, focused }: { color: string; focused: boolean }) => (
    <Ionicons name={focused ? filled : outline} size={24} color={color} />
  );
}

export default function TabsLayout(): ReactElement {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarStyle: { borderTopColor: '#D5BDAF', backgroundColor: '#F5EBE0' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: tabIcon('home-outline', 'home'),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: tabIcon('calendar-outline', 'calendar'),
        }}
      />
      <Tabs.Screen
        name="run"
        options={{
          title: 'Run',
          tabBarIcon: tabIcon('hardware-chip-outline', 'hardware-chip'),
        }}
      />
    </Tabs>
  );
}
