import { Signal } from "@preact/signals";
import { StreamDTO, StreamDTOWithLinks, StreamFindDTO, StreamSchema } from "../../../backend/src/dto/stream.dto";
import {
  CreateStreamDestinationInput,
  UpdateStreamDestinationInput,
  StreamDestinationResponse,
  StreamDestinationResponseSchema
} from "../../../backend/src/dto/stream-destination.dto";
import { httpRequest, parseJsonResponse } from "../utils/http.utils";

const streams = new Signal<Signal<StreamDTOWithLinks>[]>([]);
const streamDestinations = new Signal<Signal<StreamDestinationResponse>[]>([]);

function parseApiData(streams: StreamDTOWithLinks) {
  return new Signal(StreamDTOWithLinks.parse(streams));
}

export async function createStream() {
  return httpRequest(
    fetch('/api/v1/streams', { method: 'POST' }),
    parseJsonResponse<StreamDTOWithLinks>
  ).then((s) => {
    const stream = parseApiData(s);

    streams.value = [
      ...streams.value,
      stream
    ].sort((a,b) => a.value.createdAt.valueOf() - b.value.createdAt.valueOf())

    return stream;
  });
}

export async function loadStreams(filter: Partial<StreamFindDTO> = {}) {
  const query = new URLSearchParams();
  Object.entries(filter).forEach(([key, value]) => {
    query.append(key, `${value}`);
  })

  httpRequest(
    fetch(`/api/v1/streams?${query}`),
    parseJsonResponse<StreamDTOWithLinks[]>
  ).then((s) => {
    streams.value = s.map(stream => parseApiData(stream))
  })
}

export async function deleteStream(id: number) {
  return httpRequest(fetch(`/api/v1/streams/${id}`, { method: 'DELETE' }));
}

// ============================================
// Stream Destination Methods
// ============================================

function parseDestinationData(destination: StreamDestinationResponse) {
  return new Signal(StreamDestinationResponseSchema.parse(destination));
}

/**
 * Get metadata about the stream destination API (for forms and filters)
 */
export async function getStreamDestinationMetadata() {
  return httpRequest(
    fetch('/api/v1/stream-destinations/metadata'),
    parseJsonResponse<{
      create: Record<string, any>;
      update: Record<string, any>;
      filter: Record<string, any>;
      platforms: Record<string, { name: string, rtmpUrl: string | null, requiresCustomUrl: boolean }>;
    }>
  );
}

export async function getStreamDestination(path: string) {
  return httpRequest(
    fetch(path),
    parseJsonResponse<StreamDestinationResponse>
  );
}

/**
 * Get all stream destinations for the authenticated user
 */
export async function loadStreamDestinations() {
  return httpRequest(
    fetch('/api/v1/stream-destinations'),
    parseJsonResponse<StreamDestinationResponse[]>
  ).then((destinations) => {
    streamDestinations.value = destinations.map(dest => parseDestinationData(dest));
    return streamDestinations.value;
  });
}

/**
 * Get stream destinations for a specific stream
 * @deprecated Use the destination links from the stream response instead (stream.links.destination)
 */
export async function loadStreamDestinationsByStreamId(streamId: number) {
  return httpRequest(
    fetch(`/api/v1/stream-destinations/${streamId}`),
    parseJsonResponse<StreamDestinationResponse>
  ).then((destination) => {
    return parseDestinationData(destination);
  });
}

/**
 * Create a new stream destination
 */
export async function createStreamDestination(input: CreateStreamDestinationInput) {
  return httpRequest(
    fetch('/api/v1/stream-destinations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    }),
    parseJsonResponse<StreamDestinationResponse>
  ).then((destination) => {
    const newDest = parseDestinationData(destination);

    // Add to the list
    streamDestinations.value = [
      ...streamDestinations.value,
      newDest
    ].sort((a, b) => a.value.createdAt.valueOf() - b.value.createdAt.valueOf());

    return newDest;
  });
}

/**
 * Update an existing stream destination
 */
export async function updateStreamDestination(
  id: number,
  input: UpdateStreamDestinationInput
) {
  return httpRequest(
    fetch(`/api/v1/stream-destinations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    }),
    parseJsonResponse<StreamDestinationResponse>
  ).then((destination) => {
    const updatedDest = parseDestinationData(destination);

    // Update in the list
    streamDestinations.value = streamDestinations.value.map(dest =>
      dest.value.id === id ? updatedDest : dest
    );

    return updatedDest;
  });
}

/**
 * Delete a stream destination
 */
export async function deleteStreamDestination(id: number) {
  return httpRequest(
    fetch(`/api/v1/stream-destinations/${id}`, { method: 'DELETE' })
  ).then(() => {
    // Remove from the list
    streamDestinations.value = streamDestinations.value.filter(
      dest => dest.value.id !== id
    );
  });
}

export function useStreamService() {

  return {
    // Stream methods
    createStream,
    deleteStream,
    loadStreams,
    streams,

    // Stream destination methods
    getStreamDestinationMetadata,
    loadStreamDestinations,
    loadStreamDestinationsByStreamId,
    createStreamDestination,
    updateStreamDestination,
    deleteStreamDestination,
    streamDestinations,
  }
}