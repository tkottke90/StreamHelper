import { forwardRef } from "preact/compat";
import { BaseProps } from "../../utils/component.utils";
import { JSXInternal } from "preact/src/jsx";

const variants: Record<string, string> = {
  default: 'hover:bg-zinc-400 active:bg-zinc-500 active:text-white',
  primary: 'text-matisse-900 hover:bg-matisse-800/20 active:bg-matisse-800 active:border-matisse-900 active:text-white',
  primaryOutline: '!border-matisse-900 text-matisse-900 hover:bg-matisse-800/20 active:bg-matisse-800 active:text-white',
  secondary: '',
  secondaryOutline: '',
  destructive: 'text-rose-500 hover:bg-rose-400/20 active:bg-rose-500 active:text-white'
}

export const Button = forwardRef<HTMLButtonElement, BaseProps<{ variant: keyof typeof variants }>>((props, ref) => {
  const {variant, ...btnProps} = props;
  
  return (<button
    ref={ref} {...btnProps}
    className={`border border-transparent rounded-2xl outline-transparent py-2 px-4 ${variants[variant ?? 'default']} disabled:bg-zinc-600/30 disabled:text-zinc-800/50 disabled:cursor-default`}
  />)
});
