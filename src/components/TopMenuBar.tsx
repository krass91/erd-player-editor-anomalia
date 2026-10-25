import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Upload,
  Download,
  Plus,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Maximize,
  HelpCircle,
  Activity,
  Monitor,
  CheckCircle,
  Layers,
  Settings
} from 'lucide-react';
import { LayoutMode } from '../types/iptv';

interface TopMenuBarProps {
  layoutMode: LayoutMode;
  onLayoutModeChange: (mode: LayoutMode) => void;
  onNewPlaylist: () => void;
  onOpenImport: () => void;
  onOpenExport: () => void;
  onAddChannel: () => void;
  onTogglePlay: () => void;
  isPlaying: boolean;
  onNextChannel: () => void;
  onPrevChannel: () => void;
  onOpenDiagnostics: () => void;
  onOpenHelp: () => void;
}

export const TopMenuBar: React.FC<TopMenuBarProps> = ({
  layoutMode,
  onLayoutModeChange,
  onNewPlaylist,
  onOpenImport,
  onOpenExport,
  onAddChannel,
  onTogglePlay,
  isPlaying,
  onNextChannel,
  onPrevChannel,
  onOpenDiagnostics,
  onOpenHelp,
}) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuBarRef = useRef<HTMLDivElement | null>(null);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const closeMenu = () => setOpenMenu(null);

  return (
    <div
      ref={menuBarRef}
      className="h-10 bg-[#161a22] border-b border-[#252c39] px-3 flex items-center justify-between text-xs text-slate-300 select-none z-40 shrink-0"
    >
      {/* Left: App Logo + Desktop-style Dropdown Menus */}
      <div className="flex items-center gap-1">
        {/* Brand Icon */}
        <div className="flex items-center gap-2 mr-3 font-semibold text-white tracking-wide">
          <div className="w-5 h-5 rounded bg-[#f97316] flex items-center justify-center text-white shadow-sm">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
              <path d="M12 2L4 18h16L12 2zm0 3.8L16.2 13H7.8L12 5.8zM6.5 15h11l1 2H5.5l1-2zm-2 3.5h15l.8 1.5H3.7l.8-1.5z" />
            </svg>
          </div>
          <span className="font-bold text-sm tracking-tight hidden sm:inline">IPTV ERD Player</span>
        </div>

        {/* File Menu */}
        <div className="relative">
          <button
            onClick={() => setOpenMenu(openMenu === 'file' ? null : 'file')}
            className={`px-2.5 py-1 rounded transition-colors ${
              openMenu === 'file' ? 'bg-[#293245] text-white' : 'hover:bg-white/10 text-slate-300'
            }`}
          >
            Файл
          </button>
          {openMenu === 'file' && (
            <div className="absolute left-0 top-full mt-1 w-52 bg-[#1b202c] border border-[#2b3345] rounded-lg shadow-2xl py-1 z-50 text-xs">
              <button
                onClick={() => {
                  closeMenu();
                  onOpenImport();
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-white/10 flex items-center gap-2"
              >
                <Upload className="w-3.5 h-3.5 text-[#f97316]" />
                <span>Отвори / Импорт M3U</span>
              </button>
              <button
                onClick={() => {
                  closeMenu();
                  onNewPlaylist();
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-white/10 flex items-center gap-2"
              >
                <FileText className="w-3.5 h-3.5 text-[#f97316]" />
                <span>Нова празна листа</span>
              </button>
              <div className="my-1 border-t border-white/10" />
              <button
                onClick={() => {
                  closeMenu();
                  onOpenExport();
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-white/10 flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Експорт като .M3U / .M3U8</span>
              </button>
              <button
                onClick={() => {
                  closeMenu();
                  onOpenExport();
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-white/10 flex items-center gap-2 text-[#f97316] font-semibold"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Свали готова Windows EXE</span>
              </button>
            </div>
          )}
        </div>


        {/* Edit Menu */}
        <div className="relative">
          <button
            onClick={() => setOpenMenu(openMenu === 'edit' ? null : 'edit')}
            className={`px-2.5 py-1 rounded transition-colors ${
              openMenu === 'edit' ? 'bg-[#293245] text-white' : 'hover:bg-white/10 text-slate-300'
            }`}
          >
            Редактиране
          </button>
          {openMenu === 'edit' && (
            <div className="absolute left-0 top-full mt-1 w-48 bg-[#1b202c] border border-[#2b3345] rounded-lg shadow-2xl py-1 z-50 text-xs">
              <button
                onClick={() => {
                  closeMenu();
                  onAddChannel();
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-white/10 flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5 text-[#f97316]" />
                <span>Добави нов канал</span>
              </button>
            </div>
          )}
        </div>

        {/* Playback Menu */}
        <div className="relative">
          <button
            onClick={() => setOpenMenu(openMenu === 'playback' ? null : 'playback')}
            className={`px-2.5 py-1 rounded transition-colors ${
              openMenu === 'playback' ? 'bg-[#293245] text-white' : 'hover:bg-white/10 text-slate-300'
            }`}
          >
            Възпроизвеждане
          </button>
          {openMenu === 'playback' && (
            <div className="absolute left-0 top-full mt-1 w-48 bg-[#1b202c] border border-[#2b3345] rounded-lg shadow-2xl py-1 z-50 text-xs">
              <button
                onClick={() => {
                  closeMenu();
                  onTogglePlay();
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-white/10 flex items-center gap-2"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 text-[#f97316]" /> : <Play className="w-3.5 h-3.5 text-[#f97316]" />}
                <span>{isPlaying ? 'Пауза (Space)' : 'Пусни (Space)'}</span>
              </button>
              <button
                onClick={() => {
                  closeMenu();
                  onPrevChannel();
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-white/10 flex items-center gap-2"
              >
                <SkipBack className="w-3.5 h-3.5" />
                <span>Предишен канал</span>
              </button>
              <button
                onClick={() => {
                  closeMenu();
                  onNextChannel();
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-white/10 flex items-center gap-2"
              >
                <SkipForward className="w-3.5 h-3.5" />
                <span>Следващ канал</span>
              </button>
            </div>
          )}
        </div>

        {/* View Menu */}
        <div className="relative">
          <button
            onClick={() => setOpenMenu(openMenu === 'view' ? null : 'view')}
            className={`px-2.5 py-1 rounded transition-colors ${
              openMenu === 'view' ? 'bg-[#293245] text-white' : 'hover:bg-white/10 text-slate-300'
            }`}
          >
            Изглед
          </button>
          {openMenu === 'view' && (
            <div className="absolute left-0 top-full mt-1 w-52 bg-[#1b202c] border border-[#2b3345] rounded-lg shadow-2xl py-1 z-50 text-xs">
              <button
                onClick={() => {
                  closeMenu();
                  onLayoutModeChange('split');
                }}
                className={`w-full text-left px-3 py-1.5 hover:bg-white/10 flex items-center justify-between ${
                  layoutMode === 'split' ? 'text-[#f97316] font-semibold' : ''
                }`}
              >
                <span>Разделен екран (Split)</span>
                {layoutMode === 'split' && <CheckCircle className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => {
                  closeMenu();
                  onLayoutModeChange('player-focus');
                }}
                className={`w-full text-left px-3 py-1.5 hover:bg-white/10 flex items-center justify-between ${
                  layoutMode === 'player-focus' ? 'text-[#f97316] font-semibold' : ''
                }`}
              >
                <span>Фокус върху Плеъра</span>
                {layoutMode === 'player-focus' && <CheckCircle className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => {
                  closeMenu();
                  onLayoutModeChange('editor-focus');
                }}
                className={`w-full text-left px-3 py-1.5 hover:bg-white/10 flex items-center justify-between ${
                  layoutMode === 'editor-focus' ? 'text-[#f97316] font-semibold' : ''
                }`}
              >
                <span>Фокус върху Таблицата (ERD)</span>
                {layoutMode === 'editor-focus' && <CheckCircle className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
        </div>

        {/* Tools Menu */}
        <div className="relative">
          <button
            onClick={() => setOpenMenu(openMenu === 'tools' ? null : 'tools')}
            className={`px-2.5 py-1 rounded transition-colors ${
              openMenu === 'tools' ? 'bg-[#293245] text-white' : 'hover:bg-white/10 text-slate-300'
            }`}
          >
            Инструменти
          </button>
          {openMenu === 'tools' && (
            <div className="absolute left-0 top-full mt-1 w-52 bg-[#1b202c] border border-[#2b3345] rounded-lg shadow-2xl py-1 z-50 text-xs">
              <button
                onClick={() => {
                  closeMenu();
                  onOpenDiagnostics();
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-white/10 flex items-center gap-2"
              >
                <Activity className="w-3.5 h-3.5 text-[#f97316]" />
                <span>VLC Медия информация</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right: Layout Switcher & Help */}
      <div className="flex items-center gap-2">
        {/* Layout quick toggle buttons */}
        <div className="flex items-center bg-[#202634] p-0.5 rounded-lg border border-white/5">
          <button
            onClick={() => onLayoutModeChange('split')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              layoutMode === 'split' ? 'bg-[#f97316] text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="Разделен екран: Плеър + Редактор"
          >
            Сплит
          </button>
          <button
            onClick={() => onLayoutModeChange('player-focus')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              layoutMode === 'player-focus' ? 'bg-[#f97316] text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="Голям екран на плеъра"
          >
            Плеър
          </button>
          <button
            onClick={() => onLayoutModeChange('editor-focus')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              layoutMode === 'editor-focus' ? 'bg-[#f97316] text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="Пълна ERD таблица"
          >
            Редактор
          </button>
        </div>

        {/* Windows Standalone EXE Download Button */}
        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#f97316] hover:bg-[#ea580c] text-white text-xs font-bold transition-all shadow-md active:scale-95"
          title="Свали готова самостоятелна Windows EXE програма (без нужда от инсталация на ERD)"
        >
          <Monitor className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Свали Windows EXE</span>
        </button>

        <button
          onClick={onOpenHelp}
          className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          title="Помощ & Клавишни комбинации"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

