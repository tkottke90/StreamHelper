import { Signal } from "@preact/signals";
import { StreamDTO, StreamSchema } from "../../../backend/src/dto/stream.dto";
import { httpRequest, parseJsonResponse } from "../utils/http.utils";

const streams = new Signal<Signal<StreamDTO>[]>([]);

function parseApiData(streams: StreamDTO) {
  return new Signal(StreamSchema.parse(streams));
}

export async function createStream() {
  return httpRequest(
    fetch('/api/v1/streams', { method: 'POST' }),
    parseJsonResponse<StreamDTO>
  ).then((s) => {
    const stream = parseApiData(s);

    streams.value = [
      ...streams.value,
      stream
    ].sort((a,b) => a.value.createdAt.valueOf() - b.value.createdAt.valueOf())

    return stream;
  });
}

export async function loadStreams(filter: Partial<StreamDTO> = {}) {
  const query = new URLSearchParams();
  Object.entries((key: string, value: unknown) => {
    query.append(key, `${value}`);
  })

  httpRequest(
    fetch(`/api/v1/streams?${query}`),
    parseJsonResponse<StreamDTO[]>
  ).then((s) => {
    streams.value = s.map(stream => parseApiData(stream))
  })
}

export async function deleteStream(id: number) {
  return httpRequest(fetch(`/api/v1/streams/${id}`, { method: 'DELETE' }));
}

export function useStreamService() {

  return {
    createStream,
    deleteStream,
    loadStreams,
    streams,
  }
}