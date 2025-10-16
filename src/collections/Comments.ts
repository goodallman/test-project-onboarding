import type { CollectionConfig } from 'payload'

import { canReadComment, canUpdateOwnComment, isAdmin } from '../access'

export const Comments: CollectionConfig = {
  slug: 'comments',
  admin: {
    defaultColumns: ['post', 'user', 'approved', 'createdAt'],
  },
  access: {
    read: canReadComment,
    create: () => true,
    update: ({ req, id }) => canUpdateOwnComment({ req, id }) || isAdmin({ req, id }),
    delete: isAdmin,
  },
  fields: [
    {
      name: 'post',
      type: 'relationship',
      relationTo: "posts",
      required: true
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users' as const,
    },
    {
      name: 'body',
      type: 'textarea',
      required: true,
    },
    {
      name: 'approved',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
}
