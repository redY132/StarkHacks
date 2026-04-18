import { Pressable, StyleSheet, Text, View } from 'react-native';

import { robotWebSocket } from '@/lib/websocket';
import { RobotState, type RobotTelemetry, type WebSocketConnectionState } from '@/types';

type Props = {
  telemetry: RobotTelemetry | null;
  connectionState: WebSocketConnectionState;
  hasMap: boolean;
};

const ACTIVE_STATES = new Set([
  RobotState.DISPATCHED,
  RobotState.NAVIGATING,
  RobotState.DELIVERING,
  RobotState.RETURNING,
]);

const ACT_STATES = new Set([
  RobotState.ARRIVED,
  RobotState.VERIFYING_FACE,
  RobotState.WAITING_FOR_FACE,
]);

function sendSafe(cmd: Parameters<typeof robotWebSocket.sendCommand>[0], label: string) {
  try {
    robotWebSocket.sendCommand(cmd);
  } catch {
    console.warn(`CommandPanel: WebSocket not connected, ${label} not sent`);
  }
}

export default function CommandPanel({ telemetry, hasMap }: Props) {
  const state = telemetry?.currentState ?? RobotState.IDLE;

  if (ACT_STATES.has(state)) {
    return null; // ActPhaseOverlay handles these states
  }

  if (state === RobotState.MAPPING) {
    return (
      <View style={styles.bar}>
        <Pressable
          style={[styles.btn, styles.btnDanger]}
          onPress={() => sendSafe({ type: 'EMERGENCY_STOP' }, 'EMERGENCY_STOP')}
        >
          <Text style={styles.btnDangerText}>Stop Mapping</Text>
        </Pressable>
      </View>
    );
  }

  if (ACTIVE_STATES.has(state)) {
    return (
      <View style={styles.bar}>
        <Pressable
          style={[styles.btn, styles.btnDanger]}
          onPress={() => sendSafe({ type: 'EMERGENCY_STOP' }, 'EMERGENCY_STOP')}
        >
          <Text style={styles.btnDangerText}>⚠ Emergency Stop</Text>
        </Pressable>
      </View>
    );
  }

  if (!hasMap || state === RobotState.IDLE || state === RobotState.MAP_READY) {
    return (
      <View style={styles.bar}>
        <Pressable
          style={[styles.btn, styles.btnPrimary]}
          onPress={() => sendSafe({ type: 'START_MAPPING' }, 'START_MAPPING')}
        >
          <Text style={styles.btnPrimaryText}>Start Mapping</Text>
        </Pressable>
      </View>
    );
  }

  // READY state with a map
  return (
    <View style={styles.bar}>
      <Pressable style={[styles.btn, styles.btnPrimary]}>
        <Text style={styles.btnPrimaryText}>Send Now</Text>
      </Pressable>
      <Pressable
        style={[styles.btn, styles.btnDanger]}
        onPress={() => sendSafe({ type: 'EMERGENCY_STOP' }, 'EMERGENCY_STOP')}
      >
        <Text style={styles.btnDangerText}>⚠ Stop</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    paddingBottom: 24,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnPrimary: { backgroundColor: '#111' },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnDanger: { backgroundColor: '#FEE2E2' },
  btnDangerText: { color: '#DC2626', fontWeight: '700', fontSize: 15 },
});
