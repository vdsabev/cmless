<template>
  <nav v-if="pages.length > 1">
    <router-link
      v-for="page in pages"
      :key="page.name"
      :to="page"
      :class="{ 'router-link-active': isChildRouteActive(page) }"
      class="inline-block text-gray-900 font-bold capitalize hover:underline"
    >
      {{ page.title }}
    </router-link>
  </nav>
</template>

<script>
import { pathToName, pathToTitle, useRoute } from '../router'
import { usePaths } from '../use/settings'

export default {
  name: 'Navigation',
  setup() {
    const pages = usePaths().map((path) => ({
      path,
      name: pathToName(path),
      title: pathToTitle(path),
    }))

    const route = useRoute()
    function isChildRouteActive(/** @type {typeof pages.value[0]} */ page) {
      const pagePathParts = page.path.split('/')
      const routePathParts = route.path.split('/')
      return pagePathParts.every((part, index) => part === routePathParts[index])
    }

    return {
      pages,
      isChildRouteActive,
    }
  },
}
</script>

<style scoped>
nav a.router-link-active,
nav a.router-link-exact-active {
  @apply text-red-700;
}

nav a + a::before {
  @apply mx-2;
  content: '|';
}
</style>
