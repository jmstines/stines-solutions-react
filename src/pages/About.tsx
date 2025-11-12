import './About.css'
import './_pageStyles.css'

export default function About() {
    return (
        <div id="about-main" className="about__info">
            <div className="about__main-info">
                <h3 className="heading-quaternary">
                    My Story
                </h3>         
                <p className="text-primary about__text-primary">
                    <span>
                        Hi there! I’m a seasoned software engineer with a lifelong passion for solving problems. My career began in mechanical engineering, where I designed complex systems—from fall protection solutions to ice delivery mechanisms for nuclear power plants.
                    </span>
                    <span>
                        In 2014, I transitioned into software development, driven by curiosity and a desire to build innovative solutions. Since then, I’ve worked across diverse industries—manufacturing, healthcare, and SaaS—delivering impactful projects that improve efficiency and scalability.
                    </span>
                    <span>
                        <h4 className="heading-secondary">Some Highlights</h4>
                        <ul className="about__highlights text-primary">
                        <li>
                            Consolidating five billing systems into one using AWS Lambda, DynamoDB, and API Gateway, reducing costs to near zero while improving accuracy and reliability.
                        </li>
                        <li>
                            Designing a configurable .NET Core data import application that automated manual processes, saving hours of work.
                        </li>
                        <li>
                            Creating a custom Docker solution for local SQL testing, streamlining developer workflows.
                        </li>
                        </ul>
                    </span>
                    <span>
                        Today, I’m focused on building a robust SaaS billing system using C#, TypeScript, AWS, and Terraform—a role that challenges me to grow while delivering critical business value. Outside of work, I’m an active member and presenter at the Raleigh Triangle .NET User Group (TriNUG) and enjoy exploring new technologies through side projects.
                    </span>
                </p>
            </div>
            <div>
                <h3 className="heading-quaternary">
                    My Skills
                </h3>
                <div >
                    <h3 className="heading-secondary">Languages & Frameworks</h3>
                    <div>
                        <ul className="about__skills">
                            <li className="about__skill">C#</li>
                            <li className="about__skill">.NET Core</li>
                            <li className="about__skill">SQL</li>
                            <li className="about__skill">JavaScript</li>
                            <li className="about__skill">TypeScript</li>
                            <li className="about__skill">Node.js</li>
                            <li className="about__skill">Vue.js</li>
                            <li className="about__skill">React</li>
                            <li className="about__skill">AngularJS</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="heading-secondary">Cloud & Infrastructure</h3>
                        <ul className="about__skills">
                            <li className="about__skill">AWS (Lambda, DynamoDB, API Gateway, CloudWatch, Secrets Manager, SQS)</li>
                            <li className="about__skill">Azure</li>
                            <li className="about__skill">Terraform</li>
                            <li className="about__skill">Docker</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="heading-secondary">Tools & IDEs</h3>
                        <ul className="about__skills">
                            <li className="about__skill">Git</li>
                            <li className="about__skill">Bash</li>
                            <li className="about__skill">NVM</li>
                            <li className="about__skill">Visual Studio</li>
                            <li className="about__skill">VS Code</li>
                            <li className="about__skill">Rider</li>
                            <li className="about__skill">Postman</li>
                            <li className="about__skill">LINQPad</li>
                            <li className="about__skill">SSMS</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="heading-secondary">Monitoring & Logging</h3>
                        <ul className="about__skills">
                            <li className="about__skill">Splunk</li>
                            <li className="about__skill">New Relic</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="heading-secondary">Operating Systems</h3>
                        <ul className="about__skills">
                            <li className="about__skill">Linux</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}