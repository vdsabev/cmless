import * as VueRouter from 'vue-router'

export { useLink, useRoute, useRouter } from 'vue-router'

import { getDocumentUrlById } from './api'

import Document from './pages/Document.vue'
import NotFound from './pages/NotFound.vue'
import Page from './pages/Page.vue'
import PageGuard from './pages/PageGuard.vue'

export function createRouter({ pages, data }) {
  const router = VueRouter.createRouter({
    history: VueRouter.createWebHistory(),
    routes: [
      ...Object.entries(pages).map(([path, page]) => ({
        path,
        name: pathToName(path),
        component: Page,
        props: () => ({ page, name: pathToName(path), data }),
      })),
      {
        path: '/:folderName/:documentId/:documentName?',
        name: 'folder-document',
        component: PageGuard,
        props({ params }) {
          const page = pages[`/${params.folderName}`]
          return {
            exists: page != null,
            component: Document,
            url: getDocumentUrlById(`${params.documentId}`),
          }
        },
      },
      {
        path: '/:pathMatch(.*)*',
        name: 'not-found',
        component: NotFound,
      },
    ],
  })

  return router
}

export function pathToName(path) {
  return path.replace(/\//g, '').replace(/\s+/, '-').trim() || 'home'
}

export function pathToTitle(path) {
  return path.replace(/[\/-]/g, ' ').trim() || 'home'
}
