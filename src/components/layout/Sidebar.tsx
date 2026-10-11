"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logoutUser } from "@/actions/auth.actions";

export default function Sidebar({ isOpen, closeSidebar }: { isOpen: boolean; closeSidebar: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    { name: "Dashboard", href: "/home", icon: "🏠" },
    { name: "Campaigns", href: "/campaigns", icon: "📊" },
    { name: "Profile", href: "/profile", icon: "⚙️" },
  ];

  async function handleLogout() {
    await logoutUser();
    router.push("/login");
  }

  return (
    <>
      <div 
        className={`mobile-overlay ${isOpen ? "open" : ""}`} 
        onClick={closeSidebar}
      />
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div style={{ padding: "0 var(--space-sm)", marginBottom: "var(--space-2xl)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 className="text-headline-md text-primary-color" style={{ letterSpacing: "-0.5px" }}>
            Mailora
          </h2>
          <button className="menu-toggle" onClick={closeSidebar} aria-label="Close menu">
            <span style={{ fontSize: "1.5rem" }}>×</span>
          </button>
        </div>

        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
          {links.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={closeSidebar}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-md)",
                  padding: "0.75rem 1rem",
                  borderRadius: "var(--radius-md)",
                  color: isActive ? "var(--color-primary)" : "var(--color-text-secondary)",
                  backgroundColor: isActive ? "var(--color-primary-light)" : "transparent",
                  fontWeight: isActive ? 600 : 500,
                  transition: "all var(--transition-fast)",
                  textDecoration: "none",
                }}
              >
                <span style={{ fontSize: "1.25rem" }}>{link.icon}</span>
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div style={{ marginTop: "auto", borderTop: "1px solid var(--color-border-light)", paddingTop: "var(--space-md)" }}>
          <button
            onClick={handleLogout}
            className="btn btn-ghost btn-full"
            style={{ justifyContent: "flex-start", color: "var(--color-error-text)" }}
          >
            <span style={{ fontSize: "1.25rem", marginRight: "var(--space-sm)" }}>🚪</span>
            Log Out
          </button>
        </div>
      </aside>
    </>
  );
}
