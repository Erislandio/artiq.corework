"use client";

import { Bell, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { GlobalSearch } from "./GlobalSearch";

import { GlobalTimer } from "./GlobalTimer";
import { UserNav } from "./UserNav";

import { NotificationsNav } from "./NotificationsNav";

export function AppHeader() {
  const { setTheme, theme } = useTheme();

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-zinc-50/50 px-6 dark:bg-zinc-950/50">
      <div className="flex flex-1 items-center gap-4">
        <div className="relative w-full max-w-md flex items-center">
          <GlobalSearch />
        </div>
      </div>
      <GlobalTimer />
      <div className="flex items-center gap-2">
        <NotificationsNav />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
        <UserNav />
      </div>
    </header>
  );
}
