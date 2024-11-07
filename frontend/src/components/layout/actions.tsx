import { DefaultProps } from "../../utils/component.utils";

interface ActionProps extends DefaultProps {}

export function Actions({ children }: ActionProps) {
  return (
    <div className="flex justify-end items-center gap-2">
      {children}
    </div>
  )
}