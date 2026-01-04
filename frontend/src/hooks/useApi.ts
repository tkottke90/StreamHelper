import { refreshAccessToken } from "@/services/auth.service";
import { parseJsonResponse } from "@/utils/http.utils";
import { Signal, useSignal } from "@preact/signals";
import { useCallback, useEffect } from "preact/hooks";

class AuthenticationError extends Error {}

export async function fetchWithRetry(fetchFn: () => Promise<Response>, maxRetries: number = 3) {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      const response = await fetchFn()
        .then(response => {
          if (response.status === 401) {
            throw new AuthenticationError(`API Returned 401 Unauthorized`);
          }

          return response;
        });

      return response;
    } catch (err) {
      retries++;

      // When the count of errors exceeds the max retries, abort and propagate the error
      if (retries >= maxRetries) {
        throw err;
      }
      
      // We handle the Authentication Error by trying to refresh the token and retry
      if (err instanceof AuthenticationError) {
        await refreshAccessToken();
        continue;
      }

      // For all other errors, we log them to the console and retry
      console.error(err);
    }
  }
}

export function useApi<T extends Record<string, any>>(fetchFn: () => Promise<Response>, responseHandler?: (response: Response) => Promise<T>) {
  const loading = useSignal(false);
  const error = useSignal<string | undefined>();
  const data = useSignal<T | undefined>();

  const loadData = useCallback(async () => {
    loading.value = true;
    error.value = undefined;
    data.value = undefined;

    console.log('Loading Data')

    try {
      const response = await fetchWithRetry(fetchFn);

      if (!response) {
        throw new Error('No response received');
      }

      if (responseHandler) {
        const result = await responseHandler(response);
        data.value = result;
      } else {
        data.value = await parseJsonResponse<T>(response);
      }
    } catch (err) {
      error.value = (err as any)?.message ?? 'Unknown Error';
    } finally {
      loading.value = false;
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [ loadData ]);

  return {
    loading,
    error,
    data,
    loadData
  }
}

export function useFilterApi<
  TData extends Record<string, any>,
  TFilter extends Signal<Record<string, any>>
>(
  filter: TFilter,
  fetchFn: (filter: Record<string, any>) => Promise<Response>,
  responseHandler?: (response: Response) => Promise<TData>
) {
  const { loading, error, data, loadData} = useApi(() => fetchFn(filter.value), responseHandler);

  useEffect(() => {
    const unsubscribe = filter.subscribe(() => {
      loadData();
    });

    return () => {
      unsubscribe();
    }
  }, [ filter ])

  return {
    loading,
    error,
    data,
    loadData
  }
}