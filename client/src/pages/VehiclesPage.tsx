import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import DeleteConfirmationModal from '../components/common/DeleteConfirmationModal';
import {
  createVehicle,
  deleteVehicle,
  listVehicles,
  updateVehicle,
  type Vehicle,
  type VehiclePayload
} from '../services/vehicle.api';

type VehicleField = keyof VehiclePayload;

type VehicleFormValues = VehiclePayload;

const emptyVehicle: VehicleFormValues = {
  vehicleCode: '',
  plateNumber: '',
  brand: '',
  model: '',
  year: new Date().getFullYear(),
  color: '',
  seatCapacity: 1,
  fuelType: 'gasoline',
  status: 'active',
  notes: ''
};

const VehiclesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [formValues, setFormValues] = useState<VehicleFormValues>(emptyVehicle);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fuelTypeFilter, setFuelTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0 });
  const [formErrors, setFormErrors] = useState<Partial<Record<VehicleField, string>>>({});
  const [pendingDeleteVehicle, setPendingDeleteVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    if (!user) return navigate('/login');
    if (user.role !== 'admin') return;
    void loadVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, page]);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const response = await listVehicles({
        search: searchTerm || undefined,
        status: (statusFilter || undefined) as any,
        fuelType: (fuelTypeFilter || undefined) as any,
        page,
        perPage: 10
      });
      setVehicles(response.data?.items || []);
      setMeta(response.data?.meta || { page, limit: 10, total: 0 });
    } catch (err) {
      setMessage('Unable to load vehicles.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: name === 'year' || name === 'seatCapacity' ? Number(value) || 0 : value
    }));
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next[name as VehicleField];
      return next;
    });
  };

  const validateVehicleForm = () => {
    const nextErrors: Partial<Record<VehicleField, string>> = {};

    if (!formValues.vehicleCode.trim()) nextErrors.vehicleCode = 'Vehicle code is required.';
    if (!formValues.plateNumber.trim()) nextErrors.plateNumber = 'Plate number is required.';
    if (!formValues.brand.trim()) nextErrors.brand = 'Brand is required.';
    if (!formValues.model.trim()) nextErrors.model = 'Model is required.';
    if (formValues.year < 1900 || formValues.year > 2100) nextErrors.year = 'Year must be between 1900 and 2100.';
    if (formValues.seatCapacity < 1) nextErrors.seatCapacity = 'Seat capacity must be at least 1.';

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const getFieldClassName = (field: VehicleField) =>
    `rounded-lg border px-4 py-2 ${formErrors[field] ? 'border-rose-400 bg-rose-50' : 'border-muted'}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateVehicleForm()) {
      setMessage('Please fix the highlighted fields.');
      return;
    }

    const payload: VehiclePayload = {
      vehicleCode: formValues.vehicleCode,
      plateNumber: formValues.plateNumber,
      brand: formValues.brand,
      model: formValues.model,
      year: formValues.year,
      color: formValues.color || undefined,
      seatCapacity: formValues.seatCapacity,
      fuelType: formValues.fuelType,
      status: formValues.status,
      notes: formValues.notes || undefined
    };

    try {
      if (editingId) {
        await updateVehicle(editingId, payload);
        setMessage('Vehicle updated successfully.');
      } else {
        await createVehicle(payload);
        setMessage('Vehicle created successfully.');
      }
      setFormValues(emptyVehicle);
      setEditingId(null);
      setFormErrors({});
      await loadVehicles();
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Error saving vehicle.');
      console.error(err);
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setFormValues({
      vehicleCode: vehicle.vehicleCode,
      plateNumber: vehicle.plateNumber,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color || '',
      seatCapacity: vehicle.seatCapacity,
      fuelType: vehicle.fuelType,
      status: vehicle.status,
      notes: vehicle.notes || ''
    });
    setEditingId(vehicle._id);
    setFormErrors({});
  };

  const handleDelete = async () => {
    if (!pendingDeleteVehicle) return;
    try {
      await deleteVehicle(pendingDeleteVehicle._id);
      setMessage('Vehicle deleted successfully.');
      setPendingDeleteVehicle(null);
      await loadVehicles();
    } catch (err) {
      setMessage('Error deleting vehicle.');
      console.error(err);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    await loadVehicles();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Vehicles</h1>
        <p className="text-text-secondary">Manage school vehicles</p>
      </div>

      {message && (
        <div className="rounded-lg bg-primary bg-opacity-10 p-4 text-primary">
          {message}
        </div>
      )}

      <div className="rounded-[2rem] border border-muted bg-white p-8 shadow-xl">
        <h2 className="mb-6 text-xl font-semibold text-text-primary">
          {editingId ? 'Edit Vehicle' : 'Add New Vehicle'}
        </h2>

        <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
          <input name="vehicleCode" placeholder="Vehicle Code" value={formValues.vehicleCode} onChange={handleInputChange} className={getFieldClassName('vehicleCode')} required />
          {formErrors.vehicleCode && <p className="-mt-4 text-sm text-rose-600">{formErrors.vehicleCode}</p>}

          <input name="plateNumber" placeholder="Plate Number" value={formValues.plateNumber} onChange={handleInputChange} className={getFieldClassName('plateNumber')} required />
          {formErrors.plateNumber && <p className="-mt-4 text-sm text-rose-600">{formErrors.plateNumber}</p>}

          <input name="brand" placeholder="Brand" value={formValues.brand} onChange={handleInputChange} className={getFieldClassName('brand')} required />
          {formErrors.brand && <p className="-mt-4 text-sm text-rose-600">{formErrors.brand}</p>}

          <input name="model" placeholder="Model" value={formValues.model} onChange={handleInputChange} className={getFieldClassName('model')} required />
          {formErrors.model && <p className="-mt-4 text-sm text-rose-600">{formErrors.model}</p>}

          <input type="number" name="year" placeholder="Year" value={formValues.year} onChange={handleInputChange} className={getFieldClassName('year')} min={1900} max={2100} required />
          {formErrors.year && <p className="-mt-4 text-sm text-rose-600">{formErrors.year}</p>}

          <input name="color" placeholder="Color" value={formValues.color || ''} onChange={handleInputChange} className={getFieldClassName('color')} />

          <input type="number" name="seatCapacity" placeholder="Seat Capacity" value={formValues.seatCapacity} onChange={handleInputChange} className={getFieldClassName('seatCapacity')} min={1} required />
          {formErrors.seatCapacity && <p className="-mt-4 text-sm text-rose-600">{formErrors.seatCapacity}</p>}

          <select name="fuelType" value={formValues.fuelType} onChange={handleInputChange} className={getFieldClassName('fuelType')}>
            <option value="gasoline">Gasoline</option>
            <option value="diesel">Diesel</option>
          </select>

          <select name="status" value={formValues.status} onChange={handleInputChange} className={getFieldClassName('status')}>
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
            <option value="out_of_service">Out of Service</option>
          </select>

          <textarea name="notes" placeholder="Notes" value={formValues.notes || ''} onChange={handleInputChange} className="rounded-lg border border-muted px-4 py-2 md:col-span-2" rows={3} />

          <div className="md:col-span-2 flex gap-3">
            <button type="submit" className="rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-white hover:bg-primary-hover">
              {editingId ? 'Update Vehicle' : 'Add Vehicle'}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setFormValues(emptyVehicle); setFormErrors({}); }} className="rounded-lg border border-muted px-6 py-2 text-sm font-semibold text-text-secondary hover:bg-background">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="rounded-[2rem] border border-muted bg-white p-8 shadow-xl">
        <form onSubmit={handleSearch} className="mb-6 grid gap-4 md:grid-cols-4">
          <input
            type="text"
            placeholder="Search vehicles"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-lg border border-muted px-4 py-2"
          />
          <select value={fuelTypeFilter} onChange={(e) => setFuelTypeFilter(e.target.value)} className="rounded-lg border border-muted px-4 py-2">
            <option value="">All Fuel Types</option>
            <option value="gasoline">Gasoline</option>
            <option value="diesel">Diesel</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-muted px-4 py-2">
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
            <option value="out_of_service">Out of Service</option>
          </select>
          <button type="submit" className="rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-white hover:bg-primary-hover">
            Search
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-muted bg-background text-left text-sm font-medium text-text-secondary">
                <th className="px-4 py-3">Vehicle Code</th>
                <th className="px-4 py-3">Plate Number</th>
                <th className="px-4 py-3">Brand</th>
                <th className="px-4 py-3">Model</th>
                <th className="px-4 py-3">Year</th>
                <th className="px-4 py-3">Seats</th>
                <th className="px-4 py-3">Fuel</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-4 text-sm text-text-secondary" colSpan={9}>Loading vehicles...</td>
                </tr>
              ) : vehicles.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-sm text-text-secondary" colSpan={9}>No vehicles found.</td>
                </tr>
              ) : (
                vehicles.map((vehicle) => (
                  <tr key={vehicle._id} className="border-b border-muted text-sm text-text-primary">
                    <td className="px-4 py-3">{vehicle.vehicleCode}</td>
                    <td className="px-4 py-3">{vehicle.plateNumber}</td>
                    <td className="px-4 py-3">{vehicle.brand}</td>
                    <td className="px-4 py-3">{vehicle.model}</td>
                    <td className="px-4 py-3">{vehicle.year}</td>
                    <td className="px-4 py-3">{vehicle.seatCapacity}</td>
                    <td className="px-4 py-3">{vehicle.fuelType}</td>
                    <td className="px-4 py-3">{vehicle.status}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => handleEdit(vehicle)} className="rounded-lg border border-muted px-3 py-1 text-xs font-medium text-text-secondary hover:bg-background">Edit</button>
                        <button type="button" onClick={() => setPendingDeleteVehicle(vehicle)} className="rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50">Delete</button>
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
            Showing {vehicles.length} of {meta.total} vehicles
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
        isOpen={Boolean(pendingDeleteVehicle)}
        title="Delete Vehicle"
        description={`Are you sure you want to delete vehicle ${pendingDeleteVehicle?.vehicleCode || ''}?`}
        confirmLabel="Delete"
        onConfirm={() => void handleDelete()}
        onCancel={() => setPendingDeleteVehicle(null)}
      />
    </div>
  );
};

export default VehiclesPage;