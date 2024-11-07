import { DefaultProps } from "../utils/component.utils";
import { DrawerLayout, Link } from "./layout/drawer";

const links: Link[] = [
  { display: 'Home', href: '/app', active: false }
]

export default function AppShell({ children }: DefaultProps) {

  return (
    <DrawerLayout links={links}>
      {children}
    </DrawerLayout>
  )
}