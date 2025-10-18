import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: productId } = await params

    // First, get the product images to delete them from storage
    const { data: images } = await supabase
      .from('product_images')
      .select('image_url')
      .eq('product_id', productId)

    // Delete images from storage if they exist
    if (images && images.length > 0) {
      const imagePaths = images
        .map(img => img.image_url)
        .filter(url => url.includes('product-images')) // Only delete from our storage bucket
        .map(url => {
          // Extract the file path from the full URL
          const urlParts = url.split('/product-images/')
          return urlParts[1] || null
        })
        .filter(Boolean)

      if (imagePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('product-images')
          .remove(imagePaths)

        if (storageError) {
          console.error('Error deleting images from storage:', storageError)
          // Continue with database deletion even if storage deletion fails
        }
      }
    }

    // Delete related records first (due to foreign key constraints)
    await supabase.from('order_items').delete().eq('product_id', productId)
    await supabase.from('cart_items').delete().eq('product_id', productId)
    await supabase.from('product_images').delete().eq('product_id', productId)
    await supabase.from('product_variants').delete().eq('product_id', productId)

    // Finally, delete the product
    const { error: productError } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)

    if (productError) {
      throw new Error(`Failed to delete product: ${productError.message}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete product error:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}
