import { useCallback, useEffect, useState } from 'react'
import type { Product } from '../data/storeData'
import { fetchProduct, fetchProducts } from '../services/productApi'

type ProductListState = {
  key: string
  products: Product[]
  error: string
}

export function useProducts(filters: { category?: string; search?: string } = {}, enabled = true) {
  const category = filters.category
  const search = filters.search
  const [attempt, setAttempt] = useState(0)
  const requestKey = `${category ?? ''}:${search ?? ''}:${attempt}`
  const [state, setState] = useState<ProductListState>({ key: '', products: [], error: '' })

  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    fetchProducts({ category, search }, controller.signal)
      .then((products) => setState({ key: requestKey, products, error: '' }))
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) {
          setState({
            key: requestKey,
            products: [],
            error: reason instanceof Error ? reason.message : 'Unable to load products.',
          })
        }
      })
    return () => controller.abort()
  }, [category, search, enabled, requestKey])

  const retry = useCallback(() => setAttempt((current) => current + 1), [])
  return {
    products: state.key === requestKey ? state.products : [],
    loading: enabled && state.key !== requestKey,
    error: state.key === requestKey ? state.error : '',
    retry,
  }
}

type SingleProductState = {
  key: string
  product: Product | null
  error: string
}

export function useProduct(id: string) {
  const [attempt, setAttempt] = useState(0)
  const requestKey = `${id}:${attempt}`
  const [state, setState] = useState<SingleProductState>({ key: '', product: null, error: '' })

  useEffect(() => {
    const controller = new AbortController()
    fetchProduct(id, controller.signal)
      .then((product) => setState({ key: requestKey, product, error: '' }))
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) {
          setState({
            key: requestKey,
            product: null,
            error: reason instanceof Error ? reason.message : 'Unable to load this product.',
          })
        }
      })
    return () => controller.abort()
  }, [id, requestKey])

  const retry = useCallback(() => setAttempt((current) => current + 1), [])
  return {
    product: state.key === requestKey ? state.product : null,
    loading: state.key !== requestKey,
    error: state.key === requestKey ? state.error : '',
    retry,
  }
}
