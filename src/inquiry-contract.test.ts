import { describe, expect, it } from 'vitest';
import input from '../backend/src/Input.php?raw';
import readme from '../backend/README.md?raw';
import transport from '../backend/src/IonosTransport.php?raw';
import { INQUIRY_MAX_BYTES } from './inquiry-contract';
import { LINE_IDS, LINE_STATUSES, REMOVABLE_LINE_IDS } from './pricing-catalog';
import { createBriefStore, EXTENSION_IDS, GOAL_IDS, IMAGE_SOURCES, IMAGE_STATES, MEDIA_CHOICES, MEDIA_SITES, MEDIA_USES, PACKAGE_CHOICES, PROJECT_TYPES, SCOPES, TEXT_STATES, VIDEO_STATES, ZONES } from './state';

// PHP is not available on every machine. These checks read the backend sources as text (Vite raw imports),
// so a changed value list or catalog position can never drift apart silently between browser and server.
const quoted = (list: string) => [...list.matchAll(/'([^']*)'/g)].map(match => match[1]);
const phpList = (pattern: RegExp) => {
  const match = pattern.exec(input);
  if (!match) throw new Error(`Not found in Input.php: ${pattern}`);
  return quoted(match[1]);
};
const constant = (name: string) => phpList(new RegExp(`const ${name} = \\[([^\\]]*)\\];`));
const choice = (key: string) => phpList(new RegExp(`'${key}' => \\[([^\\]]*)\\]`));

describe('backend contract matches the browser contract', () => {
  it('requires exactly the keys of the request', () => {
    const keys = [...Object.keys(createBriefStore().get()), 'requestId', 'website'].sort();
    expect([...constant('KEYS')].sort()).toEqual(keys);
    expect(keys).toHaveLength(23);
  });

  it('accepts exactly the same value lists', () => {
    expect(constant('EXTENSIONS')).toEqual([...EXTENSION_IDS]);
    expect(constant('MEDIA_USES')).toEqual([...MEDIA_USES]);
    expect(constant('REMOVABLE')).toEqual(REMOVABLE_LINE_IDS);
    expect(constant('LINE_STATUSES')).toEqual([...LINE_STATUSES]);
    const lists: Record<string, readonly string[]> = {
      goal: GOAL_IDS, projectType: PROJECT_TYPES, scope: SCOPES, texts: TEXT_STATES, images: IMAGE_STATES, video: VIDEO_STATES, zone: ZONES, sites: MEDIA_SITES,
      imageSource: IMAGE_SOURCES, mediaChoice: MEDIA_CHOICES, selectedPackage: PACKAGE_CHOICES,
    };
    for (const [key, values] of Object.entries(lists)) expect(choice(key), key).toEqual([...values]);
    expect(choice('timing')).toEqual(['flexible', 'soon', 'later']);
  });

  it('knows exactly the positions of the catalog and nothing else', () => {
    const lines = /const LINES = \[([\s\S]*?)\n    \];/.exec(input)?.[1] ?? '';
    const ids = [...lines.matchAll(/^\s*'([^']+)' =>/gm)].map(match => match[1]);
    expect([...ids].sort()).toEqual([...LINE_IDS].sort());
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('shares the size limit and the number of shown positions', () => {
    expect(input).toContain(`MAX_BYTES = ${INQUIRY_MAX_BYTES}`);
    expect(input).toContain('MAX_LINES = 30');
    expect(input).toContain('MAX_AMOUNT = 100000');
  });

  it('labels every answer value that the mail shows', () => {
    const labels = (group: string) => quoted((new RegExp(`'${group}' => \\[([^\\]]*)\\]`).exec(transport.slice(transport.indexOf('private const LABELS')))?.[1] ?? '')).filter((_, index) => index % 2 === 0);
    const lists: Record<string, readonly string[]> = {
      goal: GOAL_IDS, projectType: PROJECT_TYPES, scope: SCOPES, texts: TEXT_STATES, images: IMAGE_STATES, video: VIDEO_STATES, zone: ZONES, sites: MEDIA_SITES,
      imageSource: IMAGE_SOURCES, mediaChoice: MEDIA_CHOICES, selectedPackage: PACKAGE_CHOICES, mediaUse: MEDIA_USES, extensions: EXTENSION_IDS,
    };
    for (const [group, values] of Object.entries(lists)) expect(labels(group), group).toEqual([...values]);
  });

  it('documents every key and the unverified status of the shown prices', () => {
    for (const key of constant('KEYS')) expect(readme, key).toContain(`\`${key}\``);
    expect(readme).toContain('Preisangaben sind nicht verbindlich');
    expect(readme).toContain('`Input::LINES`');
  });
});
