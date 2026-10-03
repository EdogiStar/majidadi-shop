const MAX_PROFILE_AVATAR_SIZE = 5 * 1024 * 1024
const PROFILE_AVATAR_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export function getProfileInitials(fullName: string | null | undefined, email = '') {
  const name = fullName?.trim()
  const source = name || email.split('@')[0] || 'Admin'
  const parts = source.trim().split(/\s+/).filter(Boolean)
  return parts.length > 1
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : (parts[0]?.slice(0, 2) || 'AD').toUpperCase()
}

export function validateProfileAvatar(file: Pick<File, 'type' | 'size'>) {
  if (!PROFILE_AVATAR_TYPES.has(file.type)) {
    return 'Choose a JPEG, PNG, or WebP image.'
  }
  if (file.size > MAX_PROFILE_AVATAR_SIZE) {
    return 'The profile photo must be 5 MB or smaller.'
  }
  return null
}
