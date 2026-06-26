/* ============================================================
   CROWDSENSE AI — WEBSOCKET HOOKS
   Real-time data connections
   ============================================================ */

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

interface UseWebSocketOptions {
  url: string;
  onMessage?: (data: unknown) => void;
  onBinaryMessage?: (data: Blob) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  reconnect?: boolean;
  maxRetries?: number;
  baseDelay?: number;
  binaryType?: BinaryType;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  send: (data: string | ArrayBuffer) => void;
  close: () => void;
}

export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const {
    url,
    onMessage,
    onBinaryMessage,
    onOpen,
    onClose,
    onError,
    reconnect = true,
    maxRetries = 10,
    baseDelay = 1000,
    binaryType = 'blob',
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(url);
      ws.binaryType = binaryType;
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        setIsConnected(true);
        retriesRef.current = 0;
        onOpen?.();
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        if (event.data instanceof Blob) {
          onBinaryMessage?.(event.data);
        } else {
          try {
            const parsed = JSON.parse(event.data);
            onMessage?.(parsed);
          } catch {
            // Non-JSON text message (e.g. "pong")
          }
        }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setIsConnected(false);
        onClose?.();

        if (reconnect && retriesRef.current < maxRetries) {
          const delay = baseDelay * Math.pow(1.5, retriesRef.current);
          retriesRef.current++;
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        }
      };

      ws.onerror = (error) => {
        if (!mountedRef.current) return;
        onError?.(error);
      };
    } catch {
      // Connection failed, will retry via onclose
    }
  }, [url, onMessage, onBinaryMessage, onOpen, onClose, onError, reconnect, maxRetries, baseDelay, binaryType]);

  const send = useCallback((data: string | ArrayBuffer) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(data);
    }
  }, []);

  const close = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    // Ping to keep alive
    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send('ping');
      }
    }, 30000);

    return () => {
      mountedRef.current = false;
      clearInterval(pingInterval);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect]);

  return { isConnected, send, close };
}

// ── Camera Feed Hook (binary JPEG frames) ──

export function useCameraFeed(
  cameraId: number | null,
  onFrame: (imageUrl: string) => void
) {
  const prevUrlRef = useRef<string | null>(null);
  const wsUrl = cameraId
    ? `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'}/ws/camera/${cameraId}/feed`
    : '';

  return useWebSocket({
    url: wsUrl,
    binaryType: 'blob',
    onBinaryMessage: (blob) => {
      // Revoke previous URL to prevent memory leaks
      if (prevUrlRef.current) {
        URL.revokeObjectURL(prevUrlRef.current);
      }
      const url = URL.createObjectURL(blob);
      prevUrlRef.current = url;
      onFrame(url);
    },
    reconnect: !!cameraId,
  });
}

// ── Camera Analytics Hook (JSON) ──

export function useCameraAnalytics(
  cameraId: number | null,
  onData: (data: unknown) => void
) {
  const wsUrl = cameraId
    ? `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'}/ws/camera/${cameraId}/analytics`
    : '';

  return useWebSocket({
    url: wsUrl,
    onMessage: onData,
    reconnect: !!cameraId,
  });
}

// ── Global Alerts Hook ──

export function useAlertStream(onAlert: (data: unknown) => void) {
  const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'}/ws/alerts`;

  return useWebSocket({
    url: wsUrl,
    onMessage: onAlert,
    reconnect: true,
  });
}
