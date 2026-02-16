import './PageHero.css'

interface PageHeroProps {
  title: string
  subtitle?: string
  className?: string
}

const PageHero = ({ title, subtitle, className = '' }: PageHeroProps) => {
  return (
    <section className={`page-hero ${className}`}>
      {/* Animated background gradient */}
      <div className="page-hero-bg-animation"></div>
      
      <div className="page-hero-content">
        <h1 className="page-hero-title">{title}</h1>
        {subtitle && <p className="page-hero-subtitle">{subtitle}</p>}
      </div>
    </section>
  )
}

export default PageHero

