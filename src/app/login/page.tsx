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
import { login } from "./actions";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex h-screen w-full items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Entre com seu email para acessar seus projetos.
          </CardDescription>
        </CardHeader>
        <form action={login}>
          <CardContent className="grid gap-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-100 rounded-md dark:bg-red-900/30">
                {error}
              </div>
            )}
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
              Entrar
            </Button>
            <div className="text-center text-sm text-zinc-500 dark:text-zinc-400">
              Não tem uma conta?{" "}
              <Link
                href="/signup"
                className="underline hover:text-zinc-900 dark:hover:text-zinc-50"
              >
                Cadastre-se
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
