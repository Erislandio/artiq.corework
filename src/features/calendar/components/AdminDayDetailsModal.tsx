"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect, useState } from "react";
import { getAdminDailyTimeLogs } from "../actions";

interface AdminDayDetailsModalProps {
  date: Date | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
  orgId?: string;
}

export function AdminDayDetailsModal({
  date,
  open,
  onOpenChange,
  projectId,
  orgId
}: AdminDayDetailsModalProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && date) {
      loadDetails();
    } else {
      setLogs([]);
    }
  }, [open, date, projectId, orgId]);

  const loadDetails = async () => {
    if (!date) return;
    setLoading(true);
    const data = await getAdminDailyTimeLogs(date.toISOString(), projectId, orgId);
    setLogs(data);
    setLoading(false);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins > 0 ? ` ${mins}m` : ""}`;
  };

  const totalMinutes = logs.reduce((acc, log) => acc + (log.duration_minutes || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-zinc-50 dark:bg-zinc-950 p-0 overflow-hidden border-none shadow-2xl">
        <div className="p-6 pb-4 border-b border-zinc-100 dark:border-zinc-900 flex justify-between items-center">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              Detalhes da Equipe:{" "}
              {date ? format(date, "dd 'de' MMMM", { locale: ptBR }) : ""}
            </DialogTitle>
          </DialogHeader>
          {totalMinutes > 0 && (
            <div className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 font-bold px-3 py-1 rounded-md text-sm">
              Total: {formatDuration(totalMinutes)}
            </div>
          )}
        </div>

        <ScrollArea className="max-h-[60vh] p-6 pt-2">
          {loading ? (
            <p className="text-center text-sm text-zinc-500 py-4">Carregando...</p>
          ) : logs.length === 0 ? (
            <p className="text-center text-sm text-zinc-500 py-4">
              Nenhuma hora registrada neste dia com os filtros atuais.
            </p>
          ) : (
            <div className="space-y-3 mt-4">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-lg shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6 border-2 border-white dark:border-zinc-950">
                        {log.user?.avatar && (
                          <AvatarImage src={log.user.avatar} alt={log.user.name} />
                        )}
                        <AvatarFallback className="text-[10px]">
                          {log.user?.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-semibold">
                        {log.user?.name || "Usuário"}
                      </span>
                    </div>
                    <span className="font-bold text-sm bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-400 px-2 py-0.5 rounded">
                      {formatDuration(log.duration_minutes)}
                    </span>
                  </div>
                  
                  <div className="pl-8">
                    <p className="text-sm font-medium">{log.task?.title}</p>
                    <p className="text-xs text-zinc-500">
                      Projeto: {log.task?.project?.name}
                    </p>
                    {log.description && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 bg-zinc-50 dark:bg-zinc-950 p-2 rounded">
                        {log.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
