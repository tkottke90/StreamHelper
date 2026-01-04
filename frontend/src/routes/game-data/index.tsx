import { IsLoggedIn } from "@/components/auth/isLoggedIn";
import { RouteProps } from "@/utils/component.utils";
import Router from "preact-router";
import { GameDataDetailsPage } from "./game-data-details";
import { GameDataPage } from "./game-data-list";
import { GameDataContextProvider } from "./game-data.context";

export function GameDataRoutes(props: RouteProps) {

  return (
    <GameDataContextProvider>
      <Router>
        <IsLoggedIn path="/app/game-data" component={GameDataPage} />
        <IsLoggedIn path="/app/game-data/:gameId" component={GameDataDetailsPage} />
      </Router>
    </GameDataContextProvider>
  )


}
