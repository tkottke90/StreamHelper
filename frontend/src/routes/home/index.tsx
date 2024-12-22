import { useEffect } from "preact/hooks";
import AppShell from "../../components/app-shell";
import { Actions } from "../../components/layout/actions";
import { useStreamService } from "../../services/steram.service";
import { CreateStream } from "./create-stream";
import { StreamList } from "./stream-table";
import { useComputed } from "@preact/signals";

export default function HomePage() {
  const { loadStreams, streams } = useStreamService();
  const streamCount = useComputed(() => streams.value.length);

  useEffect(() => { loadStreams() }, [])

  return (
    <AppShell>
      <main className="p-4">
        <Welcome />
        <br />
        <div class="card py-4 px-12 w-fit">
          <h2>Streams</h2>
          <br />
          <p className="text-[64px] text-center leading-[64px]">{streamCount}</p>
        </div>
      </main>
    </AppShell>
  );
};

function Welcome() {

  return (
    <h1>Welcome Back, Thomas</h1>
  )
}
