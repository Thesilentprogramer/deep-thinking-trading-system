import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { LogOut, User, ChevronDown } from 'lucide-react';

export default function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const initials = user?.displayName
    ? user.displayName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? 'U';

  const name = user?.displayName || user?.email?.split('@')[0] || 'User';

  return (
    <div className="user-menu-wrapper" ref={menuRef}>
      <button
        id="user-menu-trigger"
        className="user-menu-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-label="User menu"
      >
        {user?.photoURL ? (
          <img src={user.photoURL} alt={name} className="user-avatar-img" />
        ) : (
          <div className="user-avatar-initials">{initials}</div>
        )}
        <ChevronDown size={12} className={`user-menu-chevron ${open ? 'open' : ''}`} />
      </button>

      {open && (
        <div className="user-menu-dropdown">
          <div className="user-menu-info">
            <div className="user-menu-name">{name}</div>
            <div className="user-menu-email">{user?.email}</div>
          </div>
          <div className="user-menu-divider" />
          <button
            id="user-menu-logout"
            className="user-menu-item"
            onClick={handleLogout}
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
