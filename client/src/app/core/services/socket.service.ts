import { Injectable, NgZone, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';

/**
 * Canonical real-time event names — must stay in sync with the server's
 * SocketEvents constant in `src/sockets/events.ts`.
 */
export const SocketEvents = {
  ORDER_APPROVED: 'ORDER_APPROVED',
  ORDER_IN_PREPARATION: 'ORDER_IN_PREPARATION',
  ORDER_READY: 'ORDER_READY',
  ORDER_COMPLETED: 'ORDER_COMPLETED',
  ORDER_CANCELLED: 'ORDER_CANCELLED',
  ORDER_CREATED: 'order:created',
  ORDER_STATUS_UPDATED: 'order:statusUpdated',
  ORDER_ESTIMATED_TIME_UPDATED: 'order:estimatedTimeUpdated',
  NOTIFICATION_NEW: 'notification:new',
  PRODUCT_AVAILABILITY_CHANGED: 'PRODUCT_AVAILABILITY_CHANGED',
  INGREDIENT_AVAILABILITY_CHANGED: 'INGREDIENT_AVAILABILITY_CHANGED',
  KITCHEN_ISSUE_REPORTED: 'KITCHEN_ISSUE_REPORTED',
} as const;

export type SocketEvent = (typeof SocketEvents)[keyof typeof SocketEvents];

/**
 * Socket.IO client wrapper.
 * Connect immediately after login; disconnect on logout.
 * All event handlers are automatically run inside Angular's NgZone
 * so that signal/component updates trigger change detection.
 */
@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket | null = null;

  /** Tracks which handlers are registered so off() can remove them cleanly. */
  private readonly handlers = new Map<string, ((...args: unknown[]) => void)[]>();

  private readonly _connected = signal(false);
  readonly connected = this._connected.asReadonly();

  constructor(private readonly zone: NgZone) {}

  /**
   * Creates a Socket.IO connection authenticated with the given JWT.
   * If a connection already exists it is reused (no-op on re-connect
   * with the same socket object).
   */
  connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(environment.socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    this.socket.on('connect', () => {
      this.zone.run(() => this._connected.set(true));
    });

    this.socket.on('disconnect', () => {
      this.zone.run(() => this._connected.set(false));
    });

    this.socket.on('connect_error', (err) => {
      console.warn('[socket] connection error:', err.message);
    });
  }

  /**
   * Disconnects the socket and removes all registered listeners.
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.handlers.clear();
    this._connected.set(false);
  }

  /**
   * Registers an event listener.
   * The handler is automatically wrapped in NgZone.run() so Angular
   * signals and component state update correctly on every received event.
   *
   * Multiple handlers for the same event are supported.
   */
  on<T>(event: string, handler: (payload: T) => void): void {
    if (!this.socket) {
      return;
    }

    const wrapped = (payload: unknown) => {
      this.zone.run(() => handler(payload as T));
    };

    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push(wrapped as ((...args: unknown[]) => void));

    this.socket.on(event, wrapped);
  }

  /**
   * Removes all listeners for the given event that were registered via on().
   */
  off(event: string): void {
    if (!this.socket) {
      return;
    }
    const registered = this.handlers.get(event) ?? [];
    for (const handler of registered) {
      this.socket.off(event, handler);
    }
    this.handlers.delete(event);
  }
}
