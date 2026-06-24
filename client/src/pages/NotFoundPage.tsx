import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="grid min-h-[60vh] place-items-center text-center">
      <div className="space-y-6 rounded-[2rem] bg-white p-10 shadow-xl ring-1 ring-border">
        <p className="text-sm uppercase tracking-[0.35em] text-primary">Page not found</p>
        <h1 className="text-4xl font-semibold text-text-primary">404 — Nothing here</h1>
        <p className="text-sm text-muted">The page you are looking for may have moved or no longer exists.</p>
        <Link to="/" className="inline-flex rounded-full bg-text-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover">
          Return home
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;


