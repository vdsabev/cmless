#!/usr/bin/env bun
/**
 * Should this GitHub Actions run generate + build?
 *
 * Push / workflow_dispatch: always.
 * Issue events: only when the event can change published/unlisted content.
 * Draft edits and non-status labels are skipped (generated posts are not in git,
 * so skipping generate means skipping the whole build).
 *
 * Usage (Actions): bun scripts/should-generate.ts
 * Writes `build=true|false` to GITHUB_OUTPUT when that env is set.
 */
import { appendFileSync, readFileSync } from 'fs';
import { hasLiveStatus, isLiveStatusLabel } from './status-labels';

export type IssueEventInput = {
  action: string;
  /** Label added or removed (`labeled` / `unlabeled`). */
  labelName?: string;
  /** Labels on the issue after the event. */
  labelNames: string[];
};

/** True when this issue event can change what generate would write. */
export function issueEventNeedsGenerate(event: IssueEventInput): boolean {
  const action = (event.action || '').toLowerCase();

  if (action === 'labeled' || action === 'unlabeled') {
    return isLiveStatusLabel(event.labelName || '');
  }

  if (action === 'opened' || action === 'edited') {
    return hasLiveStatus(event.labelNames);
  }

  // Unknown issue action: rebuild rather than miss a publish.
  return true;
}

export function eventNeedsGenerate(
  eventName: string,
  payload: {
    action?: string;
    label?: { name?: string };
    issue?: { labels?: Array<string | { name?: string }> };
  } | null,
): boolean {
  if (eventName !== 'issues') return true;
  if (!payload) return true;

  const labelNames = (payload.issue?.labels || []).map((label) =>
    typeof label === 'string' ? label : label.name || '',
  );

  return issueEventNeedsGenerate({
    action: payload.action || '',
    labelName: payload.label?.name || '',
    labelNames,
  });
}

function main() {
  const eventName = process.env.GITHUB_EVENT_NAME || '';
  const eventPath = process.env.GITHUB_EVENT_PATH || '';
  let payload: Parameters<typeof eventNeedsGenerate>[1] = null;
  if (eventPath) {
    try {
      payload = JSON.parse(readFileSync(eventPath, 'utf8'));
    } catch {
      payload = null;
    }
  }

  const build = eventNeedsGenerate(eventName, payload);
  const line = `build=${build ? 'true' : 'false'}`;
  const out = process.env.GITHUB_OUTPUT;
  if (out) appendFileSync(out, `${line}\n`);

  if (build) {
    console.log('Generate: yes');
  } else {
    console.log('Generate: skip — this issue event cannot change published/unlisted content');
  }
}

if (import.meta.main) main();
