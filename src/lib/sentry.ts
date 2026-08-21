import * as Sentry from "@sentry/react";

export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
  });
}

// Erros de player/device devem incluir contexto: Sentry.setContext("device", { screen_id, org_id })
