import { Signal, useSignal, useSignalEffect } from "@preact/signals";
import { Trash2 } from "lucide-preact";
import { StreamDTO } from "../../../../backend/src/dto/stream.dto";
import { Actions } from "../../components/layout/actions";
import { Table } from "../../components/layout/table";
import { useStreamService } from "../../services/stream.service";
import { generateRelativeDateFormat } from "../../utils/date.utils";
import { CreateStream } from "./create-stream";

export function StreamList() {
  
  const headers = useSignal<(keyof StreamDTO)[]>(['key', 'url', 'createdAt'])
  const { loadStreams, deleteStream, streams } = useStreamService();

  useSignalEffect(() => {
    loadStreams();
  });

  if (streams.value.length === 0) {
    return <EmptyList />;
  }

  return (
    <Table headers={[...headers.value, 'Actions']}>
      {streams.value.map(stream => (
        <tr key={`tableRow-stream-${stream.value.id}`}>
          <td>
            <LivePing stream={stream} />
            &nbsp;
            <span>{ stream.value.key }</span>
          </td>
          <td>{ stream.value.url }</td>
          <td>
            <p>{stream.value.createdAt.toLocaleDateString()}</p>
            <p className="text-sm opacity-50">{generateRelativeDateFormat(stream.value.createdAt)}</p>
          </td>
          <td>
            <Actions>
              <button onClick={() => {
                deleteStream(stream.value.id)
                  .then(() => {
                    loadStreams();
                  });
              }}> 
                <Trash2 />
              </button>
            </Actions>
          </td>
        </tr>
      ))}
    </Table>
  );
}

function LivePing({ stream }: { stream: Signal<StreamDTO> }) {
  if (!stream.value || !stream.value.isLive) {
    return null;
  }

  return (
    <div class="relative h-3 w-3 inline-block">
      <span class="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75 top-1/2"></span>
      <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
    </div>
  )
}

function EmptyList() {
  return (
    <div className="p-4 flex flex-col gap-4">
      <p className="text-center">No Active Streams. Click below to start one.</p>
      <Actions className="justify-center">
        <CreateStream label="Create Stream" />
      </Actions>
    </div>
  );
}