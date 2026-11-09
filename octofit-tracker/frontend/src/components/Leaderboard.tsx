import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  return <CapabilityCard<LeaderboardEntry>
    title="Leaderboard"
    description="Compare team point totals."
    path="/api/leaderboard"
    collection="leaderboard"
    emptyText="No leaderboard scores yet."
    renderItem={(entry) => <>Rank {entry.rank}: {entry.teamName} - {entry.totalPoints} points</>}
  />;
}
