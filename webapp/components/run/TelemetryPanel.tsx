import { StyleSheet, Text, View } from 'react-native';

import type { RobotTelemetry, WebSocketConnectionState } from '@/types';

type Props = {
  telemetry: RobotTelemetry | null;
  connectionState: WebSocketConnectionState;
};

function connDotColor(state: WebSocketConnectionState): string {
  if (state === 'connected') return '#5C3D2E';
  if (state === 'connecting' || state === 'reconnecting') return '#7C6B5E';
  return '#D5BDAF';
}

function batteryColor(pct: number): string {
  if (pct > 50) return '#5C3D2E';
  if (pct > 20) return '#7C6B5E';
  return '#D5BDAF';
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
    backgroundColor: '#3D2B1F',
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
    backgroundColor: '#5C3D2E',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    color: '#F5EBE0',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  pos: {
    color: '#D5BDAF',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  battery: {
    fontSize: 12,
    fontWeight: '600',
  },
  connLabel: {
    marginLeft: 'auto',
    color: '#D5BDAF',
    fontSize: 11,
  },
});
