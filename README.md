# ASG Stratosphärenmission 2023

ASG Stratosphärenmission is a student-led project that explored the boundaries of the sky by uniting various scientific disciplines in a stratospheric balloon expedition. This repository contains the code and resources used in the project.

## Project Goal

The project captured measurements such as altitude, ozone content, temperature, and air pressure during a stratospheric balloon flight. The analyzed data enhances the understanding of the stratosphere and enriches geography education.

## Repository Structure

```
apps/
  board/    # Code for the TTGO T-Beam flight hardware
  map/      # Deprecated standalone map application
  server/   # API server for data collection and retrieval
  web/      # Project website with live dashboard
data/       # Recorded flight data (filtered and unfiltered)
```

## Technical Details

### Communication Technology

APRS (Automatic Packet Reporting System) is used for transmitting position, weather, and telemetry data from the balloon. Data is retrieved and visualized in real-time.

### Hardware

- **TTGO T-Beam**: Board with integrated GPS and LoRa for long-distance data transmission
- **BME280**: Sensor measuring pressure, humidity, and temperature
- **MQ131**: Ozone content sensor for air quality measurement

## Development

This is a pnpm monorepo using Turborepo for build orchestration.

```bash
# Install dependencies
pnpm install

# Run all apps in development mode
pnpm run dev

# Build all apps
pnpm run build

# Run linting
pnpm run lint
```

## Event Details

The stratospheric balloon was launched on July 8, 2023, during "The Day of Science" - a collaboration between Adalbert Stifter Gymnasium and Sternwarte Passau.

## Collaboration

The project was supported by the German Amateur Radio Club (DARC), providing expertise in radio communication technology.

## License

This project is licensed under the GNU General Public License v3.0 - see the LICENSE file for details.
