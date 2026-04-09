# Comic-Con India — Multi-Zone Event Parking System

## What is this?

This is the db design for a multi-zone parking system for a large event venue (Comic-Con India). the system needs to handle vehicles entering and exiting across multiple days, assigning them spots based on their type and availability, issuing tickets, and recording payments.

---

## My Thought Process

### How i approached this

first thing i did was read the problem and listed out what are the "things" in this system. not tables, just things:

- there are **vehicles** (different types — bike, car, SUV, cab, EV)
- there are **parking spots** (some general, some reserved — VIP, exhibitor, cosplayer, staff, EV charging)
- those spots sit inside **zones** (Zone A, Zone B, VIP Zone etc) on different levels
- when a vehicle enters a **ticket** is issued
- the full entry-to-exit journey is a **session**
- at the end a **payment** is made

once i had those things i asked myself — what are the "lookup/category" things vs the "live data" things. category stuff like vehicle type and spot type don't change much, and they're basically reference data. the live stuff is sessions, tickets, payments, also instead of using enums i just used strings and commented 
the enums, so i'm treating those as enums 
---

## Color Groups and Why

I group entities by color to make the diagram readable in one glance. here's my logic:

| Color | Group | Why |
|-------|-------|-----|
| 🔴 Red | Category / Reference tables | these are lookup tables. vehicle_category, spot_category. they don't participate in the main flow, they just describe other entities |
| 🔵 Blue | Core Vehicle entity | vehicle is kind of the root of everything. it comes in, parks, pays. i wanted it to stand out separately |
| 🟢 Green | Parking Infrastructure | zone and spot are the physical layer — the actual "place". grouped together because they're static setup data |
| 🟠 Orange | Session & Ticket Flow | this is the **main flow** — the operational data that runs every time a vehicle parks. i kept orange because it's the busiest color visually, and this is the busiest layer in the system |
| 🟣 Purple | Payment | payment is the outcome of a session. it's separate from the flow but deeply connected to it. purple feels "financial" lol |

---

## The Central Table — `parking_session`

this is the most important decision i made.

`parking_session` is the **central table** of this design. it holds:

- `vehicle_id` — who parked
- `parking_spot_id` — where they parked
- `ticket_id` — what ticket was issued for this visit
- `entry_time` and `exit_time` — the full session lifecycle
- `fee_calculated` — what they owe
- `session_date` — helps filter by event day

basically every important business question goes through `parking_session`. you want to know what vehicle is in a spot right now? query session where `exit_time` is null. want to know how many times vehicle X visited? count sessions by `vehicle_id`. want to check payment for a visit? join session with payment.

### Why i made it the bottleneck

i know centralizing like this creates a bottleneck — if `parking_session` table has issues, everything suffers. but i made this call because:

1. **it's the most critical table from a business perspective** — nothing else matters if you can't track a session
2. the alternative would be spreading the connections across multiple tables.

---

## Ticket vs Session — Why are they separate?

a lot of people would just put ticket info inside the session. i didn't do that, and here's why:

**Ticket** = point in time document. it's issued the moment the vehicle enters. it has a ticket number (human readable like `TKT-20240502-034`) and an `issued_at` timestamp. it's basically the "entry receipt".

**Session** = the full duration record. it starts at entry and ends at exit. it's what the billing is calculated on.

they're separate because in real life, a ticket is a physical/digital thing you hand to the customer when they enter. the session is the system tracking their stay. they're not the same thing even though they're deeply related.

---

## Availability Tracking — No Separate Table

i didn't create a separate `spot_availability` table. the reason is simple:

a spot is **occupied** when there's an active session for it (i.e., `exit_time` is null in `parking_session`).  
a spot is **free** when either no session exists for it, or the latest session has `exit_time` filled.

so availability is **derived from session data**. creating a separate availability table would mean two sources of truth and you'd have to keep them in sync — which is a maintenance nightmare. one query does the job.

---

## Payment → Session (not Ticket)

payment references `parking_session` directly, not `parking_ticket`. because:

- billing is based on **duration** (exit_time - entry_time), which lives in session
- the ticket doesn't know when the vehicle left
- it's natural: you pay after your session ends, not when you get the ticket

---

## Answers to All the Questions

**What vehicles entered the parking facility?**  
query `parking_session` join `vehicle` — every session has a vehicle_id.

**What type of vehicle entered?**  
`vehicle` table has `vehicle_category_id` which joins to `vehicle_category` (Bike, Car, SUV, Cab, EV).

**Which parking spot was assigned?**  
`parking_session.parking_spot_id` → `parking_spot.spot_number`

**Which zone or level does that parking spot belong to?**  
`parking_spot.parking_zone_id` → `parking_zone` (has name and level fields)

**Was the parking spot reserved for exhibitors, VIP guests, staff, or EV charging?**  
`parking_spot.spot_category_id` → `spot_category` (General, VIP, Exhibitor, Cosplayer, Staff, EV_Charging)

**When did the vehicle enter the facility?**  
`parking_session.entry_time`

**When did the vehicle exit the facility?**  
`parking_session.exit_time`

**What ticket was issued for the parking session?**  
`parking_session.ticket_id` → `parking_ticket.ticket_number`

**Can one vehicle visit the venue multiple times across different days?**  
yes. one vehicle can have multiple rows in `parking_session`. each row is a separate visit. `session_date` helps filter by day.

**Can one parking spot be reused across multiple parking sessions?**  
yes. `parking_spot_id` in `parking_session` can appear in multiple rows (different sessions at different times). the spot is reused once a session ends.

**How is parking availability tracked?**  
derived from `parking_session`. spot is occupied if a session with that `parking_spot_id` has `exit_time = null`. spot is free otherwise.

**How are parking charges calculated?**  
`parking_session.fee_calculated` stores the calculated amount. you'd compute it as (exit_time - entry_time) × rate, where rate depends on vehicle category or spot category. the field stores the result.

**How is payment recorded for each parking session?**  
`payment` table has `parking_session_id`, `amount`, `payment_method`, `payment_status`, and `paid_at`.

**Can special access categories (cosplayers, exhibitors, VIP, staff) be represented?**  
yes. `spot_category` table has these as entries. a `parking_spot` can be tagged with any of these categories. only matching vehicles / users would get assigned those spots (that's application logic, not db constraint).

**Can the system track which vehicles are currently parked inside the venue?**  
yes. query `parking_session` where `exit_time IS NULL`. join with `vehicle` to get details. these are all vehicles currently inside.

---

## What i deliberately did NOT add

- no separate availability table — redundant, session data handles it
- no rate table in the db — rate calculation is application logic, db just stores the result in `fee_calculated`
- no junction table between vehicle_category and spot_category — the assignment happens at session level, not as a pre-defined mapping. it's business logic.

---

## Final Entity List

| Entity | Role |
|--------|------|
| `vehicle_category` | lookup: Bike, Car, SUV, Cab, EV |
| `spot_category` | lookup: General, VIP, Exhibitor, Cosplayer, Staff, EV_Charging |
| `vehicle` | who is parking |
| `parking_zone` | physical zone + level in the venue |
| `parking_spot` | individual spot, belongs to a zone, has a category |
| `parking_ticket` | issued at entry, human-readable ticket number |
| `parking_session` | **central table** — full visit lifecycle |
| `payment` | payment record tied to a session |
