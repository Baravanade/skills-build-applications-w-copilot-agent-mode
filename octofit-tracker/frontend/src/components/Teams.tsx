import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

type Team = { name: string; mascot?: string; members: string[] };
const loadTeams = () => getJson<{ teams: Team[] }>('/api/teams').then((response) => response.teams);

export default function Teams() {
  return <CapabilityCard<Team>
    title="Teams"
    description="Manage teams and members."
    load={loadTeams}
    emptyText="No teams yet."
    renderItem={(team) => <>{team.name}{team.mascot && ` (${team.mascot})`} - Members: {team.members.join(', ') || 'none'}</>}
  />;
}
