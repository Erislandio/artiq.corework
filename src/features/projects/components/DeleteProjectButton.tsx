"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { deleteProject } from "../actions/delete-project"

export function DeleteProjectButton({ projectId, projectName }: { projectId: string, projectName: string }) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (window.confirm(`Tem certeza que deseja excluir o projeto "${projectName}"? Isso pode excluir todas as tasks associadas a ele.`)) {
      setLoading(true)
      const res = await deleteProject(projectId)
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
      title="Excluir Projeto"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
