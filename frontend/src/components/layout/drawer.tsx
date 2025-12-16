import { Link as RouterLink } from "preact-router";
import { BaseProps } from "../../utils/component.utils";
import { Dialog } from "../dialog";
import { useAppInfo } from "../../services/app-info.service";

const BASE_NAV_STYLE = "uppercase text-center cursor-pointer w-full block py-4 px-2 hover:bg-oxford-blue-500 dark:hover:bg-oxford-blue-800";

export function Drawer({ children, className }: BaseProps) {
  return <aside className={`drawer ${className ?? ""}`}>{children}</aside>;
}

export interface Link {
  display: string;
  href: string;
  active: boolean;
}

interface DrawerLayoutProps extends BaseProps {
  links?: Link[];
}

export function DrawerLayout(layoutProps: DrawerLayoutProps) {
  return (
    <main className={`w-full h-full overflow-hidden grid grid-cols-[250px_1fr]`}>
      <Drawer>
        <header className="text-center p-4">
          <h2>Stream Helper</h2>
        </header>
        <DrawerNav links={layoutProps.links ?? []} className="w-full grow" />
        <nav className="w-full">
          <AboutDialog />
          <a className={BASE_NAV_STYLE} href="/logout">Logout</a>
        </nav>
      </Drawer>
      <section className={`w-full h-full overflow-y-auto overflow-x-hidden ${layoutProps.className} border-l shadow-lg bg-matisse-50 border-oxford-blue-400 dark:bg-matisse-950 dark:text-white`}>{layoutProps.children}</section>
    </main>
  );
}

export function DrawerNav({ links, className }: { className?: string, links: Link[] }) {
  // Cast RouterLink as any to avoid TypeScript errors with href prop
  const LinkComponent = RouterLink as any;

  return (
    <nav className={className}>
      {links.map((link) => {
        return (
          <LinkComponent className={BASE_NAV_STYLE} href={link.href} activeClassName="link--active" >
            {link.display}
          </LinkComponent>
        );
      })}
    </nav>
  );
}

function AboutDialog() {
  const appInfo = useAppInfo();

  return (
    <Dialog title={"Stream Helper App"} trigger={<div className={BASE_NAV_STYLE}>About</div>}>
      <a target="_blank" href={appInfo.value?.repository}><strong>Repository:</strong> {appInfo.value?.repository}</a>
      <p><strong>Version:</strong> {appInfo.value?.version}</p>
    </Dialog>
  )
}