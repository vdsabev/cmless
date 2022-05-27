<template>
  <div v-if="isArray">
    <Page v-for="(p, i) in page" :key="i" :page="p" :name="name" :data="data" />
  </div>

  <Document v-else-if="isGoogleDocument" :url="page.url" />

  <Folder v-else-if="isGoogleDriveFolder" :url="page.url" :name="name" />

  <component v-else-if="isCustomComponent" :is="component" v-bind="data" />

  <NotFound v-else />
</template>

<script>
import { computed, defineAsyncComponent, toRefs } from 'vue'

import * as api from '../api'

import Document from './Document.vue'
import Folder from './Folder.vue'
import NotFound from './NotFound.vue'

export default {
  name: 'Page',
  components: {
    Document,
    Folder,
    NotFound,
  },
  props: {
    page: {
      type: Object,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    data: {
      type: Object,
      required: true,
    },
  },
  setup(props) {
    const { page } = toRefs(props)
    const isArray = computed(() => Array.isArray(page.value))
    const isGoogleDocument = computed(() => api.isGoogleDocument(page.value.url))
    const isGoogleDriveFolder = computed(() => api.isGoogleDriveFolder(page.value.url))
    const isCustomComponent = computed(() => page.value.component != null)
    const component = computed(() =>
      defineAsyncComponent(() => import(`../../data/components/${page.value.component}`)),
    )

    return {
      isArray,
      isGoogleDocument,
      isGoogleDriveFolder,
      isCustomComponent,
      component,
    }
  },
}
</script>
