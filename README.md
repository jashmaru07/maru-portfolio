# Photography Portfolio For GitHub Pages And Local Editing

This Vite project now supports two modes:

- `public static mode` for GitHub Pages
- `standalone local mode` with its own API, uploads, and hidden admin

## Local Standalone Mode

The local backend lives inside this same project in `server.cjs`.

Local storage lives in:

- `storage/content.json`
- `storage/admin-access.json`
- `storage/uploads`

The `storage` folder is ignored by Git so your private admin key and large local media do not get pushed.

### Start Everything Locally

```powershell
npm.cmd install
npm.cmd run dev:local
```

That starts:

- Vite frontend on `http://localhost:5173`
- local API on `http://localhost:3000`

Hidden local admin:

- `http://localhost:5173/maru-studio-7c4b92e1f6`

If you prefer separate terminals:

```powershell
npm.cmd run dev:api
npm.cmd run dev
```

## Refresh The Public GitHub Snapshot

Before building or pushing public portfolio changes, export the latest local data:

```powershell
npm.cmd run export:static
```

That command reads from:

- `storage/content.json`
- `storage/uploads`

And writes to:

- `src/data/site-snapshot.json`
- `public/uploads`

## Large Video Note

GitHub rejects normal Git pushes for files larger than 100 MiB. The export script skips oversized files automatically so deployment does not fail.

For large videos, use one of these options:

- Upload the video to YouTube or Vimeo and link it from the site
- Compress the video below GitHub's normal file size limit
- Keep large media on a proper media host instead of GitHub Pages

## Publish To GitHub Pages

Fastest way from PowerShell:

```powershell
npm.cmd run publish:github -- "Update portfolio"
```

That one command will:

- export the latest local admin data
- build the Vite site
- commit the changes
- push the branch to GitHub

You can also double-click:

- `publish-github.cmd`

1. Edit locally through the hidden Vite admin.
2. Run `npm.cmd run export:static`.
3. Commit and push the branch.
4. GitHub Actions builds and deploys the public site.

Public site:

- `https://jashmaru07.github.io/maru-portfolio/`

## Environment

Copy `.env.example` to `.env` for local use.

The local `.env` controls:

- `VITE_API_BASE`
- `VITE_ADMIN_SECRET`
- `VITE_ADMIN_PATH`

Production builds for GitHub Pages do not expose the local admin route or secret.
