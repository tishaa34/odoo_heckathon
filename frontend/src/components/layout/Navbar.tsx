import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Menu, Moon, Sun, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ROLE_LABELS } from '@/constants';
import { Avatar } from '@/components/common/Misc';
import { Badge } from '@/components/common/Badge';

export function Navbar({ onMenu }: { onMenu: () => void }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-surface/80 px-4 backdrop-blur lg:px-6">
      <button onClick={onMenu} className="focus-ring rounded-lg p-2 text-muted hover:bg-surface-2 lg:hidden" aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden flex-1 sm:block" />

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="focus-ring rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-content"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        <div className="relative" ref={ref}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="focus-ring flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-surface-2"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <Avatar name={user?.name ?? '?'} />
            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold leading-tight text-content">{user?.name}</p>
              <p className="text-[11px] leading-tight text-muted">{user ? ROLE_LABELS[user.role] : ''}</p>
            </div>
            <ChevronDown className="hidden h-4 w-4 text-muted sm:block" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-border bg-surface shadow-pop animate-slide-up" role="menu">
              <div className="border-b border-border px-4 py-3">
                <p className="text-sm font-semibold text-content">{user?.name}</p>
                <p className="truncate text-xs text-muted">{user?.email}</p>
                <div className="mt-2">{user && <Badge tone="blue">{ROLE_LABELS[user.role]}</Badge>}</div>
              </div>
              <button
                onClick={handleLogout}
                className="focus-ring flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-status-suspended hover:bg-surface-2"
                role="menuitem"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
