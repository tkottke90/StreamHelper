import { Dialog, useDialogContext } from "@/components/dialog"
import { Button } from "@/components/form/button"
import { FormField } from "@/components/form/form-field"
import { Actions } from "@/components/layout/actions"
import { fetchWithRetry } from "@/utils/http.utils"
import { CircleQuestionMarkIcon, Plus } from "lucide-preact"
import { UserGameDTOWithLinks } from "../../../../../backend/src/dto/userGame.dto"
import { useGameDataContext } from "../game-data.context"

export function CreateGameDialog() {
  const { addGame } = useGameDataContext();

  return (
    <Dialog
      title="Create New Game"
      trigger={<Button variant="primaryRaised" className="btn-primary--raised"><Plus /></Button>}
      onClose={() => {
        console.log('modal closed')
      }}
      onCancel={() => {
        console.log('modal cancelled')
      }}
    >
      <CreateGame onGameCreated={(game) => addGame(game)} />
    </Dialog>
  )
}

export function CreateGame({ onGameCreated }: { onGameCreated: (game: UserGameDTOWithLinks) => void }) {
  const { close } = useDialogContext();

  return (
    <form onSubmit={(e) => {
      e.preventDefault();

      const form = e.target as HTMLFormElement;

      if (!form) {
        throw new Error('Form not found');
      }

      const formData = new FormData(form);
      const body = Object.fromEntries(formData.entries());

      fetchWithRetry(
        () => fetch('/api/v1/game-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })
      ).then(async (result) => {
        // Get the data from the response
        const data = await result.json();

        // Reset the form
        form.reset();

        // Update state
        onGameCreated(data);

        // Close the dialog and pass back the data
        close();
      })
    }}>
      <FormField>
        <label htmlFor="game">Name</label>
        <input id="game" name="game" className="rounded border px-4 py-2" placeholder="iRacing" />
      </FormField>
      <br />
      <FormField className="flex flex-row gap-4 items-center">
        <input type="checkbox" id="allowAutoCreateSessions" name="allowAutoCreateSessions" className="rounded border px-4 py-2" />
        <label htmlFor="allowAutoCreateSessions" className="flex gap-1">
          <span>Allow sessions to be created automatically</span>
          <CircleQuestionMarkIcon size={14} className="cursor-pointer" />
        </label>
      </FormField>
      <Actions className="justify-end">
        <Button variant="primaryRaised" type="submit">
          Create
        </Button>
      </Actions>
    </form>
  )
}