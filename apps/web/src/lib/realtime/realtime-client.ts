'use client';

import { io, type Socket } from 'socket.io-client';
import { realtimeStore } from './realtime.store';
import type {
  ClientToServerEvents,
  RealtimePingPayload,
  ServerToClientEvents,
} from './realtime.types';

const REALTIME_URL =
  process.env.NEXT_PUBLIC_REALTIME_URL ?? 'http://localhost:3001';

type RealtimeSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

class RealtimeClient {
  private accessToken: string | null = null;
  private socket: RealtimeSocket | null = null;

  setAccessToken(token: string | null): void {
    this.accessToken = token;
    if (this.socket) this.socket.auth = { token };
  }

  connect(): void {
    if (!this.accessToken || this.socket?.connected) return;

    const socket = this.getSocket();
    realtimeStore.setState({ status: 'connecting', error: null });
    socket.connect();
  }

  disconnect(): void {
    this.socket?.disconnect();
    realtimeStore.setState({
      status: 'disconnected',
      socketId: null,
      connectedAt: null,
      error: null,
    });
  }

  reconnect(): void {
    this.socket?.disconnect();
    this.connect();
  }

  ping(payload: RealtimePingPayload = {}): void {
    this.getSocket().emit('realtime:ping', payload);
  }

  on<Event extends keyof ServerToClientEvents>(
    event: Event,
    listener: ServerToClientEvents[Event],
  ): () => void {
    const socket = this.getSocket();
    socket.on(event, listener as never);
    return () => socket.off(event, listener as never);
  }

  emit<Event extends keyof ClientToServerEvents>(
    event: Event,
    ...args: Parameters<ClientToServerEvents[Event]>
  ): void {
    this.getSocket().emit(event, ...args);
  }

  onConnectError(listener: (error: Error) => void): () => void {
    const socket = this.getSocket();
    socket.on('connect_error', listener);
    return () => socket.off('connect_error', listener);
  }

  private getSocket(): RealtimeSocket {
    if (this.socket) return this.socket;

    const socket: RealtimeSocket = io(`${REALTIME_URL}/realtime`, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      withCredentials: true,
      auth: (done) => done({ token: this.accessToken }),
    });

    socket.on('connect', () => {
      realtimeStore.setState({
        status: 'connected',
        socketId: socket.id ?? null,
        error: null,
      });
    });
    socket.on('realtime:ready', ({ connectedAt }) => {
      realtimeStore.setState({ connectedAt });
    });
    socket.on('disconnect', () => {
      realtimeStore.setState({
        status: 'disconnected',
        socketId: null,
        connectedAt: null,
      });
    });
    socket.on('connect_error', (error) => {
      realtimeStore.setState({ status: 'error', error: error.message });
    });

    this.socket = socket;
    return socket;
  }
}

export const realtimeClient = new RealtimeClient();
