import './_pageStyles.css'

export default function Home() {
  return (
    <div className="home-container">
      {/* Hero Section */}
      <header className="home-hero">
        /images/profile.jpg
        <h1 className="heading-primary">Hi, I'm Jeffrey Stines</h1>
        <p className="intro-text">
          Senior Software Engineer passionate about building scalable SaaS
          solutions with C#, AWS, and modern web technologies.
        </p>
        <div className="home-actions">
          {/* /aboutAbout Me</a>
          /projectsView Projects</a> */}
        </div>
      </header>

      {/* Highlights Section */}
      <section className="home-highlights">
        <h2>What I Do</h2>
        <ul>
          <li>
            Design and build cloud-native applications using AWS and .NET Core
          </li>
          <li>
            Modernize legacy systems and migrate to scalable architectures
          </li>
          <li>
            Create developer-friendly tools and automation for efficiency
          </li>
        </ul>
      </section>
    </div>
  );
}
