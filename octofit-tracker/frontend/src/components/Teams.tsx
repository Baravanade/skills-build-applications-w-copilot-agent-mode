import { CapabilityCard } from './CapabilityCard.js';

type Team = { name: string; mascot?: string; members: string[] };

export default function Teams() {
  return <CapabilityCard<Team>
    title="Teams"
    description="Manage teams and members."
    path="/api/teams"
    collection="teams"
    emptyText="No teams yet."
    renderItem={(team) => <>{team.name}{team.mascot && ` (${team.mascot})`} - Members: {team.members.join(', ') || 'none'}</>}
  />;
}
