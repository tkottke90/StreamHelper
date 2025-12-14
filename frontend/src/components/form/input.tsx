import { forwardRef, Fragment, JSX } from "preact/compat";
import { BaseProps } from "../../utils/component.utils";
import { useSignal } from "@preact/signals";

export const Input = forwardRef<HTMLInputElement, BaseProps>((props, ref) => (
  <input
    className={`border-none px-6 py-4 ${props.className}`}
    autoComplete="off"
    data-lpignore="true"
    {...props}
    ref={ref}
  />
))

export const InputWithButton = forwardRef<HTMLInputElement, BaseProps<{ button: string | JSX.Element, onButtonClick: (e: Event) => void }>>((props, ref) => {
  const { className, button, onButtonClick: onClick, ...inputProps } = props;

  return (
    <div className={`flex gap-2 ${className}`}>
      <input
        className={`border-transparent outline-none active:border-matisse-900 grow`}
        autoComplete="off"
        data-lpignore="true"
        {...inputProps}
        ref={ref}
      />
      <button type="button" onClick={onClick}>
        {button}
      </button>
    </div>
  )
})

export const ToggleInput = forwardRef<HTMLInputElement, BaseProps<{ label: string, id: string }>>((props, ref) => {
  const toggleValue = useSignal(props.checked ?? false);
  const { label, id, ...inputProps } = props;

  return (
    <Fragment>
      <label htmlFor={id} >{label}</label>
      <Input {...inputProps} ref={ref} hidden type="checkbox" checked={toggleValue.value} />
      <div onClick={() => toggleValue.value = !toggleValue.value} data-enabled={toggleValue.value} className={`h-6 w-12 border border-transparent bg-white rounded-2xl group data-[enabled="true"]:bg-matisse-200 data-[enabled="true"]:border-matisse-500 cursor-pointer transition-color`}>
        <div className={`h-6 w-6 bg-matisse-800 border-matisse-500 rounded-full group-data-[enabled="true"]:translate-x-full -translate-y-px -translate-x-px transition-transform duration-150`} />            
      </div>
    </Fragment>
  )
})