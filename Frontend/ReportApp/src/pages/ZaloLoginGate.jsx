import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buildZaloLoginUrl } from '@/lib/api'

export default function ZaloLoginGate({ loading, error }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
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
    </div>
  )
}
