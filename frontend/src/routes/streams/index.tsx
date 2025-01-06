import { RefreshCw } from "lucide-preact";
import AppShell from "../../components/app-shell";
import { Actions } from "../../components/layout/actions";
import { useStreamService } from "../../services/stream.service";
import { CreateStream } from "../home/create-stream";
import { StreamList } from "../home/stream-table";
import { Signal, useSignal } from "@preact/signals";


export default function StreamPage() {
  const loading = useSignal(false);
  const { loadStreams } = useStreamService();

  return (
    <AppShell>
      <main className="p-4">
        <div className="flex justify-between mb-4">
          <h1 className="flex gap-2">
            <span>Streams</span>
            <button onClick={() => loadStreams()} disabled={loading.value}>
              <RefreshCw />
            </button>
          </h1>
          <Actions>
            <CreateStream />
          </Actions>
        </div>  
        <section className="p-2">
          <StreamList />
        </section>
      </main>
    </AppShell>
  )
}

async function loadingWrapper<T extends CallableFunction>(loading: Signal<boolean>, asyncFn: T) {
  
}