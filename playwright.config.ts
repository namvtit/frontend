import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    video: 'on',
    viewport: { width: 1080, height: 1920 },
  },
});
