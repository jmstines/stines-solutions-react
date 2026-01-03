import { Link } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import './styles.css'

export default function Navbar() {
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
    };

    return (
        <nav className="nav-top">
            <span className='nav-container'>
                <ul>
                    <Link className='nav-top-main' to={"/"}>
                        <span className="business-logo-font">Stines Solutions</span>
                    </Link>
                    
                    {user && (
                        <Link className='nav-top-menu' to="/chat">Chat</Link>
                    )}
                    
                    {user && user.role === 'admin' && (
                        <Link className='nav-top-menu' to="/admin">Admin</Link>
                    )}
                    
                    {user ? (
                        <button className='nav-top-menu nav-button' onClick={handleLogout}>Logout</button>
                    ) : (
                        <Link className='nav-top-menu' to="/login">Login</Link>
                    )}
                             
                    <Link className='nav-top-menu' to="/contact">Contact</Link>
                    <Link className='nav-top-menu' to="/projects">Projects</Link>
                    <Link className='nav-top-menu' to="/about">About</Link>
                    <Link className='nav-top-menu' to="/">Home</Link> 
                </ul>
            </span>
        </nav>
    )
}