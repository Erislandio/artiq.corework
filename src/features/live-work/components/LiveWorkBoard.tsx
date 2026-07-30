"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { getActiveTeamTimers } from "../actions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, Briefcase, Activity } from "lucide-react"

export function LiveWorkBoard() {
  const [timers, setTimers] = useState<any[]>([])
  const [organizations, setOrganizations] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  
  const [selectedOrg, setSelectedOrg] = useState<string>("all")
  const [selectedProject, setSelectedProject] = useState<string>("all")
  
  const [now, setNow] = useState(new Date().getTime())
  
  const supabase = createClient()

  useEffect(() => {
    fetchData()
    fetchFilters()

    const channel = supabase
      .channel("live-work-admin")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "time_logs" },
        () => {
          fetchData()
        }
      )
      .subscribe()

    const interval = setInterval(() => {
      setNow(new Date().getTime())
    }, 1000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [])

  const fetchData = async () => {
    const data = await getActiveTeamTimers()
    setTimers(data)
  }

  const fetchFilters = async () => {
    const { data: orgData } = await supabase.from("organizations").select("id, name").order("name")
    if (orgData) setOrganizations(orgData)

    const { data: projData } = await supabase.from("projects").select("id, name, organization_id").order("name")
    if (projData) setProjects(projData)
  }

  const availableProjects = selectedOrg === "all" 
    ? projects 
    : projects.filter(p => p.organization_id === selectedOrg)

  const handleOrgChange = (val: string) => {
    setSelectedOrg(val)
    setSelectedProject("all")
  }

  const filteredTimers = useMemo(() => {
    return timers.filter(t => {
      const projId = t.task?.project?.id
      const orgId = t.task?.project?.organization_id
      
      if (selectedProject !== "all" && projId !== selectedProject) return false
      if (selectedOrg !== "all" && orgId !== selectedOrg) return false
      
      return true
    })
  }, [timers, selectedOrg, selectedProject])

  const formatElapsedTime = (startTime: string) => {
    const elapsedSeconds = Math.floor((now - new Date(startTime).getTime()) / 1000)
    if (elapsedSeconds < 0) return "00:00:00"
    
    const h = Math.floor(elapsedSeconds / 3600).toString().padStart(2, "0")
    const m = Math.floor((elapsedSeconds % 3600) / 60).toString().padStart(2, "0")
    const s = (elapsedSeconds % 60).toString().padStart(2, "0")
    return `${h}:${m}:${s}`
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg border border-zinc-100 dark:border-zinc-800">
        <div className="w-full sm:w-64">
          <label className="text-xs font-semibold text-zinc-500 mb-1 block">Cliente / Organização</label>
          <Select value={selectedOrg} onValueChange={(val) => handleOrgChange(val || "all")}>
            <SelectTrigger className="bg-white dark:bg-zinc-950">
              <SelectValue placeholder="Todos os Clientes">
                {(val: any) => {
                  if (val === "all") return "Todas as Organizações"
                  const org = organizations.find((o) => o.id === val)
                  return org ? org.name : "Todos os Clientes"
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Organizações</SelectItem>
              {organizations.map(org => (
                <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:w-64">
          <label className="text-xs font-semibold text-zinc-500 mb-1 block">Projeto</label>
          <Select value={selectedProject} onValueChange={(val) => setSelectedProject(val || "all")}>
            <SelectTrigger className="bg-white dark:bg-zinc-950">
              <SelectValue placeholder="Todos os Projetos">
                {(val: any) => {
                  if (val === "all") return "Todos os Projetos"
                  const proj = availableProjects.find((p) => p.id === val)
                  return proj ? proj.name : "Todos os Projetos"
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Projetos</SelectItem>
              {availableProjects.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTimers.length === 0 ? (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-zinc-500 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 border-dashed rounded-xl">
            <Activity className="w-8 h-8 text-zinc-300 mb-3" />
            <p className="text-sm font-medium">Nenhum usuário trabalhando no momento.</p>
            <p className="text-xs">Não há timers ativos correspondentes aos filtros selecionados.</p>
          </div>
        ) : (
          filteredTimers.map(timer => (
            <Card key={timer.id} className="overflow-hidden border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="p-4 border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/20 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-white dark:border-zinc-900 shadow-sm">
                      <AvatarImage src={timer.user?.avatar} />
                      <AvatarFallback>{timer.user?.name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-bold leading-none mb-1">{timer.user?.name}</p>
                      <p className="text-xs text-zinc-500">{timer.user?.job_title || "Membro"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400 px-2 py-1 rounded-md font-mono text-sm font-bold animate-pulse">
                    <Clock className="w-3.5 h-3.5" />
                    {formatElapsedTime(timer.start_time)}
                  </div>
                </div>
                
                <div className="p-4 space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Trabalhando em</p>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-snug">
                      {timer.task?.title || "Tarefa desconhecida"}
                    </p>
                  </div>
                  
                  {timer.description && (
                    <div className="bg-zinc-50 dark:bg-zinc-900 p-2 rounded text-xs text-zinc-600 dark:text-zinc-400 italic border border-zinc-100 dark:border-zinc-800">
                      "{timer.description}"
                    </div>
                  )}

                  <div className="pt-2 mt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center text-xs text-zinc-500">
                    <Briefcase className="w-3.5 h-3.5 mr-1.5" />
                    <span>{timer.task?.project?.name}</span>
                    {timer.task?.project?.organization?.name && (
                      <>
                        <span className="mx-1.5">•</span>
                        <span>{timer.task.project.organization.name}</span>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
