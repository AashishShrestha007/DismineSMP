import { useState, useEffect, useCallback } from 'react';
import {
  LogOut, Users, Clock, CheckCircle, XCircle, Eye, EyeOff, Search, Filter,
  BarChart3, FileText, Settings, ChevronDown, ArrowLeft, Trash2,
  MessageSquare, Calendar, Globe, User, AlertTriangle, Shield, Link2,
  Crown, UserCog, ToggleLeft, ToggleRight, Save, Server,
  Plus, Pencil, X, Hammer, Image, Sparkles, FormInput, ArrowUp, ArrowDown, Lock, Unlock,
  Youtube, Instagram, Twitter, Twitch, Linkedin, Github, Facebook, Music, Video, Gamepad2, Mail
} from 'lucide-react';
import {
  getApplications, updateApplication, deleteApplication, getStats,
  seedDemoData, getUsers, updateUserRole, deleteUser, getSocialLinks,
  updateSocialLinks, getServerInfo, updateServerInfo, getSeasonInfo,
  saveSeasonInfo, getAppForms, saveAppForms,
  canManageRoles, canDeleteUsers, canManageSettings, canReviewApplications, 
  getDiscordConfig, saveDiscordConfig, getGoogleConfig, saveGoogleConfig,
  getRoleLabel, getRoleColor, updateUserPassword, updateUserInfo,
  getChatByAppId, saveChatMessage, toggleChatStatus, deleteChat,
  type ApplicationEntry, type ApplicationStatus, type UserAccount,
  type UserRole, type SocialLink, type ServerInfo, type SeasonInfo, type AppField, type DiscordConfig, type GoogleConfig,
  type AppForm, type ApplicationChat
} from '../../lib/store';

interface Props {
  currentUser: UserAccount;
  onLogout: () => void;
  onBack: () => void;
}

type Tab = 'overview' | 'applications' | 'users' | 'server' | 'formbuilder' | 'socials' | 'settings';
type FilterStatus = 'all' | ApplicationStatus;

const statusConfig: Record<ApplicationStatus, { label: string; color: string; bg: string; border: string }> = {
  pending: { label: 'Pending', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  under_review: { label: 'Under Review', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  approved: { label: 'Approved', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  rejected: { label: 'Rejected', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
};

const ALL_ROLES: UserRole[] = ['owner', 'admin', 'manager', 'staff', 'builder', 'user'];

import { getSettings, updateSettings } from '../../lib/store';

export function AdminDashboard({ currentUser, onLogout, onBack }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [applications, setApplications] = useState<ApplicationEntry[]>([]);
  const [stats, setStats] = useState(getStats());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedApp, setSelectedApp] = useState<ApplicationEntry | null>(null);
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [currentChat, setCurrentChat] = useState<ApplicationChat | null>(null);
  const [chatMessage, setChatMessage] = useState('');

  // Users
  const [allUsers, setAllUsers] = useState<UserAccount[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [roleChangeTarget, setRoleChangeTarget] = useState<string | null>(null);
  const [passwordChangeTarget, setPasswordChangeTarget] = useState<string | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [deleteUserConfirm, setDeleteUserConfirm] = useState<string | null>(null);
  const [userMessage, setUserMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPersonalDetails, setShowPersonalDetails] = useState(false);
  const [showOwnerDetails, setShowOwnerDetails] = useState(false);

  // User details management
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [userEditForm, setUserEditForm] = useState({ displayName: '', email: '', role: '' as any });

  // Socials
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [socialsSaved, setSocialsSaved] = useState(false);

  // Server info
  const [serverInfo, setServerInfo] = useState<ServerInfo>(getServerInfo());
  const [serverSaved, setServerSaved] = useState(false);
  const [editingRuleIndex, setEditingRuleIndex] = useState<number | null>(null);
  const [editingRuleText, setEditingRuleText] = useState('');
  const [newRuleText, setNewRuleText] = useState('');

  // Season info
  const [seasonInfo, setSeasonInfo] = useState<SeasonInfo>(getSeasonInfo());
  const [seasonSaved, setSeasonSaved] = useState(false);

  // Discord Config
  const [discordConfig, setDiscordConfig] = useState<DiscordConfig>(getDiscordConfig());
  const [discordSaved, setDiscordSaved] = useState(false);

  // Google Config
  const [googleConfig, setGoogleConfig] = useState<GoogleConfig>(getGoogleConfig());
  const [googleSaved, setGoogleSaved] = useState(false);

  // Site Settings (Auth Controls)
  const [siteSettings, setSiteSettings] = useState(getSettings());
  const [settingsSaved, setSettingsSaved] = useState(false);

  // App Forms & Fields
  const [appForms, setAppForms] = useState<AppForm[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string>('member-app');
  const [fieldsSaved, setFieldsSaved] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [newField, setNewField] = useState<Partial<AppField>>({ type: 'text', required: false });
  const [showNewFieldForm, setShowNewFieldForm] = useState(false);
  const [showNewFormModal, setShowNewFormModal] = useState(false);
  const [newFormName, setNewFormName] = useState('');
  const [newFormDesc, setNewFormDesc] = useState('');

  // Social editing
  const [editingSocialId, setEditingSocialId] = useState<string | null>(null);
  const [newSocial, setNewSocial] = useState<Partial<SocialLink>>({ enabled: true, color: 'neutral', icon: 'globe' });
  const [showNewSocialForm, setShowNewSocialForm] = useState(false);

  const refreshData = useCallback(() => {
    setApplications(getApplications());
    setStats(getStats());
    setAllUsers(getUsers());
    setSocialLinks(getSocialLinks());
    setServerInfo(getServerInfo());
    setSeasonInfo(getSeasonInfo());
    setAppForms(getAppForms());
    setDiscordConfig(getDiscordConfig());
    setGoogleConfig(getGoogleConfig());
    setSiteSettings(getSettings());
    
    if (selectedApp) {
      setCurrentChat(getChatByAppId(selectedApp.id));
    }
  }, [selectedApp]);

  useEffect(() => {
    seedDemoData();
    refreshData();
  }, [refreshData]);

  // Handlers
  const handleSendChatMessage = () => {
    if (!selectedApp || !chatMessage.trim()) return;
    const updatedChat = saveChatMessage(selectedApp.id, {
      senderId: currentUser.id,
      senderName: currentUser.displayName,
      senderRole: currentUser.role,
      text: chatMessage.trim()
    }, currentUser);
    setCurrentChat(updatedChat);
    setChatMessage('');
  };

  const handleToggleChat = (status: 'open' | 'closed') => {
    if (!selectedApp) return;
    toggleChatStatus(selectedApp.id, status);
    setCurrentChat(getChatByAppId(selectedApp.id));
  };

  const handleDeleteChat = () => {
    if (!selectedApp || !confirm('Delete this entire conversation?')) return;
    deleteChat(selectedApp.id);
    setCurrentChat(null);
  };
  const handleSaveDiscord = () => {
    saveDiscordConfig(discordConfig);
    setDiscordSaved(true);
    setTimeout(() => setDiscordSaved(false), 2000);
  };

  const handleSaveGoogle = () => {
    saveGoogleConfig(googleConfig);
    setGoogleSaved(true);
    setTimeout(() => setGoogleSaved(false), 2000);
  };

  const handleSaveSiteSettings = () => {
    updateSettings(siteSettings);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  const handleStatusChange = (id: string, status: ApplicationStatus) => {
    updateApplication(id, { status, reviewedAt: new Date().toISOString() });
    refreshData();
    if (selectedApp?.id === id) setSelectedApp({ ...selectedApp, status, reviewedAt: new Date().toISOString() });
  };

  const handleAddNote = (id: string) => {
    if (!noteInput.trim()) return;
    updateApplication(id, { notes: noteInput.trim() });
    refreshData();
    if (selectedApp?.id === id) setSelectedApp({ ...selectedApp, notes: noteInput.trim() });
    setNoteInput('');
  };

  const handleDelete = (id: string) => {
    deleteApplication(id);
    refreshData();
    setShowDeleteConfirm(null);
    if (selectedApp?.id === id) setSelectedApp(null);
  };

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    const result = updateUserRole(userId, newRole, currentUser);
    if (result.success) {
      setUserMessage({ type: 'success', text: `Role updated to ${getRoleLabel(newRole)}.` });
      refreshData();
    } else {
      setUserMessage({ type: 'error', text: result.error || 'Failed.' });
    }
    setRoleChangeTarget(null);
    setTimeout(() => setUserMessage(null), 3000);
  };

  const handleDeleteUser = (userId: string) => {
    const result = deleteUser(userId, currentUser);
    if (result.success) {
      setUserMessage({ type: 'success', text: 'User deleted.' });
      refreshData();
    } else {
      setUserMessage({ type: 'error', text: result.error || 'Failed.' });
    }
    setDeleteUserConfirm(null);
    setTimeout(() => setUserMessage(null), 3000);
  };

  const handleUpdatePassword = (userId: string) => {
    if (!newPasswordInput.trim()) return;
    const result = updateUserPassword(userId, newPasswordInput.trim(), currentUser);
    if (result.success) {
      setUserMessage({ type: 'success', text: 'Password updated successfully.' });
      refreshData();
    } else {
      setUserMessage({ type: 'error', text: result.error || 'Failed to update password.' });
    }
    setPasswordChangeTarget(null);
    setNewPasswordInput('');
    setTimeout(() => setUserMessage(null), 3000);
  };

  const handleUpdateUser = () => {
    if (!selectedUser) return;
    
    // Update role first if changed
    if (userEditForm.role !== selectedUser.role) {
      updateUserRole(selectedUser.id, userEditForm.role, currentUser);
    }
    
    // Update other info
    const result = updateUserInfo(selectedUser.id, {
      displayName: userEditForm.displayName,
      email: userEditForm.email
    }, currentUser);

    if (result.success) {
      setIsEditingUser(false);
      refreshData();
      setUserMessage({ type: 'success', text: 'User information updated.' });
      setTimeout(() => setUserMessage(null), 3000);
      
      const updatedUsers = getUsers();
      const updated = updatedUsers.find(u => u.id === selectedUser.id);
      if (updated) setSelectedUser(updated);
    } else {
      setUserMessage({ type: 'error', text: result.error || 'Failed to update.' });
    }
  };

  const handleToggleUserStatus = (user: UserAccount) => {
    const newStatus = user.status === 'banned' ? 'active' : 'banned';
    const result = updateUserInfo(user.id, { status: newStatus }, currentUser);
    if (result.success) {
      refreshData();
      const updatedUsers = getUsers();
      const updated = updatedUsers.find(u => u.id === user.id);
      if (updated) setSelectedUser(updated);
    }
  };

  const handleSaveSocials = () => {
    updateSocialLinks(socialLinks);
    setSocialsSaved(true);
    setTimeout(() => setSocialsSaved(false), 2000);
  };

  const handleAddSocial = () => {
    if (!newSocial.name || !newSocial.url) return;
    const id = (newSocial.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.random().toString(36).substr(2, 4));
    const social: SocialLink = {
      id,
      name: newSocial.name,
      url: newSocial.url,
      enabled: true,
      icon: newSocial.icon || 'globe',
      description: newSocial.description || '',
      color: newSocial.color || 'neutral',
    };
    setSocialLinks([...socialLinks, social]);
    setNewSocial({ enabled: true, color: 'neutral', icon: 'globe' });
    setShowNewSocialForm(false);
  };

  const handleUpdateSocial = (id: string, updates: Partial<SocialLink>) => {
    setSocialLinks(socialLinks.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleDeleteSocial = (id: string) => {
    if (confirm('Delete this social link?')) {
      setSocialLinks(socialLinks.filter(s => s.id !== id));
    }
  };

  const handleSaveServerInfo = () => {
    updateServerInfo(serverInfo);
    setServerSaved(true);
    setTimeout(() => setServerSaved(false), 2000);
  };

  const handleSaveSeasonInfo = () => {
    saveSeasonInfo(seasonInfo);
    setSeasonSaved(true);
    setTimeout(() => setSeasonSaved(false), 2000);
  };

  const handleAddRule = () => {
    if (!newRuleText.trim()) return;
    setServerInfo((p) => ({ ...p, rules: [...p.rules, newRuleText.trim()] }));
    setNewRuleText('');
  };

  const handleEditRule = (index: number) => {
    if (!editingRuleText.trim()) return;
    setServerInfo((p) => {
      const r = [...p.rules];
      r[index] = editingRuleText.trim();
      return { ...p, rules: r };
    });
    setEditingRuleIndex(null);
    setEditingRuleText('');
  };

  const handleDeleteRule = (index: number) => {
    setServerInfo((p) => ({ ...p, rules: p.rules.filter((_, i) => i !== index) }));
  };

  // Form & Field Handlers
  const currentForm = appForms.find(f => f.id === selectedFormId);

  const handleSaveForms = (updatedForms: AppForm[]) => {
    saveAppForms(updatedForms);
    setAppForms(updatedForms);
    setFieldsSaved(true);
    setTimeout(() => setFieldsSaved(false), 2000);
  };

  const handleCreateForm = () => {
    if (!newFormName.trim()) return;
    const id = newFormName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const newForm: AppForm = {
      id,
      name: newFormName.trim(),
      description: newFormDesc.trim(),
      enabled: true,
      status: 'open',
      schedule: { timezone: 'UTC' },
      fields: []
    };
    handleSaveForms([...appForms, newForm]);
    setSelectedFormId(id);
    setShowNewFormModal(false);
    setNewFormName('');
    setNewFormDesc('');
  };

  const handleDeleteForm = (id: string) => {
    if (id === 'member-app') return alert('Cannot delete the default member application form.');
    if (confirm('Are you sure you want to delete this form? All its field configurations will be lost.')) {
      const updated = appForms.filter(f => f.id !== id);
      handleSaveForms(updated);
      setSelectedFormId('member-app');
    }
  };

// Status and schedule are now managed per-form in Form Builder tab

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    if (!currentForm) return;
    const { fields } = currentForm;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === fields.length - 1) return;
    const newFields = [...fields];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newFields[index], newFields[swapIndex]] = [newFields[swapIndex], newFields[index]];
    
    const updatedForms = appForms.map(f => f.id === selectedFormId ? { ...f, fields: newFields } : f);
    handleSaveForms(updatedForms);
  };

  const handleAddField = () => {
    if (!newField.label || !currentForm) return;
    const id = newField.label.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const field: AppField = {
      id,
      label: newField.label,
      type: newField.type as any || 'text',
      placeholder: newField.placeholder || '',
      required: newField.required || false,
      enabled: true,
      options: newField.type === 'select' ? (newField.options as any || []) : undefined
    };
    
    const updatedForms = appForms.map(f => f.id === selectedFormId ? { ...f, fields: [...f.fields, field] } : f);
    handleSaveForms(updatedForms);
    setNewField({ type: 'text', required: false });
    setShowNewFieldForm(false);
  };

  const handleUpdateField = (fieldId: string, updates: Partial<AppField>) => {
    if (!currentForm) return;
    const updatedFields = currentForm.fields.map(f => f.id === fieldId ? { ...f, ...updates } : f);
    const updatedForms = appForms.map(f => f.id === selectedFormId ? { ...f, fields: updatedFields } : f);
    setAppForms(updatedForms); // Local update only until save
  };

  const handleDeleteField = (fieldId: string) => {
    if (!currentForm) return;
    if (confirm('Delete this field?')) {
      const updatedFields = currentForm.fields.filter(f => f.id !== fieldId);
      const updatedForms = appForms.map(f => f.id === selectedFormId ? { ...f, fields: updatedFields } : f);
      handleSaveForms(updatedForms);
    }
  };

  const handleBulkDelete = () => {
    selectedApps.forEach(id => deleteApplication(id));
    setSelectedApps([]);
    setShowBulkDeleteConfirm(false);
    refreshData();
  };

  const toggleSelectApp = (id: string) => {
    setSelectedApps(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedApps.length === filteredApps.length) {
      setSelectedApps([]);
    } else {
      setSelectedApps(filteredApps.map(a => a.id));
    }
  };


  const filteredApps = applications.filter((app) => {
    const whyText = app.why || '';
    const s = app.username.toLowerCase().includes(searchQuery.toLowerCase()) || whyText.toLowerCase().includes(searchQuery.toLowerCase());
    const f = filterStatus === 'all' || app.status === filterStatus;
    return s && f;
  });

  const filteredUsers = allUsers.filter((u) =>
    u.displayName.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    (u.discordUsername || '').toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const tabs: { id: Tab; icon: typeof BarChart3; label: string; badge?: number }[] = [
    { id: 'overview', icon: BarChart3, label: 'Overview' },
    ...(canReviewApplications(currentUser.role) ? [{ id: 'applications' as Tab, icon: FileText, label: 'Applications', badge: stats.pending }] : []),
    ...(canManageRoles(currentUser.role) ? [{ id: 'users' as Tab, icon: UserCog, label: 'Users' }] : []),
    ...(canManageSettings(currentUser.role) ? [{ id: 'server' as Tab, icon: Server, label: 'Server' }] : []),
    ...(canManageSettings(currentUser.role) ? [{ id: 'formbuilder' as Tab, icon: FormInput, label: 'Form Builder' }] : []),
    ...(canManageSettings(currentUser.role) ? [{ id: 'socials' as Tab, icon: Link2, label: 'Socials' }] : []),
    ...(canManageSettings(currentUser.role) ? [{ id: 'settings' as Tab, icon: Settings, label: 'Settings' }] : []),
  ];

  const roleIcon = (role: UserRole) => {
    if (role === 'owner') return <Crown size={12} />;
    if (role === 'admin') return <Shield size={12} />;
    if (role === 'manager') return <UserCog size={12} />;
    if (role === 'staff') return <Users size={12} />;
    if (role === 'builder') return <Hammer size={12} />;
    return <User size={12} />;
  };

  const inputClass = "w-full px-4 py-3 text-sm text-white bg-neutral-950/80 border border-neutral-800 rounded-xl placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all";
  const labelClass = "block text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wider";

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-neutral-900/50 border-r border-neutral-800/50 z-40 hidden lg:flex flex-col">
        <div className="p-6 border-b border-neutral-800/50">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <div className="h-3 w-3 rounded-sm bg-emerald-500" />
            </div>
            <div>
              <span className="text-white font-semibold tracking-tight block leading-tight">Dismine</span>
              <span className="text-neutral-500 text-[10px] uppercase tracking-wider font-medium">Admin Panel</span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-800/50 group relative">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-[9px] font-bold text-white uppercase">
              {currentUser.displayName.slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-white text-xs font-medium truncate">{currentUser.displayName}</div>
              <div className={`text-[10px] font-medium ${getRoleColor(currentUser.role).text} flex items-center justify-between`}>
                {getRoleLabel(currentUser.role)}
                <button 
                  onClick={() => setShowPersonalDetails(!showPersonalDetails)}
                  className="text-neutral-500 hover:text-white transition-colors"
                  title={showPersonalDetails ? "Hide Email" : "Show Email"}
                >
                  {showPersonalDetails ? <EyeOff size={10} /> : <Eye size={10} />}
                </button>
              </div>
              {showPersonalDetails ? (
                <div className="text-[10px] text-neutral-500 truncate mt-0.5">{currentUser.email || currentUser.discordUsername}</div>
              ) : (
                <div className="text-[10px] text-neutral-500 truncate mt-0.5 blur-[3px] select-none">••••••••••••••••</div>
              )}
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => { setActiveTab(t.id); setSelectedApp(null); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${activeTab === t.id ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50 border border-transparent'}`}>
              <t.icon size={16} />
              {t.label}
              {t.badge && t.badge > 0 && <span className="ml-auto text-[10px] font-bold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">{t.badge}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-neutral-800/50 space-y-2">
          <button onClick={onBack} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-neutral-400 hover:text-white hover:bg-neutral-800/50 transition-all"><ArrowLeft size={16} />Back to Site</button>
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"><LogOut size={16} />Sign Out</button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-neutral-950/90 backdrop-blur-xl border-b border-neutral-800/50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center"><div className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /></div>
            <span className="text-white font-semibold text-sm">Admin</span>
            <span className={`text-[10px] font-medium ${getRoleColor(currentUser.role).text}`}>{getRoleLabel(currentUser.role)}</span>
          </div>
          <div className="flex items-center gap-1">
            {tabs.map((t) => (
              <button key={t.id} onClick={() => { setActiveTab(t.id); setSelectedApp(null); }}
                className={`relative p-2.5 rounded-lg transition-all ${activeTab === t.id ? 'bg-emerald-500/10 text-emerald-400' : 'text-neutral-500 hover:text-white'}`}>
                <t.icon size={16} />
                {t.badge && t.badge > 0 && <span className="absolute -top-0.5 -right-0.5 h-4 w-4 text-[8px] font-bold bg-amber-500 text-neutral-950 rounded-full flex items-center justify-center">{t.badge}</span>}
              </button>
            ))}
            <button onClick={onLogout} className="p-2.5 rounded-lg text-neutral-500 hover:text-red-400 transition-all ml-1"><LogOut size={16} /></button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-6 lg:p-8 max-w-6xl">

          {/* ═══ OVERVIEW ═══ */}
          {activeTab === 'overview' && (
            <div className="animate-fade-in">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                <p className="text-neutral-500 text-sm mt-1">Welcome back, {currentUser.displayName}</p>
              </div>

              {/* Status Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {appForms.filter(f => f.enabled).slice(0, 3).map(form => {
                  const statusLabel = form.status === 'open' ? 'Accepting Apps' : 
                                      form.status === 'closed' ? 'Closed' : 
                                      form.status === 'coming_soon' ? 'Opening Soon' : 'Ending Soon';
                  const statusColor = form.status === 'open' ? 'text-emerald-400' : 
                                      form.status === 'closed' ? 'text-red-400' : 
                                      form.status === 'coming_soon' ? 'text-amber-400' : 'text-orange-400';
                  return (
                    <div key={form.id} className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800/50 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-1">{form.name}</div>
                        <div className={`text-xs font-bold ${statusColor}`}>{statusLabel}</div>
                      </div>
                      <button onClick={() => { setSelectedFormId(form.id); setActiveTab('formbuilder'); }} className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-500 transition-colors">
                        <Settings size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Total Apps', value: stats.total, icon: Users, color: 'text-neutral-300', bg: 'bg-neutral-800' },
                  { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                  { label: 'Approved', value: stats.approved, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                  { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
                ].map((s) => (
                  <div key={s.label} className="p-5 rounded-2xl bg-neutral-900/50 border border-neutral-800/50">
                    <div className={`h-9 w-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}><s.icon size={16} className={s.color} /></div>
                    <div className="text-2xl font-bold text-white">{s.value}</div>
                    <div className="text-neutral-500 text-xs mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
              
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
                <div className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800/50">
                  <h3 className="text-white font-semibold text-sm mb-3">Your Permissions</h3>
                  <div className="space-y-2">
                    {[
                      { label: 'Review Applications', allowed: canReviewApplications(currentUser.role) },
                      { label: 'Manage User Roles', allowed: canManageRoles(currentUser.role) },
                      { label: 'Manage Server & Season', allowed: canManageSettings(currentUser.role) },
                      { label: 'Manage Social Links', allowed: canManageSettings(currentUser.role) },
                      { label: 'Delete Users', allowed: canDeleteUsers(currentUser.role) },
                    ].map((p) => (
                      <div key={p.label} className="flex items-center justify-between px-3 py-2 rounded-lg bg-neutral-800/30">
                        <span className="text-neutral-400 text-xs">{p.label}</span>
                        {p.allowed ? <CheckCircle size={14} className="text-emerald-500" /> : <XCircle size={14} className="text-neutral-600" />}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800/50">
                  <h3 className="text-white font-semibold text-sm mb-3">Quick Info</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-neutral-800/30"><span className="text-neutral-400 text-xs">Users</span><span className="text-white text-xs font-mono">{allUsers.length}</span></div>
                    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-neutral-800/30"><span className="text-neutral-400 text-xs">Staff</span><span className="text-white text-xs font-mono">{allUsers.filter((u) => u.role !== 'user').length}</span></div>
                    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-neutral-800/30"><span className="text-neutral-400 text-xs">Approval Rate</span><span className="text-emerald-400 text-xs font-mono">{stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}%</span></div>
                    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-neutral-800/30"><span className="text-neutral-400 text-xs">Season</span><span className="text-white text-xs font-mono">S{seasonInfo.number} — {seasonInfo.name}</span></div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-neutral-900/50 border border-neutral-800/50 overflow-hidden">
                <div className="px-6 py-4 border-b border-neutral-800/50 flex items-center justify-between">
                  <h2 className="text-white font-semibold">Recent Applications</h2>
                  {canReviewApplications(currentUser.role) && <button onClick={() => setActiveTab('applications')} className="text-xs text-emerald-400 hover:text-emerald-300">View all →</button>}
                </div>
                <div className="divide-y divide-neutral-800/50">
                  {applications.slice(0, 5).map((app) => {
                    const c = statusConfig[app.status];
                    return (
                      <div key={app.id} className="px-6 py-4 flex items-center justify-between hover:bg-neutral-800/20 transition-colors cursor-pointer"
                        onClick={() => { if (canReviewApplications(currentUser.role)) { setSelectedApp(app); setActiveTab('applications'); setNoteInput(app.notes || ''); setMessageInput(app.adminMessage || ''); } }}>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-400 uppercase">{app.username.slice(0, 2)}</div>
                          <div><div className="text-white text-sm font-medium">{app.username}</div><div className="text-neutral-500 text-xs">{formatDate(app.submittedAt)}</div></div>
                        </div>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${c.bg} ${c.border} border ${c.color}`}>{c.label}</span>
                      </div>
                    );
                  })}
                  {applications.length === 0 && <div className="px-6 py-12 text-center text-neutral-600 text-sm">No applications yet</div>}
                </div>
              </div>
            </div>
          )}

          {/* ═══ FORM BUILDER TAB ═══ */}
          {activeTab === 'formbuilder' && (
             <div className="animate-fade-in">
              <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-white">Form Builder</h1>
                  <p className="text-neutral-500 text-sm mt-1">Manage multiple application forms and their fields.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setShowNewFormModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-neutral-800 text-white text-sm font-semibold rounded-xl hover:bg-neutral-700 transition-all">
                    <Plus size={14} /> Create New Form
                  </button>
                  <button onClick={() => handleSaveForms(appForms)} className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all ${fieldsSaved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-500 text-neutral-950 hover:bg-emerald-400'}`}>
                    {fieldsSaved ? <><CheckCircle size={14} />Saved!</> : <><Save size={14} />Save All Forms</>}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Form Selector Sidebar */}
                <div className="lg:col-span-1 space-y-2">
                  <h3 className="text-xs font-black text-neutral-600 uppercase tracking-widest px-2 mb-3">Active Forms</h3>
                  {appForms.map(form => (
                    <div key={form.id} className="group relative">
                      <button
                        onClick={() => setSelectedFormId(form.id)}
                        className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between ${selectedFormId === form.id ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/5' : 'bg-neutral-900/50 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 border border-neutral-800/50'}`}
                      >
                        <div className="min-w-0 pr-6">
                          <div className="font-bold text-sm truncate">{form.name}</div>
                          <div className="text-[10px] opacity-60 truncate">{form.fields.length} fields</div>
                        </div>
                        {selectedFormId === form.id && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />}
                      </button>
                      {form.id !== 'member-app' && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteForm(form.id); }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-neutral-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Field List */}
                <div className="lg:col-span-3 space-y-4">
                  {currentForm && (
                    <div className="mb-6 p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800/50 animate-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <input 
                            type="text" 
                            value={currentForm.name} 
                            onChange={(e) => handleSaveForms(appForms.map(f => f.id === selectedFormId ? { ...f, name: e.target.value } : f))}
                            className="bg-transparent border-none p-0 text-xl font-black text-white focus:ring-0 w-full" 
                            placeholder="Form Name"
                          />
                          <input 
                            type="text" 
                            value={currentForm.description} 
                            onChange={(e) => handleSaveForms(appForms.map(f => f.id === selectedFormId ? { ...f, description: e.target.value } : f))}
                            className="bg-transparent border-none p-0 text-sm text-neutral-500 focus:ring-0 w-full mt-1" 
                            placeholder="Form Description"
                          />
                        </div>
                        <div className="flex items-center gap-3">
                           <button 
                             onClick={() => handleSaveForms(appForms.map(f => f.id === selectedFormId ? { ...f, enabled: !f.enabled } : f))}
                             className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${currentForm.enabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}
                           >
                             {currentForm.enabled ? <Unlock size={14} /> : <Lock size={14} />}
                             {currentForm.enabled ? 'ENABLED' : 'DISABLED'}
                           </button>
                        </div>
                      </div>

                      {/* Per-form Status & Schedule */}
                      <div className="mb-8 p-4 bg-neutral-950/40 rounded-xl border border-neutral-800/50">
                        <div className="flex items-center gap-2 mb-4">
                          <Settings size={14} className="text-emerald-500" />
                          <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Form Availability & Schedule</h4>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
                          {[
                            { id: 'open', label: 'Open', icon: Unlock, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                            { id: 'ending_soon', label: 'Ending Soon', icon: Clock, color: 'text-orange-400', bg: 'bg-orange-500/10' },
                            { id: 'coming_soon', label: 'Coming Soon', icon: Calendar, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                            { id: 'closed', label: 'Closed', icon: Lock, color: 'text-red-400', bg: 'bg-red-500/10' },
                          ].map((s) => (
                            <button
                              key={s.id}
                              onClick={() => handleSaveForms(appForms.map(f => f.id === selectedFormId ? { ...f, status: s.id as any } : f))}
                              className={`p-2.5 rounded-lg border transition-all text-center ${
                                currentForm.status === s.id 
                                  ? `${s.bg} border-emerald-500/30` 
                                  : 'bg-neutral-900/50 border-neutral-800 hover:bg-neutral-800'
                              }`}
                            >
                              <s.icon size={14} className={`mx-auto mb-1 ${currentForm.status === s.id ? s.color : 'text-neutral-500'}`} />
                              <div className={`text-[10px] font-bold ${currentForm.status === s.id ? 'text-white' : 'text-neutral-500'}`}>{s.label}</div>
                            </button>
                          ))}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-neutral-600 mb-2 uppercase tracking-widest">Auto-Open Date</label>
                            <input 
                              type="datetime-local" 
                              value={currentForm.schedule?.openDate || ''} 
                              onChange={(e) => handleSaveForms(appForms.map(f => f.id === selectedFormId ? { ...f, schedule: { ...f.schedule, openDate: e.target.value } } : f))}
                              className="w-full px-3 py-2 text-xs bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-emerald-500/50"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-neutral-600 mb-2 uppercase tracking-widest">Auto-Close Date</label>
                            <input 
                              type="datetime-local" 
                              value={currentForm.schedule?.closeDate || ''} 
                              onChange={(e) => handleSaveForms(appForms.map(f => f.id === selectedFormId ? { ...f, schedule: { ...f.schedule, closeDate: e.target.value } } : f))}
                              className="w-full px-3 py-2 text-xs bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-emerald-500/50"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-bold text-neutral-600 mb-2 uppercase tracking-widest">Schedule Timezone</label>
                            <select 
                              value={currentForm.schedule?.timezone || 'UTC'} 
                              onChange={(e) => handleSaveForms(appForms.map(f => f.id === selectedFormId ? { ...f, schedule: { ...f.schedule, timezone: e.target.value } } : f))}
                              className="w-full px-3 py-2 text-xs bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-emerald-500/50"
                            >
                              {['UTC', 'EST', 'PST', 'CST', 'GMT', 'CET', 'EET', 'JST', 'AEST'].map(tz => (
                                <option key={tz} value={tz}>{tz}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {currentForm.fields.map((field, index) => (
                          <div key={field.id} className={`p-4 rounded-xl border transition-all ${field.enabled ? 'bg-neutral-950/50 border-neutral-800/50' : 'bg-neutral-950/20 border-neutral-800/20 opacity-60'}`}>
                            {editingFieldId === field.id ? (
                              <div className="space-y-4 animate-in slide-in-from-top-1 duration-200">
                                <div className="flex gap-2">
                                  <input type="text" value={field.label} onChange={(e) => handleUpdateField(field.id, { label: e.target.value })} className={inputClass} placeholder="Field Label" />
                                  <select value={field.type} onChange={(e) => handleUpdateField(field.id, { type: e.target.value as any })} className="w-40 px-3 py-3 text-sm bg-neutral-900 border border-neutral-800 rounded-xl text-white">
                                      <option value="text">Text Input</option>
                                      <option value="textarea">Long Text / Textarea</option>
                                      <option value="number">Number Input</option>
                                      <option value="select">Dropdown / Select</option>
                                  </select>
                                </div>
                                <input type="text" value={field.placeholder || ''} onChange={(e) => handleUpdateField(field.id, { placeholder: e.target.value })} className={inputClass} placeholder="Placeholder text..." />
                                
                                {field.type === 'select' && (
                                  <div>
                                    <label className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mb-2 block">Dropdown Options (One per line)</label>
                                    <textarea 
                                      value={field.options?.join('\n') || ''} 
                                      onChange={(e) => handleUpdateField(field.id, { options: e.target.value.split('\n').filter(Boolean) })} 
                                      className={`${inputClass} font-mono text-xs`} 
                                      rows={4} 
                                      placeholder="Option 1&#10;Option 2&#10;Option 3" 
                                    />
                                  </div>
                                )}
                                
                                <div className="flex items-center justify-between pt-2 border-t border-neutral-800/50">
                                  <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className={`h-5 w-5 rounded border flex items-center justify-center transition-all ${field.required ? 'bg-emerald-500 border-emerald-500' : 'bg-neutral-900 border-neutral-700'}`}>
                                      <input type="checkbox" checked={field.required} onChange={(e) => handleUpdateField(field.id, { required: e.target.checked })} className="hidden" />
                                      {field.required && <CheckCircle size={12} className="text-neutral-950" />}
                                    </div>
                                    <span className="text-xs font-bold text-neutral-400 group-hover:text-neutral-200 transition-colors uppercase tracking-widest">Required Field</span>
                                  </label>
                                  <button onClick={() => { handleSaveForms(appForms); setEditingFieldId(null); }} className="px-5 py-2 text-xs font-black bg-emerald-500 text-neutral-950 rounded-lg shadow-lg shadow-emerald-500/10 active:scale-95 transition-all">DONE</button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="flex flex-col gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleMoveField(index, 'up')} disabled={index === 0} className="text-neutral-400 hover:text-white disabled:opacity-0"><ArrowUp size={14} /></button>
                                    <button onClick={() => handleMoveField(index, 'down')} disabled={index === currentForm.fields.length - 1} className="text-neutral-400 hover:text-white disabled:opacity-0"><ArrowDown size={14} /></button>
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <h3 className="text-white font-bold text-sm tracking-tight">{field.label}</h3>
                                      {field.required && <span className="text-[9px] font-black bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded uppercase border border-red-500/10">Required</span>}
                                      {!field.enabled && <span className="text-[9px] font-black bg-neutral-800 text-neutral-500 px-1.5 py-0.5 rounded uppercase">Disabled</span>}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-medium">
                                      <span className="bg-neutral-800 px-1.5 py-0.5 rounded uppercase tracking-wider">{field.type}</span>
                                      {field.placeholder && <span className="truncate max-w-[200px] italic">"{field.placeholder}"</span>}
                                      {field.type === 'select' && <span>({field.options?.length || 0} options)</span>}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button onClick={() => handleUpdateField(field.id, { enabled: !field.enabled })} className="p-2 text-neutral-500 hover:text-white rounded-lg bg-neutral-800/40 hover:bg-neutral-800 transition-all">
                                    {field.enabled ? <ToggleRight size={18} className="text-emerald-500" /> : <ToggleLeft size={18} />}
                                  </button>
                                  <button onClick={() => setEditingFieldId(field.id)} className="p-2 text-neutral-500 hover:text-blue-400 rounded-lg bg-neutral-800/40 hover:bg-neutral-800 transition-all"><Pencil size={16} /></button>
                                  <button onClick={() => handleDeleteField(field.id)} className="p-2 text-neutral-500 hover:text-red-400 rounded-lg bg-neutral-800/40 hover:bg-neutral-800 transition-all"><Trash2 size={16} /></button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}

                        {showNewFieldForm ? (
                          <div className="p-6 rounded-xl bg-neutral-900/50 border border-emerald-500/20 space-y-4 animate-in slide-in-from-top-4 duration-300">
                            <h3 className="text-emerald-500 font-black text-xs uppercase tracking-widest">Configure New Field</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className={labelClass}>Field Label</label>
                                <input type="text" placeholder="e.g. Minecraft Username" value={newField.label || ''} onChange={(e) => setNewField({...newField, label: e.target.value})} className={inputClass} />
                              </div>
                              <div>
                                <label className={labelClass}>Field Type</label>
                                <select value={newField.type} onChange={(e) => setNewField({...newField, type: e.target.value as any})} className={inputClass}>
                                    <option value="text">Text Input</option>
                                    <option value="textarea">Long Text / Textarea</option>
                                    <option value="number">Number Input</option>
                                    <option value="select">Dropdown / Select</option>
                                </select>
                              </div>
                            </div>
                            <div>
                                <label className={labelClass}>Placeholder Text</label>
                                <input type="text" placeholder="Hint for the user..." value={newField.placeholder || ''} onChange={(e) => setNewField({...newField, placeholder: e.target.value})} className={inputClass} />
                            </div>
                            
                            {newField.type === 'select' && (
                              <div>
                                <label className={labelClass}>Options (One per line)</label>
                                <textarea 
                                  placeholder="Option 1&#10;Option 2" 
                                  onChange={(e) => setNewField({...newField, options: e.target.value.split('\n').filter(Boolean)})} 
                                  className={`${inputClass} font-mono text-xs`} 
                                  rows={4} 
                                />
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={newField.required} onChange={(e) => setNewField({...newField, required: e.target.checked})} className="rounded bg-neutral-800 border-neutral-700 text-emerald-500" />
                                <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Mandatory Field</span>
                              </label>
                              <div className="flex gap-3">
                                <button onClick={() => setShowNewFieldForm(false)} className="px-4 py-2 text-xs font-bold text-neutral-500 hover:text-white transition-colors">CANCEL</button>
                                <button onClick={handleAddField} disabled={!newField.label} className="px-6 py-2 bg-emerald-500 text-neutral-950 font-black rounded-lg text-xs tracking-widest hover:bg-emerald-400 disabled:opacity-30 disabled:scale-100 transition-all active:scale-95 shadow-lg shadow-emerald-500/10">ADD FIELD</button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => setShowNewFieldForm(true)} className="w-full py-5 border-2 border-dashed border-neutral-800 rounded-2xl text-neutral-500 hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all flex items-center justify-center gap-3 group">
                             <div className="h-8 w-8 rounded-full bg-neutral-900 flex items-center justify-center group-hover:bg-emerald-500/20 group-hover:text-emerald-500 transition-all">
                               <Plus size={20} />
                             </div>
                             <span className="font-black text-xs uppercase tracking-[0.2em]">Add New Field</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* New Form Modal */}
              {showNewFormModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
                  <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 max-w-lg w-full shadow-[0_0_100px_rgba(16,185,129,0.1)] animate-in zoom-in-95 duration-200">
                    <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-6 border border-emerald-500/20">
                      <FormInput size={28} />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Create New Form</h2>
                    <p className="text-neutral-500 text-sm mb-8 leading-relaxed">Define a new application category with its own unique set of requirements and fields.</p>
                    
                    <div className="space-y-5">
                      <div>
                        <label className={labelClass}>Form Display Name</label>
                        <input type="text" value={newFormName} onChange={(e) => setNewFormName(e.target.value)} className={inputClass} placeholder="e.g. Staff Application" autoFocus />
                      </div>
                      <div>
                        <label className={labelClass}>Short Description</label>
                        <textarea value={newFormDesc} onChange={(e) => setNewFormDesc(e.target.value)} className={`${inputClass} resize-none`} rows={3} placeholder="Tell players what this form is for..." />
                      </div>
                      <div className="flex gap-4 pt-4">
                        <button onClick={handleCreateForm} className="flex-1 py-4 bg-emerald-500 text-neutral-950 font-black rounded-2xl hover:bg-emerald-400 shadow-xl shadow-emerald-500/20 transition-all active:scale-95 uppercase tracking-widest text-xs">Create Form</button>
                        <button onClick={() => { setShowNewFormModal(false); setNewFormName(''); setNewFormDesc(''); }} className="flex-1 py-4 bg-neutral-800 text-neutral-300 font-bold rounded-2xl hover:bg-neutral-700 transition-all uppercase tracking-widest text-xs">Cancel</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
             </div>
          )}

          {/* ═══ APPLICATIONS LIST (existing) ═══ */}
          {activeTab === 'applications' && !selectedApp && (
            <div className="animate-fade-in">
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-white">Applications</h1>
                  <p className="text-neutral-500 text-sm mt-1">{filteredApps.length} of {applications.length} applications</p>
                </div>
                {selectedApps.length > 0 && (
                  <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl">
                    <span className="text-xs font-bold text-red-400">{selectedApps.length} selected</span>
                    <button onClick={() => setShowBulkDeleteConfirm(true)} className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold bg-red-500 text-white rounded-lg hover:bg-red-400 transition-all">
                      <Trash2 size={12} /> Bulk Delete
                    </button>
                    <button onClick={() => setSelectedApps([])} className="text-xs text-neutral-500 hover:text-neutral-300">Cancel</button>
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`${inputClass} pl-11`} />
                </div>
                <div className="relative">
                  <button onClick={() => setShowFilterDropdown(!showFilterDropdown)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-neutral-300 bg-neutral-900/80 border border-neutral-800 rounded-xl hover:border-neutral-700 transition-all">
                    <Filter size={14} />{filterStatus === 'all' ? 'All Status' : statusConfig[filterStatus].label}<ChevronDown size={14} className={`transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showFilterDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-48 py-2 rounded-xl bg-neutral-900 border border-neutral-800 shadow-xl z-20">
                      <button onClick={() => { setFilterStatus('all'); setShowFilterDropdown(false); }} className={`w-full text-left px-4 py-2 text-sm ${filterStatus === 'all' ? 'text-emerald-400 bg-emerald-500/10' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}>All Status</button>
                      {(Object.entries(statusConfig) as [ApplicationStatus, typeof statusConfig.pending][]).map(([s, c]) => (
                        <button key={s} onClick={() => { setFilterStatus(s); setShowFilterDropdown(false); }} className={`w-full text-left px-4 py-2 text-sm ${filterStatus === s ? `${c.color} ${c.bg}` : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}>{c.label}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="rounded-2xl bg-neutral-900/50 border border-neutral-800/50 overflow-hidden">
                <div className="px-6 py-3 border-b border-neutral-800/50 bg-neutral-800/20 flex items-center gap-4">
                  <input type="checkbox" checked={selectedApps.length === filteredApps.length && filteredApps.length > 0} onChange={toggleSelectAll} className="rounded bg-neutral-900 border-neutral-700 text-emerald-500" />
                  <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Select All {filterStatus !== 'all' ? `(${statusConfig[filterStatus].label})` : ''}</span>
                </div>
                <div className="divide-y divide-neutral-800/50">
                  {filteredApps.map((app) => {
                    const c = statusConfig[app.status];
                    return (
                      <div key={app.id} className={`px-6 py-4 transition-colors flex items-center gap-4 ${selectedApps.includes(app.id) ? 'bg-emerald-500/5' : 'hover:bg-neutral-800/20'}`}>
                        <input type="checkbox" checked={selectedApps.includes(app.id)} onChange={() => toggleSelectApp(app.id)} className="rounded bg-neutral-900 border-neutral-700 text-emerald-500" />
                        <div className="flex items-center justify-between flex-1 min-w-0">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="h-9 w-9 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-400 uppercase shrink-0">{app.username.slice(0, 2)}</div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="text-white text-sm font-medium truncate">{app.username}</div>
                                {app.formId === 'staff-app' && <span className="text-[8px] font-black bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded uppercase">Staff App</span>}
                                {app.formId === 'ban-appeal' && <span className="text-[8px] font-black bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded uppercase">Ban Appeal</span>}
                                {app.formId === 'member-app' && <span className="text-[8px] font-black bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded uppercase">Whitelisted</span>}
                              </div>
                              <div className="text-neutral-500 text-xs truncate">
                                {app.formName || 'Member Application'} · {app.age ? `${app.age}y · ` : ''}{app.timezone ? `${app.timezone.split(' ')[0]} · ` : ''}{formatDate(app.submittedAt)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0 ml-4">
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${c.bg} ${c.border} border ${c.color} hidden sm:inline-flex`}>{c.label}</span>
                            <button onClick={() => { setSelectedApp(app); setNoteInput(app.notes || ''); setMessageInput(app.adminMessage || ''); }} className="p-2 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-800 transition-all"><Eye size={14} /></button>
                            {app.status !== 'approved' && <button onClick={() => handleStatusChange(app.id, 'approved')} className="p-2 rounded-lg text-neutral-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"><CheckCircle size={14} /></button>}
                            {app.status !== 'rejected' && <button onClick={() => handleStatusChange(app.id, 'rejected')} className="p-2 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-all"><XCircle size={14} /></button>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {filteredApps.length === 0 && (
                    <div className="px-6 py-16 text-center">
                      <Search size={24} className="text-neutral-700 mx-auto mb-3" />
                      <p className="text-neutral-500 text-sm">No applications found</p>
                      <button onClick={() => { setSearchQuery(''); setFilterStatus('all'); }} className="mt-2 text-xs text-emerald-400 hover:text-emerald-300">Clear filters</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Bulk Delete Confirm Modal */}
              {showBulkDeleteConfirm && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-md w-full animate-in zoom-in duration-200">
                    <div className="h-12 w-12 rounded-xl bg-red-500/20 flex items-center justify-center text-red-500 mb-4">
                      <Trash2 size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Bulk Delete Applications</h3>
                    <p className="text-neutral-400 text-sm mb-6">Are you sure you want to delete <span className="text-white font-bold">{selectedApps.length}</span> applications? This action is permanent and cannot be undone.</p>
                    <div className="flex gap-3">
                      <button onClick={handleBulkDelete} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-400 transition-all">Yes, Delete All</button>
                      <button onClick={() => setShowBulkDeleteConfirm(false)} className="flex-1 py-3 bg-neutral-800 text-neutral-300 font-bold rounded-xl hover:bg-neutral-700 transition-all">Cancel</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ APPLICATION DETAIL (existing) ═══ */}
          {activeTab === 'applications' && selectedApp && (
            <div className="animate-fade-in">
              <button onClick={() => setSelectedApp(null)} className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-300 transition-colors mb-6 group">
                <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />Back to applications
              </button>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800/50">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-xl bg-neutral-800 flex items-center justify-center text-lg font-bold text-neutral-300 uppercase">{selectedApp.username.slice(0, 2)}</div>
                        <div><h2 className="text-xl font-bold text-white">{selectedApp.username}</h2>
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusConfig[selectedApp.status].bg} ${statusConfig[selectedApp.status].border} border ${statusConfig[selectedApp.status].color}`}>{statusConfig[selectedApp.status].label}</span>
                        </div>
                      </div>
                      <div>
                        {showDeleteConfirm === selectedApp.id ? (
                          <div className="flex items-center gap-2 p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                            <span className="text-xs text-red-400 px-2">Delete?</span>
                            <button onClick={() => handleDelete(selectedApp.id)} className="px-3 py-1 text-xs font-medium bg-red-500 text-white rounded-lg">Yes</button>
                            <button onClick={() => setShowDeleteConfirm(null)} className="px-3 py-1 text-xs text-neutral-400 rounded-lg">No</button>
                          </div>
                        ) : (
                          <button onClick={() => setShowDeleteConfirm(selectedApp.id)} className="p-2 rounded-lg text-neutral-600 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 size={16} /></button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        { icon: User, label: 'Age', value: selectedApp.age },
                        { icon: Globe, label: 'Timezone', value: selectedApp.timezone?.split(' ')[0] || 'N/A' },
                        { icon: Calendar, label: 'Applied', value: new Date(selectedApp.submittedAt).toLocaleDateString() },
                        { icon: Clock, label: 'Reviewed', value: selectedApp.reviewedAt ? new Date(selectedApp.reviewedAt).toLocaleDateString() : 'N/A' },
                      ].map((i) => (
                        <div key={i.label} className="p-3 rounded-xl bg-neutral-800/50">
                          <div className="flex items-center gap-1.5 mb-1"><i.icon size={12} className="text-neutral-500" /><span className="text-neutral-500 text-[10px] uppercase tracking-wider">{i.label}</span></div>
                          <div className="text-white text-sm font-medium">{i.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800/50">
                    <h3 className="text-white font-semibold text-sm flex items-center gap-2 mb-4"><MessageSquare size={14} className="text-emerald-500" />Why they want to join</h3>
                    <p className="text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap">{selectedApp.why}</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800/50">
                    <h3 className="text-white font-semibold text-sm flex items-center gap-2 mb-4"><FileText size={14} className="text-blue-400" />SMP Experience</h3>
                    <p className="text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap">{selectedApp.experience}</p>
                  </div>

                  {/* ── Chat with Applicant ── */}
                  <div className="p-6 rounded-2xl bg-neutral-900/50 border border-emerald-500/10 flex flex-col h-[500px]">
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-neutral-800">
                      <div className="flex items-center gap-2">
                        <MessageSquare size={18} className="text-emerald-500" />
                        <h3 className="text-white font-semibold text-sm">Communication</h3>
                      </div>
                      {currentChat && (
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleToggleChat(currentChat.status === 'open' ? 'closed' : 'open')}
                            className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all ${
                              currentChat.status === 'open' 
                                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            }`}
                          >
                            {currentChat.status === 'open' ? 'CLOSE CHAT' : 'REOPEN CHAT'}
                          </button>
                          <button onClick={handleDeleteChat} className="p-1.5 text-neutral-500 hover:text-red-400 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>

                    {!currentChat ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <div className="h-16 w-16 rounded-full bg-neutral-800 flex items-center justify-center mb-4 text-neutral-600">
                          <MessageSquare size={32} />
                        </div>
                        <h4 className="text-white font-bold text-sm mb-2">Initiate Conversation</h4>
                        <p className="text-neutral-500 text-xs mb-6 leading-relaxed">Send the first message to open a secure channel with the applicant. They will only see the chat once you start it.</p>
                        <div className="w-full flex gap-2">
                          <input 
                            type="text" 
                            value={chatMessage} 
                            onChange={(e) => setChatMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                            placeholder="Type first message..." 
                            className={`${inputClass} !py-2.5`} 
                          />
                          <button onClick={handleSendChatMessage} className="px-4 bg-emerald-500 text-neutral-950 rounded-xl font-bold hover:bg-emerald-400 transition-all">START</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
                          {currentChat.messages.map((msg) => (
                            <div key={msg.id} className={`flex flex-col ${msg.senderId === currentUser.id ? 'items-end' : 'items-start'}`}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] font-bold ${msg.senderId === currentUser.id ? 'text-emerald-400' : 'text-blue-400'}`}>
                                  {msg.senderName} {msg.senderRole !== 'user' && `(${getRoleLabel(msg.senderRole)})`}
                                </span>
                                <span className="text-[9px] text-neutral-600">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <div className={`px-4 py-2.5 rounded-2xl max-w-[90%] text-sm ${
                                msg.senderId === currentUser.id 
                                  ? 'bg-emerald-500/10 text-emerald-100 rounded-tr-none border border-emerald-500/20' 
                                  : 'bg-neutral-800 text-neutral-200 rounded-tl-none border border-neutral-700'
                              }`}>
                                {msg.text}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {currentChat.status === 'open' ? (
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={chatMessage} 
                              onChange={(e) => setChatMessage(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                              placeholder="Type a message..." 
                              className={`${inputClass} !py-2.5`} 
                            />
                            <button onClick={handleSendChatMessage} className="px-4 bg-emerald-500 text-neutral-950 rounded-xl font-bold hover:bg-emerald-400 transition-all">SEND</button>
                          </div>
                        ) : (
                          <div className="p-3 text-center bg-neutral-950/50 rounded-xl border border-neutral-800">
                            <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest">This conversation has been closed</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800/50">
                    <h3 className="text-white font-semibold text-sm mb-4">Actions</h3>
                    <div className="space-y-2">
                      <button onClick={() => handleStatusChange(selectedApp.id, 'approved')} disabled={selectedApp.status === 'approved'} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"><CheckCircle size={14} />Approve</button>
                      <button onClick={() => handleStatusChange(selectedApp.id, 'under_review')} disabled={selectedApp.status === 'under_review'} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"><Eye size={14} />Under Review</button>
                      <button onClick={() => handleStatusChange(selectedApp.id, 'rejected')} disabled={selectedApp.status === 'rejected'} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"><XCircle size={14} />Reject</button>
                      <button onClick={() => handleStatusChange(selectedApp.id, 'pending')} disabled={selectedApp.status === 'pending'} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-neutral-800 border border-neutral-700/50 text-neutral-400 hover:bg-neutral-700/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"><Clock size={14} />Reset Pending</button>
                    </div>
                  </div>
                  <div className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800/50">
                    <h3 className="text-white font-semibold text-sm mb-4">Admin Notes</h3>
                    {selectedApp.notes && <div className="mb-4 p-3 rounded-xl bg-neutral-800/50 border border-neutral-700/30"><p className="text-neutral-300 text-xs leading-relaxed">{selectedApp.notes}</p></div>}
                    <textarea value={noteInput} onChange={(e) => setNoteInput(e.target.value)} rows={3} placeholder="Add a note..." className={`${inputClass} text-xs resize-none`} />
                    <button onClick={() => handleAddNote(selectedApp.id)} disabled={!noteInput.trim()} className="mt-2 w-full px-4 py-2 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed">Save Note</button>
                  </div>
                  <div className="p-6 rounded-2xl bg-neutral-900/50 border border-emerald-500/10">
                    <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2"><MessageSquare size={14} className="text-emerald-500" />Message to Applicant</h3>
                    <p className="text-neutral-500 text-[11px] mb-3">Visible to the applicant in their portal.</p>
                    {selectedApp.adminMessage && <div className="mb-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10"><p className="text-emerald-300 text-xs leading-relaxed">{selectedApp.adminMessage}</p></div>}
                    <textarea value={messageInput} onChange={(e) => setMessageInput(e.target.value)} rows={3} placeholder="Write a message..." className={`${inputClass} text-xs resize-none`} />
                    <button onClick={() => { if (!messageInput.trim()) return; updateApplication(selectedApp.id, { adminMessage: messageInput.trim() }); refreshData(); setSelectedApp({ ...selectedApp, adminMessage: messageInput.trim() }); setMessageInput(''); }} disabled={!messageInput.trim()} className="mt-2 w-full px-4 py-2 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed">Send Message</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ USERS ═══ */}
          {activeTab === 'users' && (
            <div className="animate-fade-in">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-white">User Management</h1>
                <p className="text-neutral-500 text-sm mt-1">{allUsers.length} registered users</p>
              </div>
              {userMessage && (
                <div className={`mb-6 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm ${userMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                  {userMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}{userMessage.text}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                {ALL_ROLES.map((r) => { const rc = getRoleColor(r); return (
                  <div key={r} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${rc.bg} ${rc.border} border ${rc.text}`}>
                    {roleIcon(r)}{getRoleLabel(r)}<span className="text-neutral-500 ml-1">({allUsers.filter((u) => u.role === r).length})</span>
                  </div>
                ); })}
              </div>
              <div className="relative mb-6">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input type="text" placeholder="Search users..." value={userSearchQuery} onChange={(e) => setUserSearchQuery(e.target.value)} className={`${inputClass} pl-11`} />
              </div>
              <div className="rounded-2xl bg-neutral-900/50 border border-neutral-800/50 overflow-hidden divide-y divide-neutral-800/50">
                {filteredUsers.map((u) => {
                  const rc = getRoleColor(u.role);
                  return (
                    <div key={u.id} className="px-6 py-4 hover:bg-neutral-800/20 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-500/50 to-emerald-700/50 flex items-center justify-center text-xs font-bold text-white uppercase shrink-0">{u.displayName.slice(0, 2)}</div>
                          <div className="min-w-0">
                            <div className="text-white text-sm font-medium truncate">{u.displayName}</div>
                            <div className="text-neutral-500 text-xs truncate flex items-center gap-2">
                              <span className={!showPersonalDetails && u.id !== currentUser.id ? "blur-[3.5px] select-none" : ""}>
                                {u.email || u.discordUsername || 'N/A'}
                              </span>
                              · {u.authMethod}
                            </div>
                          </div>
                        </div>
                                                  <div className="flex items-center gap-3 shrink-0 ml-4">
                          {roleChangeTarget === u.id ? (
                            <div className="flex flex-wrap gap-1">
                              {ALL_ROLES.filter((r) => { if (r === 'owner') return false; if (currentUser.role === 'admin' && r === 'admin') return false; return r !== u.role; }).map((r) => {
                                const rrc = getRoleColor(r);
                                return <button key={r} onClick={() => handleRoleChange(u.id, r)} className={`text-xs px-2 py-1 rounded-lg ${rrc.bg} ${rrc.text} hover:opacity-80`}>{getRoleLabel(r)}</button>;
                              })}
                              <button onClick={() => setRoleChangeTarget(null)} className="text-xs text-neutral-600 hover:text-neutral-400 px-2 py-1">Cancel</button>
                            </div>
                          ) : passwordChangeTarget === u.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={newPasswordInput}
                                onChange={(e) => setNewPasswordInput(e.target.value)}
                                placeholder="New password"
                                className="px-3 py-1 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-emerald-500/50"
                                autoFocus
                              />
                              <button onClick={() => handleUpdatePassword(u.id)} className="px-3 py-1 text-xs font-medium bg-emerald-500 text-neutral-950 rounded-lg hover:bg-emerald-400">Save</button>
                              <button onClick={() => { setPasswordChangeTarget(null); setNewPasswordInput(''); }} className="text-xs text-neutral-500 hover:text-neutral-300">Cancel</button>
                            </div>
                          ) : (
                            <>
                              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${rc.bg} ${rc.border} border ${rc.text}`}>{roleIcon(u.role)}{getRoleLabel(u.role)}</span>
                              {u.role !== 'owner' && canManageRoles(currentUser.role) && (
                                <>
                                  <button onClick={() => setRoleChangeTarget(u.id)} title="Change Role" className="p-2 rounded-lg text-neutral-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all"><Shield size={14} /></button>
                                  {u.authMethod === 'email' && (
                                    <button onClick={() => setPasswordChangeTarget(u.id)} title="Change Password" className="p-2 rounded-lg text-neutral-500 hover:text-amber-400 hover:bg-amber-500/10 transition-all"><Lock size={14} /></button>
                                  )}
                                </>
                              )}
                              {u.role !== 'owner' && canDeleteUsers(currentUser.role) && (
                                <>
                                  {deleteUserConfirm === u.id ? (
                                    <div className="flex items-center gap-1">
                                      <button onClick={() => handleDeleteUser(u.id)} className="px-2 py-1 text-[10px] font-medium bg-red-500 text-white rounded-md">Delete</button>
                                      <button onClick={() => setDeleteUserConfirm(null)} className="px-2 py-1 text-[10px] text-neutral-500">Cancel</button>
                                    </div>
                                  ) : (
                                    <button onClick={() => setDeleteUserConfirm(u.id)} className="p-2 rounded-lg text-neutral-600 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 size={14} /></button>
                                  )}
                                </>
                              )}
                              {u.role === 'owner' && <span className="text-[10px] text-neutral-600 px-2">Protected</span>}
                            </>
                          )}
                          <button 
                            onClick={() => {
                              setSelectedUser(u);
                              setUserEditForm({ displayName: u.displayName, email: u.email || '', role: u.role });
                              setIsEditingUser(false);
                            }}
                            className="p-2 rounded-lg text-neutral-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all ml-2"
                            title="Manage User Details"
                          >
                            <User size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {filteredUsers.length === 0 && <div className="px-6 py-12 text-center text-neutral-600 text-sm">No users found</div>}
              </div>

              {/* User Details Modal */}
              {selectedUser && (
                <div className="fixed inset-0 bg-neutral-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in duration-200">
                    <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-800/30">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                          <User size={18} />
                        </div>
                        <h3 className="text-white font-bold tracking-tight">Manage Member Profile</h3>
                      </div>
                      <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-neutral-800 rounded-xl text-neutral-500 hover:text-white transition-all">
                        <X size={20} />
                      </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                      <section>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Profile Overview</h4>
                          <button onClick={() => setIsEditingUser(!isEditingUser)} className="text-[10px] font-bold text-emerald-500 hover:text-emerald-400 transition-colors uppercase tracking-wider">
                            {isEditingUser ? 'Cancel Editing' : 'Edit Information'}
                          </button>
                        </div>

                        {isEditingUser ? (
                          <div className="space-y-4 bg-neutral-950/50 p-5 rounded-2xl border border-neutral-800 shadow-inner">
                            <div>
                              <label className={labelClass}>Display Name</label>
                              <input type="text" value={userEditForm.displayName} onChange={e => setUserEditForm({...userEditForm, displayName: e.target.value})} className={inputClass} />
                            </div>
                            <div>
                              <label className={labelClass}>Email Address</label>
                              <input type="email" value={userEditForm.email} onChange={e => setUserEditForm({...userEditForm, email: e.target.value})} className={inputClass} />
                            </div>
                            <div>
                              <label className={labelClass}>Assign Role</label>
                              <select value={userEditForm.role} onChange={e => setUserEditForm({...userEditForm, role: e.target.value as any})} className={inputClass}>
                                {ALL_ROLES.map(r => (
                                  <option key={r} value={r}>{getRoleLabel(r)}</option>
                                ))}
                              </select>
                            </div>
                            <button onClick={handleUpdateUser} className="w-full py-3 bg-emerald-500 text-neutral-950 font-black rounded-xl hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/10 active:scale-95">
                              Apply Changes
                            </button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { label: 'Name', value: selectedUser.displayName },
                              { label: 'Identifier', value: selectedUser.email || selectedUser.discordUsername },
                              { label: 'Rank', value: getRoleLabel(selectedUser.role), color: getRoleColor(selectedUser.role).text },
                              { label: 'Member Since', value: new Date(selectedUser.createdAt).toLocaleDateString() },
                            ].map((item) => (
                              <div key={item.label} className="p-4 rounded-xl bg-neutral-950/30 border border-neutral-800/50">
                                <div className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest mb-1">{item.label}</div>
                                <div className={`text-sm font-medium ${item.color || 'text-white'}`}>{item.value}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </section>

                      <section className="bg-neutral-950/40 p-5 rounded-2xl border border-neutral-800">
                        <div className="flex items-center justify-between mb-5">
                          <div className="flex items-center gap-2">
                            <Shield size={14} className="text-neutral-500" />
                            <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Security & Governance</h4>
                          </div>
                          {selectedUser.role !== 'owner' && (
                            <button 
                              onClick={() => handleToggleUserStatus(selectedUser)}
                              className={`text-[9px] font-black px-4 py-1.5 rounded-lg border transition-all active:scale-95 ${
                                selectedUser.status === 'banned' 
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' 
                                  : 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                              }`}
                            >
                              {selectedUser.status === 'banned' ? 'REVOKE BAN' : 'BAN MEMBER'}
                            </button>
                          )}
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-neutral-900/50 border border-neutral-800">
                            <span className="text-xs text-neutral-400 font-medium">Global Access Status</span>
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${selectedUser.status === 'banned' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                              {selectedUser.status === 'banned' ? 'Restricted / Banned' : 'Authorized / Active'}
                            </span>
                          </div>

                          {selectedUser.authMethod === 'email' && (
                            <div className="p-1.5 rounded-xl bg-neutral-900/80 border border-neutral-800">
                              <div className="flex gap-2">
                                <input 
                                  type="text"
                                  value={newPasswordInput}
                                  onChange={e => setNewPasswordInput(e.target.value)}
                                  placeholder="Type new password..."
                                  className="flex-1 bg-transparent border-none rounded-lg px-3 py-2 text-xs outline-none text-white placeholder:text-neutral-600"
                                />
                                <button 
                                  onClick={() => handleUpdatePassword(selectedUser.id)}
                                  className="px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors text-[10px] font-black uppercase tracking-wider border border-neutral-700"
                                >
                                  Reset
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </section>

                      <section>
                        <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-4">Submission History</h4>
                        <div className="space-y-2">
                          {applications.filter(a => a.userId === selectedUser.id).length > 0 ? (
                            applications.filter(a => a.userId === selectedUser.id).map(app => (
                              <div key={app.id} className="p-4 rounded-xl bg-neutral-950/20 border border-neutral-800/60 flex items-center justify-between hover:bg-neutral-800/20 transition-colors">
                                <div>
                                  <div className="text-white text-xs font-bold">{app.username}</div>
                                  <div className="text-neutral-600 text-[9px] font-medium">{formatDate(app.submittedAt)}</div>
                                </div>
                                <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border shadow-sm ${statusConfig[app.status].bg} ${statusConfig[app.status].color} ${statusConfig[app.status].border}`}>
                                  {app.status.replace('_', ' ').toUpperCase()}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-10 rounded-2xl border-2 border-dashed border-neutral-800/50">
                              <FileText size={20} className="text-neutral-800 mx-auto mb-2" />
                              <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest">No Submissions Found</p>
                            </div>
                          )}
                        </div>
                      </section>
                    </div>
                    
                    <div className="p-5 border-t border-neutral-800 bg-neutral-900/80 flex justify-between items-center">
                      <div className="text-[9px] text-neutral-600 font-medium">Internal User UUID: {selectedUser.id}</div>
                      <button onClick={() => setSelectedUser(null)} className="px-5 py-2 rounded-lg bg-neutral-800 text-neutral-200 hover:text-white hover:bg-neutral-700 transition-all text-[10px] font-black uppercase tracking-widest border border-neutral-700">
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ SERVER TAB ═══ */}
          {activeTab === 'server' && (
            <div className="animate-fade-in">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-white">Server Management</h1>
                <p className="text-neutral-500 text-sm mt-1">Manage server info, season, and rules</p>
              </div>

              <div className="max-w-3xl space-y-8">
                {/* ── Season Information ── */}
                <div className="p-6 rounded-2xl bg-neutral-900/50 border border-emerald-500/10">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <Sparkles size={16} className="text-amber-400" />
                      Season Information
                    </h3>
                    <button onClick={handleSaveSeasonInfo}
                      className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${seasonSaved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-500 text-neutral-950 hover:bg-emerald-400'}`}>
                      {seasonSaved ? <><CheckCircle size={12} />Saved!</> : <><Save size={12} />Save Season</>}
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Season Number</label>
                        <input type="number" min={1} value={seasonInfo.number} onChange={(e) => setSeasonInfo({ ...seasonInfo, number: parseInt(e.target.value) || 1 })} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Season Name</label>
                        <input type="text" value={seasonInfo.name} onChange={(e) => setSeasonInfo({ ...seasonInfo, name: e.target.value })} placeholder="e.g., New Beginnings" className={inputClass} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelClass}>Hero Badge Text (Optional)</label>
                        <input type="text" value={seasonInfo.heroBadgeText || ''} onChange={(e) => setSeasonInfo({ ...seasonInfo, heroBadgeText: e.target.value })} placeholder="e.g. JOIN THE ADVENTURE — SEASON 2" className={inputClass} />
                        <p className="text-neutral-600 text-[11px] mt-1.5">Overrides default &quot;Applications Open — Season X&quot; text.</p>
                      </div>
                      <div>
                        <label className={labelClass}>Start Date</label>
                        <input type="date" value={seasonInfo.startDate} onChange={(e) => setSeasonInfo({ ...seasonInfo, startDate: e.target.value })} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Theme Color</label>
                        <select value={seasonInfo.theme} onChange={(e) => setSeasonInfo({ ...seasonInfo, theme: e.target.value })} className={inputClass}>
                          <option value="emerald">Emerald</option>
                          <option value="blue">Blue</option>
                          <option value="purple">Purple</option>
                          <option value="amber">Amber</option>
                          <option value="red">Red</option>
                          <option value="rose">Rose</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Season Description</label>
                      <textarea value={seasonInfo.description} onChange={(e) => setSeasonInfo({ ...seasonInfo, description: e.target.value })} rows={3} placeholder="Describe this season..." className={`${inputClass} resize-none`} />
                    </div>

                    <div>
                      <label className={labelClass}>Season Active</label>
                      <button onClick={() => setSeasonInfo({ ...seasonInfo, isActive: !seasonInfo.isActive })}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${seasonInfo.isActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                        {seasonInfo.isActive ? <><ToggleRight size={18} />Season Active</> : <><ToggleLeft size={18} />Season Ended</>}
                      </button>
                    </div>

                    {/* Banner Image */}
                    <div className="pt-4 border-t border-neutral-800/50">
                      <h4 className="text-white text-sm font-medium flex items-center gap-2 mb-4">
                        <Image size={14} className="text-purple-400" />
                        Season Banner Image
                      </h4>
                      <div>
                        <label className={labelClass}>Banner Image URL</label>
                        <input type="url" value={seasonInfo.bannerImage} onChange={(e) => setSeasonInfo({ ...seasonInfo, bannerImage: e.target.value })} placeholder="https://i.imgur.com/example.jpg" className={inputClass} />
                        <p className="text-neutral-600 text-[11px] mt-1.5">Paste any image URL (Imgur, Unsplash, direct link). Leave empty for gradient background.</p>
                      </div>

                      {seasonInfo.bannerImage && (
                        <div className="mt-4">
                          <label className={labelClass}>Preview</label>
                          <div className="relative rounded-xl overflow-hidden h-40 border border-neutral-800/50">
                            <img src={seasonInfo.bannerImage} alt="Banner preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black" style={{ opacity: seasonInfo.bannerOverlay / 100 }} />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-white font-bold text-lg drop-shadow-lg">Season {seasonInfo.number} — {seasonInfo.name}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="mt-4">
                        <label className={labelClass}>Overlay Darkness: {seasonInfo.bannerOverlay}%</label>
                        <input type="range" min={0} max={100} value={seasonInfo.bannerOverlay} onChange={(e) => setSeasonInfo({ ...seasonInfo, bannerOverlay: parseInt(e.target.value) })}
                          className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                        <div className="flex justify-between text-neutral-600 text-[10px] mt-1">
                          <span>0% (Bright)</span><span>100% (Dark)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Rules ── */}
                <div className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800/50">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <AlertTriangle size={16} className="text-amber-500" />
                      Rules Overview
                    </h3>
                    <button onClick={handleSaveServerInfo}
                      className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${serverSaved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-500 text-neutral-950 hover:bg-emerald-400'}`}>
                      {serverSaved ? <><CheckCircle size={12} />Saved!</> : <><Save size={12} />Save Rules</>}
                    </button>
                  </div>
                  <p className="text-neutral-500 text-xs mb-4">These rules are displayed on the public website.</p>
                  <div className="space-y-3 mb-6">
                    {serverInfo.rules.map((rule, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-neutral-800/30 border border-neutral-700/20 group">
                        {editingRuleIndex === i ? (
                          <div className="flex-1 flex items-center gap-2">
                            <input type="text" value={editingRuleText} onChange={(e) => setEditingRuleText(e.target.value)} className={`${inputClass} flex-1`} autoFocus
                              onKeyDown={(e) => { if (e.key === 'Enter') handleEditRule(i); if (e.key === 'Escape') { setEditingRuleIndex(null); setEditingRuleText(''); } }} />
                            <button onClick={() => handleEditRule(i)} className="p-2 rounded-lg text-emerald-400 hover:bg-emerald-500/10"><CheckCircle size={14} /></button>
                            <button onClick={() => { setEditingRuleIndex(null); setEditingRuleText(''); }} className="p-2 rounded-lg text-neutral-500 hover:text-neutral-300"><X size={14} /></button>
                          </div>
                        ) : (
                          <>
                            <span className="text-emerald-500/70 text-xs font-mono mt-0.5 shrink-0 w-6 text-center">{i + 1}</span>
                            <span className="flex-1 text-neutral-300 text-sm leading-relaxed">{rule}</span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => { setEditingRuleIndex(i); setEditingRuleText(rule); }} className="p-1.5 rounded-lg text-neutral-500 hover:text-blue-400 hover:bg-blue-500/10"><Pencil size={12} /></button>
                              <button onClick={() => handleDeleteRule(i)} className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-500/10"><Trash2 size={12} /></button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                    {serverInfo.rules.length === 0 && <div className="text-center py-8 text-neutral-600 text-sm">No rules yet</div>}
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="text" value={newRuleText} onChange={(e) => setNewRuleText(e.target.value)} placeholder="Type a new rule..." className={`${inputClass} flex-1`} onKeyDown={(e) => { if (e.key === 'Enter') handleAddRule(); }} />
                    <button onClick={handleAddRule} disabled={!newRuleText.trim()} className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0"><Plus size={14} />Add</button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-neutral-900/30 border border-neutral-800/50">
                  <p className="text-neutral-500 text-xs">💡 Each section has its own Save button. Click Save to apply changes to the public website.</p>
                </div>
              </div>
            </div>
          )}

          {/* ═══ SOCIALS ═══ */}
          {activeTab === 'socials' && (
            <div className="animate-fade-in">
              <div className="mb-6 flex items-center justify-between">
                <div><h1 className="text-2xl font-bold text-white">Social Links</h1><p className="text-neutral-500 text-sm mt-1">Manage social media links</p></div>
                <button onClick={handleSaveSocials} className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all ${socialsSaved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-500 text-neutral-950 hover:bg-emerald-400'}`}>
                  {socialsSaved ? <><CheckCircle size={14} />Saved!</> : <><Save size={14} />Save</>}
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  {socialLinks.map((link) => {
                    const iconMap: any = { discord: MessageSquare, youtube: Youtube, instagram: Instagram, tiktok: Video, twitter: Twitter, twitch: Twitch, linkedin: Linkedin, github: Github, facebook: Facebook, globe: Globe, mail: Mail, gamepad: Gamepad2, music: Music };
                    const Icon = iconMap[link.icon] || Globe;
                    const colorMap: any = { indigo: 'bg-indigo-500', red: 'bg-red-500', pink: 'bg-pink-500', neutral: 'bg-neutral-500', blue: 'bg-blue-500', emerald: 'bg-emerald-500', orange: 'bg-orange-500', purple: 'bg-purple-500' };
                    
                    return (
                      <div key={link.id} className={`p-4 rounded-xl border transition-all ${link.enabled ? 'bg-neutral-900/50 border-neutral-800/50' : 'bg-neutral-900/20 border-neutral-800/20 opacity-60'}`}>
                        {editingSocialId === link.id ? (
                          <div className="space-y-4">
                            <div className="flex gap-2">
                               <input type="text" value={link.name} onChange={(e) => handleUpdateSocial(link.id, { name: e.target.value })} className={inputClass} placeholder="Name" />
                               <select value={link.icon} onChange={(e) => handleUpdateSocial(link.id, { icon: e.target.value })} className="bg-neutral-950 border border-neutral-800 rounded-xl text-white px-3 text-sm">
                                  <option value="discord">Discord</option>
                                  <option value="youtube">YouTube</option>
                                  <option value="instagram">Instagram</option>
                                  <option value="tiktok">TikTok</option>
                                  <option value="twitter">Twitter</option>
                                  <option value="twitch">Twitch</option>
                                  <option value="linkedin">LinkedIn</option>
                                  <option value="github">GitHub</option>
                                  <option value="facebook">Facebook</option>
                                  <option value="globe">Globe</option>
                                  <option value="mail">Mail</option>
                                  <option value="gamepad">Gaming</option>
                               </select>
                            </div>
                            <input type="url" value={link.url} onChange={(e) => handleUpdateSocial(link.id, { url: e.target.value })} className={inputClass} placeholder="URL" />
                            <input type="text" value={link.description || ''} onChange={(e) => handleUpdateSocial(link.id, { description: e.target.value })} className={inputClass} placeholder="Description" />
                            <div className="flex items-center gap-2">
                               <span className="text-xs text-neutral-500 uppercase">Color:</span>
                               {['indigo', 'red', 'pink', 'purple', 'blue', 'emerald', 'orange', 'neutral'].map(c => (
                                 <button key={c} onClick={() => handleUpdateSocial(link.id, { color: c })} className={`w-6 h-6 rounded-full ${colorMap[c]} ${link.color === c ? 'ring-2 ring-white' : 'opacity-50 hover:opacity-100'}`} />
                               ))}
                            </div>
                            <div className="flex justify-end gap-2">
                               <button onClick={() => setEditingSocialId(null)} className="px-3 py-1.5 text-xs bg-emerald-500/10 text-emerald-400 rounded-lg">Done</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`h-10 w-10 rounded-lg ${colorMap[link.color] || 'bg-neutral-500'} flex items-center justify-center text-white shrink-0 bg-opacity-20 text-opacity-100`}>
                                <Icon size={20} className={link.color === 'neutral' ? 'text-white' : `text-${link.color}-400`} />
                              </div>
                              <div>
                                <h3 className="text-white font-medium flex items-center gap-2">
                                  {link.name}
                                  {!link.enabled && <span className="text-[10px] bg-neutral-700 text-neutral-400 px-1.5 py-0.5 rounded">Disabled</span>}
                                </h3>
                                <p className="text-neutral-500 text-xs truncate max-w-[200px]">{link.url}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                               <button onClick={() => handleUpdateSocial(link.id, { enabled: !link.enabled })} className="p-2 text-neutral-500 hover:text-white rounded-lg bg-neutral-800/50 hover:bg-neutral-800">
                                  {link.enabled ? <ToggleRight size={18} className="text-emerald-500" /> : <ToggleLeft size={18} />}
                               </button>
                               <button onClick={() => setEditingSocialId(link.id)} className="p-2 text-neutral-500 hover:text-blue-400 rounded-lg bg-neutral-800/50 hover:bg-neutral-800"><Pencil size={16} /></button>
                               <button onClick={() => handleDeleteSocial(link.id)} className="p-2 text-neutral-500 hover:text-red-400 rounded-lg bg-neutral-800/50 hover:bg-neutral-800"><Trash2 size={16} /></button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {showNewSocialForm ? (
                     <div className="p-4 rounded-xl bg-neutral-800/30 border border-neutral-700/50 space-y-4">
                        <h3 className="text-white font-medium text-sm">New Social Link</h3>
                        <div className="flex gap-2">
                          <input type="text" placeholder="Name (e.g. Twitter)" value={newSocial.name || ''} onChange={(e) => setNewSocial({...newSocial, name: e.target.value})} className={inputClass} />
                          <select value={newSocial.icon} onChange={(e) => setNewSocial({...newSocial, icon: e.target.value})} className="bg-neutral-900 border border-neutral-800 rounded-xl text-white px-3 text-sm">
                             <option value="globe">Globe</option>
                             <option value="discord">Discord</option>
                             <option value="youtube">YouTube</option>
                             <option value="instagram">Instagram</option>
                             <option value="tiktok">TikTok</option>
                             <option value="twitter">Twitter</option>
                             <option value="twitch">Twitch</option>
                             <option value="linkedin">LinkedIn</option>
                             <option value="github">GitHub</option>
                             <option value="facebook">Facebook</option>
                             <option value="mail">Mail</option>
                             <option value="gamepad">Gaming</option>
                             <option value="music">Music</option>
                          </select>
                        </div>
                        <input type="url" placeholder="https://..." value={newSocial.url || ''} onChange={(e) => setNewSocial({...newSocial, url: e.target.value})} className={inputClass} />
                        <input type="text" placeholder="Description (optional)" value={newSocial.description || ''} onChange={(e) => setNewSocial({...newSocial, description: e.target.value})} className={inputClass} />
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-neutral-500 uppercase">Color:</span>
                            {['indigo', 'red', 'pink', 'purple', 'blue', 'emerald', 'orange', 'neutral'].map(c => (
                              <button key={c} onClick={() => setNewSocial({ ...newSocial, color: c })} className={`w-6 h-6 rounded-full ${c === 'neutral' ? 'bg-neutral-500' : `bg-${c}-500`} ${newSocial.color === c ? 'ring-2 ring-white' : 'opacity-50 hover:opacity-100'}`} />
                            ))}
                        </div>
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setShowNewSocialForm(false)} className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white">Cancel</button>
                          <button onClick={handleAddSocial} disabled={!newSocial.name || !newSocial.url} className="px-4 py-1.5 bg-emerald-500 text-neutral-950 font-medium rounded-lg text-sm hover:bg-emerald-400 disabled:opacity-50">Add Link</button>
                        </div>
                     </div>
                  ) : (
                    <button onClick={() => setShowNewSocialForm(true)} className="w-full py-3 border border-dashed border-neutral-700 rounded-xl text-neutral-500 hover:text-white hover:border-neutral-500 hover:bg-neutral-900/50 transition-all flex items-center justify-center gap-2">
                       <Plus size={16} /> Add New Link
                    </button>
                  )}
                </div>
                
                 <div className="space-y-6">
                   <div className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800/50">
                      <h3 className="text-white font-semibold mb-2">Social Links</h3>
                      <p className="text-neutral-400 text-sm leading-relaxed mb-4">
                         These links appear in the "Community" section and the website footer.
                      </p>
                      <ul className="space-y-2 text-sm text-neutral-500">
                         <li className="flex gap-2"><CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Customize icons & colors</li>
                         <li className="flex gap-2"><CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Toggle visibility instantly</li>
                      </ul>
                   </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ SETTINGS ═══ */}
          {activeTab === 'settings' && (
            <div className="animate-fade-in">
              <div className="mb-8"><h1 className="text-2xl font-bold text-white">Settings</h1><p className="text-neutral-500 text-sm mt-1">Admin panel configuration</p></div>
              <div className="max-w-2xl space-y-6">
                <div className="p-6 rounded-2xl bg-neutral-900/50 border border-emerald-500/10">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-white font-semibold flex items-center gap-2"><Crown size={16} className="text-amber-400" />Owner Account</h3>
                    <button 
                      onClick={() => setShowOwnerDetails(!showOwnerDetails)}
                      className="p-2 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-800 transition-all"
                    >
                      {showOwnerDetails ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-neutral-500 text-sm mb-4">Default credentials for initial setup.</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center px-4 py-2.5 rounded-xl bg-neutral-800/30">
                      <span className="text-neutral-500">Email</span>
                      <span className={`text-neutral-300 font-mono text-xs ${!showOwnerDetails ? 'blur-[4px] select-none' : ''}`}>owner@dismine.com</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-2.5 rounded-xl bg-neutral-800/30">
                      <span className="text-neutral-500">Password</span>
                      <span className={`text-neutral-300 font-mono text-xs ${!showOwnerDetails ? 'blur-[4px] select-none' : ''}`}>dismine2025</span>
                    </div>
                  </div>
                </div>
                <div className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800/50">
                  <h3 className="text-white font-semibold mb-4">Role Permissions</h3>
                  <div className="space-y-3">
                    {[
                      { role: 'owner' as UserRole, desc: 'Full access. Can manage all roles, delete users, change all settings.' },
                      { role: 'admin' as UserRole, desc: 'Can review applications, manage roles (up to manager), edit server info, rules & social links.' },
                      { role: 'manager' as UserRole, desc: 'Can review and approve/reject applications.' },
                      { role: 'staff' as UserRole, desc: 'Can access admin panel in read-only mode.' },
                      { role: 'builder' as UserRole, desc: 'Can access admin panel in read-only mode.' },
                      { role: 'user' as UserRole, desc: 'Regular member. Can submit applications and view status.' },
                    ].map((item) => {
                      const rc = getRoleColor(item.role);
                      return (
                        <div key={item.role} className="flex items-start gap-3 px-4 py-3 rounded-xl bg-neutral-800/30">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full shrink-0 mt-0.5 ${rc.bg} ${rc.border} border ${rc.text}`}>{roleIcon(item.role)}{getRoleLabel(item.role)}</span>
                          <p className="text-neutral-400 text-xs leading-relaxed">{item.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-neutral-900/50 border border-indigo-500/10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold flex items-center gap-2"><MessageSquare size={16} className="text-indigo-400" />Discord Login Integration</h3>
                    <button onClick={handleSaveDiscord} className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${discordSaved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-500 text-neutral-950 hover:bg-emerald-400'}`}>
                      {discordSaved ? <><CheckCircle size={12} />Saved!</> : <><Save size={12} />Save Config</>}
                    </button>
                  </div>
                  <p className="text-neutral-500 text-sm mb-4">Enable real Discord OAuth login. Leave blank to use simulation mode.</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>Client ID</label>
                      <input type="text" value={discordConfig.clientId} onChange={(e) => setDiscordConfig({ ...discordConfig, clientId: e.target.value })} className={inputClass} placeholder="123456789..." />
                    </div>
                    <div>
                      <label className={labelClass}>Client Secret</label>
                      <input type="password" value={discordConfig.clientSecret} onChange={(e) => setDiscordConfig({ ...discordConfig, clientSecret: e.target.value })} className={inputClass} placeholder="Secret..." />
                      <p className="text-[10px] text-neutral-600 mt-1">Note: Using Client Secret on the frontend is not recommended for production security. Use with caution or backend proxy.</p>
                    </div>
                    <div>
                      <label className={labelClass}>Redirect URI</label>
                      <input type="text" value={discordConfig.redirectUri} onChange={(e) => setDiscordConfig({ ...discordConfig, redirectUri: e.target.value })} className={inputClass} placeholder="https://your-domain.com" />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-800/30 border border-neutral-700/30">
                       <span className="text-neutral-300 text-sm font-medium">Enable Real Discord Login</span>
                       <button onClick={() => setDiscordConfig({ ...discordConfig, isEnabled: !discordConfig.isEnabled })} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${discordConfig.isEnabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-neutral-800 text-neutral-400'}`}>
                          {discordConfig.isEnabled ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                          {discordConfig.isEnabled ? 'Enabled' : 'Disabled'}
                       </button>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-neutral-900/50 border border-blue-500/10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold flex items-center gap-2"><Globe size={16} className="text-blue-400" />Google Login Integration</h3>
                    <button onClick={handleSaveGoogle} className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${googleSaved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-500 text-neutral-950 hover:bg-emerald-400'}`}>
                      {googleSaved ? <><CheckCircle size={12} />Saved!</> : <><Save size={12} />Save Config</>}
                    </button>
                  </div>
                  <p className="text-neutral-500 text-sm mb-4">Enable real Google OAuth login. Leave blank to use simulation mode.</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>Client ID</label>
                      <input type="text" value={googleConfig.clientId} onChange={(e) => setGoogleConfig({ ...googleConfig, clientId: e.target.value })} className={inputClass} placeholder="123456789-abc.apps.googleusercontent.com" />
                    </div>
                    <div>
                      <label className={labelClass}>Client Secret</label>
                      <input type="password" value={googleConfig.clientSecret} onChange={(e) => setGoogleConfig({ ...googleConfig, clientSecret: e.target.value })} className={inputClass} placeholder="Secret..." />
                      <p className="text-[10px] text-neutral-600 mt-1">Note: Using Client Secret on the frontend is not recommended for production security.</p>
                    </div>
                    <div>
                      <label className={labelClass}>Redirect URI</label>
                      <input type="text" value={googleConfig.redirectUri} onChange={(e) => setGoogleConfig({ ...googleConfig, redirectUri: e.target.value })} className={inputClass} placeholder="https://your-domain.com" />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-800/30 border border-neutral-700/30">
                       <span className="text-neutral-300 text-sm font-medium">Enable Real Google Login</span>
                       <button onClick={() => setGoogleConfig({ ...googleConfig, isEnabled: !googleConfig.isEnabled })} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${googleConfig.isEnabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-neutral-800 text-neutral-400'}`}>
                          {googleConfig.isEnabled ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                          {googleConfig.isEnabled ? 'Enabled' : 'Disabled'}
                       </button>
                    </div>
                  </div>
                </div>

                {/* Auth Controls */}
                <div className="p-6 rounded-2xl bg-neutral-900/50 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <Shield size={16} className="text-emerald-400" />
                      Authentication Controls
                    </h3>
                    <button onClick={handleSaveSiteSettings} className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${settingsSaved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-500 text-neutral-950 hover:bg-emerald-400'}`}>
                      {settingsSaved ? <><CheckCircle size={12} />Saved!</> : <><Save size={12} />Save Controls</>}
                    </button>
                  </div>
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white/5 rounded-lg border border-white/5">
                      <div>
                        <h4 className="text-white font-medium text-sm">Allow New Registrations</h4>
                        <p className="text-[10px] text-gray-400">If disabled, new users cannot create accounts.</p>
                      </div>
                      <button
                        onClick={() => setSiteSettings({ ...siteSettings, registrationEnabled: !siteSettings.registrationEnabled })}
                        className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                          siteSettings.registrationEnabled 
                          ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' 
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {siteSettings.registrationEnabled ? 'ENABLED' : 'DISABLED'}
                      </button>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white/5 rounded-lg border border-white/5">
                      <div>
                        <h4 className="text-white font-medium text-sm">Allow User Login</h4>
                        <p className="text-[10px] text-gray-400">If disabled, regular users cannot log in.</p>
                      </div>
                      <button
                        onClick={() => setSiteSettings({ ...siteSettings, loginEnabled: !siteSettings.loginEnabled })}
                        className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                          siteSettings.loginEnabled 
                          ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' 
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {siteSettings.loginEnabled ? 'ENABLED' : 'DISABLED'}
                      </button>
                    </div>

                    {(!siteSettings.loginEnabled || !siteSettings.registrationEnabled) && (
                      <div>
                        <label className={labelClass}>Maintenance Message</label>
                        <textarea
                          value={siteSettings.maintenanceMessage || ''}
                          onChange={(e) => setSiteSettings({ ...siteSettings, maintenanceMessage: e.target.value })}
                          className={`${inputClass} text-xs`}
                          rows={2}
                          placeholder="Displayed to users when auth is disabled..."
                        />
                      </div>
                    )}

                    <div className="pt-4 border-t border-white/5">
                      <label className={labelClass}>Default Application Limit per User</label>
                      <div className="flex items-center gap-4">
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={siteSettings.maxApplicationsPerUser || 3}
                          onChange={(e) => setSiteSettings({ ...siteSettings, maxApplicationsPerUser: parseInt(e.target.value) || 1 })}
                          className={`${inputClass} max-w-[120px]`}
                        />
                        <p className="text-[10px] text-gray-400">Maximum number of applications a single user can submit.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-neutral-900/50 border border-red-500/20">
                  <h3 className="text-white font-semibold flex items-center gap-2 mb-1"><AlertTriangle size={16} className="text-red-400" />Danger Zone</h3>
                  <p className="text-neutral-500 text-sm mb-4">Destructive actions.</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-800/30 border border-neutral-700/30">
                      <div><div className="text-neutral-300 text-sm font-medium">Clear all applications</div><div className="text-neutral-600 text-xs mt-0.5">Remove all application data</div></div>
                      <button onClick={() => { if (confirm('Delete ALL applications?')) { localStorage.removeItem('dismine_applications'); refreshData(); } }} className="px-4 py-2 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20">Clear All</button>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-800/30 border border-neutral-700/30">
                      <div><div className="text-neutral-300 text-sm font-medium">Load demo data</div><div className="text-neutral-600 text-xs mt-0.5">Populate with sample applications</div></div>
                      <button onClick={() => { localStorage.removeItem('dismine_applications'); seedDemoData(); refreshData(); }} className="px-4 py-2 text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg hover:bg-amber-500/20">Load Demo</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
