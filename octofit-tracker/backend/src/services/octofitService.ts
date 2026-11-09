import { isObjectIdOrHexString, type Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (typeof input !== 'object' || input === null
    || !('userId' in input) || !('teamId' in input)
    || !('type' in input) || !('minutes' in input)) {
    throw Object.assign(new Error('userId, teamId, type, and minutes are required'), { status: 400 });
  }
  const { userId, teamId, type, minutes } = input;
  if (typeof userId !== 'string' || !isObjectIdOrHexString(userId)
    || typeof teamId !== 'string' || !isObjectIdOrHexString(teamId)
    || typeof type !== 'string' || !type.trim()
    || typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw Object.assign(new Error('Provide valid user and team IDs, a nonempty type, and positive minutes'), { status: 400 });
  }
  const [user, team] = await Promise.all([
    User.exists({ _id: userId }),
    Team.exists({ _id: teamId }),
  ]);
  if (!user || !team) {
    throw Object.assign(new Error('User or team not found'), { status: 404 });
  }
  return Activity.create({
    user: userId,
    team: teamId,
    type,
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw Object.assign(new Error('Team data must be an object'), { status: 400 });
  }
  const team = new Team({
    name: 'name' in input ? input.name : undefined,
    mascot: 'mascot' in input ? input.mascot : undefined,
    members: 'members' in input ? input.members : undefined,
  });
  const error = team.validateSync();
  if (error) {
    throw Object.assign(error, { status: 400 });
  }
  return team.save();
}

export async function getLeaderboard() {
  const entries = await Activity.aggregate<{ teamId: Types.ObjectId; teamName: string; totalPoints: number }>([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $lookup: { from: Team.collection.name, localField: '_id', foreignField: '_id', as: 'team' } },
    { $unwind: '$team' },
    { $project: { _id: 0, teamId: '$_id', teamName: '$team.name', totalPoints: 1 } },
    { $sort: { totalPoints: -1, teamName: 1, teamId: 1 } },
  ]);
  return entries.map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }
  const [pattern] = await Activity.aggregate<{ _id: string; totalMinutes: number }>([
    { $match: { user: user._id } },
    { $group: { _id: '$type', totalMinutes: { $sum: '$minutes' } } },
    { $sort: { totalMinutes: -1, _id: 1 } },
    { $limit: 1 },
  ]);
  const activityFocus = new Map([
    ['run', 'endurance'],
    ['cycle', 'endurance'],
    ['walk', 'endurance'],
    ['strength', 'strength'],
  ]);
  const focus = (pattern && activityFocus.get(pattern._id)) || user.fitnessGoal;
  const reason = pattern && activityFocus.has(pattern._id)
    ? `Matches your ${pattern._id} activity pattern (${focus})`
    : `Matches your ${focus} fitness goal`;
  const workouts = await Workout.find({ focus }).sort({ title: 1, _id: 1 }).lean();
  return workouts.map((workout) => ({ ...workout, reason }));
}

export { User };
