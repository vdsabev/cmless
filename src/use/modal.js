import { ref } from 'vue'

const containerId = 'modal-container'
const id = ref(null)

function isOpen(/** @type {string} */ modalId) {
  return id.value === modalId
}

function open(/** @type {string} */ modalId) {
  id.value = modalId
}

function close() {
  id.value = null
}

export default function useModal() {
  return {
    containerId,
    isOpen,
    open,
    close,
  }
}
