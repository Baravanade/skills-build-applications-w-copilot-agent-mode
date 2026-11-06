import { Activity, Team, User, Workout } from '../models/index.js';

function badRequest(message: string) {
  return Object.assign(new Error(message), { status: 400 });
}

function notFound(message: string) {
  return Object.assign(new Error(message), { status: 404 });
}

function asRecord(input: unknown): Record<string, unknown> {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) throw badRequest('Request body must be an object');
  return input as Record<string, unknown>;
}

function objectId(input: unknown, field: string): string {
  if (typeof input !== 'string' || !/^[a-f\d]{24}$/i.test(input)) throw badRequest(`${field} must be a valid ID`);
  return input;
}

const activityFocus: Record<string, string> = {
  run: 'endurance',
  cycle: 'endurance',
  endurance: 'endurance',
  strength: 'strength',
  walk: 'mobility',
  yoga: 'mobility',
};

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  const body = asRecord(input);
  const userId = objectId(body.userId, 'userId');
  const teamId = objectId(body.teamId, 'teamId');
  if (typeof body.type !== 'string' || !body.type.trim()) throw badRequest('type is required');
  if (typeof body.minutes !== 'number' || !Number.isFinite(body.minutes) || body.minutes <= 0) {
    throw badRequest('minutes must be a positive number');
  }

  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user || !team) throw badRequest('userId and teamId must reference existing records');

  return Activity.create({
    user: user._id,
    team: team._id,
    type: body.type.trim(),
    minutes: body.minutes,
    points: body.minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  const body = asRecord(input);
  if (typeof body.name !== 'string' || !body.name.trim()) throw badRequest('name is required');
  if (typeof body.mascot !== 'string' || !body.mascot.trim()) throw badRequest('mascot is required');

  const rawMembers = body.members ?? [];
  if (!Array.isArray(rawMembers)) throw badRequest('members must be an array');
  const members = [...new Set(rawMembers.map((member) => objectId(member, 'members')))];
  const users = members.length ? await User.find({ _id: { $in: members } }).select('_id') : [];
  if (users.length !== members.length) throw badRequest('members must reference existing users');

  const team = await Team.create({ name: body.name.trim(), mascot: body.mascot.trim(), members });
  if (members.length) {
    await Team.updateMany(
      { _id: { $ne: team._id }, members: { $in: members } },
      { $pull: { members: { $in: members } } },
    );
    await User.updateMany({ _id: { $in: members } }, { $set: { team: team._id } });
  }
  return team;
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().lean(),
    Activity.aggregate<{ _id: unknown; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const pointsByTeam = new Map(totals.map(({ _id, totalPoints }) => [String(_id), totalPoints]));
  return teams
    .map((team) => ({ teamName: team.name, totalPoints: pointsByTeam.get(String(team._id)) ?? 0 }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.toLowerCase() }).lean();
  if (!user) throw notFound('No user found for this email');

  const [activities, workouts] = await Promise.all([
    Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(10).lean(),
    Workout.find().lean(),
  ]);
  const goal = user.fitnessGoal?.trim().toLowerCase();
  const recentActivity = activities.find((activity) => activityFocus[activity.type.toLowerCase()]);
  const recentFocus = recentActivity ? activityFocus[recentActivity.type.toLowerCase()] : undefined;
  const preferredFocus = workouts.some((workout) => workout.focus.toLowerCase() === goal)
    ? goal
    : recentFocus;

  return workouts
    .map((workout) => {
      const focus = workout.focus.toLowerCase();
      const reason = focus === goal
        ? `Matches your ${goal} fitness goal.`
        : focus === recentFocus && recentActivity
          ? `Builds on your recent ${recentActivity.type} activity.`
          : 'A suggested workout to support your training.';
      return { ...workout, reason, preferred: focus === preferredFocus };
    })
    .sort((left, right) => Number(right.preferred) - Number(left.preferred))
    .map(({ preferred: _preferred, ...workout }) => workout);
}

export { User };
