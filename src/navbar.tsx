import { Link } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useState, useRef, useEffect } from 'react';
import './styles.css'

export default function Navbar() {
    const { user, logout } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleLogout = async () => {
        await logout();
        setShowDropdown(false);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        if (showDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showDropdown]);

    return (
        <nav className="nav-top">
            <span className='nav-container'>
                <ul>
                    <Link className='nav-top-main' to={"/"}>
                        <span className="business-logo-font">Stines Solutions</span>
                    </Link>
                    
                    {user ? (
                        <div className="nav-top-menu user-menu" ref={dropdownRef}>
                            <button 
                                className="user-menu-button" 
                                onClick={() => setShowDropdown(!showDropdown)}
                                aria-label="User menu"
                            >
                                <svg className="user-icon" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                            </button>
                            {showDropdown && (
                                <div className="user-dropdown">
                                    <div className="user-dropdown-header">
                                        <span className="user-name">{user.email}</span>
                                        <span className="user-role">{user.role}</span>
                                    </div>
                                    <div className="user-dropdown-divider"></div>
                                    <button className="user-dropdown-item" onClick={handleLogout}>
                                        <svg className="dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link className='nav-top-menu' to="/login">Login</Link>
                    )}
                    
                    {user && user.role === 'admin' && (
                        <Link className='nav-top-menu' to="/admin">Admin</Link>
                    )}
                    
                    {user && (
                        <Link className='nav-top-menu' to="/chat">Chat</Link>
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