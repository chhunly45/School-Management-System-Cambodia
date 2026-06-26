import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import DeleteConfirmationModal from '../components/common/DeleteConfirmationModal';
import {
  createTransportAssignment,
  deleteTransportAssignment,
  listTransportAssignments,
  updateTransportAssignment,
  type TransportAssignment,
  type TransportAssignmentPayload
} from '../services/transportAssignment.api';
import { listVehicles, type Vehicle } from '../services/vehicle.api';
import { listRoutes, type RouteItem } from '../services/route.api';
import { listEmployeeAttendance, type EmployeeAttendancePayload } from '../services/employeeAttendance.api';

type AssignmentField = keyof TransportAssignmentPayload;

interface DriverOption {
  code: string;
  name: string;
}

interface AssignmentFormValues {
  assignmentDate: string;
  vehicleId: string;
  routeId: string;
  driverEmployeeCode: string;
  driverName: string;
  status: 'scheduled' | 'running' | 'completed' | 'cancelled';
  notes: string;
}

const emptyAssignment: AssignmentFormValues = {
  assignmentDate: new Date().toISOString().slice(0, 10),
  vehicleId: '',
  routeId: '',
  driverEmployeeCode: '',
  driverName: '',
  status: 'scheduled',
  notes: ''
};

const getVehicleLabel = (vehicle: Vehicle) => `${vehicle.vehicleCode} (${vehicle.plateNumber})`;
const getRouteLabel = (routeItem: RouteItem) => `${routeItem.routeCode} - ${routeItem.routeName}`;

const TransportAssignmentsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<TransportAssignment[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [formValues, setFormValues] = useState<AssignmentFormValues>(emptyAssignment);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [assignmentDateFilter, setAssignmentDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0 });
  const [formErrors, setFormErrors] = useState<Partial<Record<AssignmentField, string>>>({});
  const [pendingDeleteAssignment, setPendingDeleteAssignment] = useState<TransportAssignment | null>(null);

  useEffect(() => {
    if (!user) return navigate('/login');
    if (user.role !== 'admin') return;
    void Promise.all([loadLookups(), loadAssignments()]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, page]);

  const loadLookups = async () => {
    try {
      const [vehicleResp, routeResp, driverResp] = await Promise.all([
        listVehicles({ status: 'active', perPage: 100 }),
        listRoutes({ status: 'active', perPage: 100 }),
        listEmployeeAttendance({ employeeType: 'driver', perPage: 200 })
      ]);

      setVehicles(vehicleResp.data?.items || []);
      setRoutes(routeResp.data?.items || []);

      const driverRows = (driverResp.data?.items || []) as Array<EmployeeAttendancePayload & { _id?: string }>;
      const driverMap = new Map<string, DriverOption>();
      driverRows.forEach((row) => {
        const code = String(row.employeeCode || '').trim();
        const name = String(row.employeeName || '').trim();
        if (!code || !name) return;
        if (!driverMap.has(code)) {
          driverMap.set(code, { code, name });
        }
      });
      setDrivers(Array.from(driverMap.values()));
    } catch (error) {
      console.error(error);
      setMessage('Unable to load assignment lookup data.');
    }
  };

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const response = await listTransportAssignments({
        search: searchTerm || undefined,
        status: (statusFilter || undefined) as any,
        assignmentDate: assignmentDateFilter || undefined,
        page,
        perPage: 10
      });
      setAssignments(response.data?.items || []);
      setMeta(response.data?.meta || { page, limit: 10, total: 0 });
    } catch (error) {
      console.error(error);
      setMessage('Unable to load transport assignments.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'driverEmployeeCode') {
        const matched = drivers.find((driver) => driver.code === value);
        next.driverName = matched?.name || '';
      }
      return next;
    });
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next[name as AssignmentField];
      return next;
    });
  };

  const validateForm = () => {
    const nextErrors: Partial<Record<AssignmentField, string>> = {};

    if (!formValues.assignmentDate) nextErrors.assignmentDate = 'Assignment date is required.';
    if (!formValues.vehicleId) nextErrors.vehicleId = 'Vehicle is required.';
    if (!formValues.routeId) nextErrors.routeId = 'Route is required.';
    if (!formValues.driverEmployeeCode.trim()) nextErrors.driverEmployeeCode = 'Driver code is required.';

    const matched = drivers.find((driver) => driver.code === formValues.driverEmployeeCode);
    if (!matched) {
      nextErrors.driverEmployeeCode = 'Driver must exist in employee records with role driver.';
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const getFieldClassName = (field: AssignmentField) =>
    `rounded-lg border px-4 py-2 ${formErrors[field] ? 'border-rose-400 bg-rose-50' : 'border-muted'}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      setMessage('Please fix the highlighted fields.');
      return;
    }

    const payload: TransportAssignmentPayload = {
      assignmentDate: formValues.assignmentDate,
      vehicleId: formValues.vehicleId,
      routeId: formValues.routeId,
      driverEmployeeCode: formValues.driverEmployeeCode,
      driverName: formValues.driverName || undefined,
      status: formValues.status,
      notes: formValues.notes || undefined
    };

    try {
      if (editingId) {
        await updateTransportAssignment(editingId, payload);
        setMessage('Transport assignment updated successfully.');
      } else {
        await createTransportAssignment(payload);
        setMessage('Transport assignment created successfully.');
      }

      setFormValues(emptyAssignment);
      setEditingId(null);
      setFormErrors({});
      await loadAssignments();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Error saving transport assignment.');
      console.error(error);
    }
  };

  const handleEdit = (item: TransportAssignment) => {
    const vehicleId = typeof item.vehicleId === 'string' ? item.vehicleId : item.vehicleId?._id || '';
    const routeId = typeof item.routeId === 'string' ? item.routeId : item.routeId?._id || '';
    setFormValues({
      assignmentDate: item.assignmentDate ? new Date(item.assignmentDate).toISOString().slice(0, 10) : '',
      vehicleId,
      routeId,
      driverEmployeeCode: item.driverEmployeeCode,
      driverName: item.driverName || '',
      status: item.status,
      notes: item.notes || ''
    });
    setEditingId(item._id);
    setFormErrors({});
  };

  const handleDelete = async () => {
    if (!pendingDeleteAssignment) return;
    try {
      await deleteTransportAssignment(pendingDeleteAssignment._id);
      setMessage('Transport assignment deleted successfully.');
      setPendingDeleteAssignment(null);
      await loadAssignments();
    } catch (error) {
      setMessage('Error deleting transport assignment.');
      console.error(error);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    await loadAssignments();
  };

  const getVehicleDisplay = (item: TransportAssignment) => {
    if (typeof item.vehicleId !== 'string' && item.vehicleId) {
      return `${item.vehicleId.vehicleCode} (${item.vehicleId.plateNumber})`;
    }
    return item.vehicleCode || '-';
  };

  const getRouteDisplay = (item: TransportAssignment) => {
    if (typeof item.routeId !== 'string' && item.routeId) {
      return `${item.routeId.routeCode} - ${item.routeId.routeName}`;
    }
    return item.routeCode || '-';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Transport Assignments</h1>
        <p className="text-text-secondary">Manage daily transport assignments</p>
      </div>

      {message && (
        <div className="rounded-lg bg-primary bg-opacity-10 p-4 text-primary">
          {message}
        </div>
      )}

      <div className="rounded-[2rem] border border-muted bg-white p-8 shadow-xl">
        <h2 className="mb-6 text-xl font-semibold text-text-primary">
          {editingId ? 'Edit Assignment' : 'Add New Assignment'}
        </h2>

        <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
          <input type="date" name="assignmentDate" value={formValues.assignmentDate} onChange={handleInputChange} className={getFieldClassName('assignmentDate')} required />

          <select name="vehicleId" value={formValues.vehicleId} onChange={handleInputChange} className={getFieldClassName('vehicleId')} required>
            <option value="">Select Vehicle</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle._id} value={vehicle._id}>{getVehicleLabel(vehicle)}</option>
            ))}
          </select>

          <select name="routeId" value={formValues.routeId} onChange={handleInputChange} className={getFieldClassName('routeId')} required>
            <option value="">Select Route</option>
            {routes.map((routeItem) => (
              <option key={routeItem._id} value={routeItem._id}>{getRouteLabel(routeItem)}</option>
            ))}
          </select>

          <select name="driverEmployeeCode" value={formValues.driverEmployeeCode} onChange={handleInputChange} className={getFieldClassName('driverEmployeeCode')} required>
            <option value="">Select Driver</option>
            {drivers.map((driver) => (
              <option key={driver.code} value={driver.code}>{driver.code} - {driver.name}</option>
            ))}
          </select>

          <input type="text" name="driverName" placeholder="Driver Name" value={formValues.driverName} onChange={handleInputChange} className={getFieldClassName('driverName')} />

          <select name="status" value={formValues.status} onChange={handleInputChange} className={getFieldClassName('status')}>
            <option value="scheduled">Scheduled</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <textarea name="notes" placeholder="Notes" value={formValues.notes} onChange={handleInputChange} className="rounded-lg border border-muted px-4 py-2 md:col-span-2" rows={3} />

          <div className="md:col-span-2 flex gap-3">
            <button type="submit" className="rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-white hover:bg-primary-hover">
              {editingId ? 'Update Assignment' : 'Add Assignment'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setFormValues(emptyAssignment);
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
        <form onSubmit={handleSearch} className="mb-6 grid gap-4 md:grid-cols-4">
          <input
            type="text"
            placeholder="Search assignments"
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
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-muted px-4 py-2">
            <option value="">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
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
                <th className="px-4 py-3">Route</th>
                <th className="px-4 py-3">Driver</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-4 text-sm text-text-secondary" colSpan={6}>Loading assignments...</td>
                </tr>
              ) : assignments.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-sm text-text-secondary" colSpan={6}>No assignments found.</td>
                </tr>
              ) : (
                assignments.map((item) => (
                  <tr key={item._id} className="border-b border-muted text-sm text-text-primary">
                    <td className="px-4 py-3">{new Date(item.assignmentDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{getVehicleDisplay(item)}</td>
                    <td className="px-4 py-3">{getRouteDisplay(item)}</td>
                    <td className="px-4 py-3">{item.driverEmployeeCode} - {item.driverName}</td>
                    <td className="px-4 py-3">{item.status}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => handleEdit(item)} className="rounded-lg border border-muted px-3 py-1 text-xs font-medium text-text-secondary hover:bg-background">Edit</button>
                        <button type="button" onClick={() => setPendingDeleteAssignment(item)} className="rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50">Delete</button>
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
            Showing {assignments.length} of {meta.total} assignments
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
        isOpen={Boolean(pendingDeleteAssignment)}
        title="Delete Assignment"
        description={`Are you sure you want to delete this assignment for ${pendingDeleteAssignment?.driverName || ''}?`}
        confirmLabel="Delete"
        onConfirm={() => void handleDelete()}
        onCancel={() => setPendingDeleteAssignment(null)}
      />
    </div>
  );
};

export default TransportAssignmentsPage;