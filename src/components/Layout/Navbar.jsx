import { useState, useRef, useEffect } from 'react';
import { Bell, Menu, X, LogOut, User, ChevronDown, Zap, Check, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

const TYPE_STYLES = {
  alert: { dot: 'bg-red-400', badge: 'badge-danger' },
  info: { dot: 'bg-blue-400', badge: 'badge-primary' },
  success: { dot: 'bg-emerald-400', badge: 'badge-success' },
};

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export default function Navbar({ sidebarOpen, setSidebarOpen }) {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markRead, markAllRead, dismiss } = useNotifications();

  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const notifRef = useRef(null);
  const userRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <nav
      className="sticky top-0 z-40 px-4 lg:px-6 flex items-center justify-between h-16"
      style={{
        background: 'rgba(2,6,23,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          id="navbar-menu-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-base leading-none">Influence</span>
            <span className="block text-slate-500 text-[10px] leading-none mt-0.5">Simulator v1.0</span>
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            id="navbar-notifications"
            onClick={() => { setNotifOpen(!notifOpen); setUserOpen(false); }}
            className="relative p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="notif-dot">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>

          {notifOpen && (
            <div
              className="absolute right-0 top-12 w-80 glass-card overflow-hidden animate-fade-in"
              style={{ zIndex: 100 }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <span className="text-sm font-semibold text-white">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
                  >
                    <Check size={12} /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-sm">No notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markRead(n.id)}
                      className={`px-4 py-3 border-b border-white/5 cursor-pointer transition-all hover:bg-white/5 ${!n.read ? 'bg-white/[0.03]' : ''}`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${TYPE_STYLES[n.type]?.dot ?? 'bg-slate-500'} ${!n.read ? 'animate-pulse' : 'opacity-40'}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold mb-0.5 ${n.read ? 'text-slate-400' : 'text-white'}`}>{n.title}</p>
                          <p className="text-xs text-slate-500 leading-relaxed">{n.message}</p>
                          <p className="text-[10px] text-slate-600 mt-1">{timeAgo(n.createdAt)}</p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
                          className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative" ref={userRef}>
          <button
            id="navbar-user-menu"
            onClick={() => { setUserOpen(!userOpen); setNotifOpen(false); }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 transition-all"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, #7c3aed55, #06b6d455)', border: '1px solid rgba(124,58,237,0.4)' }}>
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-white leading-none">{user?.name ?? 'User'}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{user?.role ?? 'Analyst'}</p>
            </div>
            <ChevronDown size={14} className="text-slate-500 hidden sm:block" />
          </button>

          {userOpen && (
            <div className="absolute right-0 top-12 w-48 glass-card overflow-hidden animate-fade-in" style={{ zIndex: 100 }}>
              <div className="px-3 py-3 border-b border-white/10">
                <p className="text-xs font-semibold text-white">{user?.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
              </div>
              <div className="p-1.5">
                <button
                  id="navbar-logout"
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
                >
                  <LogOut size={15} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
