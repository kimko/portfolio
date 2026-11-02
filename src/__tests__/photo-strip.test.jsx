import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';
import { ChakraProvider } from '@chakra-ui/react';
import { AppContent } from '../App';
import theme from '../theme';

vi.mock('../components/ModelViewer', () => ({
  default: () => <div data-testid="mock-model-viewer">3D Model</div>,
}));

const { projects } = vi.hoisted(() => {
  const photo = (key, alt, stage, day) => ({ key, thumb: `${key}.webp`, full: `full-${key}.webp`, blur: '', alt, stage, day });
  const cover = photo('hero', 'Cabinet render', 'plan');
  return {
    projects: [
      {
        id: 'cabinet',
        title: 'Cabinet',
        description: 'A cabinet.',
        hero: cover,
        materials: ['Maple'],
        techniques: [],
        images: [
          cover,
          photo('detail-1', 'Side panel glue-up', 'in-progress', 1),
          photo('detail-2', 'Front rails', 'in-progress', 2),
          photo('detail-3', 'Back rails', 'in-progress', 2),
        ],
      },
      {
        id: 'stool',
        title: 'Stool',
        description: 'A stool.',
        hero: photo('hero', 'Finished stool'),
        materials: ['Oak'],
        techniques: [],
        images: [photo('hero', 'Finished stool'), photo('detail-1', 'Seat')],
      },
    ],
  };
});

vi.mock('../data/projects', () => ({ projects }));

const renderAt = (path) =>
  render(
    <ChakraProvider theme={theme}>
      <Router hook={memoryLocation({ path }).hook}>
        <AppContent />
      </Router>
    </ChakraProvider>
  );

describe('Photo strip phases', () => {
  it('groups the strip into a list per phase, keeping photo numbers across the whole project', async () => {
    renderAt('/project/cabinet');
    const strip = await screen.findByRole('list', { name: 'Photos and 3D models' });

    const day2 = within(strip).getByRole('list', { name: 'Day 2' });
    expect(within(day2).getAllByRole('button').map((button) => button.getAttribute('aria-label'))).toEqual([
      'Photo 3 of 4: Front rails',
      'Photo 4 of 4: Back rails',
    ]);
    expect(within(strip).getByRole('list', { name: 'Plan' })).toBeDefined();
    expect(within(strip).getByRole('list', { name: 'Day 1' })).toBeDefined();
  });

  it('names the phase of the photo being viewed above its caption', async () => {
    renderAt('/project/cabinet/image/4');
    expect(await screen.findByText('In progress · Day 2')).toBeDefined();
    expect(screen.getAllByText('Back rails').length).toBeGreaterThan(0);
  });

  it('leaves projects without phases as one plain row', async () => {
    renderAt('/project/stool');
    const strip = await screen.findByRole('list', { name: 'Photos and 3D models' });
    expect(within(strip).getAllByRole('button')).toHaveLength(2);
    expect(screen.queryByText('Plan')).toBeNull();
    expect(screen.queryByText('Final')).toBeNull();
  });
});
