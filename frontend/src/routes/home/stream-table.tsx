import { Signal, useSignal, useSignalEffect } from "@preact/signals";
import { Copy, Link, Trash2, Twitch, Youtube } from "lucide-preact";
import { StreamDTOWithLinks } from "../../../../backend/src/dto/stream.dto";
import { Actions } from "../../components/layout/actions";
import { Table } from "../../components/layout/table";
import { useStreamService } from "../../services/stream.service";
import { generateRelativeDateFormat } from "../../utils/date.utils";
import { CreateStream } from "./create-stream";
import { compoundClass } from "../../utils/component.utils";
import { MulticastDialog } from "./multicast-dialog";
import { Button } from "../../components/form/button";
import { copyToClipboard } from "../../utils/html.utils";

export function StreamList() {
  const { loadStreams, deleteStream, streams, getStreamDestinationMetadata } = useStreamService();
  const destinations = useSignal<Record<string, { name: string, rtmpUrl: string | null, requiresCustomUrl: boolean }>>({});
  const copyFeedback = useSignal<{ streamId: number, type: 'key' | 'url', success: boolean } | null>(null);

  useSignalEffect(() => {
    loadStreams();
    getStreamDestinationMetadata().then(m => destinations.value = m.platforms);
  });

  const handleCopy = async (streamId: number, text: string, type: 'key' | 'url') => {
    try {
      await copyToClipboard(text);
      copyFeedback.value = { streamId, type, success: true };
      // Clear feedback after 2 seconds
      setTimeout(() => {
        copyFeedback.value = null;
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      copyFeedback.value = { streamId, type, success: false };
      // Clear feedback after 3 seconds for errors
      setTimeout(() => {
        copyFeedback.value = null;
      }, 3000);
    }
  };

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
            &nbsp;
            <Button
              className="p-1!"
              variant={copyFeedback.value?.streamId === stream.value.id && copyFeedback.value?.type === 'key'
                ? (copyFeedback.value.success ? 'success' : 'destructive')
                : 'default'
              }
              onClick={() => handleCopy(stream.value.id, stream.value.key, 'key')}
              title={copyFeedback.value?.streamId === stream.value.id && copyFeedback.value?.type === 'key'
                ? (copyFeedback.value.success ? 'Copied!' : 'Failed to copy')
                : 'Copy Stream Key'
              }
            >
              <Copy size={14} />
            </Button>
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

              <Button
                className="p-1!"
                variant={copyFeedback.value?.streamId === stream.value.id && copyFeedback.value?.type === 'url'
                  ? (copyFeedback.value.success ? 'success' : 'destructive')
                  : 'default'
                }
                onClick={() => {
                  const rtmpUrl = `${stream.value.url}/live/${stream.value.key}`;
                  handleCopy(stream.value.id, rtmpUrl, 'url');
                }}
                title={copyFeedback.value?.streamId === stream.value.id && copyFeedback.value?.type === 'url'
                  ? (copyFeedback.value.success ? 'Copied!' : 'Failed to copy')
                  : 'Copy Stream URL'
                }
              >
                <Link size={24} />
              </Button>
              
              <Button className="p-1!" variant="destructive" onClick={() => {
                deleteStream(stream.value.id)
                  .then(() => {
                    loadStreams();
                  });
              }}> 
                <Trash2 size={24} />
              </Button>
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