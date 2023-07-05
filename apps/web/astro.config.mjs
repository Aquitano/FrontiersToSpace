import image from "@astrojs/image";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import compress from "astro-compress";
import critters from "astro-critters";
import { defineConfig } from "astro/config";

import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  site: "https://astro-moon-landing.netlify.app/",
  integrations: [sitemap(), tailwind(), critters(), image({
    serviceEntryPoint: "@astrojs/image/sharp"
  }), compress({
    img: false
  }), react()],
  vite: {
    ssr: {
      external: ["svgo"]
    }
  }
});