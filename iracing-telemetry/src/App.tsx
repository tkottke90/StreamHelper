import { useState } from "preact/hooks";
import preactLogo from "./assets/preact.svg";
import { invoke } from "@tauri-apps/api/core";
import "./App.scss";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
    <div className="w-full h-full m-0 grid grid-cols=[300px_1fr] grid-rows-[56px_1fr]">
      <header className="py-2 px-4">
        <h2 className="m-0">Stream Helper - iRacing Telemetry Listener</h2>
      </header>
      <aside></aside>
      <main>
        
      </main>
    </div>
  );
}

export default App;
