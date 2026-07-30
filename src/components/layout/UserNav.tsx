"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { User } from "@/types";
import Link from "next/link";
import { useEffect, useState } from "react";

export function UserNav() {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user: authUser }
      } = await supabase.auth.getUser();
      if (authUser) {
        const { data } = await supabase
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .single();

        if (data) {
          setUser(data);
        }
      }
    }

    loadUser();
  }, []);

  if (!user) return null;

  return (
    <Link
      href="/dashboard/settings"
      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
    >
      <Avatar className="h-8 w-8 border border-zinc-200 dark:border-zinc-800">
        {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
        <AvatarFallback className="text-xs font-semibold bg-zinc-200 dark:bg-zinc-800">
          {user.name?.charAt(0) || "U"}
        </AvatarFallback>
      </Avatar>
    </Link>
  );
}
