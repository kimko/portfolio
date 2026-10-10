import { useEffect } from 'react';
import { ChakraProvider, Container } from '@chakra-ui/react';
import { MotionConfig } from 'framer-motion';
import { Router, useLocation } from 'wouter';
import { useHashLocation } from 'wouter/use-hash-location';
import theme from './theme';
import { projects } from './data/projects';
import Header from './components/Header';
import ProjectGrid from './components/ProjectGrid';
import ProjectModal from './components/ProjectModal';

const siteTitle = 'Woodworks - Woodworking Portfolio';

export function AppContent() {
  const [location, setLocation] = useLocation();

  const match = location.match(/^\/project\/([^/]+)/);
  const projectId = match ? match[1] : null;
  const selectedProject = projects.find((p) => p.id === projectId) || null;

  useEffect(() => {
    document.title = selectedProject ? `${selectedProject.title} · Woodworks` : siteTitle;
  }, [selectedProject]);

  return (
    <Container maxW="1200px" py={{ base: 4, md: 10 }} px={{ base: 4, md: 8 }}>
      <Header projectCount={projects.length} />
      <main>
        <ProjectGrid projects={projects} />
      </main>
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
      <MotionConfig reducedMotion="user">
        <Router hook={useHashLocation}>
          <AppContent />
        </Router>
      </MotionConfig>
    </ChakraProvider>
  );
}

export default App;
