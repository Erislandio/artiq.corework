-- Adiciona políticas de INSERT, UPDATE e DELETE para usuários autenticados
-- para facilitar o desenvolvimento inicial. Em um ambiente de produção estrito,
-- estas políticas devem verificar se o usuário é Admin da organização.

-- Organizations
CREATE POLICY "Allow insert for authenticated users" ON organizations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow update for authenticated users" ON organizations FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow delete for authenticated users" ON organizations FOR DELETE USING (auth.role() = 'authenticated');

-- Organization Members
CREATE POLICY "Allow insert for authenticated users" ON organization_members FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow select for authenticated users" ON organization_members FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow delete for authenticated users" ON organization_members FOR DELETE USING (auth.role() = 'authenticated');

-- Projects
CREATE POLICY "Allow insert for authenticated users" ON projects FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow update for authenticated users" ON projects FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow delete for authenticated users" ON projects FOR DELETE USING (auth.role() = 'authenticated');

-- Project Members
CREATE POLICY "Allow insert for authenticated users" ON project_members FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow select for authenticated users" ON project_members FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow delete for authenticated users" ON project_members FOR DELETE USING (auth.role() = 'authenticated');

-- Columns
CREATE POLICY "Allow insert for authenticated users" ON columns FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow update for authenticated users" ON columns FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow delete for authenticated users" ON columns FOR DELETE USING (auth.role() = 'authenticated');

-- Tasks
CREATE POLICY "Allow insert for authenticated users" ON tasks FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow update for authenticated users" ON tasks FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow delete for authenticated users" ON tasks FOR DELETE USING (auth.role() = 'authenticated');
