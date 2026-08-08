import { setupRouter, router } from './core/router/index.js';

async function bootstrap() {
  await setupRouter();
  // Trigger rendering of current route
  await router.handleRoute(window.location.pathname);
}

bootstrap().catch(console.error);
