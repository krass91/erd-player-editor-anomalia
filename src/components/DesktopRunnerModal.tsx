import React, { useState } from 'react';
import { X, Download, Terminal, Monitor, Copy, Check, ExternalLink, PackageCheck, Sparkles, ShieldCheck } from 'lucide-react';
import { Channel } from '../types/iptv';
import { generateM3U, downloadM3UFile } from '../utils/m3uParser';

interface DesktopRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  channels: Channel[];
  playlistName: string;
}

export const DesktopRunnerModal: React.FC<DesktopRunnerModalProps> = ({
  isOpen,
  onClose,
  channels,
  playlistName,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'exe' | 'm3u' | 'vlc_cmd'>('exe');

  if (!isOpen) return null;

  const m3uContent = generateM3U(channels, playlistName);

  const handleCopyM3U = () => {
    navigator.clipboard.writeText(m3uContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadBat = () => {
    const batScript = `@echo off
echo ========================================================
echo   IPTV ERD Editor - VLC Desktop Launcher
echo ========================================================
echo Стартиране на плейлистата в локалния VLC Media Player...
start "" "C:\\Program Files\\VideoLAN\\VLC\\vlc.exe" "${playlistName}.m3u8"
if %errorlevel% neq 0 (
  start "" "C:\\Program Files (x86)\\VideoLAN\\VLC\\vlc.exe" "${playlistName}.m3u8"
)
exit
`;
    const blob = new Blob([batScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Launch_VLC_${playlistName.replace(/\s+/g, '_')}.bat`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-[#161a22] border border-[#2b3342] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#252c39] bg-[#12151c]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#f97316]/20 border border-[#f97316]/40 flex items-center justify-center text-[#f97316]">
              <PackageCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Готова Windows EXE Програма & Експорт</h3>
              <p className="text-[11px] text-slate-400">Вграден плеър + IPTV ERD редактор в един изпълним файл</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[#252c39] bg-[#141820] px-4 pt-2 gap-1 text-xs">
          <button
            onClick={() => setActiveTab('exe')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors ${
              activeTab === 'exe' ? 'border-[#f97316] text-[#f97316]' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Windows EXE (Готова програма)</span>
          </button>
          <button
            onClick={() => setActiveTab('m3u')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors ${
              activeTab === 'm3u' ? 'border-[#f97316] text-[#f97316]' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Свали .M3U / .M3U8 Листа</span>
          </button>

          <button
            onClick={() => setActiveTab('vlc_cmd')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors ${
              activeTab === 'vlc_cmd' ? 'border-[#f97316] text-[#f97316]' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>VLC Стартер (.bat)</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* TAB 1: WINDOWS STANDALONE EXE */}
          {activeTab === 'exe' && (
            <div className="space-y-3.5">
              <div className="bg-[#11141b] p-3.5 rounded-lg border border-[#2a3446] space-y-2">
                <div className="flex items-center gap-2 text-white font-semibold text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>100% Готова програма — БЕЗ инсталация на ERD</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Не е необходимо да инсталирате отделен IPTV ERD Editor на компютъра си. Плеърът с VLC видео енджина и пълният редактор на листи са <strong>напълно вградени вътре в изпълнимия .exe файл</strong>.
                </p>
                <div className="text-[11px] text-slate-400 space-y-1 pt-1 border-t border-white/5">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f97316]"></span>
                    <span>Работи веднага при двойно щракване на <strong>IPTV-ERD-Player.exe</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f97316]"></span>
                    <span>Редактира канали, нов стрийм, лого и име докато гледате ТВ</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f97316]"></span>
                    <span>Запазва всички промени автоматично в реално време</span>
                  </div>
                </div>
              </div>

              {/* Direct Download Action Buttons */}
              <div className="space-y-2">
                <a
                  href="/downloads/IPTV-ERD-Player.exe"
                  download="IPTV-ERD-Player.exe"
                  className="w-full flex items-center justify-center gap-2.5 py-3 bg-[#f97316] hover:bg-[#ea580c] text-white rounded-lg text-sm font-bold transition-transform active:scale-[0.99] shadow-lg shadow-[#f97316]/20"
                >
                  <Download className="w-5 h-5" />
                  <span>Свали IPTV-ERD-Player.exe (1.5 MB, Windows 64-bit)</span>
                </a>

                <div className="flex items-center gap-2">
                  <a
                    href="/downloads/IPTV-ERD-Player-Windows-x64.zip"
                    download="IPTV-ERD-Player-Windows-x64.zip"
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#1e2432] hover:bg-[#283144] text-slate-200 border border-white/10 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <PackageCheck className="w-4 h-4 text-[#f97316]" />
                    <span>Свали като ZIP архив с инструкции (.zip)</span>
                  </a>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 text-center">
                Съвместимо с Windows 11, Windows 10, Windows 8 и Windows 7 (x64)
              </div>
            </div>
          )}

          {/* TAB 2: M3U & M3U8 DOWNLOAD */}
          {activeTab === 'm3u' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-300">
                Всички ваши редакции на канали, имена и стриймове се генерират в чист стандартен UTF-8 формат, съвместим с всеки външен плеър, Smart TV или приемник. Можете да свалите файла като <strong>.m3u</strong> или <strong>.m3u8</strong>:
              </p>

              <div className="bg-[#10131a] p-3 rounded-lg border border-[#252c39] font-mono text-[11px] text-slate-400 max-h-36 overflow-y-auto">
                <pre>{channels.length > 0 ? `${m3uContent.slice(0, 500)}...` : '#EXTM3U\n## Листата е празна. Добавете канали или импортирайте списък.'}</pre>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {/* Download as .M3U */}
                <button
                  onClick={() => downloadM3UFile(channels, playlistName, 'm3u')}
                  className="flex items-center justify-center gap-2 py-2.5 bg-[#f97316] hover:bg-[#ea580c] text-white rounded-lg text-xs font-semibold transition-colors shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>Свали като .M3U ({channels.length} канала)</span>
                </button>

                {/* Download as .M3U8 */}
                <button
                  onClick={() => downloadM3UFile(channels, playlistName, 'm3u8')}
                  className="flex items-center justify-center gap-2 py-2.5 bg-[#252f40] hover:bg-[#323e54] text-white border border-white/10 rounded-lg text-xs font-semibold transition-colors shadow-md"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Свали като .M3U8 ({channels.length} канала)</span>
                </button>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={handleCopyM3U}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1b202c] hover:bg-[#252d3d] text-slate-300 rounded-lg text-xs font-medium border border-white/5 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Текстът е копиран!' : 'Копирай текста в клипборда'}</span>
                </button>
              </div>
            </div>
          )}


          {/* TAB 3: VLC CMD / BAT */}
          {activeTab === 'vlc_cmd' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-300">
                Ако искате да стартирате редактирания списък директно в класическия десктоп VLC Media Player:
              </p>

              <div className="bg-[#10131a] p-3 rounded-lg border border-[#252c39] font-mono text-xs text-emerald-400 flex items-center justify-between">
                <code>vlc "{playlistName}.m3u8"</code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`vlc "${playlistName}.m3u8"`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="text-slate-400 hover:text-white p-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <button
                onClick={handleDownloadBat}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#202735] hover:bg-[#2b3548] text-slate-200 border border-white/10 rounded-lg text-xs font-semibold transition-colors"
              >
                <Terminal className="w-4 h-4 text-[#f97316]" />
                <span>Свали Windows Launch_VLC.bat стартер</span>
              </button>
            </div>
          )}
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
