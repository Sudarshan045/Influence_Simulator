import { useState } from 'react';
import { User, Mail, Shield, Bell, Save, AlertCircle, Sparkles, Moon, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [successMsg, setSuccessMsg] = useState('');

  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'Analyst'
  });

  const handleSave = () => {
    setSuccessMsg('Settings saved successfully!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="page-title">Settings & Profile</h1>
          <p className="page-subtitle">Manage your account preferences and defaults</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          {[
            { id: 'profile', label: 'My Profile', icon: User },
            { id: 'preferences', label: 'Preferences', icon: Sparkles },
            { id: 'security', label: 'Security', icon: Shield },
            { id: 'notifications', label: 'Notifications', icon: Bell },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <tab.icon size={18} className={activeTab === tab.id ? 'text-violet-400' : 'text-slate-500'} />
              {tab.label}
            </button>
          ))}

          <div className="pt-4 mt-4 border-t border-white/10">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all border border-transparent"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="glass-card p-6 md:p-8">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-white mb-1">Profile Information</h2>
                  <p className="text-sm text-slate-400">Update your account's profile information and email address.</p>
                </div>
                
                <div className="flex items-center gap-6 pb-6 border-b border-white/5">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}>
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt={profile.name} className="w-full h-full object-cover" />
                    ) : (
                      profile.name[0]?.toUpperCase() || 'U'
                    )}
                  </div>
                  <div>
                    <button className="px-4 py-2 text-xs font-medium text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors border border-white/10">
                      Change Avatar
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="form-label">Full Name</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input 
                        type="text" 
                        value={profile.name}
                        onChange={(e) => setProfile({...profile, name: e.target.value})}
                        className="form-input pl-10" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Email Address</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input 
                        type="email" 
                        value={profile.email}
                        onChange={(e) => setProfile({...profile, email: e.target.value})}
                        className="form-input pl-10" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Role</label>
                    <input 
                      type="text" 
                      value={profile.role}
                      disabled
                      className="form-input opacity-60 cursor-not-allowed" 
                    />
                    <p className="text-xs text-slate-500 mt-1">Roles can only be changed by an Administrator.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-white mb-1">Simulator Preferences</h2>
                  <p className="text-sm text-slate-400">Set defaults for your AI forecast modeling.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5">
                    <div>
                      <p className="font-medium text-white text-sm">Default Theme</p>
                      <p className="text-xs text-slate-400 mt-1">Choose between light, dark, or system default.</p>
                    </div>
                    <select className="form-input w-auto py-2 text-sm bg-slate-900 border-white/20">
                      <option>Dark Mode (Default)</option>
                      <option>Light Mode</option>
                      <option>System Default</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5">
                    <div>
                      <p className="font-medium text-white text-sm">Default Data Source</p>
                      <p className="text-xs text-slate-400 mt-1">Primary source for trend analysis.</p>
                    </div>
                    <select className="form-input w-auto py-2 text-sm bg-slate-900 border-white/20">
                      <option>Global Aggregated</option>
                      <option>US Focused</option>
                      <option>EU Focused</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-white mb-1">Security</h2>
                  <p className="text-sm text-slate-400">Manage your password and security settings.</p>
                </div>

                {user?.provider === 'google.com' ? (
                  <div className="p-4 rounded-xl border border-violet-500/30 bg-violet-500/10 flex items-start gap-3">
                    <AlertCircle className="text-violet-400 mt-0.5" size={18} />
                    <div>
                      <p className="text-sm font-medium text-white">Google Authenticated Account</p>
                      <p className="text-xs text-violet-200 mt-1">Your account is managed via Google. You cannot change your password here.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6 max-w-md">
                    <div>
                      <label className="form-label">Current Password</label>
                      <input type="password" placeholder="••••••••" className="form-input" />
                    </div>
                    <div>
                      <label className="form-label">New Password</label>
                      <input type="password" placeholder="••••••••" className="form-input" />
                    </div>
                    <div>
                      <label className="form-label">Confirm New Password</label>
                      <input type="password" placeholder="••••••••" className="form-input" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-white mb-1">Notification Settings</h2>
                  <p className="text-sm text-slate-400">Choose what you want to be notified about.</p>
                </div>

                <div className="space-y-3">
                  {[
                    { title: 'Trend Alerts', desc: 'Get notified when an idea hits a Revival phase.' },
                    { title: 'Weekly Reports', desc: 'Receive a summary of your saved simulations.' },
                    { title: 'System Updates', desc: 'News about the Influence Simulator platform.' }
                  ].map((item, i) => (
                    <label key={i} className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                      <div>
                        <p className="font-medium text-white text-sm">{item.title}</p>
                        <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
                      </div>
                      <div className="relative">
                        <input type="checkbox" className="sr-only peer" defaultChecked={i !== 1} />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-500"></div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Global Save Button */}
            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
              <div>
                {successMsg && (
                  <p className="text-sm text-emerald-400 flex items-center gap-2 animate-fade-in-up">
                    <Sparkles size={16} /> {successMsg}
                  </p>
                )}
              </div>
              <button onClick={handleSave} className="btn-primary px-6 py-2">
                <Save size={16} />
                Save Changes
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
