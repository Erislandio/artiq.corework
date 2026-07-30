"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlignLeft,
  Archive,
  Check,
  Clock,
  History,
  MessageSquare,
  Paperclip,
  Pause,
  Pencil,
  Play,
  Square,
  Timer,
  Trash2,
  UserPlus,
  X
} from "lucide-react";
import { useEffect, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { notifyAttachmentUploaded } from "@/features/notifications/actions/notifications";
import { createClient } from "@/lib/supabase/client";
import { Task, User } from "@/types";
import { updateTaskStatus } from "../actions/kanban";
import {
  addComment,
  archiveTask,
  deleteComment,
  deleteTask,
  editComment,
  toggleAssignee,
  updateTaskDetails
} from "../actions/task-details";
import { addManualTime, toggleTimer } from "../actions/time-logs";

interface TaskModalProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskModal({ task, open, onOpenChange }: TaskModalProps) {
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerError, setTimerError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Detalhes estendidos
  const [detailedTask, setDetailedTask] = useState<any>(null);
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [projectColumns, setProjectColumns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'comments' | 'timelogs' | 'attachments' | 'history'>('comments');

  // States de edição
  const [description, setDescription] = useState("");
  const [isSavingDesc, setIsSavingDesc] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState("");

  // State de horas manuais
  const [showManualTime, setShowManualTime] = useState(false);
  const [manualTimeValue, setManualTimeValue] = useState("");
  const [manualTimeDescription, setManualTimeDescription] = useState("");
  const [timerDescription, setTimerDescription] = useState("");

  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user: authUser }
      } = await supabase.auth.getUser();
      if (authUser) {
        const { data } = await supabase
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .single();

        if (data) {
          setUser(data);
        }
      }
    }

    loadUser();
  }, []);

  useEffect(() => {
    if (open && task) {
      loadTaskDetails();
    } else {
      setDetailedTask(null);
    }
  }, [open, task]);

  async function loadTaskDetails() {
    if (!task) return;
    setLoading(true);

    // Fetch Task along with its relationships
    const { data: taskData } = await supabase
      .from("tasks")
      .select(
        `
        *,
        creator:users!tasks_creator_id_fkey(*),
        assignees:task_assignees(user:users(*)),
        comments:task_comments(*, user:users(*)),
        attachments:task_attachments(*),
        time_logs(*, user:users(id, name, avatar))
      `
      )
      .eq("id", task.id)
      .single();

    if (taskData) {
      setDetailedTask(taskData);
      setDescription(taskData.description || "");

      // Check if timer is running for this user
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        const activeTimer = taskData.time_logs?.find(
          (log: any) => log.user_id === user.id && log.is_timer && !log.end_time
        );
        if (activeTimer) {
          setIsTimerRunning(true);
          const elapsed = Math.floor(
            (new Date().getTime() -
              new Date(activeTimer.start_time).getTime()) /
              1000
          );
          setTimerSeconds(elapsed);
        } else {
          setIsTimerRunning(false);
          setTimerSeconds(0);
        }
      }
    }

    // Fetch Users to Assign (limite de 20 para performance, a busca do Command filtra no cliente)
    const { data: allUsers } = await supabase
      .from("users")
      .select("*")
      .limit(20);

    if (allUsers) setProjectMembers(allUsers);

    // Fetch Columns for Status Change
    if (taskData.project_id) {
      const { data: cols } = await supabase
        .from("columns")
        .select("*")
        .eq("project_id", taskData.project_id)
        .order("position", { ascending: true });

      if (cols) setProjectColumns(cols);
    }

    setLoading(false);
  }

  // Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  if (!task) return null;

  const handleToggleTimer = async () => {
    setTimerError(null);
    const res = await toggleTimer(task.id, timerDescription);

    if (res?.error) {
      setTimerError(res.error);
    } else {
      setIsTimerRunning(res.status === "started");
      if (res.status === "stopped") {
        setTimerSeconds(0);
        loadTaskDetails(); // Recarregar para mostrar no histórico
      }
      setTimerDescription(""); // Clear description after starting
    }
  };

  const handleSaveDescription = async () => {
    setIsSavingDesc(true);
    await updateTaskDetails(task.id, { description });
    setIsSavingDesc(false);
  };

  const handleUpdatePriority = async (val: string) => {
    await updateTaskDetails(task.id, { priority: val });
    loadTaskDetails();
  };

  const handleUpdateStoryPoints = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val)) {
      await updateTaskDetails(task.id, { story_points: val });
      setDetailedTask({ ...detailedTask, story_points: val });
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    await addComment(task.id, newComment);
    setNewComment("");
    loadTaskDetails();
  };

  const handleDeleteComment = async (commentId: string) => {
    if (window.confirm("Deseja realmente excluir este comentário?")) {
      await deleteComment(commentId);
      loadTaskDetails();
    }
  };

  const handleSaveEditComment = async (commentId: string) => {
    if (!editCommentContent.trim()) return;
    await editComment(commentId, editCommentContent);
    setEditingCommentId(null);
    setEditCommentContent("");
    loadTaskDetails();
  };

  const handleStatusChange = async (newColumnId: string) => {
    if (!task) return;
    setDetailedTask({ ...detailedTask, column_id: newColumnId });
    await updateTaskStatus(task.id, newColumnId);
    window.location.reload(); // Recarrega o kanban para refletir a mudança
  };

  const handleToggleAssignee = async (userId: string, isAssigned: boolean) => {
    await toggleAssignee(task.id, userId, isAssigned);
    loadTaskDetails();
  };

  const handleUploadAttachment = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return;

    // Upload
    const fileName = `${task.id}/${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from("attachments")
      .upload(fileName, file);

    if (data) {
      // Get public URL
      const { data: urlData } = supabase.storage
        .from("attachments")
        .getPublicUrl(fileName);
      // Insert to DB
      await supabase.from("task_attachments").insert({
        task_id: task.id,
        user_id: user.id,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_type: file.type,
        file_size: file.size
      });
      // Notificar responsáveis sobre o novo anexo
      await notifyAttachmentUploaded(task.id, file.name);
      loadTaskDetails();
    }
  };

  const handleSubmitManualTime = async () => {
    const min = parseInt(manualTimeValue);
    if (!isNaN(min) && min > 0) {
      await addManualTime(task.id, min, manualTimeDescription || "Horas adicionadas manualmente");
      setManualTimeValue("");
      setManualTimeDescription("");
      setShowManualTime(false);
      loadTaskDetails();
    }
  };

  const handleDeleteTask = async () => {
    if (
      window.confirm(
        `Tem certeza que deseja excluir a task "${task?.title}"? Esta ação não pode ser desfeita e todas as horas, comentários e anexos serão apagados.`
      )
    ) {
      await deleteTask(task!.id);
      onOpenChange(false);
      window.location.reload(); // Recarrega o kanban para remover a task
    }
  };

  const handleArchiveTask = async () => {
    if (
      window.confirm(
        `Deseja arquivar a task "${task?.title}"? Ela será removida do quadro, mas manterá todo seu histórico e horas no banco de dados.`
      )
    ) {
      await archiveTask(task!.id);
      onOpenChange(false);
      window.location.reload(); // Recarrega o kanban para remover a task
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const isAssignedToMe = detailedTask?.assignees?.some(
    (a: any) => a.user.id === currentUserId
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-4xl lg:max-w-5xl bg-zinc-50 dark:bg-zinc-950 p-0 overflow-hidden border-none shadow-2xl flex flex-col md:flex-row h-[85vh]">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-6 pb-2">
            <DialogHeader className="flex flex-row items-start justify-between">
              <div className="flex-1 mr-4 space-y-2">
                <DialogTitle className="text-2xl font-bold flex-1">
                  <Input
                    defaultValue={task.title}
                    className="text-2xl font-bold border-none px-0 shadow-none focus-visible:ring-0 bg-transparent h-auto"
                  />
                </DialogTitle>
                <div className="w-[200px]">
                  <Select
                    value={detailedTask?.column_id || task.column_id}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger className="h-7 text-xs bg-zinc-100 dark:bg-zinc-900 border-none">
                      <SelectValue placeholder="Status">
                        {(val: any) =>
                          val
                            ? projectColumns.find((c) => c.id === val)?.title ||
                              val
                            : "Status"
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {projectColumns.map((col) => (
                        <SelectItem
                          key={col.id}
                          value={col.id}
                          className="text-xs"
                        >
                          {col.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  onClick={handleArchiveTask}
                  title="Arquivar task"
                >
                  <Archive className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  onClick={handleDeleteTask}
                  title="Excluir task"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            </DialogHeader>
          </div>

          <ScrollArea className="flex-1 p-6 pt-0 overflow-scroll">
            {loading && !detailedTask ? (
              <div className="text-zinc-500">Carregando detalhes...</div>
            ) : detailedTask ? (
              <div className="space-y-8">
                {/* Description */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-semibold">
                    <AlignLeft className="w-5 h-5" />
                    Descrição
                  </div>
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Adicione uma descrição mais detalhada..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="min-h-[120px] resize-none bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus-visible:ring-1 focus-visible:ring-zinc-400"
                    />
                    {description !== (detailedTask.description || "") && (
                      <Button
                        onClick={handleSaveDescription}
                        disabled={isSavingDesc}
                        size="sm"
                      >
                        {isSavingDesc ? "Salvando..." : "Salvar Descrição"}
                      </Button>
                    )}
                  </div>
                </div>
                    {/* Tabs Navigation */}
                <div className="flex items-center gap-6 border-b border-zinc-200 dark:border-zinc-800">
                  <button
                    onClick={() => setActiveTab('comments')}
                    className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'comments' ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" /> Comentários
                    </div>
                    {activeTab === 'comments' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-zinc-900 dark:bg-zinc-100 rounded-t-md" />}
                  </button>
                  <button
                    onClick={() => setActiveTab('timelogs')}
                    className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'timelogs' ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                  >
                    <div className="flex items-center gap-2">
                      <Timer className="w-4 h-4" /> Horas Logadas
                    </div>
                    {activeTab === 'timelogs' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-zinc-900 dark:bg-zinc-100 rounded-t-md" />}
                  </button>
                  <button
                    onClick={() => setActiveTab('attachments')}
                    className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'attachments' ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                  >
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4" /> Anexos
                    </div>
                    {activeTab === 'attachments' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-zinc-900 dark:bg-zinc-100 rounded-t-md" />}
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'history' ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                  >
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4" /> Histórico
                    </div>
                    {activeTab === 'history' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-zinc-900 dark:bg-zinc-100 rounded-t-md" />}
                  </button>
                </div>

                {/* Tabs Content */}
                <div className="pt-2">
                  {activeTab === 'attachments' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-center justify-between text-zinc-700 dark:text-zinc-300 font-semibold">
                        <div className="flex items-center gap-2">
                          <Paperclip className="w-5 h-5" />
                          Anexos
                        </div>
                        <div>
                          <Input
                            type="file"
                            id="file_upload"
                            className="hidden"
                            onChange={handleUploadAttachment}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              document.getElementById("file_upload")?.click()
                            }
                          >
                            Adicionar Anexo
                          </Button>
                        </div>
                      </div>

                      {detailedTask.attachments?.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {detailedTask.attachments.map((att: any) => (
                            <a
                              key={att.id}
                              href={att.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center p-3 rounded-lg border bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                            >
                              <Paperclip className="w-4 h-4 mr-2 text-zinc-400" />
                              <span className="text-sm truncate font-medium">
                                {att.file_name}
                              </span>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-zinc-500 bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-lg text-center border border-dashed border-zinc-200 dark:border-zinc-800">
                          Nenhum anexo encontrado. Clique em "Adicionar Anexo" para enviar um arquivo.
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'timelogs' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-semibold mb-4">
                        <Timer className="w-5 h-5" />
                        Horas Registradas
                      </div>
                      
                      {detailedTask.time_logs && detailedTask.time_logs.length > 0 ? (
                        <div className="space-y-3">
                          {[...detailedTask.time_logs]
                            .sort((a: any, b: any) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
                            .map((log: any) => (
                            <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={log.user?.avatar} />
                                <AvatarFallback>{log.user?.name?.charAt(0) || "U"}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="text-sm font-semibold">{log.user?.name}</p>
                                    <p className="text-xs text-zinc-500">
                                      {format(new Date(log.start_time), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md text-xs font-mono font-medium">
                                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                                    {log.duration_minutes ? (
                                      `${Math.floor(log.duration_minutes / 60)}h ${log.duration_minutes % 60}m`
                                    ) : (
                                      <span className="text-orange-500 animate-pulse">Rodando...</span>
                                    )}
                                  </div>
                                </div>
                                {log.description && (
                                  <p className="text-sm mt-2 text-zinc-600 dark:text-zinc-400 italic">"{log.description}"</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-zinc-500 bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-lg text-center border border-dashed border-zinc-200 dark:border-zinc-800">
                          Nenhuma hora foi registrada nesta tarefa ainda.
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'history' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex flex-col items-center justify-center p-12 text-zinc-500 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800">
                        <History className="w-8 h-8 mb-3 text-zinc-300" />
                        <p className="font-semibold text-zinc-600 dark:text-zinc-400">Em Breve</p>
                        <p className="text-sm text-center max-w-sm mt-1">
                          O histórico de alterações desta tarefa estará disponível nas próximas atualizações.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'comments' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-semibold mb-4">
                        <MessageSquare className="w-5 h-5" />
                        Comentários
                      </div>
                      
                      <form onSubmit={handleAddComment} className="flex gap-2">
                        <Avatar className="w-8 h-8">
                          {user?.avatar && (
                            <AvatarImage src={user.avatar} alt={user.name} />
                          )}
                          <AvatarFallback>
                            {user?.name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                          <Textarea
                            placeholder="Escreva um comentário..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="min-h-[80px] bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                          />
                          <Button
                            type="submit"
                            size="sm"
                            disabled={!newComment.trim()}
                          >
                            Comentar
                          </Button>
                        </div>
                      </form>

                      <div className="space-y-4 pt-4">
                        {detailedTask.comments?.reverse()?.map((comment: any) => (
                          <div key={comment.id} className="flex gap-3">
                            <Avatar className="w-8 h-8">
                              {comment.user?.avatar && (
                                <AvatarImage
                                  src={comment.user.avatar}
                                  alt={comment.user.name}
                                />
                              )}
                              <AvatarFallback>
                                {comment.user?.name?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg p-3 group">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-sm">
                                  {comment.user?.name}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-zinc-500">
                                    {format(
                                      new Date(comment.created_at),
                                      "dd 'de' MMM, HH:mm",
                                      { locale: ptBR }
                                    )}
                                  </span>
                                  {comment.user_id === currentUserId && (
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                                        onClick={() => {
                                          setEditingCommentId(comment.id);
                                          setEditCommentContent(comment.content);
                                        }}
                                      >
                                        <Pencil className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-zinc-400 hover:text-red-500"
                                        onClick={() =>
                                          handleDeleteComment(comment.id)
                                        }
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {editingCommentId === comment.id ? (
                                <div className="mt-2 space-y-2">
                                  <Textarea
                                    value={editCommentContent}
                                    onChange={(e) =>
                                      setEditCommentContent(e.target.value)
                                    }
                                    className="min-h-[80px] bg-white dark:bg-zinc-950 text-sm"
                                    autoFocus
                                  />
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        handleSaveEditComment(comment.id)
                                      }
                                      disabled={!editCommentContent.trim()}
                                    >
                                      Salvar
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        setEditingCommentId(null);
                                        setEditCommentContent("");
                                      }}
                                    >
                                      Cancelar
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                                  {comment.content}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </ScrollArea>
        </div>

        {/* Sidebar */}
        <div className="w-full md:w-80 bg-zinc-100/80 dark:bg-zinc-900/80 border-t md:border-t-0 md:border-l p-6 overflow-y-auto space-y-8 shadow-inner">
          {/* Status & Priority */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Detalhes
            </h4>

            <div className="space-y-3">
              <div>
                <span className="text-xs text-zinc-500 mb-1 block">
                  Prioridade
                </span>
                <Select
                  defaultValue={detailedTask?.priority || task.priority}
                  onValueChange={handleUpdatePriority}
                >
                  <SelectTrigger className="bg-white dark:bg-zinc-950">
                    <SelectValue>
                      {(val: any) => {
                        const labels: Record<string, string> = {
                          Low: "Baixa",
                          Medium: "Média",
                          High: "Alta",
                          Urgent: "Urgente"
                        };
                        return val ? labels[val] || val : "Prioridade";
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Baixa</SelectItem>
                    <SelectItem value="Medium">Média</SelectItem>
                    <SelectItem value="High">Alta</SelectItem>
                    <SelectItem value="Urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <span className="text-xs text-zinc-500 mb-1 block">
                  Story Points
                </span>
                <Input
                  type="number"
                  min="0"
                  defaultValue={detailedTask?.story_points || ""}
                  onBlur={handleUpdateStoryPoints}
                  className="bg-white dark:bg-zinc-950"
                  placeholder="Ex: 5"
                />
              </div>
            </div>
          </div>

          {/* People */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Pessoas
            </h4>

            <div className="space-y-3">
              <div>
                <span className="text-xs text-zinc-500 mb-1 block">Autor</span>
                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    {detailedTask?.creator?.avatar && (
                      <AvatarImage
                        src={detailedTask.creator.avatar}
                        alt={detailedTask.creator.name}
                      />
                    )}
                    <AvatarFallback>
                      {detailedTask?.creator?.name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">
                    {detailedTask?.creator?.name || "Desconhecido"}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs text-zinc-500 mb-1 block flex items-center justify-between">
                  Responsáveis
                  <Popover>
                    <PopoverTrigger className="h-5 w-5 rounded-full inline-flex items-center justify-center text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
                      <UserPlus className="w-3 h-3" />
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-0" align="end">
                      <Command>
                        <CommandInput placeholder="Buscar membro..." />
                        <CommandList>
                          <CommandEmpty>Nenhum membro encontrado.</CommandEmpty>
                          <CommandGroup>
                            {projectMembers.map((member) => {
                              const isAssigned = detailedTask?.assignees?.some(
                                (a: any) => a.user.id === member.id
                              );
                              return (
                                <CommandItem
                                  key={member.id}
                                  value={member.name}
                                  onSelect={() =>
                                    handleToggleAssignee(member.id, isAssigned)
                                  }
                                  className="flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-2">
                                    <Avatar className="w-6 h-6">
                                      {member.avatar && (
                                        <AvatarImage
                                          src={member.avatar}
                                          alt={member.name}
                                        />
                                      )}
                                      <AvatarFallback>
                                        {member.name.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span>{member.name}</span>
                                  </div>
                                  {isAssigned && <Check className="w-4 h-4" />}
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </span>

                <div className="flex flex-wrap gap-2 mt-2">
                  {detailedTask?.assignees?.length > 0 ? (
                    detailedTask.assignees.map((a: any) => (
                      <div
                        key={a.user.id}
                        className="flex items-center gap-1.5 bg-white dark:bg-zinc-950 border rounded-full pl-1 pr-2 py-1"
                      >
                        <Avatar className="w-5 h-5">
                          {a.user.avatar && (
                            <AvatarImage
                              src={a.user.avatar}
                              alt={a.user.name}
                            />
                          )}
                          <AvatarFallback className="text-[10px]">
                            {a.user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium">
                          {a.user.name.split(" ")[0]}
                        </span>
                        <X
                          className="w-3 h-3 text-zinc-400 cursor-pointer hover:text-zinc-700"
                          onClick={() => handleToggleAssignee(a.user.id, true)}
                        />
                      </div>
                    ))
                  ) : (
                    <span className="text-sm text-zinc-400 italic">
                      Nenhum responsável
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Time Tracking */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Time Tracking
            </h4>

            {!isAssignedToMe && (
              <div className="bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 p-3 rounded text-xs">
                Você precisa estar atribuído a esta task para usar o controle de
                horas.
              </div>
            )}

            <div
              className={`flex flex-col items-center justify-center p-5 bg-white dark:bg-zinc-950 rounded-xl border shadow-sm ${!isAssignedToMe ? "opacity-50 pointer-events-none" : ""}`}
            >
              <div className="text-4xl font-mono mb-5 tracking-tight font-light text-zinc-800 dark:text-zinc-100">
                {formatTime(timerSeconds)}
              </div>
              
              {!isTimerRunning && (
                <div className="w-full mb-4 animate-in fade-in zoom-in-95">
                  <Input
                    placeholder="O que você vai fazer agora?"
                    value={timerDescription}
                    onChange={(e) => setTimerDescription(e.target.value)}
                    className="h-8 text-sm text-center bg-zinc-50 dark:bg-zinc-900/50"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  size="lg"
                  variant={isTimerRunning ? "destructive" : "default"}
                  onClick={handleToggleTimer}
                  className="rounded-full w-14 h-14 p-0 shadow-lg"
                  disabled={!isAssignedToMe}
                >
                  {isTimerRunning ? (
                    <Pause className="w-6 h-6 fill-current" />
                  ) : (
                    <Play className="w-6 h-6 fill-current ml-1" />
                  )}
                </Button>
                {isTimerRunning && (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleToggleTimer}
                    className="rounded-full w-14 h-14 p-0 shadow-sm border-zinc-300 dark:border-zinc-700"
                  >
                    <Square className="w-5 h-5 fill-current text-zinc-500" />
                  </Button>
                )}
              </div>
              {timerError && (
                <p className="mt-4 text-xs text-red-500 text-center bg-red-50 dark:bg-red-950/50 p-2 rounded w-full">
                  {timerError}
                </p>
              )}
            </div>

            {showManualTime ? (
              <div className="p-3 bg-white dark:bg-zinc-950 border rounded-lg space-y-3 animate-in fade-in zoom-in-95">
                <div className="space-y-1">
                  <span className="text-xs font-medium text-zinc-500">
                    Minutos trabalhados:
                  </span>
                  <Input
                    type="number"
                    placeholder="Ex: 120"
                    value={manualTimeValue}
                    onChange={(e) => setManualTimeValue(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-medium text-zinc-500">
                    Descrição (Opcional):
                  </span>
                  <Input
                    placeholder="O que você fez?"
                    value={manualTimeDescription}
                    onChange={(e) => setManualTimeDescription(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-zinc-400 h-8"
                    onClick={() => {
                      setShowManualTime(false)
                      setManualTimeValue("")
                      setManualTimeDescription("")
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={handleSubmitManualTime} className="w-full h-8">
                    Salvar
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full justify-start bg-white dark:bg-zinc-950"
                onClick={() => setShowManualTime(true)}
                disabled={!isAssignedToMe}
              >
                <Clock className="w-4 h-4 mr-2 text-zinc-500" />
                Adicionar horas manuais
              </Button>
            )}

            {/* Total logado */}
            {detailedTask?.time_logs && (
              <div className="text-xs text-zinc-500 text-center">
                Total registrado:{" "}
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                  {Math.floor(
                    detailedTask.time_logs.reduce(
                      (acc: number, log: any) =>
                        acc + (log.duration_minutes || 0),
                      0
                    ) / 60
                  )}
                  h{" "}
                  {detailedTask.time_logs.reduce(
                    (acc: number, log: any) =>
                      acc + (log.duration_minutes || 0),
                    0
                  ) % 60}
                  m
                </span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
