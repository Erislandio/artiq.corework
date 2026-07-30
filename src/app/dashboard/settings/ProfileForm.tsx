"use client"

import { useState } from "react"
import { User } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { updateUserProfile } from "@/features/users/actions/update-profile"
import { Upload, Check, AlertCircle } from "lucide-react"

interface ProfileFormProps {
  user: User
  availableManagers: User[]
}

export function ProfileForm({ user, availableManagers }: ProfileFormProps) {
  const [name, setName] = useState(user.name || "")
  const [jobTitle, setJobTitle] = useState(user.job_title || "")
  const [description, setDescription] = useState(user.description || "")
  const [responsibleFor, setResponsibleFor] = useState(user.responsible_for || "")
  const [managerId, setManagerId] = useState<string>(user.manager_id || "none")
  const [avatarUrl, setAvatarUrl] = useState<string>(user.avatar || "")
  
  const [loading, setLoading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const supabase = createClient()

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]

    setUploadingAvatar(true)
    setMessage(null)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })

      if (uploadError) {
        throw uploadError
      }

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      const newAvatarUrl = urlData.publicUrl
      setAvatarUrl(newAvatarUrl)

      // Atualiza imediatamente no banco de dados
      await updateUserProfile({
        name,
        job_title: jobTitle,
        description,
        responsible_for: responsibleFor,
        manager_id: managerId === "none" ? null : managerId,
        avatar: newAvatarUrl
      })

      setMessage({ type: 'success', text: 'Foto enviada e salva com sucesso!' })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || "Erro ao fazer upload da foto." })
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const res = await updateUserProfile({
      name,
      job_title: jobTitle,
      description,
      responsible_for: responsibleFor,
      manager_id: managerId === "none" ? null : managerId,
      avatar: avatarUrl
    })

    if (res.error) {
      setMessage({ type: 'error', text: res.error })
    } else {
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' })
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 text-sm font-medium ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
            : 'bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-800'
        }`}>
          {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      {/* Avatar & Identificação básica */}
      <Card>
        <CardHeader>
          <CardTitle>Foto de Perfil</CardTitle>
          <CardDescription>Esta foto será exibida no seu perfil e nas tasks do sistema.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <Avatar className="w-20 h-20 border-2 border-zinc-200 dark:border-zinc-800">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={name} />
            ) : (
              <AvatarFallback className="text-2xl font-bold">{name.charAt(0) || "U"}</AvatarFallback>
            )}
          </Avatar>
          <div>
            <Input 
              type="file" 
              id="avatar_upload" 
              accept="image/*"
              className="hidden" 
              onChange={handleAvatarUpload} 
            />
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              disabled={uploadingAvatar}
              onClick={() => document.getElementById('avatar_upload')?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploadingAvatar ? "Enviando..." : "Alterar foto"}
            </Button>
            <p className="text-xs text-zinc-500 mt-2">Formatos aceitos: JPG, PNG ou WEBP (Max 2MB).</p>
          </div>
        </CardContent>
      </Card>

      {/* Informações Pessoais */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Pessoais & Profissionais</CardTitle>
          <CardDescription>Atualize seu nome, cargo e estrutura de gestão.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome completo</label>
              <Input 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="Seu nome completo" 
                required 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Cargo / Função</label>
              <Input 
                value={jobTitle} 
                onChange={e => setJobTitle(e.target.value)} 
                placeholder="Ex: Desenvolvedor Senior, Product Owner" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Gerenciado por (Gestor)</label>
            <Select value={managerId} onValueChange={(val) => setManagerId(val || "none")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um gestor">
                  {(val: any) => {
                    if (val === "none") return "Sem gestor atribuído";
                    const manager = availableManagers.find((m) => m.id === val);
                    return manager
                      ? `${manager.name} (${manager.job_title || manager.email})`
                      : "Selecione um gestor";
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem gestor atribuído</SelectItem>
                {availableManagers.map(manager => (
                  <SelectItem key={manager.id} value={manager.id}>
                    {manager.name} ({manager.job_title || manager.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Responsável por (Escopo / Times)</label>
            <Input 
              value={responsibleFor} 
              onChange={e => setResponsibleFor(e.target.value)} 
              placeholder="Ex: Squad Frontend, Módulo de Pagamentos, Suporte N2" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Descrição / Biografia</label>
            <Textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="Escreva uma breve apresentação sobre sua atuação na empresa..." 
              className="min-h-[100px] resize-none"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={loading}>
          {loading ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>
    </form>
  )
}
