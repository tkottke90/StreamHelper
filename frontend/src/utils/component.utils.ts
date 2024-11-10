import { ComponentChildren } from "preact";
import { JSXInternal } from "preact/src/jsx";

export interface DefaultProps  {
  key?: string;
  children: ComponentChildren,
  className?: string
}

export interface RouteProps extends Partial<DefaultProps> {
  path: string;
}