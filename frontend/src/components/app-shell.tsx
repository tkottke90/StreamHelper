import { BaseProps } from "../utils/component.utils";
import { DrawerLayout, Link } from "./layout/drawer";

const links: Link[] = [
  { display: 'Home', href: '/app', active: false },
  { display: 'Streams', href: '/app/streams', active: false },
  { display: 'Game Data', href: '/app/game-data', active: false },
  { display: 'API Keys', href: '/app/keys', active: false },
  // { display: 'Assets', href: '/assets', active: false },
]

export default function AppShell({ children }: BaseProps) {

  return (
    <DrawerLayout links={links}>
      {children}
    </DrawerLayout>
  )
}