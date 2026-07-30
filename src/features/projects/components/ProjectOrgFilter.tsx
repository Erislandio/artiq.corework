"use client"

import { useRouter, useSearchParams } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ProjectOrgFilterProps {
  organizations: { id: string; name: string }[]
}

export function ProjectOrgFilter({ organizations }: ProjectOrgFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentOrg = searchParams.get("org") || "all"

  const handleValueChange = (val: string | null) => {
    if (!val) return
    const params = new URLSearchParams(searchParams)
    if (val === "all") {
      params.delete("org")
    } else {
      params.set("org", val)
    }
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-zinc-500">Filtrar por:</span>
      <Select value={currentOrg} onValueChange={handleValueChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Todas as organizações" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as organizações</SelectItem>
          {organizations.map((org) => (
            <SelectItem key={org.id} value={org.id}>
              {org.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
