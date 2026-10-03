import { getSupabaseClient } from './supabase'

const PRODUCT_IMAGE_BUCKET = 'product-images'
const MAX_IMAGE_SIZE = 5 * 1024 * 1024

export async function uploadProductImage(file: File) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Choose an image file.')
  }
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error('The image must be 5 MB or smaller.')
  }

  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'img'
  const path = `admin/${crypto.randomUUID()}.${extension}`
  const { data, error } = await getSupabaseClient()
    .storage
    .from(PRODUCT_IMAGE_BUCKET)
    .upload(path, file, { cacheControl: '3600', contentType: file.type, upsert: false })

  if (error) throw new Error('Image upload failed. Check your administrator access and try again.')
  return getSupabaseClient().storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(data.path).data.publicUrl
}
