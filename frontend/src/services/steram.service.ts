import { Signal } from "@preact/signals";
import { UserDTO } from "../../../backend/src/dto/user.dto";
import { httpRequest, parseJsonResponse } from "../utils/http.utils";

interface TempStream {
  id: number;
  key: string;
  url: string;
  owner: UserDTO
  createdAt: string;
  updatedAt: string;
}

type Stream = Signal<TempStream>;

const streams = new Signal<Stream[]>([]);

async function loadStreams(filter: Partial<Omit<Stream, 'id'>> = {}) {
  const streams = httpRequest(
    fetch('/api/v1/streams', {
      method: 'POST',
      body: JSON.stringify(filter)
    }),
    parseJsonResponse<Stream[]>
  )
  
}

export function useStreamService() {

  return {
    streams,
    loadStreams
  }
}