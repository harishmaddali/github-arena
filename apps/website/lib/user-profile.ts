import type { User } from "@supabase/supabase-js"

export function getGitHubUsername(user: User | null) {
  if (!user) {
    return null
  }

  const username =
    user.user_metadata.user_name ??
    user.user_metadata.preferred_username ??
    user.user_metadata.username

  return typeof username === "string" && username.length > 0 ? username : null
}

export function getDisplayName(user: User | null) {
  if (!user) {
    return ""
  }

  const fullName = user.user_metadata.full_name
  const name = user.user_metadata.name

  if (typeof fullName === "string" && fullName.length > 0) {
    return fullName
  }

  if (typeof name === "string" && name.length > 0) {
    return name
  }

  return getGitHubUsername(user) ?? user.email ?? "User"
}

export function getAvatarUrl(user: User | null) {
  if (!user) {
    return ""
  }

  const avatar =
    user.user_metadata.avatar_url ?? user.user_metadata.picture ?? null

  return typeof avatar === "string" ? avatar : ""
}
