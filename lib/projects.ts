import projectData from "@/app/(main)/portfolio/projects.json";

export interface Project {
  id?: string;
  title: string;
  description: string;
  technologies: string[];
  imageUrl?: string;
  link?: string[];
  github?: string[];
  details?: string;
  duration?: string;
  award?: string;
  category?: string;
  status?: string;
  featured?: boolean;
  features?: string[];
  repositoryCreatedAt?: string;
  verifiedAt?: string;
  sources?: { label: string; url: string }[];
}

export const projects: Project[] = projectData;
export const featuredProjects = projects.filter((project) => project.featured);
export const recentProjects = featuredProjects.filter((project) => project.verifiedAt);
