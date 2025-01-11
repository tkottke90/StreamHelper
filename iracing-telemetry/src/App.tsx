import { Signal, untracked, useSignal, useSignalEffect } from "@preact/signals";
import { Setup } from "./components/settings";
import * as AppSettingsService from "./services/app-settings.service";
import * as TelemetryService from "./services/telemetry.service";
import { Cog } from "lucide-preact";
import { ChangeEvent } from "preact/compat";


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
        <p>
          {info.value && <span>Records: {info.value.metadata.record_count}</span>}
        </p>

        { 
          info.value && <TelemetryDisplay telemetry={info} />
        }

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
  if (!telemetry.peek()) return null;
  
  const sections = useSignal<string[]>([]);
  const selected = useSignal<string>('');

  useSignalEffect(() => {
    const currentTelem = telemetry.value;

    if (!currentTelem) return;

    untracked(() => {
      sections.value = Object.keys(currentTelem);
      selected.value = sections.value[0] ?? '';
    });

    () => {
      untracked(() => sections.value = []);
    }
  });

  return (
    <div>
      <select
       onChange={(e: Event) => {
        const target = e.target as HTMLSelectElement;

        selected.value = target.value;
       }}
      >
        { sections.value.map(s => <option className="uppercase" key={s} value={s}>{s}</option>) }
      </select>

      { selected.value && telemetry.value && <pre><code>{ JSON.stringify(telemetry.value[selected.value], null, 2) }</code></pre> }
    </div>
  );
}