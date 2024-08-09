import { Link } from 'react-router-dom';

export default function Navbar() {
    return (
        <nav className="nav-top">
            <span className='main-container'>
                <ul>
                    <Link className='nav-top-main' to={"/"}>
                        Jeffrey Stines
                    </Link>
                                       
                    <Link className='nav-top-menu' to="/contact">Contact</Link>
                    <Link className='nav-top-menu' to="/projects">Projects</Link>
                    <Link className='nav-top-menu' to="/about">About</Link>
                </ul>
            </span>
        </nav>
    )
}