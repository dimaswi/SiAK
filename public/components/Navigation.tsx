"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  id?: string;
  href: string;
  label: string;
}

export default function Navigation({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  if (!items || items.length === 0) {
    items = [
      { href: "/", label: "Beranda" },
      { href: "/blog", label: "Blog" },
      { href: "/ppdb", label: "PPDB" },
    ];
  }

  return (
    <nav className="nav">
      {items.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
        return (
          <Link key={item.id || item.href} href={item.href} className={isActive ? "active" : ""}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
