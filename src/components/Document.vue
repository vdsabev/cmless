<template>
  <div class="prose max-w-full">
    <template v-for="item in content" :key="item.endIndex">
      <br v-if="item.sectionBreak" />

      <DocumentParagraph
        v-if="item.paragraph"
        :paragraph="item.paragraph"
        :document="document"
      />
    </template>
  </div>
</template>

<script>
import { computed, toRefs } from 'vue'

import useUpdateTitle from '../use/updateTitle'
import DocumentParagraph from './DocumentParagraph.vue'

export default {
  name: 'Document',
  components: {
    DocumentParagraph,
  },
  props: {
    document: {
      type: Object,
      required: true,
    },
  },
  setup(props) {
    const { document } = toRefs(props)

    useUpdateTitle(() => document.value.title)

    const content = computed(() => document.value.body.content)

    return {
      content,
    }
  },
}
</script>
