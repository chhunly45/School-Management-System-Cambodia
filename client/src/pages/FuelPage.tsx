import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import DeleteConfirmationModal from '../components/common/DeleteConfirmationModal';
import { formatAmount } from '../utils/price';
import {
  createFuelRecord,
  deleteFuelRecord,
  listFuelRecords,
  updateFuelRecord,
  type FuelRecord,
  type FuelRecordPayload
} from '../services/fuelRecord.api';
import { listVehicles, type Vehicle } from '../services/vehicle.api';
import { listTransportAssignments, type TransportAssignment } from '../services/transportAssignment.api';
import { getSchoolSettings, type SchoolSettings } from '../services/schoolSettings.api';

type FuelField = keyof FuelRecordPayload;

interface FuelFormValues {
  vehicleId: string;
  transportAssignmentId: string;
  assignmentDate: string;
  odometer: number;
  fuelType: 'gasoline' | 'diesel';
  liters: number;
  pricePerLiter: number;
  currency: string;
  fuelStation: string;
  receiptNumber: string;
  notes: string;
}

const emptyFuelForm: FuelFormValues = {
  vehicleId: '',
  transportAssignmentId: '',
  assignmentDate: new Date().toISOString().slice(0, 10),
  odometer: 0,
  fuelType: 'gasoline',
  liters: 0,
  pricePerLiter: 0,
  currency: 'USD',
  fuelStation: '',
  receiptNumber: '',
  notes: ''
};

const toMoney = (value: number) => Number((value || 0).toFixed(2));

const FuelPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [records, setRecords] = useState<FuelRecord[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [assignments, setAssignments] = useState<TransportAssignment[]>([]);
  const [supportedCurrencies, setSupportedCurrencies] = useState<string[]>(['USD', 'KHR']);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);

  const [formValues, setFormValues] = useState<FuelFormValues>(emptyFuelForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Partial<Record<FuelField, string>>>({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [fuelTypeFilter, setFuelTypeFilter] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('');
  const [assignmentDateFilter, setAssignmentDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0 });

  const [pendingDeleteRecord, setPendingDeleteRecord] = useState<FuelRecord | null>(null);

  const totalCost = useMemo(() => toMoney(formValues.liters * formValues.pricePerLiter), [formValues.liters, formValues.pricePerLiter]);

  useEffect(() => {
    if (!user) return navigate('/login');
    if (user.role !== 'admin') return;
    void Promise.all([loadLookups(), loadRecords()]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, page]);

  const loadLookups = async () => {
    try {
      const [vehicleResp, assignmentResp, settingsResp] = await Promise.all([
        listVehicles({ perPage: 100 }),
        listTransportAssignments({ perPage: 100 }),
        getSchoolSettings()
      ]);

      const loadedVehicles = vehicleResp.data?.items || [];
      const loadedAssignments = assignmentResp.data?.items || [];
      const loadedSettings = settingsResp?.data || null;
      const currencies = loadedSettings?.supportedCurrencies?.length
        ? loadedSettings.supportedCurrencies
        : [loadedSettings?.defaultCurrency || 'USD', 'KHR'];

      setVehicles(loadedVehicles);
      setAssignments(loadedAssignments);
      setSettings(loadedSettings);
      setSupportedCurrencies(currencies);

      setFormValues((prev) => ({
        ...prev,
        currency: prev.currency || loadedSettings?.defaultCurrency || 'USD'
      }));
    } catch (error) {
      console.error(error);
      setMessage('Unable to load fuel setup data.');
    }
  };

  const loadRecords = async () => {
    setLoading(true);
    try {
      const response = await listFuelRecords({
        search: searchTerm || undefined,
        fuelType: (fuelTypeFilter || undefined) as any,
        currency: currencyFilter || undefined,
        assignmentDate: assignmentDateFilter || undefined,
        page,
        perPage: 10
      });
      setRecords(response.data?.items || []);
      setMeta(response.data?.meta || { page, limit: 10, total: 0 });
    } catch (error) {
      console.error(error);
      setMessage('Unable to load fuel records.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues((prev) => {
      const next: FuelFormValues = {
        ...prev,
        [name]: name === 'odometer' || name === 'liters' || name === 'pricePerLiter' ? Number(value) || 0 : value
      } as FuelFormValues;

      if (name === 'vehicleId' && prev.transportAssignmentId) {
        const selectedAssignment = assignments.find((item) => item._id === prev.transportAssignmentId);
        const assignmentVehicleId = selectedAssignment
          ? (typeof selectedAssignment.vehicleId === 'string' ? selectedAssignment.vehicleId : selectedAssignment.vehicleId?._id || '')
          : '';
        if (assignmentVehicleId && assignmentVehicleId !== value) {
          next.transportAssignmentId = '';
        }
      }

      return next;
    });

    setFormErrors((prev) => {
      const next = { ...prev };
      delete next[name as FuelField];
      return next;
    });
  };

  const validateFuelForm = () => {
    const nextErrors: Partial<Record<FuelField, string>> = {};

    if (!formValues.vehicleId) nextErrors.vehicleId = 'Vehicle is required.';
    if (!formValues.assignmentDate) nextErrors.assignmentDate = 'Date is required.';
    if (formValues.odometer < 0) nextErrors.odometer = 'Odometer must be zero or greater.';
    if (formValues.liters <= 0) nextErrors.liters = 'Liters must be greater than zero.';
    if (formValues.pricePerLiter < 0) nextErrors.pricePerLiter = 'Price per liter must be zero or greater.';
    if (!supportedCurrencies.includes(formValues.currency)) nextErrors.currency = 'Currency must follow School Settings.';
    if (!formValues.fuelStation.trim()) nextErrors.fuelStation = 'Fuel station is required.';

    if (formValues.transportAssignmentId) {
      const selectedAssignment = assignments.find((item) => item._id === formValues.transportAssignmentId);
      if (!selectedAssignment) {
        nextErrors.transportAssignmentId = 'Selected transport assignment is invalid.';
      } else {
        const assignmentVehicleId = typeof selectedAssignment.vehicleId === 'string'
          ? selectedAssignment.vehicleId
          : selectedAssignment.vehicleId?._id || '';
        if (assignmentVehicleId && assignmentVehicleId !== formValues.vehicleId) {
          nextErrors.transportAssignmentId = 'Transport assignment must belong to the selected vehicle.';
        }
      }
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const getFieldClassName = (field: FuelField) =>
    `rounded-lg border px-4 py-2 ${formErrors[field] ? 'border-rose-400 bg-rose-50' : 'border-muted'}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateFuelForm()) {
      setMessage('Please fix the highlighted fields.');
      return;
    }

    const payload: FuelRecordPayload = {
      vehicleId: formValues.vehicleId,
      transportAssignmentId: formValues.transportAssignmentId || undefined,
      assignmentDate: formValues.assignmentDate,
      odometer: formValues.odometer,
      fuelType: formValues.fuelType,
      liters: formValues.liters,
      pricePerLiter: formValues.pricePerLiter,
      currency: formValues.currency,
      totalCost,
      fuelStation: formValues.fuelStation,
      receiptNumber: formValues.receiptNumber || undefined,
      notes: formValues.notes || undefined
    };

    try {
      if (editingId) {
        await updateFuelRecord(editingId, payload);
        setMessage('Fuel record updated successfully.');
      } else {
        await createFuelRecord(payload);
        setMessage('Fuel record created successfully.');
      }

      setFormValues({
        ...emptyFuelForm,
        currency: settings?.defaultCurrency || 'USD'
      });
      setEditingId(null);
      setFormErrors({});
      await loadRecords();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Error saving fuel record.');
      console.error(error);
    }
  };

  const handleEdit = (record: FuelRecord) => {
    const vehicleId = typeof record.vehicleId === 'string' ? record.vehicleId : record.vehicleId?._id || '';
    const transportAssignmentId = !record.transportAssignmentId
      ? ''
      : typeof record.transportAssignmentId === 'string'
        ? record.transportAssignmentId
        : record.transportAssignmentId?._id || '';

    setFormValues({
      vehicleId,
      transportAssignmentId,
      assignmentDate: record.assignmentDate ? new Date(record.assignmentDate).toISOString().slice(0, 10) : '',
      odometer: record.odometer,
      fuelType: record.fuelType,
      liters: record.liters,
      pricePerLiter: record.pricePerLiter,
      currency: record.currency,
      fuelStation: record.fuelStation,
      receiptNumber: record.receiptNumber || '',
      notes: record.notes || ''
    });
    setEditingId(record._id);
    setFormErrors({});
  };

  const handleDelete = async () => {
    if (!pendingDeleteRecord) return;
    try {
      await deleteFuelRecord(pendingDeleteRecord._id);
      setMessage('Fuel record deleted successfully.');
      setPendingDeleteRecord(null);
      await loadRecords();
    } catch (error) {
      setMessage('Error deleting fuel record.');
      console.error(error);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    await loadRecords();
  };

  const getVehicleDisplay = (record: FuelRecord) => {
    if (typeof record.vehicleId !== 'string' && record.vehicleId) {
      return `${record.vehicleId.vehicleCode} (${record.vehicleId.plateNumber})`;
    }
    return record.vehicleCode || '-';
  };

  const getAssignmentDisplay = (record: FuelRecord) => {
    if (!record.transportAssignmentId) return '-';
    if (typeof record.transportAssignmentId !== 'string' && record.transportAssignmentId) {
      return `${record.transportAssignmentId.driverEmployeeCode} - ${record.transportAssignmentId.driverName}`;
    }
    return 'Linked';
  };

  const filteredAssignments = assignments.filter((item) => {
    if (!formValues.vehicleId) return true;
    const assignmentVehicleId = typeof item.vehicleId === 'string' ? item.vehicleId : item.vehicleId?._id || '';
    return assignmentVehicleId === formValues.vehicleId;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Fuel Management</h1>
        <p className="text-text-secondary">Manage fuel records for school transport operations</p>
      </div>

      {message && (
        <div className="rounded-lg bg-primary bg-opacity-10 p-4 text-primary">
          {message}
        </div>
      )}

      <div className="rounded-[2rem] border border-muted bg-white p-8 shadow-xl">
        <h2 className="mb-6 text-xl font-semibold text-text-primary">
          {editingId ? 'Edit Fuel Record' : 'Add New Fuel Record'}
        </h2>

        <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
          <select name="vehicleId" value={formValues.vehicleId} onChange={handleInputChange} className={getFieldClassName('vehicleId')} required>
            <option value="">Select Vehicle</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle._id} value={vehicle._id}>{vehicle.vehicleCode} ({vehicle.plateNumber})</option>
            ))}
          </select>

          <select name="transportAssignmentId" value={formValues.transportAssignmentId} onChange={handleInputChange} className={getFieldClassName('transportAssignmentId')}>
            <option value="">No Transport Assignment</option>
            {filteredAssignments.map((assignment) => (
              <option key={assignment._id} value={assignment._id}>
                {assignment.vehicleCode || 'Vehicle'} / {assignment.routeCode || 'Route'} / {assignment.driverEmployeeCode}
              </option>
            ))}
          </select>

          <input type="date" name="assignmentDate" value={formValues.assignmentDate} onChange={handleInputChange} className={getFieldClassName('assignmentDate')} required />
          <input type="number" min={0} step="0.01" name="odometer" placeholder="Odometer" value={formValues.odometer} onChange={handleInputChange} className={getFieldClassName('odometer')} required />

          <select name="fuelType" value={formValues.fuelType} onChange={handleInputChange} className={getFieldClassName('fuelType')}>
            <option value="gasoline">Gasoline</option>
            <option value="diesel">Diesel</option>
          </select>

          <input type="number" min={0.0001} step="0.001" name="liters" placeholder="Liters" value={formValues.liters} onChange={handleInputChange} className={getFieldClassName('liters')} required />

          <input type="number" min={0} step="0.01" name="pricePerLiter" placeholder="Price Per Liter" value={formValues.pricePerLiter} onChange={handleInputChange} className={getFieldClassName('pricePerLiter')} required />

          <select name="currency" value={formValues.currency} onChange={handleInputChange} className={getFieldClassName('currency')}>
            {supportedCurrencies.map((currencyCode) => (
              <option key={currencyCode} value={currencyCode}>{currencyCode}</option>
            ))}
          </select>

          <input type="number" value={totalCost} className="rounded-lg border border-muted bg-background px-4 py-2" readOnly />

          <input name="fuelStation" placeholder="Fuel Station" value={formValues.fuelStation} onChange={handleInputChange} className={getFieldClassName('fuelStation')} required />

          <input name="receiptNumber" placeholder="Receipt Number (optional)" value={formValues.receiptNumber} onChange={handleInputChange} className={getFieldClassName('receiptNumber')} />

          <textarea name="notes" placeholder="Notes" value={formValues.notes} onChange={handleInputChange} className="rounded-lg border border-muted px-4 py-2 md:col-span-2" rows={3} />

          <div className="md:col-span-2 flex gap-3">
            <button type="submit" className="rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-white hover:bg-primary-hover">
              {editingId ? 'Update Fuel Record' : 'Add Fuel Record'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setFormValues({
                    ...emptyFuelForm,
                    currency: settings?.defaultCurrency || 'USD'
                  });
                  setFormErrors({});
                }}
                className="rounded-lg border border-muted px-6 py-2 text-sm font-semibold text-text-secondary hover:bg-background"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="rounded-[2rem] border border-muted bg-white p-8 shadow-xl">
        <form onSubmit={handleSearch} className="mb-6 grid gap-4 md:grid-cols-5">
          <input
            type="text"
            placeholder="Search fuel records"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-lg border border-muted px-4 py-2"
          />
          <input
            type="date"
            value={assignmentDateFilter}
            onChange={(e) => setAssignmentDateFilter(e.target.value)}
            className="rounded-lg border border-muted px-4 py-2"
          />
          <select value={fuelTypeFilter} onChange={(e) => setFuelTypeFilter(e.target.value)} className="rounded-lg border border-muted px-4 py-2">
            <option value="">All Fuel Types</option>
            <option value="gasoline">Gasoline</option>
            <option value="diesel">Diesel</option>
          </select>
          <select value={currencyFilter} onChange={(e) => setCurrencyFilter(e.target.value)} className="rounded-lg border border-muted px-4 py-2">
            <option value="">All Currencies</option>
            {supportedCurrencies.map((currencyCode) => (
              <option key={currencyCode} value={currencyCode}>{currencyCode}</option>
            ))}
          </select>
          <button type="submit" className="rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-white hover:bg-primary-hover">
            Search
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-muted bg-background text-left text-sm font-medium text-text-secondary">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Assignment</th>
                <th className="px-4 py-3">Odometer</th>
                <th className="px-4 py-3">Fuel</th>
                <th className="px-4 py-3">Cost</th>
                <th className="px-4 py-3">Station</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-4 text-sm text-text-secondary" colSpan={8}>Loading fuel records...</td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-sm text-text-secondary" colSpan={8}>No fuel records found.</td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record._id} className="border-b border-muted text-sm text-text-primary">
                    <td className="px-4 py-3">{new Date(record.assignmentDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{getVehicleDisplay(record)}</td>
                    <td className="px-4 py-3">{getAssignmentDisplay(record)}</td>
                    <td className="px-4 py-3">{record.odometer}</td>
                    <td className="px-4 py-3">{record.liters} L ({record.fuelType})</td>
                    <td className="px-4 py-3">{formatAmount(record.totalCost, record.currency)}</td>
                    <td className="px-4 py-3">{record.fuelStation}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => handleEdit(record)} className="rounded-lg border border-muted px-3 py-1 text-xs font-medium text-text-secondary hover:bg-background">Edit</button>
                        <button type="button" onClick={() => setPendingDeleteRecord(record)} className="rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50">Delete</button>
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
            Showing {records.length} of {meta.total} fuel records
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
        isOpen={Boolean(pendingDeleteRecord)}
        title="Delete Fuel Record"
        description={`Are you sure you want to delete this fuel record at ${pendingDeleteRecord?.fuelStation || ''}?`}
        confirmLabel="Delete"
        onConfirm={() => void handleDelete()}
        onCancel={() => setPendingDeleteRecord(null)}
      />
    </div>
  );
};

export default FuelPage;