import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { RobotState, type RobotTelemetry, type Room } from '@/types';

type Props = {
  telemetry: RobotTelemetry | null;
  rooms: Room[]; // reserved for future map-ready display post-SLAM
};

function PulsingCircle() {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1.3,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1.0,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, { toValue: 0.8, duration: 600, useNativeDriver: true }),
        ]),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, scale]);

  return (
    <Animated.View style={[styles.pulseCircle, { transform: [{ scale }], opacity }]} />
  );
}

function EmptyState() {
  return (
    <View style={styles.centered}>
      <View style={styles.robotIcon}>
        <View style={styles.robotInner} />
      </View>
      <Text style={styles.emptyTitle}>No map yet</Text>
      <Text style={styles.emptySubtitle}>
        Tap "Start Mapping" below to scan your space.{'\n'}
        The robot will explore the area like a Roomba{'\n'}
        and build a floor plan automatically.
      </Text>
    </View>
  );
}

function MappingState() {
  return (
    <View style={styles.centered}>
      <PulsingCircle />
      <Text style={styles.mappingTitle}>Mapping in progress…</Text>
      <Text style={styles.emptySubtitle}>
        Stay clear while the robot explores.{'\n'}
        This may take a few minutes.
      </Text>
    </View>
  );
}

export default function MapPanel({ telemetry }: Props) {
  const state = telemetry?.currentState ?? RobotState.IDLE;

  if (state === RobotState.MAPPING) {
    return (
      <View style={styles.panel}>
        <MappingState />
      </View>
    );
  }

  return (
    <View style={styles.panel}>
      <EmptyState />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    backgroundColor: '#EDEDE9',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  robotIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: '#D5BDAF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  robotInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D6CCC2',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3D2B1F',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#7C6B5E',
    textAlign: 'center',
    lineHeight: 22,
  },
  pulseCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#5C3D2E',
    marginBottom: 32,
  },
  mappingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3D2B1F',
    marginBottom: 12,
    textAlign: 'center',
  },
});
