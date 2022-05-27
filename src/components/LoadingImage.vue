<template>
  <Loader v-if="isLoading" v-bind="$attrs" />

  <Transition name="fade" mode="out-in">
    <img
      v-show="!isLoading"
      v-bind="$attrs"
      @load="stopLoading()"
      @error="stopLoading()"
    />
  </Transition>
</template>

<script>
import { ref } from 'vue'

import Loader from './Loader.vue'

export default {
  components: {
    Loader,
  },
  inheritAttrs: false,
  setup() {
    const isLoading = ref(true)

    function stopLoading() {
      isLoading.value = false
    }

    return {
      isLoading,
      stopLoading,
    }
  },
}
</script>
