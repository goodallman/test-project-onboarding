import { promises as fs } from "fs"
import os from "os"
import path from "path"
import dotenv from "dotenv"
import payload, { type Payload } from "payload"

import type { Author, Media, Post, User } from "../src/payload-types"

dotenv.config()

const SINGLE_PIXEL_GIF = "R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="

const ensureSeedAsset = async (fileName: string, base64Data: string) => {
    const assetDir = path.resolve(os.tmpdir(), "payload-seed-assets")
    await fs.mkdir(assetDir, { recursive: true })
    const filePath = path.resolve(assetDir, fileName)
    await fs.writeFile(filePath, Buffer.from(base64Data, "base64"))
    return filePath
}

const slugify = (value: string) =>
    value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")

type RichTextField = Post["body"]

const createRichText = (paragraphs: string[]): RichTextField => ({
    root: {
        type: "root" as const,
        format: "" as const,
        indent: 0,
        version: 1,
        direction: "ltr" as const,
        children: paragraphs.map((text) => ({
            type: "paragraph" as const,
            format: "" as const,
            indent: 0,
            version: 1,
            direction: "ltr" as const,
            children: [
                {
                    type: "text" as const,
                    version: 1,
                    detail: 0,
                    format: 0 as const,
                    mode: "normal" as const,
                    style: "" as const,
                    text,
                },
            ],
        })),
    },
}) as RichTextField

const collectionsToClear = ["comments", "posts", "authors", "media", "users"] as const

type SeedCollection = (typeof collectionsToClear)[number]

type SeededUser = User

type SeededMedia = Media & { seedKey: string }

type SeededAuthor = Author

type SeededPost = Post

type InitConfig = NonNullable<Parameters<typeof payload.init>[0]["config"]>

const loadPayloadConfig = async (): Promise<InitConfig> => {
    const mod = await import("../src/payload.config")
    return (mod.default ?? mod) as InitConfig
}

const ensureConfig = () => {
    if (!process.env.PAYLOAD_SECRET) {
        throw new Error("PAYLOAD_SECRET must be set before running the seed script.")
    }

    if (!process.env.DATABASE_URI) {
        throw new Error("DATABASE_URI must be set before running the seed script.")
    }
}

const clearCollection = async (payloadClient: Payload, collection: SeedCollection) => {
    let page = 1

    // Clear existing documents so the seed can be re-run.
    while (true) {
        const existing = await payloadClient.find({
            collection,
            limit: 50,
            depth: 0,
            page,
            overrideAccess: true,
        })

        if (!existing.docs.length) {
            break
        }

        for (const doc of existing.docs) {
            await payloadClient.delete({
                collection,
                id: doc.id,
                overrideAccess: true,
            })
        }

        if (!existing.hasNextPage) {
            break
        }

        page += 1
    }
}

const seedUsers = async (payloadClient: Payload): Promise<SeededUser[]> => {
    const usersSeed = [
        {
            email: "admin@example.com",
            password: "payload",
            role: "admin" as const,
        },
        {
            email: "editor@example.com",
            password: "payload",
            role: "editor" as const,
        },
        {
            email: "contributor@example.com",
            password: "payload",
            role: "editor" as const,
        },
    ]

    const createdUsers: SeededUser[] = []

    for (const data of usersSeed) {
        const user = await payloadClient.create({
            collection: "users",
            data,
            overrideAccess: true,
        })

        createdUsers.push(user)
    }

    return createdUsers
}

const seedMedia = async (payloadClient: Payload): Promise<SeededMedia[]> => {
    const mediaSeed = [
        {
            key: "team-huddle",
            fileName: "team-huddle.gif",
            alt: "Team aligning in front of a whiteboard",
            base64: SINGLE_PIXEL_GIF,
        },
        {
            key: "coffee-chat",
            fileName: "coffee-chat.gif",
            alt: "Pouring coffee before a busy strategy session",
            base64: SINGLE_PIXEL_GIF,
        },
    ]

    const createdMedia: SeededMedia[] = []

    for (const item of mediaSeed) {
        const filePath = await ensureSeedAsset(item.fileName, item.base64)

        const created = await payloadClient.create({
            collection: "media",
            filePath,
            data: {
                alt: item.alt,
            },
            overrideAccess: true,
        })

        createdMedia.push({ ...created, seedKey: item.key })
    }

    return createdMedia
}

const seedAuthors = async (
    payloadClient: Payload,
    media: SeededMedia[],
    users: SeededUser[],
): Promise<SeededAuthor[]> => {
    const mediaByKey = new Map(media.map((item) => [item.seedKey, item]))
    const usersByEmail = new Map(users.map((user) => [user.email, user]))

    const authorsSeed = [
        {
            name: "Evelyn Harper",
            bio: [
                "Evelyn heads up our client success practice and loves turning messy kickoffs into predictable wins.",
            ],
            avatar: mediaByKey.get("team-huddle"),
            userEmail: "editor@example.com",
        },
        {
            name: "Marcus Reed",
            bio: [
                "Marcus keeps our revenue ops humming and shares practical process experiments every month.",
            ],
            avatar: mediaByKey.get("coffee-chat"),
            userEmail: "contributor@example.com",
        },
        {
            name: "Priya Chandrasekhar",
            bio: [
                "Priya brings a product lens to service delivery and writes about sustainable growth systems.",
            ],
            avatar: mediaByKey.get("team-huddle"),
            userEmail: "admin@example.com",
        },
    ]

    const createdAuthors: SeededAuthor[] = []

    for (const author of authorsSeed) {
        const doc = await payloadClient.create({
            collection: "authors",
            data: {
                name: author.name,
                slug: slugify(author.name),
                bio: createRichText(author.bio) as Author["bio"],
                avatar: author.avatar?.id ?? null,
                user: usersByEmail.get(author.userEmail?.toUpperCase() ?? "")?.id ?? null,
            },
            overrideAccess: true,
        })

        createdAuthors.push(doc)
    }

    return createdAuthors
}

const seedPosts = async (
    payloadClient: Payload,
    authors: SeededAuthor[],
    media: SeededMedia[],
): Promise<SeededPost[]> => {
    const mediaByKey = new Map(media.map((item) => [item.seedKey, item]))
    const authorsBySlug = new Map(authors.map((author) => [author.slug, author]))

    const postsSeed = [
        {
            title: "How We Run Onboarding Sprints That Stick",
            excerpt:
                "A five-day playbook for turning onboarding chaos into a predictable sequence that teams can repeat.",
            body: [
                "When we first adopted sprint-based onboarding we kept running into the same friction points.",
                "Here is the checklist we now run every single time we start with a new client.",
            ],
            categories: "Operations, Client Success",
            coverImage: mediaByKey.get("team-huddle"),
            authorSlug: slugify("Evelyn Harper"),
            publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            title: "Revenue Ops Metrics That Actually Matter",
            excerpt:
                "Stop swimming in dashboards. These four numbers tell you whether your revenue engine is healthy.",
            body: [
                "A tidy metrics stack is the difference between a gut-feel plan and a disciplined growth engine.",
                "We distilled the list to the four metrics we review every Monday.",
            ],
            categories: "Revenue, Analytics",
            coverImage: mediaByKey.get("coffee-chat"),
            authorSlug: slugify("Marcus Reed"),
            publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            title: "Why Product Thinking Belongs In Service Firms",
            excerpt:
                "Borrow the best bits of product management to make your delivery more resilient and scalable.",
            body: [
                "Service businesses can borrow product rituals without pretending to ship software.",
                "These are the three rituals that leveled up our retros and roadmap cadence.",
            ],
            categories: "Product, Strategy",
            coverImage: mediaByKey.get("team-huddle"),
            authorSlug: slugify("Priya Chandrasekhar"),
            publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
    ]

    const createdPosts: SeededPost[] = []

    for (const post of postsSeed) {
        const author = authorsBySlug.get(post.authorSlug)

        if (!author) {
            throw new Error(`Missing author for slug "${post.authorSlug}" while seeding posts.`)
        }

        const doc = await payloadClient.create({
            collection: "posts",
            data: {
                title: post.title,
                slug: slugify(post.title),
                excerpt: post.excerpt,
                body: createRichText(post.body),
                categories: post.categories,
                coverImage: post.coverImage?.id ?? undefined,
                author: author.id,
                _status: "published",
                publishedAt: post.publishedAt,
            },
            overrideAccess: true,
        })

        createdPosts.push(doc)
    }

    return createdPosts
}

const seedComments = async (
    payloadClient: Payload,
    posts: SeededPost[],
    users: SeededUser[],
) => {
    const postsBySlug = new Map(posts.map((post) => [post.slug, post]))
    const usersByEmail = new Map(users.map((user) => [user.email, user]))

    const commentsSeed = [
        {
            body: "Loved this breakdown—we stole your kickoff checklist immediately.",
            approved: true,
            postSlug: slugify("How We Run Onboarding Sprints That Stick"),
            userEmail: "editor@example.com",
        },
        {
            body: "Your Monday metric stack saved us hours. Great piece!",
            approved: true,
            postSlug: slugify("Revenue Ops Metrics That Actually Matter"),
            userEmail: "contributor@example.com",
        },
        {
            body: "Curious how you set expectations with clients before the sprint starts.",
            approved: false,
            postSlug: slugify("How We Run Onboarding Sprints That Stick"),
            userEmail: "admin@example.com",
        },
    ]

    for (const comment of commentsSeed) {
        const post = postsBySlug.get(comment.postSlug)
        const user = usersByEmail.get(comment.userEmail)

        if (!post) {
            throw new Error(`Missing post for slug "${comment.postSlug}" while seeding comments.`)
        }

        await payloadClient.create({
            collection: "comments",
            data: {
                body: comment.body,
                approved: comment.approved,
                post: post.id,
                user: user?.id ?? null,
            },
            overrideAccess: true,
        })
    }
}

const seed = async () => {
    ensureConfig()

    const payloadConfig = await loadPayloadConfig()

    const payloadClient = await payload.init({
        config: payloadConfig,
    })

    try {
        for (const collection of collectionsToClear) {
            await clearCollection(payloadClient, collection)
        }

        const users = await seedUsers(payloadClient)
        const media = await seedMedia(payloadClient)
        const authors = await seedAuthors(payloadClient, media, users)
        const posts = await seedPosts(payloadClient, authors, media)
        await seedComments(payloadClient, posts, users)

        payload.logger.info("Seed data successfully created.")
    } catch (error) {
        payload.logger.error("Failed to seed database", error)
        console.error(error)
        throw error
    }
}

seed()
    .then(() => {
        process.exit(0)
    })
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
