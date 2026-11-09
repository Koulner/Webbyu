import { INQUIRY_ENDPOINT, INQUIRY_MAX_BYTES, type InquiryField, type InquiryRequest, type InquiryResponse } from './inquiry-contract';
import { LINE_IDS, LINE_STATUSES, REMOVABLE_LINE_IDS } from './pricing-catalog';
import { EXTENSION_IDS, GOAL_IDS, IMAGE_SOURCES, IMAGE_STATES, MEDIA_CHOICES, MEDIA_SITES, MEDIA_USES, PACKAGE_CHOICES, PROJECT_TYPES, SCOPES, TEXT_STATES, VIDEO_STATES, ZONES, type BriefState } from './state';

export const INQUIRY_TIMEOUT_MS = 90_000;
export const INQUIRY_CONTACT = 'lukas.wagner@webbyu.de';
const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const fields: InquiryField[] = [
  'requestId', 'website', 'goal', 'extensions', 'projectType', 'timing', 'description', 'name', 'email', 'selectedPackage',
  'scope', 'texts', 'images', 'imageSource', 'video', 'zone', 'mediaChoice', 'mediaUse', 'sites', 'drone', 'removedLines', 'catalogVersion', 'shownLines',
];
const SHOWN_LINES_MAX = 30;
const AMOUNT_MAX = 100_000;
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
    scope: state.scope, texts: state.texts, images: state.images, imageSource: state.imageSource, video: state.video, zone: state.zone,
    mediaChoice: state.mediaChoice, mediaUse: [...state.mediaUse].sort(), sites: state.sites, drone: state.drone,
    removedLines: [...state.removedLines].sort(), catalogVersion: state.catalogVersion,
    shownLines: state.shownLines.map(line => [line.id, line.status, line.min, line.max]),
  });
}

const oneOf = (choices: readonly string[], value: unknown) => typeof value === 'string' && choices.includes(value);
const uniqueList = (value: unknown, choices: readonly string[], max: number) =>
  Array.isArray(value) && value.length <= max && value.every(item => oneOf(choices, item)) && new Set(value).size === value.length;
const amount = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0 && (value as number) <= AMOUNT_MAX;

/** Browser checks supplement server validation; limits apply before trimming. */
export function invalidInquiryFields(state: BriefState): InquiryField[] {
  const invalid: InquiryField[] = [];
  if (!oneOf(GOAL_IDS, state.goal)) invalid.push('goal');
  if (!uniqueList(state.extensions, EXTENSION_IDS, EXTENSION_IDS.length) || (state.extensions.includes('unsure') && state.extensions.length > 1)) invalid.push('extensions');
  if (!oneOf(PROJECT_TYPES, state.projectType)) invalid.push('projectType');
  if (!['flexible', 'soon', 'later'].includes(state.timing)) invalid.push('timing');
  if (state.selectedPackage !== null && !oneOf(PACKAGE_CHOICES, state.selectedPackage)) invalid.push('selectedPackage');
  if (!oneOf(SCOPES, state.scope)) invalid.push('scope');
  if (!oneOf(TEXT_STATES, state.texts)) invalid.push('texts');
  if (!oneOf(IMAGE_STATES, state.images)) invalid.push('images');
  if (state.imageSource !== null && !oneOf(IMAGE_SOURCES, state.imageSource)) invalid.push('imageSource');
  if (!oneOf(VIDEO_STATES, state.video)) invalid.push('video');
  if (!oneOf(ZONES, state.zone)) invalid.push('zone');
  if (state.mediaChoice !== null && !oneOf(MEDIA_CHOICES, state.mediaChoice)) invalid.push('mediaChoice');
  if (!uniqueList(state.mediaUse, MEDIA_USES, MEDIA_USES.length)) invalid.push('mediaUse');
  if (!oneOf(MEDIA_SITES, state.sites)) invalid.push('sites');
  if (typeof state.drone !== 'boolean') invalid.push('drone');
  if (!uniqueList(state.removedLines, REMOVABLE_LINE_IDS, REMOVABLE_LINE_IDS.length)) invalid.push('removedLines');
  if (typeof state.catalogVersion !== 'string' || !/^\d{4}-\d{2}-[a-z]$/.test(state.catalogVersion)) invalid.push('catalogVersion');
  const ids = Array.isArray(state.shownLines) ? state.shownLines.map(line => line?.id) : [];
  if (!Array.isArray(state.shownLines) || state.shownLines.length > SHOWN_LINES_MAX || new Set(ids).size !== ids.length
    || !state.shownLines.every(line => typeof line === 'object' && line !== null && oneOf(LINE_IDS, line.id) && oneOf(LINE_STATUSES, line.status)
      && amount(line.min) && amount(line.max) && line.min <= line.max)) invalid.push('shownLines');
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
