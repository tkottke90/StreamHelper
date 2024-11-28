import "./App.scss";
import { batch, useSignal, useSignalEffect } from "@preact/signals";
import { useConfigService } from "./services/config.service";
import { useDbPath } from "./services/db.service";

function classMap(baseClass: string, options: Record<string, boolean>) {
  return baseClass + ' ' + Object.keys(options).map(key => options[key] ? key : '')
}

function App() {
  const { loadConfigs } = useConfigService();
  const dbPath = useDbPath();

  const loading = useSignal(true);
  const config = useSignal<Record<string, any>>({});
  const error = useSignal<string>('');

  useSignalEffect(() => {
    new Promise(async (resolve) => {
      let result: any;

      try {
        result = await loadConfigs({})
        console.dir(result)
      } catch (err: any) {
        error.value = err.message;
      }

      batch(() => {
        loading.value = false;
        config.value = result;
      })
      loading.value = false;
      resolve(null);
    })
  });

  return (
    <div className="w-full h-full m-0 grid grid-cols-[200px_1fr] grid-rows-[56px_1fr] relative">
      <div className={classMap("absolute inset-0 bg-slate-950 opacity-0 origin-center scale-0", { 'scale-100': loading.value })}>
        {/* scrim */}

      </div>
      <header className="py-2 px-4 col-span-2">
        <h2 className="m-0">Stream Helper - iRacing Telemetry Listener</h2>
      </header>
      <aside></aside>
      <main className="p-4">
        <section>
          <p>Path: <span>{ dbPath.loading.value ? 'Loading Path' : dbPath.value.value }</span></p>
        </section>
        <br />
        <br />
        <section>
          <div>
            <span>Config: </span>
            <pre>
              { error.value ? `ERROR: ${error.value}` : JSON.stringify(config.value, null, 2) }
            </pre>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
