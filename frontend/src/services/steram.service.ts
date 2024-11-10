import { Signal } from "@preact/signals";
import { UserDTO } from "../../../backend/src/dto/user.dto";
import { StreamCreateDTO, StreamDTO, StreamSchema } from "../../../backend/src/dto/stream.dto";
import { httpRequest, parseJsonResponse } from "../utils/http.utils";

class RecordList<RecordType, InputType> {
  
  constructor(data: InputType[]) {

  }


}

interface TempStream {
  id: number;
  key: string;
  url: string;
  owner: UserDTO
  createdAt: string;
  updatedAt: string;
}

const streams = new Signal<Signal<StreamDTO>[]>([]);

async function createStream() {
  return httpRequest(
    fetch('/api/v1/streams', { method: 'POST' }),
    parseJsonResponse<StreamDTO>
  ).then((s) => {
    const stream = new Signal(s);

    streams.value = [
      ...streams.value,
      stream
    ].sort((a,b) => a.value.createdAt.valueOf() - b.value.createdAt.valueOf())

    return stream;
  });
}

async function loadStreams(filter: Partial<StreamDTO> = {}) {
  const query = new URLSearchParams();
  Object.entries((key: string, value: unknown) => {
    query.append(key, `${value}`);
  })

  httpRequest(
    fetch(`/api/v1/streams?${query}`),
    parseJsonResponse<StreamDTO[]>
  ).then((s) => {
    streams.value = s.map(stream => new Signal(StreamSchema.parse(stream)))
  })
}

export function useStreamService() {

  return {
    streams,
    loadStreams,
    createStream
  }
}