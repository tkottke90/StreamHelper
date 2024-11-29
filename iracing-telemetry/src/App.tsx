import { batch, useSignal, useSignalEffect } from "@preact/signals";
import { ConfigContext, useConfigContext } from "./services/config.service";
import { useDbPath } from "./services/db.service";

function classMap(baseClass: string, options: Record<string, boolean>) {
  return baseClass + ' ' + Object.keys(options).map(key => options[key] ? key : '')
}

function App() {
  const dbPath = useDbPath();

  const loading = useSignal(true);

  return (
    <ConfigContext>
      <div className="w-full h-full m-0 grid grid-cols-[200px_1fr] grid-rows-[56px_1fr] relative">
        <div className={classMap("absolute inset-0 bg-slate-950 opacity-0 origin-center scale-0", { 'scale-100': loading.value })}>
          {/* scrim */}

        </div>
        <header className="py-2 px-4 col-span-2">
          <h2 className="m-0">Stream Helper - iRacing Telemetry Listener</h2>
        </header>
        <main className="p-4 col-span-2">
          <section>
            <p>Path: <span>{ dbPath.loading.value ? 'Loading Path' : dbPath.value.value }</span></p>
          </section>
          <br />
          <br />
          <ConfigDisplay />
        </main>
      </div>
    </ConfigContext>
  );
}

function ConfigDisplay() {
  const { configs } = useConfigContext();

  return (
    <section>
      <div>
        <div className="flex justify-between">
          <h2>Configuration</h2>
          <div>
            <button className="btn-accent--raised">Raw Editor</button>
          </div>
        </div>
        <div>
          <p>iRacing Directory:</p>
          <p>{configs.value.iracingUrl}</p>
        </div>

        {/* <pre>
          { JSON.stringify(configs.value, null, 2) }
        </pre> */}
      </div>
    </section>
  )
}

export default App;
