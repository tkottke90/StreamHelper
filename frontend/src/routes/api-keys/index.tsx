import AppShell from "@/components/app-shell";
import { Button, ConfirmButton, CopyButton } from "@/components/form/button";
import { Actions } from "@/components/layout/actions";
import { BaseProps } from "@/utils/component.utils";
import { copyToClipboard } from "@/utils/html.utils";
import { useSignal } from "@preact/signals";
import { Copy, RefreshCcw } from "lucide-preact";
import { ApiKeysContextProvider, useApiKeysContext } from "./api-keys.context";
import { CreateApiKey } from "./create-api-key";

export function ApiKeysPage() {

  return (
    <AppShell>
      <ApiKeysContextProvider>
        <main className="p-4">
          <header className="flex justify-between">
            <h1>API Keys</h1>

            <CreateApiKey />
          </header>
          <br />
          <p className="w-[70ch] mt-1">
            This page is used to manage the API keys that are used to authenticate to the server.  You can create new keys, as well as regenerate or delete existing keys.
          </p>
          <br />
          <ApiKeysTable />
        </main>
      </ApiKeysContextProvider>
    </AppShell>
  )
}

export function ApiKeysTable({}: BaseProps) {
  const { apiKeys, deleteKey } = useApiKeysContext();
  const copyFeedback = useSignal<{ keyId: number; success: boolean } | null>(null);

  const handleCopy = async (keyId: number, text: string) => {
    try {
      await copyToClipboard(text);
      copyFeedback.value = { keyId, success: true };
      // Clear feedback after 2 seconds
      setTimeout(() => {
        copyFeedback.value = null;
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      copyFeedback.value = { keyId, success: false };
      // Clear feedback after 3 seconds for errors
      setTimeout(() => {
        copyFeedback.value = null;
      }, 3000);
    }
  };

  return (
    <table class="table-fixed w-full">
      <colgroup>
        {/* Name column - wider for longer names */}
        <col class="w-1/6" />

        {/* Key column - wider for UUIDs */}
        <col class="w-1/4" />

        {/* Created On - medium width for dates */}
        <col class="w-28" />

        {/* Expires On - medium width for dates */}
        <col class="w-28" />

        {/* Last Used - medium width for dates */}
        <col class="w-28" />

        {/* Status - for expired/active indicator */}
        <col class="w-24" />

        {/* Actions - fixed width for buttons */}
        <col class="w-50 " />
      </colgroup>
      <thead>
        <tr>
          <th>Name</th>
          <th>Key</th>
          <th>Created On</th>
          <th>Expires On</th>
          <th>Last Used</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {apiKeys.value.map(key => (
          <tr key={key.id}>
            <td className="py-4">{key.name}</td>
            <td className="py-4">
              <div className="flex items-center gap-2">
                <code className="text-sm bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded truncate max-w-xs">
                  {key.key}
                </code>
                <CopyButton
                  className="p-1!"
                  value={() => key.key}
                  title="Copy API Key"
                >
                  <Copy size={14} />
                </CopyButton>
              </div>
            </td>
            <td className="py-4 text-center">{key.createdAt.toLocaleDateString()}</td>
            <td className="py-4 text-center">{key.expiresAt?.toLocaleDateString() ?? 'Never'}</td>
            <td className="py-4 text-center">{key.lastUsedAt?.toLocaleDateString() ?? 'Never used'}</td>
            <td className="py-4 text-center">
              {key.isExpired ? (
                <span class="text-red-600 font-semibold">Expired</span>
              ) : key.neverExpires ? (
                <span class="text-green-600">Active</span>
              ) : (
                <span class="text-green-600">Active</span>
              )}
            </td>
            <td>
              <Actions className="flex justify-center items-end gap-4">
                <Button variant="primaryRaised" title="Regenerate Key" icon className="p-1!" >
                  <RefreshCcw size={16} />
                </Button>
                <ConfirmButton
                  title="Delete Key"
                  confirmTitle="Confirm Delete"
                  icon className="p-1!"
                  onConfirm={() => deleteKey(key.id)}
                />
              </Actions>
            </td>
          </tr>
          ))}
      </tbody>
    </table>
  )
}