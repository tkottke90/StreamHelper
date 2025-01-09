import { useSignal } from "@preact/signals";
import { Setup } from "./components/settings";
import * as AppSettingsService from "./services/app-settings.service";
import * as TelemetryService from "./services/telemetry.service";
import { Cog } from "lucide-preact";

export default function App() {
  const iRacingPath = AppSettingsService.useIRacingPath();
  const info = useSignal<Telemetry | undefined>(undefined)

  return (
    <div className="w-full h-full m-0 grid grid-cols-[200px_1fr] grid-rows-[56px_1fr]">
      <Header />
      <main className="p-4">
        <button disabled={!info.value} onClick={async () => {
          if (!info.value) return;
        
          const result = await TelemetryService.getNextRecord(info.value);

          console.dir(result);
        }}>Get Telemetry</button>

      </main>
      { !iRacingPath.isConfigured.value && <Setup /> }
    </div>
  );
}

function Header() {

  return (
    <header className="py-2 px-4 col-span-2 bg-matisse-900 shadow flex justify-between">
      <h2 className="m-0">Stream Helper - iRacing Telemetry Listener</h2>
      <div className="flex gap-2">
        <select
          placeholder="Select A Telemetry File"
        >
          <option>Select a Telemetry File</option>
        </select>
        <button className="icon">
          <Cog />
        </button>
      </div>
    </header>
  )
}
