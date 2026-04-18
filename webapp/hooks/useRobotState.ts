import { useEffect, useState } from 'react';

import { robotWebSocket } from '@/lib/websocket';
import type { RobotTelemetry, WebSocketConnectionState } from '@/types';

export function useRobotState() {
  const [telemetry, setTelemetry] = useState<RobotTelemetry | null>(null);
  const [connectionState, setConnectionState] = useState<WebSocketConnectionState>('disconnected');

  useEffect(() => {
    const unsubTelemetry = robotWebSocket.subscribeToTelemetry(setTelemetry);
    const unsubConnection = robotWebSocket.subscribeToConnectionState(setConnectionState);
    return () => {
      unsubTelemetry();
      unsubConnection();
    };
  }, []);

  return { telemetry, connectionState };
}
