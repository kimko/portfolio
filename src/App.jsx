import { ChakraProvider, Container } from '@chakra-ui/react';
import { Router, useLocation } from 'wouter';
import { useHashLocation } from 'wouter/use-hash-location';
import theme from './theme';
import { projects } from './data/projects';
import Header from './components/Header';
import ProjectGrid from './components/ProjectGrid';
import ProjectModal from './components/ProjectModal';

function AppContent() {
  const [location, setLocation] = useLocation();
  
  const match = location.match(/^\/project\/([^/]+)/);
  const projectId = match ? match[1] : null;
  const selectedProject = projects.find(p => p.id === projectId) || null;

  return (
    <Container maxW="1200px" py={{ base: 4, md: 12 }} px={{ base: 4, md: 8 }}>
      <Header />
      <ProjectGrid
        projects={projects}
        onProjectClick={(project) => setLocation(`/project/${project.id}`)}
      />
      <ProjectModal
        project={selectedProject}
        isOpen={!!selectedProject}
        onClose={() => setLocation('/')}
      />
    </Container>
  );
}

function App() {
  return (
    <ChakraProvider theme={theme}>
      <Router hook={useHashLocation}>
        <AppContent />
      </Router>
    </ChakraProvider>
  );
}

export default App;
