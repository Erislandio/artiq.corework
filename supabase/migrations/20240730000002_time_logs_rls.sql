-- Permissões para time_logs e outras tabelas dependentes

-- Time Logs
CREATE POLICY "Allow insert for authenticated users" ON time_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow update for authenticated users" ON time_logs FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow select for authenticated users" ON time_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow delete for authenticated users" ON time_logs FOR DELETE USING (auth.role() = 'authenticated');

-- Task Checklists
CREATE POLICY "Allow insert for authenticated users" ON task_checklists FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow update for authenticated users" ON task_checklists FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow select for authenticated users" ON task_checklists FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow delete for authenticated users" ON task_checklists FOR DELETE USING (auth.role() = 'authenticated');

-- Task Checklist Items
CREATE POLICY "Allow insert for authenticated users" ON task_checklist_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow update for authenticated users" ON task_checklist_items FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow select for authenticated users" ON task_checklist_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow delete for authenticated users" ON task_checklist_items FOR DELETE USING (auth.role() = 'authenticated');

-- Task Comments
CREATE POLICY "Allow insert for authenticated users" ON task_comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow update for authenticated users" ON task_comments FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow select for authenticated users" ON task_comments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow delete for authenticated users" ON task_comments FOR DELETE USING (auth.role() = 'authenticated');

-- Activities
CREATE POLICY "Allow insert for authenticated users" ON activities FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow select for authenticated users" ON activities FOR SELECT USING (auth.role() = 'authenticated');
