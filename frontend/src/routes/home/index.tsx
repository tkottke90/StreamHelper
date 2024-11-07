import { Fragment } from "preact/jsx-runtime";
import { Actions } from "../../components/layout/actions";
import { Header } from "../../components/layout/header";
import AppShell from "../../components/app-shell";
import { useStreamService } from "../../services/steram.service";
import { useSignalEffect } from "@preact/signals";

export default () => {
  const { loadStreams } = useStreamService();

  useSignalEffect(() => {
    loadStreams();
  })

  return(
    <AppShell>
      <main className="p-4">
        <div class="card">
          <h1>This is a home page</h1>
          <p>should be protected</p>
        </div>
      </main>
    </AppShell>
  )
}

function StreamList() {

}

