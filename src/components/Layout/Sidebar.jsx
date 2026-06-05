import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Zap, TrendingUp, GitCompare, BarChart3, BookMarked, Settings as SettingsIcon, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/simulator', label: 'Simulator', icon: Zap },
  { path: '/rankings', label: 'Rankings', icon: TrendingUp },
  { path: '/trends', label: 'Trends', icon: BarChart3 },
  { path: '/comparison', label: 'VS Mode', icon: GitCompare },
  { path: '/saved', label: 'Saved', icon: BookMarked },
  { path: '/settings', label: 'Settings', icon: SettingsIcon },
];

export default function Sidebar({ open, onClose }) {
  const location = useLocation();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-16 z-30 flex flex-col transition-all duration-300
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          ${collapsed ? 'lg:w-[68px]' : 'lg:w-64'}
          w-64 h-[calc(100vh-64px)]`}
        style={{
          background: 'rgba(9,11,26,0.95)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Collapse toggle (desktop only) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-6 w-6 h-6 rounded-full items-center justify-center z-10 text-slate-400 hover:text-white transition-all"
          style={{
            background: 'rgba(30,41,59,1)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {!collapsed && (
            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-3">
              Navigation
            </p>
          )}
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const active = isActive(path);
            return (
              <Link
                key={path}
                to={path}
                onClick={onClose}
                title={collapsed ? label : undefined}
                className={`nav-link group ${active ? 'active' : ''} ${collapsed ? 'justify-center px-2' : 'px-4 py-3.5'}`}
              >
                <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
                  <Icon size={20} className={active ? 'text-violet-400' : 'text-slate-400 group-hover:text-slate-200'} />
                </div>
                {!collapsed && <span className="font-semibold tracking-wide">{label}</span>}
                {!collapsed && active && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_#a78bfa]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User info bottom */}
        {!collapsed && (
          <div className="p-3 border-t border-white/5 mx-2 mb-2">
            <div className="flex items-center gap-2.5 px-2 py-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{
                  background: user?.isDemo
                    ? 'linear-gradient(135deg, rgba(6,182,212,0.4), rgba(124,58,237,0.3))'
                    : 'linear-gradient(135deg, rgba(124,58,237,0.5), rgba(6,182,212,0.3))',
                  border: user?.isDemo
                    ? '1px solid rgba(6,182,212,0.4)'
                    : '1px solid rgba(124,58,237,0.3)',
                }}
              >
                {user?.name?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">{user?.name ?? 'User'}</p>
                <p className="text-[10px] text-slate-500 truncate">{user?.email ?? ''}</p>
              </div>
              {user?.isDemo && (
                <span
                  className="flex-shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                  style={{
                    background: 'rgba(6,182,212,0.15)',
                    border:     '1px solid rgba(6,182,212,0.3)',
                    color:      '#22d3ee',
                  }}
                >
                  Demo
                </span>
              )}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
