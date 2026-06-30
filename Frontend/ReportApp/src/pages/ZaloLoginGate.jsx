import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buildZaloLoginUrl, api } from '@/lib/api'

const RED_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="36" viewBox="0 0 24 36">
  <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 24 12 24S24 21 24 12C24 5.37 18.63 0 12 0z" fill="#ef4444"/>
  <circle cx="12" cy="12" r="5" fill="white"/>
</svg>`

function createRedIcon(L) {
  return L.icon({
    iconUrl: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(RED_ICON_SVG),
    iconSize: [24, 36], iconAnchor: [12, 36], popupAnchor: [0, -36],
  })
}

// Chỉ render khi points.length > 0 — không có toạ độ mặc định
function ComplaintMap({ points }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)

  useEffect(() => {
    const L = window.L
    if (!L || !mapRef.current || mapInstanceRef.current) return

    // Tạo map không set center/zoom — sẽ fitBounds theo marker thực
    const map = L.map(mapRef.current, { zoomControl: true })
    mapInstanceRef.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    const redIcon = createRedIcon(L)
    const group = L.featureGroup()

    points.forEach(p => {
      const dateStr = p.createdAt ? new Date(p.createdAt).toLocaleDateString('vi-VN') : ''
      L.marker([p.lat, p.lng], { icon: redIcon })
        .bindPopup(
          `<div style="min-width:160px;font-size:13px">` +
          `<b style="color:#ef4444">⚠️ Đang xử lý</b><br>` +
          `<b>${p.category}</b><br>${p.content}<br>` +
          (p.address ? `<span style="color:#666">📍 ${p.address}</span><br>` : '') +
          (dateStr ? `<span style="color:#999;font-size:11px">${dateStr}</span>` : '') +
          `</div>`,
          { maxWidth: 240 }
        )
        .addTo(group)
    })

    group.addTo(map)
    // Auto-zoom vừa đủ bao phủ tất cả marker
    try { map.fitBounds(group.getBounds().pad(0.35)) } catch {}

    // Lớp ranh giới xã Phước Thành — thêm sau khi đã có center từ marker
    fetch(
      'https://nominatim.openstreetmap.org/search.php' +
      '?q=X%C3%A3+Ph%C6%B0%E1%BB%9Bc+Th%C3%A0nh%2C+%C4%90%E1%BA%A1i+L%E1%BB%99c%2C+Qu%E1%BA%A3ng+Nam' +
      '&format=geojson&polygon_geojson=1&limit=1',
      { headers: { 'User-Agent': 'UBND-PhuocThanh-GoiY/1.0' } }
    )
      .then(r => r.json())
      .then(data => {
        if (!data.features?.length || !mapInstanceRef.current) return
        L.geoJSON(data, {
          style: { color: '#0068ff', weight: 2.5, fillColor: '#0068ff', fillOpacity: 0.06, dashArray: '5,4' },
        })
          .bindPopup('<b style="color:#0068ff">Xã Phước Thành</b><br>Thành phố Đà Nẵng')
          .addTo(mapInstanceRef.current)
      })
      .catch(() => {})

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  return (
    <div style={{ height: '320px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
      <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
    </div>
  )
}

export default function ZaloLoginGate({ loading, error }) {
  const [leafletReady, setLeafletReady] = useState(false)
  const [mapPoints, setMapPoints] = useState(null) // null = chưa load, [] = không có

  // Đợi Leaflet CDN
  useEffect(() => {
    if (window.L) { setLeafletReady(true); return }
    const check = setInterval(() => { if (window.L) { setLeafletReady(true); clearInterval(check) } }, 200)
    return () => clearInterval(check)
  }, [])

  // Tải danh sách phản ánh có toạ độ
  useEffect(() => {
    api.get('/feedbacks/map')
      .then(res => setMapPoints(res.data.points || []))
      .catch(() => setMapPoints([]))
  }, [])

  const showMap = leafletReady && mapPoints !== null && mapPoints.length > 0

  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-background p-4 gap-4 pt-6">
      <Card className="w-full max-w-sm animate-fade-in">
        <CardHeader className="text-center">
          <CardTitle className="gradient-text text-xl">UBND Xã Phước Thành</CardTitle>
          <p className="text-sm text-muted-foreground">Góp ý - Phản ánh</p>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Vui lòng đăng nhập bằng Zalo để gửi góp ý / phản ánh. Cán bộ sẽ phản hồi trực tiếp qua Zalo của bạn.
          </p>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            className="w-full"
            size="lg"
            disabled={loading}
            onClick={() => { window.location.href = buildZaloLoginUrl() }}
          >
            {loading ? 'Đang xử lý...' : 'Đăng nhập bằng Zalo'}
          </Button>
        </CardContent>
      </Card>

      {/* Bản đồ — chỉ hiện khi có phản ánh có toạ độ thực */}
      {showMap && (
        <div className="w-full max-w-sm space-y-2">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-500 inline-block" />
            <p className="text-sm font-medium text-foreground">
              Phản ánh đang chờ xử lý ({mapPoints.length} điểm)
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Nhấn vào điểm đỏ để xem nội dung. Đường viền xanh là ranh giới xã.
          </p>
          <ComplaintMap points={mapPoints} />
        </div>
      )}
    </div>
  )
}
