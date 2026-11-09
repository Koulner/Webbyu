import type { BriefState } from './state';

/**
 * POST /api/inquiry.php, application/json, same origin; see backend/README.md.
 * Alle Schlüssel von `BriefState` sind Pflicht. Preisangaben (`shownLines`, `catalogVersion`)
 * sind „vom Besucher gesehen“ und werden serverseitig nicht neu berechnet.
 */
export interface InquiryRequest extends BriefState {
  /** crypto.randomUUID(); keep unchanged for this submission and manual retries. */
  requestId: string;
  /** Honeypot: leave empty; no visitor contact/address belongs here. */
  website: string;
}

export type InquiryField = keyof InquiryRequest;
export type InquiryResponse =
  | { status: 'success'; requestId: string; duplicate: boolean }
  | { status: 'invalid'; fields: InquiryField[] }
  | { status: 'rate_limit'; retryAfter: number }
  | { status: 'temporary'; outcome: 'not_sent' | 'unknown'; retryAfter?: number };

export const INQUIRY_ENDPOINT = '/api/inquiry.php';
export const INQUIRY_MAX_BYTES = 32_768;
