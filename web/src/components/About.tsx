import './About.css'

type AboutSectionProps = {
  title: string
  children: React.ReactNode
}

const AboutSection = ({ title, children }: AboutSectionProps) => (
  <section className="about-section" aria-labelledby={`about-${title.toLowerCase().replace(/\s+/g, '-')}`}>
    <h2 id={`about-${title.toLowerCase().replace(/\s+/g, '-')}`} className="about-section-title">
      {title}
    </h2>
    <div className="about-section-content">{children}</div>
  </section>
)

const About = () => {
  return (
    <main className="about-page">
      <div className="about-container">
        <header className="about-header">
          <p className="about-eyebrow">Finnish Startup Ecosystem</p>
          <h1 className="about-title">About the Platform</h1>
          <p className="about-intro">
            The Finnish Startup Ecosystem platform provides data-driven insights into startup activity,
            firms, and ecosystem development in Finland. Its purpose is to make startup-related
            data more accessible, understandable, and useful for decision-making, research, and public discussion.
          </p>
        </header>

        <div className="about-grid">
          <AboutSection title="What this platform is">
            <p>
              This platform brings together data and analysis on the Finnish startup ecosystem in one place.
              It is designed to help users explore how startups emerge, grow, and contribute to the wider economy.
            </p>
            <p>
              The platform is intended for policymakers, researchers, investors, founders, and others seeking
              a clearer understanding of entrepreneurship and innovation in Finland.
            </p>
          </AboutSection>

          <AboutSection title="Data Sources">
            <p>
              The platform combines Statistics Finland administrative datasets with curated startup lists.
              Administrative datasets provide structured and reliable information on firms, employment, wages,
              education, ownership, and business development over time.
            </p>
            <p>
              Curated startup lists help identify the segment of firms that is most relevant for startup ecosystem
              analysis. Together, these sources make it possible to study the Finnish startup ecosystem with greater
              depth and consistency than would be possible using a single source alone.
            </p>
          </AboutSection>

          <AboutSection title="Methodology">
            <p>
              The methodology used on this platform is based on linking curated startup identification to high-quality
              administrative register data from Statistics Finland. This approach makes it possible to analyze firms
              across a range of dimensions, including employment, wages, ownership, and firm development over time.
            </p>
            <p>
              Depending on the dataset, indicator, or visualization, exact definitions, time coverage, and included
              variables may vary. The aim is not to reduce the startup ecosystem to a single metric, but to provide
              a robust, transparent, and policy-relevant picture of its structure and evolution.
            </p>
          </AboutSection>

          <AboutSection title="Why it matters">
            <p>
              Reliable data on startups matters because startups play an important role in innovation, renewal, and
              long-term economic growth. Better information helps improve public debate and supports better decisions
              in entrepreneurship policy, innovation policy, investment, and ecosystem development.
            </p>
            <p>
              By making this information easier to access, the platform aims to strengthen understanding of how the
              Finnish startup ecosystem is changing over time.
            </p>
          </AboutSection>
        </div>

        <section className="about-note" aria-label="Transparency note">
          <h2 className="about-section-title">Transparency note</h2>
          <p>
            Definitions and data coverage may differ across indicators and visualizations.
            Users should interpret results in the context of each chart, metric, or dataset description.
          </p>
        </section>

        <section className="about-contact" aria-label="Contact">
          <h2 className="about-section-title">Contact</h2>
          <p>
            For questions related to the Finnish Startup Ecosystem platform, please contact the Finnish Startup Community.
          </p>
          <a
            className="about-contact-link"
            href="https://startupyhteiso.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Finnish Startup Community
          </a>
        </section>
      </div>
    </main>
  )
}

export default About

