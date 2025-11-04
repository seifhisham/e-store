/* eslint-disable @next/next/no-img-element */
'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Plus, X, Upload, Image as ImageIcon } from 'lucide-react'

export default function NewProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    base_price: '',
    category: '',
    variants: [{ size: '', color: '', stock_quantity: '', price_adjustment: '' }],
    images: ['']
  })
  const [uploadingImages, setUploadingImages] = useState<boolean[]>([])
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleVariantChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, i) => 
        i === index ? { ...variant, [field]: value } : variant
      )
    }))
  }

  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, { size: '', color: '', stock_quantity: '', price_adjustment: '' }]
    }))
  }

  const removeVariant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }))
  }

  const handleImageChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => i === index ? value : img)
    }))
  }

  const addImage = () => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, '']
    }))
  }

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
    setUploadingImages(prev => prev.filter((_, i) => i !== index))
  }

  const uploadImage = async (file: File, index: number) => {
    try {
      setUploadingImages(prev => prev.map((uploading, i) => i === index ? true : uploading))
      
      const supabase = createClient()
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `products/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      setFormData(prev => ({
        ...prev,
        images: prev.images.map((img, i) => i === index ? data.publicUrl : img)
      }))
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setUploadingImages(prev => prev.map((uploading, i) => i === index ? false : uploading))
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
    setLoading(true)

    try {
      const supabase = createClient()

      console.log('Creating product with data:', {
        name: formData.name,
        description: formData.description,
        base_price: parseFloat(formData.base_price),
        category: formData.category
      })

      // Create product
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          name: formData.name,
          description: formData.description,
          base_price: parseFloat(formData.base_price),
          category: formData.category
        })
        .select()
        .single()

      if (productError) {
        console.error('Product creation error:', productError)
        throw new Error(`Failed to create product: ${productError.message}`)
      }

      console.log('Product created successfully:', product)

      // Create variants
      for (const variant of formData.variants) {
        if (variant.size && variant.color) {
          console.log('Creating variant:', variant)
          const { error: variantError } = await supabase.from('product_variants').insert({
            product_id: product.id,
            size: variant.size,
            color: variant.color,
            stock_quantity: parseInt(variant.stock_quantity) || 0,
            price_adjustment: parseFloat(variant.price_adjustment) || 0
          })
          
          if (variantError) {
            console.error('Variant creation error:', variantError)
            throw new Error(`Failed to create variant: ${variantError.message}`)
          }
        }
      }

      // Create images
      for (let i = 0; i < formData.images.length; i++) {
        const imageUrl = formData.images[i]
        if (imageUrl) {
          console.log('Creating image:', imageUrl)
          const { error: imageError } = await supabase.from('product_images').insert({
            product_id: product.id,
            image_url: imageUrl,
            is_primary: i === 0,
            display_order: i
          })
          
          if (imageError) {
            console.error('Image creation error:', imageError)
            throw new Error(`Failed to create image: ${imageError.message}`)
          }
        }
      }

      router.push('/admin/products')
    } catch (error) {
      console.error('Error creating product:', error)
      alert('Failed to create product. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-gray-600">Create a new product for your store</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <Input
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter product name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <Select
                name="category"
                required
                value={formData.category}
                onChange={handleInputChange}
              >
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              name="description"
              required
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
              placeholder="Enter product description"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Base Price ($) *
            </label>
            <Input
              name="base_price"
              type="number"
              step="0.01"
              required
              value={formData.base_price}
              onChange={handleInputChange}
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Variants */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Product Variants</h2>
            <Button type="button" onClick={addVariant} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Variant
            </Button>
          </div>

          {formData.variants.map((variant, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 p-4 border border-gray-200 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Size
                </label>
                <Input
                  value={variant.size}
                  onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                  placeholder="S, M, L, XL"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <Input
                  value={variant.color}
                  onChange={(e) => handleVariantChange(index, 'color', e.target.value)}
                  placeholder="Red, Blue, etc."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Quantity
                </label>
                <Input
                  type="number"
                  value={variant.stock_quantity}
                  onChange={(e) => handleVariantChange(index, 'stock_quantity', e.target.value)}
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price Adjustment ($)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={variant.price_adjustment}
                  onChange={(e) => handleVariantChange(index, 'price_adjustment', e.target.value)}
                  placeholder="0.00"
                />
              </div>
              
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeVariant(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Images */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Product Images</h2>
            <Button type="button" onClick={addImage} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Image
            </Button>
          </div>

          {formData.images.map((image, index) => (
            <div key={index} className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image {index + 1} {index === 0 && '(Primary)'}
              </label>
              
              {/* Drag and Drop Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragOver ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
              >
                {image ? (
                  <div className="space-y-4">
                    <img
                      src={image}
                      alt={`Product image ${index + 1}`}
                      className="mx-auto h-32 w-32 object-cover rounded-lg"
                    />
                    <div className="flex justify-center space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImages[index]}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {uploadingImages[index] ? 'Uploading...' : 'Change Image'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeImage(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">
                        Drag and drop an image here, or click to select
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImages[index]}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {uploadingImages[index] ? 'Uploading...' : 'Select Image'}
                      </Button>
                    </div>
                  </div>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files, index)}
                />
              </div>

              {/* URL Input as fallback */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Or enter image URL
                </label>
                <Input
                  value={image}
                  onChange={(e) => handleImageChange(index, e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Product'}
          </Button>
        </div>
      </form>
    </div>
  )
}
