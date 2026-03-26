const express = require("express");
const multer = require("multer");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env"), quiet: true });

const app = express();
const PORT = Number(process.env.PORT || 3000);

const rootDir = __dirname;
const storageDir = path.join(rootDir, "storage");
const uploadsDir = path.join(storageDir, "uploads");
const contentFile = path.join(storageDir, "content.json");
const adminAccessFile = path.join(storageDir, "admin-access.json");
const snapshotFile = path.join(rootDir, "src", "data", "site-snapshot.json");

const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173"
]);

function readSnapshotContent() {
  try {
    const raw = fs.readFileSync(snapshotFile, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (_error) {
    return {};
  }
}

const snapshotDefaults = readSnapshotContent();

const defaultContent = {
  identity: {
    displayName: snapshotDefaults.identity?.displayName || "Maru Labutap",
    role: snapshotDefaults.identity?.role || "Photographer / Videographer",
    eyebrow: snapshotDefaults.identity?.eyebrow || "Cinematic stories in stills and motion",
    heroTitle:
      snapshotDefaults.identity?.heroTitle || "Classic visuals crafted for people, brands, and memorable events.",
    heroDescription:
      snapshotDefaults.identity?.heroDescription ||
      "I create warm portrait photography, polished event coverage, and story-driven videos that feel timeless, personal, and easy to revisit.",
    specialties: Array.isArray(snapshotDefaults.identity?.specialties)
      ? snapshotDefaults.identity.specialties
      : ["Portrait Sessions", "Events", "Brand Films", "Short Reels"],
    focus: snapshotDefaults.identity?.focus || "Portraits, visual storytelling, and modern event films"
  },
  about: {
    heading: snapshotDefaults.about?.heading || "A portfolio built around calm direction and clean storytelling.",
    body:
      snapshotDefaults.about?.body ||
      "Every project starts with people first. Whether it is a portrait session, a client event, or a short-form campaign, the goal is always to create images and videos that feel clear, natural, and lasting.",
    quote:
      snapshotDefaults.about?.quote ||
      "Good visuals should feel effortless, even when every detail is intentional.",
    services: Array.isArray(snapshotDefaults.about?.services)
      ? snapshotDefaults.about.services
      : [
          "Portrait photography",
          "Event photo and video coverage",
          "Social media reels",
          "Brand storytelling content"
        ],
    availability:
      snapshotDefaults.about?.availability ||
      "Available for portraits, campaigns, event coverage, and creative collaborations."
  },
  contact: {
    email: snapshotDefaults.contact?.email || "",
    phone: snapshotDefaults.contact?.phone || "",
    location: snapshotDefaults.contact?.location || "Manila, Philippines",
    instagram: snapshotDefaults.contact?.instagram || "https://instagram.com/",
    videoLink: snapshotDefaults.contact?.videoLink || "https://youtube.com/"
  },
  media: [],
  updatedAt: new Date().toISOString()
};

function normalizeArray(value, fallback) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n|,/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return fallback;
}

function normalizeContent(content) {
  const next = content && typeof content === "object" ? content : {};

  return {
    identity: {
      displayName: String(next.identity?.displayName || defaultContent.identity.displayName).trim(),
      role: String(next.identity?.role || defaultContent.identity.role).trim(),
      eyebrow: String(next.identity?.eyebrow || defaultContent.identity.eyebrow).trim(),
      heroTitle: String(next.identity?.heroTitle || defaultContent.identity.heroTitle).trim(),
      heroDescription: String(next.identity?.heroDescription || defaultContent.identity.heroDescription).trim(),
      specialties: normalizeArray(next.identity?.specialties, defaultContent.identity.specialties),
      focus: String(next.identity?.focus || defaultContent.identity.focus).trim()
    },
    about: {
      heading: String(next.about?.heading || defaultContent.about.heading).trim(),
      body: String(next.about?.body || defaultContent.about.body).trim(),
      quote: String(next.about?.quote || defaultContent.about.quote).trim(),
      services: normalizeArray(next.about?.services, defaultContent.about.services),
      availability: String(next.about?.availability || defaultContent.about.availability).trim()
    },
    contact: {
      email: String(next.contact?.email || "").trim(),
      phone: String(next.contact?.phone || "").trim(),
      location: String(next.contact?.location || defaultContent.contact.location).trim(),
      instagram: String(next.contact?.instagram || "").trim(),
      videoLink: String(next.contact?.videoLink || "").trim()
    },
    media: Array.isArray(next.media)
      ? next.media.map((item) => ({
          id: String(item.id || ""),
          title: String(item.title || "Untitled").trim(),
          category: String(item.category || "Portfolio").trim(),
          description: String(item.description || "").trim(),
          featured: Boolean(item.featured),
          type: item.type === "video" ? "video" : "image",
          source: item.source === "external" ? "external" : "upload",
          provider: String(item.provider || "").trim().toLowerCase(),
          videoId: String(item.videoId || "").trim(),
          externalUrl: String(item.externalUrl || "").trim(),
          embedUrl: String(item.embedUrl || "").trim(),
          thumbnailUrl: String(item.thumbnailUrl || "").trim(),
          fileName: String(item.fileName || "").trim(),
          filePath: String(item.filePath || "").trim(),
          url: String(item.url || "").trim(),
          createdAt: String(item.createdAt || new Date().toISOString()),
          updatedAt: String(item.updatedAt || new Date().toISOString())
        }))
      : [],
    updatedAt: String(next.updatedAt || new Date().toISOString())
  };
}

function writeContent(content) {
  const normalized = normalizeContent(content);
  normalized.updatedAt = new Date().toISOString();
  fs.writeFileSync(contentFile, JSON.stringify(normalized, null, 2), "utf8");
  return normalized;
}

function readContent() {
  try {
    const raw = fs.readFileSync(contentFile, "utf8");
    return normalizeContent(JSON.parse(raw));
  } catch (_error) {
    return normalizeContent(defaultContent);
  }
}

function readAdminAccess() {
  const fallback = {
    pathSegment: String(process.env.VITE_ADMIN_PATH || "/maru-studio-7c4b92e1f6").replace(/^\/+/, ""),
    apiKey: String(process.env.VITE_ADMIN_SECRET || "replace-with-a-local-secret").trim()
  };

  try {
    const raw = fs.readFileSync(adminAccessFile, "utf8");
    const parsed = JSON.parse(raw);
    return {
      pathSegment: String(parsed.pathSegment || fallback.pathSegment).replace(/^\/+/, "").trim(),
      apiKey: String(parsed.apiKey || fallback.apiKey).trim()
    };
  } catch (_error) {
    fs.writeFileSync(adminAccessFile, JSON.stringify(fallback, null, 2), "utf8");
    return fallback;
  }
}

function ensureSetup() {
  fs.mkdirSync(storageDir, { recursive: true });
  fs.mkdirSync(uploadsDir, { recursive: true });

  if (!fs.existsSync(contentFile)) {
    writeContent(defaultContent);
  }

  if (!fs.existsSync(adminAccessFile)) {
    readAdminAccess();
  }
}

function toSlug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function createId() {
  return `media-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function parseBoolean(value) {
  return value === true || value === "true" || value === "on" || value === "1";
}

function upgradeVimeoThumbnailUrl(value) {
  const next = String(value || "").trim();

  if (!next.includes("i.vimeocdn.com/video/")) {
    return next;
  }

  return next.replace(/-d_\d+x\d+(?=[?#]|$)/i, "-d_1280").replace(/-d_\d+(?=[?#]|$)/i, "-d_1280");
}

function parseVimeoUrl(value) {
  let parsed;

  try {
    parsed = new URL(String(value || "").trim());
  } catch (_error) {
    throw new Error("Please paste a valid Vimeo link.");
  }

  const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
  if (host !== "vimeo.com" && host !== "player.vimeo.com") {
    throw new Error("Only Vimeo links are supported here.");
  }

  const match = parsed.pathname.match(/\/(?:video\/)?(\d+)/i);
  if (!match) {
    throw new Error("Could not find a Vimeo video ID in that link.");
  }

  const videoId = match[1];
  return {
    videoId,
    canonicalUrl: `https://vimeo.com/${videoId}`,
    embedUrl: `https://player.vimeo.com/video/${videoId}?autoplay=1&title=0&byline=0&portrait=0`
  };
}

async function fetchVimeoMetadata(url) {
  const parsed = parseVimeoUrl(url);
  const endpoint = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(parsed.canonicalUrl)}&width=1280`;
  const response = await fetch(endpoint, {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error("Could not load the title from Vimeo right now.");
  }

  const payload = await response.json();
  return {
    provider: "vimeo",
    source: "external",
    videoId: parsed.videoId,
    externalUrl: parsed.canonicalUrl,
    embedUrl: parsed.embedUrl,
    thumbnailUrl: upgradeVimeoThumbnailUrl(payload.thumbnail_url),
    title: String(payload.title || "Untitled Vimeo video").trim()
  };
}

function publicMedia(item) {
  return {
    id: item.id,
    title: item.title,
    category: item.category,
    description: item.description,
    featured: item.featured,
    type: item.type,
    source: item.source,
    provider: item.provider,
    videoId: item.videoId,
    externalUrl: item.externalUrl,
    embedUrl: item.embedUrl,
    thumbnailUrl: item.thumbnailUrl,
    url: item.url,
    fileName: item.fileName,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

ensureSetup();
const adminAccess = readAdminAccess();

const storage = multer.diskStorage({
  destination: function (_req, _file, callback) {
    callback(null, uploadsDir);
  },
  filename: function (_req, file, callback) {
    const extension = path.extname(file.originalname || "");
    const base = toSlug(path.basename(file.originalname || "upload", extension)) || "portfolio-item";
    callback(null, `${Date.now()}-${base}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024
  },
  fileFilter: function (_req, file, callback) {
    const accepted = file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/");
    callback(accepted ? null : new Error("Only image and video files are allowed."), accepted);
  }
});

function requireAdminAccess(req, res, next) {
  const suppliedKey = String(req.get("x-admin-secret") || "").trim();

  if (suppliedKey !== adminAccess.apiKey) {
    res.status(404).json({ error: "Not found." });
    return;
  }

  next();
}

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  const origin = req.get("origin");

  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-admin-secret");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  }

  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  next();
});

app.use("/uploads", express.static(uploadsDir));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, port: PORT });
});

app.get("/api/site", (_req, res) => {
  const content = readContent();
  res.json({
    ...content,
    media: content.media
      .map(publicMedia)
      .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
  });
});

app.put("/api/site", requireAdminAccess, (req, res) => {
  const current = readContent();
  const incoming = req.body || {};

  const next = writeContent({
    ...current,
    identity: {
      ...current.identity,
      ...(incoming.identity || {}),
      specialties: normalizeArray(incoming.identity?.specialties, current.identity.specialties)
    },
    about: {
      ...current.about,
      ...(incoming.about || {}),
      services: normalizeArray(incoming.about?.services, current.about.services)
    },
    contact: {
      ...current.contact,
      ...(incoming.contact || {})
    },
    media: current.media
  });

  res.json(next);
});

app.post("/api/media", requireAdminAccess, upload.single("media"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "Please upload a photo or video file." });
    return;
  }

  const current = readContent();
  const timestamp = new Date().toISOString();
  const item = {
    id: createId(),
    title: String(req.body.title || path.basename(req.file.originalname, path.extname(req.file.originalname))).trim(),
    category: String(req.body.category || (req.file.mimetype.startsWith("video/") ? "Video" : "Photography")).trim(),
    description: String(req.body.description || "").trim(),
    featured: parseBoolean(req.body.featured),
    type: req.file.mimetype.startsWith("video/") ? "video" : "image",
    source: "upload",
    provider: "",
    videoId: "",
    externalUrl: "",
    embedUrl: "",
    thumbnailUrl: "",
    fileName: req.file.filename,
    filePath: req.file.path,
    url: `/uploads/${req.file.filename}`,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  current.media.unshift(item);
  const saved = writeContent(current);
  const created = saved.media.find((entry) => entry.id === item.id);
  res.status(201).json(publicMedia(created));
});

app.post("/api/media/external", requireAdminAccess, async (req, res, next) => {
  try {
    const metadata = await fetchVimeoMetadata(req.body.url);
    const current = readContent();

    if (current.media.some((entry) => entry.externalUrl && entry.externalUrl === metadata.externalUrl)) {
      res.status(409).json({ error: "That Vimeo video is already in your portfolio." });
      return;
    }

    const timestamp = new Date().toISOString();
    const item = {
      id: createId(),
      title: metadata.title,
      category: String(req.body.category || "Wedding Highlights").trim(),
      description: String(req.body.description || "").trim(),
      featured: parseBoolean(req.body.featured),
      type: "video",
      source: metadata.source,
      provider: metadata.provider,
      videoId: metadata.videoId,
      externalUrl: metadata.externalUrl,
      embedUrl: metadata.embedUrl,
      thumbnailUrl: metadata.thumbnailUrl,
      fileName: "",
      filePath: "",
      url: metadata.thumbnailUrl,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    current.media.unshift(item);
    const saved = writeContent(current);
    const created = saved.media.find((entry) => entry.id === item.id);
    res.status(201).json(publicMedia(created));
  } catch (error) {
    next(error);
  }
});

app.put("/api/media/:id", requireAdminAccess, (req, res) => {
  const current = readContent();
  const item = current.media.find((entry) => entry.id === req.params.id);

  if (!item) {
    res.status(404).json({ error: "Portfolio item not found." });
    return;
  }

  item.title = String(req.body.title || item.title).trim();
  item.category = String(req.body.category || item.category).trim();
  item.description = String(req.body.description || item.description).trim();
  item.featured = parseBoolean(req.body.featured);
  item.updatedAt = new Date().toISOString();

  const saved = writeContent(current);
  const updated = saved.media.find((entry) => entry.id === req.params.id);
  res.json(publicMedia(updated));
});

app.delete("/api/media/:id", requireAdminAccess, (req, res) => {
  const current = readContent();
  const item = current.media.find((entry) => entry.id === req.params.id);

  if (!item) {
    res.status(404).json({ error: "Portfolio item not found." });
    return;
  }

  current.media = current.media.filter((entry) => entry.id !== req.params.id);
  writeContent(current);

  if (item.filePath && fs.existsSync(item.filePath)) {
    fs.unlinkSync(item.filePath);
  }

  res.json({ success: true });
});

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    res.status(400).json({ error: error.message });
    return;
  }

  if (error) {
    res.status(400).json({ error: error.message || "Something went wrong." });
    return;
  }

  res.status(500).json({ error: "Unexpected server error." });
});

app.listen(PORT, () => {
  console.log(`Vite local portfolio API running at http://localhost:${PORT}`);
});
