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
            let value: string | number | JSX.Element | Date = stream.value[header] ?? '';
            
            if (value instanceof Date) {
              value = (
                <Fragment>
                  <p>{value.toLocaleDateString()}</p>
                  <p className="text-sm opacity-50">{generateRelativeDateFormat(value)}</p>
                </Fragment>
              )

              customClasses.push('text-end');
            }

            return (<TableCell className={customClasses.join(' ')} >{ value }</TableCell>)
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