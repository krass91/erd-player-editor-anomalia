import { Playlist } from '../types/iptv';
import { DEFAULT_PLAYLISTS } from '../data/defaultPlaylists';

const PLAYLISTS_STORAGE_KEY = 'iptv_erd_playlists_v2_clean';
const ACTIVE_PLAYLIST_KEY = 'iptv_erd_active_playlist_id_v2_clean';
const ACTIVE_CHANNEL_KEY = 'iptv_erd_active_channel_id_v2_clean';
const PLAYER_CONFIG_KEY = 'iptv_erd_player_config_v2_clean';

export interface PlayerConfig {
  volume: number;
  isMuted: boolean;
  aspectRatio: 'contain' | 'cover' | 'fill' | '16/9' | '4/3' | '21/9';
  lastChannelId?: string;
  autoPlay: boolean;
  language: 'bg' | 'en';
}

export function loadStoredPlaylists(): { playlists: Playlist[]; activeId: string } {
  try {
    const raw = localStorage.getItem(PLAYLISTS_STORAGE_KEY);
    let playlists: Playlist[] = [];

    if (raw) {
      playlists = JSON.parse(raw);
    }

    if (!playlists || playlists.length === 0) {
      playlists = DEFAULT_PLAYLISTS;
      savePlaylists(playlists);
    }

    const activeId = localStorage.getItem(ACTIVE_PLAYLIST_KEY) || playlists[0]?.id || '';
    return { playlists, activeId };
  } catch (err) {
    console.error('Failed to load playlists from storage:', err);
    return { playlists: DEFAULT_PLAYLISTS, activeId: DEFAULT_PLAYLISTS[0].id };
  }
}


export function savePlaylists(playlists: Playlist[]): boolean {
  try {
    localStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(playlists));
    return true;
  } catch (err) {
    console.error('Failed to save playlists to localStorage:', err);
    return false;
  }
}

export function saveActivePlaylistId(id: string) {
  try {
    localStorage.setItem(ACTIVE_PLAYLIST_KEY, id);
  } catch {
    // Ignore
  }
}

export function loadPlayerConfig(): PlayerConfig {
  try {
    const raw = localStorage.getItem(PLAYER_CONFIG_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Ignore
  }

  return {
    volume: 85,
    isMuted: false,
    aspectRatio: 'contain',
    autoPlay: true,
    language: 'bg',
  };
}

export function savePlayerConfig(config: Partial<PlayerConfig>) {
  try {
    const current = loadPlayerConfig();
    const merged = { ...current, ...config };
    localStorage.setItem(PLAYER_CONFIG_KEY, JSON.stringify(merged));
  } catch {
    // Ignore
  }
}
