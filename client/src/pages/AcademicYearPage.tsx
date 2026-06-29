import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import DeleteConfirmationModal from '../components/common/DeleteConfirmationModal';
import {
  listAcademicYears,
  createAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,
  type AcademicYear,
  type AcademicYearPayload
} from '../services/academicYear.api';
import { formatDateForApi, formatDateForDisplay, formatDateForInput, parseLocalDate } from '../utils/date';

type AcademicYearField = keyof AcademicYearPayload;

const emptyAcademicYearForm: AcademicYear = {
  _id: '',
  code: '',
  name: '',
  startDate: '',
  endDate: '',
  status: 'planned',
  isCurrent: false,
  remarks: ''
};

const AcademicYearPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<AcademicYear[]>([]);
  const [formValues, setFormValues] = useState<AcademicYear>(emptyAcademicYearForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'planned' | 'active' | 'closed' | 'archived'>('all');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [formErrors, setFormErrors] = useState<Partial<Record<AcademicYearField, string>>>({});
  const [pendingDeleteItem, setPendingDeleteItem] = useState<AcademicYear | null>(null);

  useEffect(() => {
    if (!user) return navigate('/login');
    if (user.role !== 'admin') return;
    loadAcademicYears(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadAcademicYears = async (targetPage = page) => {
    setLoading(true);
    try {
      const response = await listAcademicYears({
        search: searchTerm || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        page: targetPage,
        perPage
      });

      const responseItems = response.data?.items || [];
      const meta = response.data?.meta;

      setItems(
        responseItems.map((item) => ({
          ...item,
          startDate: item.startDate ? formatDateForInput(item.startDate) : '',
          endDate: item.endDate ? formatDateForInput(item.endDate) : ''
        }))
      );

      setPage(meta?.page || targetPage);
      setTotal(meta?.total || 0);
      setTotalPages(meta?.totalPages || 1);
    } catch (err) {
      setMessage('Unable to load academic years.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = <K extends keyof AcademicYear>(key: K, value: AcademicYear[K]) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
    if (key in formErrors) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[key as AcademicYearField];
        return next;
      });
    }
  };

  const validateForm = () => {
    const nextErrors: Partial<Record<AcademicYearField, string>> = {};

    const normalizedCode = formValues.code.trim().toUpperCase();
    const codePattern = /^[A-Z0-9][A-Z0-9-]{2,19}$/;

    if (!normalizedCode) {
      nextErrors.code = 'Code is required.';
    } else if (!codePattern.test(normalizedCode)) {
      nextErrors.code = 'Use 3-20 uppercase letters, numbers, or hyphen.';
    }

    if (!formValues.name.trim()) {
      nextErrors.name = 'Name is required.';
    }

    if (!formValues.startDate) {
      nextErrors.startDate = 'Start date is required.';
    }

    if (!formValues.endDate) {
      nextErrors.endDate = 'End date is required.';
    }

    if (formValues.startDate && formValues.endDate) {
      const start = parseLocalDate(formValues.startDate);
      const end = parseLocalDate(formValues.endDate);
      if (!start || !end) {
        nextErrors.startDate = 'Use valid start and end dates.';
      } else if (start >= end) {
        nextErrors.endDate = 'End date must be after start date.';
      }
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const getFieldClassName = (field: AcademicYearField) =>
    `w-full rounded-lg border px-4 py-2 outline-none focus:border-primary ${formErrors[field] ? 'border-rose-400 bg-rose-50' : 'border-muted'}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (!validateForm()) {
      setMessage('Please fix the highlighted fields.');
      return;
    }

    setLoading(true);

    const payload: AcademicYearPayload = {
      code: formValues.code.trim().toUpperCase(),
      name: formValues.name.trim(),
      startDate: formatDateForApi(formValues.startDate) || formatDateForInput(formValues.startDate),
      endDate: formatDateForApi(formValues.endDate) || formatDateForInput(formValues.endDate),
      status: formValues.status,
      isCurrent: formValues.isCurrent,
      remarks: formValues.remarks?.trim() || undefined
    };

    try {
      if (editingId) {
        await updateAcademicYear(editingId, payload);
        setMessage('Academic year updated successfully.');
      } else {
        await createAcademicYear(payload);
        setMessage('Academic year created successfully.');
      }

      setEditingId(null);
      setFormValues(emptyAcademicYearForm);
      setFormErrors({});
      await loadAcademicYears(page);
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Failed to save academic year.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: AcademicYear) => {
    setEditingId(item._id);
    setFormValues(item);
    setFormErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async () => {
    if (!pendingDeleteItem) return;
    setLoading(true);
    setMessage('');

    try {
      await deleteAcademicYear(pendingDeleteItem._id);
      setPendingDeleteItem(null);
      setMessage('Academic year deleted successfully.');

      const nextPage = page > 1 && items.length === 1 ? page - 1 : page;
      await loadAcademicYears(nextPage);
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Failed to delete academic year.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await loadAcademicYears(1);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormValues(emptyAcademicYearForm);
    setFormErrors({});
  };

  if (!user || user.role !== 'admin') {
    return <div className="p-8 text-center text-red-600">Access denied. Admin only.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Academic Years</h1>
        <p className="text-text-secondary">Manage school academic year cycles.</p>
      </div>

      {message && (
        <div
          className={`rounded-lg p-4 ${
            message.toLowerCase().includes('success') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-lg border border-muted bg-white p-6">
        <h3 className="text-xl font-semibold mb-4">{editingId ? 'Edit Academic Year' : 'Add Academic Year'}</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <label className="space-y-2">
            <span className="text-sm font-medium">Code</span>
            <input
              value={formValues.code}
              onChange={(e) => handleFieldChange('code', e.target.value)}
              className={getFieldClassName('code')}
              placeholder="2026-2027"
              required
              disabled={loading}
            />
            {formErrors.code && <p className="text-sm text-rose-600">{formErrors.code}</p>}
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Name</span>
            <input
              value={formValues.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              className={getFieldClassName('name')}
              placeholder="AY 2026-2027"
              required
              disabled={loading}
            />
            {formErrors.name && <p className="text-sm text-rose-600">{formErrors.name}</p>}
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Status</span>
            <select
              value={formValues.status}
              onChange={(e) => handleFieldChange('status', e.target.value as AcademicYear['status'])}
              className={getFieldClassName('status')}
              disabled={loading}
            >
              <option value="planned">Planned</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
              <option value="archived">Archived</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Start Date</span>
            <input
              type="date"
              value={formValues.startDate}
              onChange={(e) => handleFieldChange('startDate', e.target.value)}
              className={getFieldClassName('startDate')}
              required
              disabled={loading}
            />
            {formErrors.startDate && <p className="text-sm text-rose-600">{formErrors.startDate}</p>}
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">End Date</span>
            <input
              type="date"
              value={formValues.endDate}
              onChange={(e) => handleFieldChange('endDate', e.target.value)}
              className={getFieldClassName('endDate')}
              required
              disabled={loading}
            />
            {formErrors.endDate && <p className="text-sm text-rose-600">{formErrors.endDate}</p>}
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium">Remarks</span>
            <input
              value={formValues.remarks || ''}
              onChange={(e) => handleFieldChange('remarks', e.target.value)}
              className={getFieldClassName('remarks')}
              placeholder="Optional notes"
              disabled={loading}
            />
          </label>

          <label className="flex items-center gap-2 mt-8">
            <input
              type="checkbox"
              checked={formValues.isCurrent}
              onChange={(e) => handleFieldChange('isCurrent', e.target.checked)}
              disabled={loading}
            />
            <span className="text-sm font-medium">Set as current academic year</span>
          </label>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-primary px-4 py-2 text-white font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {editingId ? 'Update Academic Year' : 'Create Academic Year'}
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="rounded-lg border border-muted px-4 py-2 hover:bg-background transition"
            disabled={loading}
          >
            Reset
          </button>
        </div>
      </form>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by code or name..."
            className="flex-1 rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
            disabled={loading}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="rounded-lg border border-muted px-4 py-2"
            disabled={loading}
          >
            <option value="all">All Statuses</option>
            <option value="planned">Planned</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
            <option value="archived">Archived</option>
          </select>
          <button
            type="submit"
            className="rounded-lg bg-secondary px-6 py-2 text-white font-medium hover:opacity-90 transition"
            disabled={loading}
          >
            Search
          </button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-lg border border-muted bg-white">
        <table className="w-full min-w-[820px]">
          <thead className="bg-background">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">Code</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Start</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">End</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Current</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-text-secondary">
                  Loading...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-text-secondary">
                  No academic years found.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item._id} className="border-t border-muted hover:bg-background transition">
                  <td className="px-4 py-3 font-medium">{item.code}</td>
                  <td className="px-4 py-3">{item.name}</td>
                  <td className="px-4 py-3">{formatDateForDisplay(item.startDate)}</td>
                  <td className="px-4 py-3">{formatDateForDisplay(item.endDate)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        item.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : item.status === 'planned'
                          ? 'bg-blue-100 text-blue-800'
                          : item.status === 'closed'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{item.isCurrent ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3 space-x-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-primary hover:underline text-sm font-medium"
                      disabled={loading}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setPendingDeleteItem(item)}
                      className="text-red-600 hover:underline text-sm font-medium"
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-text-secondary">
          Showing {items.length} of {total} academic years
        </p>
        <div className="flex items-center gap-2">
          <label className="text-sm text-text-secondary">Per page</label>
          <select
            value={perPage}
            onChange={(e) => {
              const next = Number(e.target.value);
              setPerPage(next);
              setPage(1);
              void loadAcademicYears(1);
            }}
            className="rounded-lg border border-muted px-3 py-2 text-sm"
            disabled={loading}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <button
            type="button"
            onClick={() => void loadAcademicYears(page - 1)}
            disabled={loading || page <= 1}
            className="rounded-lg border border-muted px-3 py-2 text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-text-secondary">
            Page {page} of {Math.max(totalPages, 1)}
          </span>
          <button
            type="button"
            onClick={() => void loadAcademicYears(page + 1)}
            disabled={loading || page >= totalPages}
            className="rounded-lg border border-muted px-3 py-2 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={Boolean(pendingDeleteItem)}
        title="Delete Academic Year"
        description={
          pendingDeleteItem
            ? `Are you sure you want to delete ${pendingDeleteItem.name} (${pendingDeleteItem.code})? This action cannot be undone.`
            : 'Are you sure you want to delete this academic year?'
        }
        confirmLabel="Delete Academic Year"
        cancelLabel="Cancel"
        isProcessing={loading}
        onCancel={() => setPendingDeleteItem(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default AcademicYearPage;
