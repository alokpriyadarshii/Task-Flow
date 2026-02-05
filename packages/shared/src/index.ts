export type { ApiError, ApiSuccess } from './types.js';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type UserRole = 'ADMIN' | 'USER';

export interface UserSafe {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
}
