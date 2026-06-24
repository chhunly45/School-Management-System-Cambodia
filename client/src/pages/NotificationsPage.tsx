import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCircle2 } from 'lucide-react';
import { getNotifications, markNotificationRead } from '../services/notification.api';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadNotifications = async () => {
      setLoading(true);
      try {
        const data = await getNotifications();
        // Ensure notifications is always an array
        const notificationItems = Array.isArray(data)
          ? data
          : data?.items || [];
        setNotifications(notificationItems);
      } catch (error) {
        setMessage('Unable to load notifications.');
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, []);

  const markRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications((current) => current.map((item) => (item._id === id ? { ...item, read: true } : item)));
      window.dispatchEvent(new Event('notificationsUpdated'));
    } catch (error) {
      setMessage('Unable to mark notification as read.');
    }
  };

  return (
    <div className="space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="rounded-[2rem] bg-white p-8 shadow-xl ring-1 ring-border">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-text-primary">Notifications</h1>
            <p className="mt-2 text-sm text-muted">Review updates about favorites, sales, verification status, and moderation.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-background px-4 py-2 text-sm text-text-secondary">
            <Bell className="w-5 h-5 text-muted" />
            {notifications.filter((notification) => !notification.read).length} unread
          </div>
        </div>
      </header>

      {message && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{message}</div>
      )}

      {loading ? (
        <div className="rounded-3xl border border-muted bg-background p-12 text-center text-text-secondary">Loading notifications…</div>
      ) : notifications.length ? (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <article key={notification._id} className={`rounded-3xl border ${notification.read ? 'border-muted bg-white' : 'border-primary/30 bg-primary/10'} p-6 shadow-sm`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">{notification.title}</h2>
                  <p className="mt-2 text-sm text-text-secondary">{notification.message}</p>
                  {notification.link && (
                    <Link to={notification.link} className="mt-3 inline-flex text-sm font-semibold text-primary hover:text-primary">
                      View details
                    </Link>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => markRead(notification._id)}
                  disabled={notification.read}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-text-secondary ring-1 ring-border hover:bg-background disabled:cursor-not-allowed disabled:bg-background disabled:text-muted transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {notification.read ? 'Read' : 'Mark as read'}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-muted bg-background p-12 text-center text-text-secondary">
          <p className="text-lg font-semibold">No notifications yet</p>
          <p className="mt-2 text-sm">Once your listings are saved or reviewed, notifications will appear here.</p>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;


