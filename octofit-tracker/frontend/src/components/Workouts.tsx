import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Workout = { title: string; focus: string; minutes: number; difficulty: string; reason: string };
type WorkoutsResponse = { suggestions: Workout[] };
type State = { status: 'loading' } | { status: 'error' } | { status: 'success'; data: WorkoutsResponse };

export default function Workouts() {
  const [state, setState] = useState<State>({ status: 'loading' });
  useEffect(() => {
    let active = true;
    getJson<WorkoutsResponse>('/api/workouts/suggestions/mona%40example.com')
      .then((data) => { if (active) setState({ status: 'success', data }); })
      .catch(() => { if (active) setState({ status: 'error' }); });
    return () => { active = false; };
  }, []);

  return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns.">
    {state.status === 'loading' && <p role="status">Loading workout suggestions...</p>}
    {state.status === 'error' && <p role="alert">Unable to load workout suggestions. Try again later.</p>}
    {state.status === 'success' && (state.data.suggestions.length === 0
      ? <p>No workout suggestions yet.</p>
      : <ul className="list-group list-group-flush">{state.data.suggestions.map((workout) => <li className="list-group-item" key={workout.title}>
        <strong>{workout.title}</strong> | {workout.focus} | {workout.minutes} minutes | {workout.difficulty}<p className="mb-0">{workout.reason}</p>
      </li>)}</ul>)}
  </CapabilityCard>;
}
