import { batch, useSignal } from "@preact/signals";
import { ConfigContext, useConfigContext } from "./services/config.service";
import { compoundClass } from "./utils/dom-utils";
import { open } from '@tauri-apps/plugin-dialog';
import { useEffect } from "preact/hooks";
import { getTelemetry } from "./services/telemetry.service";
import { save } from '@tauri-apps/plugin-dialog';

function App() {
  const info = useSignal<string>('')


  useEffect(() => {
    getTelemetry('')
      .then((result) => {
        console.dir(result);

        info.value = 'data:text/yaml;charset=utf-8,' + encodeURIComponent(result);
      });
  }, []);

  return (
    <ConfigContext>
      <div className="w-full h-full m-0 grid grid-cols-[200px_1fr] grid-rows-[56px_1fr]">
        <header className="py-2 px-4 col-span-2 bg-matisse-900 shadow">
          <h2 className="m-0">Stream Helper - iRacing Telemetry Listener</h2>
        </header>
        <aside className="flex flex-col justify-between h-full bg-matisse-900">
          <nav className="">

          </nav>
          <nav>
            <a>Settings</a>
          </nav>
        </aside>
        <main className="p-4">
          <a href={info.value} download="iracing_config.yaml">
            <button onClick={async () => {
              const filepath = await save({ defaultPath: '~' })
              
            }} >Download</button>
          </a>
          <button onClick={() => {
            
          }}>Get Telemetry</button>
          <ConfigDisplay />
        </main>
      </div>
    </ConfigContext>
  );
}

function ConfigDisplay() {
  const { configs } = useConfigContext();
  const hasChanges = useSignal(false);

  return (
    <section>
      <div>
        <div className="flex justify-between">
          <h2>Configuration</h2>
          <div>
            {/* <button className="btn-accent--raised">Raw Editor</button> */}
          </div>
        </div>
        <div className="grid grid-cols-[200px_1fr] py-4">
          <p className="flex justify-center items-center">iRacing Directory:</p>
          <div className="actions">
            <input className="w-full caret-transparent cursor-pointer" value={configs.value.iracingUrl}
              onClick={async (event: MouseEvent) => {
                event.preventDefault();
                const dir = await open({ multiple: false, directory: true })
                const current = configs.value;

                current.iracingUrl = dir ?? '';

                batch(() => {
                  hasChanges.value = true;
                  configs.value = current;
                })
              }}
            />
          </div>
        </div>
      </div>
      <div className={compoundClass("absolute bottom-0 right-0 p-4 transition duration-700", { "opacity-0": !hasChanges.value })}>
        <button className="btn-primary--raised" onClick={() => {
          
          
        }}>Save</button>
      </div>
    </section>
  )
}

export default App;
