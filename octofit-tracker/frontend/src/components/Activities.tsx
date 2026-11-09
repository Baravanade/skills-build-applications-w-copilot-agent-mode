import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

type Activity = { type: string; minutes: number; points: number };
const loadActivities = () => getJson<{ activities: Activity[] }>('/api/activities').then((response) => response.activities);

export default function Activities() {
  return <CapabilityCard<Activity>
    title="Activities"
    description="Track student activity minutes and points."
    load={loadActivities}
    emptyText="No activities yet."
    renderItem={(activity) => <>{activity.type}: {activity.minutes} minutes, {activity.points} points</>}
  />;
}
