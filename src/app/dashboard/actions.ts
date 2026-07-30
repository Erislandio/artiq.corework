"use server";

import { createClient } from "@/lib/supabase/server";

export async function getDashboardMetrics(userId: string) {
  const supabase = await createClient();

  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);
  last7Days.setHours(0, 0, 0, 0);

  const { data: weeklyLogs } = await supabase
    .from("time_logs")
    .select("duration_minutes, start_time")
    .eq("user_id", userId)
    .gte("start_time", last7Days.toISOString());

  const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const weeklyChartDataMap: Record<string, number> = {};

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayName = daysOfWeek[d.getDay()];
    weeklyChartDataMap[dayName] = 0;
  }

  weeklyLogs?.forEach((log) => {
    const logDate = new Date(log.start_time);
    const dayName = daysOfWeek[logDate.getDay()];
    if (weeklyChartDataMap[dayName] !== undefined && log.duration_minutes) {
      weeklyChartDataMap[dayName] += log.duration_minutes;
    }
  });

  const weeklyChartData = Object.entries(weeklyChartDataMap).map(
    ([name, minutes]) => ({
      name,
      horas: Number((minutes / 60).toFixed(1))
    })
  );

  const { data: allUserLogs } = await supabase
    .from("time_logs")
    .select("duration_minutes, task:tasks(id, title, project:projects(name))")
    .eq("user_id", userId);

  const tasksHoursMap: Record<
    string,
    { id: string; title: string; project: string; minutes: number }
  > = {};

  allUserLogs?.forEach((log: any) => {
    if (!log.task) return;
    const taskId = log.task.id;
    if (!tasksHoursMap[taskId]) {
      tasksHoursMap[taskId] = {
        id: taskId,
        title: log.task.title,
        project: log.task.project?.name || "Sem projeto",
        minutes: 0
      };
    }
    tasksHoursMap[taskId].minutes += log.duration_minutes || 0;
  });

  const topTasks = Object.values(tasksHoursMap)
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 5)
    .map((t) => ({
      ...t,
      hoursText: `${Math.floor(t.minutes / 60)}h ${t.minutes % 60}m`
    }));

  const today = new Date().toISOString();

  const { data: assignedTasks } = await supabase
    .from("task_assignees")
    .select(
      `
      task:tasks (
        id, 
        title, 
        due_date, 
        status,
        project:projects(name)
      )
    `
    )
    .eq("user_id", userId);

  const overdueTasks = (assignedTasks || [])
    .map((a: any) => a.task)
    .filter((t: any) => {
      if (!t.due_date) return false;
      const isPast = new Date(t.due_date) < new Date();
      const isNotDone =
        t.status?.toLowerCase() !== "done" &&
        t.status?.toLowerCase() !== "concluído";
      return isPast && isNotDone;
    })
    .sort(
      (a: any, b: any) =>
        new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    )
    .slice(0, 5);

  return {
    weeklyChartData,
    topTasks,
    overdueTasks
  };
}
