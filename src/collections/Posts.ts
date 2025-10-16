import type { CollectionConfig } from "payload"

import { canReadPost, isAdmin, isEditor } from "../access"

export const Posts: CollectionConfig = {
    slug: "posts",
    versions: {
        drafts: {
            validate: true
        },
    },
    admin: {
        defaultColumns: ["title", "slug", "author", "_status", "publishedAt"],
    },
    access: {
        read: canReadPost,
        create: (args) => isAdmin(args) || isEditor(args),
        update: (args) => isAdmin(args) || isEditor(args),
        delete: isAdmin,
    },
    fields: [
        {
            name: "title",
            type: "text",
            required: true,
        },
        {
            name: "slug",
            type: "text",
            unique: true,
            index: true,
            admin: {
                position: "sidebar",
            },
        },
        {
            name: "excerpt",
            type: "textarea",
            admin: {
                description: "Short summary for listings.",
            },
        },
        {
            name: "coverImage",
            type: "upload",
            relationTo: "media",
        },
        {
            name: "body",
            type: "richText",
            required: true,
        },
        {
            name: "categories",
            type: "text",
        },
        {
            name: "author",
            type: "relationship",
            relationTo: "authors",
            required: true,
        },
        {
            name: "publishedAt",
            type: "date",
            admin: {
                position: "sidebar",
            },
            validate: (value, { data }) => {
                if (!value) {
                    return true
                }

                const parsed = new Date(value)

                if (parsed.getTime() > Date.now()) {
                    return "Published posts cannot have a future date."
                }

                return true
            },
        },
    ],
}
