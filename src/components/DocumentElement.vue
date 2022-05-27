<template>
  <br v-if="isNewLine" />

  <figure v-else-if="isInlineObject">
    <img :src="inlineObjectUrl" :style="inlineObjectSize" />
  </figure>

  <template v-else-if="linkUrl">
    <router-link v-if="isRelativeUrl" :to="linkUrl">
      {{ content }}
    </router-link>

    <ExternalLink v-else :href="linkUrl">
      {{ content }}
    </ExternalLink>
  </template>

  <span v-else :class="{ 'font-bold': isBold }">
    {{ content }}
  </span>
</template>

<script>
import { computed, toRefs } from 'vue'

import ExternalLink from './ExternalLink.vue'

export default {
  name: 'DocumentElement',
  components: {
    ExternalLink,
  },
  props: {
    element: {
      type: Object,
      required: true,
    },
    document: {
      type: Object,
      required: true,
    },
  },
  setup(props) {
    const { element, document } = toRefs(props)

    const content = computed(() => element.value.textRun?.content)

    const isNewLine = computed(() => content.value === '\n')

    const isBold = computed(() => element.value.textRun?.textStyle.bold)

    const linkUrl = computed(() => element.value.textRun?.textStyle.link?.url)
    const isRelativeUrl = computed(() => linkUrl.value?.startsWith('/'))

    const isInlineObject = computed(() => element.value.inlineObjectElement != null)

    const embeddedObject = computed(() => {
      const { inlineObjectId } = element.value.inlineObjectElement
      return document.value.inlineObjects[inlineObjectId].inlineObjectProperties
        .embeddedObject
    })

    const inlineObjectUrl = computed(() => {
      return embeddedObject.value.imageProperties.contentUri
    })

    const inlineObjectSize = computed(() => {
      const { pageSize } = document.value.documentStyle
      const { width, height } = embeddedObject.value.size
      return {
        width: `${100 * (width.magnitude / pageSize.width.magnitude)}%`,
        height: `${100 * (height.magnitude / pageSize.height.magnitude)}%`,
      }
    })

    return {
      content,
      isNewLine,
      isBold,
      linkUrl,
      isRelativeUrl,
      isInlineObject,
      embeddedObject,
      inlineObjectUrl,
      inlineObjectSize,
    }
  },
}
</script>
