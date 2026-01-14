import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../stores/gameStore';
import { Radio, Send, FileText, Edit2, X, Users } from 'lucide-react';
import api from '../lib/api';
import logger from '../lib/logger';

interface HoloNetPlot {
  id: number;
  title: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: number;
    username: string;
    factionName: string;
  };
  messageCount: number;
}

interface HoloNetMessage {
  id: number;
  title?: string;
  message: string;
  createdAt: string;
  updatedAt?: string;
  player: {
    id: number;
    username: string;
    factionName: string;
  };
  plot?: {
    id: number;
    title: string;
    description?: string;
  } | null;
}

interface PlotMember {
  id: number;
  username: string;
  factionName: string;
  addedAt: string;
}

interface PlayerSearchResult {
  id: number;
  username: string;
  factionName: string;
}

export default function HoloNet() {
  const socket = useGameStore((state) => state.socket);
  const user = useGameStore((state) => state.user);
  const [messages, setMessages] = useState<HoloNetMessage[]>([]);
  const [title, setTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [plots, setPlots] = useState<HoloNetPlot[]>([]);
  const [selectedPlotId, setSelectedPlotId] = useState<number | null>(null);
  const [showCreatePlot, setShowCreatePlot] = useState(false);
  const [newPlotTitle, setNewPlotTitle] = useState('');
  const [newPlotDescription, setNewPlotDescription] = useState('');

  // Member management state
  const [selectedMembers, setSelectedMembers] = useState<PlotMember[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [searchResults, setSearchResults] = useState<PlayerSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Plot management modal state
  const [showPlotManager, setShowPlotManager] = useState(false);
  const [managingPlotId, setManagingPlotId] = useState<number | null>(null);
  const [plotMembers, setPlotMembers] = useState<PlotMember[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    loadPlots();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: HoloNetMessage) => {
      logger.socket('New HoloNet message received:', message);
      setMessages((prev) => {
        // Check if message already exists to prevent duplicates
        if (prev.some(msg => msg.id === message.id)) {
          return prev; // Skip duplicate
        }
        return [...prev, message];
      });
      setTimeout(scrollToBottom, 100);
    };

    const handleUpdatedMessage = (updatedMsg: HoloNetMessage) => {
      logger.socket('HoloNet message updated:', updatedMsg);
      setMessages((prev) =>
        prev.map((msg) => (msg.id === updatedMsg.id ? updatedMsg : msg))
      );
    };

    socket.on('holonet:message', handleNewMessage);
    socket.on('holonet:updated', handleUpdatedMessage);

    return () => {
      socket.off('holonet:message', handleNewMessage);
      socket.off('holonet:updated', handleUpdatedMessage);
    };
  }, [socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      const response = await api.get('/holonet/messages');

      // Type check: ensure response.data is an array
      if (Array.isArray(response.data)) {
        setMessages(response.data);
      } else {
        console.error('Expected array but got:', typeof response.data, response.data);
        setMessages([]); // Fallback to empty array
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessages([]); // Ensure messages is always an array
      setLoading(false);
    }
  };

  const loadPlots = async () => {
    try {
      const response = await api.get('/holonet/plots');
      setPlots(response.data);
    } catch (error) {
      console.error('Failed to load plots:', error);
      setPlots([]);
    }
  };

  const createPlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlotTitle.trim()) return;

    try {
      const initialMembers = selectedMembers.map(member => member.username);
      const response = await api.post('/holonet/plots', {
        title: newPlotTitle.trim(),
        description: newPlotDescription.trim() || undefined,
        initialMembers: initialMembers.length > 0 ? initialMembers : undefined,
      });

      setPlots((prev) => [response.data, ...prev]);
      setNewPlotTitle('');
      setNewPlotDescription('');
      setSelectedMembers([]);
      setMemberSearch('');
      setSearchResults([]);
      setShowCreatePlot(false);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Fehler beim Erstellen des Plots');
    }
  };

  // Member management functions
  const searchPlayers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await api.get(`/player/search?q=${encodeURIComponent(query)}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Player search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleMemberSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMemberSearch(value);

    // Debounce search
    const timeoutId = setTimeout(() => {
      searchPlayers(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const addMember = (player: PlayerSearchResult) => {
    // Check if player is already selected
    if (selectedMembers.some(member => member.id === player.id)) {
      return;
    }

    const newMember: PlotMember = {
      id: player.id,
      username: player.username,
      factionName: player.factionName,
      addedAt: new Date().toISOString(),
    };

    setSelectedMembers(prev => [...prev, newMember]);
    setMemberSearch('');
    setSearchResults([]);
  };

  const removeMember = (memberId: number) => {
    setSelectedMembers(prev => prev.filter(member => member.id !== memberId));
  };

  // Plot management functions
  const loadPlotMembers = async (plotId: number) => {
    try {
      const response = await api.get(`/holonet/plots/${plotId}/members`);
      setPlotMembers(response.data);
    } catch (error: any) {
      console.error('Failed to load plot members:', error);
      alert(error.response?.data?.error || 'Fehler beim Laden der Plot-Mitglieder');
    }
  };

  const addPlotMember = async (username: string) => {
    if (!managingPlotId) return;

    try {
      await api.post(`/holonet/plots/${managingPlotId}/members`, { username });
      // Reload members after successful add
      await loadPlotMembers(managingPlotId);
      setMemberSearch('');
      setSearchResults([]);
    } catch (error: any) {
      console.error('Failed to add plot member:', error);
      alert(error.response?.data?.error || 'Fehler beim Hinzufügen des Mitglieds');
    }
  };

  const removePlotMember = async (memberId: number) => {
    if (!managingPlotId) return;

    if (!confirm('Mitglied wirklich aus dem Plot entfernen?')) {
      return;
    }

    try {
      await api.delete(`/holonet/plots/${managingPlotId}/members/${memberId}`);
      // Reload members after successful removal
      await loadPlotMembers(managingPlotId);
    } catch (error: any) {
      console.error('Failed to remove plot member:', error);
      alert(error.response?.data?.error || 'Fehler beim Entfernen des Mitglieds');
    }
  };

  const openPlotManager = async (plotId: number) => {
    setManagingPlotId(plotId);
    setShowPlotManager(true);
    setMemberSearch('');
    setSearchResults([]);
    await loadPlotMembers(plotId);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await api.post('/holonet/messages', {
        title: title.trim() || undefined,
        message: newMessage,
        plotId: selectedPlotId
      });
      setTitle('');
      setNewMessage('');
      setSelectedPlotId(null);
      setTimeout(scrollToBottom, 100);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Fehler beim Senden der Nachricht');
    } finally {
      setSending(false);
    }
  };

  const startEdit = (msg: HoloNetMessage) => {
    setEditingId(msg.id);
    setEditTitle(msg.title || '');
    setEditMessage(msg.message);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditMessage('');
  };

  const saveEdit = async (id: number) => {
    if (!editMessage.trim()) return;

    setSending(true);
    try {
      await api.put(`/holonet/messages/${id}`, {
        title: editTitle.trim() || undefined,
        message: editMessage,
      });
      setEditingId(null);
      setEditTitle('');
      setEditMessage('');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Fehler beim Bearbeiten');
    } finally {
      setSending(false);
    }
  };

  const canEdit = (msg: HoloNetMessage) => {
    if (msg.player.id !== user?.player?.id) return false;
    const now = new Date();
    const created = new Date(msg.createdAt);
    const diffMinutes = (now.getTime() - created.getTime()) / 1000 / 60;
    return diffMinutes <= 30;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Gerade eben';
    if (diffMins < 60) return `vor ${diffMins} Min`;
    if (diffHours < 24) return `vor ${diffHours} Std`;
    if (diffDays < 7) return `vor ${diffDays} Tagen`;
    
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFactionColor = (factionName: string) => {
    if (factionName.includes('Imperium') || factionName.includes('Empire')) {
      return 'text-red-400';
    }
    return 'text-blue-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Lade HoloNet...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-gradient-to-r from-cyan-950/40 to-slate-900/60 border border-cyan-500/30 rounded-lg backdrop-blur-sm mb-8">
        {/* Imperial Command Header */}
        <div className="border-b border-cyan-500/20 p-6">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-cyan-900/40 border border-cyan-500/40 rounded">
              <Radio size={24} className="text-cyan-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-cyan-100 font-mono tracking-wider">HOLONET</h1>
              <p className="text-sm text-cyan-400/70 font-mono">GALAKTISCHES KOMMUNIKATIONSNETZWERK - ROLLENSPIEL & STORY</p>
            </div>
          </div>
        </div>

        {/* Imperial Command New Post Form */}
        <form onSubmit={sendMessage} className="p-6 border-b border-cyan-500/20 bg-slate-950/20">
          <div className="mb-4 pb-3 border-b border-cyan-500/20">
            <h2 className="text-lg font-semibold text-cyan-100 flex items-center gap-2 font-mono tracking-wider">
              <FileText size={18} />
              NEUER BEITRAG
            </h2>
          </div>
          <div className="space-y-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titel (optional)"
              maxLength={100}
              className="w-full bg-slate-800/60 border border-cyan-500/30 rounded px-4 py-3 text-cyan-100 focus:outline-none focus:border-cyan-400 font-mono backdrop-blur-sm"
              disabled={sending}
            />

            {/* Plot Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-cyan-400 text-xs font-mono tracking-wider uppercase font-medium">
                  RPG PLOT (OPTIONAL)
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreatePlot(true)}
                    className="text-xs text-cyan-400/70 hover:text-cyan-300 font-mono tracking-wider flex items-center gap-1 transition-colors"
                    disabled={sending}
                  >
                    <span className="text-cyan-400">+</span> NEUEN PLOT ERSTELLEN
                  </button>

                </div>
              </div>

              <select
                value={selectedPlotId || ''}
                onChange={(e) => setSelectedPlotId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full bg-slate-800/60 border border-cyan-500/30 rounded px-4 py-3 text-cyan-100 focus:outline-none focus:border-cyan-400 font-mono backdrop-blur-sm appearance-none"
                disabled={sending}
              >
                <option value="">KEIN PLOT AUSGEWÄHLT</option>
                {plots.map(plot => (
                  <option key={plot.id} value={plot.id}>
                    {plot.title.toUpperCase()} ({plot.messageCount} BEITRÄGE)
                  </option>
                ))}
              </select>

              {selectedPlotId && (
                <div className="bg-slate-900/40 border border-cyan-500/20 rounded px-3 py-2">
                  {plots.find(p => p.id === selectedPlotId) && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-cyan-300 font-mono text-xs tracking-wider font-medium">
                          {plots.find(p => p.id === selectedPlotId)!.title.toUpperCase()}
                        </span>
                        <span className="text-cyan-500/60 font-mono text-xs">
                          {plots.find(p => p.id === selectedPlotId)!.messageCount} BEITRÄGE
                        </span>
                      </div>
                      {plots.find(p => p.id === selectedPlotId)!.description && (
                        <p className="text-cyan-400/70 font-mono text-xs leading-relaxed">
                          {plots.find(p => p.id === selectedPlotId)!.description}
                        </p>
                      )}
                      <div className="text-cyan-500/50 font-mono text-xs">
                        ERSTELLER: {plots.find(p => p.id === selectedPlotId)!.creator.username.toUpperCase()}
                      </div>

                      {/* Context-sensitive management button - only show if user owns the selected plot */}
                      {plots.find(p => p.id === selectedPlotId)!.creator.id === user?.player?.id && (
                        <div className="pt-2 border-t border-cyan-500/10">
                          <button
                            type="button"
                            onClick={() => openPlotManager(selectedPlotId)}
                            className="w-full px-3 py-2 bg-gradient-to-r from-cyan-900/30 to-blue-900/20 border border-cyan-500/30 text-cyan-300 rounded hover:from-cyan-800/40 hover:to-blue-800/30 hover:border-cyan-500/40 transition-all font-mono text-xs tracking-wider flex items-center justify-center gap-2"
                            disabled={sending}
                          >
                            <Users size={14} />
                            MITGLIEDER VERWALTEN
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Dein Rollenspiel-Text oder Story... (max 5000 Zeichen)"
              maxLength={5000}
              rows={6}
              className="w-full bg-slate-800/60 border border-cyan-500/30 rounded px-4 py-3 text-cyan-100 focus:outline-none focus:border-cyan-400 font-mono resize-y backdrop-blur-sm"
              disabled={sending}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-cyan-400/60 font-mono">
                {newMessage.length}/5000 ZEICHEN
              </p>
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="px-6 py-3 bg-gradient-to-r from-cyan-900/40 to-cyan-800/30 border border-cyan-500/30 text-cyan-100 rounded hover:from-cyan-800/50 hover:to-cyan-700/40 transition-all disabled:from-slate-800/30 disabled:to-slate-700/20 disabled:border-slate-600/20 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center gap-2 font-mono"
              >
                <Send size={16} />
                <span className="tracking-wider">VERÖFFENTLICHEN</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-400">Lade HoloNet...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="bg-gradient-to-br from-slate-950/40 to-cyan-950/20 border border-dashed border-cyan-500/30 rounded p-12 text-center backdrop-blur-sm">
            <div className="p-4 bg-cyan-900/20 border border-cyan-500/30 rounded-full w-fit mx-auto mb-6">
              <Radio size={48} className="text-cyan-400/60" />
            </div>
            <p className="text-cyan-200 text-lg font-mono tracking-wider">KEINE ÜBERTRAGUNGEN EMPFANGEN</p>
            <p className="text-cyan-400/60 text-sm font-mono mt-2">
              SENDE DIE ERSTE NACHRICHT INS HOLONET
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className="bg-gradient-to-br from-slate-950/40 to-cyan-950/20 border border-cyan-500/30 rounded backdrop-blur-sm overflow-hidden"
            >
              {/* Imperial Command Post Header */}
              <div className="bg-gradient-to-r from-slate-900/60 to-slate-800/40 border-b border-cyan-500/20 px-4 md:px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/80 to-blue-600/80 border border-cyan-400/40 rounded-full flex items-center justify-center text-white font-bold font-mono backdrop-blur-sm">
                      {msg.player.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-cyan-100 font-semibold font-mono tracking-wider">
                          {msg.player.username.toUpperCase()}
                        </span>
                        <span className={`text-xs font-mono tracking-wider ${getFactionColor(msg.player.factionName)}`}>
                          [{msg.player.factionName.toUpperCase()}]
                        </span>
                        {msg.plot && (
                          <div className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-900/40 to-violet-800/30 border border-purple-500/30 rounded text-xs font-mono tracking-wider text-purple-300 backdrop-blur-sm">
                            <FileText size={12} />
                            <span>RPG: {msg.plot.title.toUpperCase()}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-cyan-400/60 font-mono tracking-wider">
                        {formatTime(msg.createdAt).toUpperCase()}
                        {msg.updatedAt && msg.updatedAt !== msg.createdAt && (
                          <span className="ml-2 text-cyan-400/40">(BEARBEITET)</span>
                        )}
                      </span>
                    </div>
                  </div>
                  {canEdit(msg) && editingId !== msg.id && (
                    <button
                      onClick={() => startEdit(msg)}
                      className="p-2 text-cyan-400/60 hover:text-cyan-300 hover:bg-cyan-900/20 border border-transparent hover:border-cyan-500/30 rounded transition-all"
                      title="Bearbeiten"
                    >
                      <Edit2 size={18} />
                    </button>
                  )}
                </div>
              </div>

              {/* Imperial Command Post Content */}
              <div className="p-4 md:p-6">
                {editingId === msg.id ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Titel (optional)"
                      maxLength={100}
                      className="w-full bg-slate-800/60 border border-cyan-500/30 rounded px-4 py-3 text-cyan-100 focus:outline-none focus:border-cyan-400 font-mono backdrop-blur-sm"
                    />
                    <textarea
                      value={editMessage}
                      onChange={(e) => setEditMessage(e.target.value)}
                      maxLength={5000}
                      rows={6}
                      className="w-full bg-slate-800/60 border border-cyan-500/30 rounded px-4 py-3 text-cyan-100 focus:outline-none focus:border-cyan-400 font-mono resize-y backdrop-blur-sm"
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-cyan-400/60 font-mono tracking-wider">
                        {editMessage.length}/5000 ZEICHEN
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={cancelEdit}
                          className="px-4 py-2 bg-gradient-to-r from-slate-800/60 to-slate-700/40 border border-slate-500/30 text-slate-200 rounded hover:from-slate-700/70 hover:to-slate-600/50 transition-all flex items-center gap-2 font-mono tracking-wider"
                        >
                          <X size={16} />
                          ABBRECHEN
                        </button>
                        <button
                          onClick={() => saveEdit(msg.id)}
                          disabled={!editMessage.trim() || sending}
                          className="px-4 py-2 bg-gradient-to-r from-cyan-900/40 to-cyan-800/30 border border-cyan-500/30 text-cyan-100 rounded hover:from-cyan-800/50 hover:to-cyan-700/40 disabled:from-slate-800/30 disabled:to-slate-700/20 disabled:border-slate-600/20 disabled:text-slate-400 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-mono tracking-wider"
                        >
                          <Send size={16} />
                          SPEICHERN
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {msg.title && (
                      <h3 className="text-xl font-bold text-cyan-100 mb-4 font-mono tracking-wider">
                        {msg.title}
                      </h3>
                    )}
                    <div className="text-cyan-200/90 whitespace-pre-wrap leading-relaxed font-mono">
                      {msg.message}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Plot Creation Modal */}
      {showCreatePlot && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 border border-cyan-500/30 rounded-lg max-w-md w-full backdrop-blur-sm">
            {/* Modal Header */}
            <div className="p-6 border-b border-cyan-500/20">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-cyan-100 flex items-center gap-2 font-mono tracking-wider">
                  <FileText size={18} />
                  NEUEN RPG PLOT ERSTELLEN
                </h2>
                <button
                  onClick={() => {
                    setShowCreatePlot(false);
                    setNewPlotTitle('');
                    setNewPlotDescription('');
                    setSelectedMembers([]);
                    setMemberSearch('');
                    setSearchResults([]);
                  }}
                  className="text-cyan-400/70 hover:text-cyan-300 transition-colors p-1"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={createPlot} className="p-6 space-y-4">
              <div>
                <label className="block text-cyan-400 text-xs font-mono tracking-wider uppercase font-medium mb-2">
                  PLOT TITEL *
                </label>
                <input
                  type="text"
                  value={newPlotTitle}
                  onChange={(e) => setNewPlotTitle(e.target.value)}
                  placeholder="z.B. Rebellion auf Tatooine"
                  maxLength={100}
                  className="w-full bg-slate-800/60 border border-cyan-500/30 rounded px-4 py-3 text-cyan-100 focus:outline-none focus:border-cyan-400 font-mono backdrop-blur-sm"
                  required
                />
                <div className="flex justify-between mt-1">
                  <span className="text-cyan-500/50 font-mono text-xs">ERFORDERLICH</span>
                  <span className="text-cyan-500/50 font-mono text-xs">{newPlotTitle.length}/100</span>
                </div>
              </div>

              <div>
                <label className="block text-cyan-400 text-xs font-mono tracking-wider uppercase font-medium mb-2">
                  BESCHREIBUNG (OPTIONAL)
                </label>
                <textarea
                  value={newPlotDescription}
                  onChange={(e) => setNewPlotDescription(e.target.value)}
                  placeholder="Kurze Beschreibung des Plots für andere Spieler..."
                  maxLength={1000}
                  rows={4}
                  className="w-full bg-slate-800/60 border border-cyan-500/30 rounded px-4 py-3 text-cyan-100 focus:outline-none focus:border-cyan-400 font-mono resize-y backdrop-blur-sm"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-cyan-500/50 font-mono text-xs">NUR ERSTELLER KANN MITGLIEDER HINZUFÜGEN</span>
                  <span className="text-cyan-500/50 font-mono text-xs">{newPlotDescription.length}/1000</span>
                </div>
              </div>

              {/* Member Search Section */}
              <div className="relative">
                <label className="block text-cyan-400 text-xs font-mono tracking-wider uppercase font-medium mb-2">
                  MITGLIEDER HINZUFÜGEN (OPTIONAL)
                </label>
                <input
                  type="text"
                  value={memberSearch}
                  onChange={handleMemberSearch}
                  placeholder="Benutzername eingeben..."
                  className="w-full bg-slate-800/60 border border-cyan-500/30 rounded px-4 py-3 text-cyan-100 focus:outline-none focus:border-cyan-400 font-mono backdrop-blur-sm"
                />
                <div className="mt-1 text-cyan-500/50 font-mono text-xs">
                  MINDESTENS 2 ZEICHEN FÜR SUCHE
                </div>

                {/* Autocomplete Dropdown */}
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-slate-900/95 border border-cyan-500/30 rounded mt-1 max-h-48 overflow-y-auto z-10 backdrop-blur-sm">
                    {searchResults.map(player => (
                      <button
                        key={player.id}
                        type="button"
                        onClick={() => addMember(player)}
                        className="w-full px-4 py-3 text-left hover:bg-cyan-900/30 border-b border-cyan-500/10 last:border-b-0 transition-colors"
                      >
                        <div className="text-cyan-100 font-mono text-sm">{player.username}</div>
                        <div className="text-cyan-400/60 font-mono text-xs">{player.factionName}</div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Selected Members Cards */}
                {selectedMembers.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="text-cyan-400/70 text-xs font-mono uppercase tracking-wider">
                      Ausgewählte Mitglieder ({selectedMembers.length}):
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedMembers.map(member => (
                        <div key={member.id} className="inline-flex items-center gap-2 px-3 py-2 bg-cyan-900/30 border border-cyan-500/30 rounded font-mono text-xs backdrop-blur-sm">
                          <div className="w-5 h-5 bg-gradient-to-br from-cyan-500/80 to-blue-600/80 border border-cyan-400/40 rounded-full flex items-center justify-center text-white font-bold text-xs">
                            {member.username.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-cyan-100">{member.username}</span>
                          <span className="text-cyan-400/60">({member.factionName})</span>
                          <button
                            type="button"
                            onClick={() => removeMember(member.id)}
                            className="text-red-400 hover:text-red-300 ml-1 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Search Status */}
                {isSearching && (
                  <div className="mt-2 text-cyan-400/60 font-mono text-xs">
                    SUCHE LÄUFT...
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreatePlot(false);
                    setNewPlotTitle('');
                    setNewPlotDescription('');
                    setSelectedMembers([]);
                    setMemberSearch('');
                    setSearchResults([]);
                  }}
                  className="px-4 py-2 bg-slate-800/60 border border-slate-500/30 text-slate-300 rounded hover:bg-slate-700/60 transition-all font-mono tracking-wider text-sm"
                >
                  ABBRECHEN
                </button>
                <button
                  type="submit"
                  disabled={!newPlotTitle.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-cyan-900/40 to-cyan-800/30 border border-cyan-500/30 text-cyan-100 rounded hover:from-cyan-800/50 hover:to-cyan-700/40 transition-all disabled:from-slate-800/30 disabled:to-slate-700/20 disabled:border-slate-600/20 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center gap-2 font-mono tracking-wider text-sm"
                >
                  <FileText size={16} />
                  PLOT ERSTELLEN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Plot Management Modal */}
      {showPlotManager && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 border border-cyan-500/30 rounded-lg max-w-2xl w-full backdrop-blur-sm max-h-[80vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-cyan-500/20 sticky top-0 bg-slate-900/95 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-cyan-100 flex items-center gap-2 font-mono tracking-wider">
                  <Users size={18} />
                  PLOT MITGLIEDER VERWALTEN
                </h2>
                <button
                  onClick={() => {
                    setShowPlotManager(false);
                    setManagingPlotId(null);
                    setPlotMembers([]);
                    setMemberSearch('');
                    setSearchResults([]);
                  }}
                  className="text-cyan-400/70 hover:text-cyan-300 transition-colors p-1"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Add Member Section */}
              <div className="mb-8">
                <h3 className="text-cyan-100 font-mono font-medium mb-4 tracking-wider uppercase text-sm">
                  NEUES MITGLIED HINZUFÜGEN
                </h3>
                <div className="relative">
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={handleMemberSearch}
                    placeholder="Benutzername für Suche eingeben..."
                    className="w-full bg-slate-800/60 border border-cyan-500/30 rounded px-4 py-3 text-cyan-100 focus:outline-none focus:border-cyan-400 font-mono backdrop-blur-sm"
                  />
                  <div className="mt-1 text-cyan-500/50 font-mono text-xs">
                    MINDESTENS 2 ZEICHEN FÜR SUCHE
                  </div>

                  {/* Autocomplete Dropdown for Management */}
                  {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-slate-900/95 border border-cyan-500/30 rounded mt-1 max-h-48 overflow-y-auto z-10 backdrop-blur-sm">
                      {searchResults.map(player => (
                        <button
                          key={player.id}
                          type="button"
                          onClick={() => addPlotMember(player.username)}
                          className="w-full px-4 py-3 text-left hover:bg-cyan-900/30 border-b border-cyan-500/10 last:border-b-0 transition-colors"
                        >
                          <div className="text-cyan-100 font-mono text-sm">{player.username}</div>
                          <div className="text-cyan-400/60 font-mono text-xs">{player.factionName}</div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Search Status */}
                  {isSearching && (
                    <div className="mt-2 text-cyan-400/60 font-mono text-xs">
                      SUCHE LÄUFT...
                    </div>
                  )}
                </div>
              </div>

              {/* Current Members Section */}
              <div>
                <h3 className="text-cyan-100 font-mono font-medium mb-4 tracking-wider uppercase text-sm">
                  AKTUELLE MITGLIEDER ({plotMembers.length})
                </h3>
                {plotMembers.length > 0 ? (
                  <div className="grid gap-3">
                    {plotMembers.map(member => (
                      <div key={member.id} className="flex items-center justify-between p-4 bg-slate-800/40 border border-cyan-500/20 rounded backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-cyan-500/80 to-blue-600/80 border border-cyan-400/40 rounded-full flex items-center justify-center text-white font-bold font-mono text-xs">
                            {member.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-cyan-100 font-mono font-medium">{member.username}</div>
                            <div className="text-cyan-400/60 font-mono text-xs">{member.factionName}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-cyan-500/50 font-mono text-xs">
                            {new Date(member.addedAt).toLocaleDateString('de-DE')}
                          </div>
                          <button
                            onClick={() => removePlotMember(member.id)}
                            className="px-3 py-2 bg-red-900/40 border border-red-500/40 text-red-300 rounded hover:bg-red-900/60 hover:border-red-500/60 transition-all font-mono text-xs tracking-wider"
                          >
                            ENTFERNEN
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-cyan-400/60 font-mono text-center py-8 tracking-wider">
                    KEINE MITGLIEDER HINZUGEFÜGT
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
