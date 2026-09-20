export interface User {
  id: string;
  username: string;
  name: string;
  bio: string;
  avatarUrl: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  email?: string;
  emailVerified?: boolean;
  createdAt: string;
  projectCount?: number;
  likesReceived?: number;
}
export interface Screenshot {
  id: string;
  url: string;
  width: number;
  height: number;
}
export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  semester: number;
  githubUrl: string | null;
  demoUrl: string | null;
  ownerId: string;
  owner: User;
  technologies: { id: string; name: string }[];
  screenshots: Screenshot[];
  members: { userId: string; user: User }[];
  likeCount: number;
  liked: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}
export interface ProjectInput {
  title: string;
  description: string;
  category: string;
  semester: number;
  githubUrl: string;
  demoUrl: string;
  technologies: string[];
  memberIds: string[];
  screenshotIds: string[];
}
export interface Repository {
  name: string;
  description: string | null;
  stars: number;
  forks: number;
  language: string | null;
  languages: string[];
  updatedAt: string;
  url: string;
}
export const categories = [
  "AI / Machine Learning",
  "Web Development",
  "Mobile Development",
  "IoT",
  "Cybersecurity",
  "Data Science",
  "Game Development",
  "Other",
];