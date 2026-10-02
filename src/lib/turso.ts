import { createClient, Client } from '@libsql/client/web';

const tursoUrl = import.meta.env.VITE_TURSO_DATABASE_URL || '';
const tursoAuthToken = import.meta.env.VITE_TURSO_AUTH_TOKEN || '';

export const isTursoConfigured = Boolean(
  tursoUrl &&
  tursoAuthToken &&
  !tursoUrl.includes('placeholder') &&
  !tursoAuthToken.includes('placeholder')
);

export const turso: Client | null = isTursoConfigured
  ? createClient({
      url: tursoUrl,
      authToken: tursoAuthToken,
    })
  : null;
