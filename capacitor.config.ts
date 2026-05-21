import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cootranstame.manteniapp',
  appName: 'ManteniApp',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
