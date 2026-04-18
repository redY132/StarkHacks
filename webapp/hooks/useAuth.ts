import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useRouter, useSegments } from 'expo-router';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import React, {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactElement, ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { auth, db } from '@/lib/firebase';
import type { User, UserRole } from '@/types';

WebBrowser.maybeCompleteAuthSession();

const defaultRole: UserRole = 'caregiver';

async function ensureUserDocument(firebaseUser: FirebaseUser): Promise<UserRole> {
  const ref = doc(db, 'users', firebaseUser.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const role: UserRole = defaultRole;
    await setDoc(ref, {
      email: firebaseUser.email ?? '',
      role,
      createdAt: serverTimestamp(),
    });
    return role;
  }
  const data = snap.data() as { role?: UserRole };
  return data.role ?? defaultRole;
}

function mapFirebaseUser(firebaseUser: FirebaseUser, role: UserRole): User {
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email ?? '',
    role,
  };
}

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function signInWithGoogleInternal(): Promise<void> {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  if (!webClientId) {
    throw new Error('Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID');
  }

  const discovery = await AuthSession.fetchDiscoveryAsync(
    'https://accounts.google.com/.well-known/openid-configuration',
  );

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'panko',
    path: 'oauth',
  });

  const nonce = `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;

  const request = new AuthSession.AuthRequest({
    clientId: webClientId,
    scopes: ['openid', 'profile', 'email'],
    responseType: AuthSession.ResponseType.IdToken,
    redirectUri,
    extraParams: {
      nonce,
    },
  });

  const result = await request.promptAsync(discovery);

  if (result.type !== 'success') {
    throw new Error(result.type === 'cancel' ? 'Sign-in cancelled' : 'Google sign-in failed');
  }

  const idToken =
    typeof result.params.id_token === 'string'
      ? result.params.id_token
      : typeof (result.params as { id_token?: string }).id_token === 'string'
        ? (result.params as { id_token?: string }).id_token
        : undefined;

  if (!idToken) {
    throw new Error('Missing Google ID token');
  }

  const credential = GoogleAuthProvider.credential(idToken);
  await signInWithCredential(auth, credential);
}

export function AuthProvider({ children }: { children: ReactNode }): ReactElement {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (!firebaseUser) {
          setUser(null);
          return;
        }
        const role = await ensureUserDocument(firebaseUser);
        setUser(mapFirebaseUser(firebaseUser, role));
      } catch (error) {
        console.error('Auth state error', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await signInWithGoogleInternal();
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      signInWithGoogle,
      signInWithEmail,
      signOut,
    }),
    [user, loading, signInWithGoogle, signInWithEmail, signOut],
  );

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export function AuthRouterShell({ children }: { children: ReactNode }): ReactElement {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return;
    }
    const inAuthGroup = segments.includes('sign-in');

    if (!user && !inAuthGroup) {
      router.replace('/sign-in');
      return;
    }
    if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, loading, segments, router]);

  if (loading) {
    return createElement(
      View,
      { style: styles.centered },
      createElement(ActivityIndicator, { size: 'large' }),
    );
  }

  return createElement(React.Fragment, null, children);
}
