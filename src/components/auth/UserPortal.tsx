import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  LogOut,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  MessageSquare,
  Calendar,
  Globe,
  User,
  ChevronRight,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Shield,
  Crown,
  UserCog,
  Users,
  Hammer,
  Mail,
  Hash,
} from 'lucide-react';
import {
  getSession,
  clearSession,
  getUserApplications,
  getRoleLabel,
  getRoleColor,
  canAccessAdmin,
  getChatByAppId,
  saveChatMessage,
  type ApplicationEntry,
  type ApplicationStatus,
  type UserAccount,
  type UserRole,
  type ApplicationChat,
} from '../../lib/store';

interface Props {
  onBack: () => void;
  onLogout: () => void;
  onApply: () => void;
}

const statusConfig: Record<
  ApplicationStatus,
  {
    label: string;
    color: string;
    bg: string;
    border: string;
    icon: typeof Clock;
    description: string;
    accent: string;
  }
> = {
  pending: {
    label: 'Pending Review',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    icon: Clock,
    description: 'Your application is in the queue. We typically review within 48 hours.',
    accent: 'from-amber-500 to-orange-500',
  },
  under_review: {
    label: 'Under Review',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    icon: Eye,
    description: 'A staff member is currently reviewing your application.',
    accent: 'from-blue-500 to-cyan-500',
  },
  approved: {
    label: 'Approved',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    icon: CheckCircle,
    description: 'Congratulations! Your application has been approved. Welcome to Dismine SMP!',
    accent: 'from-emerald-500 to-green-500',
  },
  rejected: {
    label: 'Not Accepted',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    icon: XCircle,
    description: 'Unfortunately, your application was not accepted this time. You may re-apply next season.',
    accent: 'from-red-500 to-pink-500',
  },
};

function getRoleIcon(role: UserRole) {
  switch (role) {
    case 'owner': return <Crown size={10} className="text-amber-400" />;
    case 'admin': return <Shield size={10} className="text-red-400" />;
    case 'manager': return <UserCog size={10} className="text-purple-400" />;
    case 'staff': return <Users size={10} className="text-blue-400" />;
    case 'builder': return <Hammer size={10} className="text-emerald-400" />;
    default: return <User size={10} className="text-neutral-400" />;
  }
}

function getRoleBadgeIcon(role: UserRole) {
  switch (role) {
    case 'owner': return <Crown size={9} />;
    case 'admin': return <Shield size={9} />;
    case 'manager': return <UserCog size={9} />;
    case 'staff': return <Users size={9} />;
    case 'builder': return <Hammer size={9} />;
    default: return <User size={9} />;
  }
}

export function UserPortal({ onBack, onLogout, onApply }: Props) {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [applications, setApplications] = useState<ApplicationEntry[]>([]);
  const [selectedApp, setSelectedApp] = useState<ApplicationEntry | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentChat, setCurrentChat] = useState<ApplicationChat | null>(null);
  const [chatMessage, setChatMessage] = useState('');

  useEffect(() => {
    if (selectedApp) {
      setCurrentChat(getChatByAppId(selectedApp.id));
    }
  }, [selectedApp]);

  useEffect(() => {
    const session = getSession();
    setUser(session);
    if (session) {
      setApplications(getUserApplications(session.id));
    }
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      if (user) {
        const freshUser = getSession();
        if (freshUser) setUser(freshUser);
        setApplications(getUserApplications(user.id));
        if (selectedApp) {
          const updated = getUserApplications(user.id).find((a) => a.id === selectedApp.id);
          if (updated) setSelectedApp(updated);
        }
      }
      setRefreshing(false);
    }, 500);
  };

  const handleLogout = () => {
    clearSession();
    onLogout();
  };

  const handleSendChatMessage = () => {
    if (!selectedApp || !user || !chatMessage.trim()) return;
    const updatedChat = saveChatMessage(selectedApp.id, {
      senderId: user.id,
      senderName: user.displayName,
      senderRole: user.role,
      text: chatMessage.trim()
    }, user);
    setCurrentChat(updatedChat);
    setChatMessage('');
  };

  if (!user) return null;

  const latestApp = applications[0];

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Detail view for a specific application
  if (selectedApp) {
    const config = statusConfig[selectedApp.status];
    const StatusIcon = config.icon;

    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-200">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.04)_0%,_transparent_50%)]" />
        </div>

        <div className="relative max-w-3xl mx-auto px-6 py-12">
          <button
            onClick={() => setSelectedApp(null)}
            className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-300 transition-colors mb-8 group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            Back to portal
          </button>

          {/* Status Hero */}
          <div className={`p-8 rounded-2xl ${config.bg} border ${config.border} mb-8`}>
            <div className="flex items-start gap-4">
              <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${config.accent} flex items-center justify-center shrink-0`}>
                <StatusIcon size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-bold text-white">{config.label}</h2>
                </div>
                <p className={`text-sm ${config.color} opacity-80`}>{config.description}</p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2">
              {(['pending', 'under_review', 'approved'] as ApplicationStatus[]).map((step, i) => {
                const stepOrder = { pending: 0, under_review: 1, approved: 2, rejected: -1 };
                const currentOrder = selectedApp.status === 'rejected' ? -1 : stepOrder[selectedApp.status];
                const isActive = selectedApp.status !== 'rejected' && stepOrder[step] <= currentOrder;
                const isRejected = selectedApp.status === 'rejected';

                return (
                  <div key={step} className="flex items-center gap-2 flex-1">
                    <div
                      className={`h-2 flex-1 rounded-full transition-all ${
                        isRejected
                          ? 'bg-red-500/30'
                          : isActive
                          ? `bg-gradient-to-r ${config.accent}`
                          : 'bg-neutral-800'
                      }`}
                    />
                    {i < 2 && <div className="w-0" />}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2 text-[10px] uppercase tracking-wider text-neutral-500">
              <span>Submitted</span>
              <span>Reviewing</span>
              <span>Decision</span>
            </div>
          </div>

          {selectedApp.adminMessage && (
            <div className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800/50 mb-6">
              <h3 className="text-white font-semibold text-sm flex items-center gap-2 mb-3">
                <MessageSquare size={14} className="text-emerald-500" />
                Message from Staff
              </h3>
              <div className="p-4 rounded-xl bg-neutral-800/50 border border-neutral-700/30">
                <p className="text-neutral-300 text-sm leading-relaxed">{selectedApp.adminMessage}</p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800/50">
              <h3 className="text-white font-semibold text-sm mb-4">Application Details</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { icon: User, label: 'Username', value: selectedApp.username },
                  { icon: Calendar, label: 'Submitted', value: new Date(selectedApp.submittedAt).toLocaleDateString() },
                  { icon: Globe, label: 'Timezone', value: selectedApp.timezone?.split(' ')[0] || 'N/A' },
                  {
                    icon: Clock,
                    label: 'Reviewed',
                    value: selectedApp.reviewedAt ? new Date(selectedApp.reviewedAt).toLocaleDateString() : 'Pending',
                  },
                ].map((item) => (
                  <div key={item.label} className="p-3 rounded-xl bg-neutral-800/50">
                    <div className="flex items-center gap-1.5 mb-1">
                      <item.icon size={12} className="text-neutral-500" />
                      <span className="text-neutral-500 text-[10px] uppercase tracking-wider">{item.label}</span>
                    </div>
                    <div className="text-white text-sm font-medium truncate">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Chat with Staff ── */}
            {currentChat && currentChat.initiatedByStaff && (
              <div className="p-6 rounded-2xl bg-neutral-900/50 border border-emerald-500/10 flex flex-col h-[400px]">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-neutral-800">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={18} className="text-emerald-500" />
                    <h3 className="text-white font-semibold text-sm">Staff Conversation</h3>
                  </div>
                  {currentChat.status === 'closed' && (
                    <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 uppercase">
                      Conversation Closed
                    </span>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
                  {currentChat.messages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.senderId === user.id ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold ${msg.senderId === user.id ? 'text-emerald-400' : 'text-blue-400'}`}>
                          {msg.senderId === user.id ? 'You' : msg.senderName} {msg.senderRole !== 'user' && msg.senderId !== user.id && `(Staff)`}
                        </span>
                        <span className="text-[9px] text-neutral-600">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className={`px-4 py-2.5 rounded-2xl max-w-[90%] text-sm ${
                        msg.senderId === user.id 
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
                      placeholder="Type your reply..." 
                      className="w-full px-4 py-2.5 text-sm text-white bg-neutral-950/80 border border-neutral-800 rounded-xl focus:outline-none focus:border-emerald-500/50" 
                    />
                    <button onClick={handleSendChatMessage} className="px-4 bg-emerald-500 text-neutral-950 rounded-xl font-bold hover:bg-emerald-400 transition-all">SEND</button>
                  </div>
                ) : (
                  <p className="text-center text-neutral-500 text-[10px] font-bold uppercase tracking-widest p-2">This conversation has been closed by staff</p>
                )}
              </div>
            )}

            <div className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800/50">
              <h3 className="text-white font-semibold text-sm flex items-center gap-2 mb-4">
                <FileText size={14} className="text-emerald-500" />
                Your Response — Why Join
              </h3>
              <p className="text-neutral-400 text-sm leading-relaxed whitespace-pre-wrap">
                {selectedApp.why}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800/50">
              <h3 className="text-white font-semibold text-sm flex items-center gap-2 mb-4">
                <FileText size={14} className="text-blue-400" />
                Your Response — SMP Experience
              </h3>
              <p className="text-neutral-400 text-sm leading-relaxed whitespace-pre-wrap">
                {selectedApp.experience}
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
              Refresh Status
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main portal view
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.04)_0%,_transparent_50%)]" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="relative max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-300 transition-colors group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            Home
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-neutral-500 hover:text-red-400 transition-colors"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>

        {/* User Profile Card */}
        <div className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800/50 mb-8">
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-xl font-bold text-white uppercase shadow-lg shadow-emerald-500/10">
                {user.displayName.slice(0, 2)}
              </div>
              <div className={`absolute -bottom-1.5 -right-1.5 h-6 w-6 rounded-lg ${getRoleColor(user.role).bg} border-2 border-neutral-900 flex items-center justify-center`}>
                {getRoleIcon(user.role)}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-white">{user.displayName}</h1>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${getRoleColor(user.role).bg} ${getRoleColor(user.role).border} border ${getRoleColor(user.role).text}`}>
                  {getRoleBadgeIcon(user.role)}
                  {getRoleLabel(user.role)}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {user.authMethod === 'discord' ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-[#5865F2] bg-[#5865F2]/10 px-2.5 py-1 rounded-full border border-[#5865F2]/20">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3">
                      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286z" />
                    </svg>
                    {user.discordUsername}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs text-neutral-500 bg-neutral-800/50 px-2.5 py-1 rounded-full">
                    <Mail size={10} />
                    {user.email}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 text-xs text-neutral-600 bg-neutral-800/30 px-2.5 py-1 rounded-full">
                  <Calendar size={10} />
                  Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-neutral-600 bg-neutral-800/30 px-2.5 py-1 rounded-full">
                  <Hash size={10} />
                  {user.id.slice(0, 8)}
                </span>
              </div>

              {canAccessAdmin(user.role) && (
                <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/15">
                  <Shield size={11} />
                  Staff Member — You have access to the Admin Panel
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 pt-5 border-t border-neutral-800/50 grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-white">{applications.length}</div>
              <div className="text-[10px] uppercase tracking-wider text-neutral-500 mt-0.5">Applications</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-emerald-400">{applications.filter(a => a.status === 'approved').length}</div>
              <div className="text-[10px] uppercase tracking-wider text-neutral-500 mt-0.5">Approved</div>
            </div>
            <div className="text-center">
              <div className={`text-lg font-bold ${getRoleColor(user.role).text}`}>{getRoleLabel(user.role)}</div>
              <div className="text-[10px] uppercase tracking-wider text-neutral-500 mt-0.5">Role</div>
            </div>
          </div>
        </div>

        {/* Applications Section */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Your Applications</h2>
            <p className="text-neutral-500 text-sm mt-0.5">
              {applications.length === 0
                ? "You haven't submitted any applications yet."
                : `${applications.length} application${applications.length !== 1 ? 's' : ''} on record`}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 text-xs text-neutral-500 hover:text-neutral-300 border border-neutral-800 rounded-lg hover:bg-neutral-800/50 transition-all disabled:opacity-50"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {applications.length === 0 && (
          <div className="p-12 rounded-2xl bg-neutral-900/50 border border-neutral-800/50 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-6">
              <Sparkles size={24} className="text-emerald-500" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Ready to join Dismine SMP?</h3>
            <p className="text-neutral-500 text-sm max-w-sm mx-auto mb-6">
              Submit your application and we'll review it within 48 hours. You can track the status right here.
            </p>
            <button
              onClick={onApply}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-neutral-950 bg-emerald-500 rounded-xl hover:bg-emerald-400 transition-all hover:shadow-lg hover:shadow-emerald-500/20"
            >
              Submit Application
              <ChevronRight size={14} />
            </button>
          </div>
        )}

        {applications.length > 0 && (
          <div className="space-y-4">
            {applications.map((app) => {
              const config = statusConfig[app.status];
              const StatusIcon = config.icon;

              return (
                <button
                  key={app.id}
                  onClick={() => setSelectedApp(app)}
                  className={`w-full text-left p-6 rounded-2xl bg-neutral-900/50 border ${config.border} hover:bg-neutral-900/80 transition-all group`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`h-12 w-12 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
                        <StatusIcon size={20} className={config.color} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-white font-semibold truncate">
                            {app.username}
                          </h3>
                          {app.formId === 'staff-app' && <span className="text-[8px] font-black bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded uppercase">Staff</span>}
                          {app.formId === 'ban-appeal' && <span className="text-[8px] font-black bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded uppercase">Appeal</span>}
                          {app.formId === 'member-app' && <span className="text-[8px] font-black bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded uppercase">Whitelist</span>}
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${config.bg} ${config.border} border ${config.color} shrink-0`}>
                            {config.label}
                          </span>
                        </div>
                        <p className="text-neutral-500 text-sm mt-1 truncate">
                          {app.formName || 'Application'} · Submitted {formatDate(app.submittedAt)}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      size={16}
                      className="text-neutral-600 group-hover:text-neutral-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-4"
                    />
                  </div>

                  {app.adminMessage && (
                    <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-neutral-800/40">
                      <MessageSquare size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                      <p className="text-neutral-400 text-xs leading-relaxed line-clamp-2">
                        {app.adminMessage}
                      </p>
                    </div>
                  )}
                </button>
              );
            })}

            {latestApp && latestApp.status === 'rejected' && (
              <div className="p-6 rounded-2xl bg-neutral-900/30 border border-dashed border-neutral-800 text-center">
                <AlertCircle size={16} className="text-neutral-600 mx-auto mb-2" />
                <p className="text-neutral-500 text-sm mb-3">
                  You can submit a new application if you'd like to try again.
                </p>
                <button
                  onClick={onApply}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-all"
                >
                  Submit New Application
                </button>
              </div>
            )}
          </div>
        )}

        <div className="mt-12 p-6 rounded-2xl bg-neutral-900/30 border border-neutral-800/50">
          <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
            <AlertCircle size={14} className="text-neutral-500" />
            How does this work?
          </h3>
          <div className="space-y-2 text-xs text-neutral-500 leading-relaxed">
            <p>• After you submit your application, our staff will review it within <span className="text-neutral-300">48 hours</span>.</p>
            <p>• Your status will update from <span className="text-amber-400">Pending</span> → <span className="text-blue-400">Under Review</span> → <span className="text-emerald-400">Approved</span> or <span className="text-red-400">Not Accepted</span>.</p>
            <p>• If approved, you'll receive a message from staff with instructions to join.</p>
            <p>• You can check back here anytime to see your latest status.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
