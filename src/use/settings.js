import { ref } from 'vue'

export const settingsRef = ref()

/** @returns {import('../types').Settings} */
export function useSettings() {
  return settingsRef.value
}

export function usePages() {
  const settings = useSettings()
  return settings.pages
}

export function usePaths() {
  const pages = usePages()
  return Object.keys(pages)
}
