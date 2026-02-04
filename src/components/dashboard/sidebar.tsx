"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Settings,
  Leaf,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Impact Overview", icon: LayoutDashboard },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/agent-settings", label: "Agent Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-charcoal-800 bg-charcoal-950/95 backdrop-blur-sm">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-charcoal-800 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-accent/20 text-emerald-accent">
            <Leaf className="h-5 w-5" />
          </div>
          <div>
            <span className="font-semibold text-charcoal-100">TerraInsight</span>
            <p className="text-[10px] text-charcoal-500">EcoPulse AI</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-emerald-accent/10 text-emerald-accent border border-emerald-accent/20"
                    : "text-charcoal-400 hover:bg-charcoal-800 hover:text-charcoal-100"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0",
                    isActive ? "text-emerald-accent" : "text-charcoal-500"
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-charcoal-800 p-4">
          <p className="text-xs text-charcoal-500">
            © {new Date().getFullYear()} TerraInsight
          </p>
        </div>
      </div>
    </aside>
  );
}
