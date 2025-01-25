import { ComponentChildren } from 'preact';

export function FormField({ children }: { children: ComponentChildren }) {
  return <div className="flex flex-col w-full gap-2">{children}</div>;
}
