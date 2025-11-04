import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateOrderStatus(orderId: string, formData: FormData) {
  'use server'

  const supabase = await createClient()
  const newStatus = String(formData.get('status') || 'pending')
  const { error } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId)

  if (error) {
    console.error('Error updating order status:', error)
  }

  revalidatePath('/admin/orders')
}


