<!--
// Always meticulous in everyhthing to minimize the case
// Be honest in everything
// Be meticulous in everything
// Dont replace or delete code, coment and explain what and why, the write your change below

WHAT & WHY (PENJELASAN PERUBAHAN):
1. Mengubah nama modul katalog dari "ArchiveTune Modules" menjadi "VoidModules" untuk menyelaraskan branding resmi dengan ekosistem VoidTune (Void Guild).
2. Memperbarui URL katalog ke repositori baru https://github.com/mjurran-zaba/VoidModules dan https://raw.githubusercontent.com/mjurran-zaba/VoidModules/main/registry.json.
3. Menambahkan modul baru "LRCLIB" (penyedia lirik tersinkronisasi .lrc gratis) ke dalam daftar modul resmi.
4. Kode dokumentasi lama tetap dipertahankan di dalam blok komentar ini (non-destructive) sesuai prinsip kehati-hatian.

=================== KODE ASLI SEBELUM PERUBAHAN (ORIGINAL CODE) ===================
# ArchiveTune Modules

Module catalog for [ArchiveTune](https://github.com/rukamori/ArchiveTune).
Browse, submit, and install community-built audio provider modules.

## Add the catalog

In ArchiveTune, open **Settings → Modules → Add → Add catalog URL** and enter:

```text
https://raw.githubusercontent.com/rukamori/ArchiveTuneModules/main/registry.json
```

Refreshing the catalog only updates its entries. Each module is installed or
updated explicitly, and its package must match the `sha256` listed in
`registry.json` before installation review.

To install a single module without the catalog, use **Add module URL** with
the module's raw `.arch` URL, or download the package and use **Import file**.

## Available modules

| Module | Quality | Account |
| --- | --- | --- |
| TIDAL | FLAC, Hi-Res FLAC (DASH), AAC | TIDAL subscription |
| Qobuz | FLAC up to 24-bit/192 kHz, MP3 320 kbps | Qobuz subscription |
| JioSaavn | AAC up to 320 kbps | None |

Modules resolve audio for ArchiveTune's existing playback. They do not add
search pages, home feeds, or new browsing destinations to the app.
===================================================================================
-->

# VoidModules

Official modular catalog and plugin ecosystem for **[VoidTune](https://github.com/mjurran-zaba/VoidTune)**.
Browse, submit, and install community-built audio streaming providers and companion content extensions (Lyrics, Metadata, & Canvas).

## Add the catalog

In VoidTune (or ArchiveTune), open **Settings → Modules → Add → Add catalog URL** and enter:

```text
https://raw.githubusercontent.com/mjurran-zaba/VoidModules/main/registry.json
```

*(You can also simply enter the GitHub repository link `https://github.com/mjurran-zaba/VoidModules`)*

Refreshing the catalog only updates its entries. Each module is installed or
updated explicitly, and its package must match the `sha256` listed in
`registry.json` before installation review.

To install a single module without the catalog, use **Add module URL** with
the module's raw `.arch` URL, or download the package and use **Import file**.

## Available modules

| Module | Type | Quality / Features | Account |
| --- | --- | --- | --- |
| **LRCLIB** | Lyrics Provider | Millisecond-synced (`.lrc`) & plain lyrics | Free / No account |
| **JioSaavn** | Audio Provider | AAC up to 320 kbps | Free / No account |
| **TIDAL** | Audio Provider | FLAC, Hi-Res FLAC (DASH), AAC | TIDAL subscription |
| **Qobuz** | Audio Provider | FLAC up to 24-bit/192 kHz, MP3 320 kbps | Qobuz subscription |

Modules resolve audio streams, lyrics, metadata, and canvas animations for VoidTune's native player engine.

## Submit your module

1. Fork this repository
2. Add your provider source to `extension/<name>/` (`manifest.json`, `provider.js`, and `icon.png`)
3. Package it into `dist/<name>.arch` with the packager (see below)
4. Add your icon image (PNG, 256x256 or 512x512) to `icon/`
5. Add an entry to `registry.json`
   - Ensure `download_url` and `icon_url` point to the raw files in this
     repository (e.g. `https://raw.githubusercontent.com/mjurran-zaba/VoidModules/main/dist/your-module.arch`)
   - Set `sha256` to the SHA-256 of the `.arch` package, in lowercase hex
6. Create a Pull Request

### Registry entry

`registry.json` follows the VoidTune/ArchiveTune extension registry specification:

```json
{
  "id": "moe.rukamori.provider.my-service",
  "name": "my-service",
  "display_name": "My Service",
  "version": "1.0.0",
  "author": "Your name",
  "description": "What the module plays, which qualities it supports, and what account it needs.",
  "download_url": "https://raw.githubusercontent.com/mjurran-zaba/VoidModules/main/dist/my-service.arch",
  "sha256": "<sha256 of dist/my-service.arch>",
  "icon_url": "https://raw.githubusercontent.com/mjurran-zaba/VoidModules/main/icon/my-service.png",
  "category": "download",
  "tags": ["my-service", "lossless"],
  "labels": ["FLAC", "Lossless"],
  "capabilities": ["searchTracks", "getTrackStreamUrl"],
  "downloads": 0,
  "updated_at": "2026-11-25T00:00:00Z"
}
```

- `id`, `version`, `author`, `description`, `labels`, and `capabilities` must
  match the packaged manifest.
- `display_name` is the name shown in the catalog. `labels` and `tags` are
  shown as quality hints, such as Hi-Res or Synced LRC.
- Supported capabilities include: `searchTracks`, `getTrackStreamUrl`, `getLyrics`, `getTrackMetadata`, `getCanvas`.

## Developing the bundled modules

Modules have reviewable source in `extension/<name>/`. Edit the source, bump its manifest version, and run:

```sh
python3 scripts/package_module.py extension/lrclib --check
python3 scripts/package_module.py extension/lrclib dist/lrclib.arch
python3 scripts/package_module.py --inspect dist/lrclib.arch
```

The packager needs Python 3.9 or newer and only its standard library. It
validates the manifest, writes the `provider.js` and icon checksums, and
reports the package SHA-256.

## License

Copyright 2026 Void Guild & contributors.
Licensed under the [GNU Lesser General Public License v3.0 only (LGPL-3.0-only)](LICENSE.md), together with the incorporated [GNU GPL v3.0 terms](COPYING.md). See [NOTICE](NOTICE.md).
