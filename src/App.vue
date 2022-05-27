<template>
  <div class="max-w-3xl mx-auto p-4">
    <Navigation class="py-4" />
    <router-view v-slot="{ Component, route }">
      <Transition name="fade" mode="out-in">
        <component :key="route.path" :is="Component" />
      </Transition>
    </router-view>
  </div>

  <div :id="modal.containerId"></div>
</template>

<script>
import Navigation from './components/Navigation.vue'
import useModal from './use/modal'

export default {
  name: 'App',
  components: {
    Navigation,
  },
  setup() {
    const modal = useModal()

    return {
      modal,
    }
  },
}
</script>

<style>
main {
  @apply font-sans;
  @apply antialiased;
  @apply text-gray-900;
}

.fade-enter-active,
.fade-leave-active {
  @apply transition-opacity;
  @apply duration-300;
  @apply ease-linear;
}

.fade-enter-from,
.fade-leave-to {
  @apply opacity-0;
}
</style>
