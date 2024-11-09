import { useSignalEffect } from "@preact/signals";
import AppShell from "../../components/app-shell";
import { Actions } from "../../components/layout/actions";
import { useStreamService } from "../../services/steram.service";
import { DefaultProps } from "../../utils/component.utils";
import { Dialog } from "../../components/dialog";

export default () => {
  const { loadStreams, streams } = useStreamService();

  useSignalEffect(() => {
    loadStreams();
  });

  return (
    <AppShell>
      <main className="p-4">
        <div class="card">
          <div className="flex justify-between">
            <h1>Streams</h1>
            <Actions>
              <CreateStream />
            </Actions>
          </div>
          <StreamList />
        </div>
      </main>
    </AppShell>
  );
};

function StreamList() {
  const { streams } = useStreamService();

  if (streams.value.length === 0) {
    return <EmptyList />;
  }

  return (
    <table>
      <thead></thead>
    </table>
  );
}

function EmptyList() {
  return (
    <div className="p-4 flex flex-col gap-4">
      <p className="text-center">No Active Streams. Click below to start one.</p>
      <Actions className="justify-center">
        <button className="btn-accent--raised">
          <p class="iconify mdi--plus"></p>
          <span>Create Stream</span>
        </button>
      </Actions>
    </div>
  );
}

function CreateStream({ label }: { label?: string }) {
  const button = (
    <button className="btn-accent">
      <p class="iconify mdi--plus"></p>
      <span>{label ?? ''}</span>
    </button>
  );

  return (
    <Dialog trigger={button}>
      <h2>Create New Stream</h2>
    </Dialog>
  )
}
