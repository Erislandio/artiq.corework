"use server"

import { createClient } from "@/lib/supabase/server"

export async function toggleTimer(taskId: string, description?: string, subtaskId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado." }

  // Check if there is an active timer for this user
  const { data: activeLog, error: fetchError } = await supabase
    .from("time_logs")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_timer", true)
    .is("end_time", null)
    .maybeSingle()

  if (fetchError) return { error: fetchError.message }

  // If there's an active timer...
  if (activeLog) {
    if (activeLog.task_id === taskId && (activeLog.subtask_id === subtaskId || (!activeLog.subtask_id && !subtaskId))) {
      // Stopping the current timer
      const endTime = new Date().toISOString()
      const start = new Date(activeLog.start_time).getTime()
      const end = new Date(endTime).getTime()
      const duration = Math.floor((end - start) / 1000 / 60) // in minutes

      const { error: updateError } = await supabase
        .from("time_logs")
        .update({ 
          end_time: endTime, 
          duration_minutes: duration 
        })
        .eq("id", activeLog.id)

      if (updateError) return { error: updateError.message }
      return { success: true, status: "stopped", duration }
    } else {
      return { error: "Você já possui um timer rodando em outra task ou subtarefa. Pare-o primeiro." }
    }
  } else {
    // Starting a new timer
    const { error: insertError } = await supabase
      .from("time_logs")
      .insert({
        task_id: taskId,
        subtask_id: subtaskId || null,
        user_id: user.id,
        is_timer: true,
        start_time: new Date().toISOString(),
        description: description || null
      })

    if (insertError) return { error: insertError.message }
    return { success: true, status: "started" }
  }
}

export async function addManualTime(taskId: string, durationMinutes: number, description: string, subtaskId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado." }

  const endTime = new Date()
  const startTime = new Date(endTime.getTime() - durationMinutes * 60000)

  const { error } = await supabase
    .from("time_logs")
    .insert({
      task_id: taskId,
      subtask_id: subtaskId || null,
      user_id: user.id,
      is_timer: false,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      duration_minutes: durationMinutes,
      description
    })

  if (error) return { error: error.message }
  return { success: true }
}

export async function getTaskTimeLogs(taskId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("time_logs")
    .select(`
      *,
      user:users(id, name, avatar)
    `)
    .eq("task_id", taskId)
    .order("start_time", { ascending: false })

  if (error) {
    console.error("Erro ao buscar time logs da task:", error)
    return []
  }

  return data
}
