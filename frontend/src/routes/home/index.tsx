import { useEffect } from "preact/hooks";
import AppShell from "../../components/app-shell";
import { useStreamService } from "../../services/stream.service";
import { useComputed } from "@preact/signals";
import { useAuthContext } from "../../context/auth.context";

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
  const { currentUser } = useAuthContext()


  return (
    <h1>Welcome Back, {currentUser.value?.displayName}</h1>
  )
}
