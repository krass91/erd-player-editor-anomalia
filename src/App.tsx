import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { VlcPlayer } from './components/VlcPlayer';
import { ErdEditor } from './components/ErdEditor';
import { ChannelEditModal } from './components/ChannelEditModal';
import { BatchEditModal } from './components/BatchEditModal';
import { ImportPlaylistModal } from './components/ImportPlaylistModal';
import { StreamDiagnosticsModal } from './components/StreamDiagnosticsModal';
import { DesktopRunnerModal } from './components/DesktopRunnerModal';
import { TopMenuBar } from './components/TopMenuBar';
import { HelpModal } from './components/HelpModal';
import {
  Channel,
  Playlist,
  AspectRatioMode,
  StreamStats,
  LayoutMode,
} from './types/iptv';
import {
  loadStoredPlaylists,
  savePlaylists,
  saveActivePlaylistId,
  loadPlayerConfig,
  savePlayerConfig,
} from './utils/storage';

export default function App() {
  // Load state from local storage
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    const { playlists } = loadStoredPlaylists();
    return playlists;
  });

  const [activePlaylistId, setActivePlaylistId] = useState<string>(() => {
    const { activeId } = loadStoredPlaylists();
    return activeId;
  });

  // Active playlist derived
  const activePlaylist = useMemo(() => {
    const found = playlists.find((p) => p.id === activePlaylistId);
    return found || playlists[0];
  }, [playlists, activePlaylistId]);

  // Currently playing channel
  const [activeChannel, setActiveChannel] = useState<Channel | null>(() => {
    const { playlists, activeId } = loadStoredPlaylists();
    const curr = playlists.find((p) => p.id === activeId) || playlists[0];
    return curr?.channels[0] || null;
  });

  // Player configuration
  const [playerConfig, setPlayerConfig] = useState(() => loadPlayerConfig());
  const [aspectRatio, setAspectRatio] = useState<AspectRatioMode>(playerConfig.aspectRatio || 'contain');
  const [volume, setVolume] = useState<number>(playerConfig.volume ?? 85);
  const [isMuted, setIsMuted] = useState<boolean>(playerConfig.isMuted ?? false);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('split');

  // Stream stats for VLC Media Info
  const [stats, setStats] = useState<StreamStats>({
    bitrate: 0,
    resolution: '',
    fps: 30,
    bufferLength: 0,
    droppedFrames: 0,
    codec: 'H.264 / AAC',
    audioChannels: 'Stereo',
    isLive: true,
  });

  // Modal states
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  const [batchSelectedIds, setBatchSelectedIds] = useState<string[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<number | null>(Date.now());
  const [isCheckingStatus, setIsCheckingStatus] = useState<boolean>(false);

  // Sync playlists to localStorage whenever updated
  useEffect(() => {
    if (playlists.length > 0) {
      savePlaylists(playlists);
      setLastSavedTime(Date.now());
    }
  }, [playlists]);

  // Save active playlist ID
  useEffect(() => {
    if (activePlaylistId) {
      saveActivePlaylistId(activePlaylistId);
    }
  }, [activePlaylistId]);

  // Save player preferences
  const updatePlayerVolume = (newVol: number) => {
    setVolume(newVol);
    if (newVol > 0 && isMuted) {
      setIsMuted(false);
      savePlayerConfig({ volume: newVol, isMuted: false });
    } else {
      savePlayerConfig({ volume: newVol });
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    savePlayerConfig({ isMuted: nextMuted });
  };

  const handleAspectRatioChange = (mode: AspectRatioMode) => {
    setAspectRatio(mode);
    savePlayerConfig({ aspectRatio: mode });
  };

  // Channel switcher (Prev / Next)
  const handlePrevChannel = useCallback(() => {
    if (!activePlaylist || activePlaylist.channels.length === 0) return;
    const currentIndex = activePlaylist.channels.findIndex((c) => c.id === activeChannel?.id);
    if (currentIndex <= 0) {
      setActiveChannel(activePlaylist.channels[activePlaylist.channels.length - 1]);
    } else {
      setActiveChannel(activePlaylist.channels[currentIndex - 1]);
    }
  }, [activePlaylist, activeChannel]);

  const handleNextChannel = useCallback(() => {
    if (!activePlaylist || activePlaylist.channels.length === 0) return;
    const currentIndex = activePlaylist.channels.findIndex((c) => c.id === activeChannel?.id);
    if (currentIndex === -1 || currentIndex >= activePlaylist.channels.length - 1) {
      setActiveChannel(activePlaylist.channels[0]);
    } else {
      setActiveChannel(activePlaylist.channels[currentIndex + 1]);
    }
  }, [activePlaylist, activeChannel]);

  // Save edited channel in real-time
  const handleSaveChannel = (updatedChannel: Channel, playImmediately?: boolean) => {
    setPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id !== activePlaylist.id) return pl;

        const exists = pl.channels.some((c) => c.id === updatedChannel.id);
        const newChannels = exists
          ? pl.channels.map((c) => (c.id === updatedChannel.id ? updatedChannel : c))
          : [...pl.channels, updatedChannel];

        return {
          ...pl,
          channels: newChannels,
          updatedAt: Date.now(),
        };
      })
    );

    // If this channel is currently playing or requested to play immediately, update activeChannel
    if (playImmediately || (activeChannel && activeChannel.id === updatedChannel.id)) {
      setActiveChannel(updatedChannel);
    }
  };

  // Delete channel
  const handleDeleteChannel = (channelId: string) => {
    setPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id !== activePlaylist.id) return pl;
        return {
          ...pl,
          channels: pl.channels.filter((c) => c.id !== channelId),
          updatedAt: Date.now(),
        };
      })
    );

    if (activeChannel?.id === channelId) {
      const remaining = activePlaylist.channels.filter((c) => c.id !== channelId);
      setActiveChannel(remaining[0] || null);
    }
  };

  // Duplicate channel
  const handleDuplicateChannel = (channel: Channel) => {
    const duplicated: Channel = {
      ...channel,
      id: `ch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `${channel.name} (Копие)`,
    };

    setPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id !== activePlaylist.id) return pl;
        return {
          ...pl,
          channels: [...pl.channels, duplicated],
          updatedAt: Date.now(),
        };
      })
    );
  };

  // Move channel up / down in playlist order
  const handleMoveChannel = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= activePlaylist.channels.length) return;

    setPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id !== activePlaylist.id) return pl;
        const newChannels = [...pl.channels];
        const temp = newChannels[index];
        newChannels[index] = newChannels[targetIndex];
        newChannels[targetIndex] = temp;
        return {
          ...pl,
          channels: newChannels,
          updatedAt: Date.now(),
        };
      })
    );
  };

  // Add new empty channel
  const handleAddChannel = () => {
    const newChan: Channel = {
      id: `ch_${Date.now()}`,
      name: `Нов канал ${activePlaylist.channels.length + 1}`,
      url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      logo: '',
      group: 'Общи',
      status: 'untested',
    };
    setEditingChannel(newChan);
    setIsEditModalOpen(true);
  };

  // Open edit channel modal
  const handleOpenEditChannel = (channel: Channel) => {
    setEditingChannel(channel);
    setIsEditModalOpen(true);
  };

  // Batch actions
  const handleOpenBatchEdit = (selectedIds: string[]) => {
    setBatchSelectedIds(selectedIds);
    setIsBatchModalOpen(true);
  };

  const handleApplyBatchGroup = (newGroup: string) => {
    setPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id !== activePlaylist.id) return pl;
        return {
          ...pl,
          channels: pl.channels.map((c) =>
            batchSelectedIds.includes(c.id) ? { ...c, group: newGroup } : c
          ),
          updatedAt: Date.now(),
        };
      })
    );
  };

  const handleApplyNamePrefixSuffix = (prefix: string, suffix: string) => {
    setPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id !== activePlaylist.id) return pl;
        return {
          ...pl,
          channels: pl.channels.map((c) => {
            if (batchSelectedIds.includes(c.id)) {
              return {
                ...c,
                name: `${prefix || ''}${c.name}${suffix || ''}`,
              };
            }
            return c;
          }),
          updatedAt: Date.now(),
        };
      })
    );
  };

  const handleApplySearchReplace = (find: string, replace: string, target: 'name' | 'url') => {
    if (!find) return;
    setPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id !== activePlaylist.id) return pl;
        return {
          ...pl,
          channels: pl.channels.map((c) => {
            if (batchSelectedIds.includes(c.id)) {
              if (target === 'name') {
                return { ...c, name: c.name.split(find).join(replace) };
              } else {
                return { ...c, url: c.url.split(find).join(replace) };
              }
            }
            return c;
          }),
          updatedAt: Date.now(),
        };
      })
    );
  };

  const handleBatchDelete = () => {
    setPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id !== activePlaylist.id) return pl;
        return {
          ...pl,
          channels: pl.channels.filter((c) => !batchSelectedIds.includes(c.id)),
          updatedAt: Date.now(),
        };
      })
    );
    setBatchSelectedIds([]);
  };

  // Import playlist callback
  const handleImportSuccess = (imported: Playlist, mode: 'new' | 'append' | 'replace') => {
    if (mode === 'new') {
      setPlaylists((prev) => [imported, ...prev]);
      setActivePlaylistId(imported.id);
      if (imported.channels.length > 0) {
        setActiveChannel(imported.channels[0]);
      }
    } else if (mode === 'append') {
      setPlaylists((prev) =>
        prev.map((pl) => {
          if (pl.id !== activePlaylist.id) return pl;
          return {
            ...pl,
            channels: [...pl.channels, ...imported.channels],
            updatedAt: Date.now(),
          };
        })
      );
    } else if (mode === 'replace') {
      setPlaylists((prev) =>
        prev.map((pl) => {
          if (pl.id !== activePlaylist.id) return pl;
          return {
            ...pl,
            name: imported.name || pl.name,
            channels: imported.channels,
            updatedAt: Date.now(),
          };
        })
      );
      if (imported.channels.length > 0) {
        setActiveChannel(imported.channels[0]);
      }
    }
  };

  // Check channels status
  const handleCheckChannelsStatus = async () => {
    setIsCheckingStatus(true);
    const updatedChannels = [...activePlaylist.channels];

    for (let i = 0; i < Math.min(updatedChannels.length, 15); i++) {
      const ch = updatedChannels[i];
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(ch.url, {
          method: 'HEAD',
          signal: controller.signal,
          mode: 'no-cors', // standard cross-origin test for media links
        });
        clearTimeout(timeoutId);
        updatedChannels[i] = { ...ch, status: 'online' };
      } catch {
        // If fetch fails or aborts
        updatedChannels[i] = { ...ch, status: 'offline' };
      }
    }

    setPlaylists((prev) =>
      prev.map((pl) => (pl.id === activePlaylist.id ? { ...pl, channels: updatedChannels } : pl))
    );
    setIsCheckingStatus(false);
  };

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in form inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        // Toggle play state via trigger or click
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextChannel();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevChannel();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        updatePlayerVolume(Math.min(volume + 5, 125));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        updatePlayerVolume(Math.max(volume - 5, 0));
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [volume, handleNextChannel, handlePrevChannel]);

  // Extract all unique categories across active playlist
  const existingGroups = useMemo(() => {
    const set = new Set<string>(['Общи', 'Новини', 'Спорт', 'Филми', 'Музика', 'Детски', 'Документални']);
    activePlaylist.channels.forEach((c) => {
      if (c.group) set.add(c.group);
    });
    return Array.from(set);
  }, [activePlaylist]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0f1218] text-slate-100 overflow-hidden font-sans">
      {/* Native Desktop Window Menu Bar */}
      <TopMenuBar
        layoutMode={layoutMode}
        onLayoutModeChange={setLayoutMode}
        onNewPlaylist={() => {
          setIsImportModalOpen(true);
        }}
        onOpenImport={() => setIsImportModalOpen(true)}
        onOpenExport={() => setIsExportModalOpen(true)}
        onAddChannel={handleAddChannel}
        onTogglePlay={() => {}}
        isPlaying={true}
        onNextChannel={handleNextChannel}
        onPrevChannel={handlePrevChannel}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Main Workspace Area based on Layout Mode */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden p-2 gap-2">
        {/* VLC Player Area */}
        <div
          className={`transition-all duration-200 flex flex-col min-h-[260px] ${
            layoutMode === 'player-focus'
              ? 'w-full md:w-3/4 h-[55vh] md:h-full'
              : layoutMode === 'editor-focus'
              ? 'fixed bottom-4 right-4 z-40 w-80 h-52 shadow-2xl rounded-lg border-2 border-[#f97316]'
              : 'w-full md:w-[48%] lg:w-[42%] h-[40vh] md:h-full'
          }`}
        >
          <VlcPlayer
            channel={activeChannel}
            onEditChannel={handleOpenEditChannel}
            onPrevChannel={handlePrevChannel}
            onNextChannel={handleNextChannel}
            aspectRatio={aspectRatio}
            onAspectRatioChange={handleAspectRatioChange}
            volume={volume}
            onVolumeChange={updatePlayerVolume}
            isMuted={isMuted}
            onMuteToggle={toggleMute}
            onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
            stats={stats}
            setStats={setStats}
          />
        </div>

        {/* IPTV ERD Editor Area */}
        <div
          className={`flex-1 flex flex-col overflow-hidden transition-all duration-200 ${
            layoutMode === 'player-focus'
              ? 'w-full md:w-1/4 h-[45vh] md:h-full'
              : layoutMode === 'editor-focus'
              ? 'w-full h-full'
              : 'w-full md:w-[52%] lg:w-[58%] h-[60vh] md:h-full'
          }`}
        >
          <ErdEditor
            playlists={playlists}
            activePlaylist={activePlaylist}
            onSelectPlaylist={setActivePlaylistId}
            activeChannel={activeChannel}
            onPlayChannel={setActiveChannel}
            onEditChannel={handleOpenEditChannel}
            onDeleteChannel={handleDeleteChannel}
            onDuplicateChannel={handleDuplicateChannel}
            onMoveChannel={handleMoveChannel}
            onAddChannel={handleAddChannel}
            onOpenBatchEdit={handleOpenBatchEdit}
            onOpenImportModal={() => setIsImportModalOpen(true)}
            onOpenExportModal={() => setIsExportModalOpen(true)}
            lastSavedTime={lastSavedTime}
            onCheckChannelsStatus={handleCheckChannelsStatus}
            isCheckingStatus={isCheckingStatus}
          />
        </div>
      </main>

      {/* Modals and Drawers */}
      <ChannelEditModal
        channel={editingChannel}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingChannel(null);
        }}
        onSave={handleSaveChannel}
        existingGroups={existingGroups}
      />

      <BatchEditModal
        selectedChannelIds={batchSelectedIds}
        channels={activePlaylist.channels}
        isOpen={isBatchModalOpen}
        onClose={() => {
          setIsBatchModalOpen(false);
          setBatchSelectedIds([]);
        }}
        onApplyBatchGroup={handleApplyBatchGroup}
        onApplyNamePrefixSuffix={handleApplyNamePrefixSuffix}
        onApplySearchReplace={handleApplySearchReplace}
        onBatchDelete={handleBatchDelete}
        existingGroups={existingGroups}
      />

      <ImportPlaylistModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={handleImportSuccess}
      />

      <DesktopRunnerModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        channels={activePlaylist.channels}
        playlistName={activePlaylist.name}
      />

      <StreamDiagnosticsModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
        channel={activeChannel}
        stats={stats}
      />

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
