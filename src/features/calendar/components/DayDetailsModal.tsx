"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format, formatISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect, useState } from "react";
import {
  addManualTimeForDate,
  deleteTimeLog,
  getActiveTasks,
  getDailyTimeLogs
} from "../actions";

interface DayDetailsModalProps {
  date: Date | null;
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTimeAdded: () => void;
}

export function DayDetailsModal({
  date,
  userId,
  open,
  onOpenChange,
  onTimeAdded
}: DayDetailsModalProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedTask, setSelectedTask] = useState<string>("");
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (open && date) {
      loadDetails();
      loadTasks();
    } else {
      setLogs([]);
      setSelectedTask("");
      setDuration("");
      setDescription("");
    }
  }, [open, date]);

  const loadDetails = async () => {
    if (!date) return;
    setLoading(true);
    // Usar a data local (YYYY-MM-DD) para evitar problemas de fuso horário
    const localDateStr = formatISO(date, { representation: "date" });
    const data = await getDailyTimeLogs(userId, `${localDateStr}T12:00:00`);
    setLogs(data);
    setLoading(false);
  };

  const loadTasks = async () => {
    const data = await getActiveTasks();
    setTasks(data);
  };

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !duration || !date) return;

    setIsSubmitting(true);
    const mins = parseInt(duration);
    // Usar a data local (YYYY-MM-DD) para evitar problemas de fuso horário
    const localDateStr = formatISO(date, { representation: "date" });
    await addManualTimeForDate(
      selectedTask,
      mins,
      description,
      `${localDateStr}T12:00:00`
    );
    setIsSubmitting(false);

    setSelectedTask("");
    setDuration("");
    setDescription("");

    loadDetails();
    onTimeAdded(); // atualizar o grid
  };

  const handleDelete = async (logId: string) => {
    if (!window.confirm("Deseja remover este registro de horas?")) return;
    setDeletingId(logId);
    await deleteTimeLog(logId);
    setDeletingId(null);
    loadDetails();
    onTimeAdded(); // atualizar o grid
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white dark:bg-zinc-950 flex flex-col h-[80vh] p-0">
        <div className="p-6 pb-2">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {date && format(date, "dd 'de' MMMM, yyyy", { locale: ptBR })}
            </DialogTitle>
          </DialogHeader>
        </div>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-4 py-4">
            <h3 className="text-sm font-semibold text-zinc-500 uppercase">
              Horas Registradas
            </h3>

            {loading ? (
              <p className="text-sm text-zinc-500">Carregando...</p>
            ) : logs.length === 0 ? (
              <p className="text-sm text-zinc-500">
                Nenhuma hora registrada neste dia.
              </p>
            ) : (
              <div className="space-y-3 scroll-auto max-h-[200px]">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800 group"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-sm flex-1 mr-2">
                        {log.task?.title || "Tarefa desconhecida"}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-bold text-orange-600 dark:text-orange-500 bg-orange-100 dark:bg-orange-950 px-2 py-0.5 rounded text-xs">
                          {formatDuration(log.duration_minutes)}
                        </span>
                        <button
                          onClick={() => handleDelete(log.id)}
                          disabled={deletingId === log.id}
                          title="Remover registro"
                          className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded hover:bg-red-100 dark:hover:bg-red-950 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-40"
                        >
                          {deletingId === log.id ? (
                            <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6l-1 14H6L5 6"/>
                              <path d="M10 11v6M14 11v6"/>
                              <path d="M9 6V4h6v2"/>
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-zinc-500 mb-2">
                      Projeto: {log.task?.project?.name}
                    </div>
                    {log.description && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {log.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <h3 className="text-sm font-semibold mb-3">Lançar Horas</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Select
              value={selectedTask}
              onValueChange={(val) => setSelectedTask(val || "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma tarefa...">
                  {(val: any) =>
                    val
                      ? tasks.find((t) => t.id === val)?.title || val
                      : "Selecione uma tarefa..."
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {tasks.map((t) => (
                  <SelectItem key={t.id} value={t.id} label={t.title}>
                    {t.title}{" "}
                    <span className="text-zinc-400 text-xs ml-2">
                      ({t.project?.name})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="Duração (minutos)"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  min="1"
                  required
                />
              </div>
            </div>

            <Textarea
              placeholder="O que foi feito? (opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={!selectedTask || !duration || isSubmitting}
            >
              {isSubmitting ? "Lançando..." : "Lançar Horas"}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
