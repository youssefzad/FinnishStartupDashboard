import './PageHero.css'

interface PageHeroProps {
  title: string
  subtitle?: string
  className?: string
  backgroundImage?: string // Optional: path to background image (e.g., '/images/hero-bg.jpg')
}

const PageHero = ({ title, subtitle, className = '', backgroundImage }: PageHeroProps) => {
  return (
    <section className={`page-hero ${className} ${backgroundImage ? 'has-bg-image' : ''}`}>
      {/* Static background image layer */}
      {backgroundImage && (
        <div 
          className="page-hero-bg-image"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        ></div>
      )}
      
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

