import { useState, type FormEvent, type ReactNode } from 'react'
import { useAuth } from '../../context/useAuth'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function AuthPage({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <main className="customer-page"><section className="customer-card"><span className="section-kicker">MAJIDADI CUSTOMER ACCOUNT</span><h1>{title}</h1><p className="customer-description">{description}</p>{children}</section></main>
}

export function LoginPage() {
  const { signIn, loading, configurationError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return
    if (!EMAIL_PATTERN.test(email.trim())) {
      setMessage('Enter a valid email address.')
      return
    }
    if (!password) {
      setMessage('Enter your password.')
      return
    }
    setSubmitting(true)
    setMessage('')
    const result = await signIn(email.trim().toLowerCase(), password)
    setSubmitting(false)
    if (result.error) {
      setMessage(result.error)
      return
    }
    window.location.assign('/account')
  }

  return <AuthPage title="Welcome back" description="Log in to view and manage your orders.">
    <form className="customer-form" onSubmit={submit} noValidate>
      <label>Email address<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
      <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
      {(message || configurationError) && <p className="customer-error" role="alert">{message || configurationError}</p>}
      <button className="store-button store-button-dark" disabled={loading || submitting}>{submitting ? 'Logging in…' : 'Log in'}</button>
    </form>
    <p className="customer-switch">New to Majidadi? <a href="/register">Create an account</a></p>
  </AuthPage>
}

export function RegisterPage() {
  const { signUp, loading, configurationError } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return
    if (!fullName.trim()) return setMessage('Enter your full name.')
    if (!EMAIL_PATTERN.test(email.trim())) return setMessage('Enter a valid email address.')
    if (password.length < 8) return setMessage('Your password must be at least 8 characters.')
    if (password !== confirmation) return setMessage('The passwords do not match.')

    setSubmitting(true)
    setMessage('')
    const result = await signUp(fullName.trim(), email.trim().toLowerCase(), password)
    setSubmitting(false)
    if (result.error) {
      setMessage(result.error)
      return
    }
    window.location.assign('/account')
  }

  return <AuthPage title="Create your account" description="Register to keep track of your orders in one place.">
    <form className="customer-form" onSubmit={submit} noValidate>
      <label>Full name<input autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} /></label>
      <label>Email address<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
      <label>Password<input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
      <label>Confirm password<input type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label>
      {(message || configurationError) && <p className="customer-error" role="alert">{message || configurationError}</p>}
      <button className="store-button store-button-dark" disabled={loading || submitting}>{submitting ? 'Creating account…' : 'Create account'}</button>
    </form>
    <p className="customer-switch">Already registered? <a href="/login">Log in</a></p>
  </AuthPage>
}

export function CustomerGate({ children }: { children: ReactNode }) {
  const { user, loading, configurationError } = useAuth()
  if (loading) return <main className="customer-page"><p className="customer-state">Restoring your account session…</p></main>
  if (!user) return <main className="customer-page"><section className="customer-card"><h1>Log in to continue</h1><p className="customer-description">{configurationError || 'This page is available to registered customers.'}</p><a className="store-button store-button-dark" href="/login">Log in</a><a className="customer-secondary-link" href="/track-order">Track a guest order</a></section></main>
  return children
}

export function AccountPage() {
  const { user, signOut } = useAuth()
  const [message, setMessage] = useState('')
  const fullName = user?.user_metadata.full_name || user?.user_metadata.name || 'Customer'

  const logout = async () => {
    const result = await signOut()
    if (result.error) setMessage(result.error)
    else window.location.assign('/')
  }

  return <CustomerGate><main className="customer-page"><section className="customer-card"><span className="section-kicker">YOUR ACCOUNT</span><h1>Account</h1><dl className="account-details"><div><dt>Full name</dt><dd>{fullName}</dd></div><div><dt>Email</dt><dd>{user?.email}</dd></div></dl>{message && <p className="customer-error" role="alert">{message}</p>}<button className="store-button store-button-dark" onClick={() => void logout()}>Log out</button></section></main></CustomerGate>
}
