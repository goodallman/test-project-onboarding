// storage-adapter-import-placeholder
import { sqliteAdapter } from "@payloadcms/db-sqlite"
import { lexicalEditor } from "@payloadcms/richtext-lexical"
import path from "path"
import { buildConfig } from "payload"
import { fileURLToPath } from "url"
import sharp from "sharp"

import { Users } from "./collections/Users"
import { Authors } from "./collections/Authors"
import { Posts } from "./collections/Posts"
import { Media } from "./collections/Media"
import { Comments } from "./collections/Comments"

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
    admin: {
        user: Users.slug,
        importMap: {
            baseDir: path.resolve(dirname),
        },
    },
    collections: [Users, Authors, Posts, Media, Comments],
    editor: lexicalEditor(),
    secret: process.env.PAYLOAD_SECRET || "",
    serverURL: process.env.SERVER_URL,
    typescript: {
        outputFile: path.resolve(dirname, "payload-types.ts"),
    },
    db: sqliteAdapter({
        client: {
            url: process.env.DATABASE_URI || "",
        },
    }),
    sharp
})
