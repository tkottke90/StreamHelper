import { Signal, useSignal, useSignalEffect } from "@preact/signals";
import { Trash2, Twitch, Youtube } from "lucide-preact";
import { StreamDTOWithLinks } from "../../../../backend/src/dto/stream.dto";
import { Actions } from "../../components/layout/actions";
import { Table } from "../../components/layout/table";
import { useStreamService } from "../../services/stream.service";
import { generateRelativeDateFormat } from "../../utils/date.utils";
import { CreateStream } from "./create-stream";
import { compoundClass } from "../../utils/component.utils";
import { MulticastDialog } from "./multicast-dialog";

export function StreamList() {
  const { loadStreams, deleteStream, streams, getStreamDestinationMetadata } = useStreamService();
  const destinations = useSignal<Record<string, { name: string, rtmpUrl: string | null, requiresCustomUrl: boolean }>>({});

  useSignalEffect(() => {
    loadStreams();
    getStreamDestinationMetadata().then(m => destinations.value = m.platforms);
  });

  if (streams.value.length === 0) {
    return <EmptyList />;
  }

  return (
    <Table headers={['Stream Key', 'Server', 'Created On', 'Actions']}>
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
              <MulticastDialog
                destination={'youtube'}
                stream={stream.value}
                onClose={() => {
                  loadStreams();
                }}
              />

              <MulticastDialog 
                destination={'twitch'}
                stream={stream.value}
                onClose={() => {
                  loadStreams();
                }}
              />
              
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

function LivePing({ stream }: { stream: Signal<StreamDTOWithLinks> }) {
  return (
    <div className={compoundClass("relative h-3 w-3 inline-block", { "opacity-0": !stream.value.isLive, "opacity-100": stream.value.isLive })}>
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