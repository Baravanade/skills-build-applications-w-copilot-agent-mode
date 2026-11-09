import { afterAll, beforeAll, expect, it } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { Activity, Team, User, Workout } from '../src/models/index.js';

let mongo: MongoMemoryServer;
const app = createApp();

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
}, 60_000);
afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

it('uses the fitness goal without history and prioritizes the activity pattern once available', async () => {
  const team = await Team.create({ name: 'Octocats', mascot: 'Mona' });
  const user = await User.create({
    name: 'Mona',
    email: 'mona@example.com',
    fitnessGoal: 'strength',
    team: team._id,
  });
  await Workout.create([
    { title: 'Intervals', focus: 'endurance', minutes: 30, difficulty: 'moderate' },
    { title: 'Strength Circuit', focus: 'strength', minutes: 30, difficulty: 'moderate' },
  ]);
  const withoutHistory = await request(app).get('/api/workouts/suggestions/mona%40example.com');
  expect(withoutHistory.status).toBe(200);
  expect(withoutHistory.body.suggestions).toHaveLength(1);
  expect(withoutHistory.body.suggestions[0]).toMatchObject({
    title: 'Strength Circuit',
    focus: 'strength',
    reason: expect.stringMatching(/strength.*goal/i),
  });

  await Activity.create({
    user: user._id,
    team: team._id,
    type: 'run',
    minutes: 40,
    points: 40,
    occurredAt: new Date(),
  });
  const withHistory = await request(app).get('/api/workouts/suggestions/mona%40example.com');
  expect(withHistory.status).toBe(200);
  expect(withHistory.body.suggestions).toHaveLength(1);
  expect(withHistory.body.suggestions[0]).toMatchObject({
    title: 'Intervals',
    focus: 'endurance',
    reason: expect.stringMatching(/run.*activity/i),
  });
});
