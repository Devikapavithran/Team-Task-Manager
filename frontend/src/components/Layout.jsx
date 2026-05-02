import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FolderKanban, CheckSquare, Users, Brain,
  Bell, LogOut, Menu, X, Zap, ChevronRight
} from 'lucide-react'
import useAuthStore from '../store/authStore'
import { notificationsAPI } from '../api'
import { useQuery, useQueryClient } from '@tanstack/react-query'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/tasks', icon: CheckSquare, label: 'My Tasks' },
  { to: '/workflow', icon: Brain, label: 'AI Workflows' },
  { to: '/team', icon: Users, label: 'Team' },
]

function Avatar({ name, color, size = 'sm' }) {
  const s = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'
  return (
    <div className={`${s} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}
      style={{ background: color || '#6550f7' }}>
      {name?.[0]?.toUpperCase() || 'U'}
    </div>
  )
}

function SidebarContent({ onNav }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-surface-2">
        <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center shadow-sm shadow-brand-200">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="font-display font-bold text-gray-900 leading-tight">TaskFlow</div>
          <div className="text-[10px] text-brand-500 font-semibold tracking-wider uppercase">AI Workspace</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto scrollbar-thin">
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to} end={item.exact}
            onClick={onNav}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-surface-2 space-y-1">
        <NavLink to="/profile" onClick={onNav}
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Avatar name={user?.name} color={user?.avatar_color} />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-gray-900 truncate">{user?.name}</div>
            <div className="text-xs text-gray-400 capitalize">{user?.role}</div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
        </NavLink>
        <button onClick={handleLogout}
          className="sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  )
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const qc = useQueryClient()

  const { data: notifData, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsAPI.getAll({ unread_only: true, limit: 10 }),
    refetchInterval: 30_000,
  })
  const unread = notifData?.unread_count || 0

  return (
    <div className="flex h-screen bg-surface-1 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:block w-60 flex-shrink-0 border-r border-surface-2 shadow-sm">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 border-r border-surface-2 z-50 shadow-xl">
            <button className="absolute top-4 right-4 p-1 rounded-lg hover:bg-surface-2"
              onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5 text-gray-400" />
            </button>
            <SidebarContent onNav={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-surface-2 px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <button className="md:hidden p-2 rounded-xl hover:bg-surface-2 transition-colors"
            onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1" />

          {/* Notifications */}
          <div className="relative">
            <button onClick={() => setNotifOpen(o => !o)}
              className="relative p-2 rounded-xl hover:bg-surface-2 transition-colors">
              <Bell className="w-5 h-5 text-gray-500" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 card shadow-xl z-50 slide-up overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-surface-2">
                  <span className="font-display font-semibold text-sm text-gray-900">Notifications</span>
                  <button onClick={async () => { await notificationsAPI.markAllRead(); refetch() }}
                    className="text-xs text-brand-600 hover:text-brand-700 font-medium">
                    Mark all read
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto scrollbar-thin divide-y divide-surface-2">
                  {!notifData?.notifications?.length ? (
                    <div className="py-8 text-center text-sm text-gray-400">All caught up 🎉</div>
                  ) : notifData.notifications.map(n => (
                    <div key={n.id} className={`px-4 py-3 text-sm ${!n.is_read ? 'bg-brand-50' : ''}`}>
                      <div className="font-semibold text-gray-900 text-sm">{n.title}</div>
                      <div className="text-gray-500 text-xs mt-0.5">{n.message}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="p-4 md:p-6 animate-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
