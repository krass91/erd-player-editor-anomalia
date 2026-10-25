import React from 'react';
import { X, Keyboard, Tv, Edit3, Save, Download, Sparkles, Check } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-[#161a22] border border-[#2b3342] rounded-xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#252c39] bg-[#12151c]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#f97316]/20 border border-[#f97316]/40 flex items-center justify-center text-[#f97316]">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Ръководство & Клавишни комбинации</h3>
              <p className="text-[11px] text-slate-400">IPTV ERD Editor & VLC Playback Engine</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-300">
          {/* Real-time editing explanation */}
          <div className="bg-[#11141b] p-3.5 rounded-lg border border-[#262e3d] space-y-2">
            <div className="font-semibold text-white flex items-center gap-1.5 text-xs">
              <Sparkles className="w-4 h-4 text-[#f97316]" />
              <span>Редактиране в реално време докато гледате ТВ:</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Можете да кликнете бутона <strong>"Редактирай канал"</strong> директно върху плеъра или върху редактора в таблицата. Всяка промяна на стрийм URL адрес, лого или име се отразява незабавно и се запазва локално автоматично.
            </p>
          </div>

          {/* Hotkeys */}
          <div>
            <h4 className="font-semibold text-white mb-2 flex items-center gap-1.5">
              <Keyboard className="w-3.5 h-3.5 text-[#f97316]" />
              <span>Бързи клавиши (Hotkeys):</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center justify-between bg-[#191f2b] p-2 rounded border border-white/5">
                <span className="text-slate-400">Пусни / Пауза:</span>
                <kbd className="bg-black/50 px-2 py-0.5 rounded font-mono text-white border border-white/10">Space</kbd>
              </div>
              <div className="flex items-center justify-between bg-[#191f2b] p-2 rounded border border-white/5">
                <span className="text-slate-400">Цял екран:</span>
                <kbd className="bg-black/50 px-2 py-0.5 rounded font-mono text-white border border-white/10">F</kbd>
              </div>
              <div className="flex items-center justify-between bg-[#191f2b] p-2 rounded border border-white/5">
                <span className="text-slate-400">Заглуши звук:</span>
                <kbd className="bg-black/50 px-2 py-0.5 rounded font-mono text-white border border-white/10">M</kbd>
              </div>
              <div className="flex items-center justify-between bg-[#191f2b] p-2 rounded border border-white/5">
                <span className="text-slate-400">Сила на звука:</span>
                <kbd className="bg-black/50 px-2 py-0.5 rounded font-mono text-white border border-white/10">↑ / ↓</kbd>
              </div>
              <div className="flex items-center justify-between bg-[#191f2b] p-2 rounded border border-white/5">
                <span className="text-slate-400">Следващ канал:</span>
                <kbd className="bg-black/50 px-2 py-0.5 rounded font-mono text-white border border-white/10">→</kbd>
              </div>
              <div className="flex items-center justify-between bg-[#191f2b] p-2 rounded border border-white/5">
                <span className="text-slate-400">Предишен канал:</span>
                <kbd className="bg-black/50 px-2 py-0.5 rounded font-mono text-white border border-white/10">←</kbd>
              </div>
            </div>
          </div>

          {/* ERD Features */}
          <div className="space-y-1.5 text-[11px] text-slate-400 border-t border-[#252c39] pt-3">
            <div className="text-slate-300 font-medium mb-1">Основни функции:</div>
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Смяна на плейлисти в движение без затваряне на плеъра</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Масово преименуване, смяна на категория и търси/замени</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Експорт към чист M3U8 и директен десктоп VLC стартер</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#252c39] bg-[#12151c] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-[#f97316] hover:bg-[#ea580c] text-white transition-colors"
          >
            Разбрах
          </button>
        </div>
      </div>
    </div>
  );
};
