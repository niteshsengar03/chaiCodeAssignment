# LiftGrid Systems — Smart Elevator Control Platform

## What is this?

This is the db design for LiftGrid Systems, a multi-building elevator management platform. The system needs to handle real-time ride requests from floors, assign the right elevator to each request, track elevator status, log every ride for analytics, and maintain a clean maintenance history — all without mixing live operational data with historical records.

---

## My Thought Process

### How i approached this

first thing i did was stop thinking of elevators as "things that go up and down" and start thinking about what data actually needs to live where. there are two very different types of data here:

- **static setup data** — buildings, floors, shafts, elevator config. changes rarely, read often.
- **live operational data** — requests, assignments, elevator current position. changes constantly, needs to be fast.
- **historical data** — ride logs, maintenance records. append-only, used for analytics later.

once i split the problem like that, the table boundaries became obvious. the mistake would be to dump everything into the elevator entity — like stuffing `last_ride_at`, `total_rides_today`, `current_request_id` all inside the elevator table. that would make the table a mess and create write conflicts under load.

i also noticed the M:M problem early — one elevator serves multiple floors, one floor can be served by multiple elevators. that junction table (`elevator_floor_assignments`) is not optional here, it's the core of how the dispatch system knows which elevator *can* respond to a floor request.

---

## Color Groups and Why

i group entities by color to make the diagram readable in one glance. here's my logic:

| Color | Group | Why |
|-------|-------|-----|
| 🔴 Red | Reference / Lookup Tables | `elevator_statuses` and `request_statuses` are pure lookup data. keeping them as tables instead of enums means the ops team can add new states without touching the schema. |
| 🔵 Blue | Core Infrastructure | buildings, floors, shafts, elevators — the physical layer. these are setup once and read constantly. they are what the whole platform is built on top of. |
| 🟢 Green | Servicing Layer | `elevator_floor_assignments` is the M:M junction table. it answers "which elevator can serve this floor?" and is the heart of the dispatch logic. |
| 🟠 Orange | Operational Flow | `floor_requests` and `ride_assignments` — this is where real-time action happens. every button press and every dispatch decision lives here. |
| 🟣 Purple | Analytics & Maintenance | `ride_logs` and `maintenance_records` — these are append-only history tables. they never get updated, only written to. they answer "what happened?" |

---

## The Central Table — `ride_assignments`

this is the most important decision i made in this design.

`ride_assignments` is the **central operational table**. it holds:

- `request_id` — which floor request triggered this
- `elevator_id` — which elevator was dispatched
- `destination_floor` — where the user wants to go (entered inside the cabin after boarding)
- `assigned_at` — when the system made the decision
- `pickup_at` — when the elevator actually reached the user's floor
- `dropoff_at` — when the user was dropped off

every important operational question goes through this table. which elevator handled most rides today? count assignments grouped by `elevator_id`. what's the average response time? calculate `pickup_at - assigned_at` across assignments. which requests are pending? look at `floor_requests.status_id = Pending` where no assignment exists yet.

---

## Why Elevator Has `current_floor` and `status_id` Directly

this is a deliberate tradeoff. the elevator entity has two "dynamic" fields: `current_floor` and `status_id`. some people would argue these should be in a separate "elevator state" table to keep the elevator entity "pure config."

i didn't do that. here's why:

- the control system reads and updates these values on **every floor movement** and **every status change**. putting them in a separate table would require a join on every real-time status check.
- `current_floor` is not historical — it's just "where is this elevator right now." history is in `ride_logs`.
- `status_id` being a FK to a lookup table (`elevator_statuses`) is clean enough — you just join once if you need the label.

for a real-time control platform, every join adds latency. keeping position and status on the main entity is the right call here.

---

## `elevator_shafts` — Is It Optional?

the problem says shafts are optional but recommended. i included them because:

1. **one shaft, one elevator** is explicitly stated in the problem. if you don't model the shaft, you lose the physical constraint. two elevators could theoretically reference the same shaft without a db-level concept for it.
2. shafts have a `shaft_label` — operators refer to things like "Shaft-West" or "Shaft-3" at the building level. that's physical infrastructure naming which belongs in the schema.
3. in real high-rise systems, a shaft failure (not an elevator failure) can take the entire shaft offline. modeling it separately allows you to flag a shaft as decommissioned independently of the elevator.

---

## `ride_logs` vs `ride_assignments` — Why Both?

`ride_assignments` = what the **system decided** (dispatch decision, timestamps of the assignment cycle)

`ride_logs` = what **actually happened** (the physical ride — when it started, ended, how many floors were covered)

an assignment can be cancelled after being made. if a partial ride happened before cancellation, it still needs to be logged for safety and billing. keeping them as separate records means you never lose data just because a status changed.

`ride_logs` also has denormalized `elevator_id` and `building_id` FKs — this is intentional. analytics queries like "how many rides did Building 3 have this week?" should not require chaining through assignment → request → floor → building. the denormalized FKs let you query ride_logs directly for reporting without sacrificing schema correctness.

---

## Maintenance — Clean History, No Overwriting

`maintenance_records` is append-only. every time maintenance happens, a new row is inserted. the elevator entity itself only gets its `status_id` updated to "Under_Maintenance" during downtime.

this means:
- you never lose maintenance history
- you can query "how long was Elevator 5 offline last quarter?" by summing `ended_at - started_at` across resolved records
- an ongoing maintenance has `ended_at = null` and `is_resolved = false`

mixing maintenance history inside the elevator table would mean either overwriting previous records or having weird columns like `last_maintenance_date` which can't store full history.

---

## Answers to All the Questions

**How many buildings are connected to the platform?**
`SELECT COUNT(*) FROM buildings` — simple.

**How many elevators exist inside a building?**
`SELECT COUNT(*) FROM elevators WHERE building_id = ?`

**Which floors belong to which building?**
`floors.building_id` → `buildings.id`

**Which elevator serves which floors?**
`elevator_floor_assignments` — join elevator + floor through this junction table.

**What requests were generated from which floors?**
`floor_requests.floor_id` → `floors.id` + `floors.building_id` for context.

**Which elevator handled a request?**
`ride_assignments.elevator_id` — the assignment table connects request to elevator.

**Can multiple elevators serve the same floor?**
yes. `elevator_floor_assignments` allows multiple rows with the same `floor_id` pointing to different `elevator_id`s.

**Can one elevator serve multiple floors?**
yes. same table, multiple rows with same `elevator_id` pointing to different `floor_id`s.

**What is the status of each elevator?**
`elevators.status_id` → `elevator_statuses.label` (Idle, Moving, Under_Maintenance, Out_of_Service)

**How many rides did an elevator complete today?**
`SELECT COUNT(*) FROM ride_logs WHERE elevator_id = ? AND DATE(ended_at) = TODAY`

**Which elevator handled the most requests?**
`SELECT elevator_id, COUNT(*) FROM ride_assignments GROUP BY elevator_id ORDER BY COUNT(*) DESC`

**Which requests are still pending?**
`SELECT * FROM floor_requests WHERE status_id = [Pending id]` — no join needed.

**Can an elevator be temporarily disabled for maintenance?**
yes. update `elevators.status_id` to "Under_Maintenance". insert a row in `maintenance_records` with `started_at` set and `is_resolved = false`.

**Can maintenance history be tracked per elevator?**
yes. `maintenance_records.elevator_id` stores full history per elevator. multiple records per elevator, append-only.

**Can ride logs be recorded for analytics later?**
yes. `ride_logs` is the analytics table. it stores full trip data including floors covered, timestamps, and denormalized building/elevator IDs for fast reporting.

---

## What i deliberately did NOT add

- no `total_rides_today` counter on elevator — that's a derived stat, not stored data. compute it from ride_logs.
- no `last_maintenance_date` on elevator — that's queryable from maintenance_records. storing it separately creates two sources of truth.
- no "user" or "passenger" entity — the problem doesn't require individual user tracking. requests come from floors, not registered users.
- no pricing or billing table — not in scope for this infrastructure monitoring system.

---

## Final Entity List

| Entity | Role |
|--------|------|
| `elevator_statuses` | lookup: Idle, Moving_Up, Moving_Down, Under_Maintenance, Out_of_Service |
| `request_statuses` | lookup: Pending, Assigned, Completed, Cancelled |
| `buildings` | the physical building connected to the platform |
| `floors` | each floor in a building — has floor number and human label |
| `elevator_shafts` | physical shaft inside a building — one shaft, one elevator |
| `elevators` | the elevator unit — config, capacity, current position, status |
| `elevator_floor_assignments` | M:M junction — which elevator can serve which floor |
| `floor_requests` | a user presses the call button on a floor — entry point of the flow |
| `ride_assignments` | **central table** — which elevator was dispatched for which request |
| `ride_logs` | append-only trip history for analytics and reporting |
| `maintenance_records` | full maintenance history per elevator — never overwritten |
