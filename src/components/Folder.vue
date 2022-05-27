<template>
  <div>
    <component
      v-for="document in documents"
      :key="document.id"
      :is="componentsByType[document.type]"
      :document="document"
      v-bind="propsByType[document.type]"
    />
  </div>
</template>

<script>
import FolderDocument from './FolderDocument.vue'
import FolderImage from './FolderImage.vue'

export default {
  name: 'Folder',
  props: {
    documents: {
      type: Array,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    return {
      componentsByType: {
        googleDoc: FolderDocument,
        image: FolderImage,
      },
      propsByType: {
        googleDoc: {
          folderName: props.name,
        },
      },
    }
  },
}
</script>
