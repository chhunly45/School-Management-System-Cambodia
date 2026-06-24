import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { listStudents, createStudent, updateStudent, deleteStudent } from '../services/student.api';

interface Student {
  _id: string;
  studentId: string;
  fullName: string;
  gender: 'male' | 'female' | 'other';
  dateOfBirth: string;
  phone: string;
  address: string;
  guardianName: string;
  guardianPhone: string;
  className: string;
  status: 'active' | 'inactive' | 'graduated';
}

const emptyStudentForm: Student = {
  _id: '',
  studentId: '',
  fullName: '',
  gender: 'other',
  dateOfBirth: '',
  phone: '',
  address: '',
  guardianName: '',
  guardianPhone: '',
  className: '',
  status: 'active'
};

const StudentsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [formValues, setFormValues] = useState<Student>(emptyStudentForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user) return navigate('/login');
    if (user.role !== 'admin') {
      setAccessDenied(true);
      return;
    }
    loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadStudents = async (search = '') => {
    setLoading(true);
    try {
      const response = await listStudents({ search, perPage: 200 });
      const items = response.data?.items || [];
      setStudents(
        items.map((item: any) => ({
          ...item,
          dateOfBirth: item.dateOfBirth ? new Date(item.dateOfBirth).toISOString().slice(0, 10) : ''
        }))
      );
    } catch (err) {
      setMessage('Unable to load students.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await loadStudents(searchTerm);
  };

  const handleChange = (key: keyof Student, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormValues(emptyStudentForm);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEdit = (student: Student) => {
    setEditingId(student._id);
    setFormValues(student);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const payload = {
      studentId: formValues.studentId,
      fullName: formValues.fullName,
      gender: formValues.gender,
      dateOfBirth: formValues.dateOfBirth || undefined,
      phone: formValues.phone,
      address: formValues.address,
      guardianName: formValues.guardianName,
      guardianPhone: formValues.guardianPhone,
      className: formValues.className,
      status: formValues.status
    };

    try {
      if (editingId) {
        await updateStudent(editingId, payload);
        setMessage('Student updated successfully.');
      } else {
        await createStudent(payload);
        setMessage('Student created successfully.');
      }
      setEditingId(null);
      setFormValues(emptyStudentForm);
      await loadStudents(searchTerm);
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Failed to save student.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this student record?')) return;
    setLoading(true);
    setMessage('');

    try {
      await deleteStudent(id);
      setMessage('Student deleted successfully.');
      await loadStudents(searchTerm);
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Failed to delete student.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter((student) =>
    [student.studentId, student.fullName, student.className, student.guardianName, student.phone]
      .join(' ')
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  if (accessDenied) {
    return <div className="p-8 text-center text-red-600">Access Denied - Admin Only</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Students</h1>
        <p className="text-text-secondary">Manage student records and enrollment</p>
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

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <input
            type="text"
            placeholder="Search by student ID, name, or class..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <button
            type="submit"
            className="rounded-lg bg-secondary px-6 py-2 text-white font-medium hover:opacity-90 transition"
            disabled={loading}
          >
            Search
          </button>
        </form>
        <button
          onClick={handleAdd}
          className="rounded-lg bg-primary px-6 py-2 text-white font-medium hover:opacity-90 transition"
        >
          Add Student
        </button>
      </div>

      <form onSubmit={handleSave} className="rounded-lg border border-muted bg-white p-6">
        <h3 className="text-xl font-semibold mb-4">{editingId ? 'Edit Student' : 'Add New Student'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <label className="space-y-2">
            <span className="text-sm font-medium">Student ID</span>
            <input
              value={formValues.studentId}
              onChange={(e) => handleChange('studentId', e.target.value)}
              className="w-full rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
              placeholder="Student ID"
              required
              disabled={loading}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Full Name</span>
            <input
              value={formValues.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              className="w-full rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
              placeholder="Full Name"
              required
              disabled={loading}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Class</span>
            <input
              value={formValues.className}
              onChange={(e) => handleChange('className', e.target.value)}
              className="w-full rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
              placeholder="Class"
              disabled={loading}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Gender</span>
            <select
              value={formValues.gender}
              onChange={(e) => handleChange('gender', e.target.value)}
              className="w-full rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
              disabled={loading}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Date of Birth</span>
            <input
              value={formValues.dateOfBirth}
              onChange={(e) => handleChange('dateOfBirth', e.target.value)}
              className="w-full rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
              type="date"
              disabled={loading}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Status</span>
            <select
              value={formValues.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
              disabled={loading}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="graduated">Graduated</option>
            </select>
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium">Phone</span>
            <input
              value={formValues.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
              placeholder="Phone"
              disabled={loading}
            />
          </label>
          <label className="space-y-2 md:col-span-3">
            <span className="text-sm font-medium">Address</span>
            <input
              value={formValues.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
              placeholder="Address"
              disabled={loading}
            />
          </label>
          <label className="space-y-2 md:col-span-3">
            <span className="text-sm font-medium">Guardian Name</span>
            <input
              value={formValues.guardianName}
              onChange={(e) => handleChange('guardianName', e.target.value)}
              className="w-full rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
              placeholder="Guardian Name"
              disabled={loading}
            />
          </label>
          <label className="space-y-2 md:col-span-3">
            <span className="text-sm font-medium">Guardian Phone</span>
            <input
              value={formValues.guardianPhone}
              onChange={(e) => handleChange('guardianPhone', e.target.value)}
              className="w-full rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
              placeholder="Guardian Phone"
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
            {loading ? 'Saving...' : editingId ? 'Update Student' : 'Create Student'}
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setFormValues(emptyStudentForm);
            }}
            className="rounded-lg border border-muted px-4 py-2 hover:bg-background transition"
            disabled={loading}
          >
            Reset
          </button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-lg border border-muted bg-white">
        <table className="w-full">
          <thead className="bg-background">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">Student ID</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Full Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Class</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Phone</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Guardian</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
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
            ) : filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-text-secondary">
                  No students found.
                </td>
              </tr>
            ) : (
              filteredStudents.map((student) => (
                <tr key={student._id} className="border-t border-muted hover:bg-background transition">
                  <td className="px-4 py-3 font-medium">{student.studentId}</td>
                  <td className="px-4 py-3">{student.fullName}</td>
                  <td className="px-4 py-3">{student.className}</td>
                  <td className="px-4 py-3">{student.phone}</td>
                  <td className="px-4 py-3">{student.guardianName}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        student.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : student.status === 'inactive'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {student.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 space-x-2">
                    <button
                      onClick={() => handleEdit(student)}
                      className="text-primary hover:underline text-sm font-medium"
                      disabled={loading}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(student._id)}
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
    </div>
  );
};

export default StudentsPage;
