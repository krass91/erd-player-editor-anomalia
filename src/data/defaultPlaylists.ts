import { Playlist } from '../types/iptv';

export const DEFAULT_PLAYLISTS: Playlist[] = [
  {
    id: 'pl_empty_main',
    name: 'Моята IPTV Листа',
    source: 'custom',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    channels: [],
  },
];
