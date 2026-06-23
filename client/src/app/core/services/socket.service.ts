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

  // TODO: implement connect(token: string)
  // TODO: implement disconnect()
  // TODO: implement on<T>(event: string, handler: (payload: T) => void)
  // TODO: implement off(event: string)
}
