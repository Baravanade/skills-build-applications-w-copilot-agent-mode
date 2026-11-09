import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

type Workout = { title: string; reason: string; focus?: string; minutes?: number; difficulty?: string };
const loadWorkouts = () => getJson<{ suggestions: Workout[] }>(
  `/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`,
).then((response) => response.suggestions);

export default function Workouts() {
  return <CapabilityCard<Workout>
    title="Workout suggestions"
    description="Recommend workouts from activity patterns."
    load={loadWorkouts}
    emptyText="No workout suggestions yet."
    renderItem={(workout) => <>{workout.title}: {workout.reason}
      {workout.focus && ` - ${workout.focus}`}
      {workout.minutes != null && `, ${workout.minutes} minutes`}
      {workout.difficulty && `, ${workout.difficulty}`}</>}
  />;
}
