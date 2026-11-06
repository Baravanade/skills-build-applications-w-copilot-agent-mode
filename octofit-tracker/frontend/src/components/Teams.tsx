import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = { name: string; mascot: string; members: string[] };
type TeamsResponse = { teams: Team[] };
type State = { status: 'loading' } | { status: 'error' } | { status: 'success'; data: TeamsResponse };

export default function Teams() {
  const [state, setState] = useState<State>({ status: 'loading' });
  useEffect(() => {
    let active = true;
    getJson<TeamsResponse>('/api/teams')
      .then((data) => { if (active) setState({ status: 'success', data }); })
      .catch(() => { if (active) setState({ status: 'error' }); });
    return () => { active = false; };
  }, []);

  return <CapabilityCard title="Teams" description="Manage teams and members.">
    {state.status === 'loading' && <p role="status">Loading teams...</p>}
    {state.status === 'error' && <p role="alert">Unable to load teams. Try again later.</p>}
    {state.status === 'success' && (state.data.teams.length === 0
      ? <p>No teams yet.</p>
      : <ul className="list-group list-group-flush">{state.data.teams.map((team) => <li className="list-group-item" key={team.name}>
        <strong>{team.name}</strong> | {team.mascot} | {team.members.length} members
      </li>)}</ul>)}
  </CapabilityCard>;
}
