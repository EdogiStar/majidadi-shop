import { useState, type FormEvent } from 'react'
import { StoreIcon } from '../../components/store/StoreHeader'
import { useCart } from '../../context/cartHooks'
import { formatNaira } from '../../context/cartUtils'

type DeliveryMethod = 'delivery' | 'pickup'
type FormValues = {
  fullName: string
  email: string
  phone: string
  address: string
  city: string
  state: string
}
type FormErrors = Partial<Record<keyof FormValues, string>>

const initialValues: FormValues = { fullName: '', email: '', phone: '', address: '', city: '', state: '' }

function priceValue(price: string) {
  return Number(price.replace(/[^\d.]/g, '')) || 0
}

function ProductVisual({ visual, tone }: { visual: string; tone: string }) {
  const label = visual === 'iphone' ? '15' : visual === 'laptop' ? 'M3' : visual === 'headphones' ? 'XM5' : 'NOTE'
  return <div className={`checkout-item-visual product-visual-${tone}`}><div className={`product-art product-art-${visual}`}><span>{label}</span></div></div>
}

function validate(values: FormValues, deliveryMethod: DeliveryMethod) {
  const errors: FormErrors = {}
  if (!values.fullName.trim()) errors.fullName = 'Enter your full name.'
  if (!values.email.trim()) errors.email = 'Enter your email address.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = 'Enter a valid email address.'
  const phoneDigits = values.phone.replace(/\D/g, '')
  if (!values.phone.trim()) errors.phone = 'Enter your phone number.'
  else if (phoneDigits.length < 7) errors.phone = 'Enter a valid phone number.'
  if (deliveryMethod === 'delivery') {
    if (!values.address.trim()) errors.address = 'Enter your delivery address.'
    if (!values.city.trim()) errors.city = 'Enter your city.'
    if (!values.state.trim()) errors.state = 'Enter your state.'
  }
  return errors
}

export function CheckoutPage() {
  const { items, subtotal } = useCart()
  const [values, setValues] = useState(initialValues)
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('delivery')
  const [errors, setErrors] = useState<FormErrors>({})
  const [message, setMessage] = useState('')
  const deliveryFee = deliveryMethod === 'pickup' ? 0 : subtotal >= 100000 ? 0 : 2500
  const total = subtotal + deliveryFee

  if (items.length === 0) return <main className="checkout-page"><div className="store-container checkout-empty"><div className="cart-empty-icon"><StoreIcon name="cart" size={28} /></div><span className="section-kicker">NOTHING TO CHECK OUT YET</span><h1>Your cart is empty</h1><p>Add products to your cart before continuing to checkout.</p><a href="/shop" className="store-button store-button-dark">Continue Shopping <StoreIcon name="arrow" size={16} /></a></div></main>

  const updateValue = (field: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setMessage('')
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validate(values, deliveryMethod)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setMessage('')
      return
    }
    // The backend must recalculate the authoritative delivery fee and total before creating an order or payment.
    setMessage('Paystack payment integration will be available soon.')
  }

  return <main className="checkout-page"><div className="store-container">
    <div className="checkout-topbar"><a href="/cart" className="back-to-shop">← Back to Cart</a><a href="/shop" className="checkout-continue">Continue Shopping</a></div>
    <div className="checkout-heading"><span className="section-kicker">SECURE ORDER DETAILS</span><h1>Checkout</h1><p>Tell us where to deliver your order and how we can reach you.</p></div>
    <form className="checkout-layout" onSubmit={submit} noValidate>
      <div className="checkout-main">
        <section className="checkout-section"><div className="checkout-section-heading"><span>1</span><div><h2>Customer information</h2><p>We will use these details to confirm your order.</p></div></div><div className="checkout-fields checkout-fields-three"><Field label="Full Name" name="fullName" value={values.fullName} error={errors.fullName} onChange={updateValue} autoComplete="name" /><Field label="Email Address" name="email" type="email" value={values.email} error={errors.email} onChange={updateValue} autoComplete="email" /><Field label="Phone Number" name="phone" value={values.phone} error={errors.phone} onChange={updateValue} autoComplete="tel" /></div></section>
        <section className="checkout-section"><div className="checkout-section-heading"><span>2</span><div><h2>Delivery method</h2><p>Choose how you would like to receive your order.</p></div></div><div className="delivery-methods"><DeliveryOption value="delivery" selected={deliveryMethod} onSelect={(value) => { setDeliveryMethod(value); setErrors({}); setMessage('') }} title="Home Delivery" description="Have your order delivered to your address." /><DeliveryOption value="pickup" selected={deliveryMethod} onSelect={(value) => { setDeliveryMethod(value); setErrors({}); setMessage('') }} title="Pickup from Shop" description="Pay online and collect your order from the shop." /></div>{deliveryMethod === 'delivery' && <div className="checkout-fields checkout-fields-address"><Field label="Delivery Address" name="address" value={values.address} error={errors.address} onChange={updateValue} autoComplete="street-address" /><Field label="City" name="city" value={values.city} error={errors.city} onChange={updateValue} autoComplete="address-level2" /><Field label="State" name="state" value={values.state} error={errors.state} onChange={updateValue} autoComplete="address-level1" /></div>}{deliveryMethod === 'pickup' && <p className="pickup-note"><StoreIcon name="cart" size={16} /> Pickup from Shop is free. Collect your order from Shop No. 2, Opposite Sunset, Along Abaji Area Council, FCT Abuja.</p>}</section>
        <section className="checkout-section checkout-payment-section"><div className="checkout-section-heading"><span>3</span><div><h2>Payment</h2><p>Payment will be handled securely through Paystack.</p></div></div><button className="store-button store-button-dark checkout-pay-button" type="submit">Pay with Paystack <StoreIcon name="arrow" size={17} /></button>{message && <p className="checkout-message" role="status">{message}</p>}</section>
      </div>
      <aside className="checkout-summary"><div className="checkout-summary-heading"><h2>Order summary</h2><span>{items.reduce((count, item) => count + item.quantity, 0)} items</span></div><div className="checkout-summary-items">{items.map((item) => <div className="checkout-summary-item" key={item.product.id}><ProductVisual visual={item.product.visual} tone={item.product.tone} /><div><strong>{item.product.name}</strong><span>{item.quantity} × {formatNaira(priceValue(item.product.price))}</span></div><b>{formatNaira(priceValue(item.product.price) * item.quantity)}</b></div>)}</div><div className="checkout-totals"><div><span>Subtotal</span><strong>{formatNaira(subtotal)}</strong></div><div><span>{deliveryMethod === 'pickup' ? 'Pickup from Shop' : 'Delivery'}</span><strong>{deliveryFee ? formatNaira(deliveryFee) : 'Free'}</strong></div><div className="checkout-grand-total"><span>Total</span><strong>{formatNaira(total)}</strong></div></div><p className="checkout-fee-note">{deliveryMethod === 'pickup' ? 'Pickup from Shop is free.' : 'Free delivery on orders of ₦100,000 or more. Orders below that qualify for a ₦2,500 delivery fee.'}</p></aside>
    </form>
  </div></main>
}

function Field({ label, name, type = 'text', value, error, onChange, autoComplete }: { label: string; name: keyof FormValues; type?: string; value: string; error?: string; onChange: (field: keyof FormValues, value: string) => void; autoComplete: string }) {
  const inputId = `checkout-${name}`
  return <label className={`checkout-field ${error ? 'has-error' : ''}`} htmlFor={inputId}><span>{label}</span><input id={inputId} name={name} type={type} value={value} autoComplete={autoComplete} onChange={(event) => onChange(name, event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? `${inputId}-error` : undefined} />{error && <small id={`${inputId}-error`}>{error}</small>}</label>
}

function DeliveryOption({ value, selected, onSelect, title, description }: { value: DeliveryMethod; selected: DeliveryMethod; onSelect: (value: DeliveryMethod) => void; title: string; description: string }) {
  const id = `delivery-${value}`
  return <label className={`delivery-option ${selected === value ? 'selected' : ''}`} htmlFor={id}><input id={id} type="radio" name="deliveryMethod" checked={selected === value} onChange={() => onSelect(value)} /><span className="delivery-radio" /><span><strong>{title}</strong><small>{description}</small></span><b>{value === 'pickup' ? 'Free' : 'Calculated'}</b></label>
}
