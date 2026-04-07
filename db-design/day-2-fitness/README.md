# Online Fitness Coaching Platform - ER Diagram

Database design for a fitness influencer's online coaching system. Replaces manual Instagram + calls workflow with proper management of **clients, plans, subscriptions, sessions, progress tracking, and payments**.

## Overview

- **Core Idea**: Trainer creates reusable **Plans**. Client buys a plan → becomes a **Subscription**.  
- **Everything** (sessions, checkins, payments, progress) links to the **Subscription** (central entity).  
- Supports **recurring billing** (weekly/monthly) and multiple active plans per client.

## Assumptions

- One trainer → many plans
- One client → multiple plans over time
- Plans are reusable (not recreated per client)
- One subscription → multiple payments
- Sessions = consultation / live training / calls
- Checkins = weekly client updates + trainer feedback
- Progress data (weight, measurements) stored separately from Client table

## Key Design Decisions

- **Subscription-centric design** instead of Client-centric:  
  Enables multiple plans per client with independent lifecycles, clean date/billing tracking.
- No redundant fields:  
  `trainer_id` and `client_id` are **derived** from Subscription → Plan (avoids duplication).
- Built-in recurring billing support (`billing_cycle`, `next_billing_date`).
- Clean separation of concerns (users, plans, transactions, progress).
- Minimal and simple – easy to extend later.

## Entities

| Entity        | Purpose |
|---------------|---------|
| **Clients**   | Basic client profile |
| **Trainers**  | Coach profile |
| **Plans**     | Reusable training programs (created by trainer) |
| **Subscriptions** | **Central table** – links client + plan, stores start/end date, billing cycle, status |
| **Payments**  | Recurring payments (one subscription → many payments) |
| **Sessions**  | Consultations, live calls, training sessions |
| **Checkins**  | Weekly client updates + trainer feedback |
| **Progress**  | Body measurements & progress data (1:1 with Checkin) |

## Relationships

- Trainer → Plans (**1:N**)
- Client → Subscriptions (**1:N**)
- Plan → Subscriptions (**1:N**)
- Subscription → Payments (**1:N**)
- Subscription → Sessions (**1:N**)
- Subscription → Checkins (**1:N**)
- Checkin → Progress (**1:1**)



## What This Design Handles

- Multiple clients per trainer
- Multiple active plans per client
- Recurring subscriptions & payments
- Session scheduling
- Weekly checkins + feedback
- Long-term progress tracking

Ready for implementation. Simple, scalable, and maintainable.
