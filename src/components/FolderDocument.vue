<template>
  <router-link
    class="block my-8"
    :to="{
      name: 'folder-document',
      params: { folderName, documentId: document.id, documentName: document.name },
    }"
  >
    <article class="flex items-start">
      <img
        class="w-40 aspect-[3/2] border-4 border-gray-400 rounded-md object-cover object-top"
        :src="document.thumbnail"
      />

      <div class="ml-3">
        <h3>{{ document.name }}</h3>

        <div class="overflow-hidden mb-4 line-clamp-4">
          <p v-for="(paragraph, index) in paragraphs" :key="index">{{ paragraph }}</p>
        </div>

        <time class="text-sm" :datetime="document.created">
          {{ formattedCreatedDate }}
        </time>
      </div>
    </article>
  </router-link>
</template>

<script>
import { computed, toRefs } from 'vue'

export default {
  name: 'FolderDocument',
  props: {
    document: {
      type: Object,
      required: true,
    },
    folderName: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const { document } = toRefs(props)

    const paragraphs = computed(() =>
      document.value.description.split('\n').filter((paragraph) => paragraph.length > 0),
    )

    const formattedCreatedDate = computed(() =>
      new Date(document.value.created).toLocaleString(),
    )

    return {
      paragraphs,
      formattedCreatedDate,
    }
  },
}
</script>
