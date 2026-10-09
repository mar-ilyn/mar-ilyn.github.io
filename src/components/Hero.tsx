import { profile } from '../data/profile'

export function Hero() {
  const initials = profile.name
    .split(' ')
    .map((w) => w[0])
    .join('')

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__frame" aria-hidden="true">
        <span>{initials}</span>
      </div>
      <div className="hero__text">
        <p className="eyebrow">{profile.role}</p>
        <h1 id="hero-title">{profile.name}</h1>
        <p className="hero__tagline">{profile.tagline}</p>
      </div>
    </section>
  )
}
