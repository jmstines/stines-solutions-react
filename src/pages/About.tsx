import './About.css'

export default function About() {
    return (
    <div  id="about" className="about__info main-container">
        <div className="about__main-info">
            <h3 className="heading-quaternary about__heading-quaternary">
                My Story
            </h3>
            <p className="text-primary about__text-primary">
                <span>
                    Hi there! I'm a seasoned software engineer with a passion for problem solving.
                    I started my career as a Mechanical Engineering Designer where I designed 
                    complex mecanical systems ranging from fall protection systems to ice delievery 
                    systems for nuclear power plants. I started reteaching myself software development
                    back in 2014. That has been an ongoing process that I like to think I have gotten 
                    very good at. I have always been a problem solver from the first lego kit 
                    I recieved as a kid, to the first PC I build from scratch, to the time I took apart
                    and repaired my washing machine in college.
                </span>
                <span>
                    I have worked for several very interesting companies in different industries.
                    I supported factory floor applications, lab personal and data collection, 
                    healthcare operations, and SAAS billing infrasructure.  After transitioning to 
                    software development I began the journey of learning everything I could to became 
                    a Senior Developer and lead Developer.  and led
                    or participated in projects involving legacy application retirement and
                    migration, single-page application development, custom docker image creation,
                    and external customer facing web sites.
                </span>
                <span>
                    Currently, I'm working on a SaaS
                    billing system using **C#, Typescript, AWS, Lambda, DynamoDB, and Terraform**.
                    This role allows me to further expand my technical skills while contributing
                    to a critical part of the business. In my spare time, I attend meetup and tinker
                    on on side projects that help me explore new technologies and methodologies and 
                    stay updated and relevant in this ever-evolving industry.
                </span>
            </p>
        </div>
        <div className="about__skill-info">
            <h3 className="heading-quaternary about__heading-quaternary">
                My Skills
            </h3>
            <ul className="about__skills">
                <li className="about__skill">C#</li>
                <li className="about__skill">.Net Core</li>
                <li className="about__skill">SQL</li>
                <li className="about__skill">Typescript</li>
                <li className="about__skill">Node</li>
                <li className="about__skill">NVM</li>
                <li className="about__skill">Bash</li>
                <li className="about__skill">git</li>
                <li className="about__skill">Terraform</li>
                <li className="about__skill">Vue</li>
                <li className="about__skill">React</li>
                <li className="about__skill">Visual Studio</li>
                <li className="about__skill">VS Code</li>
                <li className="about__skill">Rider</li>
                <li className="about__skill">Postman</li>
                <li className="about__skill">LinkPad</li>
                <li className="about__skill">SSMS</li>
                <li className="about__skill">AWS Lambda</li>
                <li className="about__skill">AWS DynamoDB</li>
                <li className="about__skill">AWS API Gateway</li>
                <li className="about__skill">AWS Cloud Watch</li>
                <li className="about__skill">AWS Secrets Manager</li>
                <li className="about__skill">AWS SQS</li>
                <li className="about__skill">Azure</li>
                <li className="about__skill">Splunk</li>
                <li className="about__skill">New Relic</li>
                <li className="about__skill">Docker</li>
                <li className="about__skill">linux</li>
                <li className="about__skill">javascript</li>
                <li className="about__skill">AngularJS</li> 
            </ul>
        </div>
    </div>
  );
}