import React, { useState } from 'react';
import { X, Upload, Globe, FileText, Plus, CheckCircle, AlertCircle, FilePlus } from 'lucide-react';
import { parseM3U } from '../utils/m3uParser';
import { Playlist } from '../types/iptv';

interface ImportPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (newPlaylist: Playlist, mode: 'new' | 'append' | 'replace') => void;
}

export const ImportPlaylistModal: React.FC<ImportPlaylistModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [tab, setTab] = useState<'file' | 'url' | 'paste' | 'blank'>('file');
  const [playlistTitle, setPlaylistTitle] = useState<string>('Моята IPTV Листа');
  const [importMode, setImportMode] = useState<'new' | 'append' | 'replace'>('new');
  const [urlInput, setUrlInput] = useState<string>('');
  const [rawText, setRawText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) throw new Error('Файлът е празен');
        const parsed = parseM3U(text, file.name.replace(/\.(m3u|m3u8)$/i, '') || playlistTitle);
        if (parsed.channels.length === 0) {
          throw new Error('Не са открити валидни канали в този файл');
        }
        onImportSuccess(parsed, importMode);
        setIsLoading(false);
        onClose();
      } catch (err: any) {
        setErrorMessage(err.message || 'Грешка при четене на файла');
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Грешка при четене на файла');
      setIsLoading(false);
    };
    reader.readAsText(file);
  };

  const handleUrlFetch = async () => {
    if (!urlInput.trim()) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch(urlInput.trim());
      if (!response.ok) {
        throw new Error(`Сървърът върна грешка: HTTP ${response.status}`);
      }
      const text = await response.text();
      const parsed = parseM3U(text, playlistTitle || 'Онлайн IPTV Листа');
      if (parsed.channels.length === 0) {
        throw new Error('Върнатият отговор не съдържа разпознаваеми M3U канали');
      }
      onImportSuccess(parsed, importMode);
      setIsLoading(false);
      onClose();
    } catch (err: any) {
      setErrorMessage(
        `Неуспешно изтегляне: ${err.message || 'CORS ограничение от сървъра'}. Можете да свалите файла локално и да го качите чрез таб "Качи Файл".`
      );
      setIsLoading(false);
    }
  };

  const handlePasteSubmit = () => {
    if (!rawText.trim()) return;
    try {
      const parsed = parseM3U(rawText, playlistTitle || 'Въведена листа');
      if (parsed.channels.length === 0) {
        setErrorMessage('Не са намерени канали. Уверете се, че текстът съдържа стрийм линкове или #EXTINF редове.');
        return;
      }
      onImportSuccess(parsed, importMode);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Грешка при парсване на текста');
    }
  };

  const handleCreateBlank = () => {
    const blankPlaylist: Playlist = {
      id: `pl_custom_${Date.now()}`,
      name: playlistTitle || 'Нова празна листа',
      channels: [
        {
          id: `ch_new_1`,
          name: 'Нов канал 1',
          url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
          logo: '',
          group: 'Общи',
          status: 'online',
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      source: 'custom',
    };
    onImportSuccess(blankPlaylist, 'new');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-[#161a22] border border-[#2b3342] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#252c39] bg-[#12151c]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#f97316]/20 border border-[#f97316]/40 flex items-center justify-center text-[#f97316]">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Импорт / Нова IPTV M3U Листа</h3>
              <p className="text-[11px] text-slate-400">Поддържа стандартни .m3u, .m3u8 файлове и онлайн адреси</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#252c39] bg-[#141820] px-4 pt-2 gap-1 text-xs">
          <button
            onClick={() => setTab('file')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors ${
              tab === 'file' ? 'border-[#f97316] text-[#f97316]' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Качи .m3u / .m3u8 файл</span>
          </button>
          <button
            onClick={() => setTab('url')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors ${
              tab === 'url' ? 'border-[#f97316] text-[#f97316]' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>От Интернет URL</span>
          </button>
          <button
            onClick={() => setTab('paste')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors ${
              tab === 'paste' ? 'border-[#f97316] text-[#f97316]' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Постави M3U текст</span>
          </button>
          <button
            onClick={() => setTab('blank')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors ${
              tab === 'blank' ? 'border-[#f97316] text-[#f97316]' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <FilePlus className="w-3.5 h-3.5" />
            <span>Празна листа</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Playlist Name Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Име на плейлистата:</label>
            <input
              type="text"
              value={playlistTitle}
              onChange={(e) => setPlaylistTitle(e.target.value)}
              placeholder="напр. Любима IPTV листа, Български канали..."
              className="w-full bg-[#1e2430] border border-[#2d3648] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#f97316]"
            />
          </div>

          {/* Action Destination Mode */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Действие към текущия списък:</label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setImportMode('new')}
                className={`p-2 rounded-lg border text-left transition-colors ${
                  importMode === 'new'
                    ? 'border-[#f97316] bg-[#f97316]/10 text-white'
                    : 'border-[#2d3648] bg-[#1e2430] text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-semibold text-white">Нова листа</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Добавя като отделен плейлист</div>
              </button>

              <button
                type="button"
                onClick={() => setImportMode('append')}
                className={`p-2 rounded-lg border text-left transition-colors ${
                  importMode === 'append'
                    ? 'border-[#f97316] bg-[#f97316]/10 text-white'
                    : 'border-[#2d3648] bg-[#1e2430] text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-semibold text-white">Обедини (+Append)</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Добавя към сегашните канали</div>
              </button>

              <button
                type="button"
                onClick={() => setImportMode('replace')}
                className={`p-2 rounded-lg border text-left transition-colors ${
                  importMode === 'replace'
                    ? 'border-[#f97316] bg-[#f97316]/10 text-white'
                    : 'border-[#2d3648] bg-[#1e2430] text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-semibold text-white">Презапиши</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Заменя текущия списък</div>
              </button>
            </div>
          </div>

          {/* Content based on tab */}
          {tab === 'file' && (
            <div>
              <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-[#2d3648] hover:border-[#f97316] rounded-xl bg-[#131720] cursor-pointer transition-colors group">
                <Upload className="w-10 h-10 text-slate-400 group-hover:text-[#f97316] mb-2 transition-colors" />
                <span className="text-xs font-semibold text-white mb-1">
                  Изберете или пуснете .m3u / .m3u8 файл тук
                </span>
                <span className="text-[11px] text-slate-500">
                  Поддържа се UTF-8 формат с пълни EXTM3U атрибути
                </span>
                <input
                  type="file"
                  accept=".m3u,.m3u8,text/plain"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {tab === 'url' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">IPTV M3U Web URL адрес:</label>
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/get.php?username=...&type=m3u_plus"
                  className="w-full bg-[#1e2430] border border-[#2d3648] rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-[#f97316]"
                />
              </div>

              <button
                disabled={isLoading || !urlInput.trim()}
                onClick={handleUrlFetch}
                className="w-full py-2.5 bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span>Зареждане на плейлистата...</span>
                ) : (
                  <>
                    <Globe className="w-4 h-4" />
                    <span>Изтегли и импортирай M3U</span>
                  </>
                )}
              </button>
            </div>
          )}

          {tab === 'paste' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Поставете съдържанието на листата:</label>
                <textarea
                  rows={6}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="#EXTM3U&#10;#EXTINF:-1 tvg-logo=&quot;http://...&quot; group-title=&quot;News&quot;,Euronews&#10;https://..."
                  className="w-full bg-[#1e2430] border border-[#2d3648] rounded-lg p-3 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-[#f97316]"
                />
              </div>

              <button
                disabled={!rawText.trim()}
                onClick={handlePasteSubmit}
                className="w-full py-2.5 bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Парсирай и добави каналите
              </button>
            </div>
          )}

          {tab === 'blank' && (
            <div className="space-y-3 text-center py-2">
              <div className="w-10 h-10 rounded-full bg-[#f97316]/20 text-[#f97316] flex items-center justify-center mx-auto">
                <FilePlus className="w-5 h-5" />
              </div>
              <p className="text-xs text-slate-300 max-w-sm mx-auto">
                Създава чиста празна листа, в която можете да добавяте и организирате свои собствени канали един по един.
              </p>
              <button
                onClick={handleCreateBlank}
                className="w-full py-2.5 bg-[#f97316] hover:bg-[#ea580c] text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Създай празна плейлиста
              </button>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
