import type { CollectionConfig } from "payload"

import { canMutateAuthor, isAdmin } from "../access"

const slugify = (value: string) =>
    value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")

export const Authors: CollectionConfig = {
    slug: "authors",
    admin: {
        defaultColumns: ["name", "slug", "user"],
    },
    access: {
        read: () => true,
        create: ({ req }) => Boolean(req.user),
        update: canMutateAuthor,
        delete: isAdmin,
    },
    fields: [
        {
            name: "name",
            type: "text",
            required: true,
        },
        {
            name: "slug",
            type: "text",
            unique: true
        },
        {
            name: "bio",
            type: "richText",
        },
        {
            name: "avatar",
            type: "upload",
            relationTo: "media",
        },
        {
            name: "user",
            type: "relationship",
            relationTo: "users",
        },
    ],
}
