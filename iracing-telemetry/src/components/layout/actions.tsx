import { ComponentChildren } from 'preact';

export function Actions({ children }: { children: ComponentChildren }) {
  return <div className="flex justify-end gap-4">{children}</div>;
}
