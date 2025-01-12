import { Signal, untracked, useSignal, useSignalEffect } from "@preact/signals";
import { Setup } from "./components/settings";
import * as AppSettingsService from "./services/app-settings.service";
import * as TelemetryService from "./services/telemetry.service";
import { Cog } from "lucide-preact";
import { ChangeEvent } from "preact/compat";
import { Telemetry, TelemetryVariable } from "./types/iracing-telemetry";
import { Actions } from "./components/layout/actions";


export default function App() {
  const iRacingPath = AppSettingsService.useIRacingPath();
  const selectedFile = useSignal<string>('');
  const info = useSignal<Telemetry | undefined>(undefined)
  const lastRecord = useSignal<Record<string, any>>()

  useSignalEffect(() => {
    if (!selectedFile.value) return;
    
    untracked(() => {
      TelemetryService.getTelemetry(iRacingPath.getFilePath(selectedFile.value))
        .then(async data => {
          info.value = data;

          lastRecord.value = await TelemetryService.getNextRecord(data);
        });
    });
  })

  return (
    <div className="w-full h-full m-0 grid grid-cols-[200px_1fr] grid-rows-[56px_1fr]">
      <Header onSelect={(val: string) => selectedFile.value = val} />
      <main className="p-4 col-span-2 w-full h-full overflow-auto">
        { info.value && <TelemetryDisplay telemetry={info} /> }

      </main>
      { !iRacingPath.isConfigured.value && <Setup /> }
    </div>
  );
}

function Header({ onSelect }: { onSelect: (value: string) => void }) {
  const directoryOptions = useSignal<string[]>([])
  const iRacingPath = AppSettingsService.useIRacingPath();

  useSignalEffect(() => {
    const pathConfig = iRacingPath.config.value;

    // Do not pull a list if the config is empty
    if (!pathConfig || !pathConfig.value) return;
    
    untracked(() => {
      TelemetryService.getTelemetryFiles(pathConfig.value)
        .then(files => directoryOptions.value = files);
    });
  });

  return (
    <header className="py-2 px-4 col-span-2 bg-matisse-900 shadow flex justify-between">
      <h2 className="m-0">Stream Helper - iRacing Telemetry Listener</h2>
      <div className="flex gap-2">
        <select
          disabled={!iRacingPath.value}
          placeholder="Select A Telemetry File"
          onChange={(e: ChangeEvent) => {
            e.preventDefault();

            const selectElem = e.target as HTMLSelectElement;
            onSelect(selectElem.value);
          }}
        >
          <option>Select a Telemetry File</option>
          { directoryOptions.value.map(file => <FileOption file={file} key={iRacingPath.getFilePath(file)}  />) }
        </select>
        <button className="icon">
          <Cog />
        </button>
      </div>
    </header>
  )
}

function FileOption({ key, file }: { key: string, file: string }) {
  return (<option key={key} value={key}>{ file }</option>)
} 

function TelemetryDisplay({ telemetry }: { telemetry: Signal<Telemetry | undefined> }) {
  if (!telemetry.value) return null;

  const lastData = useSignal('');

  return (
    <div className="flex flex-col gap-4">
      <div className="card">
        <h3>Details</h3>
        <br />
        <pre>
          <code>
            {JSON.stringify(telemetry.value.metadata, null, 2)}
          </code>
        </pre>
      </div>
      
      <div className="card">
        <h3>Data</h3>
        <br />
        <div className="overflow-y-auto h-[200px]">
          { !lastData.value && <p className="text-center">Click Next To Load Data</p> }
          { lastData.value && <pre><code>{JSON.stringify(lastData.value)}</code></pre> }
        </div>
        <Actions>
          <button disabled={!telemetry.value} onClick={async () => {
            if (!telemetry.value) return;

            const response = await TelemetryService.getNextRecord(telemetry.value);

            console.dir(response)

            lastData.value = response;
          }} className="btn-primary--raised" >Next</button>
        </Actions>
      </div>
      
      <div className="card">
        <h3>Variables</h3>
        <br />
        <VariableDefinitions  definitions={telemetry.value.variable_defs} />
      </div>
    </div>
  );
}



function VariableDefinitions({ definitions }: { definitions: Array<TelemetryVariable> }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Type</th>
          <th>Type ID</th>
          <th>Name</th>
          <th>Description</th>
          <th>Unit</th>
          <th>Is Unit of Time</th>
        </tr>
      </thead>
      <tbody>
        { definitions.map(def => (
          <tr>
            <td>{ TelemetryService.getVariableTypeName(def.var_type) }</td>
            <td>{ def.var_type }</td>
            <td>{ def.name }</td>
            <td>{ def.description }</td>
            <td>{ def.unit }</td>
            <td>{ def.count_as_time === 1 ? 'Yes' : 'No' }</td>
          </tr>
        )) }
      </tbody>
    </table>
  )
}