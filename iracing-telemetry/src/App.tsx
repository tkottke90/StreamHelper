import { batch, Signal, untracked, useComputed, useSignal, useSignalEffect } from "@preact/signals";
import { Setup } from "./components/settings";
import * as AppSettingsService from "./services/app-settings.service";
import * as TelemetryService from "./services/telemetry.service";
import { Cog } from "lucide-preact";
import { ChangeEvent } from "preact/compat";
import { Telemetry, TelemetryData, TelemetryVariable } from "./types/iracing-telemetry";
import { Actions } from "./components/layout/actions";
import { HorizontalLine } from "./components/layout/horizontal-line";
import { compoundClass } from "./utils/dom-utils";


export default function App() {
  const iRacingPath = AppSettingsService.useIRacingPath();
  const selectedFile = useSignal<string>('');
  const info = useSignal<Telemetry | undefined>(undefined)
  const lastRecord = useSignal<Record<string, any>>({})

  useSignalEffect(() => {
    if (!selectedFile.value) return;
    
    untracked(() => {
      TelemetryService.getTelemetry(iRacingPath.getFilePath(selectedFile.value))
        .then(async telemetry => {
          const [ initializedTelemetry ] = await TelemetryService.loadRecords(telemetry);
          const firstRecord = await TelemetryService.getRecord(initializedTelemetry, 0);

          batch(() => {
            info.value = initializedTelemetry;
            lastRecord.value = firstRecord;
          });
        });
    });
  })

  return (
    <div className="w-full h-full m-0 grid grid-cols-[200px_1fr] grid-rows-[56px_1fr]">
      <Header onSelect={(val: string) => selectedFile.value = val} />
      <main className="p-4 col-span-2 w-full h-full overflow-auto">
        { info.value && lastRecord.value && <TelemetryDisplay telemetry={info} lastData={lastRecord} /> }

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

function enumerateRecord<Values, Input extends { [s: string]: Values; } = { [s: string]: Values }>(record: Input) {
  return Object.entries<Values>(record).sort(([keyA], [keyB]) => keyA > keyB ? 1 : -1)
}

export async function incrementShownData(telemetry: Telemetry, data: Signal<Record<string, TelemetryData>>, currentIndex: Signal<number>, dir: 1 | -1) {
  const nextIndex = currentIndex.value + dir;
  
  await loadData(telemetry, data, currentIndex, nextIndex);
}

export async function loadData(telemetry: Telemetry, data: Signal<Record<string, TelemetryData>>, currentIndex: Signal<number>, nextIndex: number) {
  const response = await TelemetryService.getRecord(telemetry, nextIndex);

  batch(() => {
    data.value = response;
    currentIndex.value = nextIndex;
  })
}

function TelemetryDisplay({ telemetry, lastData }: { telemetry: Signal<Telemetry | undefined>, lastData: Signal<Record<string, TelemetryData>> }) {
  if (!telemetry.value) return null;

  const currentIndex = useSignal(0);
  const prevDisabled = useComputed(() => !telemetry.value || currentIndex.value <= 0);
  const nextDisabled = useComputed(() => !telemetry.value || currentIndex.value >= telemetry.value.sampler.sample_count);

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
        <p>Session Tick: { lastData.value['SessionTick'].data }</p>
        <p>Record: {currentIndex} / {telemetry.value.sampler.sample_count}</p>
        <br />

        <TemplateEditor variables={lastData} />

        <HorizontalLine />

        <div className="overflow-y-auto h-[200px]">
          { !lastData.value && <p className="text-center">Click Next To Load Data</p> }
          { lastData.value && 
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {enumerateRecord<TelemetryData>(lastData.value).map(([variableName, variableDetails]) => (
                  <tr>
                    <td>{variableName}</td>
                    <td>{ variableDetails.data_type }</td>
                    <td>{ variableDetails.data } {variableDetails.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        </div>
        <Actions>
          <button disabled={nextDisabled} onClick={async () => {
            if (!telemetry.value) return;

            loadData(telemetry.value, lastData, currentIndex, 0)
          }} className="btn-primary--raised" >&lt;&lt;</button>
          <button disabled={prevDisabled} onClick={async () => {
            if (!telemetry.value) return;

            incrementShownData(telemetry.value, lastData, currentIndex, -1)
          }} className="btn-primary--raised" >Prev</button>
          
          <button disabled={nextDisabled} onClick={async () => {
            if (!telemetry.value) return;

            incrementShownData(telemetry.value, lastData, currentIndex, 1)
          }} className="btn-primary--raised" >Next</button>
          
          <button disabled={nextDisabled} onClick={async () => {
            if (!telemetry.value) return;

            loadData(telemetry.value, lastData, currentIndex, telemetry.value.sampler.sample_count)
          }} className="btn-primary--raised" >&gt;&gt;</button>
        </Actions>
      </div>
      
      <div className="card">
        <h3>Variables</h3>
        <br />
        <VariableDefinitions  definitions={telemetry.value.sampler.headers} />
      </div>
    </div>
  );
}

enum TemplateEditorStates {
  Edit,
  Preview
}

function TemplateEditor({}: { variables: Signal<Record<string, TelemetryData>> }) {
  const mode = useSignal<TemplateEditorStates>(TemplateEditorStates.Edit);

  const template = useSignal<string>('');

  return (
    <div>
      <div className="flex gap-2">
        <button
          className={compoundClass('', { "btn-primary--raised": mode.value === TemplateEditorStates.Edit })}
          onClick={() => mode.value = TemplateEditorStates.Edit}
        >
          Edit
        </button>
        <button
          className={compoundClass('', { "btn-primary--raised": mode.value === TemplateEditorStates.Preview })}
          onClick={() => mode.value = TemplateEditorStates.Preview}
        >
          Preview
        </button>
      </div>
      { mode.value === TemplateEditorStates.Edit && <textarea className="w-full text-black" value={template.value} />}
      { mode.value === TemplateEditorStates.Preview && <p>{template.value}</p>}
    </div>
  )
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
