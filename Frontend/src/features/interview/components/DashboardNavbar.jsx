import React from 'react'

const DashboardNavbar = ({ username = "User", onLogout }) => {
    return (
        <header className='dashboard-header'>
            <div className='dashboard-navbar'>
                <div className='navbar-brand'>
                    <span>Interview AI</span>
                </div>
                <nav className='navbar-user-nav' aria-label="User navigation">
                    <div className='user-profile'>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="user-icon" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                        <span className='user-name' title={username}>{username}</span>
                    </div>
                    <button
                        onClick={onLogout}
                        className='logout-btn'
                        aria-label="Log out"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="logout-icon" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                        <span className='logout-text'>Logout</span>
                    </button>
                </nav>
            </div>
        </header>
    )
}

export default DashboardNavbar
