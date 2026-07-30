"use client"

import { useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getReportData } from "@/features/reports/actions/get-reports"
import { Download, Filter, Clock, FileText, CheckCircle, Users, Building2, FolderKanban } from "lucide-react"

interface OrganizationOption {
  id: string
  name: string
}

interface ProjectOption {
  id: string
  name: string
  organization_id: string
}

interface ReportChartsProps {
  initialData: Awaited<ReturnType<typeof getReportData>>
  organizations: OrganizationOption[]
  projects: ProjectOption[]
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]

export function ReportCharts({ initialData, organizations, projects }: ReportChartsProps) {
  const [selectedOrg, setSelectedOrg] = useState<string>("all")
  const [selectedProject, setSelectedProject] = useState<string>("all")
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(false)
  const [searchTable, setSearchTable] = useState("")

  // Filter projects dropdown dynamically based on selected organization
  const availableProjects = selectedOrg === "all"
    ? projects
    : projects.filter(p => p.organization_id === selectedOrg)

  const handleOrgChange = async (orgId: string) => {
    setSelectedOrg(orgId)
    setSelectedProject("all")
    setLoading(true)
    const newData = await getReportData({ organizationId: orgId, projectId: "all" })
    setData(newData)
    setLoading(false)
  }

  const handleProjectChange = async (projId: string) => {
    setSelectedProject(projId)
    setLoading(true)
    const newData = await getReportData({ organizationId: selectedOrg, projectId: projId })
    setData(newData)
    setLoading(false)
  }

  const exportToCSV = () => {
    if (!data.logs || data.logs.length === 0) return

    const headers = ["Data", "Organização (Cliente)", "Projeto", "Task", "Usuário", "Duração (Horas)", "Descrição"]
    const rows = data.logs.map(l => [
      new Date(l.date).toLocaleDateString("pt-BR"),
      `"${l.organization.replace(/"/g, '""')}"`,
      `"${l.project.replace(/"/g, '""')}"`,
      `"${l.task.replace(/"/g, '""')}"`,
      `"${l.user.replace(/"/g, '""')}"`,
      l.durationHours,
      `"${l.description.replace(/"/g, '""')}"`
    ])

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `relatorio_corework_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredLogsTable = data.logs.filter(l => 
    l.task.toLowerCase().includes(searchTable.toLowerCase()) ||
    l.user.toLowerCase().includes(searchTable.toLowerCase()) ||
    l.project.toLowerCase().includes(searchTable.toLowerCase()) ||
    l.description.toLowerCase().includes(searchTable.toLowerCase())
  )

  return (
    <div className="space-y-6">
      
      {/* Controls & Filters Bar */}
      <Card className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
              <Filter className="w-4 h-4" />
              Filtros:
            </div>

            {/* Select Organização / Cliente */}
            <div className="w-full sm:w-52">
              <Select value={selectedOrg} onValueChange={(val) => handleOrgChange(val || "all")}>
                <SelectTrigger className="bg-white dark:bg-zinc-950">
                  <SelectValue placeholder="Todos os Clientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Organizações</SelectItem>
                  {organizations.map(org => (
                    <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Select Projeto */}
            <div className="w-full sm:w-52">
              <Select value={selectedProject} onValueChange={(val) => handleProjectChange(val || "all")}>
                <SelectTrigger className="bg-white dark:bg-zinc-950">
                  <SelectValue placeholder="Todos os Projetos" />
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

          <Button 
            onClick={exportToCSV} 
            variant="default"
            className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={data.logs.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar Relatório (CSV)
          </Button>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Total de Horas</CardTitle>
            <Clock className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.totalHours}h</div>
            <p className="text-xs text-zinc-500 mt-1">Tempo acumulado registrado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Sessões de Apontamento</CardTitle>
            <FileText className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.totalLogs}</div>
            <p className="text-xs text-zinc-500 mt-1">Registros individuais</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Projetos no Filtro</CardTitle>
            <FolderKanban className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.hoursByProject.length}</div>
            <p className="text-xs text-zinc-500 mt-1">Projetos com apontamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Colaboradores</CardTitle>
            <Users className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.hoursByUser.length}</div>
            <p className="text-xs text-zinc-500 mt-1">Usuários que contaram horas</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        
        {/* Horas por Projeto */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Horas por Projeto</CardTitle>
            <CardDescription>Distribuição de tempo trabalhado entre os projetos</CardDescription>
          </CardHeader>
          <CardContent>
            {data.hoursByProject.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-zinc-400 text-sm">Nenhum dado para exibir</div>
            ) : (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.hoursByProject} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: any) => [`${value}h`, "Horas"]} />
                    <Bar dataKey="hours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Horas por Colaborador */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Horas por Colaborador</CardTitle>
            <CardDescription>Total acumulado por membro da equipe</CardDescription>
          </CardHeader>
          <CardContent>
            {data.hoursByUser.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-zinc-400 text-sm">Nenhum dado para exibir</div>
            ) : (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.hoursByUser} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: any) => [`${value}h`, "Horas"]} />
                    <Bar dataKey="hours" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Tabela Detalhada de Registros */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Detalhamento dos Apontamentos</CardTitle>
            <CardDescription>Lista completa das horas contadas</CardDescription>
          </div>
          <Input 
            placeholder="Buscar registro..." 
            value={searchTable}
            onChange={e => setSearchTable(e.target.value)}
            className="w-64 text-sm"
          />
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b text-zinc-500 font-medium text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Organização</th>
                  <th className="px-4 py-3">Projeto</th>
                  <th className="px-4 py-3">Task</th>
                  <th className="px-4 py-3">Usuário</th>
                  <th className="px-4 py-3">Duração</th>
                  <th className="px-4 py-3">Descrição</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredLogsTable.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-zinc-400">Nenhum apontamento encontrado</td>
                  </tr>
                ) : (
                  filteredLogsTable.map(log => (
                    <tr key={log.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                      <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">
                        {new Date(log.date).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                        {log.organization}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                        {log.project}
                      </td>
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                        {log.task}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                        {log.user}
                      </td>
                      <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {log.durationHours}h
                      </td>
                      <td className="px-4 py-3 text-zinc-500 max-w-xs truncate">
                        {log.description}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
