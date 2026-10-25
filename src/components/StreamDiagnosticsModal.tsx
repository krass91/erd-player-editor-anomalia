import React from 'react';
import { X, Activity, Cpu, ShieldCheck, Wifi, Layers, Video } from 'lucide-react';
import { Channel, StreamStats } from '../types/iptv';

interface StreamDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: Channel | null;
  stats: StreamStats;
}

export const StreamDiagnosticsModal: React.FC<StreamDiagnosticsModalProps> = ({
  isOpen,
  onClose,
  channel,
  stats,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-[#161a22] border border-[#2b3342] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header - VLC Media Information style */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#252c39] bg-[#12151c]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#f97316]/20 border border-[#f97316]/40 flex items-center justify-center text-[#f97316]">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">VLC Информация за медията & Кодеци</h3>
              <p className="text-[11px] text-slate-400">Технически данни за текущия стрийм в реално време</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Channel Identification */}
          <div className="bg-[#10131a] p-3 rounded-lg border border-[#252c39] space-y-2">
            <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Канал: <strong className="text-white">{channel?.name || 'Няма'}</strong></span>
              {channel?.group && (
                <span className="text-[11px] text-slate-400 bg-black/40 px-2 py-0.5 rounded border border-white/5">
                  {channel.group}
                </span>
              )}
            </div>
            <div className="text-[11px] font-mono text-slate-400 truncate">
              URL: <span className="text-slate-300 select-all">{channel?.url || 'N/A'}</span>
            </div>
          </div>

          {/* Metric Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-[#121620] p-3 rounded-lg border border-[#222938]">
              <div className="text-[11px] text-slate-400 mb-1 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-[#f97316]" />
                <span>Резолюция & Видео:</span>
              </div>
              <div className="text-base font-bold text-white font-mono">
                {stats.resolution || channel?.resolution || '1920x1080 (Auto)'}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                Видео кодек: {stats.codec || 'H.264 / AVC High'}
              </div>
            </div>

            <div className="bg-[#121620] p-3 rounded-lg border border-[#222938]">
              <div className="text-[11px] text-slate-400 mb-1 flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-[#f97316]" />
                <span>Битрейт (Скорост):</span>
              </div>
              <div className="text-base font-bold text-white font-mono tabular-nums">
                {stats.bitrate > 0 ? `${stats.bitrate} kbps` : 'Променлив (VBR)'}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                HLS Chunks: Адаптивно
              </div>
            </div>

            <div className="bg-[#121620] p-3 rounded-lg border border-[#222938]">
              <div className="text-[11px] text-slate-400 mb-1 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#f97316]" />
                <span>Буфер & Латентност:</span>
              </div>
              <div className="text-base font-bold text-emerald-400 font-mono tabular-nums">
                {stats.bufferLength > 0 ? `${stats.bufferLength.toFixed(1)} s` : 'Синхронизиран'}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                Буфер на живо: Оптимален
              </div>
            </div>

            <div className="bg-[#121620] p-3 rounded-lg border border-[#222938]">
              <div className="text-[11px] text-slate-400 mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#f97316]" />
                <span>Аудио стрийм:</span>
              </div>
              <div className="text-base font-bold text-white font-mono">
                {stats.audioChannels || 'AAC 48kHz Stereo'}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                Аудио профил: LC / 192 kbps
              </div>
            </div>
          </div>

          {/* Advanced attributes */}
          <div className="bg-[#121620] p-3 rounded-lg border border-[#222938] space-y-1.5 text-[11px]">
            <div className="flex justify-between text-slate-400">
              <span>tvg-id:</span>
              <span className="font-mono text-slate-200">{channel?.tvgId || 'не е зададен'}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>User-Agent:</span>
              <span className="font-mono text-slate-200">{channel?.httpUserAgent || 'VLC/3.0.18 LibVLC'}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Режим на възпроизвеждане:</span>
              <span className="text-emerald-400 font-medium">Hls.js + HTML5 Hardware Accel</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#252c39] bg-[#12151c] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-[#242c3b] hover:bg-[#2f394d] text-white transition-colors"
          >
            Затвори
          </button>
        </div>
      </div>
    </div>
  );
};
