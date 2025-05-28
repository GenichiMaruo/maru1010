"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { generateGeometricPattern } from "@/utils/generatePattern"; // Import the function
import projects from "./projects.json"; // JSONファイルをインポート
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import ReactMarkdown from "react-markdown"; // Import react-markdown
import { FaLink, FaGithub } from "react-icons/fa";

interface Project {
  title: string;
  description: string;
  technologies: string[];
  imageUrl?: string;
  link?: string;
  github?: string;
  details?: string;
  duration?: string;
  award?: string;
}

export default function Portfolio() {
  const [patternSvg, setPatternSvg] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    // Generate pattern options *inside* the component
    const patternOptions = {
      size: 300, // Adjust as needed
      colors: ["#f0f4f8", "#d9e2ec", "#bcccdc", "#9fb3c8"], // Example color palette
      complexity: Math.random(), // Random complexity
      contrast: Math.random(), // Random contrast
    };

    const svg = generateGeometricPattern(patternOptions);
    setPatternSvg(svg);
  }, []);

  const backgroundStyle: React.CSSProperties = {
    backgroundImage: `url('data:image/svg+xml;utf8,${encodeURIComponent(
      patternSvg
    )}')`,
    backgroundColor: "#f0f4f8", // Use the first color as the base background
    position: "relative",
  };

  const overlayStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    // 半透明の薄い青みがかったグレー#8AA1E6
    backgroundColor: "rgba(138, 161, 230, 0.5)",
    zIndex: 1,
  };

  const contentStyle: React.CSSProperties = {
    position: "relative",
    zIndex: 2,
  };

  return (
    <div className="min-h-screen" style={backgroundStyle}>
      <div style={overlayStyle}></div>
      <div className="container mx-auto p-4 pt-24" style={contentStyle}>
        <h1 className="text-4xl font-bold text-center mb-8 bg-clip-text text-transparent leading-normal bg-gradient-to-r from-pink-500 to-violet-500">
          My Portfolio
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <ProjectCard
              key={index}
              project={project}
              onClick={() => setSelectedProject(project)}
            />
          ))}
        </div>
      </div>
      <Dialog
        open={!!selectedProject}
        onOpenChange={() => setSelectedProject(null)}
      >
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          {selectedProject && (
            <div>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold mb-4">
                  {selectedProject.title}
                </DialogTitle>
                <DialogDescription>
                  <div className="mb-2">
                    <strong>期間:</strong> {selectedProject.duration}
                  </div>
                  <div className="mb-2">
                    <strong>受賞歴:</strong> {selectedProject.award}
                  </div>
                  <div className="mb-4 whitespace-pre-wrap">
                    <ReactMarkdown>
                      {selectedProject.details || ""}
                    </ReactMarkdown>
                  </div>
                </DialogDescription>
              </DialogHeader>
              <DialogClose asChild>
                <Button variant="ghost">Close</Button>
              </DialogClose>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProjectCard({
  project,
  onClick,
}: {
  project: Project;
  onClick: () => void;
}) {
  return (
    <Card
      className="hover:shadow-lg transition-shadow duration-200 cursor-pointer"
      onClick={onClick}
    >
      {project.imageUrl && (
        <div className="relative h-65">
          <Image
            src={project.imageUrl}
            alt={project.title}
            fill
            className="object-cover rounded-t-md"
          />
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-primary">{project.title}</CardTitle>
        <CardDescription>{project.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <h3 className="text-lg font-semibold">使用した技術:</h3>
          <div className="flex flex-wrap gap-2 mt-2">
            {project.technologies.map((tech, index) => (
              <Badge key={index} variant="secondary">
                {tech}
              </Badge>
            ))}
          </div>
        </div>
        {project.link && (
          <Button asChild variant="link" className="mr-2">
            <Link href={project.link} target="_blank" rel="noopener noreferrer">
              <FaLink />
              関連リンク
            </Link>
          </Button>
        )}
        {project.github && (
          <Button asChild variant="link">
            <Link
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaGithub />
              GitHub
            </Link>
          </Button>
        )}
        <Button variant="outline" className="mt-4 w-full" onClick={onClick}>
          詳細を見る
        </Button>
      </CardContent>
    </Card>
  );
}
