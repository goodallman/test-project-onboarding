import type { CollectionConfig } from "payload"

import { isAdmin } from "../access"

type AccessUser = {
    id?: string
    role?: "admin" | "editor"
}

export const Users: CollectionConfig = {
    slug: "users",
    admin: {
        defaultColumns: ["email", "role", "createdAt"],
        useAsTitle: "email",
    },
	auth: true,
    access: {
        read: isAdmin,
        update: ({ req, id }) => {
            const user = req.user

            if (!user) {
                return false
            }

            if (user.role === "admin") {
                return true
            }

            return user.id === id
        },
        delete: isAdmin,
    },
    fields: [
        {
            name: "role",
            type: "select",
            defaultValue: "editor",
            required: true,
            options: [
                {
                    label: "Admin",
                    value: "admin",
                },
                {
                    label: "Editor",
                    value: "editor",
                },
            ],
        },
    ],
}
