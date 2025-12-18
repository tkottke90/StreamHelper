import * as ws from 'ws';

// Extended WebSocket interface with client ID
export interface WebSocketClientInstance extends ws.WebSocket {
  clientId?: string;
  isAuthenticated: boolean;
  remoteAddress?: string;
}

export interface WebSocketMessage extends Record<string, any> {
  type: string;
}

export interface WsEventContext {
  /** Unique client identifier */
  clientId: string;
  /** Whether the client is authenticated */
  isAuthenticated: boolean;
  /** The raw WebSocket connection */
  ws: WebSocketClientInstance;
  /** Whether the message is binary */
  isBinary: boolean;
  /** Parse message as JSON */
  json: <T = WebSocketMessage>() => T;
  /** Get message as text */
  text: () => string;
  /** Raw message buffer */
  raw: Buffer;
  /** Send a message to this client */
  send: (data: string | object) => void;
  /** Send an error to this client */
  sendError: (message: string) => void;
  /** Broadcast to all connected clients */
  broadcast: (data: string | object) => void;
}


/**
 * Middleware function type for WebSocket events
 */
export type WsMiddleware = (
  context: WsEventContext,
  next: (error?: any) => void | Promise<void>
) => Promise<void>;

/**
 * Controller metadata stored on the class
 */
export interface WsControllerMetadata {
  /** Base event path/namespace for this controller */
  path: string;
  /** Middleware to run for all events in this controller */
  middleware: WsMiddleware[];
}

/**
 * Event metadata stored on methods
 */
export interface WsEventMetadata {
  /** Event type to listen for */
  eventType: string;
  /** Method name */
  methodName: string;
  /** Middleware specific to this event */
  middleware: WsMiddleware[];
}