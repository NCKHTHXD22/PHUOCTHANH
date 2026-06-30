import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, MessageSquare, Users, LogOut,
  Settings, Send, Globe,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import logoImg from '@/images/LogoPhuocThanh.jpg'

const GOOGLE_EARTH_URL =
  'https://earth.google.com/web/search/Ph%c6%b0%e1%bb%9bc+Th%c3%a0nh,+Qu%e1%ba%a3ng+Nam/@15.59613341,108.09926041,99.00898397a,270137.50901241d,35y,-0.54375817h,0.73241056t,0r/data=CosBGl0SVwolMHgzMTZhMjU5ZjhiNjYxNzE1OjB4ODY1NjkzN2I4NDNhNzIwNRn6q2zEOIguQCGCcjZ4uvpaQCocUGjGsOG7m2MgVGjDoG5oLCBRdeG6o25nIE5hbRgCIAEiJgokCSLPrhyETTBAEeg0N9tp2C9AGWawHp4rKFtAIZPh2hTP8lpAQgIIATIpCicKJQohMVlWeDRfc3VQTEVDMWJ5REZfMllZejhSQ0xNRW9kVmlTIAE6AwoBMEICCABKCAjQrLLGBBAB'

const ROLE_LABELS = {
  superadmin:  'Cán bộ quản trị',
  dept_leader: 'Cán bộ phòng ban',
  officer:     'Cán bộ phụ trách',
  staff:       'Nhân viên',
}

function NavItem({ to, icon: Icon, label, badge }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group',
          isActive
            ? 'bg-gradient-to-r from-blue-700 to-blue-600 text-white shadow-md shadow-blue-900/40'
            : 'text-slate-400 hover:bg-white/8 hover:text-white'
        )
      }
    >
      {({ isActive }) => (
        <>
          <span className={cn(
            'flex h-7 w-7 items-center justify-center rounded-lg transition-all',
            isActive ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'
          )}>
            <Icon className="h-4 w-4 shrink-0" />
          </span>
          <span className="flex-1">{label}</span>
          {badge && (
            <span className={cn(
              'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
              isActive ? 'bg-white/20 text-white' : 'bg-blue-700/60 text-blue-200'
            )}>
              {badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}

export default function Sidebar() {
  const { user, logout } = useAuth()

  return (
    <aside
      className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col"
      style={{ background: 'linear-gradient(180deg, #0c1a42 0%, #16348a 35%, #1d4ed8 70%, #0c1a42 100%)' }}
    >
      {/* Decorative circles */}
      <div className="pointer-events-none absolute -top-12 -left-12 h-40 w-40 rounded-full bg-blue-600/10" />
      <div className="pointer-events-none absolute top-32 -right-8 h-24 w-24 rounded-full bg-yellow-500/5" />
      <div className="pointer-events-none absolute bottom-20 -left-8 h-32 w-32 rounded-full bg-blue-800/10" />

      {/* Brand */}
      <div className="relative flex items-center gap-3 px-4 py-4 border-b border-white/8">
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-yellow-400/15 blur-md" />
          <img
            src={logoImg}
            alt="Logo Phước Thành"
            className="relative h-11 w-11 object-contain drop-shadow-lg"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-white text-sm font-bold leading-tight truncate">UBND Xã Phước Thành</p>
          <p className="text-blue-300/60 text-[11px] mt-0.5 truncate">Huyện Phước Sơn · Quảng Nam</p>
        </div>
      </div>

      {/* Main nav */}
      <nav className="relative flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-white/25 select-none">
          Menu chính
        </p>

        <NavItem to="/dashboard" icon={LayoutDashboard} label="Tổng quan" />
        <NavItem to="/feedbacks"  icon={MessageSquare}  label="Góp ý & Phản ánh" />

        <div className="my-3 mx-2 border-t border-white/6" />

        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-white/25 select-none">
          Quản lý Zalo
        </p>

        <NavItem to="/messages" icon={Send}     label="Gửi tin nhắn Zalo" />
        <NavItem to="/settings" icon={Settings} label="Cài đặt nhóm Zalo" />

        <div className="my-3 mx-2 border-t border-white/6" />

        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-white/25 select-none">
          Hệ thống
        </p>

        <NavItem to="/users" icon={Users} label="Tài khoản Admin" />

        {/* Google Earth link */}
        <a
          href={GOOGLE_EARTH_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-white/8 hover:text-white transition-all group"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 group-hover:bg-white/10 transition-all">
            <Globe className="h-4 w-4 shrink-0" />
          </span>
          <span className="flex-1 leading-tight">
            Phước Thành
            <span className="block text-[10px] text-slate-500 font-normal">Google Earth</span>
          </span>
        </a>
      </nav>

      {/* User footer */}
      <div className="relative px-3 pb-4">
        <div className="flex items-center gap-3 rounded-2xl bg-white/6 border border-white/8 px-3 py-3 backdrop-blur">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-800 text-white text-sm font-bold shadow-md shadow-blue-900/50 border border-blue-500/30">
            {user?.fullName?.[0]?.toUpperCase() ?? 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{user?.fullName}</p>
            <p className="text-white/40 text-[11px] mt-0.5">
              {ROLE_LABELS[user?.role] ?? user?.role}
            </p>
          </div>
          <button
            onClick={() => logout()}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white/35 hover:text-blue-400 hover:bg-blue-400/10 transition-all"
            title="Đăng xuất"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
