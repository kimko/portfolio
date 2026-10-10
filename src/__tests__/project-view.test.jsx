import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';
import { ChakraProvider } from '@chakra-ui/react';
import { AppContent } from '../App';
import theme from '../theme';
import projectsData from '../data/projects.json';

vi.mock('../components/ModelViewer', () => ({
  default: () => <div data-testid="mock-model-viewer">3D Model</div>,
}));

const nightstands = projectsData.find((project) => project.id === 'shaker-nightstands');
const nightstandPhoto = (position) => nightstands.images[position - 1];

const renderAt = (path) => {
  const memory = memoryLocation({ path, record: true });
  render(
    <ChakraProvider theme={theme}>
      <Router hook={memory.hook}>
        <AppContent />
      </Router>
    </ChakraProvider>
  );
  return memory;
};

describe('Home page structure', () => {
  it('names the site in a top-level heading', () => {
    renderAt('/');
    expect(screen.getByRole('heading', { level: 1, name: 'Woodworks' })).toBeDefined();
  });

  it('lists projects newest first, with the last one added at the top', () => {
    renderAt('/');
    const titles = screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent);
    expect(titles).toEqual(projectsData.map((project) => project.title).toReversed());
  });

  it('shows materials on the cards but leaves techniques for the project details', () => {
    renderAt('/');
    expect(screen.getAllByText('Walnut').length).toBeGreaterThan(0);
    expect(screen.queryByText('Mortise & Tenon')).toBeNull();
  });

  it('gives every project a heading that links to its page', () => {
    renderAt('/');
    const heading = screen.getByRole('heading', { level: 2, name: 'MCM Coffee Table' });
    const link = within(heading).getByRole('link');
    expect(link.getAttribute('href')).toBe('/project/mcm-coffee-table');
  });
});

describe('Project view', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('announces the project title as the name of the dialog', async () => {
    renderAt('/project/shaker-bench');
    expect(await screen.findByRole('dialog', { name: 'Shaker Style Bench' })).toBeDefined();
  });

  it('moves to the next photo with the right arrow key and back with the left', async () => {
    const memory = renderAt('/project/shaker-nightstands');
    await screen.findByRole('dialog');

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    await waitFor(() => expect(memory.history.at(-1)).toBe('/project/shaker-nightstands/image/2'));

    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    await waitFor(() => expect(memory.history.at(-1)).toBe('/project/shaker-nightstands'));
  });

  it('leaves pinch-zoom to the browser while a photo is at normal size', async () => {
    renderAt('/project/shaker-nightstands');
    const photo = await screen.findByRole('img', { name: nightstandPhoto(1).alt });
    expect(photo.parentElement.style.touchAction).toBe('');
  });

  it('moves to the next photo on a one-finger swipe left', async () => {
    const memory = renderAt('/project/shaker-nightstands');
    const photo = await screen.findByRole('img', { name: nightstandPhoto(1).alt });

    fireEvent.touchStart(photo.parentElement, { touches: [{ clientX: 300 }], changedTouches: [{ clientX: 300 }] });
    fireEvent.touchEnd(photo.parentElement, { touches: [], changedTouches: [{ clientX: 100 }] });

    await waitFor(() => expect(memory.history.at(-1)).toBe('/project/shaker-nightstands/image/2'));
  });

  it('does not change photos during a two-finger pinch', async () => {
    const memory = renderAt('/project/shaker-nightstands');
    const photo = await screen.findByRole('img', { name: nightstandPhoto(1).alt });

    fireEvent.touchStart(photo.parentElement, { touches: [{ clientX: 300 }], changedTouches: [{ clientX: 300 }] });
    fireEvent.touchMove(photo.parentElement, {
      touches: [{ clientX: 280 }, { clientX: 120 }],
      changedTouches: [{ clientX: 120 }],
    });
    fireEvent.touchEnd(photo.parentElement, { touches: [], changedTouches: [{ clientX: 100 }] });

    expect(memory.history.at(-1)).toBe('/project/shaker-nightstands');
  });

  it('captions the photo being viewed and follows it to the next photo', async () => {
    renderAt('/project/shaker-nightstands');
    expect(await screen.findByText(nightstandPhoto(1).alt)).toBeDefined();

    fireEvent.keyDown(window, { key: 'ArrowRight' });

    expect(await screen.findByText(nightstandPhoto(2).alt)).toBeDefined();
    expect(screen.queryByText(nightstandPhoto(1).alt)).toBeNull();
  });

  it('marks the photo being viewed as current in the photo strip', async () => {
    renderAt('/project/shaker-nightstands/image/3');
    const current = await screen.findByRole('button', { name: new RegExp(`^Photo 3 of ${nightstands.images.length}`) });
    expect(current.getAttribute('aria-current')).toBe('true');
  });

  it('copies a link to the exact photo being viewed when the device has no share sheet', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, share: undefined, clipboard: { writeText } });
    renderAt('/project/shaker-nightstands/image/2');

    fireEvent.click(await screen.findByRole('button', { name: 'Share' }));

    await waitFor(() => expect(writeText).toHaveBeenCalledOnce());
    expect(writeText.mock.calls[0][0]).toMatch(new RegExp(`/p/shaker-nightstands/${nightstandPhoto(2).name}/$`));
    expect(await screen.findByText('Link copied')).toBeDefined();
  });

  it('opens the device share sheet with the photo link when one is available', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, share });
    renderAt('/project/dresser/image/5');

    fireEvent.click(await screen.findByRole('button', { name: 'Share' }));

    await waitFor(() => expect(share).toHaveBeenCalledOnce());
    expect(share.mock.calls[0][0]).toMatchObject({ title: 'Dresser · Woodworks' });
    expect(share.mock.calls[0][0].url).toMatch(/\/p\/dresser\/detail-1\/$/);
  });

  it('shares a 3D model under the name of its preview image', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, share });
    renderAt('/project/dresser/image/2');

    fireEvent.click(await screen.findByRole('button', { name: 'Share' }));

    await waitFor(() => expect(share).toHaveBeenCalledOnce());
    expect(share.mock.calls[0][0].url).toMatch(/\/p\/dresser\/dresser_preview\/$/);
  });

  it('falls back to copying the link when the share sheet refuses to open', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('blocked', 'NotAllowedError'));
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, share, clipboard: { writeText } });
    renderAt('/project/dresser/image/5');

    fireEvent.click(await screen.findByRole('button', { name: 'Share' }));

    await waitFor(() => expect(writeText).toHaveBeenCalledOnce());
    expect(writeText.mock.calls[0][0]).toMatch(/\/p\/dresser\/detail-1\/$/);
    expect(await screen.findByText('Link copied')).toBeDefined();
  });

  it('does nothing more when the visitor dismisses the share sheet', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('dismissed', 'AbortError'));
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, share, clipboard: { writeText } });
    renderAt('/project/dresser/image/5');

    fireEvent.click(await screen.findByRole('button', { name: 'Share' }));

    await waitFor(() => expect(share).toHaveBeenCalledOnce());
    expect(writeText).not.toHaveBeenCalled();
  });

  it('hides the project description until the visitor asks for it', async () => {
    renderAt('/project/shaker-bench');
    const toggle = await screen.findByRole('button', { name: /Shaker Style Bench/ });

    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByText(/This Shaker-style bench was built/)).toBeNull();

    fireEvent.click(toggle);

    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(await screen.findByText(/This Shaker-style bench was built/)).toBeDefined();
  });

  it('closes the details before the project on Escape', async () => {
    renderAt('/project/shaker-bench');
    const dialog = await screen.findByRole('dialog');
    const toggle = screen.getByRole('button', { name: /Shaker Style Bench/ });
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');

    fireEvent.keyDown(dialog, { key: 'Escape' });
    await waitFor(() => expect(toggle.getAttribute('aria-expanded')).toBe('false'));
    expect(screen.getByRole('dialog')).toBeDefined();

    fireEvent.keyDown(dialog, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});
