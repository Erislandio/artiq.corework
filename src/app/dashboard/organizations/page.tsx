import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CreateOrganizationModal } from "@/features/organizations/components/CreateOrganizationModal"

export default async function OrganizationsPage() {
  const supabase = await createClient()

  const { data: organizations, error } = await supabase
    .from("organizations")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Organizações</h1>
        <CreateOrganizationModal />
      </div>

      {error ? (
        <div className="p-4 text-sm text-red-500 bg-red-100 rounded-md">
          Erro ao carregar organizações: {error.message}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {organizations?.length === 0 ? (
            <div className="col-span-full py-12 text-center border rounded-lg border-dashed">
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Nenhuma organização encontrada</h3>
              <p className="mt-1 text-sm text-zinc-500">Crie uma nova organização para começar.</p>
            </div>
          ) : (
            organizations?.map((org) => (
              <Card key={org.id}>
                <CardHeader>
                  <CardTitle>{org.name}</CardTitle>
                  <CardDescription>{org.description || "Sem descrição"}</CardDescription>
                </CardHeader>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
