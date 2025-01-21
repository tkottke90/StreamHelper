import { ComponentChildren } from "preact";

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
