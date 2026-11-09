import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };
const loadLeaderboard = () => getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard').then((response) => response.leaderboard);

export default function Leaderboard() {
  return <CapabilityCard<LeaderboardEntry>
    title="Leaderboard"
    description="Compare team point totals."
    load={loadLeaderboard}
    emptyText="No leaderboard scores yet."
    renderItem={(entry) => <>Rank {entry.rank}: {entry.teamName} - {entry.totalPoints} points</>}
  />;
}
