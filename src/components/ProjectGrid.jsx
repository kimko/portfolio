import { SimpleGrid } from '@chakra-ui/react';
import ProjectCard from './ProjectCard';

export default function ProjectGrid({ projects, onProjectClick }) {
  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
      {projects.map((project, index) => (
        <ProjectCard
          key={project.id}
          project={project}
          index={index}
          onClick={() => onProjectClick(project)}
        />
      ))}
    </SimpleGrid>
  );
}
