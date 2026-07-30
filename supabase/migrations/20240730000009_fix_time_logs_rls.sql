-- Fix RLS for time logs to allow all authenticated users to read all logs
DROP POLICY IF EXISTS "Enable read for users based on user_id" ON time_logs;
DROP POLICY IF EXISTS "Allow select for authenticated users" ON time_logs;
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON time_logs;

CREATE POLICY "Allow select for authenticated users" ON time_logs 
FOR SELECT USING (auth.role() = 'authenticated');
