-- RLS policies for tags and task_tags tables
CREATE POLICY "Allow select for authenticated users" ON tags FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow insert for authenticated users" ON tags FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow update for authenticated users" ON tags FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow delete for authenticated users" ON tags FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow select for authenticated users" ON task_tags FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow insert for authenticated users" ON task_tags FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow update for authenticated users" ON task_tags FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow delete for authenticated users" ON task_tags FOR DELETE USING (auth.role() = 'authenticated');
