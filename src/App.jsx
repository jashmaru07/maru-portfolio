import { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";
const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET || "7c9f34a0e4d1b8c26a5f9e107c3b2d81";
const PRIVATE_ADMIN_PATH = import.meta.env.VITE_ADMIN_PATH || "/maru-studio-7c4b92e1f6";

function toMediaUrl(value) {
  try {
    return new URL(value, API_BASE).toString();
  } catch (_error) {
    return value;
  }
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

function useSiteLoader() {
  const [site, setSite] = useState(emptySite());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadSite() {
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
        media: (payload.media || []).map((item) => ({
          ...item,
          url: toMediaUrl(item.url)
        }))
      });
    } catch (caughtError) {
      setError(caughtError.message || "Could not load the portfolio data.");
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

  const contactLinks = useMemo(
    () =>
      [
        site.contact.email ? { label: site.contact.email, href: `mailto:${site.contact.email}` } : null,
        site.contact.phone ? { label: site.contact.phone, href: `tel:${site.contact.phone.replace(/\s+/g, "")}` } : null,
        site.contact.location ? { label: site.contact.location } : null,
        site.contact.instagram ? { label: "Instagram", href: site.contact.instagram } : null,
        site.contact.videoLink ? { label: "Video channel", href: site.contact.videoLink } : null
      ].filter(Boolean),
    [site]
  );

  return (
    <div className="site-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">{site.identity.role || "Photographer / Videographer"}</p>
          <h1 className="brand-title">{site.identity.displayName || "Portfolio"}</h1>
        </div>
        <nav className="nav-links">
          <a href="#work">Work</a>
          <a href="#about">About</a>
          <a className="nav-cta" href="#contact">
            Contact
          </a>
        </nav>
      </header>

      <main className="layout-stack">
        <section className="hero-card">
          <p className="eyebrow">{site.identity.eyebrow}</p>
          <h2>{site.identity.heroTitle}</h2>
          <p className="body-copy">{site.identity.heroDescription}</p>
          <div className="tag-row">
            {(site.identity.specialties || []).map((item) => (
              <span className="tag" key={item}>
                {item}
              </span>
            ))}
          </div>
        </section>

        <section className="section-card" id="work">
          <div className="section-head">
            <div>
              <p className="eyebrow">Vite + React</p>
              <h3>Selected work</h3>
            </div>
            <span className="subtle-text">{site.media.length} items</span>
          </div>

          {loading ? <div className="empty-block">Loading portfolio...</div> : null}
          {error ? <div className="empty-block">{error}</div> : null}

          {!loading && !error ? (
            <div className="gallery-grid">
              {(site.media || []).map((item) => (
                <button className="media-card" key={item.id} onClick={() => setActiveItem(item)} type="button">
                  <div className="media-frame">
                    {item.type === "video" ? (
                      <video muted playsInline preload="metadata" src={item.url} />
                    ) : (
                      <img alt={item.title} loading="lazy" src={item.url} />
                    )}
                  </div>
                  <div className="card-copy">
                    <p className="meta-line">{item.category || "Portfolio"}</p>
                    <strong>{item.title}</strong>
                    <span>{item.description || "Open preview"}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : null}
        </section>

        <section className="split-grid">
          <article className="section-card" id="about">
            <p className="eyebrow">About</p>
            <h3>{site.about.heading}</h3>
            <p className="body-copy">{site.about.body}</p>
            <blockquote className="quote">{site.about.quote}</blockquote>
            <div className="service-list">
              {(site.about.services || []).map((service) => (
                <span className="service-pill" key={service}>
                  {service}
                </span>
              ))}
            </div>
          </article>

          <article className="section-card" id="contact">
            <p className="eyebrow">Contact</p>
            <h3>Let&apos;s work together</h3>
            <p className="body-copy">{site.about.availability}</p>
            <div className="contact-list">
              {contactLinks.map((item) =>
                item.href ? (
                  <a className="contact-pill" href={item.href} key={item.label} rel="noreferrer" target={item.href.startsWith("http") ? "_blank" : undefined}>
                    {item.label}
                  </a>
                ) : (
                  <span className="contact-pill" key={item.label}>
                    {item.label}
                  </span>
                )
              )}
            </div>
          </article>
        </section>
      </main>

      <footer className="footer-bar">
        <span>{site.identity.displayName} React prototype</span>
        <a href="/admin">Open React admin</a>
      </footer>

      {activeItem ? <PreviewModal item={activeItem} onClose={() => setActiveItem(null)} /> : null}
    </div>
  );
}

function PreviewModal({ item, onClose }) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

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
        {item.type === "video" ? (
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
                if (!node) return;
                node.volume = volume;
              }}
              src={item.url}
            />
            <div className="video-tools">
              <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
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
      </div>
    </div>
  );
}

function AdminApp() {
  const { site, setSite, loading, error, reload } = useSiteLoader();
  const [status, setStatus] = useState("");
  const [draft, setDraft] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    category: "",
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
        "x-admin-secret": ADMIN_SECRET
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
        "x-admin-secret": ADMIN_SECRET
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

  async function saveItem(item) {
    const response = await fetch(`${API_BASE}/api/media/${item.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": ADMIN_SECRET
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
        "x-admin-secret": ADMIN_SECRET
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
    return <div className="site-shell"><div className="empty-block">Loading React admin...</div></div>;
  }

  return (
    <div className="site-shell admin-shell">
      <header className="topbar admin-topbar">
        <div>
          <p className="eyebrow">Vite + React</p>
          <h1 className="brand-title">React admin prototype</h1>
          <p className="subtle-text">Connected to {API_BASE}</p>
        </div>
        <div className="nav-links">
          <a href="/">Open public page</a>
          <a className="nav-cta" href={`${API_BASE}${PRIVATE_ADMIN_PATH}`} rel="noreferrer" target="_blank">
            Original admin
          </a>
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
              <p className="eyebrow">Library</p>
              <h3>Manage uploaded work</h3>
            </div>
            <span className="subtle-text">{draft.media.length} items</span>
          </div>

          {loading ? <div className="empty-block">Loading library...</div> : null}
          {error ? <div className="empty-block">{error}</div> : null}

          <div className="admin-grid">
            {draft.media.map((item) => (
              <article className="admin-card" key={item.id}>
                <div className="media-frame compact">
                  {item.type === "video" ? (
                    <video muted playsInline preload="metadata" src={item.url} />
                  ) : (
                    <img alt={item.title} loading="lazy" src={item.url} />
                  )}
                </div>
                <div className="card-copy">
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
          <span>{status || "Vite admin ready for testing."}</span>
        </footer>
      </main>
    </div>
  );
}

export default function App() {
  const isAdminRoute = window.location.pathname.startsWith("/admin");
  return isAdminRoute ? <AdminApp /> : <PortfolioApp />;
}
