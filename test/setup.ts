import { installFakeStrapi } from './strapi';

// Some plugin modules read the global `strapi` as soon as they are imported (e.g. `utils/text-tracks.ts`),
// so a fake must exist before any test file imports them. Tests install a fresh one per test.
installFakeStrapi();
