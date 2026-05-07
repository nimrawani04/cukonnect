import type { CapacitorConfig } from '@capacitor/cli';

// Toggle production (bundled) vs development (hot-reload) mode.
// Set CAP_ENV=production before running `npx cap sync` to bundle the UI
// from the local `dist/` folder into the APK (no internet required to load UI).
// Leave unset (or set to "development") to load the live Lovable preview URL,
// which gives instant hot-reload while you iterate.
const isProduction = process.env.CAP_ENV === 'production';

const config: CapacitorConfig = {
  appId: 'app.lovable.3d8db398615a4876b5585382c5226d3c',
  appName: 'CuKashmir',
  webDir: 'dist',
  ...(isProduction
    ? {}
    : {
        server: {
          url: 'https://3d8db398-615a-4876-b558-5382c5226d3c.lovableproject.com?forceHideBadge=true',
          cleartext: true,
        },
      }),
};

export default config;
