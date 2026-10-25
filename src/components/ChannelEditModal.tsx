import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Tv,
  Image as ImageIcon,
  Link,
  Folder,
  Tag,
  ShieldAlert,
  Play,
  Upload,
  Sparkles,
  Check
} from 'lucide-react';
import { Channel } from '../types/iptv';

interface ChannelEditModalProps {
  channel: Channel | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedChannel: Channel, playImmediately?: boolean) => void;
  existingGroups: string[];
}

const PRESET_LOGOS = [
  { name: 'Новини', url: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Euronews_2016_logo.svg' },
  { name: 'БНТ', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/BNT_4_logo.svg/320px-BNT_4_logo.svg.png' },
  { name: 'Спорт', url: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/ee/Red_Bull_TV_logo.svg/320px-Red_Bull_TV_logo.svg.png' },
  { name: 'Кино', url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=120&auto=format&fit=crop&q=80' },
  { name: 'Музика', url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&auto=format&fit=crop&q=80' },
  { name: 'Космос', url: 'https://upload.wikimedia.org/wikipedia/commons/e/e5/NASA_logo.svg' },
];

export const ChannelEditModal: React.FC<ChannelEditModalProps> = ({
  channel,
  isOpen,
  onClose,
  onSave,
  existingGroups,
}) => {
  const [formData, setFormData] = useState<Channel>({
    id: '',
    name: '',
    url: '',
    logo: '',
    group: 'Общи',
    tvgId: '',
    tvgName: '',
    httpUserAgent: '',
    httpReferrer: '',
  });

  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [customGroupInput, setCustomGroupInput] = useState<string>('');
  const [isUsingCustomGroup, setIsUsingCustomGroup] = useState<boolean>(false);
  const [logoPreviewError, setLogoPreviewError] = useState<boolean>(false);

  useEffect(() => {
    if (channel) {
      setFormData({ ...channel });
      setLogoPreviewError(false);
      const isExisting = existingGroups.includes(channel.group);
      if (!isExisting && channel.group) {
        setIsUsingCustomGroup(true);
        setCustomGroupInput(channel.group);
      } else {
        setIsUsingCustomGroup(false);
      }
    }
  }, [channel, existingGroups]);

  if (!isOpen || !channel) return null;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setFormData((prev) => ({ ...prev, logo: reader.result as string }));
          setLogoPreviewError(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGroupSelect = (group: string) => {
    if (group === '__custom__') {
      setIsUsingCustomGroup(true);
      setFormData((prev) => ({ ...prev, group: customGroupInput || 'Нова категория' }));
    } else {
      setIsUsingCustomGroup(false);
      setFormData((prev) => ({ ...prev, group }));
    }
  };

  const handleSave = (playImmediately: boolean = false) => {
    const finalGroup = isUsingCustomGroup ? (customGroupInput.trim() || 'Общи') : formData.group;
    const finalChannel: Channel = {
      ...formData,
      group: finalGroup,
      name: formData.name.trim() || 'Без име',
      url: formData.url.trim(),
    };

    onSave(finalChannel, playImmediately);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-[#161a22] border border-[#2b3342] rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#252c39] bg-[#12151c]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#f97316]/20 border border-[#f97316]/40 flex items-center justify-center text-[#f97316]">
              <Tv className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Редактор на IPTV Канал (ERD)</h3>
              <p className="text-[11px] text-slate-400">Промените се отразяват в реално време</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Channel Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Име на канал <span className="text-[#f97316]">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="напр. BNT 1 HD, Eurosport, HBO..."
                className="w-full bg-[#1e2430] border border-[#2d3648] rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#f97316] transition-colors"
              />
            </div>
          </div>

          {/* Stream URL */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Link className="w-3.5 h-3.5 text-[#f97316]" />
                M3U8 / IPTV Стрийм адрес (URL) <span className="text-[#f97316]">*</span>
              </label>
            </div>
            <textarea
              rows={2}
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://server.com/live/stream.m3u8"
              className="w-full bg-[#1e2430] border border-[#2d3648] rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-[#f97316] transition-colors"
            />
          </div>

          {/* Logo URL and Image Preview */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Лого на канала (Изображение или URL)
            </label>
            <div className="flex items-start gap-3">
              {/* Preview Thumbnail */}
              <div className="w-14 h-14 rounded-lg bg-[#11141a] border border-[#2d3648] flex items-center justify-center overflow-hidden shrink-0 p-1">
                {formData.logo && !logoPreviewError ? (
                  <img
                    src={formData.logo}
                    alt="Logo"
                    referrerPolicy="no-referrer"
                    onError={() => setLogoPreviewError(true)}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-500 text-[10px]">
                    <ImageIcon className="w-5 h-5 text-slate-500 mb-0.5" />
                    <span>Няма</span>
                  </div>
                )}
              </div>

              {/* URL input and upload button */}
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={formData.logo}
                  onChange={(e) => {
                    setFormData({ ...formData, logo: e.target.value });
                    setLogoPreviewError(false);
                  }}
                  placeholder="https://example.com/logo.png"
                  className="w-full bg-[#1e2430] border border-[#2d3648] rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#f97316] transition-colors"
                />

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-[#202735] hover:bg-[#2b3547] text-slate-300 cursor-pointer border border-white/5 transition-colors">
                    <Upload className="w-3.5 h-3.5 text-[#f97316]" />
                    <span>Качи файл (PNG/SVG/JPG)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>

                  {formData.logo && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, logo: '' })}
                      className="text-xs text-slate-400 hover:text-red-400 transition-colors"
                    >
                      Премахни лого
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Preset Logos */}
            <div className="mt-2.5">
              <span className="text-[11px] text-slate-400 block mb-1">Бързи лога за попълване:</span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_LOGOS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, logo: preset.url });
                      setLogoPreviewError(false);
                    }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-[#1a202c] hover:bg-[#262f40] text-slate-300 border border-white/5 transition-colors"
                  >
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Group / Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Категория / Плейлист група (group-title)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                value={isUsingCustomGroup ? '__custom__' : formData.group}
                onChange={(e) => handleGroupSelect(e.target.value)}
                className="w-full bg-[#1e2430] border border-[#2d3648] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#f97316] transition-colors"
              >
                {existingGroups.map((grp) => (
                  <option key={grp} value={grp}>
                    {grp}
                  </option>
                ))}
                <option value="__custom__">+ Създай нова група...</option>
              </select>

              {isUsingCustomGroup && (
                <input
                  type="text"
                  value={customGroupInput}
                  onChange={(e) => {
                    setCustomGroupInput(e.target.value);
                    setFormData({ ...formData, group: e.target.value });
                  }}
                  placeholder="Въведете име на новата категория"
                  className="w-full bg-[#1e2430] border border-[#f97316] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
              )}
            </div>
          </div>

          {/* Advanced M3U Attributes Accordion */}
          <div className="border-t border-[#252c39] pt-3">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full text-xs font-medium text-slate-400 hover:text-white transition-colors py-1"
            >
              <span>Разширени M3U & VLC атрибути (tvg-id, user-agent, referer)</span>
              <span>{showAdvanced ? '▲ Скрий' : '▼ Покажи'}</span>
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-3 bg-[#11141b] p-3.5 rounded-lg border border-[#232936]">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">tvg-id (EPG)</label>
                    <input
                      type="text"
                      value={formData.tvgId || ''}
                      onChange={(e) => setFormData({ ...formData, tvgId: e.target.value })}
                      placeholder="BNT1.bg"
                      className="w-full bg-[#1a202c] border border-[#2d3648] rounded px-2.5 py-1 text-xs font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">tvg-name</label>
                    <input
                      type="text"
                      value={formData.tvgName || ''}
                      onChange={(e) => setFormData({ ...formData, tvgName: e.target.value })}
                      placeholder="BNT 1"
                      className="w-full bg-[#1a202c] border border-[#2d3648] rounded px-2.5 py-1 text-xs font-mono text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    http-user-agent (#EXTVLCOPT / VLC)
                  </label>
                  <input
                    type="text"
                    value={formData.httpUserAgent || ''}
                    onChange={(e) => setFormData({ ...formData, httpUserAgent: e.target.value })}
                    placeholder="Mozilla/5.0 VLC/3.0.18"
                    className="w-full bg-[#1a202c] border border-[#2d3648] rounded px-2.5 py-1 text-xs font-mono text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    http-referrer (#EXTVLCOPT / VLC)
                  </label>
                  <input
                    type="text"
                    value={formData.httpReferrer || ''}
                    onChange={(e) => setFormData({ ...formData, httpReferrer: e.target.value })}
                    placeholder="https://example.com"
                    className="w-full bg-[#1a202c] border border-[#2d3648] rounded px-2.5 py-1 text-xs font-mono text-white"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#252c39] bg-[#12151c]">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-transparent hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
          >
            Отказ
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSave(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#242c3b] hover:bg-[#2f394d] text-slate-200 transition-colors"
              title="Запази и веднага пусни този канал в VLC плеъра"
            >
              <Play className="w-3.5 h-3.5 fill-current text-[#f97316]" />
              <span>Запази & Пусни сега</span>
            </button>

            <button
              type="button"
              onClick={() => handleSave(false)}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-[#f97316] hover:bg-[#ea580c] text-white transition-colors shadow-md"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Запази в листата</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
