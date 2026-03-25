import { useEffect, useMemo, useState } from "react";
import siteSnapshot from "./data/site-snapshot.json";

const API_BASE = import.meta.env.DEV ? import.meta.env.VITE_API_BASE || "" : "";

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
  return `${variant}${type === "video" ? " is-video" : ""}`;
}

function useSiteLoader() {
  const [site, setSite] = useState(() => ({
    ...emptySite(),
    ...siteSnapshot,
    media: (siteSnapshot.media || []).map((item) => ({
      ...item,
      url: toMediaUrl(item.url)
    }))
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
        media: (payload.media || []).map((item) => ({
          ...item,
          url: toMediaUrl(item.url)
        }))
      });
    } catch (caughtError) {
      setSite({
        ...emptySite(),
        ...siteSnapshot,
        media: (siteSnapshot.media || []).map((item) => ({
          ...item,
          url: toMediaUrl(item.url)
        }))
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
    loading,
    error
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
              <span className="feature-badge">{heroMedia.type === "video" ? "Motion Feature" : "Featured Frame"}</span>
              {heroMedia.type === "video" ? (
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
                <span className="feature-action">{heroMedia.type === "video" ? "Play reel" : "View frame"}</span>
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
                <button className={getPortfolioCardClass(index, item.type)} key={item.id} onClick={() => setActiveItem(item)} type="button">
                  <div className="portfolio-card-inner">
                    <div className="editorial-figure">
                      {item.type === "video" ? (
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
                        <span className="editorial-type">{item.type === "video" ? "Motion" : "Still"}</span>
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

export default function App() {
  return <PortfolioApp />;
}
