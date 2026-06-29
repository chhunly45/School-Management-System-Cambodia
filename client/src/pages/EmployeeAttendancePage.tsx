import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import {
  createEmployeeAttendance,
  deleteEmployeeAttendance,
  listEmployeeAttendance,
  updateEmployeeAttendance,
  type EmployeeAttendancePayload
} from '../services/employeeAttendance.api';
import { formatDateForApi, formatDateForDisplay, formatDateForInput } from '../utils/date';

interface EmployeeAttendanceRecord extends EmployeeAttendancePayload {
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

interface EmployeeAttendanceListMeta {
  page: number;
  limit: number;
  total: number;
}

const statusOptions: Array<'present' | 'late' | 'leave' | 'absent'> = ['present', 'late', 'leave', 'absent'];

const emptyRecord: EmployeeAttendancePayload = {
  employeeCode: '',
  employeeName: '',
  employeeType: 'staff',
  department: '',
  scheduleLabel: '',
  workStartTime: '',
  workEndTime: '',
  date: formatDateForInput(new Date()),
  status: 'present',
  remarks: ''
};

const EmployeeAttendancePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState<EmployeeAttendanceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(formatDateForInput(new Date()));
  const [selectedType, setSelectedType] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<EmployeeAttendanceListMeta>({ page: 1, limit: 20, total: 0 });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [editingRecord, setEditingRecord] = useState<EmployeeAttendanceRecord | null>(null);
  const [formValues, setFormValues] = useState<EmployeeAttendancePayload>(emptyRecord);

  useEffect(() => {
    if (!user) return navigate('/login');
    if (user.role !== 'admin') return;
    void loadRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const response = await listEmployeeAttendance({
        search: searchTerm || undefined,
        date: selectedDate,
        employeeType: selectedType || undefined,
        page,
        perPage: 10
      });

      setRecords((response.data?.items || []).map((item: any) => ({
        ...item,
        date: item.date ? formatDateForInput(item.date) : selectedDate
      })));
      setMeta(response.data?.meta || { page, limit: 10, total: 0 });
      setMessage('');
    } catch (error) {
      console.error(error);
      setMessage('Unable to load employee attendance records.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    await loadRecords();
  };

  const handleInputChange = (key: keyof EmployeeAttendancePayload, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const validateRecord = () => {
    if (!formValues.employeeCode.trim()) return 'Employee code is required.';
    if (!formValues.employeeName.trim()) return 'Employee name is required.';
    if (!formValues.date) return 'Date is required.';
    if (!formValues.status) return 'Status is required.';
    return '';
  };

  const startCreate = () => {
    setEditingRecord(null);
    setFormValues({ ...emptyRecord, date: selectedDate });
    setMessage('');
  };

  const startEdit = (record: EmployeeAttendanceRecord) => {
    setEditingRecord(record);
    setFormValues({
      employeeCode: record.employeeCode,
      employeeName: record.employeeName,
      employeeType: record.employeeType,
      department: record.department || '',
      scheduleLabel: record.scheduleLabel || '',
      workStartTime: record.workStartTime || '',
      workEndTime: record.workEndTime || '',
      date: record.date,
      status: record.status,
      remarks: record.remarks || ''
    });
    setMessage('');
  };

  const saveRecord = async (event: React.FormEvent) => {
    event.preventDefault();
    const validationError = validateRecord();
    if (validationError) {
      setMessage(validationError);
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const payload: EmployeeAttendancePayload = {
        employeeCode: formValues.employeeCode.trim(),
        employeeName: formValues.employeeName.trim(),
        employeeType: formValues.employeeType || 'staff',
        department: formValues.department?.trim() || undefined,
        scheduleLabel: formValues.scheduleLabel?.trim() || undefined,
        workStartTime: formValues.workStartTime?.trim() || undefined,
        workEndTime: formValues.workEndTime?.trim() || undefined,
        date: formatDateForApi(formValues.date) || '',
        status: formValues.status,
        remarks: formValues.remarks?.trim() || undefined
      };

      if (editingRecord) {
        await updateEmployeeAttendance(editingRecord._id, payload);
        setMessage('Employee attendance updated successfully.');
      } else {
        await createEmployeeAttendance(payload);
        setMessage('Employee attendance created successfully.');
      }

      setEditingRecord(null);
      setFormValues({ ...emptyRecord, date: selectedDate });
      await loadRecords();
    } catch (error: any) {
      const text = error?.response?.data?.message || 'Failed to save employee attendance.';
      setMessage(text);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const removeRecord = async (id: string) => {
    if (!window.confirm('Delete this employee attendance record?')) return;
    setLoading(true);
    try {
      await deleteEmployeeAttendance(id);
      setMessage('Employee attendance deleted successfully.');
      await loadRecords();
    } catch (error) {
      console.error(error);
      setMessage('Unable to delete employee attendance.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="rounded-[2rem] bg-white p-8 shadow-xl ring-1 ring-border">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-text-primary">Employee Attendance</h1>
            <p className="mt-2 text-sm text-muted">Shared attendance for teachers, drivers, and future staff.</p>
          </div>
          <button
            type="button"
            onClick={startCreate}
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-hover transition"
          >
            New Record
          </button>
        </div>
      </header>

      {message && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-100">{message}</div>}

      <section className="rounded-[2rem] bg-white p-6 shadow ring-1 ring-border">
        <form className="grid gap-4 md:grid-cols-4" onSubmit={handleSearch}>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-xl border border-muted px-4 py-3"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search employee"
            className="rounded-xl border border-muted px-4 py-3"
          />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="rounded-xl border border-muted px-4 py-3"
          >
            <option value="">All types</option>
            <option value="teacher">teacher</option>
            <option value="driver">driver</option>
            <option value="staff">staff</option>
          </select>
          <button
            type="submit"
            className="rounded-xl bg-text-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            Filter
          </button>
        </form>
      </section>

      <section className="rounded-[2rem] bg-white p-6 shadow ring-1 ring-border">
        <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" onSubmit={saveRecord}>
          <input
            type="text"
            value={formValues.employeeCode}
            onChange={(e) => handleInputChange('employeeCode', e.target.value)}
            placeholder="Employee Code"
            className="rounded-xl border border-muted px-4 py-3"
          />
          <input
            type="text"
            value={formValues.employeeName}
            onChange={(e) => handleInputChange('employeeName', e.target.value)}
            placeholder="Employee Name"
            className="rounded-xl border border-muted px-4 py-3"
          />
          <input
            type="text"
            value={formValues.employeeType || 'staff'}
            onChange={(e) => handleInputChange('employeeType', e.target.value)}
            placeholder="Role (teacher, driver, staff, future roles)"
            className="rounded-xl border border-muted px-4 py-3"
          />
          <input
            type="text"
            value={formValues.department || ''}
            onChange={(e) => handleInputChange('department', e.target.value)}
            placeholder="Department"
            className="rounded-xl border border-muted px-4 py-3"
          />
          <input
            type="text"
            value={formValues.scheduleLabel || ''}
            onChange={(e) => handleInputChange('scheduleLabel', e.target.value)}
            placeholder="Schedule Label (optional)"
            className="rounded-xl border border-muted px-4 py-3"
          />
          <input
            type="time"
            value={formValues.workStartTime || ''}
            onChange={(e) => handleInputChange('workStartTime', e.target.value)}
            className="rounded-xl border border-muted px-4 py-3"
          />
          <input
            type="time"
            value={formValues.workEndTime || ''}
            onChange={(e) => handleInputChange('workEndTime', e.target.value)}
            className="rounded-xl border border-muted px-4 py-3"
          />
          <input
            type="date"
            value={formValues.date}
            onChange={(e) => handleInputChange('date', e.target.value)}
            className="rounded-xl border border-muted px-4 py-3"
          />
          <select
            value={formValues.status}
            onChange={(e) => handleInputChange('status', e.target.value)}
            className="rounded-xl border border-muted px-4 py-3"
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <textarea
            value={formValues.remarks || ''}
            onChange={(e) => handleInputChange('remarks', e.target.value)}
            placeholder="Remarks"
            className="min-h-24 rounded-xl border border-muted px-4 py-3 md:col-span-2 xl:col-span-3"
          />
          <div className="flex gap-3 md:col-span-2 xl:col-span-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
            >
              {editingRecord ? 'Update Record' : 'Save Record'}
            </button>
            {editingRecord && (
              <button
                type="button"
                onClick={startCreate}
                className="rounded-full border border-muted px-5 py-3 text-sm font-semibold text-text-primary hover:bg-background"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="rounded-[2rem] bg-white p-6 shadow ring-1 ring-border">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">Attendance Records</h2>
          {loading && <span className="text-sm text-muted">Loading...</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-muted text-left text-text-secondary">
                <th className="py-2 pr-3">Code</th>
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Type</th>
                <th className="py-2 pr-3">Department</th>
                <th className="py-2 pr-3">Schedule</th>
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Remarks</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td className="py-4 text-muted" colSpan={9}>No employee attendance records found.</td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record._id} className="border-b border-muted/70 text-text-primary">
                    <td className="py-2 pr-3">{record.employeeCode}</td>
                    <td className="py-2 pr-3">{record.employeeName}</td>
                    <td className="py-2 pr-3">{record.employeeType}</td>
                    <td className="py-2 pr-3">{record.department || '-'}</td>
                    <td className="py-2 pr-3">
                      {record.scheduleLabel || record.workStartTime || record.workEndTime
                        ? `${record.scheduleLabel || 'Shift'} ${record.workStartTime || '--:--'}-${record.workEndTime || '--:--'}`
                        : '-'}
                    </td>
                    <td className="py-2 pr-3">{formatDateForDisplay(record.date)}</td>
                    <td className="py-2 pr-3">{record.status}</td>
                    <td className="py-2 pr-3">{record.remarks || '-'}</td>
                    <td className="py-2">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => startEdit(record)} className="rounded-full border border-muted px-3 py-1 text-xs font-semibold hover:bg-background">
                          Edit
                        </button>
                        <button type="button" onClick={() => removeRecord(record._id)} className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50">
                          Delete
                        </button>
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
            Showing {records.length} of {meta.total} records
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
      </section>
    </div>
  );
};

export default EmployeeAttendancePage;