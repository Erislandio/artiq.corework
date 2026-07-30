import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CalendarPageClient } from "./CalendarPageClient"

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  const isAdmin = userData?.role === "Admin"

  return <CalendarPageClient userId={user.id} isAdmin={isAdmin} />
}
