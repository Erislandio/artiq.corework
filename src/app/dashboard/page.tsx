import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <form action="/auth/signout" method="post">
          <Button variant="outline" type="submit">Sair</Button>
        </form>
      </div>
      <p className="text-muted-foreground">Bem-vindo(a), {user.email}!</p>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border">
          <h3 className="font-medium text-zinc-500 mb-2">Meus Projetos</h3>
          <p className="text-4xl font-bold text-zinc-900 dark:text-white">{projectsCount || 0}</p>
        </div>
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border">
          <h3 className="font-medium text-zinc-500 mb-2">Minhas Tasks</h3>
          <p className="text-4xl font-bold text-zinc-900 dark:text-white">{tasksCount || 0}</p>
        </div>
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border">
          <h3 className="font-medium text-zinc-500 mb-2">Horas Trabalhadas</h3>
          <p className="text-4xl font-bold text-zinc-900 dark:text-white">
            {hours}h {minutes > 0 ? `${minutes}m` : ''}
          </p>
        </div>
      </div>
    </div>
  )
}
