import { batch, computed, Signal, useComputed, useSignal, useSignalEffect } from "@preact/signals";
import { ComponentChildren, createContext, Fragment } from "preact";
import { useEffect } from "preact/hooks";

function ContextLoading({ message }: { message: string }) {
  return (
    <div>
      <h2>Loading</h2>
      <p>{message}</p>
    </div>
  )
}

function ContextError({ name, error }: { name: string, error: Signal<string> }) {
  return (
    <div className="">
      <h2>{name}</h2>
      <p>{error}</p>
    </div>
  ) 
}

export function createAsyncContext<T>(defaultValue: T, reloadFn: () => Promise<void>) {
  const contextLoading = new Signal(false);
  const contextError = new Signal('');
  const isReady = computed(() => !contextLoading.value && !contextLoading.value)

  const context = createContext(defaultValue);

  const triggerReload = () => {
    // Skip if we are already loading
    if (!contextLoading.value) {
      batch(() => {
        contextLoading.value = true;
        contextError.value = '';
      });
  
      let nextError = '';
  
      reloadFn()
        .catch(error => {
          nextError = error.message
        })
        .finally(() => {
          batch(() => {
            contextLoading.value = false;
            contextError.value = nextError;
          });
        })
    }
  }

  const provider = ({children}: { children: ComponentChildren }) => {
    useEffect(() => {
      triggerReload()
    }, []);
    
    return (
      <Fragment>
        {contextLoading.value && <ContextLoading message="" />}
        {contextError.value && <ContextError name="Context Error" error={contextError} />}
        {isReady && <context.Provider value={ defaultValue }>{ children }</context.Provider>}
      </Fragment>
    )
  };

  return {
    provider,
    context,
    triggerReload
  }
}