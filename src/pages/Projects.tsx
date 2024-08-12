import './_pageStyles.css'
import './Projects.css'

export default function Projects() {
    return (
<div  id="projects-main" className="">
    <h3 className="heading-quaternary">
        Projects 🛠️
    </h3>
    
    <h2 className="heading-secondary projects__heading-secondary">
        <span className="heading-secondary__main">
            Here you will find some of the personal and clients projects
            that I created with the project details.
        </span>
    </h2>
    <div className="main-section__content">
        <div className="projects__list">
            <Project></Project>
        </div>
    </div>
</div>
)}

function Project() {
    return (
<div className="projects__list-item-details">
    <div className="projects__list-item-img-cont">
        <img src="./assets/mock.png" alt="Project Image" className="projects__list-item-img" />
    </div>
    <h3 className="heading-tertiary projects__list-item-heading-tertiary">
        Project Name
    </h3>

    <p className="text-primary projects__list-item-text-primary">
        <span>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit.
            Error, aliquid! Itaque corrupti magnam fugiat mollitia
            labore magni saepe veritatis voluptatum alias fugit.
            Explicabo ducimus
        </span>
        <span>
            sapiente aut corporis odio repellendus? Lorem ipsum dolor
            sit amet, consectetur adipisicing elit
        </span>
    </p>
    <button className="btn btn-theme projects__btn-theme">
        Live Link
    </button>
    <button className="btn btn-inv projects__btn-inv">Code Link</button>
</div>
)}