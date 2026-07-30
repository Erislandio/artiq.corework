import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { getDashboardMetrics } from './actions'
import { DashboardCharts } from './DashboardCharts'
import { Clock, AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 1. Projetos Ativos
  const { count: projectsCount } = await supabase
    .from('project_members')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // 2. Minhas Tasks
  const { count: tasksCount } = await supabase
    .from('task_assignees')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // 3. Horas Registradas
  const { data: timeLogs } = await supabase
    .from('time_logs')
    .select('duration_minutes')
    .eq('user_id', user.id)

  const totalMinutes = timeLogs?.reduce((acc, log) => acc + (log.duration_minutes || 0), 0) || 0
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  // 4. Novas Métricas (Gráficos e Listas)
  const { weeklyChartData, topTasks, overdueTasks } = await getDashboardMetrics(user.id)

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Bem-vindo(a), {user.email}!</p>
        </div>
        <form action="/auth/signout" method="post">
          <Button variant="outline" type="submit">Sair</Button>
        </form>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
          <h3 className="font-medium text-zinc-500 mb-2">Meus Projetos</h3>
          <p className="text-4xl font-bold text-zinc-900 dark:text-white">{projectsCount || 0}</p>
        </div>
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
          <h3 className="font-medium text-zinc-500 mb-2">Minhas Tasks</h3>
          <p className="text-4xl font-bold text-zinc-900 dark:text-white">{tasksCount || 0}</p>
        </div>
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
          <h3 className="font-medium text-zinc-500 mb-2">Horas Trabalhadas</h3>
          <p className="text-4xl font-bold text-zinc-900 dark:text-white">
            {hours}h {minutes > 0 ? `${minutes}m` : ''}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-8 space-y-6">
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-6">
              Horas na Semana
            </h3>
            <DashboardCharts data={weeklyChartData} />
          </div>
        </div>

        <div className="md:col-span-4 space-y-6">
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                Tasks com mais horas
              </h3>
            </div>
            
            <div className="space-y-4">
              {topTasks.length > 0 ? topTasks.map(task => (
                <div key={task.id} className="flex justify-between items-center p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800">
                  <div className="truncate pr-4">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{task.title}</p>
                    <p className="text-xs text-zinc-500 truncate">{task.project}</p>
                  </div>
                  <div className="text-sm font-bold text-zinc-700 dark:text-zinc-300 whitespace-nowrap bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
                    {task.hoursText}
                  </div>
                </div>
              )) : (
                <p className="text-sm text-zinc-500 text-center py-4">Nenhuma hora registrada.</p>
              )}
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                Tasks Atrasadas
              </h3>
            </div>
            
            <div className="space-y-4">
              {overdueTasks.length > 0 ? overdueTasks.map((task: any) => (
                <div key={task.id} className="flex justify-between items-start p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30">
                  <div className="truncate pr-4">
                    <p className="text-sm font-medium text-red-900 dark:text-red-400 truncate">{task.title}</p>
                    <p className="text-xs text-red-700/70 dark:text-red-500/70 truncate">{task.project?.name}</p>
                  </div>
                  <div className="text-xs font-semibold text-red-600 dark:text-red-400 whitespace-nowrap">
                    {new Date(task.due_date).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center py-6 text-emerald-600 dark:text-emerald-500">
                  <CheckCircle2 className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm font-medium">Nenhuma task atrasada!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
