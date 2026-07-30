"use server"

import { createClient } from "@/lib/supabase/server"

export interface SearchResult {
  type: "task" | "project" | "organization"
  id: string
  title: string
  subtitle?: string
  projectId?: string
}

export async function globalSearch(query: string): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) return []

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const q = `%${query}%`

  // We perform the 3 searches in parallel
  const [tasksRes, projectsRes, orgsRes] = await Promise.all([
    supabase
      .from("tasks")
      .select(`
        id, 
        title, 
        project_id,
        project:projects (name)
      `)
      .or(`title.ilike.${q},description.ilike.${q}`)
      .eq("is_archived", false)
      .limit(10),

    supabase
      .from("projects")
      .select("id, name, organization:organizations(name)")
      .ilike("name", q)
      .limit(10),

    supabase
      .from("organizations")
      .select("id, name")
      .ilike("name", q)
      .limit(10)
  ])

  const results: SearchResult[] = []

  // Add Organizations
  if (orgsRes.data) {
    orgsRes.data.forEach(org => {
      results.push({
        type: "organization",
        id: org.id,
        title: org.name,
      })
    })
  }

  // Add Projects
  if (projectsRes.data) {
    projectsRes.data.forEach((p: any) => {
      results.push({
        type: "project",
        id: p.id,
        title: p.name,
        subtitle: p.organization?.name,
      })
    })
  }

  // Add Tasks
  if (tasksRes.data) {
    tasksRes.data.forEach((t: any) => {
      results.push({
        type: "task",
        id: t.id,
        title: t.title,
        subtitle: t.project?.name,
        projectId: t.project_id
      })
    })
  }

  return results
}
