import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function SuccessScreen({ code, onReset }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm animate-fade-in text-center">
        <CardHeader>
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-3xl">
            ✅
          </div>
          <CardTitle>Đã tiếp nhận phản ánh!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Mã phản ánh của bạn: <span className="font-semibold text-foreground">#{code}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            UBND Phước Thành sẽ xử lý trong 2-3 ngày làm việc. Phản hồi sẽ được gửi qua Zalo của bạn.
          </p>
          <Button className="w-full" onClick={onReset}>Gửi phản ánh khác</Button>
        </CardContent>
      </Card>
    </div>
  )
}
