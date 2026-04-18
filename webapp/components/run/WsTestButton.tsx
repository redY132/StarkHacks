import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { robotWebSocket } from '@/lib/websocket';

export default function WsTestButton() {
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [lastSentTs, setLastSentTs] = useState<number | null>(null);

  useEffect(() => {
    return robotWebSocket.subscribeToRawMessage((raw) => {
      setLastMessage(raw.length > 200 ? raw.slice(0, 200) + '…' : raw);
    });
  }, []);

  function handlePress() {
    const ts = Date.now();
    try {
      robotWebSocket.sendCommand({ type: 'PING', ts });
      setLastSentTs(ts);
    } catch (e) {
      setLastMessage(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <View style={styles.container}>
      {lastMessage != null && (
        <View style={styles.card}>
          {lastSentTs != null && (
            <Text style={styles.cardMeta}>
              sent {new Date(lastSentTs).toLocaleTimeString()}
            </Text>
          )}
          <Text style={styles.cardBody}>{lastMessage}</Text>
        </View>
      )}
      <Pressable style={styles.pill} onPress={handlePress}>
        <Text style={styles.pillText}>WS Test</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    alignItems: 'flex-end',
    gap: 8,
  },
  card: {
    backgroundColor: '#1C1C1E',
    borderRadius: 10,
    padding: 10,
    maxWidth: 260,
  },
  cardMeta: {
    color: '#6B7280',
    fontSize: 10,
    marginBottom: 4,
  },
  cardBody: {
    color: '#D1FAE5',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  pill: {
    backgroundColor: '#111',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  pillText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
});
