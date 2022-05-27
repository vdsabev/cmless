<template>
  <component v-if="exists" :is="component" />
  <NotFound v-else />
</template>

<script>
import NotFound from './NotFound.vue'

export default {
  name: 'PageGuard',
  components: {
    NotFound,
  },
  props: {
    component: {
      type: Object,
      required: true,
    },
    exists: {
      type: Boolean,
      required: true,
    },
  },
}
</script>
