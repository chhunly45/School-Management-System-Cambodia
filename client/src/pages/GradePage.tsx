import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import DeleteConfirmationModal from '../components/common/DeleteConfirmationModal';
import { createGrade, deleteGrade, listGrades, updateGrade, type Grade, type GradePayload } from '../services/grade.api';

type GradeField = keyof GradePayload;

const emptyGradeForm: Grade = {
  _id: '',
  code: '',
  name: '',
  level: 1,
  status: 'active',
  remarks: ''
};

const GradePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Grade[]>([]);
  const [formValues, setFormValues] = useState<Grade>(emptyGradeForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'archived'>('all');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [formErrors, setFormErrors] = useState<Partial<Record<GradeField, string>>>({});
  const [pendingDeleteItem, setPendingDeleteItem] = useState<Grade | null>(null);

  useEffect(() => {
    if (!user) return navigate('/login');
    if (user.role !== 'admin') return;
    void loadGrades(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadGrades = async (targetPage = page) => {
    setLoading(true);
    try {
      const response = await listGrades({
        search: searchTerm || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        page: targetPage,
        perPage
      });

      const responseItems = response.data?.items || [];
      const meta = response.data?.meta;

      setItems(responseItems);
      setPage(meta?.page || targetPage);
      setTotal(meta?.total || 0);
      setTotalPages(meta?.totalPages || 1);
    } catch (err) {
      setMessage('Unable to load grades.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = <K extends keyof Grade>(key: K, value: Grade[K]) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));

    if (key !== '_id' && key in formErrors) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[key as GradeField];
        return next;
      });
    }
  };

  const validateForm = () => {
    const nextErrors: Partial<Record<GradeField, string>> = {};
    const normalizedCode = formValues.code.trim().toUpperCase();

    if (!normalizedCode) {
      nextErrors.code = 'Code is required.';
    } else if (!/^[A-Z0-9][A-Z0-9-]{1,19}$/.test(normalizedCode)) {
      nextErrors.code = 'Use 2-20 uppercase letters, numbers, or hyphen.';
    }

    if (!formValues.name.trim()) {
      nextErrors.name = 'Name is required.';
    }

    if (!Number.isInteger(Number(formValues.level)) || Number(formValues.level) < 1) {
      nextErrors.level = 'Level must be a positive integer.';
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const getFieldClassName = (field: GradeField) =>
    `w-full rounded-lg border px-4 py-2 outline-none focus:border-primary ${formErrors[field] ? 'border-rose-400 bg-rose-50' : 'border-muted'}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (!validateForm()) {
      setMessage('Please fix the highlighted fields.');
      return;
    }

    setLoading(true);

    const payload: GradePayload = {
      code: formValues.code.trim().toUpperCase(),
      name: formValues.name.trim(),
      level: Number(formValues.level),
      status: formValues.status,
      remarks: formValues.remarks?.trim() || undefined
    };

    try {
      if (editingId) {
        await updateGrade(editingId, payload);
        setMessage('Grade updated successfully.');
      } else {
        await createGrade(payload);
        setMessage('Grade created successfully.');
      }

      setEditingId(null);
      setFormValues(emptyGradeForm);
      setFormErrors({});
      await loadGrades(page);
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Failed to save grade.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: Grade) => {
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
      await deleteGrade(pendingDeleteItem._id);
      setPendingDeleteItem(null);
      setMessage('Grade deleted successfully.');

      const nextPage = page > 1 && items.length === 1 ? page - 1 : page;
      await loadGrades(nextPage);
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Failed to delete grade.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await loadGrades(1);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormValues(emptyGradeForm);
    setFormErrors({});
  };

  if (!user || user.role !== 'admin') {
    return <div className="p-8 text-center text-red-600">Access denied. Admin only.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Grades</h1>
        <p className="text-text-secondary">Manage grade levels and statuses.</p>
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
        <h3 className="text-xl font-semibold mb-4">{editingId ? 'Edit Grade' : 'Add Grade'}</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <label className="space-y-2">
            <span className="text-sm font-medium">Code</span>
            <input
              value={formValues.code}
              onChange={(e) => handleFieldChange('code', e.target.value)}
              className={getFieldClassName('code')}
              placeholder="G01"
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
              placeholder="Grade 1"
              required
              disabled={loading}
            />
            {formErrors.name && <p className="text-sm text-rose-600">{formErrors.name}</p>}
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Level</span>
            <input
              type="number"
              value={formValues.level}
              onChange={(e) => handleFieldChange('level', Number(e.target.value))}
              className={getFieldClassName('level')}
              min={1}
              required
              disabled={loading}
            />
            {formErrors.level && <p className="text-sm text-rose-600">{formErrors.level}</p>}
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Status</span>
            <select
              value={formValues.status}
              onChange={(e) => handleFieldChange('status', e.target.value as Grade['status'])}
              className={getFieldClassName('status')}
              disabled={loading}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
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
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-primary px-4 py-2 text-white font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {editingId ? 'Update Grade' : 'Create Grade'}
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
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
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
        <table className="w-full min-w-[760px]">
          <thead className="bg-background">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">Code</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Level</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Remarks</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-secondary">
                  Loading...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-secondary">
                  No grades found.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item._id} className="border-t border-muted hover:bg-background transition">
                  <td className="px-4 py-3 font-medium">{item.code}</td>
                  <td className="px-4 py-3">{item.name}</td>
                  <td className="px-4 py-3">{item.level}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        item.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : item.status === 'inactive'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{item.remarks || '-'}</td>
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
          Showing {items.length} of {total} grades
        </p>
        <div className="flex items-center gap-2">
          <label className="text-sm text-text-secondary">Per page</label>
          <select
            value={perPage}
            onChange={(e) => {
              const next = Number(e.target.value);
              setPerPage(next);
              setPage(1);
              void loadGrades(1);
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
            onClick={() => void loadGrades(page - 1)}
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
            onClick={() => void loadGrades(page + 1)}
            disabled={loading || page >= totalPages}
            className="rounded-lg border border-muted px-3 py-2 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={Boolean(pendingDeleteItem)}
        title="Delete Grade"
        description={
          pendingDeleteItem
            ? `Are you sure you want to delete ${pendingDeleteItem.name} (${pendingDeleteItem.code})? This action cannot be undone.`
            : 'Are you sure you want to delete this grade?'
        }
        confirmLabel="Delete Grade"
        cancelLabel="Cancel"
        isProcessing={loading}
        onCancel={() => setPendingDeleteItem(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default GradePage;
