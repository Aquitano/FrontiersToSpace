# ASG Stratosphärenmission 2023
ASG Stratosphärenmission is a student-led project that aims to explore the boundaries of the sky by uniting various scientific disciplines in a spectacular stratospheric balloon expedition. This repository contains the code and resources used in the project, leveraging cutting-edge technologies to bring the wonders of the stratosphere to your fingertips.

## Project Goal
The project aims to capture measurements such as altitude, ozone content, temperature, and air pressure. The analyzed data enhances the understanding of the stratosphere and enriches geography lessons.

## Technical Details

### Repository Structure
- `apps/board`: Contains the code for the TTGO T-Beam.
- `apps/map`: Contains the code for the interactive map for the various receiver locations. It uses React, a popular JavaScript library for building user interfaces, Leaflet for interactive maps, and million.js for efficient DOM manipulation.
- `apps/server`: Contains the server code that records data and enables the interactive map. It's built with TypeScript for static typing, Express for handling server-side logic, tRPC for end-to-end typesafe APIs, and Zod for schema validation.
- `apps/web`: Contains the code for the project website with a live dashboard. It uses Astro.js for fast, optimized frontend rendering, React.js for UI components, Tailwind for utility-first CSS, Leaflet for interactive maps, and Chart.js for dynamic and responsive charts.
- `data`: Contains all recorded data in both filtered and unfiltered versions.
### Communication Technology
We're using APRS (Automatic Packet Reporting System), a data transmission system in amateur radio that transmits position, weather, telemetry messages. The data can be retrieved online and visualized, bringing real-time insights from the stratosphere to your screen.

### Hardware
Our hardware of choice is the TTGO T-Beam, a user-friendly board used for wireless communication. With integrated GPS and LoRa technology, it enables long-distance transmission of location data, making it a perfect fit for our stratospheric exploration.

### Sensors
We're employing the BME280, a compact yet powerful sensor that measures pressure, humidity, and temperature, and the MQ131, a specialized sensor that checks air quality by measuring the ozone content.

## Event Details
The project culminates in a grand event - "The Day of Science" on July 8, 2023, where the stratospheric balloon was launched. This event was a collaboration between Adalbert Stifter Gymnasium and Sternwarte Passau.

## Collaboration
The project is supported by the German Amateur Radio Club (DARC), which brings the necessary know-how with its experienced knowledge and experiences. This partnership offers an extended spectrum of learning and interaction on the Day of Science, bringing visitors closer to the fascination of our world.

## License
This project is licensed under the GNU General Public License v3.0 - see the LICENSE file for details.
