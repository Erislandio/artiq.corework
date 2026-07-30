"use client";

import {
  Building2,
  CheckSquare,
  Clock,
  FolderKanban,
  LayoutDashboard,
  Settings,
  Users
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  className?: string;
}

const mainNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard
  },
  {
    title: "Minhas Tasks",
    href: "/dashboard/my-tasks",
    icon: CheckSquare
  },
  {
    title: "Projetos",
    href: "/dashboard/projects",
    icon: FolderKanban
  },
  {
    title: "Organizações",
    href: "/dashboard/organizations",
    icon: Building2
  }
];

const adminOnlyItems = [
  {
    title: "Usuários",
    href: "/dashboard/users",
    icon: Users
  },
  {
    title: "Relatórios",
    href: "/dashboard/reports",
    icon: Clock
  }
];

const settingsItem = {
  title: "Meu Perfil",
  href: "/dashboard/settings",
  icon: Settings
};

export function AppSidebar({ className }: AppSidebarProps) {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function checkRole() {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (data?.role?.toLowerCase() === "admin") {
        setIsAdmin(true);
      }
    }
    checkRole();
  }, []);

  const allAdminItems = isAdmin
    ? [...adminOnlyItems, settingsItem]
    : [settingsItem];

  return (
    <div
      className={cn(
        "pb-12 border-r bg-zinc-50/50 dark:bg-zinc-950/50 h-screen w-64",
        className
      )}
    >
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            <span className="text-orange-600 font-bold">Artiq.</span>Corework
          </h2>
          <div className="space-y-1">
            {mainNavItems.map((item) => (
              <Button
                key={item.href}
                variant={pathname === item.href ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start flex items-center row",
                  pathname === item.href ? "bg-zinc-200 dark:bg-zinc-800" : ""
                )}
              >
                <Link href={item.href} className="flex items-center w-full">
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Link>
              </Button>
            ))}
          </div>
        </div>
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-xs font-semibold uppercase tracking-tight text-zinc-500">
            Administração
          </h2>
          <div className="space-y-1">
            {allAdminItems.map((item) => (
              <Button
                key={item.href}
                variant={pathname === item.href ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start flex items-center w-full",
                  pathname === item.href ? "bg-zinc-200 dark:bg-zinc-800" : ""
                )}
              >
                <Link href={item.href} className="flex items-center">
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
