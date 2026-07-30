"use client";

import { Button } from "@/components/ui/button";
import { toggleTimer } from "@/features/kanban/actions/time-logs";
import { createClient } from "@/lib/supabase/client";
import { Clock, Square } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function GlobalTimer() {
  const [activeLog, setActiveLog] = useState<any>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const supabase = createClient();

  const fetchActiveTimer = async () => {
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("time_logs")
      .select("*, tasks(id, title, project_id)")
      .eq("user_id", user.id)
      .eq("is_timer", true)
      .is("end_time", null)
      .maybeSingle();

    if (data) {
      setActiveLog(data);
      const elapsed = Math.floor(
        (new Date().getTime() - new Date(data.start_time).getTime()) / 1000
      );
      setTimerSeconds(elapsed);
    } else {
      setActiveLog(null);
      setTimerSeconds(0);
    }
  };

  useEffect(() => {
    fetchActiveTimer();

    const channel = supabase
      .channel("global-timer")
      .on(
        "postgres_changes",
        { 
          event: "*", 
          schema: "public", 
          table: "time_logs" 
          // filter: `user_id=eq.${user.id}` // Se quiséssemos filtrar apenas para o user atual
        },
        () => {
          fetchActiveTimer();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeLog) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeLog]);

  const handleStopTimer = async () => {
    if (activeLog) {
      // Limpa visualmente primeiro para dar resposta imediata ao usuário
      setActiveLog(null);
      await toggleTimer(activeLog.task_id);
      fetchActiveTimer();
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (!activeLog) return null;

  return (
    <div className="flex items-center gap-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black px-4 py-1.5 rounded-full text-sm font-medium shadow-sm animate-in slide-in-from-top-2 fade-in duration-300">
      <Link
        href={
          activeLog.tasks?.project_id
            ? `/dashboard/projects/${activeLog.tasks.project_id}`
            : "/dashboard/my-tasks"
        }
        className="flex items-center gap-2 max-w-[200px] truncate hover:underline cursor-pointer"
        title="Ver task no projeto"
      >
        <Clock className="w-4 h-4 text-emerald-400 dark:text-emerald-600 animate-pulse shrink-0" />
        <span className="truncate">{activeLog.tasks?.title}</span>
      </Link>
      <div className="h-4 w-px bg-zinc-700 dark:bg-zinc-300" />
      <span className="font-mono w-[65px] text-center">
        {formatTime(timerSeconds)}
      </span>
      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6 text-zinc-300 hover:text-white hover:bg-zinc-800 dark:text-zinc-600 dark:hover:text-black dark:hover:bg-zinc-200 rounded-full"
        onClick={handleStopTimer}
        title="Parar timer"
      >
        <Square className="w-3 h-3 fill-current" />
      </Button>
    </div>
  );
}
