import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Volume1,
  Maximize2,
  Minimize2,
  Camera,
  Info,
  RefreshCw,
  Edit3,
  SkipBack,
  SkipForward,
  Tv,
  AlertTriangle,
  ExternalLink,
  Layers,
  Settings2
} from 'lucide-react';
import { Channel, AspectRatioMode, StreamStats } from '../types/iptv';

interface VlcPlayerProps {
  channel: Channel | null;
  onEditChannel: (channel: Channel) => void;
  onPrevChannel: () => void;
  onNextChannel: () => void;
  aspectRatio: AspectRatioMode;
  onAspectRatioChange: (mode: AspectRatioMode) => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  isMuted: boolean;
  onMuteToggle: () => void;
  onOpenDiagnostics: () => void;
  stats: StreamStats;
  setStats: React.Dispatch<React.SetStateAction<StreamStats>>;
}

export const VlcPlayer: React.FC<VlcPlayerProps> = ({
  channel,
  onEditChannel,
  onPrevChannel,
  onNextChannel,
  aspectRatio,
  onAspectRatioChange,
  volume,
  onVolumeChange,
  isMuted,
  onMuteToggle,
  onOpenDiagnostics,
  stats,
  setStats,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [audioTracks, setAudioTracks] = useState<Array<{ id: number; name: string; lang: string }>>([]);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState<number>(-1);
  const [qualityLevels, setQualityLevels] = useState<Array<{ id: number; height: number; bitrate: number }>>([]);
  const [selectedQuality, setSelectedQuality] = useState<number>(-1);
  const [showSettingsMenu, setShowSettingsMenu] = useState<boolean>(false);
  const [screenshotNotification, setScreenshotNotification] = useState<string | null>(null);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize and load stream
  const loadStream = useCallback((ch: Channel) => {
    const video = videoRef.current;
    if (!video) return;

    setIsLoading(true);
    setErrorMessage(null);

    // Destroy existing Hls instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const streamUrl = ch.url.trim();

    if (!streamUrl) {
      setErrorMessage('Липсва стрийм адрес (URL)');
      setIsLoading(false);
      return;
    }

    const isHls = streamUrl.includes('.m3u8') || streamUrl.includes('application/x-mpegurl');

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
      });

      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setIsLoading(false);
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setIsPlaying(true))
            .catch(() => {
              // Browser autoplay policy might require user gesture
              setIsPlaying(false);
            });
        }

        // Quality levels
        if (data.levels && data.levels.length > 0) {
          const levels = data.levels.map((lvl, idx) => ({
            id: idx,
            height: lvl.height,
            bitrate: lvl.bitrate,
          }));
          setQualityLevels(levels);
        }
      });

      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_, data) => {
        if (data.audioTracks) {
          setAudioTracks(
            data.audioTracks.map((tr) => ({
              id: tr.id,
              name: tr.name || `Аудио ${tr.id + 1}`,
              lang: tr.lang || '',
            }))
          );
        }
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        const level = hls.levels[data.level];
        if (level) {
          setStats((prev) => ({
            ...prev,
            resolution: `${level.width || 0}x${level.height || 0}`,
            bitrate: Math.round(level.bitrate / 1000),
            codec: level.videoCodec || prev.codec,
          }));
        }
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setIsLoading(false);
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setErrorMessage('Мрежова грешка при свързване със стрийма. Възможен е CORS блок или офлайн канал.');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setErrorMessage('Грешка във видео формата. Опит за автоматично възстановяване...');
              hls.recoverMediaError();
              break;
            default:
              setErrorMessage(`Неуспешно възпроизвеждане (${data.details})`);
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Apple HLS (Safari)
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      });
      video.addEventListener('error', () => {
        setIsLoading(false);
        setErrorMessage('Грешка при зареждане на стрийма в системния браузър.');
      });
    } else {
      // Direct MP4 / WebM / general video source
      video.src = streamUrl;
      video.addEventListener('loadeddata', () => {
        setIsLoading(false);
        video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      });
      video.addEventListener('error', () => {
        setIsLoading(false);
        setErrorMessage('Форматът или стриймът не може да се зареди директно.');
      });
    }
  }, [setStats]);

  // Load when channel changes
  useEffect(() => {
    if (channel) {
      loadStream(channel);
    } else {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
      }
      setIsPlaying(false);
      setErrorMessage(null);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [channel, loadStream]);

  // Update volume & mute on video element
  useEffect(() => {
    if (videoRef.current) {
      // Map 0-125 to standard 0-1 range for browser (100% = 1.0, 125% scales appropriately)
      const normalizedVolume = Math.min(volume / 100, 1.0);
      videoRef.current.volume = isMuted ? 0 : normalizedVolume;
    }
  }, [volume, isMuted]);

  // Handle Play/Pause
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const stopVideo = () => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
    setIsPlaying(false);
  };

  // Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(console.error);
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Frame screenshot (VLC Snapshot)
  const captureScreenshot = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `VLC_Snapshot_${(channel?.name || 'iptv').replace(/\s+/g, '_')}_${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setScreenshotNotification('Кадърът е запазен успешно!');
        setTimeout(() => setScreenshotNotification(null), 2500);
      }
    } catch {
      setScreenshotNotification('Защитен стрийм (CORS) - скрийншотът е ограничен');
      setTimeout(() => setScreenshotNotification(null), 3000);
    }
  };

  // PiP (Picture in Picture)
  const togglePiP = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
      }
    } catch (err) {
      console.error('PiP failed', err);
    }
  };

  // Switch audio track
  const handleAudioTrackChange = (trackId: number) => {
    if (hlsRef.current) {
      hlsRef.current.audioTrack = trackId;
      setSelectedAudioTrack(trackId);
    }
  };

  // Switch quality
  const handleQualityChange = (levelId: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelId;
      setSelectedQuality(levelId);
    }
  };

  // Mouse activity timeout for controls fadeout
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && isFullscreen) {
        setShowControls(false);
      }
    }, 3500);
  };

  // Aspect ratio class calculation
  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case '16/9':
        return 'aspect-video object-contain';
      case '4/3':
        return 'aspect-[4/3] object-contain';
      case '21/9':
        return 'aspect-[21/9] object-contain';
      case 'cover':
        return 'w-full h-full object-cover';
      case 'fill':
        return 'w-full h-full object-fill';
      case 'contain':
      default:
        return 'w-full h-full object-contain';
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative flex flex-col w-full h-full bg-[#0a0c10] border border-[#222834] rounded-lg overflow-hidden group select-none shadow-2xl"
    >
      {/* Top Bar / Channel Info Header (VLC ERD Window Header) */}
      <div
        className={`absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-3 py-2 bg-gradient-to-b from-black/85 via-black/50 to-transparent transition-opacity duration-200 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          {/* VLC Cone Accent */}
          <div className="w-6 h-6 flex items-center justify-center rounded bg-[#ea580c]/20 text-[#f97316] shrink-0 border border-[#f97316]/40" title="VLC Playback Engine">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M12 2L4 18h16L12 2zm0 3.8L16.2 13H7.8L12 5.8zM6.5 15h11l1 2H5.5l1-2zm-2 3.5h15l.8 1.5H3.7l.8-1.5z" />
            </svg>
          </div>

          {channel?.logo ? (
            <img
              src={channel.logo}
              alt=""
              referrerPolicy="no-referrer"
              className="w-6 h-6 object-contain rounded bg-black/40 border border-white/10 p-0.5 shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-6 h-6 rounded bg-[#1e2430] flex items-center justify-center text-slate-400 shrink-0 text-[10px] font-bold">
              TV
            </div>
          )}

          <div className="flex items-center gap-2 truncate">
            <span className="text-sm font-semibold text-white truncate">
              {channel ? channel.name : 'Няма избран канал'}
            </span>
            {channel?.group && (
              <span className="text-xs text-slate-400 border border-white/10 px-1.5 py-0.5 rounded bg-black/40 hidden sm:inline-block">
                {channel.group}
              </span>
            )}
            {stats.resolution && (
              <span className="text-[11px] font-mono text-[#f97316] bg-[#f97316]/10 px-1.5 py-0.5 rounded border border-[#f97316]/30 hidden md:inline-block">
                {stats.resolution}
              </span>
            )}
          </div>
        </div>

        {/* Quick action buttons on top bar */}
        <div className="flex items-center gap-1 shrink-0">
          {channel && (
            <button
              onClick={() => onEditChannel(channel)}
              className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded bg-[#f97316] hover:bg-[#ea580c] text-white transition-colors shadow-sm"
              title="Редактирай параметрите на този канал в реално време"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Редактирай канал</span>
            </button>
          )}

          <button
            onClick={() => channel && loadStream(channel)}
            className="p-1.5 rounded hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            title="Презареди стрийм"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenDiagnostics}
            className="p-1.5 rounded hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            title="VLC Информация за кодека и стрийма"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Video Surface */}
      <div className="relative flex-1 flex items-center justify-center bg-black overflow-hidden">
        <video
          ref={videoRef}
          onClick={togglePlay}
          className={`cursor-pointer transition-all duration-150 ${getAspectRatioClass()}`}
          playsInline
        />

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 backdrop-blur-xs text-white">
            <div className="relative w-12 h-12 mb-3">
              <div className="absolute inset-0 rounded-full border-2 border-slate-700"></div>
              <div className="absolute inset-0 rounded-full border-2 border-t-[#f97316] animate-spin"></div>
              <div className="absolute inset-2 flex items-center justify-center text-[#f97316]">
                <Tv className="w-5 h-5 animate-pulse" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-200">Зареждане на VLC стрийм...</p>
            {channel?.name && <p className="text-xs text-slate-400 mt-1 max-w-xs text-center truncate">{channel.name}</p>}
          </div>
        )}

        {/* Error Screen with Quick Solutions */}
        {errorMessage && !isLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/85 p-6 text-center text-white">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="text-base font-semibold text-slate-100 mb-1">Грешка при възпроизвеждане</h4>
            <p className="text-xs text-slate-400 max-w-md mb-4">{errorMessage}</p>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => channel && loadStream(channel)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-[#2a3240] hover:bg-[#384355] text-white transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Опитай отново
              </button>

              {channel && (
                <button
                  onClick={() => onEditChannel(channel)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-[#f97316] hover:bg-[#ea580c] text-white transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Смени стрийм URL / Редактирай
                </button>
              )}

              {channel?.url && (
                <a
                  href={channel.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-transparent border border-slate-700 hover:border-slate-500 text-slate-300 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Отвори директно
                </a>
              )}
            </div>
          </div>
        )}

        {/* No Channel Selected State */}
        {!channel && (
          <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <div className="w-16 h-16 rounded-2xl bg-[#161a23] border border-[#262c3b] flex items-center justify-center text-[#f97316] mb-4 shadow-lg">
              <Tv className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold text-slate-200 mb-1">Няма избран телевизионен канал</h3>
            <p className="text-xs text-slate-400 max-w-sm">
              Изберете канал от долния IPTV списък или заредете нов M3U плейлист за незабавно възпроизвеждане.
            </p>
          </div>
        )}

        {/* Screenshot Banner Notification */}
        {screenshotNotification && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-40 bg-black/90 text-white text-xs px-4 py-2 rounded-lg border border-[#f97316]/50 shadow-xl flex items-center gap-2">
            <Camera className="w-4 h-4 text-[#f97316]" />
            <span>{screenshotNotification}</span>
          </div>
        )}
      </div>

      {/* VLC Classic Dark Player Control Bar */}
      <div
        className={`relative z-30 bg-[#161922] border-t border-[#232a36] px-3 py-2 flex flex-col gap-1.5 transition-opacity duration-200 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Progress / Stream Status Bar */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              НА ЖИВО (LIVE)
            </span>
            <span className="text-slate-600">|</span>
            <span className="truncate max-w-[200px] text-slate-300">
              {channel?.name || 'VLC Engine'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {stats.bitrate > 0 && (
              <span className="tabular-nums text-slate-300">
                {stats.bitrate} kb/s
              </span>
            )}
            <span className="text-slate-400">
              Мащаб: <strong className="text-white font-medium uppercase">{aspectRatio}</strong>
            </span>
          </div>
        </div>

        {/* Primary Controls Row */}
        <div className="flex items-center justify-between gap-2">
          {/* Left: Playback buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={onPrevChannel}
              className="p-1.5 rounded hover:bg-[#252c3b] text-slate-300 hover:text-white transition-colors"
              title="Предишен канал"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              disabled={!channel}
              className="w-8 h-8 rounded-full bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-40 text-white flex items-center justify-center transition-transform active:scale-95 shadow-md"
              title={isPlaying ? 'Пауза (Space)' : 'Пусни (Space)'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>

            <button
              onClick={stopVideo}
              disabled={!channel}
              className="p-1.5 rounded hover:bg-[#252c3b] disabled:opacity-40 text-slate-300 hover:text-white transition-colors"
              title="Спри възпроизвеждането"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>

            <button
              onClick={onNextChannel}
              className="p-1.5 rounded hover:bg-[#252c3b] text-slate-300 hover:text-white transition-colors"
              title="Следващ канал"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Middle: Volume control with VLC Boost style */}
          <div className="flex items-center gap-2 max-w-[180px] w-full">
            <button
              onClick={onMuteToggle}
              className="p-1 rounded text-slate-300 hover:text-white transition-colors shrink-0"
              title="Заглуши / Включи звук (M)"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : volume < 50 ? (
                <Volume1 className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4 text-[#f97316]" />
              )}
            </button>

            <div className="flex items-center gap-1.5 w-full">
              <input
                type="range"
                min="0"
                max="125"
                value={isMuted ? 0 : volume}
                onChange={(e) => onVolumeChange(Number(e.target.value))}
                className="w-full h-1.5 bg-[#252d3a] rounded-lg appearance-none cursor-pointer"
                title={`Сила на звука: ${volume}% (VLC boost до 125%)`}
              />
              <span className="text-[11px] font-mono text-slate-300 tabular-nums w-8 text-right shrink-0">
                {isMuted ? '0%' : `${volume}%`}
              </span>
            </div>
          </div>

          {/* Right: Quick Tools (Aspect ratio, Tracks, Screenshot, PiP, Fullscreen) */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Aspect Ratio Cycler */}
            <button
              onClick={() => {
                const modes: AspectRatioMode[] = ['contain', '16/9', '4/3', 'cover', 'fill'];
                const nextIdx = (modes.indexOf(aspectRatio) + 1) % modes.length;
                onAspectRatioChange(modes[nextIdx]);
              }}
              className="px-2 py-1 text-[11px] font-medium rounded bg-[#202634] hover:bg-[#2c3547] text-slate-200 transition-colors border border-white/5"
              title="Смени формат на картината (Aspect Ratio)"
            >
              {aspectRatio === 'contain' ? 'Auto' : aspectRatio}
            </button>

            {/* Snapshot */}
            <button
              onClick={captureScreenshot}
              className="p-1.5 rounded hover:bg-[#252c3b] text-slate-300 hover:text-white transition-colors"
              title="Направи кадър / Скрийншот (VLC Snapshot)"
            >
              <Camera className="w-4 h-4" />
            </button>

            {/* PiP */}
            <button
              onClick={togglePiP}
              className="p-1.5 rounded hover:bg-[#252c3b] text-slate-300 hover:text-white transition-colors"
              title="Картина в картината (Picture in Picture)"
            >
              <Layers className="w-4 h-4" />
            </button>

            {/* Settings Menu Toggle (Audio tracks, Quality) */}
            <div className="relative">
              <button
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                className={`p-1.5 rounded transition-colors ${
                  showSettingsMenu ? 'bg-[#f97316] text-white' : 'hover:bg-[#252c3b] text-slate-300 hover:text-white'
                }`}
                title="Аудио писти и Качество"
              >
                <Settings2 className="w-4 h-4" />
              </button>

              {/* Settings Dropdown Popover */}
              {showSettingsMenu && (
                <div className="absolute bottom-full right-0 mb-2 w-56 bg-[#181d26] border border-[#2a3342] rounded-lg shadow-2xl p-2.5 z-50 text-xs">
                  <div className="font-semibold text-slate-200 border-b border-white/10 pb-1.5 mb-2 flex items-center justify-between">
                    <span>VLC Настройки стрийм</span>
                    <button onClick={() => setShowSettingsMenu(false)} className="text-slate-400 hover:text-white">✕</button>
                  </div>

                  {/* Audio tracks */}
                  <div className="mb-3">
                    <div className="text-[11px] font-medium text-slate-400 mb-1">Аудио писта:</div>
                    {audioTracks.length > 0 ? (
                      <div className="space-y-1">
                        {audioTracks.map((tr) => (
                          <button
                            key={tr.id}
                            onClick={() => handleAudioTrackChange(tr.id)}
                            className={`w-full text-left px-2 py-1 rounded text-xs flex items-center justify-between ${
                              selectedAudioTrack === tr.id ? 'bg-[#f97316]/20 text-[#f97316] font-medium' : 'hover:bg-white/5 text-slate-300'
                            }`}
                          >
                            <span>{tr.name}</span>
                            {tr.lang && <span className="uppercase text-[10px] text-slate-500 font-mono">{tr.lang}</span>}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 italic">Основна стерео писта (Default)</p>
                    )}
                  </div>

                  {/* Quality levels */}
                  <div>
                    <div className="text-[11px] font-medium text-slate-400 mb-1">Видео резолюция / Качество:</div>
                    {qualityLevels.length > 0 ? (
                      <div className="space-y-1">
                        <button
                          onClick={() => handleQualityChange(-1)}
                          className={`w-full text-left px-2 py-1 rounded text-xs ${
                            selectedQuality === -1 ? 'bg-[#f97316]/20 text-[#f97316] font-medium' : 'hover:bg-white/5 text-slate-300'
                          }`}
                        >
                          Автоматично (Auto Adaptive)
                        </button>
                        {qualityLevels.map((lvl) => (
                          <button
                            key={lvl.id}
                            onClick={() => handleQualityChange(lvl.id)}
                            className={`w-full text-left px-2 py-1 rounded text-xs flex items-center justify-between ${
                              selectedQuality === lvl.id ? 'bg-[#f97316]/20 text-[#f97316] font-medium' : 'hover:bg-white/5 text-slate-300'
                            }`}
                          >
                            <span>{lvl.height}p</span>
                            <span className="text-[10px] text-slate-500 tabular-nums">{Math.round(lvl.bitrate / 1000)}k</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 italic">Автоматично качество от източника</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded hover:bg-[#252c3b] text-slate-300 hover:text-white transition-colors"
              title={isFullscreen ? 'Излез от цял екран (F)' : 'Цял екран (F)'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
