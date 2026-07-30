-- Adiciona novas colunas na tabela users para perfil estendido
ALTER TABLE users ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS responsible_for TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Criar bucket para avatares se não existir
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policies para o Storage de avatares
CREATE POLICY "Allow public read access for avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Allow insert for authenticated users for avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "Allow update for authenticated users for avatars" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Policies RLS para a tabela users (Permitir edição do próprio perfil)
CREATE POLICY "Allow update for authenticated users on users" ON users FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow insert for authenticated users on users" ON users FOR INSERT WITH CHECK (auth.role() = 'authenticated');

