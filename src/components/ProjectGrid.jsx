import { SimpleGrid } from '@chakra-ui/react';
import ProjectCard from './ProjectCard';
import { lastRowSpan } from './lastRowSpan';

export default function ProjectGrid({ projects }) {
  return (
    <SimpleGrid as="ul" listStyleType="none" columns={{ base: 1, md: 2, lg: 3 }} columnGap={8} rowGap={12}>
      {projects.map((project, index) => (
        <ProjectCard
          key={project.id}
          project={project}
          index={index}
          gridColumn={{
            base: 'auto',
            md: `span ${lastRowSpan(index, projects.length, 2)}`,
            lg: `span ${lastRowSpan(index, projects.length, 3)}`,
          }}
        />
      ))}
    </SimpleGrid>
  );
}
