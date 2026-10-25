# IPTV ERD Player & M3U Editor – Portable Windows App

A standalone, offline desktop app for managing IPTV playlists. Import M3U/M3U8 files, edit channels, watch streams, and automatically find out which channels still work and which need to be replaced.

## Features

- **M3U / M3U8 import and export** – load playlists from a file or URL and export a clean standard playlist
- **Full playlist editor** – edit channel names, stream URLs, logos and groups; duplicate, reorder and delete channels
- **Batch editing** – rename, change category, and search & replace across many channels at once
- **Built-in HLS player** – watch live streams while you edit, with no external player needed
- **Channel tester** – checks every channel and marks it as *Online* or *For replacement*, with the reason (HTTP 404, timeout, empty response, broken HLS segment, and so on)
  - Adjustable timeout and number of parallel checks, with a stop button
  - Filter channels by status
  - Export only working channels, or only the ones that need replacement
  - Delete all offline channels in one click
- **Fully portable** – no installation, no local server. Playlists and settings are stored in the `IPTV-ERD-Data` folder next to the app, so you can carry it on a USB drive

## Download

| File | Description |
|------|-------------|
| `IPTV-ERD-Player-Portable.exe` | Single-file portable app (about 94 MB). It unpacks on first launch, so the first start is a bit slower. |
| `IPTV-ERD-Player-Portable-Folder.zip` | Unzipped folder version. Starts instantly. Run `IPTV-ERD-Player.exe`. |

## Requirements

- Windows 10 or Windows 11, 64-bit
- Internet connection for the streams themselves (the app works offline)

## Notes

- The app is **not code-signed**, so Windows SmartScreen may show a warning. Click **More info → Run anyway**.
- Some antivirus software may flag unsigned executables. If the file is removed, restore it from quarantine and add an exclusion.
- Streams using RTMP, UDP or RTSP cannot be verified by the channel tester and stay marked as *untested*.
- If a working channel is marked "For replacement", try a longer timeout (15 s). Some providers are slow or block by IP, user agent or referrer.

## Built with

React, TypeScript, Vite, Tailwind CSS, hls.js and Electron. 
DONATE REVOLUT 
 revolut.me/krasimqfn
