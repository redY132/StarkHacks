import { StyleSheet, Text, View } from 'react-native';

import type { RobotTelemetry, WebSocketConnectionState } from '@/types';

type Props = {
  telemetry: RobotTelemetry | null;
  connectionState: WebSocketConnectionState;
};

function connDotColor(state: WebSocketConnectionState): string {
  if (state === 'connected') return '#22C55E';
  if (state === 'connecting' || state === 'reconnecting') return '#F59E0B';
  return '#EF4444';
}

function batteryColor(pct: number): string {
  if (pct > 50) return '#22C55E';
  if (pct > 20) return '#F59E0B';
  return '#EF4444';
}

export default function TelemetryPanel({ telemetry, connectionState }: Props) {
  const dotColor = connDotColor(connectionState);
  const state = telemetry?.currentState ?? 'IDLE';
  const pos = telemetry?.position;
  const battery = telemetry?.battery;

  return (
    <View style={styles.bar}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{state}</Text>
      </View>
      {pos != null && (
        <Text style={styles.pos}>
          x:{pos.x.toFixed(1)} y:{pos.y.toFixed(1)}
        </Text>
      )}
      {battery != null && (
        <Text style={[styles.battery, { color: batteryColor(battery) }]}>
          {battery}%
        </Text>
      )}
      <Text style={styles.connLabel}>{connectionState}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  badge: {
    backgroundColor: '#3A3A3C',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  pos: {
    color: '#9CA3AF',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  battery: {
    fontSize: 12,
    fontWeight: '600',
  },
  connLabel: {
    marginLeft: 'auto',
    color: '#6B7280',
    fontSize: 11,
  },
});
