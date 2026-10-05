# Real-World Exploration Game — Product Requirements Document

**Document:** PRD  
**Version:** 1.0  
**Status:** MVP Definition  
**Date:** 2026-10-05

---

## 1. Product Overview

### Working Concept

A real-world exploration game where the world map starts unexplored/locked.

Players physically travel through the real world to reveal and unlock areas. They can discover places, collect achievements, complete exploration challenges, and optionally recommend genuinely worthwhile places to other players.

### Core Idea

> **Don't just visit places. Complete the map.**

The product combines:

- Real-world maps
- GPS-based exploration
- Fog-of-war / map unlocking
- Game progression
- Location discovery
- Community recommendations
- Collections and achievements

This should feel like a **game built around the real world**, not a traditional travel app with a few gamification features.

---

# 2. Problem

Existing map and travel products are primarily designed to answer:

> "Where should I go?"

This product should answer:

> "What parts of the world have I explored, what can I discover next, and what genuinely interesting places are worth checking out?"

People often visit famous destinations but miss:

- Hidden viewpoints
- Small historical places
- Parks
- Local experiences
- Interesting streets
- Natural locations
- Cultural spots
- Underrated attractions
- Places recommended by people who actually visited them

The product turns exploration itself into a game.

---

# 3. Product Vision

Create a persistent digital representation of the real world where exploration has progression.

The player should feel:

> "There is still more of the world for me to unlock."

The long-term goal is to make exploration addictive in a healthy, game-like way without requiring players to constantly post content.

---

# 4. Target Users

## 4.1 Explorers

People who enjoy discovering new places around their city.

## 4.2 Tourists

People visiting a new city/country who want a more interactive way to explore.

## 4.3 Gamers

People who enjoy:

- Progression
- Collections
- Achievements
- Maps
- Completion percentages
- Leaderboards

## 4.4 Local Discoverers

People who want to find interesting places that are not necessarily mainstream tourist attractions.

---

# 5. Core Product Principles

### Principle 1 — Exploration First

The product should prioritize physically exploring the real world.

### Principle 2 — Visit ≠ Recommendation

Visiting a place does not automatically make it a recommendation.

A player can explore hundreds of places without recommending any.

### Principle 3 — Quality Over Quantity

The platform should avoid becoming a database where every shop, house, road, or random location becomes a post.

### Principle 4 — Game First

The primary experience should feel like:

**Explore → Unlock → Discover → Collect → Progress**

not:

**Search → Read reviews → Book**

### Principle 5 — Real-World Proof

Important exploration actions should be tied to physical presence using GPS and other signals.

---

# 6. Core Gameplay Loop

```text
Open Map
   ↓
See unexplored / locked world
   ↓
Choose an area or objective
   ↓
Physically travel there
   ↓
Enter location / area
   ↓
Map unlocks
   ↓
Receive XP / discovery
   ↓
Optionally discover a place
   ↓
Optionally recommend it
   ↓
Earn achievements / collections
   ↓
Explore another area
```

---

# 7. Map Experience

## 7.1 Global Map

The application opens with a world map.

Initially, most areas should appear unexplored.

The exact visual treatment can be:

- Fog
- Darkened regions
- Desaturated map
- Game-style unexplored overlay

The user should immediately understand:

> "I haven't explored this."

## 7.2 Unlocking

A geographic area becomes visible/unlocked after the player physically enters it.

For MVP, use a practical geographic grid/geofence system rather than attempting to unlock every individual road.

Possible implementation:

- H3 hexagonal cells
- Geohash/grid cells
- Custom geographic polygons

H3 is preferred for the initial implementation because it provides consistent geographic cells and is suitable for calculating exploration coverage.

## 7.3 Exploration Percentage

Users should see statistics such as:

```text
Lucknow
Explored: 18%

India
Explored: 2%

World
Explored: 0.02%
```

The percentage should be based on the defined geographic exploration model.

---

# 8. Location Verification

The system must verify that a player actually visited an area.

## MVP Verification

Use:

- GPS coordinates
- Accuracy radius
- Timestamp
- Minimum dwell/interaction requirements where appropriate

Example:

A player enters a 50–100m radius around a discovery point.

The system verifies:

```text
User location
+
GPS accuracy
+
Geofence
+
Timestamp
```

and marks the location as visited.

## Anti-Cheat

The system should detect obvious manipulation where practical.

Potential signals:

- Impossible travel speed
- Sudden geographic jumps
- Repeated suspicious GPS patterns
- Mock-location signals when available
- Unrealistic movement sequences
- Duplicate/suspicious submissions

Do not attempt to build a perfect anti-cheat system for MVP.

---

# 9. Discoveries

A **Discovery** is a meaningful place or point of interest that players can encounter.

Examples:

- Viewpoint
- Historical monument
- Park
- Lake
- Trail
- Museum
- Street-art location
- Cultural location
- Hidden local spot
- Scenic location
- Interesting public space

A discovery should not simply mean every business on a map.

---

# 10. Recommendations

Players can optionally recommend a discovered place.

Important distinction:

```text
Visited
    ≠
Recommended
```

A player should explicitly choose:

> "Worth Visiting"

or equivalent.

## Recommendation Data

A recommendation can contain:

- Place name
- Category
- Short description
- Photos
- GPS location
- Recommended by count
- Visit count
- Community rating
- Optional tags

Example:

```text
Hidden Viewpoint

Explored by 1,240 players

87 players recommended it

92% said:
"Worth visiting"
```

---

# 11. Hidden Gems

A major future differentiator should be **Hidden Gems**.

A Hidden Gem is a place that:

- Has relatively low awareness
- Has been physically visited
- Receives strong community recommendations

The system can calculate a Hidden Gem score using:

- Number of visitors
- Recommendation ratio
- Recent activity
- Community quality signals

Avoid simply labeling places "hidden" based on arbitrary assumptions.

---

# 12. Photo System

Players may take/upload photos associated with discoveries.

Photos can provide:

- Proof of visit
- Personal memories
- Visual discovery content
- Community content

However, photos should not be mandatory for every exploration action.

## MVP

Allow:

- Camera capture
- Gallery upload
- Photo attached to discovery
- Basic moderation/reporting

Future:

- Computer vision verification
- Duplicate detection
- Landmark recognition
- Automatic categorization

---

# 13. Game Progression

Players should have a persistent profile.

Example:

```text
HARSH
Level 17 Explorer

Cities explored: 6
Places discovered: 143
Hidden gems: 12
World explored: 0.04%

XP: 8,420
```

## XP Sources

Example:

| Action | XP |
|---|---:|
| Unlock area | 10 |
| Discover POI | 25 |
| Complete challenge | 50 |
| Recommend quality place | 20 |
| City completion milestone | 200 |
| Region completion milestone | 500 |

Exact values should be configurable by the backend.

---

# 14. Achievements

Examples:

### First Steps
Unlock your first area.

### Explorer
Explore 10 different areas.

### City Walker
Explore 25% of a city.

### Local
Explore 50% of your city.

### Hidden Gem Hunter
Discover 10 highly-rated lesser-known places.

### Completionist
Reach 100% exploration for a defined city/region.

Achievements should encourage exploration rather than spam.

---

# 15. Challenges

Challenges give players short-term goals.

Examples:

```text
Explore 5 new areas this week.

Discover 3 parks.

Visit 2 historical locations.

Find a Hidden Gem.

Complete 10% of Lucknow.
```

Challenges can be:

- Daily
- Weekly
- City-specific
- Seasonal
- Event-based

Challenges are not required for the first MVP if they significantly increase development complexity.

---

# 16. Social Features

## MVP

Minimal social functionality:

- Public profile
- Exploration stats
- Achievements
- Recommended places

## Future

- Friends
- Follow users
- Friend activity
- Leaderboards
- Group exploration
- Shared challenges
- Team competitions

Avoid building a full social network in MVP.

---

# 17. Discovery Feed

A future discovery feed can show:

```text
Hidden near you

3 people recently recommended...

Popular discoveries

Your friends explored...

New discoveries in Lucknow
```

The feed should prioritize useful exploration information rather than generic social posting.

---

# 18. User Profile

Profile should show:

- Username
- Avatar
- Level
- XP
- Cities explored
- Countries explored
- Exploration percentage
- Discoveries
- Recommendations
- Achievements
- Badges

Optional privacy controls:

- Public
- Friends only
- Private

---

# 19. Privacy & Safety

The application deals with real-world location, so privacy is critical.

## Requirements

- Never expose a user's live location publicly by default.
- Do not expose exact home/work locations through exploration history.
- Avoid displaying precise personal movement trails publicly.
- Allow users to control profile visibility.
- Location data should be minimized and protected.
- Photos should not automatically expose unnecessary metadata.
- Users should be able to report unsafe or inappropriate places/content.

## Important Product Rule

The product should encourage exploration without encouraging people to enter:

- Private property
- Dangerous areas
- Restricted areas
- Active construction zones
- Unsafe locations

The system should support marking/reporting unsafe locations.

---

# 20. Content Moderation

Community recommendations require moderation.

Users should be able to:

- Report place
- Report photo
- Report recommendation
- Flag inaccurate information
- Flag private/restricted locations
- Flag inappropriate content

Admin should be able to:

- Remove content
- Disable discovery
- Review reports
- Ban users
- Correct location information
- Merge duplicate discoveries

---

# 21. What Should NOT Be in MVP

Do not overbuild.

Exclude initially:

- Full social network
- Messaging
- Complex AI recommendations
- AR
- Real-time multiplayer
- Commerce
- Booking
- Ads
- Loyalty programs
- Business dashboards
- Advanced computer vision
- Complex travel planning
- Cryptocurrency/NFT systems

The MVP should prove one thing:

> **Will people enjoy physically exploring the world to unlock and complete a map?**

---

# 22. MVP Scope

## Must Have

### Authentication

- Sign up/login
- Basic profile

### Map

- Real-world map
- Unexplored/locked areas
- Explored/unlocked areas
- Current location
- Exploration percentage

### Exploration

- GPS verification
- Area unlocking
- Visit history
- XP

### Discoveries

- Place discovery
- Discovery details
- Categories
- Photos

### Recommendations

- "Worth visiting" action
- Recommendation count
- Basic community score

### Gamification

- XP
- Level
- Basic achievements
- Exploration statistics

### Safety

- Report content
- Basic moderation

---

# 23. MVP User Journey

## First Launch

User sees:

```text
WELCOME, EXPLORER

The world is yours to discover.

Start exploring.
```

Then:

1. Ask for location permission.
2. Show map.
3. Show user's current area.
4. Show unexplored/fogged map.
5. Explain unlocking.
6. Give first exploration objective.
7. User physically moves.
8. Area unlocks.
9. XP animation appears.
10. User sees progress.

---

# 24. First-Time Experience

The first 60 seconds are critical.

The user should understand:

### 1. There is a world map.

### 2. It is unexplored.

### 3. They unlock it by physically going there.

### 4. They can discover interesting places.

### 5. They can become a better explorer.

Avoid lengthy onboarding.

---

# 25. UI / UX Design Direction

The application should NOT look like:

- Google Maps clone
- TripAdvisor clone
- Generic social media app
- Corporate dashboard

It should feel like a **modern exploration game**.

## Visual Language

Recommended:

- Dark/immersive map
- Strong fog-of-war effect
- Clean modern typography
- Large map surface
- Game-like progression indicators
- Subtle animations
- Discovery cards
- XP feedback
- Achievement animations
- Minimal UI clutter

## Design Feeling

The user should feel:

> "I'm uncovering the real world."

Not:

> "I'm filling out a travel form."

---

# 26. Map UX

The map should be the primary screen.

Possible layout:

```text
┌────────────────────────────────────┐
│ Level 12       4,820 XP      Profile│
│                                    │
│          REAL WORLD MAP            │
│                                    │
│       ░░░░░ UNEXPLORED ░░░░        │
│                                    │
│             ● YOU                  │
│                                    │
│       ★ Discovery                  │
│                                    │
│                                    │
├────────────────────────────────────┤
│ Explored       Discoveries         │
│ 12.4%           37                  │
│                                    │
│        [ Explore Nearby ]          │
└────────────────────────────────────┘
```

This is only a conceptual layout. The coding agent should iterate visually rather than blindly copying it.

---

# 27. Technical Architecture

## Recommended MVP Stack

### Frontend

**React Native / Expo**

Reason:

- Android + iOS
- Fast MVP development
- Strong map ecosystem
- Easier future mobile deployment

Alternative:

Flutter.

### Backend

**FastAPI**

Reason:

- Python ecosystem
- Easy API development
- Good fit for geospatial/game logic

### Database

**PostgreSQL + PostGIS**

Required for:

- Geographic queries
- Geofencing
- Distance calculations
- Spatial indexing

### Map

Possible options:

- MapLibre
- OpenStreetMap data
- MapTiler or another map tile provider

The implementation should prioritize a low/no-cost MVP.

### Storage

Object storage for:

- Photos
- Avatars

### Authentication

Use a simple managed authentication provider where the free tier is sufficient.

---

# 28. Core Backend Entities

Suggested schema:

## User

```text
id
username
email
avatar_url
xp
level
created_at
privacy_settings
```

## ExplorationCell

```text
id
h3_index
resolution
geometry
```

## UserExploration

```text
id
user_id
cell_id
first_explored_at
verification_method
```

## Discovery

```text
id
name
description
category
latitude
longitude
created_by
status
created_at
```

## Visit

```text
id
user_id
discovery_id
visited_at
latitude
longitude
verification_status
```

## Recommendation

```text
id
user_id
discovery_id
created_at
status
```

## Photo

```text
id
user_id
discovery_id
url
created_at
moderation_status
```

## Achievement

```text
id
name
description
criteria
```

## UserAchievement

```text
id
user_id
achievement_id
earned_at
```

---

# 29. API Requirements

Example endpoints:

```text
POST /auth/register
POST /auth/login

GET /me
GET /me/stats
GET /me/achievements

GET /map/explored
GET /map/nearby

POST /exploration/verify
POST /exploration/unlock

GET /discoveries/nearby
GET /discoveries/{id}

POST /discoveries
POST /discoveries/{id}/visit
POST /discoveries/{id}/recommend
POST /discoveries/{id}/photos

POST /reports

GET /challenges
GET /leaderboards
```

Exact API design can be adjusted during implementation.

---

# 30. Exploration Algorithm

For MVP:

1. Obtain GPS coordinates.
2. Validate GPS accuracy.
3. Convert coordinates to H3 cell.
4. Check whether the cell has already been explored.
5. If not:
   - Validate movement/location.
   - Mark cell explored.
   - Award XP.
   - Trigger achievement checks.
6. Return updated map state.

Example:

```text
GPS
 ↓
Validate
 ↓
lat/lng
 ↓
H3 Cell
 ↓
Already explored?
 ├── Yes → no new XP
 └── No
      ↓
  Verify visit
      ↓
  Unlock cell
      ↓
  Award XP
      ↓
  Update progress
```

---

# 31. Discovery Creation Rules

A player should not be able to create unlimited low-quality places.

Possible MVP rules:

- Require physical presence.
- Require a valid location.
- Require name/category.
- Optional photo.
- Rate limit submissions.
- Allow community reports.
- Admin moderation.

Future system:

- Reputation-based submission rights
- Duplicate detection
- Community verification
- AI-assisted categorization

---

# 32. Recommendation Quality

A simple recommendation model for MVP:

```text
Recommendation Score =
recommendations / unique verified visitors
```

Example:

```text
100 verified visitors
70 recommendations

Score = 70%
```

Do not treat this as a definitive rating.

Later improvements can account for:

- User reputation
- Review quality
- Recency
- Repeat visits
- Spam detection

---

# 33. Gamification Rules

Gamification must reward meaningful actions.

Avoid rewarding:

- Repeated GPS triggering
- Spam recommendations
- Hundreds of low-quality submissions
- Artificial movement

Prefer rewarding:

- New areas
- New cities
- Meaningful discoveries
- Challenges
- High-quality recommendations
- Exploration milestones

---

# 34. Admin Dashboard

MVP admin dashboard should support:

- User list
- Discovery list
- Report queue
- Photo moderation
- Recommendation moderation
- Delete/disable discovery
- Ban/suspend user
- Basic analytics

---

# 35. Analytics

Track:

### Activation

- Users who unlock first area
- Time to first unlock
- First discovery

### Engagement

- Areas explored/user
- Discoveries/user
- Sessions/week
- Weekly active explorers

### Retention

- D1
- D7
- D30

### Game Performance

- Average exploration %
- Average XP
- Achievement completion
- Challenge participation

### Discovery Quality

- Visits/discovery
- Recommendation ratio
- Reports/discovery

---

# 36. North Star Metric

A strong initial North Star Metric:

> **Verified Exploration Actions per Active User**

This measures whether people are actually going out and exploring rather than merely opening the application.

Secondary metric:

> **Meaningful Discoveries per Active User**

---

# 37. Monetization — Future

Do NOT optimize for monetization in MVP.

Possible future models:

### Local Partnerships

Businesses/attractions could sponsor legitimate challenges.

### Premium Exploration Packs

Example:

```text
Lucknow Hidden Gems
₹99
```

### Tourism Partnerships

Cities/tourism organizations could create official exploration campaigns.

### Premium Game Features

Possible future features:

- Advanced statistics
- Special challenges
- Custom exploration maps

The core exploration experience should remain useful without payment.

---

# 38. Business Differentiation

The product should avoid competing directly with Google Maps on:

- Navigation
- Reviews
- Business listings
- Directions

Instead, own the category:

> **Gamified real-world exploration**

Google Maps answers:

> "Where is it?"

This product answers:

> "Have I explored it?"

and:

> "What should I discover next?"

---

# 39. Key Risks

## Risk 1 — Empty Map

If users open the app and there are no interesting discoveries, the experience feels empty.

### Solution

Seed the initial database with curated places.

---

## Risk 2 — GPS Accuracy

GPS can be inaccurate.

### Solution

Use reasonable geofence tolerances and GPS accuracy thresholds.

---

## Risk 3 — Privacy

Location history is sensitive.

### Solution

Minimize public location exposure and provide privacy controls.

---

## Risk 4 — Game Becomes Boring

Simply unlocking squares may become repetitive.

### Solution

Introduce:

- Discoveries
- Challenges
- Achievements
- Hidden Gems
- City completion
- Events

---

## Risk 5 — People Cheat

GPS manipulation can damage leaderboards.

### Solution

Build basic anti-cheat from the beginning, but don't over-engineer it for MVP.

---

## Risk 6 — Too Much Scope

Maps + social + AI + AR + tourism + rewards can become enormous.

### Solution

MVP focuses on:

**Map + GPS + Unlocking + Discoveries + Recommendations + XP**

---

# 40. MVP Definition of Done

The MVP is considered successful when a new user can:

1. Create an account.
2. Open the real-world map.
3. See unexplored areas.
4. Allow location access.
5. Physically move to a new area.
6. Have the system verify their location.
7. Unlock that area.
8. Receive XP.
9. See updated exploration statistics.
10. Discover a nearby place.
11. Mark it as visited.
12. Optionally recommend it.
13. See community recommendation data.
14. Earn an achievement.
15. View their exploration profile.
16. Report inappropriate content.

---

# 41. Coding Agent Requirements

The coding agent must:

### Before Coding

- Read this PRD completely.
- Identify technical ambiguities.
- Propose architecture.
- Propose folder structure.
- Define database schema.
- Define API contracts.
- Define MVP milestones.

### During Development

- Build incrementally.
- Keep frontend/backend separated cleanly.
- Use environment variables for secrets.
- Write reusable components.
- Add validation.
- Add error handling.
- Add loading/empty/error states.
- Write tests for core logic.
- Keep geographic calculations server-validated.

### UI Requirements

The agent must:

- Build a polished mobile-first interface.
- Prioritize the map.
- Make unexplored areas visually obvious.
- Use animations sparingly but meaningfully.
- Make XP/progression satisfying.
- Avoid generic dashboard aesthetics.
- Avoid copying Google Maps UI.
- Maintain a consistent design system.

### Testing

At minimum test:

- Authentication
- Exploration verification
- Duplicate exploration
- XP calculation
- Discovery creation
- Recommendation
- Permission errors
- GPS accuracy failures
- Invalid coordinates
- Unauthorized actions
- Report submission

---

# 42. Development Phases

## Phase 1 — Foundation

- Repository
- Mobile app
- Backend
- Database
- Authentication
- Design system

## Phase 2 — Map

- Map integration
- User location
- H3 grid
- Fog/unexplored state
- Explored state

## Phase 3 — Exploration

- GPS verification
- Unlocking
- XP
- Level
- Exploration stats

## Phase 4 — Discoveries

- Discovery model
- Nearby discoveries
- Discovery details
- Visits
- Photos

## Phase 5 — Recommendations

- Recommend action
- Recommendation counts
- Basic quality score

## Phase 6 — Gamification

- Achievements
- Basic challenges
- Progression

## Phase 7 — Moderation

- Reports
- Admin tools
- Content controls

## Phase 8 — Polish

- Animations
- Onboarding
- Empty states
- Error handling
- Performance
- Testing

---

# 43. Future Roadmap

After MVP validation:

### Version 1.1

- Friends
- Follow users
- Leaderboards
- Better discovery feed
- City completion

### Version 1.2

- Hidden Gem algorithm
- Personalized exploration recommendations
- Advanced achievements
- Seasonal challenges

### Version 2

- Multiplayer exploration
- Group quests
- Tourism partnerships
- Sponsored challenges
- AR discovery
- AI-generated exploration quests

---

# 44. Product Personality

The product should feel:

- Curious
- Adventurous
- Playful
- Modern
- Exploratory
- Rewarding

It should NOT feel:

- Corporate
- Like a directory
- Like a review website
- Like a surveillance system
- Like a social-media clone

---

# 45. Final Product Statement

The product is a **real-world exploration game**.

The world starts unexplored.

Players physically explore it to unlock it.

They discover meaningful places.

They can recommend genuinely worthwhile discoveries.

Their exploration becomes their progression.

The ultimate long-term goal:

> **Explore the world. Unlock the map. Find what others miss.**

---

# 46. Critical MVP Rule

Do not build everything described in this document immediately.

The first prototype should answer one question:

> **Is physically unlocking the real world fun enough that people want to keep exploring?**

Build the smallest polished experience that proves that loop.

**Core MVP:**

```text
MAP
 ↓
FOG / LOCKED WORLD
 ↓
PHYSICAL MOVEMENT
 ↓
GPS VERIFICATION
 ↓
UNLOCK
 ↓
XP
 ↓
DISCOVER
 ↓
OPTIONALLY RECOMMEND
 ↓
PROGRESS
```

If this loop is fun, everything else can be built around it.
