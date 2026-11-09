import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App.js';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('API-backed capability states', () => {
  it.each([
    ['/activities', '/api/activities'],
    ['/teams', '/api/teams'],
    ['/leaderboard', '/api/leaderboard'],
    ['/workouts', '/api/workouts/suggestions/mona%40example.com'],
  ])('reports network errors on %s', async (route, path) => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
    render(<MemoryRouter initialEntries={[route]}><App /></MemoryRouter>);
    expect(await screen.findByRole('alert')).toHaveTextContent(/unable/i);
    expect(fetch).toHaveBeenCalledWith(path);
  });

  it('reports an invalid response rather than displaying an empty state', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 200 })));
    render(<MemoryRouter initialEntries={['/activities']}><App /></MemoryRouter>);
    expect(await screen.findByRole('alert')).toHaveTextContent(/unable/i);
    expect(screen.queryByText(/no activities/i)).not.toBeInTheDocument();
  });

  it('renders team members supplied by the API', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ teams: [{ name: 'Octocats', mascot: 'Mona', members: ['member-id'] }] }),
      { status: 200 },
    )));
    render(<MemoryRouter initialEntries={['/teams']}><App /></MemoryRouter>);
    expect(await screen.findByText(/member-id/)).toHaveTextContent('Octocats (Mona) - Members: member-id');
  });
});
