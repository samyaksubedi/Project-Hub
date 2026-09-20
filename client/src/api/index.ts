import { request, body } from './http';
import type {
  User,
  Project,
  ProjectInput,
  Page,
  Screenshot,
  Repository,
} from '../types';
export const api = {
  auth: (action: string, data: unknown) =>
    request<{ message: string }>(
      `/auth/${action}`,
      { method: 'POST', body: body(data) },
      false,
    ),
  login: (data: unknown) =>
    request<{ user: User; accessToken: string }>(
      '/auth/login',
      { method: 'POST', body: body(data) },
      false,
    ),
  logout: () => request('/auth/logout', { method: 'POST' }, false),
  me: () => request<User>('/auth/me'),
  projects: (params: URLSearchParams, signal?: AbortSignal) =>
    request<Page<Project>>(`/projects?${params}`, { signal }),
  project: (id: string, signal?: AbortSignal) =>
    request<Project>(`/projects/${id}`, { signal }),
  saveProject: (data: ProjectInput, id?: string) =>
    request<Project>(id ? `/projects/${id}` : '/projects', {
      method: id ? 'PATCH' : 'POST',
      body: body(data),
    }),
  deleteProject: (id: string) =>
    request(`/projects/${id}`, { method: 'DELETE' }),
  like: (id: string, liked: boolean) =>
    request<{ liked: boolean; likeCount: number }>(`/projects/${id}/like`, {
      method: liked ? 'POST' : 'DELETE',
    }),
  options: (signal?: AbortSignal) =>
    request<{ categories: string[]; technologies: { name: string }[] }>(
      '/projects/options',
      { signal },
    ),
  profile: (username: string, signal?: AbortSignal) =>
    request<User>(`/users/${username}`, { signal }),
  saveProfile: (data: unknown) =>
    request<User>('/users/me', { method: 'PATCH', body: body(data) }),
  users: (search: string, signal?: AbortSignal) =>
    request<User[]>(`/users?search=${encodeURIComponent(search)}`, { signal }),
  upload: (file: File) => {
    const data = new FormData();
    data.append('image', file);
    return request<Screenshot>('/uploads', { method: 'POST', body: data });
  },
  deleteUpload: (id: string) => request(`/uploads/${id}`, { method: 'DELETE' }),
  generate: (
    data: Pick<
      ProjectInput,
      'title' | 'description' | 'technologies' | 'category'
    >,
    id?: string,
  ) =>
    request<{ description: string }>(
      id
        ? `/projects/${id}/generate-description`
        : '/projects/generate-description',
      { method: 'POST', body: body(data) },
    ),
  github: (url: string, signal?: AbortSignal) =>
    request<Repository>(`/github/repository?url=${encodeURIComponent(url)}`, {
      signal,
    }),
};
