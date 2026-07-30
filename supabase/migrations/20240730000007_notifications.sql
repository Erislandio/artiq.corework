-- 1. Criar tabela de notificações
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    type TEXT NOT NULL DEFAULT 'info',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitar RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de Segurança RLS
CREATE POLICY "Allow select for user on notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow insert for authenticated users on notifications" ON notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow update for user on notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Allow delete for user on notifications" ON notifications FOR DELETE USING (auth.uid() = user_id);

-- 4. Habilitar Supabase Realtime para notificações
INSERT INTO storage.buckets (id, name, public) VALUES ('fake_test_bucket', 'fake_test_bucket', false) ON CONFLICT DO NOTHING; -- no-op safety
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
