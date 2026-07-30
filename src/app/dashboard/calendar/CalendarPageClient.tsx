"use client";

import { useState, useEffect } from "react";
import { CalendarGrid } from "@/features/calendar/components/CalendarGrid";
import { AdminCalendarGrid } from "@/features/calendar/components/AdminCalendarGrid";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";

interface CalendarPageClientProps {
  userId: string;
  isAdmin: boolean;
}

export function CalendarPageClient({ userId, isAdmin }: CalendarPageClientProps) {
  const [activeTab, setActiveTab] = useState<"me" | "team">("me");
  
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  
  const [selectedOrg, setSelectedOrg] = useState<string>("all");
  const [selectedProject, setSelectedProject] = useState<string>("all");

  useEffect(() => {
    if (isAdmin && activeTab === "team") {
      loadFilters();
    }
  }, [isAdmin, activeTab]);

  const loadFilters = async () => {
    const supabase = createClient();
    
    // Buscar Organizações
    const { data: orgData } = await supabase
      .from("organizations")
      .select("id, name")
      .order("name");
    if (orgData) setOrganizations(orgData);

    // Buscar Projetos
    const { data: projData } = await supabase
      .from("projects")
      .select("id, name, organization_id")
      .order("name");
    if (projData) setProjects(projData);
  };

  const availableProjects = selectedOrg === "all" 
    ? projects 
    : projects.filter(p => p.organization_id === selectedOrg);

  const handleOrgChange = (val: string) => {
    setSelectedOrg(val);
    setSelectedProject("all");
  };

  return (
    <div className="space-y-6 pb-12 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendário de Horas</h1>
          <p className="text-sm text-zinc-500">
            {activeTab === "me" 
              ? "Visualize suas horas trabalhadas por dia e faça lançamentos retroativos."
              : "Visualize as horas lançadas por toda a equipe."
            }
          </p>
        </div>

        {isAdmin && (
          <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg">
            <Button
              variant={activeTab === "me" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("me")}
              className={activeTab === "me" ? "bg-white text-black shadow-sm dark:bg-zinc-800 dark:text-white" : ""}
            >
              Meu Calendário
            </Button>
            <Button
              variant={activeTab === "team" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("team")}
              className={activeTab === "team" ? "bg-white text-black shadow-sm dark:bg-zinc-800 dark:text-white" : ""}
            >
              Calendário da Equipe
            </Button>
          </div>
        )}
      </div>

      {isAdmin && activeTab === "team" && (
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg border border-zinc-100 dark:border-zinc-800">
          <div className="w-full sm:w-64">
            <label className="text-xs font-semibold text-zinc-500 mb-1 block">Cliente / Organização</label>
            <Select value={selectedOrg} onValueChange={(val) => handleOrgChange(val || "all")}>
              <SelectTrigger className="bg-white dark:bg-zinc-950">
                <SelectValue placeholder="Todos os Clientes">
                  {(val: any) => {
                    if (val === "all") return "Todas as Organizações";
                    const org = organizations.find((o) => o.id === val);
                    return org ? org.name : "Todos os Clientes";
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
                    if (val === "all") return "Todos os Projetos";
                    const proj = availableProjects.find((p) => p.id === val);
                    return proj ? proj.name : "Todos os Projetos";
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
      )}

      <div className="flex-1 min-h-[600px]">
        {activeTab === "me" ? (
          <CalendarGrid userId={userId} />
        ) : (
          <AdminCalendarGrid 
            projectId={selectedProject === "all" ? undefined : selectedProject} 
            orgId={selectedOrg === "all" ? undefined : selectedOrg}
          />
        )}
      </div>
    </div>
  );
}
