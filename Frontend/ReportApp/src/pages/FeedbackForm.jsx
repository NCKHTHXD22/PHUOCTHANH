import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '@/lib/api'

const MAX_IMAGES = 5
const MAX_SIZE = 5 * 1024 * 1024

export default function FeedbackForm({ profile, accessToken, onSuccess }) {
  const [categories, setCategories] = useState([])
  const [categoryId, setCategoryId] = useState('')
  const [contact, setContact] = useState('')
  const [content, setContent] = useState('')
  const [images, setImages] = useState([]) // [{file, previewUrl}]
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/categories').then(res => setCategories(res.data.categories || [])).catch(() => {})
  }, [])

  function handleAddImages(e) {
    const files = Array.from(e.target.files || [])
    const room = MAX_IMAGES - images.length
    const accepted = files.filter(f => f.size <= MAX_SIZE).slice(0, room)
    setImages(prev => [...prev, ...accepted.map(file => ({ file, previewUrl: URL.createObjectURL(file) }))])
    e.target.value = ''
  }

  function removeImage(idx) {
    setImages(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const isPhone = /^(0|\+84)[3-9]\d{8}$/.test(contact.replace(/\s/g, ''))
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.trim())
    if (!isPhone && !isEmail) {
      setError('Vui lòng nhập SĐT (VD: 0912345678) hoặc email hợp lệ')
      return
    }
    if (content.trim().length < 5) {
      setError('Nội dung phản ánh cần ít nhất 5 ký tự')
      return
    }

    const formData = new FormData()
    formData.append('accessToken', accessToken)
    formData.append('contact', contact.trim())
    formData.append('content', content.trim())
    if (categoryId) formData.append('categoryId', categoryId)
    images.forEach(({ file }) => formData.append('images', file))

    setSubmitting(true)
    try {
      const res = await api.post('/feedbacks', formData)
      onSuccess(res.data.code)
    } catch (err) {
      setError(err.response?.data?.error || 'Có lỗi xảy ra, vui lòng thử lại')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <Card className="mx-auto max-w-md animate-fade-in">
        <CardHeader>
          <CardTitle className="gradient-text text-lg">Gửi góp ý - Phản ánh</CardTitle>
          <div className="flex items-center gap-2 pt-1">
            {profile.avatar && <img src={profile.avatar} alt="" className="h-8 w-8 rounded-full" />}
            <span className="text-sm text-muted-foreground">Xin chào, {profile.name || 'bạn'}</span>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label>Loại phản ánh</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder="Chọn loại phản ánh" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c._id} value={c._id}>{c.icon ? `${c.icon} ` : ''}{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact">Số điện thoại / Email liên hệ</Label>
              <Input id="contact" value={contact} onChange={e => setContact(e.target.value)} placeholder="0912345678" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Nội dung góp ý / phản ánh</Label>
              <Textarea id="content" value={content} onChange={e => setContent(e.target.value)} rows={5} placeholder="Mô tả chi tiết nội dung..." required />
            </div>

            <div className="space-y-2">
              <Label>Hình ảnh minh hoạ (tối đa {MAX_IMAGES})</Label>
              <div className="flex flex-wrap gap-2">
                {images.map((img, i) => (
                  <div key={i} className="relative h-16 w-16 overflow-hidden rounded-md border">
                    <img src={img.previewUrl} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute right-0 top-0 rounded-bl bg-black/60 p-0.5 text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {images.length < MAX_IMAGES && (
                  <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground hover:bg-accent">
                    + Thêm
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleAddImages} />
                  </label>
                )}
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting ? 'Đang gửi...' : 'Gửi phản ánh'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
