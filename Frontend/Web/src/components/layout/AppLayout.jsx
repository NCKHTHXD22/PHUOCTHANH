import { useState, useEffect, useRef } from 'react'
import { Outlet, useLocation, Link } from 'react-router-dom'
import { Bell, Search } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import Sidebar from './Sidebar'
import logoImg from '@/images/LogoPhuocThanh.jpg'

function timeAgo(date) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000
  if (diff < 60) return 'vừa xong'
  if (diff < 3600) return `${Math.floor(diff / 60)} phút`
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ`
  return `${Math.floor(diff / 86400)} ngày`
}

const PAGE_TITLES = {
  '/dashboard': { title: 'Tổng quan',            subtitle: 'Thống kê & theo dõi góp ý người dân' },
  '/feedbacks':  { title: 'Góp ý & Phản ánh',    subtitle: 'Danh sách và xử lý phản ánh từ người dân' },
  '/users':      { title: 'Tài khoản Admin',      subtitle: 'Quản lý tài khoản cán bộ trong hệ thống' },
  '/settings':   { title: 'Cài đặt nhóm Zalo',   subtitle: 'Quản lý danh mục và nhóm nhận thông báo' },
  '/messages':   { title: 'Gửi tin nhắn Zalo',   subtitle: 'Soạn và gửi thông báo đến follower & nhóm OA' },
}

function getHourGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Chào buổi sáng'
  if (h < 18) return 'Chào buổi chiều'
  return 'Chào buổi tối'
}

export default function AppLayout() {
  const { user } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifPos, setNotifPos] = useState(null)
  const notifRef = useRef(null)

  const { data: notifData } = useQuery({
    queryKey: ['notif-pending'],
    queryFn: () => api.get('/api/feedbacks', { params: { status: 'pending' } }).then(r => r.data),
    refetchInterval: 60000,
  })
  const pendingList = notifData?.feedbacks ?? []
  const pendingCount = notifData?.pagination?.total ?? 0

  // Đóng dropdown thông báo khi bấm ra ngoài
  useEffect(() => {
    if (!notifOpen) return
    const onClick = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [notifOpen])

  const basePath = '/' + location.pathname.split('/')[1]
  const page = PAGE_TITLES[basePath] ?? { title: 'Trang', subtitle: '' }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar />

      {/* Main content */}
      <div className="ml-64 flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header
          className="relative shrink-0 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 40%, #0ea5e9 100%)' }}
        >
          {/* Decorative blobs */}
          <div className="pointer-events-none absolute -top-10 -right-10 h-48 w-48 rounded-full bg-yellow-400/5" />
          <div className="pointer-events-none absolute bottom-0 right-32 h-32 w-32 rounded-full bg-white/4" />
          <div className="pointer-events-none absolute -bottom-6 left-1/3 h-20 w-20 rounded-full bg-blue-300/8" />

          <div className="relative px-6 py-4 flex items-center justify-between gap-4">
            {/* Left: logo + greeting + page title */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-full bg-yellow-400/20 blur-sm" />
                <img
                  src={logoImg}
                  alt="Logo"
                  className="relative h-9 w-9 object-contain"
                />
              </div>
              <div className="min-w-0">
                <h1 className="text-white font-bold text-base leading-tight">
                  {getHourGreeting()}, <span className="text-blue-200">{user?.fullName?.split(' ').pop() ?? 'Admin'}</span>!
                </h1>
                <p className="text-blue-200/70 text-xs mt-0.5 truncate">{page.subtitle}</p>
              </div>
            </div>

            {/* Right: search + notifications + user chip */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Search */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/50 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  className="h-9 w-48 rounded-xl bg-white/15 border border-white/20 pl-9 pr-4 text-sm text-white placeholder-white/50 focus:outline-none focus:bg-white/22 focus:border-white/40 focus:w-56 transition-all duration-200"
                />
              </div>

              {/* Bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => {
                    if (!notifOpen && notifRef.current) {
                      const r = notifRef.current.getBoundingClientRect()
                      setNotifPos({ top: r.bottom + 8, right: Math.max(8, window.innerWidth - r.right) })
                    }
                    setNotifOpen(v => !v)
                  }}
                  className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 border border-white/20 hover:bg-white/25 transition-all"
                >
                  <Bell className="h-4 w-4 text-white" />
                  {pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-yellow-400 px-1 text-[10px] font-bold text-blue-900 ring-1 ring-blue-700">
                      {pendingCount > 99 ? '99+' : pendingCount}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div
                    className="fixed z-50 w-80 rounded-xl border border-slate-200 bg-white shadow-xl text-slate-700"
                    style={{ top: notifPos?.top ?? 60, right: notifPos?.right ?? 24 }}
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
                      <p className="text-sm font-semibold">Thông báo</p>
                      <span className="text-xs text-slate-400">{pendingCount} chờ xử lý</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {pendingList.length === 0 ? (
                        <p className="px-4 py-8 text-center text-sm text-slate-400">Không có góp ý mới</p>
                      ) : (
                        pendingList.slice(0, 8).map(fb => (
                          <Link
                            key={fb._id}
                            to={`/feedbacks/${fb._id}`}
                            onClick={() => setNotifOpen(false)}
                            className="flex flex-col gap-0.5 border-b border-slate-50 px-4 py-2.5 hover:bg-blue-50 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold truncate">{fb.displayName || 'Người dân'}</span>
                              <span className="shrink-0 text-[10px] text-slate-400">{timeAgo(fb.createdAt)}</span>
                            </div>
                            <span className="text-xs text-slate-500 line-clamp-2">
                              {fb.categoryId?.icon ? fb.categoryId.icon + ' ' : ''}{fb.content || '(không có nội dung)'}
                            </span>
                          </Link>
                        ))
                      )}
                    </div>
                    {pendingCount > 0 && (
                      <Link
                        to="/feedbacks?status=pending"
                        onClick={() => setNotifOpen(false)}
                        className="block border-t border-slate-100 px-4 py-2.5 text-center text-xs font-semibold text-blue-600 hover:bg-blue-50"
                      >
                        Xem tất cả
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {/* User chip */}
              <div className="flex items-center gap-2.5 rounded-xl bg-white/15 border border-white/20 px-3 py-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400/40 to-blue-300/20 text-white text-xs font-bold border border-white/20">
                  {user?.fullName?.[0]?.toUpperCase() ?? 'A'}
                </div>
                <div className="hidden sm:block leading-tight">
                  <p className="text-white text-xs font-semibold">{user?.fullName}</p>
                  <p className="text-blue-200/70 text-[10px]">
                    {user?.role === 'superadmin' ? 'Quản trị viên' : 'Cán bộ'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
