import { describe, expect, test } from 'bun:test';
import { eventNeedsGenerate, issueEventNeedsGenerate } from './should-generate';

describe('issueEventNeedsGenerate', () => {
  test('opened/edited draft is skipped', () => {
    expect(issueEventNeedsGenerate({ action: 'opened', labelNames: ['status: draft'] })).toBe(false);
    expect(issueEventNeedsGenerate({ action: 'edited', labelNames: ['status: draft'] })).toBe(false);
    expect(issueEventNeedsGenerate({ action: 'edited', labelNames: [] })).toBe(false);
  });

  test('opened/edited published or unlisted runs', () => {
    expect(issueEventNeedsGenerate({ action: 'edited', labelNames: ['status: published'] })).toBe(true);
    expect(issueEventNeedsGenerate({ action: 'opened', labelNames: ['status: unlisted'] })).toBe(true);
    expect(issueEventNeedsGenerate({ action: 'edited', labelNames: ['status:published'] })).toBe(true);
  });

  test('adding or removing a live status label runs', () => {
    expect(
      issueEventNeedsGenerate({
        action: 'labeled',
        labelName: 'status: published',
        labelNames: ['status: published'],
      }),
    ).toBe(true);
    expect(
      issueEventNeedsGenerate({
        action: 'unlabeled',
        labelName: 'status: unlisted',
        labelNames: ['status: draft'],
      }),
    ).toBe(true);
  });

  test('non-status labels are skipped even on a live post', () => {
    expect(
      issueEventNeedsGenerate({
        action: 'labeled',
        labelName: 'bug',
        labelNames: ['status: published', 'bug'],
      }),
    ).toBe(false);
    expect(
      issueEventNeedsGenerate({
        action: 'unlabeled',
        labelName: 'bug',
        labelNames: ['status: published'],
      }),
    ).toBe(false);
  });

  test('unknown issue action rebuilds', () => {
    expect(issueEventNeedsGenerate({ action: 'pinned', labelNames: [] })).toBe(true);
  });
});

describe('eventNeedsGenerate', () => {
  test('non-issue events always run', () => {
    expect(eventNeedsGenerate('push', null)).toBe(true);
    expect(eventNeedsGenerate('workflow_dispatch', null)).toBe(true);
  });

  test('issues payload: draft edit skipped', () => {
    expect(
      eventNeedsGenerate('issues', {
        action: 'edited',
        issue: { labels: [{ name: 'status: draft' }] },
      }),
    ).toBe(false);
  });
});

describe('deleted / transferred issues', () => {
  test('deleting or transferring a live post rebuilds', () => {
    for (const action of ['deleted', 'transferred']) {
      expect(issueEventNeedsGenerate({ action, labelNames: ['status: published'] })).toBe(true);
      expect(issueEventNeedsGenerate({ action, labelNames: ['status: unlisted'] })).toBe(true);
    }
  });

  test('deleting or transferring a draft is skipped', () => {
    for (const action of ['deleted', 'transferred']) {
      expect(issueEventNeedsGenerate({ action, labelNames: ['status: draft'] })).toBe(false);
      expect(issueEventNeedsGenerate({ action, labelNames: [] })).toBe(false);
    }
  });

  test('payload labels are read for deleted events', () => {
    expect(
      eventNeedsGenerate('issues', {
        action: 'deleted',
        issue: { labels: [{ name: 'status: published' }] },
      }),
    ).toBe(true);
  });
});

describe('link label', () => {
  test('adding or removing link on a live issue rebuilds', () => {
    expect(
      issueEventNeedsGenerate({ action: 'labeled', labelName: 'link', labelNames: ['status: published', 'link'] }),
    ).toBe(true);
    expect(
      issueEventNeedsGenerate({ action: 'unlabeled', labelName: 'link', labelNames: ['status: published'] }),
    ).toBe(true);
  });

  test('link label on a draft is skipped', () => {
    expect(
      issueEventNeedsGenerate({ action: 'labeled', labelName: 'link', labelNames: ['status: draft', 'link'] }),
    ).toBe(false);
  });
});
