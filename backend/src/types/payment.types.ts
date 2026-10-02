export type CheckoutItemInput = {
  product_id: string
  quantity: number
}

export type CheckoutInput = {
  customer_name: string
  customer_email: string
  customer_phone: string
  delivery_method: 'delivery' | 'pickup'
  delivery_address?: string
  delivery_city?: string
  delivery_state?: string
  items: CheckoutItemInput[]
}

export type PaystackInitialization = {
  authorization_url: string
  reference: string
}

export type PaystackVerification = {
  status: string
  reference: string
  amount: number
  currency: string
  id: number
}

export type PaymentResult = {
  verified: boolean
  orderNumber?: string
  message: string
}
