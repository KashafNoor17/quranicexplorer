import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Book, Search, Bookmark, Settings, Home, Heart, ArrowLeft, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/search', label: 'Search', icon: Search },
  { path: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
  { path: '/duas', label: 'Duas', icon: Heart },
  { path: '/settings', label: 'Settings', icon: Settings },
];

interface HeaderProps {
  showBack?: boolean;
  title?: string;
}

export function Header({ showBack, title }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut } = useAuth();
  
  // Show back button on all pages except homepage
  const isHomePage = location.pathname === '/';

  const handleBack = () => {
    // Use browser history to go back
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <header 
      className="sticky top-0 z-50 w-full border-b border-border/50 glass-card"
      role="banner"
    >
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        {/* Left section */}
        <div className="flex items-center gap-4">
          {!isHomePage && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="shrink-0 transition-transform hover:scale-105 active:scale-95 focus-ring" 
              aria-label="Go back to previous page"
              onClick={handleBack}
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </Button>
          )}
          <Link 
            to="/" 
            className="flex items-center gap-3 focus-ring rounded-lg"
            aria-label="Quran Explorer - Go to homepage"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-light shadow-soft">
              <Book className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
            </div>
            <div className="hidden md:block">
              <h1 className="text-lg font-bold text-foreground">
                {title || 'Quran Explorer'}
              </h1>
              <p className="text-xs text-muted-foreground">Explore. Reflect. Learn.</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav 
          className="flex items-center gap-1 md:gap-2"
          role="navigation"
          aria-label="Main navigation"
        >
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    'transition-all focus-ring',
                    isActive && 'emerald-glow'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden md:inline">{item.label}</span>
                  <span className="sr-only md:hidden">{item.label}</span>
                </Button>
              </Link>
            );
          })}

          {/* Auth button */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="ml-2 focus-ring"
                  aria-label="User menu"
                >
                  <User className="h-4 w-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="px-2 py-1.5 text-sm">
                  <p className="font-medium">{user?.email}</p>
                  <p className="text-xs text-muted-foreground">Signed in</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="h-4 w-4 mr-2" aria-hidden="true" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="ml-2 focus-ring">
                <User className="h-4 w-4" aria-hidden="true" />
                <span className="hidden md:inline">Sign in</span>
                <span className="sr-only md:hidden">Sign in</span>
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-card/50 py-12">
      <div className="container px-4 md:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          {/* About */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-light">
                <Book className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-bold">Quran Explorer</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The Holy Quran is the divine revelation of Allah, providing guidance, 
              wisdom, and moral principles for humanity.
            </p>
          </div>

          {/* Purpose */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Our Purpose</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Enable modern Quran exploration, foster learning, reflection, 
              memorization, and demonstrate secure Islamic platforms.
            </p>
          </div>

          {/* Disclaimer */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Disclaimer</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This platform supports Quranic study and learning using secure 
              web technologies.
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-border/50 pt-8 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Quran Explorer. All translations from Sahih International.
          </p>
        </div>
      </div>
    </footer>
  );
}
