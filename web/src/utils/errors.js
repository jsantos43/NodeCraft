import { ApiError } from '../api/client.js';

/**
 * Single source of truth for how backend error codes are shown to the user.
 * The backend sends { success:false, error:<CODE>, message, details } — this maps
 * each CODE to a friendly, actionable presentation. Keep titles short, keep
 * descriptions about what to do next (never blame, never apologize).
 *
 * tone drives color: 'danger' (server-side) | 'warning' (denied/invalid) |
 * 'notice' (missing/info) | 'success'.
 */
export const ERROR_CATALOG = {
  INVALID_REQUEST: {
    tone: 'warning',
    icon: 'invalid',
    title: 'Check your input',
    description: "Some fields aren't valid. Review them and try again.",
  },
  UNATHORIZED: {
    tone: 'warning',
    icon: 'lock',
    title: 'Sign in to continue',
    description: 'Your session ended or your credentials are wrong. Sign in again.',
  },
  FORBIDDEN: {
    tone: 'warning',
    icon: 'shield',
    title: 'Access not allowed',
    description: "You don't have permission for this. Ask the server owner for access.",
  },
  NOT_FOUND: {
    tone: 'notice',
    icon: 'search',
    title: 'Not found',
    description: "We couldn't find what you were looking for. It may have been removed.",
  },
  SERVICE_UNAVAILABLE: {
    tone: 'danger',
    icon: 'offline',
    title: 'Service unavailable',
    description: 'This part of NodeCraft is down right now. Try again in a moment.',
  },
  INTERNAL_ERROR: {
    tone: 'danger',
    icon: 'server',
    title: 'Something broke on our end',
    description: 'The server hit an error. Try again — if it keeps happening, contact support.',
  },
  NETWORK_ERROR: {
    tone: 'danger',
    icon: 'offline',
    title: "Can't reach the server",
    description: 'Check your connection and try again.',
  },
};

// Aliases for spelling variants that may appear from the backend.
ERROR_CATALOG.UNAUTHORIZED = ERROR_CATALOG.UNATHORIZED;

const FALLBACK = {
  tone: 'danger',
  icon: 'server',
  title: 'Something went wrong',
  description: 'The action could not be completed. Try again.',
};

/**
 * Turn any thrown value into a normalized toast/alert descriptor:
 * { tone, icon, title, description, code, fields }.
 *
 * - Uses the catalog for the semantic code.
 * - For validation errors, surfaces the field-level `details` from the backend
 *   so the user sees exactly what to fix.
 * - `override` lets a caller pin a context-specific description
 *   (e.g. "Couldn't start the server") while keeping the tone/icon.
 */
export function resolveError(err, override = {}) {
  const code = err instanceof ApiError ? err.code : null;
  const base = (code && ERROR_CATALOG[code]) || FALLBACK;

  // Field-level validation details → readable list.
  const fields = [];
  if (err instanceof ApiError && Array.isArray(err.details)) {
    for (const d of err.details) {
      if (d && typeof d === 'object' && d.message) {
        fields.push(d.field ? `${d.field}: ${d.message}` : d.message);
      } else if (typeof d === 'string' && d) {
        fields.push(d);
      }
    }
  }

  let description = override.description || base.description;
  // For validation, the specific field message is far more useful than the generic line.
  if (code === 'INVALID_REQUEST' && fields.length && !override.description) {
    description = fields.join(' · ');
  } else if (!code && !override.description) {
    // Not a recognized API error (a client-side check, or a plain Error) — its
    // own message is more useful than the generic fallback line.
    const raw = typeof err === 'string' ? err : err?.message;
    if (raw) description = raw;
  }

  return {
    tone: override.tone || base.tone,
    icon: override.icon || base.icon,
    title: override.title || base.title,
    description,
    code: code || null,
    fields,
  };
}
