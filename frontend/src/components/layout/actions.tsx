import { DefaultProps } from "../../utils/component.utils";

interface ActionProps extends DefaultProps {}

export function Actions({ children, className }: ActionProps) {
  return (
    <div className={`flex justify-end items-center gap-2 ${className}`}>
      {children}
    </div>
  )
}