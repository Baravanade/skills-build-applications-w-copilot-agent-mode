import { CapabilityCard } from './CapabilityCard.js';

type Workout = { title: string; reason: string; focus?: string; minutes?: number; difficulty?: string };

export default function Workouts() {
  return <CapabilityCard<Workout>
    title="Workout suggestions"
    description="Recommend workouts from activity patterns."
    path={`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`}
    collection="suggestions"
    emptyText="No workout suggestions yet."
    renderItem={(workout) => <>{workout.title}: {workout.reason}
      {workout.focus && ` - ${workout.focus}`}
      {workout.minutes != null && `, ${workout.minutes} minutes`}
      {workout.difficulty && `, ${workout.difficulty}`}</>}
  />;
}
