import { Link } from 'react-router-dom';

export default function Navbar() {
    return (
        <nav className="nav">
            <div>Test</div>
            <Link to={"/"}>
                Jeffrey Stines
            </Link>

            <ul>
                <Link to="/about">About</Link>
                <Link to="/projects">Projects</Link>
                <Link to="/contact">Contact</Link>
            </ul>
        </nav>
    )
}