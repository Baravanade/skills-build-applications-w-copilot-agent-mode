# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

The presentation tier is wired to the API; the logic and data tier decisions below describe the intended behavior.

- Presentation tier: React components use the shared API client for relative `/api` requests and show loading (`role="status"`), empty, success, and error (`role="alert"`) states. Workout suggestions are requested for the seeded user `mona@example.com`, with the email encoded in the URL.
- Logic tier decision: Keep routes thin and preserve the existing response envelopes (`activities`, `activity`, `teams`, `team`, `leaderboard`, and `suggestions`). Put input validation, points calculation, aggregation, and recommendation rules in services; forward errors through the existing Express error handler with deliberate 4xx responses for invalid requests. Do not introduce authentication.
- Data tier decision: Use Mongoose schemas to enforce required user identity/goals, team name/mascot, activity references/type/minutes/points/date, and workout focus/minutes/difficulty. Preserve ObjectId relationships and the default empty team members array. Retain the passing, idempotent seed behavior, including unrelated records and consistent team membership.
- Activity tracking approach: Validate input types, nonempty activity type, positive finite minutes, and well-formed user/team IDs before querying. Verify both referenced records exist before creating anything. Store the submitted references, type, and minutes, calculate one point per minute in the service, and set `occurredAt` on creation. Return `400` for malformed input and `404` for missing referenced records.
- Team management approach: Validate name, mascot, and any supplied member IDs; create teams with the submitted name, mascot, and members, defaulting members to an empty array. Reject missing names with `400` and preserve member IDs in list responses.
- Leaderboard approach: Aggregate persisted activity points by team, resolve team names, sort totals descending, and assign consecutive 1-based ranks. Use team name and then ID as deterministic tie-breakers.
- Workout suggestions approach: Resolve the user by email or return `404`. Inspect that user's activities from the preceding 30 days, prefer workouts matching their fitness goal, and use recent activity focus when no goal-matching workout exists. Map running/cycling to endurance and strength activity to strength; include a truthful `reason` describing the goal or activity used. Return an empty suggestions array when no suitable workout exists rather than an unrelated first workout.

### Smallest safe implementation order

1. Complete model validation and rerun data tests, preserving the passing seed test.
2. Implement team creation, then activity creation and reference validation; rerun the corresponding API tests.
3. Implement leaderboard aggregation, then personalized workout suggestions; rerun the API suite.
4. Wire one frontend capability at a time through the shared client, including all request states; rerun frontend tests.
5. Rerun all three contract suites and both builds. Keep MongoDB, Express, and Vite on ports `27017`, `8000`, and `5173`.

## Test plan

Baseline observed on 2026-11-09 before implementation: **23 failed, 1 passed** across the three contract suites. Run each suite independently so an expected failure does not prevent the next suite from executing.

| Check | Command | Observed result and meaning |
| --- | --- | --- |
| Data contract | `npm run test:data --prefix octofit-tracker/backend` | 4 failed, 1 passed. Required-field validation is missing for users, teams, activities, and workouts. The idempotent seed test passes and must remain passing. |
| API contract | `npm run test:api --prefix octofit-tracker/backend` | 4 failed. Activity and team creation return placeholder `501` responses instead of `400` for invalid input; leaderboard returns an empty array; the first workout suggestion lacks `reason`. The current suggestion service also ignores the requested user. |
| Presentation contract | `npm test --prefix octofit-tracker/frontend` | 15 failed. API data is not rendered, the user-specific workout request is missing, and all four pages lack the required loading, empty, and accessible error states. |
| Backend type check | `npm run build --prefix octofit-tracker/backend` | Not run for this documentation update. Run after implementation; failures indicate TypeScript errors. |
| Frontend type check and production build | `npm run build --prefix octofit-tracker/frontend` | Not run for this documentation update. Run after implementation; failures indicate TypeScript or Vite build errors. |

Tests stop at the first failing assertion within each case. Later API assertions, including malformed IDs, nonexistent references, successful persistence, personalized ordering, and unknown-user responses, are not yet verified by this baseline.

For each implementation step, rerun the affected tests before moving on. Extend focused coverage for the chosen scoring rule, nonpositive/nonfinite minutes, leaderboard ties, the recommendation time window and fallback, and unmatched workouts. Final acceptance requires all contract suites and both builds to pass, with existing seed behavior preserved.
