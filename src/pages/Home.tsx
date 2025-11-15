import './_pageStyles.css'
import './Home.css'

export default function Home() {
  return (
    <div className="home-container">
      {/* Hero Section */}
      <header className="home-hero">
        <img
          src="/assets/profile.png"
          alt="Profile"
          className="hero-image"></img>

        <h1 className="heading-primary">Hi, I'm Jeffrey Stines</h1>
        <p className="intro-text">
          Senior Software Engineer passionate about building scalable SaaS
          solutions with C#, AWS, and modern web technologies.
        </p>
      </header>

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
