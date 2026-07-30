"use server";

import { createClient } from "@/lib/supabase/server";

import {
  createNotification,
  notifyTaskAssignees
} from "@/features/notifications/actions/notifications";

export async function updateTaskDetails(
  taskId: string,
  data: {
    description?: string;
    priority?: string;
    story_points?: number;
    due_date?: string;
    creator_id?: string;
  }
) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { error } = await supabase.from("tasks").update(data).eq("id", taskId);

  if (error) return { error: error.message };

  const { data: profile } = await supabase
    .from("users")
    .select("name")
    .eq("id", user.id)
    .single();
  const userName = profile?.name || "Alguém";

  if (data.description !== undefined) {
    await notifyTaskAssignees({
      taskId,
      excludeUserId: user.id,
      title: "Descrição atualizada",
      message: `${userName} atualizou a descrição da tarefa`,
      type: "task_updated"
    });
  }
  if (data.priority !== undefined) {
    await notifyTaskAssignees({
      taskId,
      excludeUserId: user.id,
      title: "Prioridade alterada",
      message: `${userName} alterou a prioridade para "${data.priority}"`,
      type: "task_updated"
    });
  }
  if (data.story_points !== undefined) {
    await notifyTaskAssignees({
      taskId,
      excludeUserId: user.id,
      title: "Story Points alterados",
      message: `${userName} definiu story points para ${data.story_points}`,
      type: "task_updated"
    });
  }

  return { success: true };
}

export async function addComment(taskId: string, content: string) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { error } = await supabase
    .from("task_comments")
    .insert({ task_id: taskId, user_id: user.id, content });

  if (error) return { error: error.message };

  // Buscar nome do usuário
  const { data: profile } = await supabase
    .from("users")
    .select("name")
    .eq("id", user.id)
    .single();
  const userName = profile?.name || "Alguém";

  // Notificar responsáveis da task
  await notifyTaskAssignees({
    taskId,
    excludeUserId: user.id,
    title: "Novo comentário",
    message: `${userName} comentou na tarefa`,
    type: "comment"
  });

  return { success: true };
}

export async function toggleAssignee(
  taskId: string,
  assigneeId: string,
  isAssigned: boolean
) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  if (isAssigned) {
    const { error } = await supabase
      .from("task_assignees")
      .delete()
      .eq("task_id", taskId)
      .eq("user_id", assigneeId);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("task_assignees")
      .insert({ task_id: taskId, user_id: assigneeId });
    if (error) return { error: error.message };

    // Notificar o usuário atribuído
    if (assigneeId !== user.id) {
      const { data: taskData } = await supabase
        .from("tasks")
        .select("title, project_id")
        .eq("id", taskId)
        .single();

      if (taskData) {
        await createNotification({
          userId: assigneeId,
          title: "Nova tarefa atribuída",
          message: `Você foi atribuído como responsável pela tarefa "${taskData.title}"`,
          link: `/dashboard/projects/${taskData.project_id}`,
          type: "task_assigned"
        });
      }
    }
  }

  return { success: true };
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  // A exclusão em cascata cuidará de task_assignees, task_comments, etc.
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function archiveTask(taskId: string) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { error } = await supabase
    .from("tasks")
    .update({ is_archived: true })
    .eq("id", taskId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function unarchiveTask(taskId: string) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { error } = await supabase
    .from("tasks")
    .update({ is_archived: false })
    .eq("id", taskId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteComment(commentId: string) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { error } = await supabase
    .from("task_comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", user.id); // garante que só o dono apaga

  if (error) return { error: error.message };
  return { success: true };
}

export async function editComment(commentId: string, content: string) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { error } = await supabase
    .from("task_comments")
    .update({ content })
    .eq("id", commentId)
    .eq("user_id", user.id); // garante que só o dono edita

  if (error) return { error: error.message };
  return { success: true };
}
