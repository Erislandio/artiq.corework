"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  deleteUser,
  updateUserRole
} from "@/features/users/actions/user-management";
import { User } from "@/types";
import {
  AlertTriangle,
  Check,
  Shield,
  Trash2,
  User as UserIcon
} from "lucide-react";
import { useState } from "react";

interface UserTableProps {
  users: User[];
  currentUserId: string;
}

export function UserTable({
  users: initialUsers,
  currentUserId
}: UserTableProps) {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [selectedUserForDelete, setSelectedUserForDelete] =
    useState<User | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase()) ||
      user.job_title?.toLowerCase().includes(search.toLowerCase())
  );

  const handleRoleChange = async (
    userId: string,
    newRole: "Admin" | "Member"
  ) => {
    setLoadingId(userId);
    setActionMessage(null);

    const res = await updateUserRole(userId, newRole);
    if (res.error) {
      setActionMessage({ type: "error", text: res.error });
    } else {
      setUsers(
        users.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      setActionMessage({
        type: "success",
        text: "Função do usuário atualizada com sucesso."
      });
    }
    setLoadingId(null);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUserForDelete) return;

    const userId = selectedUserForDelete.id;
    setLoadingId(userId);
    setActionMessage(null);

    const res = await deleteUser(userId);
    if (res.error) {
      setActionMessage({ type: "error", text: res.error });
    } else {
      setUsers(users.filter((u) => u.id !== userId));
      setActionMessage({
        type: "success",
        text: `Usuário "${selectedUserForDelete.name}" foi removido com sucesso.`
      });
    }
    setSelectedUserForDelete(null);
    setLoadingId(null);
  };

  return (
    <div className="space-y-4">
      {actionMessage && (
        <div
          className={`p-4 rounded-lg flex items-center justify-between text-sm font-medium ${
            actionMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === "success" ? (
              <Check className="w-4 h-4" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
            {actionMessage.text}
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-xs underline opacity-70 hover:opacity-100"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Toolbar / Search */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md flex items-center">
          <Input
            placeholder="Buscar por nome, email ou cargo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="text-xs text-zinc-500 font-medium">
          Total:{" "}
          <span className="text-zinc-900 dark:text-zinc-100 font-semibold">
            {filteredUsers.length}
          </span>{" "}
          usuários
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-xl bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b text-zinc-500 font-medium uppercase text-[11px] tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Usuário</th>
                <th className="px-6 py-3.5">Cargo / Função</th>
                <th className="px-6 py-3.5">Papel (Role)</th>
                <th className="px-6 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-zinc-500"
                  >
                    Nenhum usuário encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                  >
                    {/* User Profile */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9 border border-zinc-200 dark:border-zinc-800">
                          {user.avatar && (
                            <AvatarImage src={user.avatar} alt={user.name} />
                          )}
                          <AvatarFallback className="font-semibold text-xs bg-zinc-200 dark:bg-zinc-800">
                            {user.name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                            {user.name}
                            {user.id === currentUserId && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.5 rounded font-normal">
                                Você
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-zinc-500">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Job Title */}
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                      {user.job_title || (
                        <span className="italic text-zinc-400">
                          Não informado
                        </span>
                      )}
                    </td>

                    {/* Role Select */}
                    <td className="px-6 py-4">
                      <Select
                        value={user.role}
                        disabled={loadingId === user.id}
                        onValueChange={(val) =>
                          handleRoleChange(user.id, val as "Admin" | "Member")
                        }
                      >
                        <SelectTrigger className="w-32 h-8 text-xs font-medium bg-white dark:bg-zinc-950">
                          <SelectValue>
                            {(val: any) =>
                              val === "Admin" ? (
                                <div className="flex items-center gap-1.5 font-medium text-purple-600 dark:text-purple-400">
                                  <Shield className="w-3.5 h-3.5" />
                                  Admin
                                </div>
                              ) : val === "Member" ? (
                                <div className="flex items-center gap-1.5 font-medium text-zinc-600 dark:text-zinc-400">
                                  <UserIcon className="w-3.5 h-3.5" />
                                  Member
                                </div>
                              ) : (
                                "Role"
                              )
                            }
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Admin">
                            <div className="flex items-center gap-1.5 font-medium text-purple-600 dark:text-purple-400">
                              <Shield className="w-3.5 h-3.5" />
                              Admin
                            </div>
                          </SelectItem>
                          <SelectItem value="Member">
                            <div className="flex items-center gap-1.5 font-medium text-zinc-600 dark:text-zinc-400">
                              <UserIcon className="w-3.5 h-3.5" />
                              Membro
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                        disabled={
                          user.id === currentUserId || loadingId === user.id
                        }
                        onClick={() => setSelectedUserForDelete(user)}
                        title={
                          user.id === currentUserId
                            ? "Você não pode excluir seu próprio usuário"
                            : "Excluir usuário"
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={!!selectedUserForDelete}
        onOpenChange={(open) => !open && setSelectedUserForDelete(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-5 h-5" />
              Excluir Usuário
            </DialogTitle>
            <DialogDescription className="pt-2">
              Tem certeza que deseja excluir o usuário{" "}
              <strong className="text-zinc-900 dark:text-zinc-100">
                {selectedUserForDelete?.name}
              </strong>{" "}
              ({selectedUserForDelete?.email})? Esta ação removerá o usuário do
              sistema.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button
              variant="outline"
              onClick={() => setSelectedUserForDelete(null)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Confirmar Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
