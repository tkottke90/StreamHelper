import { useSignal } from "@preact/signals"
import { HTMLAttributes } from "preact/compat";

interface InputProps extends HTMLAttributes<HTMLInputElement> {}

export function Input(props: InputProps) {
  const value = useSignal<InputProps["value"]>(props.value ?? '');
  
  return (<input {...props} value={value.value} onInput={(e: InputEvent) => {
    e.preventDefault();

    const target = e.target as HTMLInputElement;
    value.value = target.value;
  }} />)
}