import { Link } from 'react-router-dom'
import { publications } from '../data/publications'
import './LandingPage.css'
import './About.css'
import './Publications.css'

const Publications = () => {
  return (
    <div className="publications-page">
      <div className="publications-container">
        <header className="publications-header">
          <h1 className="publications-title">Publications</h1>
          <p className="publications-subtitle">
            Research and publications about the Finnish startup ecosystem
          </p>
        </header>

        <main className="publications-content">
          {publications.length === 0 ? (
            <section className="publications-section publications-section-empty" aria-label="No publications yet">
              <h2 className="section-title">Coming Soon</h2>
              <p className="section-description">
                Publications and research papers will be available here soon.
              </p>
            </section>
          ) : (
            <ul className="publications-list" role="list">
              {publications.map((item) => (
                <li key={item.id} className="publication-card">
                  <h2 className="publication-card-title">{item.title}</h2>
                  <p className="publication-card-description">{item.description}</p>
                  <a
                    className="cta-button primary publication-download-link"
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {item.downloadLabel}
                  </a>
                </li>
              ))}
            </ul>
          )}

          <section
            className="about-cta publications-explore-cta"
            aria-labelledby="publications-cta-heading"
          >
            <div className="about-cta-inner">
              <h2 id="publications-cta-heading" className="about-cta-title">
                Explore the Data
              </h2>
              <p className="about-cta-text">
                Dive into the charts and indicators behind the Finnish startup ecosystem.
              </p>
              <Link to="/data" className="cta-button primary publication-explore-link">
                Explore Data
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

export default Publications
