import type { ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/contexts/AuthProvider';

export default function HomeIndex(): ReactElement {
  const { user, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Signed in</Text>
      <Text style={styles.meta}>{user?.email}</Text>
      <Text style={styles.meta}>Role: {user?.role}</Text>
      <Pressable style={styles.button} onPress={() => void signOut()}>
        <Text style={styles.buttonLabel}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
  },
  meta: {
    fontSize: 16,
    color: '#444',
  },
  button: {
    marginTop: 16,
    alignSelf: 'flex-start',
    backgroundColor: '#111',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonLabel: {
    color: '#fff',
    fontWeight: '600',
  },
});
