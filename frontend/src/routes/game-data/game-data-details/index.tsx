import AppShell from "@/components/app-shell";
import { Button } from "@/components/form/button";
import { ArrowLeft } from "lucide-preact";
import { route } from "preact-router";
import { useGameDataContext } from "../game-data.context";


export function GameDataDetailsPage() {
  const { selectedGame } = useGameDataContext();

  return (
    <AppShell>
      { selectedGame.value && <GameDataDetails /> }
      
      { !selectedGame.value && <EmptyGameDataDetailsPage /> }
    </AppShell>
  )
}

export function EmptyGameDataDetailsPage() {
  
  return (
    <section className="p-4">
      <a href="/app/game-data">
        <Button variant="default" className="flex gap-2">
          <ArrowLeft />
  
          <span>Back</span>
        </Button>
      </a>
      <h1>Game Details: None Selected</h1>
    </section>
  )
}

export function GameDataDetails() {
  const { removeGame, selectedGame } = useGameDataContext();

  return (
    <section className="p-4">
      <header className="flex justify-between items-center">
        <a href="/app/game-data">
          <Button variant="default" className="flex gap-2">
            <ArrowLeft />
            <span>Back</span>
          </Button>
        </a>
        <Button variant="destructiveRaised" onClick={() => {
          // TODO: Add confirmation dialog

          console.assert(!!selectedGame!.value!.id, { message: 'Game ID is missing on the selected game' });

          removeGame(selectedGame!.value!.id);

          route('/app/game-data');
        }}>
          Delete
        </Button>
      </header>
      <h1>Game Details: <span>{selectedGame.value?.game}</span></h1>
      <div className="p-4">
        <GameKeyList />
      </div>
    </section>
  )
}

export function GameKeyList() {
  return (
    <section className="p-4 bg-matisse-600 border-matisse-700 border rounded w-75">
      <h2>Game Keys</h2>
      <br />
      <div className="overflow-y-auto h-50">
        <table>
          <thead>
            <tr>
              <th>Key</th>
            </tr>
          </thead>
        </table>
      </div>
    </section>
  )
}

