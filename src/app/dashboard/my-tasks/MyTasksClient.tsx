"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { TaskModal } from "@/features/kanban/components/TaskModal";
import { Task } from "@/types";
import { useState } from "react";

interface MyTasksClientProps {
  tasks: Task[];
}

export function MyTasksClient({ tasks }: MyTasksClientProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Minhas Tasks</h1>

      {tasks.length === 0 ? (
        <div className="py-12 text-center border rounded-lg border-dashed">
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
            Nenhuma task atribuída
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            Você não possui tasks atribuídas no momento.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <Card
              key={task.id}
              className="cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors"
              onClick={() => setActiveTask(task)}
            >
              <CardContent className="p-4 flex flex-col justify-between h-full space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                      {(task as any).project?.name || "Projeto"}
                    </span>
                    <span className="inline-block rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      {(task as any).column?.title || "Status"}
                    </span>
                  </div>
                  <p className="font-semibold">{task.title}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-1.5">
                    {task.priority && (
                      <span className="inline-block rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        {task.priority}
                      </span>
                    )}
                    {task.story_points && (
                      <span className="text-xs text-zinc-500 bg-zinc-100 dark:bg-zinc-900 rounded-full px-2 py-0.5">
                        {task.story_points} pts
                      </span>
                    )}
                  </div>

                  {/* Avatares dos Responsáveis */}
                  <div className="flex -space-x-1.5 overflow-hidden">
                    {(task as any).assignees?.map((a: any) => (
                      <Avatar
                        key={a.user.id}
                        className="w-5 h-5 border border-white dark:border-zinc-900"
                        title={a.user.name}
                      >
                        {a.user.avatar && (
                          <AvatarImage src={a.user.avatar} alt={a.user.name} />
                        )}
                        <AvatarFallback className="text-[9px] bg-zinc-200 dark:bg-zinc-700 font-semibold">
                          {a.user.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TaskModal
        task={activeTask}
        open={!!activeTask}
        onOpenChange={(isOpen) => !isOpen && setActiveTask(null)}
      />
    </div>
  );
}
