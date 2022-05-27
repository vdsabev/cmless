import { createApp } from 'vue'

import './assets/tailwind.css'

import App from './App.vue'

import { getSettings } from './api'
import { createRouter } from './router'
import { settingsRef } from './use/settings'

getSettings()
  .then((settings) => {
    settingsRef.value = settings

    const app = createApp(App)
    app.use(createRouter(settings))
    app.mount('main')
  })
  .catch((error) => {
    window.alert(error.toString())
  })
