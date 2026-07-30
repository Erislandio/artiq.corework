-- Adicionando coluna story_points na tabela tasks
ALTER TABLE tasks ADD COLUMN story_points INTEGER;

-- RLS para task_assignees
CREATE POLICY "Allow insert for authenticated users" ON task_assignees FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow select for authenticated users" ON task_assignees FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow delete for authenticated users" ON task_assignees FOR DELETE USING (auth.role() = 'authenticated');

-- RLS para task_attachments
CREATE POLICY "Allow insert for authenticated users" ON task_attachments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow select for authenticated users" ON task_attachments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow delete for authenticated users" ON task_attachments FOR DELETE USING (auth.role() = 'authenticated');

-- Configuração do Storage (Arquivos anexados)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('attachments', 'attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Policies para o Storage
CREATE POLICY "Allow public read access for attachments" ON storage.objects FOR SELECT USING (bucket_id = 'attachments');
CREATE POLICY "Allow insert for authenticated users" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'attachments' AND auth.role() = 'authenticated');
CREATE POLICY "Allow delete for authenticated users" ON storage.objects FOR DELETE USING (bucket_id = 'attachments' AND auth.role() = 'authenticated');
