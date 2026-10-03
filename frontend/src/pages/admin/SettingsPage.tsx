import { useRef, useState, type FormEvent, type ChangeEvent } from 'react'
import { Avatar } from '../../components/admin/AdminLayout'
import { useAuth } from '../../context/useAuth'
import { getProfileInitials, validateProfileAvatar } from '../../services/profilePresentation'

function formatDate(value: string | undefined) {
  if (!value) return 'Not available'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Not available'
    : date.toLocaleDateString('en-NG', { dateStyle: 'medium' })
}

export function SettingsPage() {
  const { user, role, profile, profileError, refreshProfile, updateProfile, updateAvatar } = useAuth()
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    setSaving(true)
    setError('')
    setNotice('')
    const result = await updateProfile({
      fullName: String(values.get('full_name') ?? ''),
      phone: String(values.get('phone') ?? ''),
    })
    setSaving(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setNotice('Profile updated successfully.')
  }

  const selectAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file) return
    const validationError = validateProfileAvatar(file)
    if (validationError) {
      setError(validationError)
      setNotice('')
      return
    }
    setUploading(true)
    setError('')
    setNotice('')
    const result = await updateAvatar(file)
    setUploading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setNotice('Profile photo updated successfully.')
  }

  const name = profile?.full_name?.trim() || user?.email || 'Administrator'

  return <div className="settings-grid">
    <section className="card settings-card">
      <div className="settings-title"><div><h2>Store information</h2><p>Details customers see across your store.</p></div><button className="button button-secondary">Save changes</button></div>
      <div className="form-grid"><label>Store name<input defaultValue="Majidadi General Services" /></label><label>Support email<input defaultValue="hello@majidadi.com" /></label><label className="full">Store address<textarea defaultValue="Shop No. 2, Opposite Sunset, Along Abaji Area Council, FCT Abuja" rows={3} /></label><label>Currency<select defaultValue="Nigerian Naira (₦)"><option>Nigerian Naira (₦)</option></select></label><label>Timezone<select defaultValue="Africa/Lagos (WAT)"><option>Africa/Lagos (WAT)</option></select></label></div>
    </section>

    <section className="card settings-card">
      <div className="settings-title"><div><h2>Admin profile</h2><p>Manage your administrator account details.</p></div></div>
      <div className="profile-settings">
        <Avatar initials={getProfileInitials(profile?.full_name, user?.email)} imageUrl={profile?.avatar_url} />
        <div><strong>{name}</strong><span>{role === 'admin' ? 'Administrator' : 'Account'} · Joined {formatDate(profile?.created_at)}</span>
          <button className="text-link" type="button" onClick={() => fileInput.current?.click()} disabled={uploading}>{uploading ? 'Uploading photo…' : 'Change avatar'}</button>
          <input ref={fileInput} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void selectAvatar(event)} aria-label="Choose profile photo" />
        </div>
      </div>
      {profileError && <div className="admin-error profile-feedback" role="alert">{profileError}<button className="button button-secondary" type="button" onClick={() => void refreshProfile()}>Retry</button></div>}
      {error && <p className="admin-error profile-feedback" role="alert">{error}</p>}
      {notice && <p className="admin-notice profile-feedback" role="status">{notice}</p>}
      <form className="profile-form" key={profile?.updated_at ?? 'unavailable'} onSubmit={(event) => void saveProfile(event)}>
        <div className="form-grid">
          <label>Full name<input name="full_name" defaultValue={profile?.full_name ?? ''} autoComplete="name" maxLength={120} required /></label>
          <label>Email address<input type="email" value={user?.email ?? ''} readOnly aria-describedby="profile-email-help" /><small id="profile-email-help">Email is managed by your authenticated account.</small></label>
          <label>Phone number<input name="phone" type="tel" defaultValue={profile?.phone ?? ''} autoComplete="tel" maxLength={40} /></label>
          <label>Role<input value={role === 'admin' ? 'Administrator' : 'Customer'} readOnly /></label>
        </div>
        <div className="profile-form-actions"><button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</button></div>
      </form>
    </section>
  </div>
}
