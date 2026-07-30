-- Política RLS para exclusão de usuários na tabela public.users
CREATE POLICY "Allow delete for authenticated users on users" ON users FOR DELETE USING (auth.role() = 'authenticated');
