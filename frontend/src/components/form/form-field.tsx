import { BaseProps } from "../../utils/component.utils";


export function FormField({ className, children }: BaseProps) {

  return (
    <div data-type="formField" className={`flex flex-col w-full h-fit ${className}`}>
      { children }
    </div>
  )
}