import { useApi } from "@/hooks/useApi";
import { createContextWithHook } from "@/utils/component.utils";
import { fetchWithRetry } from "@/utils/http.utils";
import { ReadonlySignal, useComputed } from "@preact/signals";
import { UserApiKeyWithSecretDTOWithLinks, UserApiKeyWithSecretDTOWithLinksSchema } from "../../../../backend/src/dto/user-api-key.dto";

// Response type for the list endpoint
type UserApiKeyListResponse = {
  content: UserApiKeyWithSecretDTOWithLinks[];
  links: {
    self: string;
    create: string;
  };
};

type ApiKeysContextValue = {
  loading: boolean;
  apiKeys: ReadonlySignal<UserApiKeyWithSecretDTOWithLinks[]>;
  refresh: () => Promise<void>;
  deleteKey: (keyId: number) => Promise<void>;
};

function deleteKey(keyId: number) {
  return fetchWithRetry(
    () => fetch(`/api/v1/user-api-keys/${keyId}`, { method: 'DELETE' })
  );
}

const { Provider, useHook } = createContextWithHook<ApiKeysContextValue>();

export function ApiKeysContextProvider({ children }: { children: any }) {
  const { loading, data, loadData } = useApi<UserApiKeyListResponse>(() => fetch('/api/v1/user-api-keys'));

  const apiKeys = useComputed(() => {
    if (!data.value?.content) {
      return [];
    }

    return data.value?.content.map(key => UserApiKeyWithSecretDTOWithLinksSchema.parse(key));
  });

  const contextValue: ApiKeysContextValue = {
    loading: loading.value,
    apiKeys,
    refresh: loadData,
    deleteKey: async (keyId: number) => {
      await deleteKey(keyId);
      loadData();
    }
  };


  return (
    <Provider value={contextValue}>
      {children}
    </Provider>
  )
}

export function useApiKeysContext() {
  return useHook();
}