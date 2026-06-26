import { useEffect, useState, FormEvent, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UploadCloud, User, Globe, Menu, X, Bell } from 'lucide-react';
import api from '../../services/api';
import { getFavoritesCount } from '../../services/favorites.api';
import { getNotifications, getNotificationsCount } from '../../services/notification.api';
import { useAuth } from '../../hooks/useAuth';
import useSocket from '../../hooks/useSocket';

interface CategoryItem {
  _id: string;
  name: string;
  labelKh?: string;
}

const Header = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [category, setCategory] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const categoriesButtonRef = useRef<HTMLButtonElement | null>(null);
  const categoriesMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const notificationsButtonRef = useRef<HTMLButtonElement | null>(null);
  const notificationsMenuRef = useRef<HTMLDivElement | null>(null);

  const fetchNotificationsCount = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    try {
      const count = await getNotificationsCount();
      setNotificationCount(count);
    } catch (error) {
      setNotificationCount(0);
    }
  };

  const fetchRecentNotifications = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    try {
      const data = await getNotifications();
      // Ensure recentNotifications is always an array
      const notificationItems = Array.isArray(data)
        ? data
        : data?.items || [];
      setRecentNotifications(notificationItems);
    } catch (error) {
      setRecentNotifications([]);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        categoriesMenuRef.current &&
        !categoriesMenuRef.current.contains(e.target as Node) &&
        !categoriesButtonRef.current?.contains(e.target as Node)
      ) {
        setCategoriesOpen(false);
      }
      if (
        notificationsMenuRef.current &&
        !notificationsMenuRef.current.contains(e.target as Node) &&
        !notificationsButtonRef.current?.contains(e.target as Node)
      ) {
        setNotificationsOpen(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement)?.closest('[role="button"]')?.contains(e.target as Node)
      ) {
        // Allow mobile menu to close via mobile menu button
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleCategoryClick = () => {
    setCategoriesOpen(false);
    categoriesButtonRef.current?.focus();
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        setCategories(response.data.data || []);
      } catch (error) {
        setCategories([]);
      }
    };

    const fetchFavoriteCount = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      try {
        const count = await getFavoritesCount();
        setFavoriteCount(count);
      } catch (error) {
        setFavoriteCount(0);
      }
    };

    fetchCategories();
    if (user) {
      fetchFavoriteCount();
      fetchNotificationsCount();
    } else {
      setFavoriteCount(0);
      setNotificationCount(0);
    }

    return undefined;
  }, [user]);

  useEffect(() => {
    const handleNotificationsUpdated = () => {
      fetchNotificationsCount();
      if (notificationsOpen) {
        fetchRecentNotifications();
      }
    };

    window.addEventListener('notificationsUpdated', handleNotificationsUpdated);
    return () => window.removeEventListener('notificationsUpdated', handleNotificationsUpdated);
  }, [notificationsOpen]);

  useEffect(() => {
    if (!user || !socket) return;

    const handleNewNotification = async (notification: any) => {
      if (typeof notification?.unreadCount === 'number') {
        setNotificationCount(notification.unreadCount);
      } else {
        setNotificationCount((current) => current + 1);
      }
      if (notificationsOpen) {
        await fetchRecentNotifications();
      }
    };

    socket.on('new_notification', handleNewNotification);
    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [socket, user, notificationsOpen]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (category) params.append('category', category);
    navigate(`/products?${params.toString()}`);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-surface-muted bg-white/95 backdrop-blur shadow-sm">
      <div className="bg-primary text-white hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1 flex items-center justify-between text-xs sm:text-sm">
          <p className="font-medium">Fast, trusted local shopping across Cambodia.</p>
          <div className="flex flex-wrap items-center gap-3 text-white/90">
            <Link to="/help" className="hover:text-white">Help</Link>
            <span className="hidden sm:inline">·</span>
            <Link to="/about" className="hover:text-white">About</Link>
            <span className="hidden sm:inline">·</span>
            <div
              role="group"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-white text-[0.8rem]"
              aria-label="Language switcher"
            >
              <span className="inline-flex items-center gap-1 font-semibold">
                <Globe className="w-4 h-4" />
                English
              </span>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[0.65rem] font-semibold">Current</span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[0.65rem] text-white/80">Khmer Coming Soon</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <img src="/logo.png" alt="Konpuk" className="h-10 md:h-12 w-auto" />
            </Link>
          </div>

          {/* Categories dropdown centered on desktop */}
          <div className="hidden lg:flex items-center justify-center flex-1">
            <div className="relative">
              <button
                ref={categoriesButtonRef}
                type="button"
                onClick={() => setCategoriesOpen((s) => !s)}
                className="inline-flex items-center gap-2 rounded-3xl border border-muted bg-white px-4 py-2 text-sm font-medium text-text-primary hover:shadow-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-haspopup="menu"
                aria-expanded={categoriesOpen}
                aria-controls="categories-menu"
              >
                ក្រុមផលិតផល
              </button>
              {categoriesOpen && (
                <div
                  id="categories-menu"
                  ref={categoriesMenuRef}
                  className="absolute left-1/2 transform -translate-x-1/2 mt-2 w-60 bg-white rounded-2xl shadow-lg border border-muted p-3 z-50"
                  role="menu"
                  aria-label="Categories"
                  onKeyDown={(e) => {
                    const links = categoriesMenuRef.current?.querySelectorAll('a');
                    if (!links || links.length === 0) return;
                    const focusable = Array.from(links) as HTMLElement[];
                    const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      const next = focusable[(currentIndex + 1) % focusable.length];
                      next.focus();
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      const prev = focusable[(currentIndex - 1 + focusable.length) % focusable.length];
                      prev.focus();
                    } else if (e.key === 'Home') {
                      e.preventDefault();
                      (focusable[0] as HTMLElement).focus();
                    } else if (e.key === 'End') {
                      e.preventDefault();
                      (focusable[focusable.length - 1] as HTMLElement).focus();
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      setCategoriesOpen(false);
                      categoriesButtonRef.current?.focus();
                    }
                  }}
                >
                  <div className="grid grid-cols-2 gap-2">
                    <Link onClick={handleCategoryClick} to="/products?category=food" role="menuitem" tabIndex={0} className="flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                      <span className="text-lg">🍜</span>
                      <span>ម្ហូប</span>
                    </Link>
                    <Link onClick={handleCategoryClick} to="/products?category=phones" role="menuitem" tabIndex={0} className="flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                      <span className="text-lg">📱</span>
                      <span>ទូរស័ព្ទ</span>
                    </Link>
                    <Link onClick={handleCategoryClick} to="/products?category=electronics" role="menuitem" tabIndex={0} className="flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                      <span className="text-lg">🔌</span>
                      <span>អេឡិចត្រូនិក</span>
                    </Link>
                    <Link onClick={handleCategoryClick} to="/products?category=auto" role="menuitem" tabIndex={0} className="flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                      <span className="text-lg">🚗</span>
                      <span>យានយន្ត</span>
                    </Link>
                    <Link onClick={handleCategoryClick} to="/products?category=real-estate" role="menuitem" tabIndex={0} className="flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                      <span className="text-lg">🏠</span>
                      <span>អចលនទ្រព្យ</span>
                    </Link>
                    <Link onClick={handleCategoryClick} to="/products?category=clothing" role="menuitem" tabIndex={0} className="flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                      <span className="text-lg">👕</span>
                      <span>សម្លៀកបំពាក់</span>
                    </Link>
                    <Link onClick={handleCategoryClick} to="/products?category=furniture" role="menuitem" tabIndex={0} className="flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                      <span className="text-lg">🛋️</span>
                      <span>គ្រឿងសង្ហារឹម</span>
                    </Link>
                    <Link onClick={handleCategoryClick} to="/products?category=services" role="menuitem" tabIndex={0} className="flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                      <span className="text-lg">🛠️</span>
                      <span>សេវាកម្ម</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/help" className="hidden lg:inline-flex items-center justify-center rounded-3xl border border-muted bg-white px-4 py-2 text-sm font-medium text-text-secondary hover:bg-white/90 transition">
              Help
            </Link>
            <Link
              to="/post-product"
              className="inline-flex items-center gap-2 rounded-3xl bg-[#0F766E] px-4 py-2 text-sm font-medium text-white hover:bg-[#0f6f63] transition"
            >
              <UploadCloud className="w-4 h-4" />
              លក់ទំនិញ
            </Link>

            {user ? (
              <div className="hidden lg:relative lg:inline-flex group">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-3xl border border-muted bg-white px-4 py-2 text-sm font-medium text-text-secondary hover:bg-white/90 transition"
                  title={user.displayName ? `User menu (${user.displayName})` : 'User menu'}
                >
                  {user.profileImageUrl ? (
                    <img src={user.profileImageUrl} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                  {/* Desktop: full display name; Mobile: shortened name or initials */}
                  {user.displayName && (
                    <>
                      <span className="hidden md:inline truncate max-w-[10rem]">{user.displayName}</span>
                      <span className="inline md:hidden font-medium">
                        {(() => {
                          const parts = user.displayName.trim().split(/\s+/);
                          if (parts.length === 1) return parts[0].slice(0, 10);
                          const last = parts[parts.length - 1];
                          const initials = (parts[0][0] || '') + (parts.length > 1 ? (parts[parts.length - 1][0] || '') : '');
                          return last.length <= 8 ? last : initials.toUpperCase();
                        })()}
                      </span>
                    </>
                  )}
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-3xl shadow-xl border border-muted opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <Link to="/profile" className="block px-4 py-3 text-sm font-semibold text-text-secondary hover:bg-background rounded-t-3xl">ពត៌មានគណនី</Link>
                  <button type="button" onClick={async () => { try { await logout(); } catch { localStorage.removeItem('authToken'); localStorage.removeItem('refreshToken'); localStorage.removeItem('user'); } navigate('/'); }} className="w-full text-left px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-background border-t border-muted rounded-b-3xl">ចេញពីប្រព័ន្ធ</button>
                </div>
              </div>
            ) : (
              <>
                <Link to="/login" className="hidden lg:inline-flex items-center gap-2 rounded-3xl border border-muted bg-white px-4 py-2 text-sm font-medium text-text-secondary hover:bg-white/90 transition">ចូលគណនី</Link>
                <Link to="/register" className="hidden lg:inline-flex items-center gap-2 rounded-3xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition">បង្កើតគណនី</Link>
              </>
            )}

            {user && (
              <div className="relative">
                <button
                  ref={notificationsButtonRef}
                  type="button"
                  onClick={async () => {
                      setNotificationsOpen((current) => {
                        const nextOpen = !current;
                        if (nextOpen) {
                          fetchRecentNotifications();
                        }
                        return nextOpen;
                      });
                  }}
                  className="relative inline-flex h-10 w-10 items-center justify-center rounded-3xl border border-muted bg-white text-text-secondary transition hover:bg-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-haspopup="menu"
                  aria-expanded={notificationsOpen}
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {notificationCount > 0 && (
                    <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-600 px-1.5 text-[0.625rem] font-semibold text-white">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </button>
                {notificationsOpen && (
                  <div
                    ref={notificationsMenuRef}
                    className="absolute right-0 mt-2 w-80 max-w-full rounded-3xl border border-muted bg-white p-3 shadow-xl z-50"
                    role="menu"
                    aria-label="Notifications"
                  >
                    <div className="flex items-center justify-between gap-3 px-2 pb-2">
                      <div>
                        <p className="text-sm font-semibold text-text-primary">Notifications</p>
                        <p className="text-xs text-muted">Recent updates for your account</p>
                      </div>
                      <Link to="/notifications" onClick={() => setNotificationsOpen(false)} className="text-xs font-semibold text-primary hover:text-primary-hover">View all</Link>
                    </div>
                    <div className="space-y-2 max-h-72 overflow-y-auto pt-2">
                      {recentNotifications.length ? (
                        recentNotifications.slice(0, 5).map((notification) => (
                          <Link
                            key={notification._id}
                            to={notification.link || '/notifications'}
                            onClick={() => setNotificationsOpen(false)}
                            className={`block rounded-3xl border p-3 text-sm transition ${notification.read ? 'border-muted bg-white' : 'border-primary/20 bg-primary/5 hover:bg-primary/10'}`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium text-text-primary line-clamp-1">{notification.title}</p>
                              {!notification.read && <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary text-[0.65rem] font-semibold text-white">new</span>}
                            </div>
                            <p className="mt-1 text-xs text-text-secondary line-clamp-2">{notification.message}</p>
                          </Link>
                        ))
                      ) : (
                        <div className="rounded-3xl border border-muted bg-background p-4 text-sm text-text-secondary">
                          No new notifications yet.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button type="button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-3xl border border-muted bg-white text-text-primary shadow-sm" aria-label="Toggle mobile menu">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button type="button" onClick={() => setMobileMenuOpen(false)} className="absolute inset-0 bg-black/40" aria-label="Close mobile menu" />
            <div ref={mobileMenuRef} className="absolute left-0 top-0 h-full w-4/5 max-w-xs overflow-y-auto rounded-tr-3xl rounded-br-3xl border-r border-surface-muted bg-white p-4 shadow-xl">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <p className="text-base font-semibold text-text-primary">Navigation</p>
                  <p className="text-sm text-muted">Mobile menu</p>
                </div>
                <button type="button" onClick={() => setMobileMenuOpen(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-3xl border border-muted bg-white text-text-primary shadow-sm" aria-label="Close menu">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-2">
                <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block rounded-3xl px-4 py-3 text-sm font-semibold text-text-secondary hover:bg-background">Home</Link>
                <Link to="/products" onClick={() => setMobileMenuOpen(false)} className="block rounded-3xl px-4 py-3 text-sm font-semibold text-text-secondary hover:bg-background">Browse Products</Link>
                <Link to="/post-product" onClick={() => setMobileMenuOpen(false)} className="block rounded-3xl bg-[#0F766E] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0e6e60]">Post Product</Link>
                <Link to="/messages" onClick={() => setMobileMenuOpen(false)} className="block rounded-3xl px-4 py-3 text-sm font-semibold text-text-secondary hover:bg-background">Messages</Link>
                <Link to="/notifications" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-between rounded-3xl px-4 py-3 text-sm font-semibold text-text-secondary hover:bg-background">
                  <span>Notifications</span>
                  {notificationCount > 0 && <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-rose-600 px-2 text-[0.65rem] font-semibold text-white">{notificationCount > 9 ? '9+' : notificationCount}</span>}
                </Link>
                <hr className="border-surface-muted" />
                <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="block rounded-3xl px-4 py-3 text-sm font-semibold text-text-secondary hover:bg-background">About</Link>
                <Link to="/guide" onClick={() => setMobileMenuOpen(false)} className="block rounded-3xl px-4 py-3 text-sm font-semibold text-text-secondary hover:bg-background">Guide</Link>
                <Link to="/help" onClick={() => setMobileMenuOpen(false)} className="block rounded-3xl px-4 py-3 text-sm font-semibold text-text-secondary hover:bg-background">Help</Link>
                <hr className="border-surface-muted" />
                {user ? (
                  <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="block rounded-3xl px-4 py-3 text-sm font-semibold text-text-secondary hover:bg-background">Profile</Link>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block rounded-3xl px-4 py-3 text-sm font-semibold text-text-secondary hover:bg-background">Login</Link>
                    <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="block rounded-3xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-hover">Register</Link>
                  </>
                )}
                <details className="rounded-3xl border border-muted bg-white p-2 mt-4">
                  <summary className="px-3 py-2 text-sm font-semibold">Product categories</summary>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Link onClick={() => setMobileMenuOpen(false)} to="/products?category=food" className="px-3 py-2 text-sm rounded hover:bg-background">ម្ហូប</Link>
                    <Link onClick={() => setMobileMenuOpen(false)} to="/products?category=phones" className="px-3 py-2 text-sm rounded hover:bg-background">ទូរស័ព្ទ</Link>
                    <Link onClick={() => setMobileMenuOpen(false)} to="/products?category=electronics" className="px-3 py-2 text-sm rounded hover:bg-background">អេឡិចត្រូនិក</Link>
                    <Link onClick={() => setMobileMenuOpen(false)} to="/products?category=auto" className="px-3 py-2 text-sm rounded hover:bg-background">យានយន្ត</Link>
                    <Link onClick={() => setMobileMenuOpen(false)} to="/products?category=real-estate" className="px-3 py-2 text-sm rounded hover:bg-background">អចលនទ្រព្យ</Link>
                    <Link onClick={() => setMobileMenuOpen(false)} to="/products?category=clothing" className="px-3 py-2 text-sm rounded hover:bg-background">សម្លៀកបំពាក់</Link>
                    <Link onClick={() => setMobileMenuOpen(false)} to="/products?category=furniture" className="px-3 py-2 text-sm rounded hover:bg-background">គ្រឿងសង្ហារឹម</Link>
                    <Link onClick={() => setMobileMenuOpen(false)} to="/products?category=services" className="px-3 py-2 text-sm rounded hover:bg-background">សេវាកម្ម</Link>
                  </div>
                </details>
              </nav>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

