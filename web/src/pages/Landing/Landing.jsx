import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import PickaxeIcon from '../../icons/PickaxeIcon/index.js';
import './Landing.css';
import '../../assets/styles/fonts.css';

function useVisible(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function useCounter(target, duration, started) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!started) return;
    let current = 0;
    const steps = 60;
    const increment = target / steps;
    const interval = duration / steps;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, interval);
    return () => clearInterval(timer);
  }, [target, duration, started]);
  return count;
}

function StatCounter({ value, label, suffix = '' }) {
  const [ref, visible] = useVisible(0.5);
  const count = useCounter(value, 1200, visible);
  return (
    <div ref={ref} className="lp-stat">
      <span className="lp-stat-number">{count}{suffix}</span>
      <span className="lp-stat-label">{label}</span>
    </div>
  );
}

function FeatureCard({ icon, title, description, color, delay }) {
  const [ref, visible] = useVisible(0.1);
  return (
    <div
      ref={ref}
      className={`lp-feature-card lp-reveal ${visible ? 'lp-visible' : ''}`}
      style={{ '--delay': delay, '--card-color': color }}
    >
      <div className="lp-feature-icon">{icon}</div>
      <h3 className="lp-feature-title">{title}</h3>
      <p className="lp-feature-desc">{description}</p>
    </div>
  );
}

// Deterministic pseudo-random in [0,1) so the crack pattern is stable per render.
function pseudo(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// A jagged "crack" path from the centre outward, with perpendicular jitter at
// each step so it reads like a fissure splitting the dark rather than a ray.
function crackPath(angleDeg, length, segments, jitter, seed) {
  const cx = 200, cy = 200;
  const rad = (angleDeg * Math.PI) / 180;
  const dx = Math.cos(rad), dy = Math.sin(rad);   // outward direction
  const px = -dy, py = dx;                          // perpendicular
  let d = `M ${cx} ${cy}`;
  for (let s = 1; s <= segments; s++) {
    const t = s / segments;
    const dist = length * t;
    const off = (pseudo(seed + s) - 0.5) * jitter * (1 - t * 0.35);
    const x = cx + dx * dist + px * off;
    const y = cy + dy * dist + py * off;
    d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d;
}

function buildCracks() {
  const COUNT = 16;
  return Array.from({ length: COUNT }, (_, i) => {
    const base = (360 / COUNT) * i + (pseudo(i) - 0.5) * 14;
    const long = i % 3 !== 0;
    const length = long ? 150 + pseudo(i + 9) * 40 : 84 + pseudo(i + 3) * 28;
    return {
      d: crackPath(base, length, long ? 6 : 4, 28, i * 7 + 3),
      dur: 2.6 + pseudo(i + 1) * 1.5,
      delay: pseudo(i + 5) * 2.6,
      w: long ? 1.6 : 1.05,
    };
  });
}

function HeroMark() {
  const cracks = useMemo(buildCracks, []);
  return (
    <div className="lp-mark-scene" aria-hidden="true">
      <svg className="lp-cracks" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="lpCrackGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#EAFBFF" />
            <stop offset="35%" stopColor="#BDEBF7" />
            <stop offset="100%" stopColor="#2E7FB0" />
          </radialGradient>
        </defs>
        <g>
          {cracks.map((c, i) => (
            <path
              key={i}
              d={c.d}
              pathLength="100"
              className="lp-crack"
              style={{ '--dur': `${c.dur}s`, '--delay': `${c.delay}s`, strokeWidth: c.w }}
            />
          ))}
        </g>
      </svg>
      <span className="lp-shock" />
      <span className="lp-shock lp-shock-2" />
      <PickaxeIcon size={150} className="lp-mark-pick" />
    </div>
  );
}

const STACK = [
  { name: 'Node.js',    color: '#68A063', bg: 'rgba(104,160,99,0.12)'  },
  { name: 'Express',    color: '#FAFAFA', bg: 'rgba(250,250,250,0.07)' },
  { name: 'Docker',     color: '#2496ED', bg: 'rgba(36,150,237,0.12)'  },
  { name: 'Socket.io',  color: '#FFFFFF', bg: 'rgba(255,255,255,0.07)' },
  { name: 'Sequelize',  color: '#52B0E7', bg: 'rgba(82,176,231,0.12)'  },
  { name: 'React',      color: '#61DAFB', bg: 'rgba(97,218,251,0.12)'  },
  { name: 'S3',         color: '#FF9900', bg: 'rgba(255,153,0,0.12)'   },
  { name: 'JWT',        color: '#D63AFF', bg: 'rgba(214,58,255,0.12)'  },
  { name: 'SQLite',     color: '#7ABFE3', bg: 'rgba(122,191,227,0.12)' },
  { name: 'pino',       color: '#4ADE80', bg: 'rgba(74,222,128,0.12)'  },
];

const MINECRAFT_FEATURES = [
  { icon: '⛏', title: 'Bedrock via Geyser',  desc: 'Java and Bedrock players share the same world through Geyser + Floodgate — no extra server needed.' },
  { icon: '🛡', title: 'RCON Allowlist',       desc: 'Allowlist and ops managed in real time via RCON. Add or remove players without restarting the server.' },
  { icon: '🚧', title: 'Barrier System',        desc: 'Control who can join in real time by gamertag. Super, Always, and Monitored access levels give fine-grained control.' },
  { icon: '📋', title: 'Auto server.properties', desc: 'server.properties is synced from the database every time the instance starts. No drift, no manual edits.' },
];

export default function Landing() {
  const [heroRef, heroVisible] = useVisible(0.01);
  const [stackRef, stackVisible] = useVisible(0.1);
  const [mcRef, mcVisible] = useVisible(0.1);

  const { user } = useAuth();
  // Where a logged-in user lands when entering the app: admins get the
  // dashboard, everyone else goes straight to their servers.
  const appPath = user ? (user.admin ? '/dashboard' : '/servers') : null;
  const appLabel = user?.admin ? 'Go to dashboard' : 'Go to my servers';

  return (
    <div className="lp-root">
      {/* NAV */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <div className="lp-nav-logo">
            <span className="lp-nav-logo-icon" aria-hidden="true"><PickaxeIcon size={22} /></span>
            <span className="lp-nav-logo-text">Node<span className="lp-nav-logo-accent">Craft</span></span>
          </div>
          <div className="lp-nav-actions">
            {user ? (
              <Link to={appPath} className="lp-btn-primary">{appLabel}</Link>
            ) : (
              <>
                <Link to="/login"    className="lp-btn-ghost">Sign in</Link>
                <Link to="/register" className="lp-btn-primary">Get started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="lp-hero" ref={heroRef}>
        <div className="lp-hero-particles" aria-hidden="true">
          {Array.from({ length: 20 }).map((_, i) => (
            <span key={i} className="lp-particle" style={{ '--i': i }} />
          ))}
        </div>

        <div className={`lp-hero-inner lp-reveal ${heroVisible ? 'lp-visible' : ''}`}>
          <div className="lp-hero-text">
            <div className="lp-hero-eyebrow">Game Server Hosting</div>
            <h1 className="lp-hero-title">
              Your World.<br />
              <span className="lp-hero-title-accent">Your Rules.</span>
            </h1>
            <p className="lp-hero-subtitle">
              NodeCraft gives you a full game server — deployed in seconds, managed
              through one dashboard. Minecraft, CS2, KSP, and more.
            </p>
            <div className="lp-hero-ctas">
              {user ? (
                <Link to={appPath} className="lp-btn-primary lp-btn-lg">
                  {appLabel} <span className="lp-btn-arrow">→</span>
                </Link>
              ) : (
                <>
                  <Link to="/register" className="lp-btn-primary lp-btn-lg">
                    Get started <span className="lp-btn-arrow">→</span>
                  </Link>
                  <Link to="/login" className="lp-btn-ghost lp-btn-lg">
                    Sign in
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="lp-hero-visual">
            <div className="lp-mark-glow" aria-hidden="true" />
            <HeroMark />
          </div>
        </div>

        <div className="lp-hero-scroll" aria-hidden="true">
          <span className="lp-scroll-dot" />
        </div>
      </section>

      {/* STATS */}
      <section className="lp-stats-strip">
        <div className="lp-stats-inner">
          <StatCounter value={5}   suffix=""   label="Games Supported"   />
          <div className="lp-stats-divider" aria-hidden="true" />
          <StatCounter value={51}  suffix=""   label="Available Ports"    />
          <div className="lp-stats-divider" aria-hidden="true" />
          <StatCounter value={15}  suffix="s"  label="Heartbeat Interval" />
          <div className="lp-stats-divider" aria-hidden="true" />
          <StatCounter value={100} suffix="%"  label="Docker Isolated"    />
        </div>
      </section>

      {/* FEATURES */}
      <section className="lp-section lp-features-section">
        <div className="lp-section-inner">
          <div className="lp-section-header">
            <span className="lp-eyebrow">What you get</span>
            <h2 className="lp-section-title">Everything to run your server</h2>
            <p className="lp-section-sub">
              One platform. Multiple games. Full control from a single dashboard.
            </p>
          </div>
          <div className="lp-features-grid">
            <FeatureCard
              icon="🎮"
              title="Multi-Game Hosting"
              description="Minecraft, Counter-Strike 2, KSP, Hytale, Terraria — each with its own configuration panel and game-specific controls."
              color="var(--accent)"
              delay="0ms"
            />
            <FeatureCard
              icon="💾"
              title="Automated Backups"
              description="Daily and weekly snapshots uploaded to S3-compatible storage. 7 daily, 4 weekly. Pruned automatically. Recoverable any time."
              color="#FBBF24"
              delay="80ms"
            />
            <FeatureCard
              icon="📡"
              title="Real-time Console"
              description="Watch server logs stream live over Socket.io. Send commands directly from the dashboard without touching SSH."
              color="#3B82F6"
              delay="160ms"
            />
            <FeatureCard
              icon="👥"
              title="Player Management"
              description="Link players to your instance with permissions, gamertags, and access levels. Super, Always, and Monitored roles out of the box."
              color="#8B5CF6"
              delay="240ms"
            />
            <FeatureCard
              icon="📊"
              title="Hardware Monitoring"
              description="CPU, memory, and disk metrics collected from every worker node every 15 seconds. Automatic health detection."
              color="#F97316"
              delay="320ms"
            />
            <FeatureCard
              icon="🔐"
              title="JWT Auth"
              description="Access tokens in cookies, refresh tokens hashed in the database. Per-instance permissions: read, update, execute, backup, console."
              color="#EC4899"
              delay="400ms"
            />
          </div>
        </div>
      </section>

      {/* MINECRAFT SPOTLIGHT */}
      <section className="lp-section lp-mc-section" ref={mcRef}>
        <div className="lp-mc-pixel-border" aria-hidden="true" />
        <div className="lp-section-inner">
          <div className={`lp-mc-inner lp-reveal ${mcVisible ? 'lp-visible' : ''}`}>
            <div className="lp-mc-text">
              <span className="lp-eyebrow lp-eyebrow-green">Minecraft First</span>
              <h2 className="lp-section-title">Built for the game that started everything</h2>
              <p className="lp-section-sub">
                Minecraft gets first-class support: real-time barrier control, RCON-powered
                player management, and automatic property sync on every start.
              </p>
              <ul className="lp-mc-features">
                {MINECRAFT_FEATURES.map(f => (
                  <li key={f.title} className="lp-mc-feature-item">
                    <span className="lp-mc-feature-icon">{f.icon}</span>
                    <div>
                      <strong>{f.title}</strong>
                      <p>{f.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="lp-mc-visual" aria-hidden="true">
              <div className="lp-mc-terminal">
                <div className="lp-terminal-bar">
                  <span /><span /><span />
                  <span className="lp-terminal-title">console</span>
                </div>
                <div className="lp-terminal-body">
                  <p><span className="lp-t-dim">[09:41:02]</span> <span className="lp-t-green">[Server]</span> Done! For help, type "help"</p>
                  <p><span className="lp-t-dim">[09:41:05]</span> <span className="lp-t-yellow">[Rcon]</span> Connected on port 25575</p>
                  <p><span className="lp-t-dim">[09:41:12]</span> <span className="lp-t-blue">[Join]</span> Steve joined the game</p>
                  <p><span className="lp-t-dim">[09:41:12]</span> <span className="lp-t-green">[Barrier]</span> Access granted: Steve (super)</p>
                  <p><span className="lp-t-dim">[09:41:18]</span> <span className="lp-t-blue">[Join]</span> Alex joined the game</p>
                  <p><span className="lp-t-dim">[09:41:18]</span> <span className="lp-t-yellow">[Barrier]</span> Monitoring: Alex waiting</p>
                  <p className="lp-t-cursor"><span className="lp-t-dim">[09:41:22]</span> <span className="lp-t-green">[Backup]</span> Snapshot created ✓<span className="lp-blink">▌</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="lp-mc-pixel-border lp-mc-pixel-border-bottom" aria-hidden="true" />
      </section>

      {/* TECH STACK */}
      <section className="lp-section lp-stack-section" ref={stackRef}>
        <div className="lp-section-inner">
          <div className="lp-section-header">
            <span className="lp-eyebrow">Under the hood</span>
            <h2 className="lp-section-title">Built on solid ground</h2>
            <p className="lp-section-sub">
              NodeCraft runs on the same stack that powers production — nothing exotic,
              nothing brittle.
            </p>
          </div>
          <div className="lp-stack-grid">
            {STACK.map((tech, i) => (
              <div
                key={tech.name}
                className={`lp-stack-badge lp-reveal ${stackVisible ? 'lp-visible' : ''}`}
                style={{
                  '--delay': `${i * 55}ms`,
                  '--badge-color': tech.color,
                  '--badge-bg': tech.bg,
                }}
              >
                <span className="lp-stack-dot" />
                {tech.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FOOTER BAND */}
      <section className="lp-cta-band">
        <div className="lp-cta-band-inner">
          {user ? (
            <>
              <h2 className="lp-cta-title">Welcome back{user.name ? `, ${user.name}` : ''}!</h2>
              <p className="lp-cta-sub">Jump straight back into managing your servers.</p>
              <Link to={appPath} className="lp-btn-primary lp-btn-lg lp-btn-white">
                {appLabel} <span className="lp-btn-arrow">→</span>
              </Link>
            </>
          ) : (
            <>
              <h2 className="lp-cta-title">Ready to launch your server?</h2>
              <p className="lp-cta-sub">Create an account and have your first instance running in minutes.</p>
              <Link to="/register" className="lp-btn-primary lp-btn-lg lp-btn-white">
                Create your server <span className="lp-btn-arrow">→</span>
              </Link>
            </>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-logo">
            <PickaxeIcon size={16} /> NodeCraft
          </div>
          <p className="lp-footer-copy">Game server hosting, built by players.</p>
        </div>
      </footer>
    </div>
  );
}
