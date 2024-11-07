import { ComponentChildren } from "preact";
import { JSXInternal } from "preact/src/jsx";

export interface DefaultProps  {
  children: ComponentChildren,
  className?: string
}