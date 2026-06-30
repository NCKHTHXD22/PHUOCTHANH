import { useEffect, useRef, useState } from 'react'
import { X, MapPin, Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '@/lib/api'

const MAX_IMAGES = 5
const MAX_SIZE = 5 * 1024 * 1024

// Lấy vị trí qua Zalo JSBridge (Zalo WebView) hoặc browser geolocation
async function detectLocation() {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timeout')), 12000)

    const done = (lat, lng) => {
      clearTimeout(timeout)
      resolve({ lat, lng })
    }

    if (window.ZaloJSBridge) {
      window.ZaloJSBridge.invoke('getLocation', {}, (result) => {
        if (result && result.error === 0) {
          done(result.latitude, result.longitude)
        } else {
          // Fallback browser geolocation nếu Zalo từ chối
          tryBrowserGeo(done, () => { clearTimeout(timeout); reject(new Error('Không lấy được vị trí')) })
        }
      })
    } else if (navigator.geolocation) {
      tryBrowserGeo(done, () => { clearTimeout(timeout); reject(new Error('Không lấy được vị trí')) })
    } else {
      clearTimeout(timeout)
      reject(new Error('Trình duyệt không hỗ trợ GPS'))
    }
  })
}

function tryBrowserGeo(onSuccess, onError) {
  navigator.geolocation.getCurrentPosition(
    (pos) => onSuccess(pos.coords.latitude, pos.coords.longitude),
    onError,
    { enableHighAccuracy: true, timeout: 10000 }
  )
}

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=vi`,
      { headers: { 'User-Agent': 'UBND-PhuocThanh-GoiY/1.0' } }
    )
    const data = await res.json()
    return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
  } catch {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
  }
}

export default function FeedbackForm({ profile, accessToken, onSuccess }) {
  const [categories, setCategories] = useState([])
  const [categoryId, setCategoryId] = useState('')
  const [contact, setContact] = useState('')
  const [content, setContent] = useState('')
  const [images, setImages] = useState([]) // [{file, previewUrl}]
  const [address, setAddress] = useState('')
  const [coords, setCoords] = useState(null) // { lat, lng }
  const [locationMode, setLocationMode] = useState('') // '' | 'auto' | 'manual'
  const [locationLoading, setLocationLoading] = useState(false)
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

  async function handleAutoLocation() {
    setLocationLoading(true)
    setError('')
    try {
      const { lat, lng } = await detectLocation()
      setCoords({ lat, lng })
      const addr = await reverseGeocode(lat, lng)
      setAddress(addr)
      setLocationMode('auto')
    } catch (err) {
      setLocationMode('manual')
      setError('Không lấy được vị trí tự động. Vui lòng nhập tay bên dưới.')
    } finally {
      setLocationLoading(false)
    }
  }

  function handleManualMode() {
    setLocationMode('manual')
    setCoords(null)
    setAddress('')
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
    if (address.trim()) formData.append('address', address.trim())
    if (coords) {
      formData.append('lat', coords.lat)
      formData.append('lng', coords.lng)
    }
    images.forEach(({ file }) => formData.append('images', file))

    setSubmitting(true)
    try {
      const res = await api.post('/feedbacks', formData)
      const catObj = categories.find(c => c._id === categoryId)
      const catLabel = catObj ? `${catObj.icon ? catObj.icon + ' ' : ''}${catObj.name}` : ''
      onSuccess({
        code: res.data.code,
        contact,
        content,
        address,
        categoryName: catLabel,
        imageCount: images.length,
      })
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
          <div className="flex items-center gap-2.5">
            <img src="/LogoPhuocThanh.jpg" alt="Phước Thành" className="h-9 w-9 shrink-0 rounded-md object-contain" />
            <CardTitle className="text-lg font-bold text-foreground">Gửi góp ý - Phản ánh</CardTitle>
          </div>
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

            {/* Địa chỉ phản ánh */}
            <div className="space-y-2">
              <Label>Địa chỉ phản ánh</Label>
              {locationMode === '' && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={handleAutoLocation}
                    disabled={locationLoading}
                  >
                    {locationLoading
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <MapPin className="h-4 w-4" />
                    }
                    {locationLoading ? 'Đang lấy vị trí...' : 'Lấy vị trí tự động'}
                  </Button>
                  <Button type="button" variant="outline" className="flex-1" onClick={handleManualMode}>
                    Nhập địa chỉ
                  </Button>
                </div>
              )}
              {locationMode !== '' && (
                <div className="space-y-1">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={address}
                      onChange={e => { setAddress(e.target.value); setLocationMode('manual') }}
                      placeholder="Số nhà, tên đường, thôn/xóm..."
                      className="pl-9"
                    />
                  </div>
                  {coords && (
                    <p className="text-xs text-muted-foreground">
                      GPS: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                    </p>
                  )}
                  <button
                    type="button"
                    className="text-xs text-muted-foreground underline"
                    onClick={() => { setLocationMode(''); setAddress(''); setCoords(null) }}
                  >
                    Xoá địa chỉ
                  </button>
                </div>
              )}
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

            <Button type="submit" className="group w-full gap-2" size="lg" disabled={submitting}>
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Đang gửi...</>
              ) : (
                <><Send className="h-4 w-4 animate-plane" /> Gửi phản ánh</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
