// Type definitions shared between client and server applications

export type Settings = {
  version: string
  baseUrl: string
  title: string
  description: string
  pages: Pages
  datasources?: Record<string, { url: string; options: Record<string, any> }>
}

type Pages = Record<string, Page | Page[]>

type Page = { component: string } | { url: string }

export type FolderDocument = {
  created: string
  description: string
  id: string
  image: string
  name: string
  thumbnail: string
  type: string
}
