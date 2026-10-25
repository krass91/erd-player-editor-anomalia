export interface Channel {
  id: string;
  name: string;
  url: string;
  logo: string;
  group: string;
  tvgId?: string;
  tvgName?: string;
  tvgShift?: string;
  httpUserAgent?: string;
  httpReferrer?: string;
  status?: 'online' | 'offline' | 'checking' | 'untested';
  statusNote?: string;
  resolution?: string;
}

export interface Playlist {
  id: string;
  name: string;
  channels: Channel[];
  createdAt: number;
  updatedAt: number;
  source: 'preset' | 'file' | 'url' | 'custom';
}

export type AspectRatioMode = 'contain' | 'cover' | 'fill' | '16/9' | '4/3' | '21/9';

export interface StreamStats {
  bitrate: number;
  resolution: string;
  fps: number;
  bufferLength: number;
  droppedFrames: number;
  codec: string;
  audioChannels: string;
  isLive: boolean;
  latency?: number;
}

export type LayoutMode = 'split' | 'player-focus' | 'editor-focus' | 'pip';
