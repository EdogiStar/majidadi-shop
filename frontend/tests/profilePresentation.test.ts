import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getProfileInitials, validateProfileAvatar } from '../src/services/profilePresentation'

test('profile initials use the first and last name characters', () => {
  assert.equal(getProfileInitials('Ada Lovelace'), 'AL')
  assert.equal(getProfileInitials('  Ada   Byron Lovelace  '), 'AL')
})

test('profile initials fall back to the authenticated email or a generic label', () => {
  assert.equal(getProfileInitials('', 'admin@example.test'), 'AD')
  assert.equal(getProfileInitials(null, ''), 'AD')
})

test('avatar validation accepts supported images up to 5 MB', () => {
  assert.equal(validateProfileAvatar({ type: 'image/webp', size: 5 * 1024 * 1024 }), null)
})

test('avatar validation rejects unsupported types and oversized files', () => {
  assert.match(validateProfileAvatar({ type: 'image/gif', size: 10 }) ?? '', /JPEG, PNG, or WebP/)
  assert.match(validateProfileAvatar({ type: 'image/png', size: 5 * 1024 * 1024 + 1 }) ?? '', /5 MB/)
})
