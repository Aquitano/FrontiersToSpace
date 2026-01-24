# ASG Stratosphärenmission Server Application

This is the apps/server directory of the ASG Stratosphärenmission project. It contains the code for the server-side logic, responsible for data collection, storage, and API endpoints.

## Overview

The server application handles data recording from APRS sources and provides tRPC API endpoints for the web dashboard. It stores telemetry data including location, weather, and sensor readings.

## Technologies Used

- **TypeScript**: Statically typed JavaScript for improved reliability
- **Express**: Web application framework for Node.js
- **tRPC**: Framework for building typesafe APIs
- **Prisma**: Type-safe database ORM
- **Zod**: Schema validation library

## Environment Variables

Required environment variables (managed via Doppler):

- `DATABASE_URL`: MySQL database connection string
- `APRS_API_KEY`: API key for APRS data retrieval
- `PORT`: Server port (defaults to 8080)
- `HOST`: Server host (defaults to 0.0.0.0)
- `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins

## Database

The server uses Prisma with MySQL. To update the database schema:

```bash
# Generate Prisma client after schema changes
pnpm exec prisma generate

# Push schema changes to database
pnpm exec prisma db push
```
