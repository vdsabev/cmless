<template>
  <Document v-if="document" :document="document" />
</template>

<script>
import { ref, toRefs, watchEffect } from 'vue'

import { getDocumentJSON } from '../api'
import Document from '../components/Document.vue'

export default {
  name: 'DocumentPage',
  components: {
    Document,
  },
  props: {
    url: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const { url } = toRefs(props)
    const document = ref(null)

    watchEffect(async () => {
      const data = await getDocumentJSON(url.value)
      document.value = data
    })

    return {
      document,
    }
  },
}
</script>
