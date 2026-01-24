# ASG Stratosphärenmission Web Application

This is the apps/web directory of the ASG Stratosphärenmission project. It contains the code for the project's web application, which serves as a live dashboard for the stratospheric balloon expedition.

## Overview

The web application provides real-time insights from the stratospheric balloon expedition. It displays interactive maps, data visualizations, and project information.

## Technologies Used

- **Astro.js**: Modern front-end framework for static site generation
- **React.js**: JavaScript library for interactive UI components
- **Tailwind CSS**: Utility-first CSS framework
- **Leaflet**: Open-source JavaScript library for interactive maps
- **Chart.js**: JavaScript charting library for data visualization
- **tRPC**: End-to-end typesafe API client

## Commands

| Command            | Action                                     |
| :----------------- | :----------------------------------------- |
| `pnpm install`     | Install dependencies                       |
| `pnpm run dev`     | Start local dev server at `localhost:4321` |
| `pnpm run build`   | Build production site to `./dist/`         |
| `pnpm run preview` | Preview build locally before deploying     |
| `pnpm run format`  | Format code with Prettier                  |
| `pnpm run clean`   | Remove `node_modules` and build output     |

## Environment Variables

The following environment variables can be configured:

- `PUBLIC_API_URL`: URL of the API server (defaults to production URL)
