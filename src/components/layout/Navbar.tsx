"use client";

import { usePathname } from "next/navigation";

export default function Navbar({ toggleSidebar }: { toggleSidebar: () => void }) {
  const pathname = usePathname();

  // Very basic title mapping based on path
  let title = "Dashboard";
  if (pathname.includes("/campaigns")) title = "Campaigns";
  if (pathname.includes("/profile")) title = "Profile";

  return (
    <header
      style={{
        height: "var(--navbar-height)",
        backgroundColor: "var(--color-background)",
        borderBottom: "1px solid var(--color-border-light)",
        display: "flex",
        alignItems: "center",
        padding: "0 var(--space-xl)",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      <button className="menu-toggle" onClick={toggleSidebar} aria-label="Toggle Menu">
        ☰
      </button>
      <h1 className="text-headline-sm">{title}</h1>
    </header>
  );
}
