import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Ranking = { teamName: string; totalPoints: number; rank: number };
type LeaderboardResponse = { leaderboard: Ranking[] };
type State = { status: 'loading' } | { status: 'error' } | { status: 'success'; data: LeaderboardResponse };

export default function Leaderboard() {
  const [state, setState] = useState<State>({ status: 'loading' });
  useEffect(() => {
    let active = true;
    getJson<LeaderboardResponse>('/api/leaderboard')
      .then((data) => { if (active) setState({ status: 'success', data }); })
      .catch(() => { if (active) setState({ status: 'error' }); });
    return () => { active = false; };
  }, []);

  return <CapabilityCard title="Leaderboard" description="Compare team point totals.">
    {state.status === 'loading' && <p role="status">Loading leaderboard...</p>}
    {state.status === 'error' && <p role="alert">Unable to load leaderboard. Try again later.</p>}
    {state.status === 'success' && (state.data.leaderboard.length === 0
      ? <p>No leaderboard entries yet.</p>
      : <ol className="list-group list-group-numbered list-group-flush">{state.data.leaderboard.map((entry) => <li className="list-group-item d-flex justify-content-between" key={entry.rank}>
        <span>{entry.teamName}</span><strong>{entry.totalPoints} points</strong>
      </li>)}</ol>)}
  </CapabilityCard>;
}
