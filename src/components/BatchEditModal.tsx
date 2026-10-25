import React, { useState } from 'react';
import { X, Layers, CheckSquare, Trash2, Edit3, ArrowRight } from 'lucide-react';
import { Channel } from '../types/iptv';

interface BatchEditModalProps {
  selectedChannelIds: string[];
  channels: Channel[];
  isOpen: boolean;
  onClose: () => void;
  onApplyBatchGroup: (newGroup: string) => void;
  onApplyNamePrefixSuffix: (prefix: string, suffix: string) => void;
  onApplySearchReplace: (find: string, replace: string, target: 'name' | 'url') => void;
  onBatchDelete: () => void;
  existingGroups: string[];
}

export const BatchEditModal: React.FC<BatchEditModalProps> = ({
  selectedChannelIds,
  channels,
  isOpen,
  onClose,
  onApplyBatchGroup,
  onApplyNamePrefixSuffix,
  onApplySearchReplace,
  onBatchDelete,
  existingGroups,
}) => {
  const [activeTab, setActiveTab] = useState<'group' | 'prefix' | 'replace' | 'delete'>('group');
  const [newGroup, setNewGroup] = useState<string>('');
  const [prefix, setPrefix] = useState<string>('');
  const [suffix, setSuffix] = useState<string>('');
  const [findText, setFindText] = useState<string>('');
  const [replaceText, setReplaceText] = useState<string>('');
  const [replaceTarget, setReplaceTarget] = useState<'name' | 'url'>('name');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-[#161a22] border border-[#2b3342] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#252c39] bg-[#12151c]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#f97316]/20 border border-[#f97316]/40 flex items-center justify-center text-[#f97316]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Масово редактиране (Batch Editor)</h3>
              <p className="text-[11px] text-slate-400">
                Избрани канали: <strong className="text-white">{selectedChannelIds.length}</strong> от {channels.length}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#252c39] bg-[#141820] px-4 pt-2 gap-1 text-xs">
          <button
            onClick={() => setActiveTab('group')}
            className={`px-3 py-2 border-b-2 font-medium transition-colors ${
              activeTab === 'group'
                ? 'border-[#f97316] text-[#f97316]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Смяна на категория
          </button>
          <button
            onClick={() => setActiveTab('replace')}
            className={`px-3 py-2 border-b-2 font-medium transition-colors ${
              activeTab === 'replace'
                ? 'border-[#f97316] text-[#f97316]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Търси & Замени
          </button>
          <button
            onClick={() => setActiveTab('prefix')}
            className={`px-3 py-2 border-b-2 font-medium transition-colors ${
              activeTab === 'prefix'
                ? 'border-[#f97316] text-[#f97316]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Префикс / Суфикс
          </button>
          <button
            onClick={() => setActiveTab('delete')}
            className={`px-3 py-2 border-b-2 font-medium transition-colors ${
              activeTab === 'delete'
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Изтриване
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 space-y-4">
          {activeTab === 'group' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Преместете всички маркирани канали ({selectedChannelIds.length} бр.) в нова или съществуваща група.
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Изберете съществуваща група:</label>
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {existingGroups.map((grp) => (
                    <button
                      key={grp}
                      type="button"
                      onClick={() => setNewGroup(grp)}
                      className={`px-2 py-1 rounded text-xs border transition-colors ${
                        newGroup === grp
                          ? 'bg-[#f97316] text-white border-[#f97316]'
                          : 'bg-[#1e2430] text-slate-300 border-white/5 hover:border-slate-500'
                      }`}
                    >
                      {grp}
                    </button>
                  ))}
                </div>

                <label className="block text-xs font-semibold text-slate-300 mb-1">Или въведете ново име на категория:</label>
                <input
                  type="text"
                  value={newGroup}
                  onChange={(e) => setNewGroup(e.target.value)}
                  placeholder="напр. Спорт HD, Български Канали, Кино Плюс..."
                  className="w-full bg-[#1e2430] border border-[#2d3648] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#f97316]"
                />
              </div>

              <button
                disabled={!newGroup.trim() || selectedChannelIds.length === 0}
                onClick={() => {
                  onApplyBatchGroup(newGroup.trim());
                  onClose();
                }}
                className="w-full py-2 bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition-colors mt-2"
              >
                Приложи новата група за {selectedChannelIds.length} канала
              </button>
            </div>
          )}

          {activeTab === 'replace' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Търсене и замяна на низ (текст, домейн, порт или префикс) в избраните канали.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Къде да се търси:</label>
                <div className="flex gap-4 text-xs text-slate-300">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      checked={replaceTarget === 'name'}
                      onChange={() => setReplaceTarget('name')}
                      className="accent-[#f97316]"
                    />
                    <span>В името на канала</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      checked={replaceTarget === 'url'}
                      onChange={() => setReplaceTarget('url')}
                      className="accent-[#f97316]"
                    />
                    <span>В стрийм URL адреса</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Търси:</label>
                <input
                  type="text"
                  value={findText}
                  onChange={(e) => setFindText(e.target.value)}
                  placeholder={replaceTarget === 'name' ? 'напр. SD' : 'напр. :8080 или old-server.com'}
                  className="w-full bg-[#1e2430] border border-[#2d3648] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#f97316]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Замени с:</label>
                <input
                  type="text"
                  value={replaceText}
                  onChange={(e) => setReplaceText(e.target.value)}
                  placeholder={replaceTarget === 'name' ? 'напр. HD 1080p' : 'напр. :8443 или new-server.com'}
                  className="w-full bg-[#1e2430] border border-[#2d3648] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#f97316]"
                />
              </div>

              <button
                disabled={!findText || selectedChannelIds.length === 0}
                onClick={() => {
                  onApplySearchReplace(findText, replaceText, replaceTarget);
                  onClose();
                }}
                className="w-full py-2 bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition-colors mt-2"
              >
                Замени в маркираните канали
              </button>
            </div>
          )}

          {activeTab === 'prefix' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Добавете текст в началото (префикс) или края (суфикс) на името на всеки от маркираните канали.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Префикс (в началото):</label>
                <input
                  type="text"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  placeholder="напр. BG: или [HD] "
                  className="w-full bg-[#1e2430] border border-[#2d3648] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#f97316]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Суфикс (в края):</label>
                <input
                  type="text"
                  value={suffix}
                  onChange={(e) => setSuffix(e.target.value)}
                  placeholder="напр. (FHD) или [Live]"
                  className="w-full bg-[#1e2430] border border-[#2d3648] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#f97316]"
                />
              </div>

              <button
                disabled={(!prefix && !suffix) || selectedChannelIds.length === 0}
                onClick={() => {
                  onApplyNamePrefixSuffix(prefix, suffix);
                  onClose();
                }}
                className="w-full py-2 bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition-colors mt-2"
              >
                Приложи към имената
              </button>
            </div>
          )}

          {activeTab === 'delete' && (
            <div className="space-y-4 text-center py-2">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Изтриване на {selectedChannelIds.length} избрани канала?</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Каналите ще бъдат премахнати от активната плейлиста. Можете да възстановите листата от пресетите или M3U архив по всяко време.
                </p>
              </div>

              <button
                disabled={selectedChannelIds.length === 0}
                onClick={() => {
                  onBatchDelete();
                  onClose();
                }}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Да, изтрий маркираните канали ({selectedChannelIds.length})
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
