"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { useDebounce } from "use-debounce"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { globalSearch, SearchResult } from "@/features/search/actions/search"

export function GlobalSearch() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [debouncedQuery] = useDebounce(query, 300)
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  React.useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([])
      return
    }

    const fetchResults = async () => {
      setLoading(true)
      const data = await globalSearch(debouncedQuery)
      setResults(data)
      setLoading(false)
    }

    fetchResults()
  }, [debouncedQuery])

  const handleSelect = (item: SearchResult) => {
    setOpen(false)
    setQuery("")
    
    if (item.type === "organization") {
      router.push("/dashboard/organizations")
    } else if (item.type === "project") {
      router.push(`/dashboard/projects/${item.id}`)
    } else if (item.type === "task" && item.projectId) {
      router.push(`/dashboard/projects/${item.projectId}?taskId=${item.id}`)
    }
  }

  const organizations = results.filter((r) => r.type === "organization")
  const projects = results.filter((r) => r.type === "project")
  const tasks = results.filter((r) => r.type === "task")

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-full justify-start rounded-[0.5rem] bg-zinc-100 dark:bg-zinc-900 text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-[300px] lg:w-[400px] border-none"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden lg:inline-flex">Buscar projetos, tarefas...</span>
        <span className="inline-flex lg:hidden">Buscar...</span>
        <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Digite para buscar..." 
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {loading && <div className="p-4 text-sm text-center text-zinc-500">Buscando...</div>}
            {!loading && query.length >= 2 && results.length === 0 && (
              <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
            )}

            {organizations.length > 0 && (
              <CommandGroup heading="Organizações / Clientes">
                {organizations.map((org) => (
                  <CommandItem
                    key={org.id}
                    value={`org-${org.id}`}
                    onSelect={() => handleSelect(org)}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{org.title}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {projects.length > 0 && (
              <CommandGroup heading="Projetos">
                {projects.map((proj) => (
                  <CommandItem
                    key={proj.id}
                    value={`proj-${proj.id}`}
                    onSelect={() => handleSelect(proj)}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{proj.title}</span>
                      <span className="text-xs text-zinc-500">{proj.subtitle}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {tasks.length > 0 && (
              <CommandGroup heading="Tarefas">
                {tasks.map((task) => (
                  <CommandItem
                    key={task.id}
                    value={`task-${task.id}`}
                    onSelect={() => handleSelect(task)}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{task.title}</span>
                      <span className="text-xs text-zinc-500">{task.subtitle}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}
