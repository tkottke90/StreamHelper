import { WsEventMetadata, WsMiddleware } from "./types.js";

const WS_EVENT_METADATA = Symbol('ws:events');

/**
 * Get all event metadata from a class prototype
 */
export function getEventMetadata(target: any): WsEventMetadata[] {
  return Reflect.getMetadata(WS_EVENT_METADATA, target) || [];
}

/**
 * WebSocketEvent decorator - marks a method as a WebSocket event handler
 *
 * @param eventType - The event type to handle (combined with controller path)
 * @param middleware - Optional middleware specific to this event
 *
 * @example
 * ```typescript
 * @WebSocketController('stream')
 * class StreamController {
 *   @WebSocketEvent('start')
 *   handleStart(context: WsEventContext) {
 *     // Handles 'stream:start' events
 *   }
 * }
 * ```
 */
export function WebSocketEvent(
  eventType: string,
  middleware: WsMiddleware[] = []
) {
  return (target: any, methodName: string, descriptor: PropertyDescriptor) => {
    // Get existing events or create new array
    const events: WsEventMetadata[] = getEventMetadata(target.constructor) || [];

    // Add this event
    events.push({
      eventType,
      methodName,
      middleware
    });

    // Store updated events
    Reflect.defineMetadata(WS_EVENT_METADATA, events, target.constructor);

    return descriptor;
  };
}