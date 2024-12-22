import AppShell from "../../components/app-shell";
import { Actions } from "../../components/layout/actions";
import { CreateStream } from "../home/create-stream";
import { StreamList } from "../home/stream-table";


export default function StreamPage() {

  return (
    <AppShell>
      <main className="p-4">
        <div className="flex justify-between mb-2">
          <h1>Streams</h1>
          <Actions>
            <CreateStream />
          </Actions>
        </div>  
        <StreamList />
      </main>
    </AppShell>
  )
}