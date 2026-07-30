export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'Admin' | 'Member';
  job_title?: string;
  description?: string;
  responsible_for?: string;
  manager_id?: string;
  manager?: User;
}

export interface Organization {
  id: string;
  name: string;
  description?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  organization_id: string;
  status: string;
}

export interface Column {
  id: string;
  project_id: string;
  title: string;
  position: number;
  tasks?: Task[];
}

export interface Task {
  id: string;
  project_id: string;
  column_id: string;
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: string;
  position: number;
  due_date?: string;
  story_points?: number;
  creator_id?: string;
  
  // Relacionamentos aninhados (carregados via query)
  creator?: User;
  assignees?: { user: User }[];
}
