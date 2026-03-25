# Photography Portfolio For GitHub Pages

This Vite app is prepared as a public-only portfolio build for GitHub Pages.

## What Changed

- The public site can run from a static snapshot in `src/data/site-snapshot.json`
- Media for the public site is copied into `public/uploads`
- The Vite app no longer ships the browser-side admin secret
- GitHub Pages deployment is set up in `.github/workflows/deploy-pages.yml`

## Refresh The Static Snapshot

Before building or pushing, export the latest local portfolio content from the original Node app:

```powershell
npm.cmd run export:static
```

That command reads from:

- `..\photography-portfolio\data\content.json`
- `..\photography-portfolio\public\uploads`

And writes to:

- `src\data\site-snapshot.json`
- `public\uploads`

## Large Video Note

GitHub rejects normal Git pushes for files larger than 100 MiB. The export script skips oversized files automatically so deployment does not fail.

For large videos, use one of these options:

- Upload the video to YouTube or Vimeo and link it from the site
- Compress the video below GitHub's normal file size limit
- Keep large media on a proper media host instead of GitHub Pages

## Local Commands

```powershell
npm.cmd install
npm.cmd run export:static
npm.cmd run dev
```

Optional local live-data mode:

- Copy `.env.example` to `.env`
- Keep the original local backend running on `http://localhost:3000`

Production builds for GitHub Pages always use the static snapshot, even if your local `.env` exists.

## Publish To GitHub Pages

1. Create a GitHub repository.
2. Push this branch.
3. In GitHub, open `Settings` > `Pages`.
4. Set the source to `GitHub Actions`.
5. Push changes to `codex/react-vite` or `main`.

The workflow will build and deploy the `dist` folder automatically.
