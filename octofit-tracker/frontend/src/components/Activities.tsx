import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Activity = { type: string; minutes: number; points: number; occurredAt: string };
type ActivitiesResponse = { activities: Activity[] };
type State = { status: 'loading' } | { status: 'error' } | { status: 'success'; data: ActivitiesResponse };

export default function Activities() {
  const [state, setState] = useState<State>({ status: 'loading' });
  useEffect(() => {
    let active = true;
    getJson<ActivitiesResponse>('/api/activities')
      .then((data) => { if (active) setState({ status: 'success', data }); })
      .catch(() => { if (active) setState({ status: 'error' }); });
    return () => { active = false; };
  }, []);

  return <CapabilityCard title="Activities" description="Track student activity minutes and points.">
    {state.status === 'loading' && <p role="status">Loading activities...</p>}
    {state.status === 'error' && <p role="alert">Unable to load activities. Try again later.</p>}
    {state.status === 'success' && (state.data.activities.length === 0
      ? <p>No activities yet.</p>
      : <ul className="list-group list-group-flush">{state.data.activities.map((activity, index) => <li className="list-group-item" key={`${activity.type}-${activity.occurredAt}-${index}`}>
        <strong>{activity.type}</strong> | {activity.minutes} minutes | {activity.points} points
      </li>)}</ul>)}
  </CapabilityCard>;
}
