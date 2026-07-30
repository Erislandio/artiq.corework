"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { deleteOrganization } from "../actions/delete-organization"

export function DeleteOrganizationButton({ organizationId, organizationName }: { organizationId: string, organizationName: string }) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (window.confirm(`Tem certeza que deseja excluir a organização "${organizationName}"? Isso excluirá todos os projetos e tasks associados a ela.`)) {
      setLoading(true)
      const res = await deleteOrganization(organizationId)
      if (res?.error) {
        alert(res.error)
      }
      setLoading(false)
    }
  }

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-8 w-8 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 -mr-2"
      onClick={handleDelete}
      disabled={loading}
      title="Excluir Organização"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
