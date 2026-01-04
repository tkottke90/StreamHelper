import AppShell from "@/components/app-shell";
import { Table } from "@/components/layout/table";
import { BaseProps } from "@/utils/component.utils";
import { route } from "preact-router";
import { UserGameDTOWithLinks } from "../../../../../backend/src/dto/userGame.dto";
import { useGameDataContext } from "../game-data.context";
import { CreateGameDialog } from "./create-game-data";

export function GameDataPage() {
  
  return (
    <AppShell>
      <section className="p-4">
        <header className="flex justify-between">
          <h1>Game Data</h1>
          <CreateGameDialog />
        </header>
        <p className="w-[70ch] mt-1">
          This page is used to manage the game data that is sent to the server.  
          You can view the data that has been sent, as well as manage the keys that are used to store the data.
        </p>
        <br />
        <GameTable />
      </section>
    </AppShell>
  )
}

export function GameTable() {
  const { loading, games } = useGameDataContext();


  return (
    <Table headers={['Game', 'Sessions', 'Keys', 'Data Records', 'Last Update']}>
      { loading.value && <p>Loading...</p> }
      
      { games.value.map(game => <GameTableRow key={game.id} game={game} />) }
    </Table>
  )
}

export function GameTableRow({ game }: BaseProps<{ game: UserGameDTOWithLinks }>) {
  const { selectGame } = useGameDataContext();
  
  return (
    <tr
      className="hover:bg-slate-200 dark:hover:bg-slate-600 *:py-4 cursor:pointer text-center"
      onClick={() => {
        selectGame(game.id);

        route(`/app/game-data/${game.id}`)
      }}  
    >
      <td>{game.game}</td>
      <td>10</td>
      <td>100</td>
      <td>1000</td>
      <td>2025-12-20 10:00:00</td>
    </tr>
  )
}