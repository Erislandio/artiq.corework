"use client"

import { useState, useEffect } from "react"
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday 
} from "date-fns"
import { ptBR } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getMonthlyTimeLogs } from "../actions"
import { DayDetailsModal } from "./DayDetailsModal"

interface CalendarGridProps {
  userId: string
}

export function CalendarGrid({ userId }: CalendarGridProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    loadMonthlyLogs()
  }, [currentDate])

  const loadMonthlyLogs = async () => {
    setLoading(true)
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const data = await getMonthlyTimeLogs(userId, year, month)
    setLogs(data)
    setLoading(false)
  }

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))

  // Gerar dias do mês (incluindo dias dos meses adjacentes para completar o grid)
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }) // Domingo
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const days = eachDayOfInterval({ start: startDate, end: endDate })

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    if (h > 0 && m > 0) return `${h}h ${m}m`
    if (h > 0) return `${h}h`
    return `${m}m`
  }

  const getLogsForDay = (day: Date) => {
    // Pegamos todos os logs cujo start_time seja no mesmo dia
    const dayLogs = logs.filter(log => {
      const logDate = new Date(log.start_time)
      return isSameDay(logDate, day)
    })
    
    if (dayLogs.length === 0) return null
    
    const totalMinutes = dayLogs.reduce((acc, log) => acc + log.duration_minutes, 0)
    return totalMinutes
  }

  const handleDayClick = (day: Date) => {
    setSelectedDate(day)
    setModalOpen(true)
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-xl font-bold capitalize">
          {format(currentDate, "MMMM yyyy", { locale: ptBR })}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            Hoje
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Grid Header (Dias da Semana) */}
      <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
          <div key={day} className="py-2 text-center text-sm font-medium text-zinc-500">
            {day}
          </div>
        ))}
      </div>

      {/* Grid de Dias */}
      <div className="flex-1 grid grid-cols-7 auto-rows-fr bg-zinc-200 dark:bg-zinc-800 gap-[1px]">
        {days.map((day, i) => {
          const isCurrentMonth = isSameMonth(day, monthStart)
          const isTodayDate = isToday(day)
          const totalMinutes = getLogsForDay(day)
          
          return (
            <div
              key={i}
              onClick={() => handleDayClick(day)}
              className={`
                bg-white dark:bg-zinc-950 p-2 flex flex-col cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900
                ${!isCurrentMonth ? "opacity-50" : ""}
              `}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`
                  text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                  ${isTodayDate ? "bg-orange-600 text-white" : "text-zinc-700 dark:text-zinc-300"}
                `}>
                  {format(day, "d")}
                </span>
              </div>
              
              {totalMinutes !== null && (
                <div className="mt-auto bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 text-xs font-semibold px-2 py-1.5 rounded-md flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  {formatDuration(totalMinutes)}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <DayDetailsModal 
        date={selectedDate}
        userId={userId}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onTimeAdded={loadMonthlyLogs}
      />
    </div>
  )
}
