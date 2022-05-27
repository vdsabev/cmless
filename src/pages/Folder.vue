<template>
  <Folder v-if="documents" :documents="documents" />
</template>

<script>
import { ref, toRefs, watchEffect } from 'vue'

import { getFolderDocuments } from '../api'
import Folder from '../components/Folder.vue'

export default {
  name: 'FolderPage',
  components: {
    Folder,
  },
  props: {
    url: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const { url } = toRefs(props)
    const documents = ref(null)

    watchEffect(async () => {
      const data = await getFolderDocuments(url.value)
      documents.value = data
    })

    return {
      documents,
    }
  },
}
</script>
