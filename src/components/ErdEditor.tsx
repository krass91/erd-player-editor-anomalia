import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Play,
  Edit3,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Layers,
  Filter,
  CheckSquare,
  Square,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  RotateCw,
  FolderOpen
} from 'lucide-react';
import { Channel, Playlist } from '../types/iptv';

interface ErdEditorProps {
  playlists: Playlist[];
  activePlaylist: Playlist;
  onSelectPlaylist: (playlistId: string) => void;
  activeChannel: Channel | null;
  onPlayChannel: (channel: Channel) => void;
  onEditChannel: (channel: Channel) => void;
  onDeleteChannel: (channelId: string) => void;
  onDuplicateChannel: (channel: Channel) => void;
  onMoveChannel: (index: number, direction: 'up' | 'down') => void;
  onAddChannel: () => void;
  onOpenBatchEdit: (selectedIds: string[]) => void;
  onOpenImportModal: () => void;
  onOpenExportModal: () => void;
  lastSavedTime: number | null;
  onCheckChannelsStatus: () => void;
  isCheckingStatus: boolean;
}

export const ErdEditor: React.FC<ErdEditorProps> = ({
  playlists,
  activePlaylist,
  onSelectPlaylist,
  activeChannel,
  onPlayChannel,
  onEditChannel,
  onDeleteChannel,
  onDuplicateChannel,
  onMoveChannel,
  onAddChannel,
  onOpenBatchEdit,
  onOpenImportModal,
  onOpenExportModal,
  lastSavedTime,
  onCheckChannelsStatus,
  isCheckingStatus,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<'index' | 'name' | 'group'>('index');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Extract all unique groups in the active playlist
  const groups = useMemo(() => {
    const set = new Set<string>();
    activePlaylist.channels.forEach((ch) => {
      if (ch.group) set.add(ch.group);
    });
    return Array.from(set).sort();
  }, [activePlaylist.channels]);

  // Filter channels based on search and category
  const filteredChannels = useMemo(() => {
    let list = activePlaylist.channels.map((ch, idx) => ({ ...ch, originalIndex: idx }));

    if (selectedGroup !== 'all') {
      list = list.filter((ch) => ch.group === selectedGroup);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (ch) =>
          ch.name.toLowerCase().includes(q) ||
          ch.group.toLowerCase().includes(q) ||
          ch.url.toLowerCase().includes(q) ||
          (ch.tvgId && ch.tvgId.toLowerCase().includes(q))
      );
    }

    if (sortField === 'name') {
      list.sort((a, b) => (sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)));
    } else if (sortField === 'group') {
      list.sort((a, b) => (sortAsc ? a.group.localeCompare(b.group) : b.group.localeCompare(a.group)));
    }

    return list;
  }, [activePlaylist.channels, selectedGroup, searchQuery, sortField, sortAsc]);

  // Select all or deselect
  const toggleSelectAll = () => {
    if (selectedChannelIds.length === filteredChannels.length && filteredChannels.length > 0) {
      setSelectedChannelIds([]);
    } else {
      setSelectedChannelIds(filteredChannels.map((c) => c.id));
    }
  };

  const toggleSelectChannel = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedChannelIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#14171f] border border-[#232a38] rounded-lg overflow-hidden select-none">
      {/* Top ERD Toolbar & Playlist Switcher */}
      <div className="bg-[#181c26] border-b border-[#252c3b] p-3 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Playlist Selector & Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <FolderOpen className="w-4 h-4 text-[#f97316]" />
            <span className="hidden sm:inline">Листа:</span>
          </div>

          <div className="relative">
            <select
              value={activePlaylist.id}
              onChange={(e) => {
                onSelectPlaylist(e.target.value);
                setSelectedChannelIds([]);
              }}
              className="bg-[#202634] hover:bg-[#283142] border border-[#2e374a] text-white text-xs font-medium rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:border-[#f97316] appearance-none cursor-pointer transition-colors max-w-[240px] truncate"
            >
              {playlists.map((pl) => (
                <option key={pl.id} value={pl.id}>
                  {pl.name} ({pl.channels.length})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          <button
            onClick={onOpenImportModal}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-[#222937] hover:bg-[#2e3748] text-slate-200 border border-white/5 transition-colors"
            title="Зареди друга M3U листа или създай нова"
          >
            <Upload className="w-3.5 h-3.5 text-[#f97316]" />
            <span className="hidden md:inline">Смени / Импорт</span>
          </button>
        </div>

        {/* Center: Search input */}
        <div className="flex-1 max-w-xs min-w-[180px] relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Търси канал, група или URL..."
            className="w-full bg-[#1c212c] border border-[#293244] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#f97316] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-2 text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Add Channel */}
          <button
            onClick={onAddChannel}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#f97316] hover:bg-[#ea580c] text-white transition-colors shadow-sm"
            title="Добави нов канал в текущия списък"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Нов канал</span>
          </button>

          {/* Batch Edit Trigger */}
          {selectedChannelIds.length > 0 && (
            <button
              onClick={() => onOpenBatchEdit(selectedChannelIds)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-[#2c3548] hover:bg-[#38435b] text-white transition-colors border border-white/10"
              title="Масово редактиране на маркираните канали"
            >
              <Layers className="w-3.5 h-3.5 text-[#f97316]" />
              <span>Масово ({selectedChannelIds.length})</span>
            </button>
          )}

          {/* Check streams */}
          <button
            onClick={onCheckChannelsStatus}
            disabled={isCheckingStatus}
            className="p-1.5 rounded-lg bg-[#202634] hover:bg-[#2c3548] disabled:opacity-50 text-slate-300 hover:text-white transition-colors border border-white/5"
            title="Провери статуса на стриймовете"
          >
            <RotateCw className={`w-4 h-4 ${isCheckingStatus ? 'animate-spin text-[#f97316]' : ''}`} />
          </button>

          {/* Windows EXE Standalone App */}
          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-[#f97316]/20 hover:bg-[#f97316]/30 text-[#f97316] border border-[#f97316]/40 transition-colors shadow-xs"
            title="Свали готова Windows EXE програма с вграден плеър и редактор"
          >
            <Download className="w-3.5 h-3.5 text-[#f97316]" />
            <span className="hidden sm:inline">Windows EXE</span>
          </button>

          {/* Export M3U / M3U8 */}
          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-[#202634] hover:bg-[#2c3548] text-slate-200 border border-white/5 transition-colors"
            title="Експортирай като .M3U или .M3U8 плейлиста"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Експорт .M3U / .M3U8</span>
          </button>
        </div>
      </div>



      {/* Category / Group Filter Strip */}
      <div className="bg-[#11141c] px-3 py-1.5 border-b border-[#202533] flex items-center justify-between text-xs overflow-x-auto no-scrollbar gap-2">
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setSelectedGroup('all')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              selectedGroup === 'all'
                ? 'bg-[#293245] text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            Всички ({activePlaylist.channels.length})
          </button>

          {groups.map((group) => {
            const count = activePlaylist.channels.filter((c) => c.group === group).length;
            return (
              <button
                key={group}
                onClick={() => setSelectedGroup(group)}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  selectedGroup === group
                    ? 'bg-[#293245] text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                {group} <span className="text-[10px] text-slate-500 tabular-nums">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Real-time sync indicator */}
        <div className="flex items-center gap-1 text-[11px] text-emerald-400 shrink-0 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Запазено в реално време</span>
        </div>
      </div>

      {/* Main ERD Table Grid */}
      <div className="flex-1 overflow-auto bg-[#13161e]">
        <table className="w-full border-collapse text-left text-xs">
          {/* Table Header */}
          <thead className="sticky top-0 z-20 bg-[#161a24] border-b border-[#232b3a] text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
            <tr>
              <th className="w-8 px-2.5 py-2.5 text-center">
                <button onClick={toggleSelectAll} className="flex items-center justify-center text-slate-400 hover:text-white">
                  {selectedChannelIds.length === filteredChannels.length && filteredChannels.length > 0 ? (
                    <CheckSquare className="w-3.5 h-3.5 text-[#f97316]" />
                  ) : (
                    <Square className="w-3.5 h-3.5" />
                  )}
                </button>
              </th>
              <th className="w-10 px-2 py-2.5 text-center tabular-nums font-mono">#</th>
              <th className="w-12 px-2 py-2.5 text-center">Лого</th>
              <th
                onClick={() => {
                  setSortField('name');
                  setSortAsc(sortField === 'name' ? !sortAsc : true);
                }}
                className="px-3 py-2.5 cursor-pointer hover:text-white"
              >
                Име на канал {sortField === 'name' && (sortAsc ? '↑' : '↓')}
              </th>
              <th
                onClick={() => {
                  setSortField('group');
                  setSortAsc(sortField === 'group' ? !sortAsc : true);
                }}
                className="w-36 px-3 py-2.5 cursor-pointer hover:text-white hidden sm:table-cell"
              >
                Категория {sortField === 'group' && (sortAsc ? '↑' : '↓')}
              </th>
              <th className="px-3 py-2.5 hidden md:table-cell">Стрийм URL</th>
              <th className="w-20 px-2.5 py-2.5 text-center">Статус</th>
              <th className="w-36 px-2.5 py-2.5 text-right">Действия</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-[#1e2432]">
            {filteredChannels.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center">
                  <div className="max-w-md mx-auto flex flex-col items-center justify-center p-6 bg-[#161a24] rounded-xl border border-[#232b3a] shadow-lg">
                    <div className="w-12 h-12 rounded-full bg-[#f97316]/15 border border-[#f97316]/30 flex items-center justify-center text-[#f97316] mb-3">
                      <FolderOpen className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1">
                      {searchQuery ? 'Няма намерени канали' : 'Плейлистата е празна'}
                    </h4>
                    <p className="text-xs text-slate-400 mb-5 max-w-sm leading-relaxed">
                      {searchQuery
                        ? 'Няма резултати, отговарящи на вашето търсене. Опитайте с друга ключова дума или изчистете филтъра.'
                        : 'Програмата стартира с празна листа. Заредете вашата .m3u или .m3u8 листа от файл/интернет или създайте свой канал:'}
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-2.5">
                      <button
                        onClick={onOpenImportModal}
                        className="flex items-center gap-2 px-4 py-2 bg-[#f97316] hover:bg-[#ea580c] text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Импортирай .m3u / .m3u8 файл</span>
                      </button>

                      <button
                        onClick={onAddChannel}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-[#222937] hover:bg-[#2e3748] text-slate-200 border border-white/10 rounded-lg text-xs font-medium transition-colors"
                      >
                        <Plus className="w-4 h-4 text-[#f97316]" />
                        <span>Добави нов канал</span>
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (

              filteredChannels.map((channel) => {
                const isCurrentPlaying = activeChannel?.id === channel.id;
                const isSelected = selectedChannelIds.includes(channel.id);

                return (
                  <tr
                    key={channel.id}
                    onClick={() => onPlayChannel(channel)}
                    className={`cursor-pointer transition-colors group ${
                      isCurrentPlaying
                        ? 'bg-[#f97316]/15 hover:bg-[#f97316]/20'
                        : isSelected
                        ? 'bg-[#212836] hover:bg-[#273042]'
                        : 'hover:bg-[#1a202c]'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="px-2.5 py-2 text-center" onClick={(e) => toggleSelectChannel(channel.id, e)}>
                      <button className="flex items-center justify-center text-slate-400 hover:text-white">
                        {isSelected ? (
                          <CheckSquare className="w-3.5 h-3.5 text-[#f97316]" />
                        ) : (
                          <Square className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </td>

                    {/* Index */}
                    <td className="px-2 py-2 text-center font-mono text-[11px] text-slate-500 tabular-nums">
                      {channel.originalIndex + 1}
                    </td>

                    {/* Logo */}
                    <td className="px-2 py-2 text-center">
                      <div className="w-7 h-7 rounded bg-[#101319] border border-white/5 flex items-center justify-center overflow-hidden mx-auto p-0.5">
                        {channel.logo ? (
                          <img
                            src={channel.logo}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="text-[9px] font-bold text-slate-500">TV</span>
                        )}
                      </div>
                    </td>

                    {/* Channel Name */}
                    <td className="px-3 py-2 font-medium text-slate-200">
                      <div className="flex items-center gap-2">
                        {isCurrentPlaying && (
                          <span className="w-2 h-2 rounded-full bg-[#f97316] animate-ping shrink-0" />
                        )}
                        <span className={`truncate ${isCurrentPlaying ? 'text-[#f97316] font-bold' : ''}`}>
                          {channel.name}
                        </span>
                      </div>
                    </td>

                    {/* Group */}
                    <td className="px-3 py-2 text-slate-400 text-xs hidden sm:table-cell">
                      <span className="bg-[#1c2230] border border-white/5 px-2 py-0.5 rounded text-[11px] text-slate-300 truncate inline-block max-w-[130px]">
                        {channel.group || 'Общи'}
                      </span>
                    </td>

                    {/* Stream URL */}
                    <td className="px-3 py-2 font-mono text-[11px] text-slate-400 truncate max-w-[200px] hidden md:table-cell">
                      <span className="truncate block" title={channel.url}>
                        {channel.url}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-2.5 py-2 text-center">
                      {channel.status === 'online' ? (
                        <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          Онлайн
                        </span>
                      ) : channel.status === 'offline' ? (
                        <span className="text-[10px] font-medium text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                          Офлайн
                        </span>
                      ) : channel.status === 'checking' ? (
                        <span className="text-[10px] font-medium text-amber-400 animate-pulse">
                          Тест...
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono">
                          Готов
                        </span>
                      )}
                    </td>

                    {/* Actions Toolbar */}
                    <td className="px-2.5 py-2 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        {/* Play Now */}
                        <button
                          onClick={() => onPlayChannel(channel)}
                          className="p-1 rounded hover:bg-[#2a3446] text-slate-300 hover:text-[#f97316] transition-colors"
                          title="Пусни в VLC плеъра"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>

                        {/* Edit Channel */}
                        <button
                          onClick={() => onEditChannel(channel)}
                          className="p-1 rounded hover:bg-[#2a3446] text-slate-300 hover:text-white transition-colors"
                          title="Редактирай параметрите на канала"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Move Up */}
                        <button
                          onClick={() => onMoveChannel(channel.originalIndex, 'up')}
                          disabled={channel.originalIndex === 0}
                          className="p-1 rounded hover:bg-[#2a3446] disabled:opacity-20 text-slate-400 hover:text-white transition-colors"
                          title="Премести нагоре"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>

                        {/* Move Down */}
                        <button
                          onClick={() => onMoveChannel(channel.originalIndex, 'down')}
                          disabled={channel.originalIndex === activePlaylist.channels.length - 1}
                          className="p-1 rounded hover:bg-[#2a3446] disabled:opacity-20 text-slate-400 hover:text-white transition-colors"
                          title="Премести надолу"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>

                        {/* Duplicate */}
                        <button
                          onClick={() => onDuplicateChannel(channel)}
                          className="p-1 rounded hover:bg-[#2a3446] text-slate-400 hover:text-white transition-colors hidden sm:inline-flex"
                          title="Дублирай канала"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => onDeleteChannel(channel.id)}
                          className="p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                          title="Изтрий от листата"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer info bar */}
      <div className="bg-[#161a24] border-t border-[#232b3a] px-3.5 py-2 flex items-center justify-between text-xs text-slate-400 font-mono">
        <div>
          Показани <strong className="text-white">{filteredChannels.length}</strong> от общо{' '}
          <strong className="text-white">{activePlaylist.channels.length}</strong> канала
        </div>
        <div className="flex items-center gap-3">
          {selectedChannelIds.length > 0 && (
            <span className="text-[#f97316]">
              Маркирани: {selectedChannelIds.length}
            </span>
          )}
          <span className="text-slate-500">
            Двойно щракване / бутон за бърза редакция
          </span>
        </div>
      </div>
    </div>
  );
};
