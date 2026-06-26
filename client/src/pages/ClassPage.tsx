import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import DeleteConfirmationModal from '../components/common/DeleteConfirmationModal';
import { listAcademicYears, type AcademicYear } from '../services/academicYear.api';
import { listGrades, type Grade } from '../services/grade.api';
import { createClass, deleteClass, listClasses, updateClass, type ClassItem, type ClassPayload } from '../services/class.api';

type ClassField = keyof ClassPayload;

const emptyClassForm: ClassPayload = {
  className: '',
  academicYearId: '',
  gradeId: '',
  capacity: 1,
  status: 'active',
  description: ''
};

const getAcademicYearId = (value: ClassItem['academicYearId']) =>
  typeof value === 'string' ? value : value?._id || '';

const getGradeId = (value: ClassItem['gradeId']) =>
  typeof value === 'string' ? value : value?._id || '';

const getAcademicYearLabel = (value: ClassItem['academicYearId']) => {
  if (typeof value === 'string') return value;
  if (!value) return '-';
  return `${value.code} - ${value.name}`;
};

const getGradeLabel = (value: ClassItem['gradeId']) => {
  if (typeof value === 'string') return value;
  if (!value) return '-';
  return `${value.code} (${value.name})`;
};

const ClassPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState<ClassItem[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [formValues, setFormValues] = useState<ClassPayload>(emptyClassForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'archived'>('all');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [formErrors, setFormErrors] = useState<Partial<Record<ClassField, string>>>({});
  const [pendingDeleteItem, setPendingDeleteItem] = useState<ClassItem | null>(null);

  useEffect(() => {
    if (!user) return navigate('/login');
    if (user.role !== 'admin') return;

    void Promise.all([loadLookups(), loadClasses(1)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadLookups = async () => {
    try {
      const [yearsResp, gradesResp] = await Promise.all([
        listAcademicYears({ perPage: 100 }),
        listGrades({ perPage: 100 })
      ]);

      setAcademicYears(yearsResp.data?.items || []);
      setGrades(gradesResp.data?.items || []);
    } catch (err) {
      console.error(err);
      setMessage('Unable to load class lookup data.');
    }
  };

  const loadClasses = async (targetPage = page) => {
    setLoading(true);
    try {
      const response = await listClasses({
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
      setMessage('Unable to load classes.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = <K extends keyof ClassPayload>(key: K, value: ClassPayload[K]) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));

    if (key in formErrors) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const validateForm = () => {
    const nextErrors: Partial<Record<ClassField, string>> = {};

    if (!formValues.className.trim()) {
      nextErrors.className = 'Class name is required.';
    } else if (formValues.className.trim().length < 2) {
      nextErrors.className = 'Class name must be at least 2 characters.';
    }

    if (!formValues.academicYearId) {
      nextErrors.academicYearId = 'Academic year is required.';
    }

    if (!formValues.gradeId) {
      nextErrors.gradeId = 'Grade is required.';
    }

    if (!Number.isInteger(Number(formValues.capacity)) || Number(formValues.capacity) < 1) {
      nextErrors.capacity = 'Capacity must be a positive integer.';
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const getFieldClassName = (field: ClassField) =>
    `w-full rounded-lg border px-4 py-2 outline-none focus:border-primary ${formErrors[field] ? 'border-rose-400 bg-rose-50' : 'border-muted'}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (!validateForm()) {
      setMessage('Please fix the highlighted fields.');
      return;
    }

    setLoading(true);

    const payload: ClassPayload = {
      className: formValues.className.trim(),
      academicYearId: formValues.academicYearId,
      gradeId: formValues.gradeId,
      capacity: Number(formValues.capacity),
      status: formValues.status,
      description: formValues.description?.trim() || undefined
    };

    try {
      if (editingId) {
        await updateClass(editingId, payload);
        setMessage('Class updated successfully.');
      } else {
        await createClass(payload);
        setMessage('Class created successfully.');
      }

      setEditingId(null);
      setFormValues(emptyClassForm);
      setFormErrors({});
      await loadClasses(page);
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Failed to save class.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: ClassItem) => {
    setEditingId(item._id);
    setFormValues({
      className: item.className,
      academicYearId: getAcademicYearId(item.academicYearId),
      gradeId: getGradeId(item.gradeId),
      capacity: Number(item.capacity),
      status: item.status,
      description: item.description || ''
    });
    setFormErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async () => {
    if (!pendingDeleteItem) return;
    setLoading(true);
    setMessage('');

    try {
      await deleteClass(pendingDeleteItem._id);
      setPendingDeleteItem(null);
      setMessage('Class deleted successfully.');
      const nextPage = page > 1 && items.length === 1 ? page - 1 : page;
      await loadClasses(nextPage);
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Failed to delete class.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await loadClasses(1);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormValues(emptyClassForm);
    setFormErrors({});
  };

  if (!user || user.role !== 'admin') {
    return <div className="p-8 text-center text-red-600">Access denied. Admin only.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Classes</h1>
        <p className="text-text-secondary">Manage classes by academic year and grade.</p>
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
        <h3 className="text-xl font-semibold mb-4">{editingId ? 'Edit Class' : 'Add Class'}</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <label className="space-y-2">
            <span className="text-sm font-medium">Class Name</span>
            <input
              value={formValues.className}
              onChange={(e) => handleFieldChange('className', e.target.value)}
              className={getFieldClassName('className')}
              placeholder="Class A"
              required
              disabled={loading}
            />
            {formErrors.className && <p className="text-sm text-rose-600">{formErrors.className}</p>}
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Academic Year</span>
            <select
              value={formValues.academicYearId}
              onChange={(e) => handleFieldChange('academicYearId', e.target.value)}
              className={getFieldClassName('academicYearId')}
              required
              disabled={loading}
            >
              <option value="">Select academic year</option>
              {academicYears.map((year) => (
                <option key={year._id} value={year._id}>{`${year.code} - ${year.name}`}</option>
              ))}
            </select>
            {formErrors.academicYearId && <p className="text-sm text-rose-600">{formErrors.academicYearId}</p>}
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Grade</span>
            <select
              value={formValues.gradeId}
              onChange={(e) => handleFieldChange('gradeId', e.target.value)}
              className={getFieldClassName('gradeId')}
              required
              disabled={loading}
            >
              <option value="">Select grade</option>
              {grades.map((grade) => (
                <option key={grade._id} value={grade._id}>{`${grade.code} - ${grade.name}`}</option>
              ))}
            </select>
            {formErrors.gradeId && <p className="text-sm text-rose-600">{formErrors.gradeId}</p>}
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Capacity</span>
            <input
              type="number"
              value={formValues.capacity}
              onChange={(e) => handleFieldChange('capacity', Number(e.target.value))}
              className={getFieldClassName('capacity')}
              min={1}
              required
              disabled={loading}
            />
            {formErrors.capacity && <p className="text-sm text-rose-600">{formErrors.capacity}</p>}
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Status</span>
            <select
              value={formValues.status}
              onChange={(e) => handleFieldChange('status', e.target.value as ClassPayload['status'])}
              className={getFieldClassName('status')}
              disabled={loading}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium">Description</span>
            <input
              value={formValues.description || ''}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              className={getFieldClassName('description')}
              placeholder="Optional class description"
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
            {editingId ? 'Update Class' : 'Create Class'}
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
            placeholder="Search classes..."
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
        <table className="w-full min-w-[900px]">
          <thead className="bg-background">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">Class Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Academic Year</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Grade</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Capacity</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Description</th>
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
                  No classes found.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item._id} className="border-t border-muted hover:bg-background transition">
                  <td className="px-4 py-3 font-medium">{item.className}</td>
                  <td className="px-4 py-3">{getAcademicYearLabel(item.academicYearId)}</td>
                  <td className="px-4 py-3">{getGradeLabel(item.gradeId)}</td>
                  <td className="px-4 py-3">{item.capacity}</td>
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
                  <td className="px-4 py-3 text-sm text-text-secondary">{item.description || '-'}</td>
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
          Showing {items.length} of {total} classes
        </p>
        <div className="flex items-center gap-2">
          <label className="text-sm text-text-secondary">Per page</label>
          <select
            value={perPage}
            onChange={(e) => {
              const next = Number(e.target.value);
              setPerPage(next);
              setPage(1);
              void loadClasses(1);
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
            onClick={() => void loadClasses(page - 1)}
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
            onClick={() => void loadClasses(page + 1)}
            disabled={loading || page >= totalPages}
            className="rounded-lg border border-muted px-3 py-2 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={Boolean(pendingDeleteItem)}
        title="Delete Class"
        description={
          pendingDeleteItem
            ? `Are you sure you want to delete ${pendingDeleteItem.className}? This action cannot be undone.`
            : 'Are you sure you want to delete this class?'
        }
        confirmLabel="Delete Class"
        cancelLabel="Cancel"
        isProcessing={loading}
        onCancel={() => setPendingDeleteItem(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default ClassPage;
