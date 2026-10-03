import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Icon } from '../../components/admin/AdminLayout'
import {
  createAdminProduct,
  updateAdminProduct,
  type AdminProduct,
  type AdminProductCategory,
  type AdminProductInput,
  type AdminProductUpdate,
} from '../../services/adminProductApi'
import { uploadProductImage } from '../../services/productImageStorage'

type ProductEditorProps = {
  product: AdminProduct | null
  categories: AdminProductCategory[]
  accessToken: string
  onCancel: () => void
  onSaved: (message: string) => void
}

export function ProductEditor({ product, categories, accessToken, onCancel, onSaved }: ProductEditorProps) {
  const [name, setName] = useState(product?.name ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [price, setPrice] = useState(product ? String(product.price) : '')
  const [stock, setStock] = useState(product ? String(product.stock_quantity) : '0')
  const [categoryId, setCategoryId] = useState(product?.category_id ?? '')
  const [isActive, setIsActive] = useState(product?.is_active ?? true)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const imagePreview = useMemo(() => imageFile ? URL.createObjectURL(imageFile) : '', [imageFile])

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview)
    }
  }, [imagePreview])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return
    const parsedPrice = Number(price)
    const parsedStock = Number(stock)
    if (!name.trim()) return setError('Enter a product name.')
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) return setError('Enter a valid non-negative price.')
    if (!Number.isInteger(parsedStock) || parsedStock < 0) return setError('Stock must be a non-negative whole number.')
    if (!categoryId) return setError('Select a category.')
    if (!accessToken) return setError('Your administrator session is unavailable. Sign in again.')

    setSaving(true)
    setError('')
    try {
      const imageUrl = imageFile ? await uploadProductImage(imageFile) : product?.image_url ?? null
      if (!product) {
        const input: AdminProductInput = {
          name: name.trim(),
          description: description.trim() || null,
          price: parsedPrice,
          stock_quantity: parsedStock,
          category_id: categoryId,
          image_url: imageUrl,
          is_active: isActive,
        }
        await createAdminProduct(accessToken, input)
        onSaved('Product created successfully.')
        return
      }

      const changes: AdminProductUpdate = {}
      if (name.trim() !== product.name) changes.name = name.trim()
      if ((description.trim() || null) !== product.description) changes.description = description.trim() || null
      if (parsedPrice !== Number(product.price)) changes.price = parsedPrice
      if (parsedStock !== product.stock_quantity) changes.stock_quantity = parsedStock
      if (categoryId !== product.category_id) changes.category_id = categoryId
      if (isActive !== product.is_active) changes.is_active = isActive
      if (imageFile) changes.image_url = imageUrl
      if (Object.keys(changes).length === 0) {
        onSaved('No product changes to save.')
        return
      }
      await updateAdminProduct(accessToken, product.id, changes)
      onSaved('Product updated successfully.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to save this product.')
    } finally {
      setSaving(false)
    }
  }

  return <section className="card product-editor">
    <div className="product-editor-heading"><div><span className="section-kicker">PRODUCT CATALOG</span><h2>{product ? 'Edit product' : 'Add product'}</h2><p>{product ? 'Update the product information below.' : 'Enter the details for the new catalog item.'}</p></div><button className="table-action" aria-label="Close product form" onClick={onCancel}><Icon name="close" /></button></div>
    {categories.length === 0 && <p className="admin-error" role="alert">No categories are available. Add a category in Supabase before creating products.</p>}
    <form className="product-form" onSubmit={(event) => void submit(event)}>
      <label className="admin-form-field">Product name<input required maxLength={160} value={name} onChange={(event) => setName(event.target.value)} /></label>
      <label className="admin-form-field">Category<select required value={categoryId} onChange={(event) => setCategoryId(event.target.value)}><option value="">Select a category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
      <label className="admin-form-field">Price (NGN)<input required type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} /></label>
      <label className="admin-form-field">Stock quantity<input required type="number" min="0" step="1" value={stock} onChange={(event) => setStock(event.target.value)} /></label>
      <label className="admin-form-field product-form-description">Description<textarea rows={4} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
      <div className="admin-form-field product-form-image"><span>Product image</span><div className="product-image-field">{imagePreview || product?.image_url ? <img src={imagePreview || product?.image_url || ''} alt="Product preview" /> : <span className="product-image-placeholder">Image preview</span>}<label className="button button-secondary">Choose image<input type="file" accept="image/*" onChange={(event) => setImageFile(event.target.files?.[0] ?? null)} /></label></div><small>Images up to 5 MB. Existing image is kept unless replaced.</small></div>
      <label className="admin-active-toggle"><input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} /><span><strong>Active product</strong><small>Active products are visible in the storefront.</small></span></label>
      {error && <p className="admin-error product-form-error" role="alert">{error}</p>}
      <div className="product-form-actions"><button type="button" className="button button-secondary" onClick={onCancel} disabled={saving}>Cancel</button><button type="submit" className="button button-primary" disabled={saving || categories.length === 0}>{saving ? 'Saving…' : product ? 'Save changes' : 'Create product'}</button></div>
    </form>
  </section>
}
