<template>
  <Teleport :to="`#${modal.containerId}`">
    <Transition name="fade" mode="out-in">
      <div
        v-if="modal.isOpen(id)"
        class="fixed inset-0 w-full h-full flex justify-center items-center p-4 bg-black/75 transition-opacity"
        role="dialog"
        aria-modal="true"
        @click.self="modal.close()"
      >
        <slot />
        <button
          class="absolute top-0 right-0 text-4xl px-8 pb-4 text-white"
          @click="modal.close()"
        >
          ×
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script>
import { onMounted, onUnmounted } from 'vue'

import useModal from '../use/modal'

export default {
  name: 'Modal',
  props: {
    id: {
      type: String,
      required: true,
    },
  },
  setup() {
    const modal = useModal()

    function closeModalOnEscape($event) {
      if ($event.key === 'Escape') {
        modal.close()
      }
    }

    onMounted(() => {
      document.addEventListener('keydown', closeModalOnEscape)
    })

    onUnmounted(() => {
      document.removeEventListener('keydown', closeModalOnEscape)
    })

    return {
      modal,
    }
  },
}
</script>
