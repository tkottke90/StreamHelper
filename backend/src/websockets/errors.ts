import { BaseError } from '@tkottke90/js-errors';


export class WebsocketAuthError extends BaseError {
  name = 'WebsocketAuthError'

  constructor(clientId: string, ip: string, event: string) {
    super(`Unauthenticated WebSocket client attempted to access protected a event`, { clientId, ip, event });
  }
}
