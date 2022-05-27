<template>
  <component :is="tagName">
    <DocumentElement
      v-for="element in paragraph.elements"
      :key="element.endIndex"
      :element="element"
      :document="document"
    />
  </component>
</template>

<script>
import { computed, toRefs } from 'vue'

import DocumentElement from './DocumentElement.vue'

const tagNameByStyleType = {
  TITLE: 'h1',
  SUBTITLE: 'h2',
  HEADING_1: 'h1',
  HEADING_2: 'h2',
  HEADING_3: 'h3',
  HEADING_4: 'h4',
  HEADING_5: 'h5',
  HEADING_6: 'h6',
}

export default {
  name: 'DocumentParagraph',
  components: {
    DocumentElement,
  },
  props: {
    paragraph: {
      type: Object,
      required: true,
    },
    document: {
      type: Object,
      required: true,
    },
  },
  setup(props) {
    const { paragraph } = toRefs(props)
    const tagName = computed(
      () => tagNameByStyleType[paragraph.value.paragraphStyle.namedStyleType] || 'p',
    )

    return {
      tagName,
    }
  },
}
</script>
