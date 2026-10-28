import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AdminPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/admin/login')
  }

  // توجيه المستخدم لصفحة الكتب كأول صفحة في لوحة الأدمن
  redirect('/admin/books')
}
