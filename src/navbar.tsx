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
                                    {user.role === 'admin' && (
                                        <Link 
                                            className="user-dropdown-item" 
                                            to="/admin"
                                            onClick={() => setShowDropdown(false)}
                                        >
                                            <svg className="dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            Admin
                                        </Link>
                                    )}
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