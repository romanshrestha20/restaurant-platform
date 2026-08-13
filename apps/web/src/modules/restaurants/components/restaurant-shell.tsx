"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import {
  Avatar,
  Brand,
  Breadcrumb,
  Divider,
  Dropdown,
  DropdownItem,
  ThemeSelector,
} from "@/components/ui";
import { ProtectedRoute, useAuth } from "@/modules/auth";
import {
  ActiveRestaurantProvider,
  useActiveRestaurant,
} from "../context/active-restaurant-context";
import { RestaurantAvatar } from "./restaurant-avatar";

type WorkspaceLink = {
  label: string;
  segment: string;
  available: boolean;
  icon: NavIconName;
};

type NavIconName =
  | "overview"
  | "orders"
  | "reservations"
  | "menu"
  | "customers"
  | "general"
  | "staff"
  | "locations"
  | "hours"
  | "media"
  | "settings";

const operations: WorkspaceLink[] = [
  { label: "Overview", segment: "", available: true, icon: "overview" },
  { label: "Orders", segment: "orders", available: false, icon: "orders" },
  {
    label: "Reservations",
    segment: "reservations",
    available: false,
    icon: "reservations",
  },
  { label: "Menu", segment: "menu", available: false, icon: "menu" },
  {
    label: "Customers",
    segment: "customers",
    available: false,
    icon: "customers",
  },
];

const management: WorkspaceLink[] = [
  { label: "General", segment: "general", available: true, icon: "general" },
  { label: "Staff", segment: "staff", available: false, icon: "staff" },
  {
    label: "Locations",
    segment: "locations",
    available: true,
    icon: "locations",
  },
  {
    label: "Opening hours",
    segment: "opening-hours",
    available: true,
    icon: "hours",
  },
  { label: "Brand media", segment: "media", available: true, icon: "media" },
  { label: "Settings", segment: "settings", available: true, icon: "settings" },
];

function RestaurantWorkspaceShell({ children }: { children: ReactNode }) {
  const { activeMembership, memberships, status } = useActiveRestaurant();
  const { signOut, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isWorkspace =
    /^\/restaurants\/[^/]+/.test(pathname) &&
    !pathname.startsWith("/restaurants/new");

  const logout = async () => {
    try {
      await signOut();
    } finally {
      router.replace("/login");
    }
  };

  if (!isWorkspace) {
    return (
      <div className="restaurant-app restaurant-app--personal">
        <header className="restaurant-header">
          <Brand href="/restaurants" />
          <nav className="restaurant-header__nav" aria-label="Main navigation">
            <Link className="is-active" href="/restaurants">
              Restaurants
            </Link>
            <Link href="/account/profile">Personal</Link>
          </nav>
          <div className="restaurant-header__actions">
            <UserMenu logout={logout} user={user} />
          </div>
        </header>
        <main className="restaurant-workspace restaurant-workspace--selector">
          {children}
        </main>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="session-loader" role="status">
        <span className="session-loader__mark">T</span>
        <span>Opening restaurant workspace…</span>
      </div>
    );
  }

  const restaurant = activeMembership?.restaurant;
  const logo = restaurant?.media.find((item) => item.type === "LOGO");
  const basePath = restaurant
    ? `/restaurants/${restaurant.id}`
    : "/restaurants";
  const activeLink = [...operations, ...management].find((link) => {
    const href = link.segment ? `${basePath}/${link.segment}` : basePath;
    return pathname === href;
  });

  return (
    <div className="workspace-shell">
      <aside className="workspace-sidebar">
        <div className="workspace-sidebar__brand">
          <Brand href="/restaurants" light />
        </div>

        {restaurant && activeMembership ? (
          <Dropdown
            align="start"
            label="Switch restaurant"
            trigger={
              <span className="workspace-switcher__trigger">
                <RestaurantAvatar
                  className="workspace-switcher__logo"
                  logoUrl={logo?.media.url}
                  name={restaurant.name}
                />
                <span className="workspace-switcher__copy">
                  <strong>{restaurant.name}</strong>
                  <small>{activeMembership.callerRole.toLowerCase()}</small>
                </span>
                <span aria-hidden="true">⌄</span>
              </span>
            }
          >
            <div className="workspace-switcher__menu-heading">Restaurants</div>
            {memberships.map((membership) => (
              <DropdownItem
                className="workspace-switcher__item"
                key={membership.restaurant.id}
                onClick={() =>
                  router.push(`/restaurants/${membership.restaurant.id}`)
                }
              >
                <span>{membership.restaurant.name}</span>
                <small>{membership.callerRole.toLowerCase()}</small>
              </DropdownItem>
            ))}
            <Divider className="workspace-menu__divider" />
            <DropdownItem onClick={() => router.push("/restaurants/new")}>
              + Create restaurant
            </DropdownItem>
          </Dropdown>
        ) : null}

        <WorkspaceNav
          basePath={basePath}
          label="Operations"
          links={operations}
          pathname={pathname}
        />
        <WorkspaceNav
          basePath={basePath}
          label="Management"
          links={management}
          pathname={pathname}
        />
      </aside>

      <div className="workspace-canvas">
        <header className="workspace-topbar">
          <div className="workspace-topbar__context">
            <Breadcrumb
              items={[
                {
                  href: "/restaurants",
                  label: restaurant?.name ?? "Restaurant",
                },
                { label: activeLink?.label ?? "Workspace" },
              ]}
              label="Restaurant workspace"
            />
          </div>
          <UserMenu logout={logout} user={user} />
        </header>
        <header className="workspace-mobile-header">
          <Link href="/restaurants">←</Link>
          <strong>{restaurant?.name ?? "Restaurant"}</strong>
          <UserMenu compact logout={logout} user={user} />
        </header>
        <main className="workspace-main">{children}</main>
      </div>
    </div>
  );
}

function UserMenu({
  compact = false,
  logout,
  user,
}: {
  compact?: boolean;
  logout: () => Promise<void>;
  user: ReturnType<typeof useAuth>["user"];
}) {
  const router = useRouter();
  const firstName = user?.profile?.firstName ?? "Account";
  const lastName = user?.profile?.lastName ?? "";
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  return (
    <Dropdown
      align="end"
      label="Open account menu"
      trigger={
        <span
          className={
            compact
              ? "user-menu-trigger user-menu-trigger--compact"
              : "user-menu-trigger"
          }
        >
          <Avatar
            alt={`${firstName} ${lastName}`.trim()}
            className="user-menu-trigger__avatar"
            fallback={initials || "A"}
            size="sm"
          />
          {!compact ? (
            <span className="user-menu-trigger__copy">
              <strong>
                {firstName} {lastName}
              </strong>
              <small>{user?.email}</small>
            </span>
          ) : null}
          <span className="user-menu-trigger__chevron" aria-hidden="true">
            ⌄
          </span>
        </span>
      }
    >
      <div className="user-menu__identity">
        <strong>
          {firstName} {lastName}
        </strong>
        <small>{user?.email}</small>
      </div>
      <Divider className="workspace-menu__divider" />
      <DropdownItem onClick={() => router.push("/account/profile")}>
        Profile settings
      </DropdownItem>
      <DropdownItem disabled>
        Security <small className="user-menu__soon">Soon</small>
      </DropdownItem>
      <DropdownItem onClick={() => router.push("/restaurants")}>
        Restaurant selector
      </DropdownItem>
      <div className="user-menu__theme">
        <span>Appearance</span>
        <ThemeSelector compact />
      </div>
      <Divider className="workspace-menu__divider" />
      <DropdownItem danger onClick={() => void logout()}>
        Sign out
      </DropdownItem>
    </Dropdown>
  );
}

function WorkspaceNav({
  basePath,
  label,
  links,
  pathname,
}: {
  basePath: string;
  label: string;
  links: WorkspaceLink[];
  pathname: string;
}) {
  return (
    <nav className="workspace-nav" aria-label={label}>
      <p>{label}</p>
      {links.map((link) => {
        const href = link.segment ? `${basePath}/${link.segment}` : basePath;
        const active = link.segment ? pathname === href : pathname === basePath;
        return link.available ? (
          <Link
            className={active ? "is-active" : ""}
            href={href}
            key={link.label}
          >
            <NavIcon name={link.icon} />
            <span>{link.label}</span>
          </Link>
        ) : (
          <span className="is-disabled" key={link.label}>
            <NavIcon name={link.icon} />
            <span>{link.label}</span>
            <small>Soon</small>
          </span>
        );
      })}
    </nav>
  );
}

function NavIcon({ name }: { name: NavIconName }) {
  const paths: Record<NavIconName, ReactNode> = {
    overview: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    orders: (
      <>
        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
        <path d="M9 8h6M9 12h6" />
      </>
    ),
    reservations: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18M8 15h3" />
      </>
    ),
    menu: (
      <>
        <path d="M5 4h14v16H5z" />
        <path d="M9 8h6M9 12h6M9 16h4" />
      </>
    ),
    customers: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 6.5a3 3 0 0 1 0 5.8M17 15c2.3.7 4 2.6 4 5" />
      </>
    ),
    general: (
      <>
        <path d="M4 5h16M4 12h16M4 19h16" />
        <circle cx="8" cy="5" r="2" />
        <circle cx="16" cy="12" r="2" />
        <circle cx="10" cy="19" r="2" />
      </>
    ),
    staff: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M18 8v6M15 11h6" />
      </>
    ),
    locations: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    hours: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    media: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="8.5" cy="9" r="1.5" />
        <path d="m4 17 5-5 4 4 2-2 5 4" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className="workspace-nav__icon"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
    >
      {paths[name]}
    </svg>
  );
}

export function RestaurantShell({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <ActiveRestaurantProvider>
        <RestaurantWorkspaceShell>{children}</RestaurantWorkspaceShell>
      </ActiveRestaurantProvider>
    </ProtectedRoute>
  );
}
