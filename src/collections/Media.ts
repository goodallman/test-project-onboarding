import path from 'path'

import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  upload: {
    staticDir: path.resolve(process.cwd(), 'media'),
    mimeTypes: ['image/*'],
    imageSizes: [
      {
        name: 'thumbnail',
        width: 320,
        height: 200,
        position: 'centre',
      },
      {
        name: 'card',
        width: 800,
        height: 480,
        position: 'centre',
      },
    ],
  },
}
