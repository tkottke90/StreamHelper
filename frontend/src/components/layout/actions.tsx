import { BaseProps } from "../../utils/component.utils";

export function Actions({ children, className }: BaseProps) {
  return (
    <div className={`flex justify-center items-center gap-2 ${className}`}>
      {children}
    </div>
  )
}