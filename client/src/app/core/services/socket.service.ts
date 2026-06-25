import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Socket.IO client wrapper — owned by Developer A.
 * Connect after login; disconnect on logout.
 *
 * TODO: install socket.io-client
 * TODO: connect / disconnect lifecycle
 * TODO: listen for ORDER_* and KITCHEN_ISSUE_REPORTED events
 */
@Injectable({ providedIn: 'root' })
export class SocketService {
  private readonly _connected = signal(false);
  readonly connected = this._connected.asReadonly();

  readonly socketUrl = environment.socketUrl;

  connect(_token: string): void {
    // TODO: implement Socket.IO connect
  }

  disconnect(): void {
    this._connected.set(false);
  }

  on<T>(_event: string, _handler: (payload: T) => void): void {
    // TODO: implement event listener
  }

  off(_event: string): void {
    // TODO: implement event removal
  }
}
