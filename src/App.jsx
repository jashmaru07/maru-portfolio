import { useEffect, useMemo, useState } from "react";
import siteSnapshot from "./data/site-snapshot.json";

const API_BASE = import.meta.env.DEV ? import.meta.env.VITE_API_BASE || "" : "";
const DEV_ADMIN_SECRET = import.meta.env.DEV ? import.meta.env.VITE_ADMIN_SECRET || "" : "";
const DEV_ADMIN_PATH = import.meta.env.DEV ? import.meta.env.VITE_ADMIN_PATH || "" : "";
const LOCAL_ADMIN_ENABLED = import.meta.env.DEV && Boolean(API_BASE) && Boolean(DEV_ADMIN_SECRET) && Boolean(DEV_ADMIN_PATH);

function toMediaUrl(value) {
  if (!value) {
    return value;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  try {
    if (!API_BASE) {
      return value;
    }

    return new URL(value, API_BASE).toString();
  } catch (_error) {
    return value;
  }
}

function getVimeoVideoId(value) {
  const match = String(value || "").match(/(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d+)/i);
  return match ? match[1] : "";
}

function isExternalVideo(item) {
  return item?.type === "video" && item?.source === "external";
}

function normalizeMediaItem(item) {
  const next = item && typeof item === "object" ? item : {};
  const externalUrl = String(next.externalUrl || "").trim();
  const detectedVideoId = String(next.videoId || getVimeoVideoId(externalUrl || next.embedUrl || next.url)).trim();
  const provider = String(next.provider || (detectedVideoId ? "vimeo" : "")).trim().toLowerCase();
  const source = next.source === "external" || externalUrl || next.embedUrl ? "external" : "upload";

  return {
    ...next,
    source,
    provider,
    videoId: detectedVideoId,
    externalUrl,
    embedUrl:
      String(next.embedUrl || "").trim() ||
      (provider === "vimeo" && detectedVideoId
        ? `https://player.vimeo.com/video/${detectedVideoId}?autoplay=1&title=0&byline=0&portrait=0`
        : ""),
    thumbnailUrl: toMediaUrl(next.thumbnailUrl),
    url: toMediaUrl(next.url)
  };
}

function mapMedia(items) {
  return (items || []).map((item) => normalizeMediaItem(item));
}

function getPreviewImage(item) {
  return isExternalVideo(item) ? item.thumbnailUrl || item.url || "" : item.url;
}

function getMediaTypeLabel(item) {
  if (item?.provider === "vimeo") {
    return "Vimeo";
  }

  return item?.type === "video" ? "Motion" : "Still";
}

function getFeatureBadge(item) {
  if (item?.provider === "vimeo") {
    return "Vimeo Feature";
  }

  return item?.type === "video" ? "Motion Feature" : "Featured Frame";
}

function getFeatureAction(item) {
  if (item?.provider === "vimeo") {
    return "Watch film";
  }

  return item?.type === "video" ? "Play reel" : "View frame";
}

function emptySite() {
  return {
    identity: {
      displayName: "",
      role: "",
      eyebrow: "",
      heroTitle: "",
      heroDescription: "",
      specialties: [],
      focus: ""
    },
    about: {
      heading: "",
      body: "",
      quote: "",
      services: [],
      availability: ""
    },
    contact: {
      email: "",
      phone: "",
      location: "",
      instagram: "",
      videoLink: ""
    },
    media: []
  };
}

function parseLines(value) {
  return value
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return minutes + ":" + String(remainingSeconds).padStart(2, "0");
}

function getPortfolioCardClass(index, type) {
  const variants = [
    "portfolio-card span-7 tall",
    "portfolio-card span-5 medium",
    "portfolio-card span-5 medium",
    "portfolio-card span-7 wide",
    "portfolio-card span-4 tall",
    "portfolio-card span-8 medium"
  ];

  const variant = variants[index % variants.length];
  return `${variant}${type.type === "video" ? " is-video" : ""}${type.provider === "vimeo" ? " is-vimeo" : ""}`;
}

function useSiteLoader() {
  const [site, setSite] = useState(() => ({
    ...emptySite(),
    ...siteSnapshot,
    media: mapMedia(siteSnapshot.media)
  }));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadSite() {
    if (!API_BASE) {
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/api/site`);
      if (!response.ok) {
        throw new Error("Could not load the portfolio data.");
      }

      const payload = await response.json();
      setSite({
        ...payload,
        media: mapMedia(payload.media)
      });
    } catch (caughtError) {
      setSite({
        ...emptySite(),
        ...siteSnapshot,
        media: mapMedia(siteSnapshot.media)
      });
      setError(caughtError.message || "");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSite();
  }, []);

  return {
    site,
    setSite,
    loading,
    error,
    reload: loadSite
  };
}

function PortfolioApp() {
  const { site, loading, error } = useSiteLoader();
  const [activeItem, setActiveItem] = useState(null);

  const featuredMedia = useMemo(() => {
    const featuredItems = (site.media || []).filter((item) => item.featured);
    return featuredItems.length ? featuredItems : site.media || [];
  }, [site.media]);

  const heroMedia = featuredMedia[0] || null;

  const contactLinks = useMemo(
    () =>
      [
        site.contact.email ? { label: "Email", value: site.contact.email, href: `mailto:${site.contact.email}` } : null,
        site.contact.phone ? { label: "Phone", value: site.contact.phone, href: `tel:${site.contact.phone.replace(/\s+/g, "")}` } : null,
        site.contact.instagram ? { label: "Instagram", value: "@Instagram", href: site.contact.instagram } : null,
        site.contact.videoLink ? { label: "Video", value: "Watch motion work", href: site.contact.videoLink } : null
      ].filter(Boolean),
    [site]
  );

  const stripItems = [
    { label: "Based in", value: site.contact.location || "Available worldwide" },
    { label: "Focus", value: site.identity.focus || "Portraits, stories, and films" },
    { label: "Selected work", value: `${site.media.length} curated pieces` }
  ];

  return (
    <div className="portfolio-shell">
      <header className="portfolio-topbar">
        <a className="brand-lockup" href="#top">
          <span className="brand-mark">ML</span>
          <span className="brand-copy">
            <strong>{site.identity.displayName || "Maru Labutap"}</strong>
            <span>{site.identity.role || "Photographer / Videographer"}</span>
          </span>
        </a>

        <nav className="portfolio-nav">
          <a href="#work">Work</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <main className="portfolio-main" id="top">
        <section className="hero-editorial">
          <article className="hero-copy-panel">
            <p className="section-kicker">{site.identity.eyebrow || "Visual storytelling"}</p>
            <p className="hero-name">{site.identity.displayName || "Maru Labutap"}</p>
            <h1 className="hero-title">{site.identity.heroTitle || "Editorial visuals built with warmth and cinematic restraint."}</h1>
            <p className="hero-description">{site.identity.heroDescription}</p>

            <div className="hero-meta-grid">
              <div className="hero-meta-card">
                <span>Base</span>
                <strong>{site.contact.location || "Manila, Philippines"}</strong>
              </div>
              <div className="hero-meta-card">
                <span>Focus</span>
                <strong>{site.identity.focus || "Portraits and motion-led stories"}</strong>
              </div>
              <div className="hero-meta-card">
                <span>Availability</span>
                <strong>{site.about.availability || "Open for portraits, campaigns, and events"}</strong>
              </div>
            </div>

            <div className="specialty-row">
              {(site.identity.specialties || []).map((item) => (
                <span className="specialty-chip" key={item}>
                  {item}
                </span>
              ))}
            </div>
          </article>

          {heroMedia ? (
            <button className="hero-feature-card" onClick={() => setActiveItem(heroMedia)} type="button">
              <span className="feature-badge">{getFeatureBadge(heroMedia)}</span>
              {isExternalVideo(heroMedia) ? (
                <img alt={heroMedia.title} loading="eager" src={getPreviewImage(heroMedia)} />
              ) : heroMedia.type === "video" ? (
                <video autoPlay loop muted playsInline preload="metadata" src={heroMedia.url} />
              ) : (
                <img alt={heroMedia.title} loading="eager" src={heroMedia.url} />
              )}
              <div className="feature-details">
                <div className="feature-copy">
                  <p>{heroMedia.category || "Selected work"}</p>
                  <strong>{heroMedia.title}</strong>
                  <span>{heroMedia.description || "Open fullscreen preview"}</span>
                </div>
                <span className="feature-action">{getFeatureAction(heroMedia)}</span>
              </div>
            </button>
          ) : (
            <div className="hero-feature-card empty-hero-card">
              <div className="empty-state">Upload work in the admin page to build the gallery.</div>
            </div>
          )}
        </section>

        <section className="portfolio-strip" aria-label="Portfolio summary">
          {stripItems.map((item) => (
            <article className="strip-card" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </article>
          ))}
        </section>

        <section className="work-editorial" id="work">
          <div className="section-intro">
            <div>
              <p className="section-kicker">Selected work</p>
              <h2>Clean frames, refined motion, and visuals that feel tactile.</h2>
            </div>
            <p className="section-note">Inspired by current editorial portfolio trends: oversized type, restrained palettes, and image-first navigation.</p>
          </div>

          {loading ? <div className="empty-state">Loading portfolio...</div> : null}
          {error ? <div className="empty-state">{error}</div> : null}

          {!loading && !error ? (
            <div className="editorial-grid">
              {(site.media || []).map((item, index) => (
                <button className={getPortfolioCardClass(index, item)} key={item.id} onClick={() => setActiveItem(item)} type="button">
                  <div className="portfolio-card-inner">
                    <div className="editorial-figure">
                      {isExternalVideo(item) ? (
                        <img alt={item.title} loading="lazy" src={getPreviewImage(item)} />
                      ) : item.type === "video" ? (
                        <video muted playsInline preload="metadata" src={item.url} />
                      ) : (
                        <img alt={item.title} loading="lazy" src={item.url} />
                      )}
                    </div>

                    <div className="editorial-meta">
                      <div className="editorial-meta-top">
                        <div>
                          <p className="meta-line">{item.category || "Portfolio"}</p>
                          <strong className="editorial-title">{item.title}</strong>
                        </div>
                        <span className="editorial-type">{getMediaTypeLabel(item)}</span>
                      </div>
                      <p className="editorial-description">{item.description || "Open the full preview to experience the work in detail."}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : null}
        </section>

        <section className="story-grid" id="about">
          <article className="story-panel">
            <p className="section-kicker">About</p>
            <h2>{site.about.heading || "A portfolio designed around quiet confidence and strong visual rhythm."}</h2>
            <p className="story-copy">{site.about.body}</p>
          </article>

          <article className="quote-panel">
            <span className="quote-mark">"</span>
            <p className="quote-text">{site.about.quote || "Good visuals should feel effortless, even when every detail is intentional."}</p>
            <div className="editorial-services">
              {(site.about.services || []).map((service) => (
                <span className="service-pill service-pill-dark" key={service}>
                  {service}
                </span>
              ))}
            </div>
          </article>
        </section>

        <section className="contact-editorial" id="contact">
          <div className="contact-copy">
            <p className="section-kicker">Contact</p>
            <h2>Let&apos;s make visuals that still feel alive years from now.</h2>
            <p className="section-note">{site.about.availability || "Available for portraits, campaigns, events, and collaborations."}</p>
          </div>

          <div className="contact-stack">
            {contactLinks.map((item) => (
              <a className="contact-link" href={item.href} key={item.label} rel="noreferrer" target={item.href.startsWith("http") ? "_blank" : undefined}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </a>
            ))}
          </div>
        </section>
      </main>

      <footer className="portfolio-footer">
        <span>{site.identity.displayName || "Maru Labutap"}</span>
        <span>{site.contact.location || site.identity.role || "Photographer / Videographer"}</span>
      </footer>

      {activeItem ? <PreviewModal item={activeItem} onClose={() => setActiveItem(null)} /> : null}
    </div>
  );
}

function PreviewModal({ item, onClose }) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const usesExternalPlayer = isExternalVideo(item);

  useEffect(() => {
    document.body.classList.add("modal-open");
    return () => document.body.classList.remove("modal-open");
  }, []);

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div className="modal-panel" onClick={(event) => event.stopPropagation()} role="dialog">
        <button className="ghost-button" onClick={onClose} type="button">
          Close
        </button>

        {usesExternalPlayer ? (
          <>
            <div className="video-embed-shell">
              <iframe
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                className="vimeo-frame"
                src={item.embedUrl}
                title={item.title}
              />
            </div>
            <div className="video-tools">
              <span>Streaming from Vimeo</span>
              {item.externalUrl ? (
                <a className="ghost-link" href={item.externalUrl} rel="noreferrer" target="_blank">
                  Open on Vimeo
                </a>
              ) : null}
            </div>
          </>
        ) : item.type === "video" ? (
          <>
            <video
              autoPlay
              controls={false}
              controlsList="nodownload noplaybackrate noremoteplayback"
              disablePictureInPicture
              onContextMenu={(event) => event.preventDefault()}
              onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
              onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime || 0)}
              onVolumeChange={(event) => setVolume(event.currentTarget.volume || 0)}
              playsInline
              preload="metadata"
              ref={(node) => {
                if (!node) {
                  return;
                }

                node.volume = volume;
              }}
              src={item.url}
            />
            <div className="video-tools">
              <span>
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              <label className="volume-row">
                <span>Volume</span>
                <input
                  max="1"
                  min="0"
                  onChange={(event) => {
                    const media = document.querySelector(".modal-panel video");
                    const nextVolume = Number(event.target.value);
                    setVolume(nextVolume);
                    if (media) {
                      media.volume = nextVolume;
                    }
                  }}
                  step="0.05"
                  type="range"
                  value={volume}
                />
              </label>
            </div>
          </>
        ) : (
          <img alt={item.title} src={item.url} />
        )}

        <div className="modal-caption">
          <p className="meta-line modal-kicker">{item.category || "Portfolio"}</p>
          <strong>{item.title}</strong>
          <span>{item.description || "Presented in the editorial preview."}</span>
        </div>
      </div>
    </div>
  );
}

function AdminApp() {
  const { site, loading, error, reload } = useSiteLoader();
  const [status, setStatus] = useState("");
  const [draft, setDraft] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    category: "",
    description: "",
    featured: true
  });
  const [linkForm, setLinkForm] = useState({
    url: "",
    category: "Wedding Highlights",
    description: "",
    featured: true
  });

  useEffect(() => {
    setDraft({
      identity: {
        displayName: site.identity.displayName || "",
        role: site.identity.role || "",
        eyebrow: site.identity.eyebrow || "",
        heroTitle: site.identity.heroTitle || "",
        heroDescription: site.identity.heroDescription || "",
        specialties: (site.identity.specialties || []).join(", "),
        focus: site.identity.focus || ""
      },
      about: {
        heading: site.about.heading || "",
        body: site.about.body || "",
        quote: site.about.quote || "",
        services: (site.about.services || []).join("\n"),
        availability: site.about.availability || ""
      },
      contact: {
        email: site.contact.email || "",
        phone: site.contact.phone || "",
        location: site.contact.location || "",
        instagram: site.contact.instagram || "",
        videoLink: site.contact.videoLink || ""
      },
      media: site.media || []
    });
  }, [site]);

  async function saveTextSections() {
    const response = await fetch(`${API_BASE}/api/site`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": DEV_ADMIN_SECRET
      },
      body: JSON.stringify({
        identity: {
          ...draft.identity,
          specialties: draft.identity.specialties
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        },
        about: {
          ...draft.about,
          services: parseLines(draft.about.services)
        },
        contact: draft.contact
      })
    });

    if (!response.ok) {
      throw new Error("Could not save the text content.");
    }

    await reload();
    setStatus("Saved text content.");
  }

  async function uploadMedia() {
    if (!uploadFile) {
      throw new Error("Choose a file before uploading.");
    }

    const formData = new FormData();
    formData.append("media", uploadFile);
    formData.append("title", uploadForm.title);
    formData.append("category", uploadForm.category);
    formData.append("description", uploadForm.description);
    formData.append("featured", String(uploadForm.featured));

    const response = await fetch(`${API_BASE}/api/media`, {
      method: "POST",
      headers: {
        "x-admin-secret": DEV_ADMIN_SECRET
      },
      body: formData
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Upload failed.");
    }

    setUploadFile(null);
    setUploadForm({
      title: "",
      category: "",
      description: "",
      featured: true
    });
    await reload();
    setStatus("Uploaded media successfully.");
  }

  async function addExternalVideo() {
    if (!linkForm.url.trim()) {
      throw new Error("Paste a Vimeo link before adding it.");
    }

    const response = await fetch(`${API_BASE}/api/media/external`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": DEV_ADMIN_SECRET
      },
      body: JSON.stringify(linkForm)
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Could not add the Vimeo video.");
    }

    setLinkForm({
      url: "",
      category: "Wedding Highlights",
      description: "",
      featured: true
    });
    await reload();
    setStatus(`Added ${payload.title}.`);
  }

  async function saveItem(item) {
    const response = await fetch(`${API_BASE}/api/media/${item.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": DEV_ADMIN_SECRET
      },
      body: JSON.stringify({
        title: item.title,
        category: item.category,
        description: item.description,
        featured: item.featured
      })
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Could not save this portfolio item.");
    }

    await reload();
    setStatus("Saved portfolio item.");
  }

  async function deleteItem(id) {
    const response = await fetch(`${API_BASE}/api/media/${id}`, {
      method: "DELETE",
      headers: {
        "x-admin-secret": DEV_ADMIN_SECRET
      }
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Could not delete this item.");
    }

    await reload();
    setStatus("Deleted portfolio item.");
  }

  if (!draft) {
    return (
      <div className="site-shell">
        <div className="empty-state">Loading local Vite admin...</div>
      </div>
    );
  }

  return (
    <div className="site-shell admin-shell">
      <header className="topbar admin-topbar">
        <div>
          <p className="eyebrow">Vite + React</p>
          <h1 className="brand-title">Hidden local admin</h1>
          <p className="subtle-text">Standalone local mode on {API_BASE}</p>
        </div>
        <div className="nav-links">
          <a href="/">Open public page</a>
          <span className="subtle-text">Own Vite backend</span>
        </div>
      </header>

      <main className="layout-stack">
        <section className="section-card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Brand and hero</p>
              <h3>Editable text</h3>
            </div>
            <button className="action-button primary" onClick={() => saveTextSections().catch((err) => setStatus(err.message))} type="button">
              Save changes
            </button>
          </div>

          <div className="form-grid">
            <label>
              <span>Display name</span>
              <input value={draft.identity.displayName} onChange={(event) => setDraft((current) => ({ ...current, identity: { ...current.identity, displayName: event.target.value } }))} />
            </label>
            <label>
              <span>Role</span>
              <input value={draft.identity.role} onChange={(event) => setDraft((current) => ({ ...current, identity: { ...current.identity, role: event.target.value } }))} />
            </label>
            <label className="span-two">
              <span>Eyebrow</span>
              <input value={draft.identity.eyebrow} onChange={(event) => setDraft((current) => ({ ...current, identity: { ...current.identity, eyebrow: event.target.value } }))} />
            </label>
            <label className="span-two">
              <span>Hero title</span>
              <input value={draft.identity.heroTitle} onChange={(event) => setDraft((current) => ({ ...current, identity: { ...current.identity, heroTitle: event.target.value } }))} />
            </label>
            <label className="span-two">
              <span>Hero description</span>
              <textarea rows="4" value={draft.identity.heroDescription} onChange={(event) => setDraft((current) => ({ ...current, identity: { ...current.identity, heroDescription: event.target.value } }))} />
            </label>
            <label className="span-two">
              <span>Specialties</span>
              <input value={draft.identity.specialties} onChange={(event) => setDraft((current) => ({ ...current, identity: { ...current.identity, specialties: event.target.value } }))} />
            </label>
          </div>
        </section>

        <section className="section-card">
          <div className="section-head">
            <div>
              <p className="eyebrow">About and contact</p>
              <h3>Profile details</h3>
            </div>
            <button className="action-button" onClick={() => saveTextSections().catch((err) => setStatus(err.message))} type="button">
              Save profile
            </button>
          </div>

          <div className="form-grid">
            <label className="span-two">
              <span>About heading</span>
              <input value={draft.about.heading} onChange={(event) => setDraft((current) => ({ ...current, about: { ...current.about, heading: event.target.value } }))} />
            </label>
            <label className="span-two">
              <span>About body</span>
              <textarea rows="5" value={draft.about.body} onChange={(event) => setDraft((current) => ({ ...current, about: { ...current.about, body: event.target.value } }))} />
            </label>
            <label className="span-two">
              <span>Quote</span>
              <input value={draft.about.quote} onChange={(event) => setDraft((current) => ({ ...current, about: { ...current.about, quote: event.target.value } }))} />
            </label>
            <label className="span-two">
              <span>Services</span>
              <textarea rows="4" value={draft.about.services} onChange={(event) => setDraft((current) => ({ ...current, about: { ...current.about, services: event.target.value } }))} />
            </label>
            <label className="span-two">
              <span>Availability</span>
              <input value={draft.about.availability} onChange={(event) => setDraft((current) => ({ ...current, about: { ...current.about, availability: event.target.value } }))} />
            </label>
            <label>
              <span>Email</span>
              <input value={draft.contact.email} onChange={(event) => setDraft((current) => ({ ...current, contact: { ...current.contact, email: event.target.value } }))} />
            </label>
            <label>
              <span>Phone</span>
              <input value={draft.contact.phone} onChange={(event) => setDraft((current) => ({ ...current, contact: { ...current.contact, phone: event.target.value } }))} />
            </label>
            <label>
              <span>Instagram</span>
              <input value={draft.contact.instagram} onChange={(event) => setDraft((current) => ({ ...current, contact: { ...current.contact, instagram: event.target.value } }))} />
            </label>
            <label>
              <span>Video link</span>
              <input value={draft.contact.videoLink} onChange={(event) => setDraft((current) => ({ ...current, contact: { ...current.contact, videoLink: event.target.value } }))} />
            </label>
          </div>
        </section>

        <section className="section-card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Uploads</p>
              <h3>Add media</h3>
            </div>
            <button className="action-button primary" onClick={() => uploadMedia().catch((err) => setStatus(err.message))} type="button">
              Upload file
            </button>
          </div>

          <div className="form-grid">
            <label className="span-two">
              <span>Media file</span>
              <input accept="image/*,video/*" onChange={(event) => setUploadFile(event.target.files?.[0] || null)} type="file" />
            </label>
            <label>
              <span>Title</span>
              <input value={uploadForm.title} onChange={(event) => setUploadForm((current) => ({ ...current, title: event.target.value }))} />
            </label>
            <label>
              <span>Category</span>
              <input value={uploadForm.category} onChange={(event) => setUploadForm((current) => ({ ...current, category: event.target.value }))} />
            </label>
            <label className="span-two">
              <span>Description</span>
              <textarea rows="4" value={uploadForm.description} onChange={(event) => setUploadForm((current) => ({ ...current, description: event.target.value }))} />
            </label>
            <label className="checkbox-row">
              <input checked={uploadForm.featured} onChange={(event) => setUploadForm((current) => ({ ...current, featured: event.target.checked }))} type="checkbox" />
              <span>Feature on homepage</span>
            </label>
          </div>
        </section>

        <section className="section-card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Vimeo</p>
              <h3>Add Vimeo link</h3>
            </div>
            <button className="action-button primary" onClick={() => addExternalVideo().catch((err) => setStatus(err.message))} type="button">
              Add link
            </button>
          </div>

          <div className="form-grid">
            <label className="span-two">
              <span>Vimeo URL</span>
              <input
                onChange={(event) => setLinkForm((current) => ({ ...current, url: event.target.value }))}
                placeholder="https://vimeo.com/123456789"
                type="url"
                value={linkForm.url}
              />
            </label>
            <label>
              <span>Category</span>
              <input value={linkForm.category} onChange={(event) => setLinkForm((current) => ({ ...current, category: event.target.value }))} />
            </label>
            <label className="span-two">
              <span>Description</span>
              <textarea rows="4" value={linkForm.description} onChange={(event) => setLinkForm((current) => ({ ...current, description: event.target.value }))} />
            </label>
            <label className="checkbox-row">
              <input checked={linkForm.featured} onChange={(event) => setLinkForm((current) => ({ ...current, featured: event.target.checked }))} type="checkbox" />
              <span>Feature on homepage</span>
            </label>
            <p className="admin-note">The title and thumbnail are pulled directly from Vimeo, so you only need the link.</p>
          </div>
        </section>

        <section className="section-card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Library</p>
              <h3>Manage uploaded work</h3>
            </div>
            <span className="subtle-text">{draft.media.length} items</span>
          </div>

          {loading ? <div className="empty-state">Loading library...</div> : null}
          {error ? <div className="empty-state">{error}</div> : null}

          <div className="admin-grid">
            {draft.media.map((item) => (
              <article className="admin-card" key={item.id}>
                <div className="media-frame compact">
                  {isExternalVideo(item) ? (
                    <img alt={item.title} loading="lazy" src={getPreviewImage(item)} />
                  ) : item.type === "video" ? (
                    <video muted playsInline preload="metadata" src={item.url} />
                  ) : (
                    <img alt={item.title} loading="lazy" src={item.url} />
                  )}
                </div>
                <div className="card-copy">
                  <div className="tag-row">
                    <span className="tag">{item.provider === "vimeo" ? "Vimeo link" : item.type === "video" ? "Uploaded video" : "Still image"}</span>
                  </div>
                  <label>
                    <span>Title</span>
                    <input value={item.title} onChange={(event) => setDraft((current) => ({ ...current, media: current.media.map((entry) => (entry.id === item.id ? { ...entry, title: event.target.value } : entry)) }))} />
                  </label>
                  <label>
                    <span>Category</span>
                    <input value={item.category} onChange={(event) => setDraft((current) => ({ ...current, media: current.media.map((entry) => (entry.id === item.id ? { ...entry, category: event.target.value } : entry)) }))} />
                  </label>
                  <label>
                    <span>Description</span>
                    <textarea rows="3" value={item.description} onChange={(event) => setDraft((current) => ({ ...current, media: current.media.map((entry) => (entry.id === item.id ? { ...entry, description: event.target.value } : entry)) }))} />
                  </label>
                  <label className="checkbox-row">
                    <input checked={Boolean(item.featured)} onChange={(event) => setDraft((current) => ({ ...current, media: current.media.map((entry) => (entry.id === item.id ? { ...entry, featured: event.target.checked } : entry)) }))} type="checkbox" />
                    <span>Featured</span>
                  </label>
                  {item.externalUrl ? (
                    <a className="admin-inline-link" href={item.externalUrl} rel="noreferrer" target="_blank">
                      Open source video
                    </a>
                  ) : null}
                </div>
                <div className="card-actions">
                  <button className="action-button primary" onClick={() => saveItem(item).catch((err) => setStatus(err.message))} type="button">
                    Save
                  </button>
                  <button className="action-button danger" onClick={() => deleteItem(item.id).catch((err) => setStatus(err.message))} type="button">
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <footer className="footer-bar">
          <span>{status || "Hidden local Vite admin is ready."}</span>
        </footer>
      </main>
    </div>
  );
}

export default function App() {
  const pathName = typeof window !== "undefined" ? window.location.pathname : "/";
  const isLocalAdminRoute = LOCAL_ADMIN_ENABLED && pathName.startsWith(DEV_ADMIN_PATH);

  return isLocalAdminRoute ? <AdminApp /> : <PortfolioApp />;
}
