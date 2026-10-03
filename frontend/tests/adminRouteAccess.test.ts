import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getAdminRouteAccess } from '../src/services/adminRouteAccess'

test('admin route waits while authentication or profile role is loading', () => {
  assert.equal(getAdminRouteAccess({
    loading: true,
    authenticated: false,
    role: null,
    profileError: '',
  }), 'loading')
})

test('admin route sends unauthenticated users to login', () => {
  assert.equal(getAdminRouteAccess({
    loading: false,
    authenticated: false,
    role: null,
    profileError: '',
  }), 'login')
})

test('admin route sends authenticated customers to the shop', () => {
  assert.equal(getAdminRouteAccess({
    loading: false,
    authenticated: true,
    role: 'customer',
    profileError: '',
  }), 'shop')
})

test('admin route allows authenticated admins', () => {
  assert.equal(getAdminRouteAccess({
    loading: false,
    authenticated: true,
    role: 'admin',
    profileError: '',
  }), 'allow')
})

test('admin route denies access when the profile role cannot be verified', () => {
  assert.equal(getAdminRouteAccess({
    loading: false,
    authenticated: true,
    role: null,
    profileError: 'Unable to verify your account role.',
  }), 'error')
})
