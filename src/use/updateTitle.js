import { onUnmounted, watch } from 'vue'

function setTitle(/** @type {string} */ title) {
  window.document.title = title
}

export default function useUpdateTitle(/** @type {() => string} */ watcher) {
  const originalTitle = document.title

  const stopWatching = watch(watcher, setTitle)

  const title = watcher()
  setTitle(title)

  onUnmounted(() => {
    stopWatching()
    setTitle(originalTitle)
  })
}
