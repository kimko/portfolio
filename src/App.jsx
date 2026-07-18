import { useState } from 'react';
import { ChakraProvider, Container, useDisclosure } from '@chakra-ui/react';
import theme from './theme';
import { projects } from './data/projects';
import Header from './components/Header';
import ProjectGrid from './components/ProjectGrid';
import ProjectModal from './components/ProjectModal';

function App() {
  const [selectedProject, setSelectedProject] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleProjectClick = (project) => {
    setSelectedProject(project);
    onOpen();
  };

  const handleClose = () => {
    setSelectedProject(null);
    onClose();
  };

  return (
    <ChakraProvider theme={theme}>
      <Container maxW="1200px" py={{ base: 4, md: 12 }} px={{ base: 4, md: 8 }}>
        <Header />
        <ProjectGrid
          projects={projects}
          onProjectClick={handleProjectClick}
        />
        <ProjectModal
          project={selectedProject}
          isOpen={isOpen}
          onClose={handleClose}
        />
      </Container>
    </ChakraProvider>
  );
}

export default App;
