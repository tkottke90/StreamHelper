import { useApi } from "@/hooks/useApi";
import { BaseProps, createContextWithHook } from "@/utils/component.utils";
import { ReadonlySignal, Signal, useComputed, useSignal } from "@preact/signals";
import { UserGameDTOWithLinks, UserGameListDTO } from "../../../../backend/src/dto/userGame.dto";

interface GameDataContext {
  loading: Signal<boolean>;
  games: ReadonlySignal<UserGameDTOWithLinks[]>;
  selectedGame: Signal<UserGameDTOWithLinks | undefined>;
  selectGame: (gameId: number) => void;
  addGame: (game: UserGameDTOWithLinks) => void;
  removeGame: (gameId: number) => void;
}

const { Provider, useHook } = createContextWithHook<GameDataContext>()


function addGameToList(gameList: Signal<UserGameListDTO | undefined>, game: UserGameDTOWithLinks) {
  if (!gameList.value) {
    gameList.value = {
      games: [game],
      links: {
        self: '',
        create: ''
      }
    }
  } else {
    gameList.value = {
      ...gameList.value,
      games: gameList.value.games.concat(game)
    }
  }
}

function removeGameFromList(gameList: Signal<UserGameListDTO | undefined>, gameId: number) {
  if (!gameList.value) {
    return;
  }

  const gameBeingRemoved = gameList.value.games.find(g => g.id === gameId)

  gameList.value = {
    ...gameList.value,
    games: gameList.value.games.filter(g => g.id !== gameId)
  }

  // Return the game that is being removed.  This allows us to proactively remove
  // the game from the list before the API call returns, and if the API fails, we just add
  // it back to the list.
  return gameBeingRemoved;
}

export function GameDataContextProvider({ children }: BaseProps) {
  const { loading, data } = useApi<UserGameListDTO>(() => fetch('/api/v1/game-data/view'));

  const games = useComputed(() => data.value?.games ?? []);
  const selectedGame = useSignal<UserGameDTOWithLinks | undefined>(undefined);

  return (
    <Provider value={{
      loading,
      games,
      selectedGame,
      addGame: (game: UserGameDTOWithLinks) => {
        addGameToList(data, game);
      },
      removeGame: (gameId: number) => {
        const gameBeingRemoved = removeGameFromList(data, gameId);
        
        // Abort early if no game is found
        if (!gameBeingRemoved) {
          return;
        }

        fetch(`/api/v1/game-data/${gameId}`, {
          method: 'DELETE'
        }).then((response) => {
          if (!response.ok) {
            addGameToList(data, gameBeingRemoved);
          }

          removeGameFromList(data, gameId);
        })
      },
      selectGame: (gameId: number) => {
        const nextGame = games.value.find(g => g.id === gameId);

        if (!nextGame) {
          throw new Error('Game not found');
        }

        selectedGame.value = nextGame;
      }
    }}>
      {children}
    </Provider>
  )
}

export function useGameDataContext() {
  return useHook();
};