/* eslint-disable @next/next/no-img-element */
'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Plus, X, Upload, Image as ImageIcon } from 'lucide-react'

type VariantForm = {
  id?: string
  size: string
  color: string
  stock_quantity: string
  price_adjustment: string
}

type ImageForm = {
  id?: string
  url: string
}

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams() as { id: string }
  const productId = params?.id

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    base_price: '',
    category: '',
    variants: [] as VariantForm[],
    images: [] as ImageForm[],
  })
  const [uploadingImages, setUploadingImages] = useState<boolean[]>([])
  const [dragOver, setDragOver] = useState(false)
  const fileInputsRef = useRef<Array<HTMLInputElement | null>>([])

  const [originalVariantIds, setOriginalVariantIds] = useState<string[]>([])
  const [originalImageIds, setOriginalImageIds] = useState<string[]>([])

  useEffect(() => {
    if (!productId) return
    loadProduct()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId])

  const loadProduct = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          base_price,
          category,
          images:product_images(id, image_url, is_primary, display_order),
          variants:product_variants(id, size, color, price_adjustment, stock_quantity)
        `)
        .eq('id', productId)
        .single()

      if (error) throw error
      if (!data) throw new Error('Product not found')

      const imagesSorted = (data.images || []).sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))

      setFormData({
        name: data.name ?? '',
        description: data.description ?? '',
        base_price: data.base_price != null ? String(data.base_price) : '',
        category: data.category ?? '',
        variants: (data.variants || []).map((v: any) => ({
          id: v.id,
          size: v.size ?? '',
          color: v.color ?? '',
          stock_quantity: v.stock_quantity != null ? String(v.stock_quantity) : '',
          price_adjustment: v.price_adjustment != null ? String(v.price_adjustment) : '',
        })),
        images: imagesSorted.map((img: any) => ({ id: img.id, url: img.image_url })),
      })

      setOriginalVariantIds((data.variants || []).map((v: any) => v.id))
      setOriginalImageIds(imagesSorted.map((img: any) => img.id))
      setUploadingImages(new Array(imagesSorted.length).fill(false))
    } catch (err) {
      console.error('Error loading product:', err)
      alert('Failed to load product.')
      router.back()
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleVariantChange = (index: number, field: keyof VariantForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    }))
  }

  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, { size: '', color: '', stock_quantity: '', price_adjustment: '' }],
    }))
  }

  const removeVariant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }))
  }

  const addImage = () => {
    setFormData(prev => ({ ...prev, images: [...prev.images, { url: '' }] }))
    setUploadingImages(prev => [...prev, false])
  }

  const removeImage = (index: number) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))
    setUploadingImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleImageChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => (i === index ? { ...img, url: value } : img)),
    }))
  }

  const uploadImage = async (file: File, index: number) => {
    try {
      setUploadingImages(prev => prev.map((u, i) => (i === index ? true : u)))
      const supabase = createClient()
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `products/${fileName}`

      const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, file)
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('product-images').getPublicUrl(filePath)

      setFormData(prev => ({
        ...prev,
        images: prev.images.map((img, i) => (i === index ? { ...img, url: data.publicUrl } : img)),
      }))
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setUploadingImages(prev => prev.map((u, i) => (i === index ? false : u)))
    }
  }

  const handleFileSelect = (files: FileList | null, index: number) => {
    if (files && files[0]) {
      uploadImage(files[0], index)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOver(false)
    const files = e.dataTransfer.files
    handleFileSelect(files, index)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const supabase = createClient()

      const roundedBase = Math.round((parseFloat(formData.base_price || '0')) * 100) / 100
      const { error: updateError } = await supabase
        .from('products')
        .update({
          name: formData.name,
          description: formData.description,
          base_price: roundedBase,
          category: formData.category,
        })
        .eq('id', productId)
      if (updateError) throw updateError

      const currentVariantIds = formData.variants.map(v => v.id).filter(Boolean) as string[]
      const toDeleteVariantIds = originalVariantIds.filter(id => !currentVariantIds.includes(id))

      if (toDeleteVariantIds.length > 0) {
        const { error: delVarErr } = await supabase
          .from('product_variants')
          .delete()
          .in('id', toDeleteVariantIds)
        if (delVarErr) throw delVarErr
      }

      for (const v of formData.variants) {
        const payload = {
          product_id: productId,
          size: v.size,
          color: v.color,
          stock_quantity: parseInt(v.stock_quantity || '0'),
          price_adjustment: Math.round(((parseFloat(v.price_adjustment || '0')) * 100)) / 100,
        }
        if (v.id) {
          const { error } = await supabase.from('product_variants').update(payload).eq('id', v.id)
          if (error) throw error
        } else if (v.size && v.color) {
          const { error } = await supabase.from('product_variants').insert(payload)
          if (error) throw error
        }
      }

      const currentImageIds = formData.images.map(img => img.id).filter(Boolean) as string[]
      const toDeleteImageIds = originalImageIds.filter(id => !currentImageIds.includes(id))
      if (toDeleteImageIds.length > 0) {
        const { error: delImgErr } = await supabase
          .from('product_images')
          .delete()
          .in('id', toDeleteImageIds)
        if (delImgErr) throw delImgErr
      }

      for (let i = 0; i < formData.images.length; i++) {
        const img = formData.images[i]
        const payload = {
          product_id: productId,
          image_url: img.url,
          is_primary: i === 0,
          display_order: i,
        }
        if (img.id) {
          const { error } = await supabase.from('product_images').update(payload).eq('id', img.id)
          if (error) throw error
        } else if (img.url) {
          const { error } = await supabase.from('product_images').insert(payload)
          if (error) throw error
        }
      }

      router.push('/admin/products')
    } catch (error) {
      console.error('Error updating product:', error)
      alert('Failed to update product. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.back()} className="flex items-center">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
            <p className="text-gray-600">Loading product...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={() => router.back()} className="flex items-center">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
          <p className="text-gray-600">Update product details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
              <Input
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="placeholder:text-black"
                placeholder="Enter product name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <Select name="category" required value={formData.category} onChange={handleInputChange}>
                <option value="">Select Category</option>
                <option value="T-Shirts">T-Shirts</option>
                <option value="Jeans">Jeans</option>
                <option value="Dresses">Dresses</option>
                <option value="Sweaters">Sweaters</option>
                <option value="Jackets">Jackets</option>
                <option value="Shoes">Shoes</option>
                <option value="Accessories">Accessories</option>
              </Select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              name="description"
              required
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:black placeholder:text-black"
              rows={3}
              placeholder="Enter product description"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (EGP) *</label>
            <Input
              name="base_price"
              type="number"
              step="0.01"
              required
              className="placeholder:text-black"
              value={formData.base_price}
              onChange={handleInputChange}
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Product Variants</h2>
            <Button type="button" onClick={addVariant} size="sm" className="bg-black text-white hover:bg-primary hover:text-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Add Variant
            </Button>
          </div>

          {formData.variants.map((variant, index) => (
            <div key={variant.id ?? index} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 p-4 border border-gray-200 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                <Input
                  value={variant.size}
                  className="placeholder:text-black"
                  onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                  placeholder="S, M, L, XL"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <Input
                  value={variant.color}
                  className="placeholder:text-black"
                  onChange={(e) => handleVariantChange(index, 'color', e.target.value)}
                  placeholder="Red, Blue, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                <Input
                  type="number"
                  className="placeholder:text-black"
                  value={variant.stock_quantity}
                  onChange={(e) => handleVariantChange(index, 'stock_quantity', e.target.value)}
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price Adjustment ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  className="placeholder:text-black"
                  value={variant.price_adjustment}
                  onChange={(e) => handleVariantChange(index, 'price_adjustment', e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="flex items-end">
                <Button type="button" variant="outline" size="sm" onClick={() => removeVariant(index)} className="text-white hover:white">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Product Images</h2>
            <Button type="button" onClick={addImage} size="sm" className="bg-black text-white hover:bg-primary hover:text-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Add Image
            </Button>
          </div>

          {formData.images.map((image, index) => (
            <div key={image.id ?? index} className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Image {index + 1} {index === 0 && '(Primary)'}</label>

              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragOver ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
              >
                {image.url ? (
                  <div className="space-y-4">
                    <img src={image.url} alt={`Product image ${index + 1}`} className="mx-auto h-32 w-32 object-cover rounded-lg" />
                    <div className="flex justify-center space-x-2 ">
                      <Button type="button" variant="outline" size="sm" onClick={() => fileInputsRef.current[index]?.click()} disabled={uploadingImages[index]}>
                        <Upload className="w-4 h-4 mr-2" />
                        {uploadingImages[index] ? 'Uploading...' : 'Change Image'}
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => removeImage(index)} className="text-red-600 hover:text-red-700">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Drag and drop an image here, or click to select</p>
                      <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => fileInputsRef.current[index]?.click()} disabled={uploadingImages[index]}>
                        <Upload className="w-4 h-4 mr-2" />
                        {uploadingImages[index] ? 'Uploading...' : 'Select Image'}
                      </Button>
                    </div>
                  </div>
                )}

                <input ref={(el) => { fileInputsRef.current[index] = el }} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e.target.files, index)} />
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" className="bg-black text-white hover:bg-primary hover:text-foreground" disabled={saving}>
            {saving ? 'Saving...' : 'Update Product'}
          </Button>
        </div>
      </form>
    </div>
  )
}
