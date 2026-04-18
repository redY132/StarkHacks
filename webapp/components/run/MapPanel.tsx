import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';

import { RobotState, type RobotTelemetry, type Room } from '@/types';

type Props = {
  telemetry: RobotTelemetry | null;
  rooms: Room[];
};

type MapDims = { width: number; height: number };

const ROOM_COLORS = [
  '#DBEAFE', '#D1FAE5', '#FEF3C7', '#FCE7F3', '#EDE9FE', '#FFEDD5', '#E0F2FE',
];

function getRoomColor(index: number): string {
  return ROOM_COLORS[index % ROOM_COLORS.length];
}

function computeBounds(rooms: Room[]) {
  const allPts = rooms.flatMap((r) => r.polygonCoordinates);
  if (allPts.length === 0) return null;
  let minX = allPts[0].x, maxX = allPts[0].x;
  let minY = allPts[0].y, maxY = allPts[0].y;
  for (const p of allPts) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, maxX, minY, maxY };
}

function scalePoint(
  x: number,
  y: number,
  bounds: NonNullable<ReturnType<typeof computeBounds>>,
  dims: MapDims,
) {
  const rangeX = bounds.maxX - bounds.minX || 1;
  const rangeY = bounds.maxY - bounds.minY || 1;
  return {
    left: ((x - bounds.minX) / rangeX) * dims.width,
    top: ((y - bounds.minY) / rangeY) * dims.height,
  };
}

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

function ReadyState({
  rooms,
  telemetry,
}: {
  rooms: Room[];
  telemetry: RobotTelemetry | null;
}) {
  const [dims, setDims] = useState<MapDims | null>(null);
  const hasPolygons = rooms.some((r) => r.polygonCoordinates.length > 0);

  if (!hasPolygons) {
    return (
      <View style={styles.chipList}>
        {rooms.map((room, i) => (
          <View key={room.id} style={[styles.chip, { backgroundColor: getRoomColor(i) }]}>
            <Text style={styles.chipText}>{room.name}</Text>
          </View>
        ))}
      </View>
    );
  }

  const bounds = computeBounds(rooms);

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setDims({ width, height });
  };

  return (
    <View style={styles.mapContainer} onLayout={handleLayout}>
      {dims &&
        bounds &&
        rooms.map((room, i) => {
          const pts = room.polygonCoordinates;
          if (pts.length === 0) return null;

          const xs = pts.map((p) => p.x);
          const ys = pts.map((p) => p.y);
          const topLeft = scalePoint(Math.min(...xs), Math.min(...ys), bounds, dims);
          const botRight = scalePoint(Math.max(...xs), Math.max(...ys), bounds, dims);
          const w = Math.max(botRight.left - topLeft.left, 20);
          const h = Math.max(botRight.top - topLeft.top, 20);

          return (
            <Pressable
              key={room.id}
              style={[
                styles.roomBox,
                {
                  left: topLeft.left,
                  top: topLeft.top,
                  width: w,
                  height: h,
                  backgroundColor: getRoomColor(i),
                },
              ]}
              onPress={() => Alert.alert(room.name, `Room ID: ${room.id}`)}
            >
              <Text style={styles.roomLabel} numberOfLines={2}>
                {room.name}
              </Text>
            </Pressable>
          );
        })}

      {dims && bounds && telemetry?.position && (() => {
        const pos = scalePoint(
          telemetry.position.x,
          telemetry.position.y,
          bounds,
          dims,
        );
        return (
          <View style={[styles.robotDot, { left: pos.left - 6, top: pos.top - 6 }]} />
        );
      })()}
    </View>
  );
}

export default function MapPanel({ telemetry, rooms }: Props) {
  const state = telemetry?.currentState ?? RobotState.IDLE;

  if (state === RobotState.MAPPING) {
    return (
      <View style={styles.panel}>
        <MappingState />
      </View>
    );
  }

  if (rooms.length === 0) {
    return (
      <View style={styles.panel}>
        <EmptyState />
      </View>
    );
  }

  return (
    <View style={styles.panel}>
      <ReadyState rooms={rooms} telemetry={telemetry} />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    backgroundColor: '#F3F4F6',
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
    borderColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  robotInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D1D5DB',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  pulseCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3B82F6',
    marginBottom: 32,
  },
  mappingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  roomBox: {
    position: 'absolute',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  roomLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  robotDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#fff',
  },
  chipList: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 8,
    alignContent: 'flex-start',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
});
