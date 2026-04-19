import { useState } from 'react';
import type { ReactElement } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '@/contexts/AuthProvider';

export default function SignInScreen(): ReactElement {
  const { signInWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // const onGoogle = async () => {
  //   setError(null);
  //   setBusy(true);
  //   try {
  //     await signInWithGoogle();
  //   } catch (e) {
  //     setError(e instanceof Error ? e.message : 'Sign-in failed');
  //   } finally {
  //     setBusy(false);
  //   }
  // };

  const onEmail = async () => {
    setError(null);
    setBusy(true);
    try {
      await signInWithEmail(email, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Panko</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {/* <Pressable style={styles.button} onPress={onGoogle} disabled={busy}>
        <Text style={styles.buttonLabel}>Continue with Google</Text>
      </Pressable>
      <Text style={styles.hint}>
        If Google says the app is not allowed: use the same Google Cloud project as your Web client ID → APIs & Services →
        OAuth consent screen. Complete required fields; while Publishing status is Testing, add your Gmail under Test users;
        for Expo web, add your site host under Authorized domains.
      </Text> */}
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#7C6B5E"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#7C6B5E"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Pressable style={styles.button} onPress={onEmail} disabled={busy}>
        <Text style={styles.buttonLabel}>Sign in or create account</Text>
      </Pressable>
      {busy ? <ActivityIndicator style={styles.spinner} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#EDEDE9',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 12,
    color: '#3D2B1F',
  },
  error: {
    color: '#b00020',
  },
  hint: {
    fontSize: 12,
    color: '#7C6B5E',
    lineHeight: 17,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D5BDAF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#E3D5CA',
    color: '#3D2B1F',
  },
  button: {
    backgroundColor: '#5C3D2E',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonLabel: {
    color: '#F5EBE0',
    fontWeight: '600',
  },
  spinner: {
    marginTop: 8,
  },
});
