import { useState, useEffect, useCallback } from 'react';
import {
  LogOut, Users, Clock, CheckCircle, XCircle, Eye, EyeOff, Search,
  BarChart3, FileText, Settings, ArrowLeft, Trash2,
  MessageSquare, Globe, User, AlertTriangle, Shield, Link2,
  Crown, UserCog, ToggleLeft, ToggleRight, Server,
  Plus, Pencil, X, Hammer, FormInput, ArrowUp, ArrowDown, Lock,
  Youtube, Instagram, Twitter, Twitch, Music, Video, Gamepad2, Mail,
  Heart, Star, Sword, Wrench, LifeBuoy, Zap, Database, Cloud, RefreshCw, AlertCircle
} from 'lucide-react';
import { 
  getApplications, updateApplication, deleteApplication, getStats,
  getUsers, updateUserRole, deleteUser, getSocialLinks,
  updateSocialLinks, getServerInfo, updateServerInfo, getSeasonInfo,
  saveSeasonInfo, getAppForms, saveAppForms, getSettings, updateSettings,
  canManageRoles, canManageSettings, canReviewApplications, 
  getDiscordConfig, saveDiscordConfig, getGoogleConfig, saveGoogleConfig,
  getRoleLabel, updateUserPassword, updateUserInfo,
  getChatByAppId, saveChatMessage, toggleChatStatus, deleteChat,
  getRoles, saveRole, deleteRole, getRoleStyle, BUILTIN_ROLES,
  generateMemberId, updateUserMemberId, adminCreateUser,
  getSupabaseConfig, saveSupabaseConfig, syncToCloud, syncFromCloud,
  type ApplicationEntry, type ApplicationStatus, type UserAccount,
  type UserRole, type SocialLink, type ServerInfo, type SeasonInfo, type AppField, type DiscordConfig, type GoogleConfig,
  type AppForm, type ApplicationChat, type Role, type Permission, type SupabaseConfig
} from '../../lib/store';

interface Props {
  currentUser: UserAccount;
  onLogout: () => void;
  onBack: () => void;
}

type Tab = 'overview' | 'applications' | 'users' | 'roles' | 'server' | 'formbuilder' | 'socials' | 'database' | 'settings';
type FilterStatus = 'all' | ApplicationStatus;

const statusConfig: Record<ApplicationStatus, { label: string; color: string; bg: string; border: string }> = {
  pending: { label: 'Pending', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  under_review: { label: 'Under Review', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  approved: { label: 'Approved', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  rejected: { label: 'Rejected', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
};

const AVAILABLE_PERMISSIONS: { id: Permission; label: string; desc: string }[] = [
  { id: 'access_admin', label: 'Access Admin Panel', desc: 'Allows the user to log in.' },
  { id: 'manage_applications', label: 'Review Applications', desc: 'Can approve/reject apps.' },
  { id: 'manage_users', label: 'Manage Users', desc: 'Can edit profiles and ban users.' },
  { id: 'manage_roles', label: 'Manage Roles', desc: 'Can create and edit roles.' },
  { id: 'manage_settings', label: 'Manage Settings', desc: 'Can edit global site settings.' },
  { id: 'manage_forms', label: 'Form Builder', desc: 'Can modify application forms.' },
  { id: 'manage_server', label: 'Server & Season', desc: 'Can manage server info.' },
];

const AVAILABLE_ICONS = ['Crown', 'Shield', 'UserCog', 'Users', 'Hammer', 'User', 'Heart', 'Star', 'Sword', 'Wrench', 'LifeBuoy', 'Zap'];

export function AdminDashboard({ currentUser, onLogout, onBack }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [applications, setApplications] = useState<ApplicationEntry[]>([]);
  const [stats, setStats] = useState(getStats());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedApp, setSelectedApp] = useState<ApplicationEntry | null>(null);
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [currentChat, setCurrentChat] = useState<ApplicationChat | null>(null);
  const [chatMessage, setChatMessage] = useState('');

  // Users
  const [allUsers, setAllUsers] = useState<UserAccount[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [roleChangeTarget, setRoleChangeTarget] = useState<string | null>(null);
  const [passwordChangeTarget, setPasswordChangeTarget] = useState<string | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [userMessage, setUserMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPersonalDetails, setShowPersonalDetails] = useState(false);
  const [showOwnerDetails, setShowOwnerDetails] = useState(false);
  const [showDiscordDetails, setShowDiscordDetails] = useState(false);
  const [showGoogleDetails, setShowGoogleDetails] = useState(false);

  // User creation and management
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [createUserForm, setCreateUserForm] = useState({ displayName: '', email: '', password: '', role: 'user' as UserRole });
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);

  // Roles
  const [roles, setRoles] = useState<Role[]>(getRoles());
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [showNewRoleModal, setShowNewRoleModal] = useState(false);
  const [roleEditForm, setRoleEditForm] = useState<Partial<Role>>({});

  // Socials
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [socialsSaved, setSocialsSaved] = useState(false);

  // Server info
  const [serverInfo, setServerInfo] = useState<ServerInfo>(getServerInfo());
  const [serverSaved, setServerSaved] = useState(false);
  const [editingRuleText, setEditingRuleText] = useState('');
  const [newRuleText, setNewRuleText] = useState('');

  // Season info
  const [seasonInfo, setSeasonInfo] = useState<SeasonInfo>(getSeasonInfo());
  const [seasonSaved, setSeasonSaved] = useState(false);

  // Configs
  const [discordConfig, setDiscordConfig] = useState<DiscordConfig>(getDiscordConfig());
  const [discordSaved, setDiscordSaved] = useState(false);
  const [googleConfig, setGoogleConfig] = useState<GoogleConfig>(getGoogleConfig());
  const [googleSaved, setGoogleSaved] = useState(false);
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(getSupabaseConfig());
  const [supabaseSaved, setSupabaseSaved] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [siteSettings, setSiteSettings] = useState(getSettings());
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Forms
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
    setRoles(getRoles());
    setSocialLinks(getSocialLinks());
    setServerInfo(getServerInfo());
    setSeasonInfo(getSeasonInfo());
    setAppForms(getAppForms());
    setDiscordConfig(getDiscordConfig());
    setGoogleConfig(getGoogleConfig());
    setSupabaseConfig(getSupabaseConfig());
    setSiteSettings(getSettings());
    if (selectedApp) setCurrentChat(getChatByAppId(selectedApp.id));
  }, [selectedApp]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Handlers
  const handleCreateRole = () => {
    if (!roleEditForm.name) return;
    const newRole: Role = {
      id: roleEditForm.name.toLowerCase().replace(/\s+/g, '-'),
      name: roleEditForm.name,
      description: roleEditForm.description || '',
      permissions: roleEditForm.permissions || [],
      color: roleEditForm.color || '#a3a3a3',
      icon: roleEditForm.icon || 'User',
      isCustom: true
    };
    saveRole(newRole);
    setShowNewRoleModal(false);
    setRoleEditForm({});
    refreshData();
    setUserMessage({ type: 'success', text: 'Role created.' });
    setTimeout(() => setUserMessage(null), 3000);
  };

  const handleUpdateRole = () => {
    if (!editingRoleId || !roleEditForm.name) return;
    const role = roles.find(r => r.id === editingRoleId);
    if (!role) return;
    const updatedRole: Role = {
      ...role,
      name: roleEditForm.name,
      description: roleEditForm.description || '',
      permissions: roleEditForm.permissions || [],
      color: roleEditForm.color || '#a3a3a3',
      icon: roleEditForm.icon || 'User',
    };
    saveRole(updatedRole);
    setEditingRoleId(null);
    setRoleEditForm({});
    refreshData();
    setUserMessage({ type: 'success', text: 'Role updated.' });
    setTimeout(() => setUserMessage(null), 3000);
  };

  const handleRemoveRole = (roleId: string) => {
    if (!confirm('Delete this role?')) return;
    deleteRole(roleId);
    refreshData();
    setUserMessage({ type: 'success', text: 'Role deleted.' });
    setTimeout(() => setUserMessage(null), 3000);
  };

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
    if (!selectedApp || !confirm('Delete conversation?')) return;
    deleteChat(selectedApp.id);
    setCurrentChat(null);
  };

  const handleSaveDiscord = () => { saveDiscordConfig(discordConfig); setDiscordSaved(true); setTimeout(() => setDiscordSaved(false), 2000); };
  const handleSaveGoogle = () => { saveGoogleConfig(googleConfig); setGoogleSaved(true); setTimeout(() => setGoogleSaved(false), 2000); };
  const handleSaveSupabase = () => { saveSupabaseConfig(supabaseConfig); setSupabaseSaved(true); setTimeout(() => setSupabaseSaved(false), 2000); };
  const handleSaveSiteSettings = () => { updateSettings(siteSettings); setSettingsSaved(true); setTimeout(() => setSettingsSaved(false), 2000); };

  const handlePushToCloud = async () => {
    setSyncLoading(true);
    const res = await syncToCloud();
    setSyncLoading(false);
    if (res.success) {
      setUserMessage({ type: 'success', text: 'Data pushed to cloud successfully.' });
    } else {
      setUserMessage({ type: 'error', text: res.error || 'Sync failed.' });
    }
    setTimeout(() => setUserMessage(null), 3000);
  };

  const handlePullFromCloud = async () => {
    if (!confirm('This will overwrite your current local data. Continue?')) return;
    setSyncLoading(true);
    const res = await syncFromCloud();
    setSyncLoading(false);
    if (res.success) {
      setUserMessage({ type: 'success', text: 'Data pulled from cloud. Refreshing...' });
      setTimeout(() => window.location.reload(), 1500);
    } else {
      setUserMessage({ type: 'error', text: res.error || 'Sync failed.' });
    }
    setTimeout(() => setUserMessage(null), 3000);
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
    if (result.success) { setUserMessage({ type: 'success', text: `Role updated.` }); refreshData(); }
    else { setUserMessage({ type: 'error', text: result.error || 'Failed.' }); }
    setRoleChangeTarget(null);
    setTimeout(() => setUserMessage(null), 3000);
  };

  const handleDeleteUser = (userId: string) => {
    const result = deleteUser(userId, currentUser);
    if (result.success) { setUserMessage({ type: 'success', text: 'User deleted.' }); refreshData(); }
    else { setUserMessage({ type: 'error', text: result.error || 'Failed.' }); }
    setDeleteUserConfirm(null);
    setTimeout(() => setUserMessage(null), 3000);
  };

  const handleUpdatePassword = (userId: string) => {
    if (!newPasswordInput.trim()) return;
    const result = updateUserPassword(userId, newPasswordInput.trim(), currentUser);
    if (result.success) { setUserMessage({ type: 'success', text: 'Password reset.' }); refreshData(); }
    else { setUserMessage({ type: 'error', text: result.error || 'Failed.' }); }
    setPasswordChangeTarget(null);
    setNewPasswordInput('');
    setTimeout(() => setUserMessage(null), 3000);
  };

  const handleAdminCreateUser = () => {
    const { displayName, email, password, role } = createUserForm;
    if (!displayName || !email || !password) {
      setUserMessage({ type: 'error', text: 'Please fill in all fields.' });
      return;
    }
    
    const result = adminCreateUser({
      displayName,
      email,
      password,
      authMethod: 'email',
      role,
      memberId: generateMemberId(),
      status: 'active'
    });

    if (result.success) {
      setUserMessage({ type: 'success', text: 'User account created.' });
      setShowCreateUserModal(false);
      setCreateUserForm({ displayName: '', email: '', password: '', role: 'user' });
      refreshData();
    } else {
      setUserMessage({ type: 'error', text: result.error || 'Failed to create user.' });
    }
    setTimeout(() => setUserMessage(null), 3000);
  };

  const handleGenerateMemberId = (userId: string) => {
    const newId = generateMemberId();
    const result = updateUserMemberId(userId, newId, currentUser);
    if (result.success) {
      setUserMessage({ type: 'success', text: `ID ${newId} assigned.` });
      refreshData();
    } else {
      setUserMessage({ type: 'error', text: result.error || 'Failed to assign ID.' });
    }
    setTimeout(() => setUserMessage(null), 3000);
  };

  const handleUpdateUser = () => {
    if (!selectedUser) return;
    if (userEditForm.role !== selectedUser.role) updateUserRole(selectedUser.id, userEditForm.role, currentUser);
    const result = updateUserInfo(selectedUser.id, { displayName: userEditForm.displayName, email: userEditForm.email }, currentUser);
    if (result.success) {
      setIsEditingUser(false); refreshData(); setUserMessage({ type: 'success', text: 'User updated.' }); setTimeout(() => setUserMessage(null), 3000);
      const updated = getUsers().find(u => u.id === selectedUser.id);
      if (updated) setSelectedUser(updated);
    }
  };

  const handleToggleUserStatus = (user: UserAccount) => {
    const newStatus = user.status === 'banned' ? 'active' : 'banned';
    const result = updateUserInfo(user.id, { status: newStatus }, currentUser);
    if (result.success) {
      refreshData();
      const updated = getUsers().find(u => u.id === user.id);
      if (updated) setSelectedUser(updated);
    }
  };

  const handleSaveSocials = () => { updateSocialLinks(socialLinks); setSocialsSaved(true); setTimeout(() => setSocialsSaved(false), 2000); };

  const handleAddSocial = () => {
    if (!newSocial.name || !newSocial.url) return;
    const id = (newSocial.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.random().toString(36).substr(2, 4));
    const social: SocialLink = { id, name: newSocial.name, url: newSocial.url, enabled: true, icon: newSocial.icon || 'globe', description: newSocial.description || '', color: newSocial.color || 'neutral' };
    setSocialLinks([...socialLinks, social]);
    setNewSocial({ enabled: true, color: 'neutral', icon: 'globe' });
    setShowNewSocialForm(false);
  };

  const handleUpdateSocial = (id: string, updates: Partial<SocialLink>) => { setSocialLinks(socialLinks.map(s => s.id === id ? { ...s, ...updates } : s)); };
  const handleDeleteSocial = (id: string) => { if (confirm('Delete link?')) setSocialLinks(socialLinks.filter(s => s.id !== id)); };

  const handleSaveServerInfo = () => { updateServerInfo(serverInfo); setServerSaved(true); setTimeout(() => setServerSaved(false), 2000); };
  const handleSaveSeasonInfo = () => { saveSeasonInfo(seasonInfo); setSeasonSaved(true); setTimeout(() => setSeasonSaved(false), 2000); };

  const handleAddRule = () => { if (!newRuleText.trim()) return; setServerInfo((p) => ({ ...p, rules: [...p.rules, newRuleText.trim()] })); setNewRuleText(''); };
  const handleEditRule = (index: number) => { if (!editingRuleText.trim()) return; setServerInfo((p) => { const r = [...p.rules]; r[index] = editingRuleText.trim(); return { ...p, rules: r }; }); setEditingRuleIndex(null); setEditingRuleText(''); };
  const handleDeleteRule = (index: number) => { setServerInfo((p) => ({ ...p, rules: p.rules.filter((_, i) => i !== index) })); };

  const handleSaveForms = (updatedForms: AppForm[]) => { saveAppForms(updatedForms); setAppForms(updatedForms); setFieldsSaved(true); setTimeout(() => setFieldsSaved(false), 2000); };

  const handleCreateForm = () => {
    if (!newFormName.trim()) return;
    const id = newFormName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const newForm: AppForm = { id, name: newFormName.trim(), description: newFormDesc.trim(), enabled: true, status: 'open', schedule: { timezone: 'UTC' }, fields: [] };
    handleSaveForms([...appForms, newForm]);
    setSelectedFormId(id);
    setShowNewFormModal(false);
    setNewFormName('');
    setNewFormDesc('');
  };

  const handleDeleteForm = (id: string) => {
    if (id === 'member-app') return alert('Cannot delete default form.');
    if (confirm('Delete this form?')) { const updated = appForms.filter(f => f.id !== id); handleSaveForms(updated); setSelectedFormId('member-app'); }
  };

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    if (!currentForm) return;
    const { fields } = currentForm;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === fields.length - 1) return;
    const newFields = [...fields];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newFields[index], newFields[swapIndex]] = [newFields[swapIndex], newFields[index]];
    handleSaveForms(appForms.map(f => f.id === selectedFormId ? { ...f, fields: newFields } : f));
  };

  const handleAddField = () => {
    if (!newField.label || !currentForm) return;
    const id = newField.label.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const field: AppField = { id, label: newField.label, type: newField.type as any || 'text', placeholder: newField.placeholder || '', required: newField.required || false, enabled: true, options: newField.type === 'select' ? (newField.options as any || []) : undefined };
    handleSaveForms(appForms.map(f => f.id === selectedFormId ? { ...f, fields: [...f.fields, field] } : f));
    setNewField({ type: 'text', required: false });
    setShowNewFieldForm(false);
  };

  const handleUpdateField = (fieldId: string, updates: Partial<AppField>) => {
    if (!currentForm) return;
    const updatedFields = currentForm.fields.map(f => f.id === fieldId ? { ...f, ...updates } : f);
    setAppForms(appForms.map(f => f.id === selectedFormId ? { ...f, fields: updatedFields } : f));
  };

  const handleDeleteField = (fieldId: string) => {
    if (!currentForm) return;
    if (confirm('Delete field?')) { const updatedFields = currentForm.fields.filter(f => f.id !== fieldId); handleSaveForms(appForms.map(f => f.id === selectedFormId ? { ...f, fields: updatedFields } : f)); }
  };

  const handleBulkDelete = () => { selectedApps.forEach(id => deleteApplication(id)); setSelectedApps([]); setShowBulkDeleteConfirm(false); refreshData(); };
  const toggleSelectApp = (id: string) => { setSelectedApps(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]); };
  const toggleSelectAll = () => { if (selectedApps.length === filteredApps.length) setSelectedApps([]); else setSelectedApps(filteredApps.map(a => a.id)); };

  const filteredApps = applications.filter((app) => (app.username.toLowerCase().includes(searchQuery.toLowerCase()) || (app.why || '').toLowerCase().includes(searchQuery.toLowerCase())) && (filterStatus === 'all' || app.status === filterStatus));
  const filteredUsers = allUsers.filter((u) => u.displayName.toLowerCase().includes(userSearchQuery.toLowerCase()) || (u.email || '').toLowerCase().includes(userSearchQuery.toLowerCase()) || (u.discordUsername || '').toLowerCase().includes(userSearchQuery.toLowerCase()));
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const tabs: { id: Tab; icon: any; label: string; badge?: number }[] = [
    { id: 'overview', icon: BarChart3, label: 'Overview' },
    ...(canReviewApplications(currentUser.role) ? [{ id: 'applications' as Tab, icon: FileText, label: 'Applications', badge: stats.pending }] : []),
    ...(canManageRoles(currentUser.role) ? [{ id: 'users' as Tab, icon: UserCog, label: 'Users' }] : []),
    ...(canManageRoles(currentUser.role) ? [{ id: 'roles' as Tab, icon: Shield, label: 'Roles' }] : []),
    ...(canManageSettings(currentUser.role) ? [{ id: 'server' as Tab, icon: Server, label: 'Server' }] : []),
    ...(canManageSettings(currentUser.role) ? [{ id: 'formbuilder' as Tab, icon: FormInput, label: 'Form Builder' }] : []),
    ...(canManageSettings(currentUser.role) ? [{ id: 'socials' as Tab, icon: Link2, label: 'Socials' }] : []),
    ...(canManageSettings(currentUser.role) ? [{ id: 'database' as Tab, icon: Database, label: 'Cloud Sync' }] : []),
    ...(canManageSettings(currentUser.role) ? [{ id: 'settings' as Tab, icon: Settings, label: 'Settings' }] : []),
  ];

  const roleIcon = (roleId: string, size = 12) => {
    const role = roles.find(r => r.id === roleId) || BUILTIN_ROLES[5];
    const icons: Record<string, any> = { Crown, Shield, UserCog, Users, Hammer, User, Heart, Star, Sword, Wrench, LifeBuoy, Zap };
    const IconComponent = icons[role.icon] || User;
    return <IconComponent size={size} />;
  };

  const currentForm = appForms.find(f => f.id === selectedFormId);
  const inputClass = "w-full px-4 py-3 text-sm text-white bg-neutral-950/80 border border-neutral-800 rounded-xl placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/50 transition-all";
  const labelClass = "block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider";

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200">
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-neutral-900/50 border-r border-neutral-800/50 z-40 hidden lg:flex flex-col">
        <div className="p-6 border-b border-neutral-800/50">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center"><div className="h-3 w-3 rounded-sm bg-emerald-500" /></div>
            <div><span className="text-white font-bold block">Dismine</span><span className="text-neutral-500 text-[10px] uppercase font-bold tracking-widest">Admin Panel</span></div>
          </div>
          <div className="mt-6 flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-800/50 relative">
            <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-black text-white uppercase shrink-0">{currentUser.displayName.slice(0, 2)}</div>
            <div className="min-w-0 flex-1">
              <div className="text-white text-xs font-bold truncate">{currentUser.displayName}</div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: getRoleStyle(currentUser.role).color }}>{getRoleLabel(currentUser.role)}</span>
                <button onClick={() => setShowPersonalDetails(!showPersonalDetails)} className="text-neutral-500 hover:text-white transition-colors">{showPersonalDetails ? <EyeOff size={10} /> : <Eye size={10} />}</button>
              </div>
              <div className={`text-[9px] text-neutral-500 truncate transition-all ${!showPersonalDetails ? 'blur-[4px] select-none opacity-50' : ''}`}>{currentUser.email || currentUser.discordUsername}</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => { setActiveTab(t.id); setSelectedApp(null); }} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${activeTab === t.id ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}>
              <t.icon size={16} /> {t.label} {t.badge && t.badge > 0 && <span className="ml-auto text-[10px] font-bold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">{t.badge}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-neutral-800/50 space-y-2">
          <button onClick={onBack} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-neutral-400 hover:text-white transition-all"><ArrowLeft size={16} />Back to Site</button>
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-red-400 hover:text-red-300 transition-all"><LogOut size={16} />Sign Out</button>
        </div>
      </aside>

      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-neutral-950/90 backdrop-blur-xl border-b border-neutral-800/50 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="h-7 w-7 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center"><div className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /></div>
          <button onClick={onLogout} className="p-2 text-neutral-500 hover:text-red-400 transition-all"><LogOut size={16} /></button>
        </div>
        <div className="flex items-center gap-1 overflow-x-auto px-4 pb-3 no-scrollbar">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => { setActiveTab(t.id); setSelectedApp(null); }} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg whitespace-nowrap text-xs transition-all ${activeTab === t.id ? 'bg-emerald-500/10 text-emerald-400' : 'text-neutral-500 hover:text-white'}`}>
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="lg:ml-64 pt-28 lg:pt-0 min-h-screen">
        <div className="p-6 lg:p-10 max-w-6xl mx-auto">
          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="animate-fade-in space-y-10">
              <h1 className="text-3xl font-black text-white">Dashboard</h1>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[{ label: 'Total', v: stats.total, i: Users, c: 'text-neutral-300', b: 'bg-neutral-800' }, { label: 'Pending', v: stats.pending, i: Clock, c: 'text-amber-400', b: 'bg-amber-500/10' }, { label: 'Approved', v: stats.approved, i: CheckCircle, c: 'text-emerald-400', b: 'bg-emerald-500/10' }, { label: 'Rejected', v: stats.rejected, i: XCircle, c: 'text-red-400', b: 'bg-red-500/10' }].map((s) => (
                  <div key={s.label} className="p-6 rounded-3xl bg-neutral-900/50 border border-neutral-800/50">
                    <div className={`h-10 w-10 rounded-xl ${s.b} flex items-center justify-center mb-4`}><s.i size={18} className={s.c} /></div>
                    <div className="text-3xl font-black text-white">{s.v}</div>
                    <div className="text-neutral-500 text-[10px] font-black uppercase tracking-widest mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-6 rounded-3xl bg-neutral-900/50 border border-neutral-800/50">
                  <h3 className="text-white font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2"><Shield size={14} className="text-emerald-500" />Permissions</h3>
                  <div className="space-y-2">{[{ l: 'Review Apps', a: canReviewApplications(currentUser.role) }, { l: 'Manage Roles', a: canManageRoles(currentUser.role) }, { l: 'Manage Settings', a: canManageSettings(currentUser.role) }].map((p) => (
                    <div key={p.l} className="flex items-center justify-between px-4 py-2 rounded-xl bg-neutral-950/30 border border-neutral-800/30"><span className="text-neutral-400 text-xs font-bold uppercase">{p.l}</span>{p.a ? <CheckCircle size={16} className="text-emerald-500" /> : <XCircle size={16} className="text-neutral-700" />}</div>
                  ))}</div>
                </div>
                <div className="p-6 rounded-3xl bg-neutral-900/50 border border-neutral-800/50">
                  <h3 className="text-white font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2"><BarChart3 size={14} className="text-blue-500" />Stats</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-neutral-950/30"><span className="text-neutral-400 text-xs font-bold uppercase">Users</span><span className="text-white font-mono text-sm">{allUsers.length}</span></div>
                    <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-neutral-950/30"><span className="text-neutral-400 text-xs font-bold uppercase">Approval</span><span className="text-emerald-400 font-mono text-sm">{stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}%</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ROLES */}
          {activeTab === 'roles' && (
            <div className="animate-fade-in space-y-6">
              <div className="flex items-center justify-between"><h1 className="text-3xl font-black text-white">Roles</h1><button onClick={() => { setRoleEditForm({ permissions: [], color: '#10b981', icon: 'User' }); setShowNewRoleModal(true); }} className="px-6 py-3 bg-emerald-500 text-neutral-950 text-sm font-black rounded-xl hover:bg-emerald-400 transition-all">New Role</button></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roles.map(role => {
                  const style = getRoleStyle(role.id);
                  return (
                    <div key={role.id} className="p-6 rounded-3xl bg-neutral-900/50 border border-neutral-800/50 group">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4"><div className="h-12 w-12 rounded-2xl flex items-center justify-center border" style={{ backgroundColor: style.backgroundColor, borderColor: style.borderColor, color: style.color }}>{roleIcon(role.id, 24)}</div><div><h3 className="text-white font-bold">{role.name}</h3><div className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">{role.isCustom ? 'Custom' : 'System'}</div></div></div>
                        {role.isCustom && <div className="flex gap-1"><button onClick={() => { setEditingRoleId(role.id); setRoleEditForm(role); }} className="p-2 text-neutral-500 hover:text-white"><Pencil size={16} /></button><button onClick={() => handleRemoveRole(role.id)} className="p-2 text-neutral-500 hover:text-red-400"><Trash2 size={16} /></button></div>}
                      </div>
                      <p className="text-neutral-500 text-xs line-clamp-2">{role.description || 'No description.'}</p>
                    </div>
                  );
                })}
              </div>
              {(showNewRoleModal || editingRoleId) && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-center justify-center p-4">
                  <div className="bg-neutral-900 border border-neutral-800 rounded-[2.5rem] p-8 max-w-xl w-full animate-in zoom-in-95 duration-200">
                    <h2 className="text-2xl font-black text-white mb-6">{editingRoleId ? 'Edit Role' : 'New Role'}</h2>
                    <div className="space-y-4 mb-8">
                       <div><label className={labelClass}>Name</label><input type="text" value={roleEditForm.name || ''} onChange={e => setRoleEditForm({...roleEditForm, name: e.target.value})} className={inputClass} /></div>
                       <div className="grid grid-cols-2 gap-4">
                         <div><label className={labelClass}>Color</label><input type="color" value={roleEditForm.color || '#10b981'} onChange={e => setRoleEditForm({...roleEditForm, color: e.target.value})} className="w-full h-12 rounded-xl bg-neutral-950 cursor-pointer" /></div>
                         <div><label className={labelClass}>Icon</label><select value={roleEditForm.icon || 'User'} onChange={e => setRoleEditForm({...roleEditForm, icon: e.target.value})} className={inputClass}>{AVAILABLE_ICONS.map(i => <option key={i} value={i}>{i}</option>)}</select></div>
                       </div>
                       <div><label className={labelClass}>Permissions</label><div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                         {AVAILABLE_PERMISSIONS.map(p => (
                           <label key={p.id} className={`flex items-center gap-3 p-3 rounded-xl border ${roleEditForm.permissions?.includes(p.id) ? 'bg-emerald-500/10 border-emerald-500/20 text-white' : 'bg-neutral-950 border-neutral-800 text-neutral-500'}`}>
                             <input type="checkbox" checked={roleEditForm.permissions?.includes(p.id)} onChange={e => { const perms = [...(roleEditForm.permissions || [])]; if (e.target.checked) perms.push(p.id); else perms.splice(perms.indexOf(p.id), 1); setRoleEditForm({...roleEditForm, permissions: perms}); }} className="rounded bg-neutral-800 border-neutral-700 text-emerald-500" />
                             <div className="text-[10px] font-black uppercase tracking-widest">{p.label}</div>
                           </label>
                         ))}
                       </div></div>
                    </div>
                    <div className="flex gap-4"><button onClick={editingRoleId ? handleUpdateRole : handleCreateRole} className="flex-1 py-4 bg-emerald-500 text-neutral-950 font-black rounded-2xl">SAVE</button><button onClick={() => { setShowNewRoleModal(false); setEditingRoleId(null); }} className="flex-1 py-4 bg-neutral-800 text-neutral-400 font-bold rounded-2xl">CANCEL</button></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* APPLICATIONS */}
          {activeTab === 'applications' && !selectedApp && (
            <div className="animate-fade-in space-y-6">
              <div className="flex items-center justify-between"><h1 className="text-3xl font-black text-white">Submissions</h1>{selectedApps.length > 0 && <button onClick={() => setShowBulkDeleteConfirm(true)} className="px-6 py-2 bg-red-500 text-white font-black rounded-xl uppercase text-[10px] tracking-widest">Delete {selectedApps.length}</button>}</div>
              <div className="flex gap-3"><input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className={inputClass} /><select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 text-sm text-white uppercase font-bold"><option value="all">ALL</option>{Object.entries(statusConfig).map(([s, c]) => <option key={s} value={s}>{c.label.toUpperCase()}</option>)}</select></div>
              <div className="rounded-[2rem] bg-neutral-900/50 border border-neutral-800/50 overflow-hidden divide-y divide-neutral-800/50">
                <div className="px-8 py-3 bg-neutral-800/20 flex items-center gap-4"><input type="checkbox" checked={selectedApps.length === filteredApps.length && filteredApps.length > 0} onChange={toggleSelectAll} className="rounded bg-neutral-900 border-neutral-800 text-emerald-500" /><span className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">Select All Visible</span></div>
                {filteredApps.map(app => {
                  const c = statusConfig[app.status];
                  const rStyle = getRoleStyle(app.userRole || 'user');
                  return (
                    <div key={app.id} className="px-8 py-4 flex items-center gap-6 hover:bg-neutral-800/10 transition-colors">
                      <input type="checkbox" checked={selectedApps.includes(app.id)} onChange={() => toggleSelectApp(app.id)} className="rounded bg-neutral-900 border-neutral-800 text-emerald-500" />
                      <div className="flex-1 flex items-center justify-between min-w-0">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-neutral-800 flex items-center justify-center text-[10px] font-black text-neutral-500 uppercase shrink-0">{app.username.slice(0, 2)}</div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-0.5"><h3 className="text-white font-bold truncate">{app.username}</h3><span style={{ color: rStyle.color, backgroundColor: rStyle.backgroundColor, borderColor: rStyle.borderColor }} className="text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-widest">{getRoleLabel(app.userRole || 'user')}</span></div>
                            <div className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest">{app.formName || 'Submission'} · {formatDate(app.submittedAt)}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3"><span className={`text-[9px] font-black px-3 py-1 rounded-full border ${c.bg} ${c.color} ${c.border} uppercase tracking-widest`}>{c.label}</span><button onClick={() => { setSelectedApp(app); setNoteInput(app.notes || ''); setMessageInput(app.adminMessage || ''); }} className="p-2 text-neutral-500 hover:text-white"><Eye size={18} /></button></div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {showBulkDeleteConfirm && <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[70] flex items-center justify-center p-4"><div className="bg-neutral-900 border border-neutral-800 rounded-[2.5rem] p-10 max-w-sm w-full text-center"><div className="h-16 w-16 rounded-[2rem] bg-red-500/10 flex items-center justify-center text-red-500 mx-auto mb-6"><Trash2 size={32} /></div><h3 className="text-2xl font-black text-white mb-2 uppercase">Bulk Purge</h3><p className="text-neutral-500 text-xs font-bold uppercase tracking-widest mb-10 leading-relaxed">Permanently delete {selectedApps.length} records?</p><div className="flex flex-col gap-3"><button onClick={handleBulkDelete} className="w-full py-4 bg-red-500 text-white font-black rounded-2xl uppercase tracking-widest text-xs">CONFIRM PURGE</button><button onClick={() => setShowBulkDeleteConfirm(false)} className="w-full py-4 bg-neutral-800 text-neutral-400 font-bold rounded-2xl uppercase tracking-widest text-xs">CANCEL</button></div></div></div>}
            </div>
          )}

          {/* APPLICATION DETAIL */}
          {activeTab === 'applications' && selectedApp && (
            <div className="animate-fade-in space-y-8">
              <button onClick={() => setSelectedApp(null)} className="flex items-center gap-2 text-[10px] font-black text-neutral-600 hover:text-emerald-500 uppercase tracking-widest transition-all"><ArrowLeft size={14} /> Back to dashboard</button>
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                 <div className="xl:col-span-2 space-y-8">
                   <div className="p-8 rounded-[2.5rem] bg-neutral-900/50 border border-neutral-800/50"><div className="flex items-center gap-6 mb-8"><div className="h-20 w-20 rounded-3xl bg-neutral-800 flex items-center justify-center text-2xl font-black text-neutral-400 border border-neutral-700">{selectedApp.username.slice(0, 2)}</div><div><h2 className="text-3xl font-black text-white mb-2">{selectedApp.username}</h2><span className={`text-[10px] font-black px-4 py-1 rounded-full border uppercase tracking-widest ${statusConfig[selectedApp.status].bg} ${statusConfig[selectedApp.status].color} ${statusConfig[selectedApp.status].border}`}>{statusConfig[selectedApp.status].label}</span></div></div>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[{ l: 'Age', v: selectedApp.age }, { l: 'Timezone', v: selectedApp.timezone?.split(' ')[0] }, { l: 'Applied', v: new Date(selectedApp.submittedAt).toLocaleDateString() }, { l: 'Type', v: selectedApp.formName }].map(s => <div key={s.l} className="p-4 rounded-2xl bg-neutral-950/40 border border-neutral-800/50"><div className="text-[8px] font-black text-neutral-600 uppercase tracking-widest mb-1">{s.l}</div><div className="text-white text-[11px] font-black uppercase truncate">{s.v || 'N/A'}</div></div>)}</div></div>
                   <div className="p-8 rounded-[2.5rem] bg-neutral-900/50 border border-neutral-800/50"><h3 className="text-white font-black text-xs uppercase tracking-widest mb-6">Narrative</h3><div className="p-6 rounded-2xl bg-neutral-950/50 border border-neutral-800 text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap">{selectedApp.why || 'No archive.'}</div></div>
                   <div className="p-8 rounded-[2.5rem] bg-neutral-900/50 border border-neutral-800/50"><h3 className="text-white font-black text-xs uppercase tracking-widest mb-6">Experience</h3><div className="p-6 rounded-2xl bg-neutral-950/50 border border-neutral-800 text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap">{selectedApp.experience || 'No archive.'}</div></div>
                   <div className="p-8 rounded-[2.5rem] bg-neutral-900/50 border border-emerald-500/10 flex flex-col h-[500px]"><h3 className="text-white font-black text-xs uppercase tracking-widest mb-8 pb-4 border-b border-neutral-800 flex items-center justify-between">Secure Frequency {currentChat && <button onClick={() => handleToggleChat(currentChat.status === 'open' ? 'closed' : 'open')} className={`text-[8px] px-2 py-1 rounded-md border font-black ${currentChat.status === 'open' ? 'text-amber-500 border-amber-500/20 bg-amber-500/5' : 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5'}`}>{currentChat.status.toUpperCase()}</button>}</h3>
                   {!currentChat ? <div className="flex-1 flex flex-col items-center justify-center text-center"><div className="h-16 w-16 rounded-[1.5rem] bg-neutral-800 flex items-center justify-center text-neutral-600 mb-6 border border-neutral-700/50"><MessageSquare size={32} /></div><div className="w-full flex gap-2"><input type="text" value={chatMessage} onChange={e => setChatMessage(e.target.value)} placeholder="Open channel..." className={inputClass} /><button onClick={handleSendChatMessage} className="px-6 bg-emerald-500 text-neutral-950 font-black rounded-xl uppercase text-[10px] tracking-widest">START</button></div></div> : 
                   <><div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2 custom-scrollbar">{currentChat.messages.map(m => <div key={m.id} className={`flex flex-col ${m.senderId === currentUser.id ? 'items-end' : 'items-start'}`}><div className="flex items-center gap-2 mb-1"><span className={`text-[8px] font-black uppercase ${m.senderId === currentUser.id ? 'text-emerald-500' : 'text-blue-500'}`}>{m.senderName}</span><span className="text-[7px] text-neutral-700 font-bold">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div><div className={`px-4 py-2 rounded-2xl text-xs ${m.senderId === currentUser.id ? 'bg-emerald-500/10 text-emerald-100 border border-emerald-500/10 rounded-tr-none' : 'bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-tl-none'}`}>{m.text}</div></div>)}</div>
                   {currentChat.status === 'open' ? <div className="flex gap-2"><input type="text" value={chatMessage} onChange={e => setChatMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendChatMessage()} placeholder="Respond..." className={inputClass} /><button onClick={handleSendChatMessage} className="px-6 bg-emerald-500 text-neutral-950 font-black rounded-xl uppercase text-[10px] tracking-widest">SEND</button></div> : <div className="p-4 bg-neutral-950/50 rounded-xl border border-neutral-800 text-center"><span className="text-[8px] font-black text-neutral-600 uppercase tracking-[0.3em]">Channel Terminated</span></div>}</>}</div>
                 </div>
                 <div className="space-y-8">
                   <div className="p-8 rounded-[2.5rem] bg-neutral-900/50 border border-neutral-800/50"><h3 className="text-white font-black text-xs uppercase tracking-widest mb-6">Protocols</h3><div className="grid grid-cols-1 gap-2">
                     {[{ id: 'approved', l: 'APPROVE ENTRY', c: 'text-emerald-400', b: 'bg-emerald-500/5 border-emerald-500/10' }, { id: 'under_review', l: 'AUDIT CASE', c: 'text-blue-400', b: 'bg-blue-500/5 border-blue-500/10' }, { id: 'rejected', l: 'DENY ACCESS', c: 'text-red-400', b: 'bg-red-500/5 border-red-500/10' }, { id: 'pending', l: 'VOID STATUS', c: 'text-neutral-500', b: 'bg-neutral-800 border-neutral-700' }].map(a => (
                       <button key={a.id} onClick={() => handleStatusChange(selectedApp.id, a.id as any)} disabled={selectedApp.status === a.id} className={`w-full py-3 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${selectedApp.status === a.id ? 'opacity-20 cursor-not-allowed' : `${a.b} ${a.c} hover:brightness-125`}`}>{a.l}</button>
                     ))}
                   </div></div>
                   <div className="p-8 rounded-[2.5rem] bg-neutral-900/50 border border-neutral-800/50"><h3 className="text-white font-black text-xs uppercase tracking-widest mb-4">Internal Notes</h3><textarea value={noteInput} onChange={e => setNoteInput(e.target.value)} rows={3} placeholder="Reviewer log..." className={`${inputClass} !py-3 !text-xs resize-none`} /><button onClick={() => handleAddNote(selectedApp.id)} disabled={!noteInput.trim()} className="mt-2 w-full py-3 bg-neutral-800 text-white font-black text-[9px] rounded-xl border border-neutral-700 uppercase tracking-widest disabled:opacity-20">SAVE LOG</button></div>
                   <div className="p-8 rounded-[2.5rem] bg-neutral-900/50 border border-emerald-500/10"><h3 className="text-white font-black text-xs uppercase tracking-widest mb-1 flex items-center gap-2">Public Notice</h3><p className="text-[8px] font-bold text-neutral-600 uppercase tracking-widest mb-4">Visible to applicant</p><textarea value={messageInput} onChange={e => setMessageInput(e.target.value)} rows={3} placeholder="System notice..." className={`${inputClass} !py-3 !text-xs resize-none`} /><button onClick={() => { if (!messageInput.trim()) return; updateApplication(selectedApp.id, { adminMessage: messageInput.trim() }); refreshData(); setSelectedApp({...selectedApp, adminMessage: messageInput.trim()}); setMessageInput(''); }} disabled={!messageInput.trim()} className="mt-2 w-full py-3 bg-emerald-500/10 text-emerald-400 font-black text-[9px] rounded-xl border border-emerald-500/20 uppercase tracking-widest disabled:opacity-20">TRANSMIT</button></div>
                 </div>
              </div>
            </div>
          )}

          {/* USERS */}
          {activeTab === 'users' && (
            <div className="animate-fade-in space-y-8">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-black text-white">Registry</h1>
                <button 
                  onClick={() => setShowCreateUserModal(true)}
                  className="px-6 py-2.5 bg-emerald-500 text-neutral-950 text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center gap-2"
                >
                  <Plus size={14} /> Create User
                </button>
              </div>
              {userMessage && <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-widest ${userMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}><AlertTriangle size={14} /> {userMessage.text}</div>}
              <div className="relative"><Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-700" /><input type="text" placeholder="Search..." value={userSearchQuery} onChange={e => setUserSearchQuery(e.target.value)} className={`${inputClass} !pl-14`} /></div>
              
              {showCreateUserModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-center justify-center p-4">
                  <div className="bg-neutral-900 border border-neutral-800 rounded-[2.5rem] p-8 max-w-lg w-full animate-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-black text-white uppercase tracking-tight">Manual Registry</h2>
                      <button onClick={() => setShowCreateUserModal(false)} className="text-neutral-500 hover:text-white transition-colors"><X size={20} /></button>
                    </div>
                    <div className="space-y-4 mb-8">
                       <div><label className={labelClass}>Display Name</label><input type="text" value={createUserForm.displayName} onChange={e => setCreateUserForm({...createUserForm, displayName: e.target.value})} className={inputClass} placeholder="Full Name" /></div>
                       <div><label className={labelClass}>Email Address</label><input type="email" value={createUserForm.email} onChange={e => setCreateUserForm({...createUserForm, email: e.target.value})} className={inputClass} placeholder="user@example.com" /></div>
                       <div><label className={labelClass}>Temporary Password</label><input type="text" value={createUserForm.password} onChange={e => setCreateUserForm({...createUserForm, password: e.target.value})} className={inputClass} placeholder="Secret Passphrase" /></div>
                       <div><label className={labelClass}>Designation</label><select value={createUserForm.role} onChange={e => setCreateUserForm({...createUserForm, role: e.target.value as UserRole})} className={inputClass}>
                         {roles.map(r => <option key={r.id} value={r.id}>{r.name.toUpperCase()}</option>)}
                       </select></div>
                    </div>
                    <div className="flex gap-4">
                      <button onClick={handleAdminCreateUser} className="flex-1 py-4 bg-emerald-500 text-neutral-950 font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl">ESTABLISH ACCOUNT</button>
                      <button onClick={() => setShowCreateUserModal(false)} className="flex-1 py-4 bg-neutral-800 text-neutral-400 font-bold rounded-2xl uppercase text-[10px] tracking-widest">CANCEL</button>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-[2rem] bg-neutral-900/50 border border-neutral-800/50 overflow-hidden shadow-2xl divide-y divide-neutral-800/50">
                {filteredUsers.map(u => {
                  const s = getRoleStyle(u.role);
                  return (
                    <div key={u.id} className="group px-8 py-5 flex items-center justify-between hover:bg-neutral-800/10 transition-colors">
                      <div className="flex items-center gap-4"><div className="h-10 w-10 rounded-xl bg-neutral-800 flex items-center justify-center text-[10px] font-black text-white uppercase border border-neutral-700/50 shrink-0">{u.displayName.slice(0, 2)}</div><div className="min-w-0"><h3 className="text-white font-bold truncate">{u.displayName}</h3><div className={`text-[9px] font-bold uppercase tracking-widest ${!showPersonalDetails && u.id !== currentUser.id ? 'blur-[4px]' : 'text-neutral-500'}`}>{u.email || u.discordUsername}</div></div></div>
                      <div className="flex items-center gap-2">
                        {roleChangeTarget === u.id ? <div className="flex gap-1">{roles.filter(r => r.id !== 'owner' && r.id !== u.role).map(r => <button key={r.id} onClick={() => handleRoleChange(u.id, r.id)} className="text-[8px] font-black px-2 py-1 rounded-md border border-neutral-700 text-neutral-400 hover:text-white">{r.name.toUpperCase()}</button>)}<button onClick={() => setRoleChangeTarget(null)} className="text-[8px] font-black text-neutral-600 px-2 uppercase tracking-widest">X</button></div> : 
                        passwordChangeTarget === u.id ? <div className="flex gap-2"><input type="text" value={newPasswordInput} onChange={e => setNewPasswordInput(e.target.value)} placeholder="New Secret" className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1 text-[10px] w-24" /><button onClick={() => handleUpdatePassword(u.id)} className="text-[8px] font-black px-2 py-1 bg-emerald-500 text-neutral-950 rounded-md">RESET</button><button onClick={() => setPasswordChangeTarget(null)} className="text-[8px] text-neutral-600">X</button></div> :
                        <div className="flex items-center gap-3">
                          {u.memberId ? (
                            <span className="text-[10px] font-mono text-neutral-500 bg-neutral-950 px-2 py-1 rounded border border-neutral-800">{u.memberId}</span>
                          ) : (
                            <button onClick={() => handleGenerateMemberId(u.id)} className="text-[8px] font-black px-2 py-1 bg-neutral-800 text-neutral-400 hover:text-white rounded border border-neutral-700 uppercase tracking-widest transition-all">Assign ID</button>
                          )}
                          <span style={{ color: s.color, backgroundColor: s.backgroundColor, borderColor: s.borderColor }} className="text-[9px] font-black px-3 py-1 rounded-full border uppercase tracking-widest shrink-0">{getRoleLabel(u.role)}</span>
                          {u.role !== 'owner' && <><button onClick={() => setRoleChangeTarget(u.id)} className="p-2 text-neutral-500 hover:text-blue-400"><Shield size={16} /></button>{u.authMethod === 'email' && <button onClick={() => setPasswordChangeTarget(u.id)} className="p-2 text-neutral-500 hover:text-amber-400"><Lock size={16} /></button>}<button onClick={() => { if (confirm('Delete user?')) handleDeleteUser(u.id); }} className="p-2 text-neutral-500 hover:text-red-400"><Trash2 size={16} /></button></>}
                        </div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SERVER & SEASON */}
          {activeTab === 'server' && (
            <div className="animate-fade-in space-y-8">
              <h1 className="text-3xl font-black text-white">Continuum</h1>
              <div className="p-8 rounded-[2.5rem] bg-neutral-900/50 border border-amber-500/10"><h3 className="text-white font-black text-xs uppercase tracking-widest mb-8 flex items-center justify-between">Timeline Configuration <button onClick={handleSaveSeasonInfo} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${seasonSaved ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500 text-neutral-950'}`}>{seasonSaved ? 'STORED' : 'SAVE'}</button></h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-4"><div><label className={labelClass}>Code</label><input type="number" value={seasonInfo.number} onChange={e => setSeasonInfo({...seasonInfo, number: parseInt(e.target.value)||1})} className={inputClass} /></div><div><label className={labelClass}>Palette</label><select value={seasonInfo.theme} onChange={e => setSeasonInfo({...seasonInfo, theme: e.target.value})} className={inputClass}><option value="emerald">Emerald</option><option value="blue">Blue</option><option value="purple">Purple</option><option value="amber">Amber</option><option value="red">Red</option></select></div></div>
                   <div><label className={labelClass}>Designation</label><input type="text" value={seasonInfo.name} onChange={e => setSeasonInfo({...seasonInfo, name: e.target.value})} className={inputClass} /></div>
                   <div><label className={labelClass}>Badge Override</label><input type="text" value={seasonInfo.heroBadgeText || ''} onChange={e => setSeasonInfo({...seasonInfo, heroBadgeText: e.target.value})} className={inputClass} /></div>
                </div>
                <div className="space-y-4">
                   <div><label className={labelClass}>Summary</label><textarea value={seasonInfo.description} onChange={e => setSeasonInfo({...seasonInfo, description: e.target.value})} rows={5} className={`${inputClass} resize-none`} /></div>
                   <div className="flex items-center justify-between p-4 bg-neutral-950 rounded-2xl border border-neutral-800"><span className="text-[10px] font-black text-neutral-600 uppercase">State</span><button onClick={() => setSeasonInfo({...seasonInfo, isActive: !seasonInfo.isActive})} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase ${seasonInfo.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-500'}`}>{seasonInfo.isActive ? 'ACTIVE' : 'ENDED'}</button></div>
                </div>
              </div>
              <div className="mt-8 pt-8 border-t border-neutral-800/50"><label className={labelClass}>Atmospheric URL</label><input type="url" value={seasonInfo.bannerImage} onChange={e => setSeasonInfo({...seasonInfo, bannerImage: e.target.value})} className={`${inputClass} !text-xs font-mono`} placeholder="https://..." /><div className="mt-4 flex items-center gap-6"><div className="flex-1"><label className={labelClass}>Density: {seasonInfo.bannerOverlay}%</label><input type="range" min={0} max={100} value={seasonInfo.bannerOverlay} onChange={e => setSeasonInfo({...seasonInfo, bannerOverlay: parseInt(e.target.value)})} className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-500" /></div><div className="w-32 h-16 rounded-xl bg-neutral-950 border border-neutral-800 overflow-hidden relative">{seasonInfo.bannerImage && <><img src={seasonInfo.bannerImage} className="absolute inset-0 w-full h-full object-cover opacity-50" /><div className="absolute inset-0 bg-black" style={{ opacity: seasonInfo.bannerOverlay/100 }} /></>}</div></div></div></div>
              <div className="p-8 rounded-[2.5rem] bg-neutral-900/50 border border-neutral-800/50"><h3 className="text-white font-black text-xs uppercase tracking-widest mb-6 flex items-center justify-between">Directives <button onClick={handleSaveServerInfo} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${serverSaved ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-500 text-neutral-950'}`}>{serverSaved ? 'STORED' : 'SAVE'}</button></h3>
              <div className="space-y-2 mb-6">{serverInfo.rules.map((r, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-neutral-950/40 rounded-xl border border-neutral-800/60 group">
                  <span className="text-[10px] font-black text-emerald-500/50 w-4">{i+1}</span><p className="flex-1 text-xs text-neutral-400">{r}</p><button onClick={() => handleDeleteRule(i)} className="text-neutral-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>
                </div>
              ))}</div>
              <div className="flex gap-2"><input type="text" value={newRuleText} onChange={e => setNewRuleText(e.target.value)} placeholder="Type rule..." className={`${inputClass} !py-2`} onKeyDown={e => e.key === 'Enter' && handleAddRule()} /><button onClick={handleAddRule} disabled={!newRuleText.trim()} className="px-4 bg-emerald-500 text-neutral-950 font-black rounded-xl text-[9px] uppercase tracking-widest disabled:opacity-20">ADD</button></div></div>
            </div>
          )}

          {/* FORM BUILDER */}
          {activeTab === 'formbuilder' && (
            <div className="animate-fade-in space-y-8">
              <div className="flex items-center justify-between"><h1 className="text-3xl font-black text-white">Forms</h1><div className="flex gap-2"><button onClick={() => setShowNewFormModal(true)} className="px-4 py-2 bg-neutral-800 text-white text-[10px] font-black rounded-xl border border-neutral-700 uppercase tracking-widest">New Stream</button><button onClick={() => handleSaveForms(appForms)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${fieldsSaved ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-500 text-neutral-950'}`}>{fieldsSaved ? 'UPDATED' : 'SAVE ALL'}</button></div></div>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-1 space-y-2"><h3 className="text-[8px] font-black text-neutral-700 uppercase tracking-[0.3em] px-2 mb-4">Streams</h3>{appForms.map(f => (
                  <button key={f.id} onClick={() => setSelectedFormId(f.id)} className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${selectedFormId === f.id ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400 shadow-xl' : 'bg-neutral-900 border-neutral-800 text-neutral-500'}`}><div className="font-black text-xs uppercase tracking-widest">{f.name}</div><div className="text-[8px] font-bold opacity-40 mt-1 uppercase">{f.fields.length} Fields · {f.status}</div></button>
                ))}</div>
                <div className="lg:col-span-3 space-y-6">
                  {currentForm && (
                    <div className="p-8 rounded-[2.5rem] bg-neutral-900/50 border border-neutral-800/50">
                      <div className="flex items-center justify-between mb-8 pb-8 border-b border-neutral-800"><div className="space-y-1"><input type="text" value={currentForm.name} onChange={e => setAppForms(appForms.map(f => f.id === selectedFormId ? {...f, name: e.target.value} : f))} className="bg-transparent border-none p-0 text-2xl font-black text-white focus:ring-0 w-full" /><input type="text" value={currentForm.description} onChange={e => setAppForms(appForms.map(f => f.id === selectedFormId ? {...f, description: e.target.value} : f))} className="bg-transparent border-none p-0 text-[10px] text-neutral-600 font-black uppercase tracking-widest focus:ring-0 w-full" /></div><button onClick={() => setAppForms(appForms.map(f => f.id === selectedFormId ? {...f, enabled: !f.enabled} : f))} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase border transition-all ${currentForm.enabled ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>{currentForm.enabled ? 'ACTIVE' : 'DISABLED'}</button></div>
                      <div className="bg-neutral-950 p-6 rounded-3xl border border-neutral-800 mb-8"><h4 className="text-[8px] font-black text-neutral-700 uppercase tracking-[0.4em] mb-6">Status & Schedule</h4><div className="grid grid-cols-4 gap-2 mb-8">{['open', 'ending_soon', 'coming_soon', 'closed'].map(s => (
                        <button key={s} onClick={() => setAppForms(appForms.map(f => f.id === selectedFormId ? {...f, status: s as any} : f))} className={`py-3 rounded-xl border text-[8px] font-black uppercase tracking-widest transition-all ${currentForm.status === s ? 'bg-emerald-500/10 border-emerald-500/20 text-white' : 'bg-neutral-900 border-neutral-800 text-neutral-600'}`}>{s.replace('_', ' ')}</button>
                      ))}</div><div className="grid grid-cols-3 gap-4"><div><label className={labelClass}>Auto-Open</label><input type="datetime-local" value={currentForm.schedule?.openDate || ''} onChange={e => setAppForms(appForms.map(f => f.id === selectedFormId ? {...f, schedule: {...f.schedule, openDate: e.target.value}} : f))} className={`${inputClass} !py-2 !text-[10px]`} /></div><div><label className={labelClass}>Auto-Close</label><input type="datetime-local" value={currentForm.schedule?.closeDate || ''} onChange={e => setAppForms(appForms.map(f => f.id === selectedFormId ? {...f, schedule: {...f.schedule, closeDate: e.target.value}} : f))} className={`${inputClass} !py-2 !text-[10px]`} /></div><div><label className={labelClass}>Zone</label><select value={currentForm.schedule?.timezone || 'UTC'} onChange={e => setAppForms(appForms.map(f => f.id === selectedFormId ? {...f, schedule: {...f.schedule, timezone: e.target.value}} : f))} className={`${inputClass} !py-2 !text-[10px]`}>{['UTC', 'EST', 'PST', 'GMT', 'CET'].map(z => <option key={z} value={z}>{z}</option>)}</select></div></div></div>
                      <div className="space-y-3">{currentForm.fields.map((field, idx) => (
                        <div key={field.id} className="p-5 rounded-2xl bg-neutral-950/40 border border-neutral-800 group transition-all"><div className="flex items-center justify-between"><div className="flex items-center gap-4"><div className="flex flex-col gap-1"><button onClick={() => handleMoveField(idx, 'up')} disabled={idx === 0} className="text-neutral-700 hover:text-white disabled:opacity-0"><ArrowUp size={12} /></button><button onClick={() => handleMoveField(idx, 'down')} disabled={idx === currentForm.fields.length - 1} className="text-neutral-700 hover:text-white disabled:opacity-0"><ArrowDown size={12} /></button></div><div><div className="flex items-center gap-3 mb-1"><span className="text-white font-black text-xs uppercase tracking-widest">{field.label}</span>{field.required && <span className="text-[7px] font-black bg-red-500/10 text-red-500 px-1 py-0.5 rounded border border-red-500/10">REQUIRED</span>}</div><span className="text-[8px] font-black text-neutral-700 uppercase tracking-widest">{field.type} · {field.placeholder || 'No Hint'}</span></div></div><div className="flex gap-1"><button onClick={() => setEditingFieldId(field.id === editingFieldId ? null : field.id)} className="p-2 text-neutral-600 hover:text-blue-500 transition-all"><Pencil size={16} /></button><button onClick={() => handleDeleteField(field.id)} className="p-2 text-neutral-600 hover:text-red-500 transition-all"><Trash2 size={16} /></button></div></div>
                        {editingFieldId === field.id && <div className="mt-6 pt-6 border-t border-neutral-900 space-y-4 animate-in slide-in-from-top-2"><div className="grid grid-cols-2 gap-4"><div><label className={labelClass}>Label</label><input type="text" value={field.label} onChange={e => handleUpdateField(field.id, {label: e.target.value})} className={inputClass} /></div><div><label className={labelClass}>Type</label><select value={field.type} onChange={e => handleUpdateField(field.id, {type: e.target.value as any})} className={inputClass}><option value="text">Text</option><option value="textarea">Long Answer</option><option value="number">Number</option><option value="select">Dropdown</option></select></div></div><input type="text" value={field.placeholder || ''} onChange={e => handleUpdateField(field.id, {placeholder: e.target.value})} className={inputClass} placeholder="Hint..." />{field.type === 'select' && <textarea value={field.options?.join('\n') || ''} onChange={e => handleUpdateField(field.id, {options: e.target.value.split('\n').filter(Boolean)})} className={`${inputClass} !text-[10px] font-mono`} placeholder="One per line..." rows={3} />}<div className="flex justify-between items-center"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={field.required} onChange={e => handleUpdateField(field.id, {required: e.target.checked})} className="rounded bg-neutral-800 border-neutral-700 text-emerald-500" /><span className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">Mandatory</span></label><button onClick={() => setEditingFieldId(null)} className="px-5 py-2 bg-neutral-800 text-white font-black text-[9px] rounded-lg border border-neutral-700 uppercase tracking-widest">OK</button></div></div>}</div>
                      ))}</div>
                      <div className="mt-8 pt-8 border-t border-neutral-800">
                        {showNewFieldForm ? <div className="p-8 rounded-3xl bg-neutral-950 border border-emerald-500/10 space-y-6 animate-in slide-in-from-top-4 duration-500"><h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">New Field Configuration</h4><div className="grid grid-cols-2 gap-6"><div><label className={labelClass}>Label</label><input type="text" value={newField.label || ''} onChange={e => setNewField({...newField, label: e.target.value})} className={inputClass} placeholder="Question..." /></div><div><label className={labelClass}>Type</label><select value={newField.type} onChange={e => setNewField({...newField, type: e.target.value as any})} className={inputClass}><option value="text">Text</option><option value="textarea">Long Answer</option><option value="number">Number</option><option value="select">Dropdown</option></select></div></div>{newField.type === 'select' && <textarea onChange={e => setNewField({...newField, options: e.target.value.split('\n').filter(Boolean)})} className={`${inputClass} !text-[10px] font-mono`} rows={3} placeholder="Options..." />}<div className="flex justify-between items-center pt-4 border-t border-neutral-900"><label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={newField.required} onChange={e => setNewField({...newField, required: e.target.checked})} className="rounded bg-neutral-800 border-neutral-700 text-emerald-500" /><span className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">Required</span></label><div className="flex gap-4"><button onClick={() => setShowNewFieldForm(false)} className="text-[8px] font-black text-neutral-700 hover:text-white uppercase tracking-widest">Void</button><button onClick={handleAddField} disabled={!newField.label} className="px-8 py-3 bg-emerald-500 text-neutral-950 font-black rounded-xl text-[9px] uppercase tracking-widest hover:bg-emerald-400 disabled:opacity-20 transition-all">ESTABLISH</button></div></div></div> : 
                        <button onClick={() => setShowNewFieldForm(true)} className="w-full py-10 border-2 border-dashed border-neutral-800 rounded-[2.5rem] text-neutral-700 hover:text-emerald-500 hover:border-emerald-500/20 transition-all flex flex-col items-center justify-center gap-3 group"><Plus size={24} className="group-hover:scale-125 transition-transform" /><span className="text-[9px] font-black uppercase tracking-[0.3em]">Integrate New Data Point</span></button>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {showNewFormModal && <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[70] flex items-center justify-center p-4"><div className="bg-neutral-900 border border-neutral-800 rounded-[3rem] p-10 max-w-lg w-full shadow-2xl animate-in zoom-in-90 duration-300 text-center"><div className="h-16 w-16 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mx-auto mb-8"><FormInput size={32} /></div><h2 className="text-3xl font-black text-white mb-3 tracking-tight uppercase">Establish Stream</h2><div className="space-y-6 mb-10"><input type="text" value={newFormName} onChange={e => setNewFormName(e.target.value)} className={inputClass} placeholder="Display Designation..." autoFocus /><textarea value={newFormDesc} onChange={e => setNewFormDesc(e.target.value)} className={`${inputClass} resize-none`} rows={3} placeholder="Mission Summary..." /></div><div className="flex flex-col gap-3"><button onClick={handleCreateForm} className="w-full py-5 bg-emerald-500 text-neutral-950 font-black rounded-3xl uppercase text-[10px] tracking-widest shadow-xl">ACTIVATE CHANNEL</button><button onClick={() => setShowNewFormModal(false)} className="w-full py-4 text-neutral-600 font-bold uppercase text-[9px] tracking-widest">DISMISS</button></div></div></div>}
            </div>
          )}

          {/* SOCIALS */}
          {activeTab === 'socials' && (
            <div className="animate-fade-in space-y-10">
              <div className="flex items-center justify-between"><h1 className="text-3xl font-black text-white">Touchpoints</h1><button onClick={handleSaveSocials} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest ${socialsSaved ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-500 text-neutral-950'}`}>{socialsSaved ? 'PERSISTED' : 'SAVE ALL'}</button></div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 space-y-4">
                  {socialLinks.map(link => {
                     const iconMap: Record<string, any> = { discord: MessageSquare, youtube: Youtube, instagram: Instagram, tiktok: Video, twitter: Twitter, twitch: Twitch, globe: Globe, mail: Mail, gamepad: Gamepad2, music: Music };
                     const SocialIcon = iconMap[link.icon] || Globe;
                     const colors: Record<string, string> = { indigo: 'bg-indigo-500', red: 'bg-red-500', pink: 'bg-pink-500', neutral: 'bg-neutral-500', blue: 'bg-blue-500', emerald: 'bg-emerald-500', orange: 'bg-orange-500', purple: 'bg-purple-500' };
                     return (
                       <div key={link.id} className={`p-6 rounded-[2.5rem] border transition-all ${link.enabled ? 'bg-neutral-900/50 border-neutral-800/50' : 'bg-neutral-900/20 border-neutral-800/20 opacity-40'}`}>
                         {editingSocialId === link.id ? <div className="space-y-4 animate-in slide-in-from-top-2"><div className="grid grid-cols-2 gap-4"><div><label className={labelClass}>Name</label><input type="text" value={link.name} onChange={e => handleUpdateSocial(link.id, {name: e.target.value})} className={inputClass} /></div><div><label className={labelClass}>Icon</label><select value={link.icon} onChange={e => handleUpdateSocial(link.id, {icon: e.target.value})} className={inputClass}>{Object.keys(iconMap).map(k => <option key={k} value={k}>{k.toUpperCase()}</option>)}</select></div></div><input type="url" value={link.url} onChange={e => handleUpdateSocial(link.id, {url: e.target.value})} className={`${inputClass} !text-[10px] font-mono`} /><div className="flex justify-between items-center"><div className="flex gap-1">{Object.keys(colors).map(c => <button key={c} onClick={() => handleUpdateSocial(link.id, {color: c})} className={`h-6 w-6 rounded-lg ${colors[c]} ${link.color === c ? 'ring-2 ring-white scale-110' : 'opacity-40'}`} />)}</div><button onClick={() => setEditingSocialId(null)} className="px-6 py-2 bg-emerald-500 text-neutral-950 font-black rounded-xl uppercase text-[9px] tracking-widest">OK</button></div></div> :
                         <div className="flex items-center justify-between"><div className="flex items-center gap-6"><div className={`h-14 w-14 rounded-[1.5rem] ${colors[link.color]} bg-opacity-10 border border-white/5 flex items-center justify-center shadow-inner`}><SocialIcon size={28} className="text-white" /></div><div className="min-w-0"><h3 className="text-white font-black uppercase tracking-tight">{link.name}</h3><div className="text-[8px] text-neutral-600 font-bold uppercase tracking-widest truncate max-w-[200px]">{link.url}</div></div></div><div className="flex gap-2"><button onClick={() => handleUpdateSocial(link.id, {enabled: !link.enabled})} className="p-3 text-neutral-500 hover:text-white transition-all">{link.enabled ? <ToggleRight size={24} className="text-emerald-500" /> : <ToggleLeft size={24} />}</button><button onClick={() => setEditingSocialId(link.id)} className="p-3 text-neutral-500 hover:text-white transition-all"><Pencil size={20} /></button><button onClick={() => handleDeleteSocial(link.id)} className="p-3 text-neutral-500 hover:text-red-500 transition-all"><Trash2 size={20} /></button></div></div>}
                       </div>
                     );
                  })}
                  {showNewSocialForm ? <div className="p-10 rounded-[3rem] bg-neutral-950 border border-emerald-500/10 space-y-6 animate-in slide-in-from-bottom-4 shadow-2xl"><div className="flex gap-4"><div><label className={labelClass}>Designation</label><input type="text" value={newSocial.name || ''} onChange={e => setNewSocial({...newSocial, name: e.target.value})} className={inputClass} /></div><div><label className={labelClass}>Icon</label><select value={newSocial.icon} onChange={e => setNewSocial({...newSocial, icon: e.target.value})} className={inputClass}><option value="globe">Globe</option><option value="discord">Discord</option><option value="youtube">YouTube</option></select></div></div><input type="url" value={newSocial.url || ''} onChange={e => setNewSocial({...newSocial, url: e.target.value})} placeholder="https://..." className={`${inputClass} !text-[10px] font-mono`} /><div className="flex justify-between items-center"><div className="flex gap-1">{['indigo','red','pink','blue','emerald','orange'].map(c => <button key={c} onClick={() => setNewSocial({...newSocial, color: c})} className={`h-8 w-8 rounded-xl bg-${c}-500 ${newSocial.color === c ? 'ring-2 ring-white scale-110' : 'opacity-40'}`} />)}</div><div className="flex gap-3"><button onClick={() => setShowNewSocialForm(false)} className="text-[10px] font-black text-neutral-700 uppercase">VOID</button><button onClick={handleAddSocial} disabled={!newSocial.name || !newSocial.url} className="px-8 py-3 bg-emerald-500 text-neutral-950 font-black rounded-2xl uppercase text-[9px] tracking-widest shadow-xl">ESTABLISH</button></div></div></div> : 
                  <button onClick={() => setShowNewSocialForm(true)} className="w-full py-12 border-2 border-dashed border-neutral-800 rounded-[3rem] text-neutral-700 hover:text-emerald-500 hover:border-emerald-500/20 transition-all flex flex-col items-center justify-center gap-3 group"><Plus size={32} className="group-hover:scale-125 transition-transform" /><span className="text-[9px] font-black uppercase tracking-[0.3em]">Integrate New Channel</span></button>}
                </div>
                <div className="lg:col-span-4 p-8 rounded-[2.5rem] bg-neutral-900/50 border border-neutral-800/50 shadow-2xl h-fit"><h3 className="text-white font-black text-xs uppercase tracking-widest mb-6">Channel Protocols</h3><div className="space-y-6">{[{ l: 'Global visibility', d: 'Links automatically populate all touchpoints.' }, { l: 'Status override', d: 'Deactivate feeds without erasing configurations.' }].map((t,i) => <div key={i} className="flex gap-4"><div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0"><CheckCircle size={16} /></div><div><div className="text-white text-[10px] font-black uppercase mb-1">{t.l}</div><p className="text-neutral-500 text-[9px] leading-relaxed font-bold uppercase tracking-widest">{t.d}</p></div></div>)}</div></div>
              </div>
            </div>
          )}

          {/* CLOUD SYNC */}
          {activeTab === 'database' && (
            <div className="animate-fade-in space-y-10">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-black text-white">Cloud Sync</h1>
                <button 
                  onClick={handleSaveSupabase} 
                  className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest ${supabaseSaved ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-500 text-neutral-950'}`}
                >
                  {supabaseSaved ? 'CONFIG SAVED' : 'SAVE CONFIG'}
                </button>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                <div className="xl:col-span-8 space-y-10">
                   <div className="p-10 rounded-[3rem] bg-neutral-900/50 border border-white/10 shadow-2xl space-y-8">
                     <div className="flex items-center gap-4 mb-4">
                       <div className="h-14 w-14 rounded-[2rem] bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-inner">
                         <Database size={32} />
                       </div>
                       <div>
                         <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Global Persistence</h3>
                         <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">Connect a shared database</p>
                       </div>
                     </div>

                     <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6">
                        <div className="flex items-start gap-4">
                          <AlertCircle size={20} className="text-amber-500 shrink-0 mt-0.5" />
                          <div className="space-y-2">
                            <h4 className="text-white text-xs font-black uppercase tracking-widest">Why do I need this?</h4>
                            <p className="text-neutral-400 text-[10px] leading-relaxed">By default, this website stores data in your browser's local storage. This means an application submitted on one computer won't be seen on another. To fix the "separate website for each user" issue, connect a Supabase database to sync all data globally across all devices.</p>
                          </div>
                        </div>
                     </div>

                     <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-neutral-950 rounded-2xl border border-neutral-800">
                          <span className="text-[10px] font-black text-neutral-600 uppercase">Cloud Synchronization</span>
                          <button 
                            onClick={() => setSupabaseConfig({...supabaseConfig, isEnabled: !supabaseConfig.isEnabled})} 
                            className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${supabaseConfig.isEnabled ? 'bg-emerald-500 text-neutral-950' : 'bg-neutral-800 text-neutral-500'}`}
                          >
                            {supabaseConfig.isEnabled ? 'ENABLED' : 'DISABLED'}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 gap-5">
                           <div>
                             <label className={labelClass}>Supabase Project URL</label>
                             <input 
                               type="text" 
                               value={supabaseConfig.url} 
                               onChange={e => setSupabaseConfig({...supabaseConfig, url: e.target.value})} 
                               className={`${inputClass} !py-4 !text-xs font-mono`} 
                               placeholder="https://xxxxxx.supabase.co"
                             />
                           </div>
                           <div>
                             <label className={labelClass}>Supabase Anon Key</label>
                             <input 
                               type="password" 
                               value={supabaseConfig.key} 
                               onChange={e => setSupabaseConfig({...supabaseConfig, key: e.target.value})} 
                               className={`${inputClass} !py-4 !text-xs font-mono`} 
                               placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                             />
                           </div>
                        </div>
                     </div>
                   </div>

                   {supabaseConfig.isEnabled && (
                     <div className="p-10 rounded-[3rem] bg-emerald-500/5 border border-emerald-500/20 shadow-2xl space-y-8">
                        <div className="flex items-center gap-4">
                          <Cloud size={24} className="text-emerald-500" />
                          <h3 className="text-xl font-black text-white uppercase tracking-tighter">Manual Sync Controls</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <button 
                             onClick={handlePushToCloud}
                             disabled={syncLoading}
                             className="flex flex-col items-center justify-center gap-4 p-8 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all group disabled:opacity-50"
                           >
                             <RefreshCw size={24} className={`text-emerald-500 ${syncLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                             <div className="text-center">
                               <div className="text-white text-[10px] font-black uppercase tracking-widest mb-1">Push to Cloud</div>
                               <div className="text-[8px] text-neutral-500 font-bold uppercase tracking-widest">Update cloud with local data</div>
                             </div>
                           </button>

                           <button 
                             onClick={handlePullFromCloud}
                             disabled={syncLoading}
                             className="flex flex-col items-center justify-center gap-4 p-8 rounded-[2rem] bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all group disabled:opacity-50"
                           >
                             <Cloud size={24} className={`text-blue-500 ${syncLoading ? 'animate-pulse' : ''}`} />
                             <div className="text-center">
                               <div className="text-white text-[10px] font-black uppercase tracking-widest mb-1">Pull from Cloud</div>
                               <div className="text-[8px] text-neutral-500 font-bold uppercase tracking-widest">Override local with cloud data</div>
                             </div>
                           </button>
                        </div>
                     </div>
                   )}
                </div>

                <div className="xl:col-span-4 p-8 rounded-[2.5rem] bg-neutral-900/50 border border-neutral-800/50 shadow-2xl h-fit">
                   <h3 className="text-white font-black text-xs uppercase tracking-widest mb-6">Sync Guide</h3>
                   <div className="space-y-6">
                      {[
                        { l: '1. Create Project', d: 'Go to supabase.com and create a free project.' },
                        { l: '2. Setup Table', d: 'Create a table named "site_sync" with columns "id" (text, primary) and "data" (jsonb).' },
                        { l: '3. Disable RLS', d: 'For this prototype, disable Row Level Security on "site_sync" or add a public access policy.' },
                        { l: '4. Connect', d: 'Copy your Project URL and Anon Key into the fields on the left and Enable Sync.' },
                        { l: '5. Initial Push', d: 'Click "Push to Cloud" to upload your current settings and users to the shared database.' }
                      ].map((t,i) => (
                        <div key={i} className="flex gap-4">
                          <div className="h-6 w-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-[10px] font-black shrink-0">{i+1}</div>
                          <div>
                            <div className="text-white text-[10px] font-black uppercase mb-1">{t.l}</div>
                            <p className="text-neutral-500 text-[8px] leading-relaxed font-bold uppercase tracking-widest">{t.d}</p>
                          </div>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            </div>
          )}

          {/* SETTINGS */}
          {activeTab === 'settings' && (
            <div className="animate-fade-in space-y-10">
              <div className="flex items-center justify-between"><h1 className="text-3xl font-black text-white">System</h1><button onClick={handleSaveSiteSettings} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest ${settingsSaved ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-500 text-neutral-950'}`}>{settingsSaved ? 'PERSISTED' : 'SAVE PROTOCOLS'}</button></div>
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                <div className="xl:col-span-8 space-y-10">
                   <div className="p-10 rounded-[3rem] bg-neutral-900/50 border border-white/10 shadow-2xl space-y-8"><div className="flex items-center gap-4 mb-4"><div className="h-14 w-14 rounded-[2rem] bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-inner"><Shield size={32} /></div><div><h3 className="text-2xl font-black text-white uppercase tracking-tighter">Access Controls</h3><p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">Security Gateways</p></div></div>
                   <div className="grid grid-cols-2 gap-4">{[{ l: 'Registrations', a: siteSettings.registrationEnabled, f: () => setSiteSettings({...siteSettings, registrationEnabled: !siteSettings.registrationEnabled}) }, { l: 'Authentication', a: siteSettings.loginEnabled, f: () => setSiteSettings({...siteSettings, loginEnabled: !siteSettings.loginEnabled}) }].map(c => <div key={c.l} className={`p-6 rounded-[2rem] border transition-all ${c.a ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}><div className="flex items-center justify-between mb-4"><span className="text-white text-xs font-black uppercase tracking-widest">{c.l}</span><button onClick={c.f} className={`px-4 py-1.5 rounded-lg text-[8px] font-black transition-all ${c.a ? 'bg-emerald-500 text-neutral-950' : 'bg-red-500 text-white'}`}>{c.a ? 'ACTIVE' : 'VOID'}</button></div><p className="text-neutral-600 text-[8px] font-bold uppercase leading-relaxed tracking-widest">Global gate for {c.l.toLowerCase()}.</p></div>)}</div>
                   {(!siteSettings.loginEnabled || !siteSettings.registrationEnabled) && <div className="space-y-2"><label className={labelClass}>Transmission Alert</label><textarea value={siteSettings.maintenanceMessage || ''} onChange={e => setSiteSettings({...siteSettings, maintenanceMessage: e.target.value})} className={`${inputClass} !py-4 text-xs resize-none`} rows={2} /></div>}
                   <div className="pt-8 border-t border-neutral-800/50 flex items-center gap-6"><div><label className={labelClass}>Identity Quota</label><input type="number" value={siteSettings.maxApplicationsPerUser || 3} onChange={e => setSiteSettings({...siteSettings, maxApplicationsPerUser: parseInt(e.target.value)||1})} className={`${inputClass} !w-24 !py-4 font-black text-center text-xl`} /></div><p className="text-[8px] text-neutral-700 font-bold uppercase tracking-widest leading-relaxed">Max submissions per identity to prevent database congestion.</p></div></div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      {/* Discord Integration Card */}
                      <div className="p-8 rounded-[3rem] bg-neutral-900/50 border border-indigo-500/20 space-y-8 overflow-hidden relative group">
                        <div className="absolute -right-8 -top-8 h-32 w-32 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-all duration-700" />
                        
                        <div className="flex items-center justify-between relative">
                          <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-inner">
                              <MessageSquare size={28} />
                            </div>
                            <div>
                              <h3 className="text-xl font-black text-white uppercase tracking-tight">Discord Auth</h3>
                              <p className="text-[8px] font-bold text-neutral-600 uppercase tracking-widest">Provider Configuration</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setShowDiscordDetails(!showDiscordDetails)} 
                              className="p-2 text-neutral-500 hover:text-white transition-all"
                              title={showDiscordDetails ? "Hide Secret Info" : "Show Secret Info"}
                            >
                              {showDiscordDetails ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                            <button 
                              onClick={() => setDiscordConfig({...discordConfig, isEnabled: !discordConfig.isEnabled})} 
                              className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${discordConfig.isEnabled ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-neutral-800 text-neutral-500'}`}
                            >
                              {discordConfig.isEnabled ? 'ENABLED' : 'DISABLED'}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-5 relative">
                          <div className="grid grid-cols-1 gap-5">
                            <div>
                              <label className={labelClass}>Client ID</label>
                              <div className="relative">
                                <input 
                                  type={showDiscordDetails ? "text" : "password"} 
                                  value={discordConfig.clientId} 
                                  onChange={e => setDiscordConfig({...discordConfig, clientId: e.target.value})} 
                                  className={`${inputClass} !py-4 !text-xs ${!showDiscordDetails ? 'blur-[4px]' : ''}`} 
                                  placeholder="Discord Client ID"
                                />
                                <Lock size={12} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-700" />
                              </div>
                            </div>
                            
                            <div>
                              <label className={labelClass}>Client Secret</label>
                              <div className="relative">
                                <input 
                                  type={showDiscordDetails ? "text" : "password"} 
                                  value={discordConfig.clientSecret} 
                                  onChange={e => setDiscordConfig({...discordConfig, clientSecret: e.target.value})} 
                                  className={`${inputClass} !py-4 !text-xs ${!showDiscordDetails ? 'blur-[4px]' : ''}`} 
                                  placeholder="Discord Client Secret"
                                />
                                <Lock size={12} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-700" />
                              </div>
                            </div>

                            <div>
                              <label className={labelClass}>Redirect URI</label>
                              <div className="relative">
                                <input 
                                  type="text" 
                                  value={discordConfig.redirectUri} 
                                  onChange={e => setDiscordConfig({...discordConfig, redirectUri: e.target.value})} 
                                  className={`${inputClass} !py-4 !text-xs font-mono`} 
                                  placeholder="https://your-domain.com/auth"
                                />
                                <Globe size={12} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-700" />
                              </div>
                            </div>
                          </div>

                          <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Recommended Redirect</span>
                              <button 
                                onClick={() => { 
                                  navigator.clipboard.writeText(window.location.origin);
                                  const btn = document.getElementById('copy-redirect-discord');
                                  if (btn) {
                                    const oldText = btn.innerHTML;
                                    btn.innerHTML = 'COPIED!';
                                    btn.classList.add('text-emerald-400');
                                    setTimeout(() => { 
                                      btn.innerHTML = oldText; 
                                      btn.classList.remove('text-emerald-400');
                                    }, 2000);
                                  }
                                }}
                                id="copy-redirect-discord"
                                className="text-[7px] font-black text-indigo-500 hover:text-indigo-400 uppercase flex items-center gap-1 transition-all"
                              >
                                <Link2 size={10} /> COPY
                              </button>
                            </div>
                            <div className="text-[10px] font-mono text-neutral-500 truncate select-all">{window.location.origin}</div>
                          </div>

                          <button 
                            onClick={handleSaveDiscord} 
                            className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${discordSaved ? 'bg-emerald-500 text-neutral-950' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500 hover:text-white hover:shadow-xl hover:shadow-indigo-500/20'}`}
                          >
                            {discordSaved ? 'PROTOCOLS PERSISTED' : 'SAVE DISCORD CONFIG'}
                          </button>
                        </div>
                      </div>

                      {/* Google Integration Card */}
                      <div className="p-8 rounded-[3rem] bg-neutral-900/50 border border-blue-500/20 space-y-8 overflow-hidden relative group">
                        <div className="absolute -right-8 -top-8 h-32 w-32 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-all duration-700" />

                        <div className="flex items-center justify-between relative">
                          <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-inner">
                              <Globe size={28} />
                            </div>
                            <div>
                              <h3 className="text-xl font-black text-white uppercase tracking-tight">Google Auth</h3>
                              <p className="text-[8px] font-bold text-neutral-600 uppercase tracking-widest">Provider Configuration</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setShowGoogleDetails(!showGoogleDetails)} 
                              className="p-2 text-neutral-500 hover:text-white transition-all"
                            >
                              {showGoogleDetails ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                            <button 
                              onClick={() => setGoogleConfig({...googleConfig, isEnabled: !googleConfig.isEnabled})} 
                              className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${googleConfig.isEnabled ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-neutral-800 text-neutral-500'}`}
                            >
                              {googleConfig.isEnabled ? 'ENABLED' : 'DISABLED'}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-5 relative">
                          <div className="grid grid-cols-1 gap-5">
                            <div>
                              <label className={labelClass}>Client ID</label>
                              <div className="relative">
                                <input 
                                  type={showGoogleDetails ? "text" : "password"} 
                                  value={googleConfig.clientId} 
                                  onChange={e => setGoogleConfig({...googleConfig, clientId: e.target.value})} 
                                  className={`${inputClass} !py-4 !text-xs ${!showGoogleDetails ? 'blur-[4px]' : ''}`} 
                                  placeholder="Google Client ID"
                                />
                                <Lock size={12} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-700" />
                              </div>
                            </div>

                            <div>
                              <label className={labelClass}>Client Secret</label>
                              <div className="relative">
                                <input 
                                  type={showGoogleDetails ? "text" : "password"} 
                                  value={googleConfig.clientSecret} 
                                  onChange={e => setGoogleConfig({...googleConfig, clientSecret: e.target.value})} 
                                  className={`${inputClass} !py-4 !text-xs ${!showGoogleDetails ? 'blur-[4px]' : ''}`} 
                                  placeholder="Google Client Secret"
                                />
                                <Lock size={12} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-700" />
                              </div>
                            </div>

                            <div>
                              <label className={labelClass}>Redirect URI</label>
                              <div className="relative">
                                <input 
                                  type="text" 
                                  value={googleConfig.redirectUri} 
                                  onChange={e => setGoogleConfig({...googleConfig, redirectUri: e.target.value})} 
                                  className={`${inputClass} !py-4 !text-xs font-mono`} 
                                  placeholder="https://your-domain.com/auth"
                                />
                                <Globe size={12} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-700" />
                              </div>
                            </div>
                          </div>

                          <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Recommended Redirect</span>
                              <button 
                                onClick={() => { 
                                  navigator.clipboard.writeText(window.location.origin);
                                  const btn = document.getElementById('copy-redirect-google');
                                  if (btn) {
                                    const oldText = btn.innerHTML;
                                    btn.innerHTML = 'COPIED!';
                                    btn.classList.add('text-emerald-400');
                                    setTimeout(() => { 
                                      btn.innerHTML = oldText; 
                                      btn.classList.remove('text-emerald-400');
                                    }, 2000);
                                  }
                                }}
                                id="copy-redirect-google"
                                className="text-[7px] font-black text-blue-500 hover:text-blue-400 uppercase flex items-center gap-1 transition-all"
                              >
                                <Link2 size={10} /> COPY
                              </button>
                            </div>
                            <div className="text-[10px] font-mono text-neutral-500 truncate select-all">{window.location.origin}</div>
                          </div>

                          <button 
                            onClick={handleSaveGoogle} 
                            className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${googleSaved ? 'bg-emerald-500 text-neutral-950' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500 hover:text-white hover:shadow-xl hover:shadow-blue-500/20'}`}
                          >
                            {googleSaved ? 'PROTOCOLS PERSISTED' : 'SAVE GOOGLE CONFIG'}
                          </button>
                        </div>
                      </div>
                   </div>
                </div>
                <div className="xl:col-span-4 space-y-8">
                   <div className="p-8 rounded-[2.5rem] bg-neutral-900/50 border border-amber-500/10 shadow-2xl space-y-6 text-center">
                      <div className="h-16 w-16 rounded-[2rem] bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mx-auto mb-6"><Crown size={32} /></div>
                      <h3 className="text-xl font-black text-white uppercase tracking-tighter">Root Authority</h3>
                      <button onClick={() => setShowOwnerDetails(!showOwnerDetails)} className="px-4 py-1.5 rounded-lg bg-neutral-800 text-neutral-500 hover:text-white transition-all text-[9px] font-black uppercase tracking-widest">{showOwnerDetails ? 'MASK VAULT' : 'OPEN VAULT'}</button>
                      <div className="space-y-2 pt-4"><div className={`text-white text-xs font-mono tracking-tight ${!showOwnerDetails ? 'blur-[6px]' : ''}`}>owner@dismine.com</div><div className={`text-white text-xs font-mono tracking-tight ${!showOwnerDetails ? 'blur-[6px]' : ''}`}>dismine2025</div></div>
                   </div>
                   <div className="p-8 rounded-[2.5rem] bg-red-500/5 border border-red-500/20 shadow-2xl text-center"><div className="h-12 w-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 mx-auto mb-6"><AlertTriangle size={24} /></div><h4 className="text-red-500 font-black text-xs uppercase tracking-widest mb-6">Danger Protocols</h4><button onClick={() => { if (confirm('WIPE DATABASE?')) { localStorage.removeItem('dismine_applications'); refreshData(); } }} className="w-full py-4 bg-red-500 text-white font-black rounded-2xl text-[9px] uppercase tracking-widest active:scale-95 shadow-xl shadow-red-500/10">EXCISE ALL DATA</button></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
