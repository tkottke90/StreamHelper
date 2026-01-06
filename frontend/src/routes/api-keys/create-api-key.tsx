import { FormDialog } from "@/components/dialog/form.dialog";
import { Button } from "@/components/form/button";
import { FormField } from "@/components/form/form-field";
import { Actions } from "@/components/layout/actions";
import { BaseProps } from "@/utils/component.utils";
import { fetchWithRetry } from "@/utils/http.utils";
import { useSignal } from "@preact/signals";
import { useApiKeysContext } from "./api-keys.context";


export function CreateApiKey({ }: BaseProps) {
  const { refresh } = useApiKeysContext();
  const loading = useSignal(false);

  return (
    <FormDialog
      title="Create API Key"
      onSave={async (data) => {
        console.log('Saving:', data);

        fetchWithRetry(
          () => fetch('/api/v1/user-api-keys', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(Object.fromEntries(data.entries()))
          })
        ).then(() => {
          // Update state
          refresh();
        });
      }}
    >
      <FormField>
        <label htmlFor="name">Key Name</label>
        <input id="name" name="name" className="rounded border px-4 py-2" placeholder="My Key" />
      </FormField>

      <br />

      <Actions className="justify-end">
        <Button variant="primaryRaised" type="submit">
          Create
        </Button>
      </Actions>
    </FormDialog>
  )
}

