<template>
  <img
    class="cursor-pointer inline-block border-2 border-transparent"
    :src="document.thumbnail"
    :title="document.description || document.name"
    :alt="document.description || document.name"
    @click="modal.open(document.id)"
  />

  <Modal :id="document.id">
    <LoadingImage
      class="max-w-full max-h-full"
      :src="document.url"
      :title="document.description || document.name"
      :alt="document.description || document.name"
    />
  </Modal>
</template>

<script>
import useModal from '../use/modal'
import LoadingImage from './LoadingImage.vue'
import Modal from './Modal.vue'

export default {
  name: 'FolderImage',
  components: {
    LoadingImage,
    Modal,
  },
  props: {
    document: {
      type: Object,
      required: true,
    },
  },
  setup() {
    const modal = useModal()

    return {
      modal,
    }
  },
}
</script>
