import { INQUIRY_ENDPOINT, INQUIRY_MAX_BYTES, type InquiryField, type InquiryRequest, type InquiryResponse } from './inquiry-contract';
import type { BriefState } from './state';

export const INQUIRY_TIMEOUT_MS = 90_000;
export const INQUIRY_CONTACT = 'lukas.wagner@webbyu.de';
const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const fields: InquiryField[] = ['requestId', 'website', 'goal', 'extensions', 'projectType', 'timing', 'description', 'name', 'email', 'selectedPackage'];
const positiveSeconds = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) > 0;

/** Fail closed on an unexpected schema, HTTP status, or uncorrelated success. */
export function isInquiryResponse(value: unknown, httpStatus: number, requestId: string): value is InquiryResponse {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  const hasOnly = (...keys: string[]) => Object.keys(v).every(key => keys.includes(key));
  switch (v.status) {
    case 'success':
      return httpStatus === 200 && hasOnly('status', 'requestId', 'duplicate')
        && typeof v.requestId === 'string' && uuidV4.test(v.requestId) && typeof v.duplicate === 'boolean'
        && (v.duplicate || v.requestId === requestId);
    case 'invalid':
      return [400, 403, 405, 413, 415, 422].includes(httpStatus) && hasOnly('status', 'fields')
        && Array.isArray(v.fields) && v.fields.every(field => fields.includes(field));
    case 'rate_limit':
      return httpStatus === 429 && hasOnly('status', 'retryAfter') && positiveSeconds(v.retryAfter);
    case 'temporary':
      return httpStatus === 503 && hasOnly('status', 'outcome', 'retryAfter')
        && (v.outcome === 'not_sent' || v.outcome === 'unknown')
        && (!Object.hasOwn(v, 'retryAfter') || positiveSeconds(v.retryAfter));
    default:
      return false;
  }
}

export function createInquiryId(): string | null {
  // No Math.random fallback: without the platform's secure UUID API, do not send.
  try {
    const id = globalThis.crypto?.randomUUID?.();
    return typeof id === 'string' && uuidV4.test(id) ? id : null;
  } catch {
    return null;
  }
}

/** Match the server's content equivalence, including reverts after an unknown result. Memory only. */
export function inquiryFingerprint(state: BriefState, website: string): string {
  const normalized = (value: string) => value.replace(/\r\n?/g, '\n').replace(/^[\x00\x09-\x0b\x0d\x20]+|[\x00\x09-\x0b\x0d\x20]+$/g, '');
  return JSON.stringify({
    goal: state.goal, extensions: [...state.extensions].sort(), projectType: state.projectType,
    timing: state.timing, description: normalized(state.description), name: normalized(state.name),
    email: normalized(state.email).toLowerCase(), selectedPackage: state.selectedPackage, website,
  });
}

/** Browser checks supplement server validation; limits apply before trimming. */
export function invalidInquiryFields(state: BriefState): InquiryField[] {
  const invalid: InquiryField[] = [];
  if (!['presence', 'inquiries', 'bookings', 'sales'].includes(state.goal)) invalid.push('goal');
  const extensions = ['photos', 'videos', 'cms', 'booking', 'seo', 'maps', 'wizard', '3d', 'unsure'];
  if (state.extensions.some(id => !extensions.includes(id)) || new Set(state.extensions).size !== state.extensions.length
    || (state.extensions.includes('unsure') && state.extensions.length > 1)) invalid.push('extensions');
  if (!['new', 'existing'].includes(state.projectType)) invalid.push('projectType');
  if (!['flexible', 'soon', 'later'].includes(state.timing)) invalid.push('timing');
  if (![null, 'start', 'business', 'complete', 'custom'].includes(state.selectedPackage)) invalid.push('selectedPackage');
  if ([...state.description].length > 5000 || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/u.test(state.description)) invalid.push('description');
  if (!state.name.trim() || [...state.name].length > 120 || /[\x00-\x1f\x7f\u2028\u2029]/u.test(state.name)) invalid.push('name');
  const email = state.email.trim();
  // ASCII mailbox, dot-atom local part, DNS-style domain; the server is authoritative.
  if (state.email.length > 254 || !/^[\x21-\x7e]+$/.test(email)
    || !/^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(email)
    || email.slice(0, email.indexOf('@')).length > 64
    || /[\x00-\x1f\x7f\u2028\u2029]/u.test(state.email)) invalid.push('email');
  return invalid;
}

export function inquiryFits(request: InquiryRequest): boolean {
  return new TextEncoder().encode(JSON.stringify(request)).byteLength <= INQUIRY_MAX_BYTES;
}

export class InquiryUncertain extends Error {
  constructor(readonly reason: 'timeout' | 'network' | 'response') { super(reason); }
}

/** Exactly one POST. A timeout only stops waiting; it cannot recall a server-side email. */
export async function postInquiry(request: InquiryRequest): Promise<InquiryResponse> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new InquiryUncertain('timeout'));
      controller.abort();
    }, INQUIRY_TIMEOUT_MS);
  });
  const operation = async () => {
    let response: Response;
    try {
      response = await fetch(INQUIRY_ENDPOINT, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request),
        credentials: 'same-origin', cache: 'no-store', redirect: 'error', signal: controller.signal,
      });
    } catch {
      throw new InquiryUncertain('network');
    }
    try {
      if (!/^application\/json(?:\s*;|$)/i.test(response.headers.get('Content-Type') ?? '')) throw new Error('Unexpected content type');
      const value: unknown = await response.json();
      if (!isInquiryResponse(value, response.status, request.requestId)) throw new Error('Unexpected response');
      return value;
    } catch {
      throw new InquiryUncertain('response');
    }
  };
  try {
    return await Promise.race([operation(), timeout]);
  } finally {
    clearTimeout(timer);
  }
}
