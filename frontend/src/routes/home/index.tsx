import { batch, useSignal, useSignalEffect } from "@preact/signals";
import AppShell from "../../components/app-shell";
import { Actions } from "../../components/layout/actions";
import { useStreamService } from "../../services/steram.service";
import { DefaultProps } from "../../utils/component.utils";
import { Dialog } from "../../components/dialog";
import { JSX } from "preact/jsx-runtime";
import { Table, TableCell } from "../../components/layout/table";
import { StreamDTO } from "../../../../backend/src/dto/stream.dto";
import { RouteIcon } from "../../components/icons/route.icon";

export default () => {
  return (
    <AppShell>
      <main className="p-4">
        <div class="card">
          <div className="flex justify-between">
            <h1>Streams</h1>
            <Actions>
              <CreateStream />
            </Actions>
          </div>
          <StreamList />
        </div>
      </main>
    </AppShell>
  );
};

function StreamList() {
  
  const headers = useSignal<(keyof StreamDTO)[]>(['key', 'url', 'createdAt', 'updatedAt'])
  const { loadStreams, streams } = useStreamService();

  useSignalEffect(() => {
    
    loadStreams();
  });

  if (streams.value.length === 0) {
    return <EmptyList />;
  }

  return (
    <Table headers={headers.value}>
      {streams.value.map(stream => (
        <tr key={`tableRow-stream-${stream.value.id}`}>
          {headers.value.map(header => {
            let customClasses = [];
            let value = stream.value[header];
            
            if (value instanceof Date) {
              value = value.toLocaleTimeString();
              customClasses.push('text-end');
            }

            return (<TableCell className={customClasses.join(' ')} >{ value.toString() }</TableCell>)
          })}
        </tr>
      ))}
    </Table>
  );
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

function CreateStream({ label, button }: { label?: string, button?: JSX.Element }) {
  const { createStream } = useStreamService();
  const stream = useSignal<StreamDTO | undefined>(undefined);
  const loading = useSignal(false);
  
  const defaultButton = (
    <button className="btn-accent" onClick={async () => {
      if (!loading.value) {
        loading.value = true;
        createStream()
          .then((newStream) => {
            batch(() => {
              loading.value = false;
              stream.value = newStream.value;
            });
          })
      }
    }}>
      <p class="iconify mdi--plus"></p>
      <span>{label ?? ''}</span>
    </button>
  );

  return (
    <Dialog trigger={button ?? defaultButton}>
      { loading.value
          ? <div className="flex flex-col gap-4">
              <h3 className="text-center" >Creating New Stream</h3>
              <RouteIcon size={32}></RouteIcon>
            </div>
          : <div>
              <h2>New Stream</h2>
              <ul>
                <li>Stream Key: { stream.value?.key }</li>
                <li>Stream URL: { stream.value?.url }</li>
              </ul>
            </div>
      }
    </Dialog>
  )
}

