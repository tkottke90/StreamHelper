import { BaseProps } from "../../utils/component.utils"

interface HeaderProps extends BaseProps {}

export function Header({ children, className }: HeaderProps) {

  return (
    <header className={`flex justify-between items-center p-4 bg-matisse-800 text-white ${className ?? ''}`}>
      {children}
    </header>
  )
}