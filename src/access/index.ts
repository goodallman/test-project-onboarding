import type { AccessArgs } from "payload"

type AccessUser = {
    id?: string
    role?: "admin" | "editor"
}

const getAccessUser = (req: AccessArgs["req"]): AccessUser | null => {
    return (req.user as AccessUser | null) ?? null
}

export const isAdmin = ({ req }: AccessArgs) => {
    const user = getAccessUser(req)
    return user?.role === "admin"
}

export const isEditor = ({ req }: AccessArgs) => {
    const user = getAccessUser(req)
    return user?.role === "editor"
}

export const isLoggedIn = ({ req }: AccessArgs) => {
    const user = getAccessUser(req)
    return Boolean(user)
}

export const canReadPost = ({ req }: AccessArgs) => {
    const user = getAccessUser(req)
    if (user?.role === "admin" || user?.role === "editor") {
        return true
    }

    return true
}

export const canMutateAuthor = ({ req }: AccessArgs) => {
    const user = getAccessUser(req)
    if (user?.role === "admin") {
        return true
    }

    return {
        user: {
            equals: user?.id,
        },
    }
}

export const canReadComment = ({ req }: AccessArgs) => {
    const user = getAccessUser(req)
    if (user?.role === "admin" || user?.role === "editor") {
        return true
    }

    return true
}

export const canUpdateOwnComment = ({ req }: AccessArgs) => {
    const user = getAccessUser(req)

    return {
        user: {
            equals: user?.id,
        },
    }
}
