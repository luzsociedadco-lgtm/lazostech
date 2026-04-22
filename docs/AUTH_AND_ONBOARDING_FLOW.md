# Auth And Onboarding Flow

## What is implemented now

Inside `lazos-frontend` the project now includes a local but functional app
layer for:

- email registration
- email login
- signed cookie session
- local user database
- local university directory seed
- profile completion
- wallet linking to profile
- progressive module unlocks in the frontend

The current implementation is intended for pilot definition and product flow
validation. It is not yet a production identity stack.

## Current storage model

### User database

File:

- `lazos-frontend/app/data/app-db.json`

Contains registered users, profile data, validation status and linked wallet.

### University directory

File:

- `lazos-frontend/app/data/university-directory.json`

Contains:

- canonical universities
- canonical campuses
- valid program codes
- sample student records for local matching

## Progressive unlock rules

### Default after registration

- `perfil`: enabled
- `tickets`: disabled unless the user matches university data or completes profile
- `reciclaje`: disabled
- `marketplace`: disabled
- `dao`: disabled

### If university validation succeeds

- `perfil`: enabled
- `tickets`: enabled

### If wallet is linked

- `reciclaje`: enabled
- `marketplace`: enabled
- `dao`: enabled

## How the university match works today

When the user updates profile data, the backend checks the local directory for a
match by:

- email
- student code
- national id

If a match exists, the profile is enriched automatically and the user is marked
as `universityValidated = true`.

## What still needs production work

### Google OAuth

The Google button is intentionally left pending because a real Google login
needs:

- OAuth client id
- OAuth client secret
- redirect URLs
- environment variables
- provider integration

### Real database

The JSON file database should eventually be replaced by a production DB such as:

- PostgreSQL
- Supabase Postgres
- MySQL

### Real university integration

The local seed should be replaced by an official source of truth such as:

- institutional CSV
- SIS export
- ERP export
- direct university API

## Program validation source

The valid program codes currently seeded are:

- `1001101` to `1001107`
- `1001201` to `1001208`

These are now treated as the pilot whitelist in both:

- frontend local directory
- on-chain pilot seed

These names were updated from your provided on-chain seed commands for campus
`1001 / SF`.

For production, the validation source should still be the official academic
catalog provided by Universidad del Valle so we can confirm whether campus
`1002 / MLD` needs its own program set.
