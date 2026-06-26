import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import DeleteConfirmationModal from '../components/common/DeleteConfirmationModal';
import {
  createRoute,
  deleteRoute,
  listRoutes,
  updateRoute,
  type RouteItem,
  type RoutePayload
} from '../services/route.api';

type RouteField = keyof RoutePayload;

type RouteFormValues = {
  routeCode: string;
  routeName: string;
  pickupAreasText: string;
  estimatedDistanceKm: number;
  estimatedDurationMinutes: number;
  status: 'active' | 'inactive';
  notes: string;
};

const emptyRoute: RouteFormValues = {
  routeCode: '',
  routeName: '',
  pickupAreasText: '',
  estimatedDistanceKm: 0,
  estimatedDurationMinutes: 0,
  status: 'active',
  notes: ''
};

const RoutesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [formValues, setFormValues] = useState<RouteFormValues>(emptyRoute);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0 });
  const [formErrors, setFormErrors] = useState<Partial<Record<RouteField | 'pickupAreas', string>>>({});
  const [pendingDeleteRoute, setPendingDeleteRoute] = useState<RouteItem | null>(null);

  useEffect(() => {
    if (!user) return navigate('/login');
    if (user.role !== 'admin') return;
    void loadRoutes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, page]);

  const loadRoutes = async () => {
    setLoading(true);
    try {
      const response = await listRoutes({
        search: searchTerm || undefined,
        status: (statusFilter || undefined) as any,
        page,
        perPage: 10
      });
      setRoutes(response.data?.items || []);
      setMeta(response.data?.meta || { page, limit: 10, total: 0 });
    } catch (err) {
      setMessage('Unable to load routes.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const errorField = name === 'pickupAreasText' ? 'pickupAreas' : name;
    setFormValues((prev) => ({
      ...prev,
      [name]: name === 'estimatedDistanceKm' || name === 'estimatedDurationMinutes' ? Number(value) || 0 : value
    }));
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next[errorField as RouteField | 'pickupAreas'];
      return next;
    });
  };

  const validateRouteForm = () => {
    const nextErrors: Partial<Record<RouteField | 'pickupAreas', string>> = {};

    if (!formValues.routeCode.trim()) nextErrors.routeCode = 'Route code is required.';
    if (!formValues.routeName.trim()) nextErrors.routeName = 'Route name is required.';

    const pickupAreas = formValues.pickupAreasText
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    if (pickupAreas.length === 0) nextErrors.pickupAreas = 'At least one pickup area is required.';

    if (formValues.estimatedDistanceKm < 0) nextErrors.estimatedDistanceKm = 'Distance cannot be negative.';
    if (formValues.estimatedDurationMinutes < 0) nextErrors.estimatedDurationMinutes = 'Duration cannot be negative.';

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const getFieldClassName = (field: RouteField) =>
    `rounded-lg border px-4 py-2 ${formErrors[field] ? 'border-rose-400 bg-rose-50' : 'border-muted'}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRouteForm()) {
      setMessage('Please fix the highlighted fields.');
      return;
    }

    const payload: RoutePayload = {
      routeCode: formValues.routeCode,
      routeName: formValues.routeName,
      pickupAreas: formValues.pickupAreasText.split(',').map((item) => item.trim()).filter(Boolean),
      estimatedDistanceKm: formValues.estimatedDistanceKm,
      estimatedDurationMinutes: formValues.estimatedDurationMinutes,
      status: formValues.status,
      notes: formValues.notes || undefined
    };

    try {
      if (editingId) {
        await updateRoute(editingId, payload);
        setMessage('Route updated successfully.');
      } else {
        await createRoute(payload);
        setMessage('Route created successfully.');
      }
      setFormValues(emptyRoute);
      setEditingId(null);
      setFormErrors({});
      await loadRoutes();
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Error saving route.');
      console.error(err);
    }
  };

  const handleEdit = (routeItem: RouteItem) => {
    setFormValues({
      routeCode: routeItem.routeCode,
      routeName: routeItem.routeName,
      pickupAreasText: (routeItem.pickupAreas || []).join(', '),
      estimatedDistanceKm: routeItem.estimatedDistanceKm,
      estimatedDurationMinutes: routeItem.estimatedDurationMinutes,
      status: routeItem.status,
      notes: routeItem.notes || ''
    });
    setEditingId(routeItem._id);
    setFormErrors({});
  };

  const handleDelete = async () => {
    if (!pendingDeleteRoute) return;
    try {
      await deleteRoute(pendingDeleteRoute._id);
      setMessage('Route deleted successfully.');
      setPendingDeleteRoute(null);
      await loadRoutes();
    } catch (err) {
      setMessage('Error deleting route.');
      console.error(err);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (page === 1) {
      await loadRoutes();
      return;
    }
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Routes</h1>
        <p className="text-text-secondary">Manage transport routes</p>
      </div>

      {message && (
        <div className="rounded-lg bg-primary bg-opacity-10 p-4 text-primary">
          {message}
        </div>
      )}

      <div className="rounded-[2rem] border border-muted bg-white p-8 shadow-xl">
        <h2 className="mb-6 text-xl font-semibold text-text-primary">
          {editingId ? 'Edit Route' : 'Add New Route'}
        </h2>

        <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
          <input name="routeCode" placeholder="Route Code" value={formValues.routeCode} onChange={handleInputChange} className={getFieldClassName('routeCode')} required />
          {formErrors.routeCode && <p className="-mt-4 text-sm text-rose-600">{formErrors.routeCode}</p>}

          <input name="routeName" placeholder="Route Name" value={formValues.routeName} onChange={handleInputChange} className={getFieldClassName('routeName')} required />
          {formErrors.routeName && <p className="-mt-4 text-sm text-rose-600">{formErrors.routeName}</p>}

          <input
            name="pickupAreasText"
            placeholder="Pickup Areas (comma separated)"
            value={formValues.pickupAreasText}
            onChange={handleInputChange}
            className={`rounded-lg border px-4 py-2 ${formErrors.pickupAreas ? 'border-rose-400 bg-rose-50' : 'border-muted'} md:col-span-2`}
            required
          />
          {formErrors.pickupAreas && <p className="-mt-4 text-sm text-rose-600 md:col-span-2">{formErrors.pickupAreas}</p>}

          <input type="number" step="0.1" name="estimatedDistanceKm" placeholder="Estimated Distance (km)" value={formValues.estimatedDistanceKm} onChange={handleInputChange} className={getFieldClassName('estimatedDistanceKm')} min={0} required />
          {formErrors.estimatedDistanceKm && <p className="-mt-4 text-sm text-rose-600">{formErrors.estimatedDistanceKm}</p>}

          <input type="number" name="estimatedDurationMinutes" placeholder="Estimated Duration (minutes)" value={formValues.estimatedDurationMinutes} onChange={handleInputChange} className={getFieldClassName('estimatedDurationMinutes')} min={0} required />
          {formErrors.estimatedDurationMinutes && <p className="-mt-4 text-sm text-rose-600">{formErrors.estimatedDurationMinutes}</p>}

          <select name="status" value={formValues.status} onChange={handleInputChange} className={getFieldClassName('status')}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <textarea name="notes" placeholder="Notes" value={formValues.notes} onChange={handleInputChange} className="rounded-lg border border-muted px-4 py-2 md:col-span-2" rows={3} />

          <div className="md:col-span-2 flex gap-3">
            <button type="submit" className="rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-white hover:bg-primary-hover">
              {editingId ? 'Update Route' : 'Add Route'}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setFormValues(emptyRoute); setFormErrors({}); }} className="rounded-lg border border-muted px-6 py-2 text-sm font-semibold text-text-secondary hover:bg-background">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="rounded-[2rem] border border-muted bg-white p-8 shadow-xl">
        <form onSubmit={handleSearch} className="mb-6 grid gap-4 md:grid-cols-3">
          <input
            type="text"
            placeholder="Search routes"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-lg border border-muted px-4 py-2"
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-muted px-4 py-2">
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button type="submit" className="rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-white hover:bg-primary-hover">
            Search
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-muted bg-background text-left text-sm font-medium text-text-secondary">
                <th className="px-4 py-3">Route Code</th>
                <th className="px-4 py-3">Route Name</th>
                <th className="px-4 py-3">Pickup Areas</th>
                <th className="px-4 py-3">Distance (km)</th>
                <th className="px-4 py-3">Duration (min)</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-4 text-sm text-text-secondary" colSpan={7}>Loading routes...</td>
                </tr>
              ) : routes.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-sm text-text-secondary" colSpan={7}>No routes found.</td>
                </tr>
              ) : (
                routes.map((routeItem) => (
                  <tr key={routeItem._id} className="border-b border-muted text-sm text-text-primary">
                    <td className="px-4 py-3">{routeItem.routeCode}</td>
                    <td className="px-4 py-3">{routeItem.routeName}</td>
                    <td className="px-4 py-3">{(routeItem.pickupAreas || []).join(', ')}</td>
                    <td className="px-4 py-3">{routeItem.estimatedDistanceKm}</td>
                    <td className="px-4 py-3">{routeItem.estimatedDurationMinutes}</td>
                    <td className="px-4 py-3">{routeItem.status}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => handleEdit(routeItem)} className="rounded-lg border border-muted px-3 py-1 text-xs font-medium text-text-secondary hover:bg-background">Edit</button>
                        <button type="button" onClick={() => setPendingDeleteRoute(routeItem)} className="rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-text-secondary">
          <div>
            Showing {routes.length} of {meta.total} routes
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
              disabled={page <= 1 || loading}
              className="rounded-full border border-muted px-3 py-1 font-semibold hover:bg-background disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-2">Page {meta.page || page}</span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(current + 1, Math.max(1, Math.ceil(meta.total / meta.limit))))}
              disabled={page >= Math.max(1, Math.ceil(meta.total / meta.limit)) || loading}
              className="rounded-full border border-muted px-3 py-1 font-semibold hover:bg-background disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={Boolean(pendingDeleteRoute)}
        title="Delete Route"
        description={`Are you sure you want to delete route ${pendingDeleteRoute?.routeCode || ''}?`}
        confirmLabel="Delete"
        onConfirm={() => void handleDelete()}
        onCancel={() => setPendingDeleteRoute(null)}
      />
    </div>
  );
};

export default RoutesPage;