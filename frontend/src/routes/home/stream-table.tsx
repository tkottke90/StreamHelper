import { useSignal, useSignalEffect } from "@preact/signals";
import { Fragment, JSX } from "preact/jsx-runtime";
import { StreamDTO } from "../../../../backend/src/dto/stream.dto";
import { Actions } from "../../components/layout/actions";
import { Table, TableCell } from "../../components/layout/table";
import { useStreamService } from "../../services/steram.service";
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
          <td>{ stream.value.key }</td>
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
                <p class="iconify mdi--delete"></p>
              </button>
            </Actions>
          </td>
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