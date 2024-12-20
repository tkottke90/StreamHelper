import { Link } from "preact-router/match";
import { DefaultProps } from "../../utils/component.utils";
import { Dialog } from "../dialog";

const DRAWER_BASE_STYLES = `flex flex-col justify-start items-center bg-matisse-800 text-white pb-4`;
const BASE_NAV_STYLE = "bg-oxford-blue-900 text-white uppercase text-center cursor-pointer w-full block py-6 px-2 hover:bg-oxford-blue-950 hover:text-matisse-300 hover:text-underline pointer";

export function Drawer({ children, className }: DefaultProps) {
  return <aside className={`drawer ${className ?? ""}`}>{children}</aside>;
}

export interface Link {
  display: string;
  href: string;
  active: boolean;
}

interface DrawerLayoutProps extends DefaultProps {
  links?: Link[];
}

export function DrawerLayout(layoutProps: DrawerLayoutProps) {
  return (
    <main className={`w-full h-full overflow-hidden grid grid-cols-[250px_1fr]`}>
      <Drawer>
        <header className="text-center p-4">
          <h1>Stream Helper</h1>
        </header>
        <DrawerNav links={layoutProps.links ?? []} className="w-full flex-grow" />
        <nav className="w-full">
          <Dialog trigger={<div className={BASE_NAV_STYLE}>About</div>}>
            <div className="flex justify-between items-start min-w-[400px]">
              <h3>Stream Helper App</h3>
              <button><p class="iconify mdi--close"></p></button>
            </div>
            <p><strong>Author:</strong> Thomas Kottke</p>
            <p><strong>Version:</strong> 1.0.0-Alpha</p>
            <p><strong>Copyright:</strong> 2024</p>
          </Dialog>
          <a className={BASE_NAV_STYLE} href="/logout">Logout</a>
        </nav>
      </Drawer>
      <section className={`w-full h-full overflow-y-auto overflow-x-hidden ${layoutProps.className}`}>{layoutProps.children}</section>
    </main>
  );
}

export function DrawerNav({ links, className }: { className?: string, links: Link[] }) {
  return (
    <nav className={className}>
      {links.map((link) => {
        return (
          <Link className={BASE_NAV_STYLE} href={link.href} activeClassName="link--active" >
            {link.display}
          </Link>
        );
      })}
    </nav>
  );
}
