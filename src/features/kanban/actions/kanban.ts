"use server";

import { notifyTaskAssignees } from "@/features/notifications/actions/notifications";
import { createClient } from "@/lib/supabase/server";

export async function updateTaskPosition(
  taskId: string,
  newColumnId: string,
  newPosition: number
) {
  const supabase = await createClient();

  // First verify user is authenticated
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  // Buscar coluna antiga antes de atualizar
  const { data: oldTask } = await supabase
    .from("tasks")
    .select("column_id")
    .eq("id", taskId)
    .single();

  const { error } = await supabase
    .from("tasks")
    .update({ column_id: newColumnId, position: newPosition })
    .eq("id", taskId);

  if (error) {
    return { error: error.message };
  }

  // Notificar se a coluna mudou (mudança de status)
  if (oldTask && oldTask.column_id !== newColumnId) {
    const { data: newColumn } = await supabase
      .from("columns")
      .select("title")
      .eq("id", newColumnId)
      .single();

    const { data: profile } = await supabase
      .from("users")
      .select("name")
      .eq("id", user.id)
      .single();

    const userName = profile?.name || "Alguém";
    const columnName = newColumn?.title || "outra coluna";

    await notifyTaskAssignees({
      taskId,
      excludeUserId: user.id,
      title: "Status alterado",
      message: `${userName} moveu a tarefa para "${columnName}"`,
      type: "status_changed"
    });
  }

  return { success: true };
}

export async function updateColumnPosition(
  columnId: string,
  newPosition: number
) {
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { error } = await supabase
    .from("columns")
    .update({ position: newPosition })
    .eq("id", columnId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function updateColumnTitle(columnId: string, newTitle: string) {
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { error } = await supabase
    .from("columns")
    .update({ title: newTitle })
    .eq("id", columnId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function deleteColumn(columnId: string) {
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { count, error: countError } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("column_id", columnId);

  if (countError) {
    return { error: countError.message };
  }

  if (count && count > 0) {
    return {
      error:
        "Não é possível excluir uma coluna que contém tarefas. Mova as tarefas para outra coluna primeiro."
    };
  }

  const { error } = await supabase.from("columns").delete().eq("id", columnId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function createColumn(
  projectId: string,
  title: string,
  position: number
) {
  const supabase = await createClient();

  const { data: column, error } = await supabase
    .from("columns")
    .insert({ project_id: projectId, title, position })
    .select()
    .single();

  if (error) return { error: error.message };
  return { data: column };
}

export async function createTask(
  projectId: string,
  columnId: string,
  title: string,
  position: number
) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      project_id: projectId,
      column_id: columnId,
      title,
      position,
      creator_id: user?.id,
      priority: "Medium",
      status: "Open"
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { data: task };
}

export async function updateTaskStatus(taskId: string, newColumnId: string) {
  const supabase = await createClient();
  
  // First verify user is authenticated
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  // Check how many tasks are in the target column to append at the end
  const { count } = await supabase
    .from("tasks")
    .select("id", { count: "exact" })
    .eq("column_id", newColumnId);

  const newPosition = count || 0;

  return await updateTaskPosition(taskId, newColumnId, newPosition);
}

export async function updateColumnsPositions(
  columns: { id: string; position: number }[]
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado." }

  await Promise.all(
    columns.map((col) =>
      supabase.from("columns").update({ position: col.position }).eq("id", col.id)
    )
  )

  return { success: true }
}

export async function updateTasksPositions(
  tasks: { id: string; position: number; column_id: string }[]
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado." }

  await Promise.all(
    tasks.map((task) =>
      supabase
        .from("tasks")
        .update({ position: task.position, column_id: task.column_id })
        .eq("id", task.id)
    )
  )

  return { success: true }
}
