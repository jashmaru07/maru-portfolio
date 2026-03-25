import { mkdir, copyFile, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const viteRoot = process.cwd();
const sourceRoot = path.resolve(viteRoot, "..", "photography-portfolio");
const sourceContentPath = path.join(sourceRoot, "data", "content.json");
const sourceUploadsPath = path.join(sourceRoot, "public", "uploads");
const targetUploadsPath = path.join(viteRoot, "public", "uploads");
const snapshotDir = path.join(viteRoot, "src", "data");
const snapshotPath = path.join(snapshotDir, "site-snapshot.json");
const githubSafeLimit = 95 * 1024 * 1024;

const raw = await readFile(sourceContentPath, "utf8");
const content = JSON.parse(raw);

await rm(targetUploadsPath, { recursive: true, force: true });
await mkdir(targetUploadsPath, { recursive: true });
await mkdir(snapshotDir, { recursive: true });

const skipped = [];
const staticMedia = [];

for (const item of content.media || []) {
  const sourceFile = path.join(sourceUploadsPath, item.fileName);

  try {
    const fileStat = await stat(sourceFile);

    if (fileStat.size > githubSafeLimit) {
      skipped.push({
        title: item.title,
        fileName: item.fileName,
        size: fileStat.size,
        reason: "File is too large for a standard GitHub repository push."
      });
      continue;
    }

    await copyFile(sourceFile, path.join(targetUploadsPath, item.fileName));

    staticMedia.push({
      ...item,
      filePath: undefined,
      url: `uploads/${item.fileName}`
    });
  } catch (error) {
    skipped.push({
      title: item.title,
      fileName: item.fileName,
      reason: error.message
    });
  }
}

const snapshot = {
  ...content,
  media: staticMedia,
  exportMeta: {
    exportedAt: new Date().toISOString(),
    skipped
  }
};

await writeFile(snapshotPath, JSON.stringify(snapshot, null, 2) + "\n", "utf8");

console.log(`Exported ${staticMedia.length} media items to ${targetUploadsPath}`);

if (skipped.length) {
  console.log("Skipped items:");
  for (const item of skipped) {
    console.log(`- ${item.title} (${item.fileName}): ${item.reason}`);
  }
}
