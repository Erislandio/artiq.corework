"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Bell, CheckCheck, Clock, MessageSquare, CheckCircle, Info } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead
} from "@/features/notifications/actions/notifications"

export function NotificationsNav() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const supabase = createClient()

  const unreadCount = notifications.filter(n => !n.is_read).length

  const fetchNotifications = async () => {
    const data = await getUserNotifications()
    setNotifications(data)
  }

  useEffect(() => {
    fetchNotifications()

    const channel = supabase
      .channel("realtime-notifications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => {
          fetchNotifications()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleNotificationClick = async (n: any) => {
    if (!n.is_read) {
      await markAsRead(n.id)
      setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, is_read: true } : item))
    }
    setOpen(false)
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
    setNotifications(prev => prev.map(item => ({ ...item, is_read: true })))
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "task_assigned":
        return <CheckCircle className="w-4 h-4 text-emerald-500" />
      case "comment":
        return <MessageSquare className="w-4 h-4 text-blue-500" />
      default:
        return <Info className="w-4 h-4 text-zinc-500" />
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="relative p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
        <Bell className="h-5 w-5 text-zinc-600 dark:text-zinc-300" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm animate-in zoom-in-50">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
        <span className="sr-only">Notificações</span>
      </PopoverTrigger>

      <PopoverContent className="w-80 md:w-96 p-0 border-zinc-200 dark:border-zinc-800" align="end">
        <div className="flex items-center justify-between p-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">Notificações</span>
            {unreadCount > 0 && (
              <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs px-2 py-0.5 rounded-full font-medium">
                {unreadCount} novas
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 h-7 px-2"
            >
              <CheckCheck className="w-3.5 h-3.5 mr-1" />
              Marcar lidas
            </Button>
          )}
        </div>

        <div className="max-h-[350px] overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-zinc-400 text-xs">
              Nenhuma notificação no momento.
            </div>
          ) : (
            notifications.map(n => {
              const content = (
                <div
                  className={`p-3 transition-colors cursor-pointer flex items-start gap-3 ${
                    !n.is_read
                      ? "bg-blue-50/50 dark:bg-blue-950/20"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                  }`}
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className="mt-0.5 shrink-0">{getIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className={`text-xs font-medium truncate ${!n.is_read ? "font-semibold text-zinc-900 dark:text-zinc-100" : "text-zinc-600 dark:text-zinc-400"}`}>
                        {n.title}
                      </p>
                      <span className="text-[10px] text-zinc-400 whitespace-nowrap">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                      {n.message}
                    </p>
                  </div>
                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                  )}
                </div>
              )

              return n.link ? (
                <Link key={n.id} href={n.link} onClick={() => handleNotificationClick(n)}>
                  {content}
                </Link>
              ) : (
                <div key={n.id}>{content}</div>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
