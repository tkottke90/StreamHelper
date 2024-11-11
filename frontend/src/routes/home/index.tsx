import AppShell from "../../components/app-shell";
import { Actions } from "../../components/layout/actions";
import { CreateStream } from "./create-stream";
import { StreamList } from "./stream-table";

export default () => {
  return (
    <AppShell>
      <main className="p-4">
        <div class="card">
          <div className="flex justify-between mb-2">
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



