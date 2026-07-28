import { render, screen } from '@testing-library/react';
import { AppContent } from '../App';
import { describe, it, expect, vi } from 'vitest';
import { Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';
import { ChakraProvider } from '@chakra-ui/react';
import theme from '../theme';

// Mock the 3D ModelViewer so it doesn't crash without WebGL
vi.mock('../components/ModelViewer', () => ({
  default: () => <div data-testid="mock-model-viewer">3D Model</div>
}));

describe('App Routing', () => {
  const renderWithRouter = (initialPath) => {
    const { hook } = memoryLocation({ path: initialPath });
    return render(
      <ChakraProvider theme={theme}>
        <Router hook={hook}>
          <AppContent />
        </Router>
      </ChakraProvider>
    );
  };

  it('renders the main project grid', () => {
    renderWithRouter('/');
    expect(screen.getByText('Kopowski Woodworks')).toBeDefined();
    expect(screen.getByText('MCM Coffee Table')).toBeDefined();
  });

  it('renders a project modal with 3D model selected', async () => {
    renderWithRouter('/project/mcm-coffee-table/image/2');
    expect(await screen.findByRole('dialog')).toBeDefined();
    expect(await screen.findByTestId('mock-model-viewer')).toBeDefined();
  });

  it('renders a project modal with a specific image selected', async () => {
    renderWithRouter('/project/shaker-nightstands/image/2');
    expect(await screen.findByRole('dialog')).toBeDefined();
  });

  it('renders a project modal hero image', async () => {
    renderWithRouter('/project/small-table');
    expect(await screen.findByRole('dialog')).toBeDefined();
  });
});
