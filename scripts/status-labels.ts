/** Same matchers generate.ts uses to decide an issue is a live post. */
export function isPublishedLabel(label: string): boolean {
  return /^status:\s*published$/i.test(label);
}

export function isUnlistedLabel(label: string): boolean {
  return /^status:\s*unlisted$/i.test(label);
}

/** `status: published` or `status: unlisted` — the labels that put an issue on the site. */
export function isLiveStatusLabel(label: string): boolean {
  return isPublishedLabel(label) || isUnlistedLabel(label);
}

export function hasLiveStatus(labels: string[]): boolean {
  return labels.some(isLiveStatusLabel);
}
