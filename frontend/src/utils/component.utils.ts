import { ComponentChildren, createContext } from "preact";
import { useContext, Inputs, useCallback } from "preact/hooks";

export interface DefaultProps  {
  key?: string;
  children: ComponentChildren,
  className?: string
}

export interface RouteProps extends Partial<DefaultProps> {
  path: string;
}

export function compoundClass(baseClass: string, conditionalClasses: Record<string, boolean>) {
  let result = `${baseClass}`

  Object.entries(conditionalClasses)
    .forEach(([ className, enabled ]) => {
      if (enabled) {
        result += ` ${className}`;
      }
    })

  return result;
}



// Get the appropriate event map based on the target type
type EventMapFor<T extends EventTarget> =
  T extends Window ? WindowEventMap :
  T extends Document ? DocumentEventMap :
  T extends HTMLElement ? HTMLElementEventMap :
  T extends SVGElement ? SVGElementEventMap :
  Record<string, Event>;

type EventEntry<
  TTarget extends EventTarget,
  TMap = EventMapFor<TTarget>
> = {
  [K in keyof TMap]: [K, (event: TMap[K]) => void]
}[keyof TMap];

export function createContextWithHook<TContextProps>() {
  const context = createContext<TContextProps>({} as any);

  return {
    Provider: context.Provider,
    useHook: () => {
      const ctx = useContext(context);

      if (!ctx) {
        throw new Error('Invalid Context Hook.  No Context Found');
      }

      return ctx;
    }
  }
}

export function getElemDimensionsBySelector(selector: string) {
  const elem = document.querySelector(selector);

  if (!elem) {
    return { width: 0, height: 0 }
  }

  const { width, height } = elem.getBoundingClientRect();

  return { width, height }
}

export function registerEvent(
  element: HTMLElement,
  eventName: string,
  event: (e: Event) => void
) {
  if (element) {
    element.addEventListener(eventName, event);
  }

  return () => {
    if (element) {
      element.removeEventListener(eventName, event);
    }
  };
}

export function registerEventList<TTarget extends EventTarget>(
  target: TTarget,
  events: EventEntry<TTarget>[],
  abort?: AbortController
) {
  const abortCtrl = abort ?? new AbortController();

  for (const [name, fn] of events) {
    target.addEventListener(name as string, fn as EventListener, { signal: abortCtrl.signal });
  }

  return () => {
    abortCtrl.abort();
  }
}

export function useHtmlElementListeners(
  events: [eventName: string, event: (e: Event) => void][],
  inputs: Inputs = []
) {
  return useCallback((node: HTMLElement | null) => {
    // Skip of no node is present
    if (!node) return;

    // Loop over each event provided and register it with the node
    const eventListeners = events.map(
      ([name, eventFn]) => registerEvent(node, name, eventFn )
    );

    // Register a cleanup method which unsubscribes from each
    // event during the unmounting process
    return () => {
      eventListeners.map(unsubscriber => unsubscriber())
    }
  }, inputs)
}