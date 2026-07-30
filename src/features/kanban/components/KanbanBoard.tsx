"use client";

import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult
} from "@hello-pangea/dnd";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Pencil, Plus, Trash2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Column, Task } from "@/types";
import {
  createColumn,
  createTask,
  deleteColumn,
  updateColumnsPositions,
  updateColumnTitle,
  updateTaskPosition,
  updateTasksPositions
} from "../actions/kanban";
import { TaskModal } from "./TaskModal";

interface KanbanBoardProps {
  projectId: string;
  initialColumns: Column[];
}

export function KanbanBoard({ projectId, initialColumns }: KanbanBoardProps) {
  const [columns, setColumns] = useState(initialColumns);
  const [isMounted, setIsMounted] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [addingTaskToCol, setAddingTaskToCol] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editColumnTitle, setEditColumnTitle] = useState("");

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setIsMounted(true);

    const taskId = searchParams.get("taskId");
    if (taskId && initialColumns) {
      let foundTask = null;
      for (const col of initialColumns) {
        if (col.tasks) {
          const task = col.tasks.find((t) => t.id === taskId);
          if (task) {
            foundTask = task;
            break;
          }
        }
      }
      if (foundTask) {
        setActiveTask(foundTask as unknown as Task);
      }
    }
  }, [initialColumns, searchParams, pathname, router]);

  function onDragEnd(result: DropResult) {
    const { destination, source, type, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    if (type === "column") {
      const newColumns = Array.from(columns);
      const [reorderedColumn] = newColumns.splice(source.index, 1);
      newColumns.splice(destination.index, 0, reorderedColumn);

      const updatedColumns = newColumns.map((col, index) => ({
        ...col,
        position: index
      }));

      setColumns(updatedColumns);

      updateColumnsPositions(
        updatedColumns.map((col) => ({ id: col.id, position: col.position }))
      );
      return;
    }

    const startCol = columns.find((col) => col.id === source.droppableId);
    const finishCol = columns.find((col) => col.id === destination.droppableId);

    if (!startCol || !finishCol) return;

    if (startCol === finishCol) {
      const newTasks = Array.from(startCol.tasks || []);
      const [reorderedTask] = newTasks.splice(source.index, 1);
      newTasks.splice(destination.index, 0, reorderedTask);

      const updatedTasks = newTasks.map((t, i) => ({ ...t, position: i }));

      const newColumn = { ...startCol, tasks: updatedTasks };
      setColumns(
        columns.map((col) => (col.id === newColumn.id ? newColumn : col))
      );

      updateTasksPositions(
        updatedTasks.map((t) => ({
          id: t.id,
          position: t.position,
          column_id: finishCol.id
        }))
      );

      updateTaskPosition(draggableId, finishCol.id, destination.index);
      return;
    }

    const startTasks = Array.from(startCol.tasks || []);
    const [movedTask] = startTasks.splice(source.index, 1);

    const finishTasks = Array.from(finishCol.tasks || []);
    finishTasks.splice(destination.index, 0, {
      ...movedTask,
      column_id: finishCol.id
    });

    const updatedStartTasks = startTasks.map((t, i) => ({ ...t, position: i }));
    const updatedFinishTasks = finishTasks.map((t, i) => ({
      ...t,
      position: i
    }));

    setColumns(
      columns.map((col) => {
        if (col.id === startCol.id) return { ...col, tasks: updatedStartTasks };
        if (col.id === finishCol.id)
          return { ...col, tasks: updatedFinishTasks };
        return col;
      })
    );

    updateTasksPositions([
      ...updatedStartTasks.map((t) => ({
        id: t.id,
        position: t.position,
        column_id: startCol.id
      })),
      ...updatedFinishTasks.map((t) => ({
        id: t.id,
        position: t.position,
        column_id: finishCol.id
      }))
    ]);

    updateTaskPosition(draggableId, finishCol.id, destination.index);
  }

  async function handleCreateColumn(e: React.FormEvent) {
    e.preventDefault();
    if (!newColumnTitle.trim()) return;

    const position = columns.length;
    const { data, error } = await createColumn(
      projectId,
      newColumnTitle,
      position
    );
    if (data) {
      setColumns([...columns, { ...data, tasks: [] } as Column]);
    }
    setNewColumnTitle("");
  }

  async function handleCreateTask(e: React.FormEvent, columnId: string) {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const col = columns.find((c) => c.id === columnId);
    const position = col?.tasks?.length || 0;

    const { data, error } = await createTask(
      projectId,
      columnId,
      newTaskTitle,
      position
    );
    if (data) {
      setColumns(
        columns.map((c) => {
          if (c.id === columnId) {
            return { ...c, tasks: [...(c.tasks || []), data as Task] };
          }
          return c;
        })
      );
    }
    setNewTaskTitle("");
    setAddingTaskToCol(null);
  }

  async function handleDeleteColumn(
    columnId: string,
    columnTitle: string,
    taskCount: number
  ) {
    if (taskCount > 0) {
      alert(
        `Não é possível excluir a coluna "${columnTitle}" porque ela contém ${taskCount} tarefa(s). Mova as tarefas primeiro.`
      );
      return;
    }

    if (confirm(`Tem certeza que deseja excluir a coluna "${columnTitle}"?`)) {
      const { error } = await deleteColumn(columnId);
      if (error) {
        alert(error);
      } else {
        setColumns(columns.filter((c) => c.id !== columnId));
      }
    }
  }

  async function handleRenameColumn(columnId: string) {
    if (!editColumnTitle.trim()) {
      setEditingColumnId(null);
      return;
    }

    const { error } = await updateColumnTitle(columnId, editColumnTitle);
    if (error) {
      alert(error);
    } else {
      setColumns(
        columns.map((col) =>
          col.id === columnId ? { ...col, title: editColumnTitle } : col
        )
      );
    }
    setEditingColumnId(null);
    setEditColumnTitle("");
  }

  if (!isMounted) return null;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="board" type="column" direction="horizontal">
        {(provided) => (
          <div
            className="flex h-full gap-4 overflow-x-auto pb-4"
            {...provided.droppableProps}
            ref={provided.innerRef}
          >
            {columns.map((column, index) => (
              <Draggable key={column.id} draggableId={column.id} index={index}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className="flex h-full max-h-full w-80 shrink-0 flex-col rounded-xl bg-zinc-200/50 p-3 dark:bg-zinc-800/50"
                  >
                    <div
                      {...provided.dragHandleProps}
                      className="mb-3 flex items-center justify-between font-medium group min-h-[32px]"
                    >
                      {editingColumnId === column.id ? (
                        <div className="flex w-full items-center gap-2">
                          <Input
                            autoFocus
                            value={editColumnTitle}
                            onChange={(e) => setEditColumnTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleRenameColumn(column.id);
                              } else if (e.key === "Escape") {
                                setEditingColumnId(null);
                              }
                            }}
                            onBlur={() => handleRenameColumn(column.id)}
                            className="h-7 text-sm font-semibold px-2 py-1"
                          />
                        </div>
                      ) : (
                        <>
                          <h3 className="text-sm font-semibold">
                            {column.title}
                          </h3>
                          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                              onClick={() => {
                                setEditingColumnId(column.id);
                                setEditColumnTitle(column.title);
                              }}
                              title="Renomear coluna"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-zinc-400 hover:text-red-500"
                              onClick={() =>
                                handleDeleteColumn(
                                  column.id,
                                  column.title,
                                  column.tasks?.length || 0
                                )
                              }
                              title="Excluir coluna"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>

                    <Droppable droppableId={column.id} type="task">
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex-1 overflow-y-auto space-y-2 p-1 min-h-[50px] ${snapshot.isDraggingOver ? "bg-zinc-200/80 dark:bg-zinc-800/80" : ""} rounded-md transition-colors`}
                        >
                          {column.tasks?.map((task, index) => (
                            <Draggable
                              key={task.id}
                              draggableId={task.id}
                              index={index}
                            >
                              {(provided) => (
                                <Card
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={() => setActiveTask(task)}
                                  className="cursor-grab bg-white shadow-sm dark:bg-zinc-900 active:cursor-grabbing hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
                                >
                                  <CardContent className=" space-y-3">
                                    <p className="text-base font-medium leading-tight">
                                      {task.title}
                                    </p>

                                    <p className="text-xs font-medium leading-tight">
                                      {`${task.description ? task.description.slice(0, 50) + "..." : "Sem descrição"}`}
                                    </p>

                                    <div className="flex items-center justify-between pt-1">
                                      <div className="flex items-center gap-1.5">
                                        {task.priority && (
                                          <span className="inline-block rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                            {task.priority}
                                          </span>
                                        )}
                                        {task.story_points && (
                                          <span className="inline-block rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                                            {task.story_points} pts
                                          </span>
                                        )}
                                        {task.due_date &&
                                          (() => {
                                            const dueDateStr =
                                              task.due_date.includes("T")
                                                ? task.due_date
                                                : `${task.due_date}T12:00:00`;
                                            const dueDate = new Date(
                                              dueDateStr
                                            );
                                            const today = new Date();
                                            today.setHours(0, 0, 0, 0);
                                            dueDate.setHours(0, 0, 0, 0);
                                            const isDelayed = dueDate < today;

                                            return (
                                              <span
                                                className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ${isDelayed ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"}`}
                                              >
                                                <Calendar className="w-3 h-3" />
                                                {format(dueDate, "dd/MM", {
                                                  locale: ptBR
                                                })}
                                              </span>
                                            );
                                          })()}
                                      </div>

                                      {/* Responsáveis */}
                                      <div className="flex -space-x-1.5 overflow-hidden">
                                        {(task as any).assignees?.map(
                                          (a: any) => (
                                            <Avatar
                                              key={a.user.id}
                                              className="w-8 h-8 border border-white dark:border-zinc-900"
                                              title={a.user.name}
                                            >
                                              {a.user.avatar && (
                                                <AvatarImage
                                                  src={a.user.avatar}
                                                  alt={a.user.name}
                                                />
                                              )}
                                              <AvatarFallback className="text-[9px] bg-zinc-200 dark:bg-zinc-700 font-semibold">
                                                {a.user.name?.charAt(0) || "U"}
                                              </AvatarFallback>
                                            </Avatar>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>

                    {addingTaskToCol === column.id ? (
                      <form
                        onSubmit={(e) => handleCreateTask(e, column.id)}
                        className="mt-2 flex flex-col gap-2"
                      >
                        <Input
                          autoFocus
                          placeholder="Título da task"
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button type="submit" size="sm">
                            Adicionar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setAddingTaskToCol(null);
                              setNewTaskTitle("");
                            }}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <Button
                        variant="ghost"
                        className="mt-2 w-full justify-start text-zinc-500 hover:bg-zinc-300/50 dark:hover:bg-zinc-700/50"
                        onClick={() => setAddingTaskToCol(column.id)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar Task
                      </Button>
                    )}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}

            <div className="w-80 shrink-0">
              <form onSubmit={handleCreateColumn} className="flex gap-2">
                <Input
                  placeholder="Nova Coluna"
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                  className="bg-white/50 dark:bg-zinc-900/50 mt-0"
                />
                <Button
                  type="submit"
                  variant="secondary"
                  size="icon"
                  disabled={!newColumnTitle.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        )}
      </Droppable>

      <TaskModal
        task={activeTask}
        open={!!activeTask}
        onOpenChange={(isOpen) => !isOpen && setActiveTask(null)}
      />
    </DragDropContext>
  );
}
