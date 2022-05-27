<template>
  <div>
    <h1>404 Not Found</h1>
    <p>Whoever sent you this link got you lost!</p>
    <button type="button" class="hover:underline" @click="router.back()">Go back</button>
    or
    <router-link :to="{ name: 'home' }" class="hover:underline">go home</router-link>
  </div>
</template>

<script>
import { useRouter } from '../router'

export default {
  setup() {
    const router = useRouter()

    return {
      router,
    }
  },
}
</script>
