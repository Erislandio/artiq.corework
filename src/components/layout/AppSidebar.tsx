"use client";

import {
  Activity,
  Archive,
  Building2,
  CalendarDays,
  CheckSquare,
  Clock,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Settings,
  Users
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  },
  {
    title: "Calendário",
    href: "/dashboard/calendar",
    icon: CalendarDays
  },
  {
    title: "Arquivadas",
    href: "/dashboard/archived-tasks",
    icon: Archive
  }
];

const adminOnlyItems = [
  {
    title: "Trabalho Atual",
    href: "/dashboard/live-work",
    icon: Activity
  },
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
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (data?.role === "Admin") {
      setIsAdmin(true);
    }
  };

  const handleLogout = async () => {
    await fetch("/auth/signout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

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
            <span className="text-orange-600 font-bold">One.</span>Corework
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
                  "w-full justify-start flex items-center",
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
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  );
}
