import { Injectable } from '@decorators/di';
import { WsControllerMetadata, WsMiddleware } from './types.js';

// Metadata storage keys
const WS_CONTROLLER_METADATA = Symbol('ws:controller');

/**
 * Get controller metadata from a class
 */
export function getControllerMetadata(target: any): WsControllerMetadata | undefined {
  return Reflect.getMetadata(WS_CONTROLLER_METADATA, target);
}


/**
 * WebSocketController decorator - marks a class as a WebSocket controller
 *
 * @param path - Base event path/namespace (e.g., 'stream', 'chat')
 * @param middleware - Optional middleware to run for all events
 *
 * @example
 * ```typescript
 * @WebSocketController('stream')
 * class StreamWebSocketController {
 *   @WebSocketEvent('status')
 *   handleStatus(context: WsEventContext) {
 *     // Handles events with type 'stream:status'
 *   }
 * }
 * ```
 */
export function WebSocketController(
  path: string,
  middleware: WsMiddleware[] = []
): ClassDecorator {
  return (target: any) => {
    // Store controller metadata
    Reflect.defineMetadata(
      WS_CONTROLLER_METADATA,
      { path, middleware },
      target
    );

    // Make it injectable with decorators/di
    Injectable()(target);
  };
}