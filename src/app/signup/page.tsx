import { signup } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default async function SignupPage({
  searchParams
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex h-screen w-full items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Cadastro</CardTitle>
          <CardDescription>
            Crie sua conta para começar a gerenciar seus projetos.
          </CardDescription>
        </CardHeader>
        <form action={signup}>
          <CardContent className="grid gap-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-100 rounded-md dark:bg-red-900/30">
                {error}
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Seu nome"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="m@exemplo.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" name="password" type="password" required />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 mt-4">
            <Button className="w-full" type="submit">
              Criar conta
            </Button>
            <div className="text-center text-sm text-zinc-500 dark:text-zinc-400">
              Já tem uma conta?{" "}
              <Link
                href="/login"
                className="underline hover:text-zinc-900 dark:hover:text-zinc-50"
              >
                Fazer login
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
