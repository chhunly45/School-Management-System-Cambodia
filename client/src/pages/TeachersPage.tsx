import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import {
  listTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher
} from '../services/teacher.api';

interface Teacher {
  _id: string;
  teacherId: string;
  fullName: string;
  gender: 'male' | 'female' | 'other';
  dateOfBirth?: string;
  phone?: string;
  email?: string;
  address?: string;
  qualification: 'Bachelor' | 'Master' | 'PhD' | 'Other';
  specialization?: string;
  experienceYears: number;
  className?: string;
  subjects?: string[];
  status: 'active' | 'inactive';
  joinDate?: string;
  remarks?: string;
}

const emptyTeacher: Teacher = {
  _id: '',
  teacherId: '',
  fullName: '',
  gender: 'other',
  dateOfBirth: '',
  phone: '',
  email: '',
  address: '',
  qualification: 'Bachelor',
  specialization: '',
  experienceYears: 0,
  className: '',
  subjects: [],
  status: 'active',
  joinDate: new Date().toISOString().slice(0, 10),
  remarks: ''
};

const TeachersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [formValues, setFormValues] = useState<Teacher>(emptyTeacher);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user) return navigate('/login');
    if (user.role !== 'admin') return;
    loadTeachers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadTeachers = async () => {
    setLoading(true);
    try {
      const response = await listTeachers({ search: searchTerm, perPage: 200 });
      const items = response.data?.items || [];
      setTeachers(
        items.map((item: any) => ({
          ...item,
          dateOfBirth: item.dateOfBirth ? new Date(item.dateOfBirth).toISOString().slice(0, 10) : '',
          joinDate: item.joinDate ? new Date(item.joinDate).toISOString().slice(0, 10) : ''
        }))
      );
    } catch (err) {
      setMessage('Unable to load teachers.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubjectsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const subjects = e.target.value
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s);
    setFormValues((prev) => ({ ...prev, subjects }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValues.teacherId.trim() || !formValues.fullName.trim()) {
      setMessage('Teacher ID and Full Name are required.');
      return;
    }

    try {
      if (editingId) {
        await updateTeacher(editingId, formValues);
        setMessage('Teacher updated successfully!');
      } else {
        await createTeacher(formValues);
        setMessage('Teacher added successfully!');
      }
      setFormValues(emptyTeacher);
      setEditingId(null);
      loadTeachers();
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Error saving teacher.');
      console.error(err);
    }
  };

  const handleEdit = (teacher: Teacher) => {
    setFormValues(teacher);
    setEditingId(teacher._id);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this teacher?')) return;

    try {
      await deleteTeacher(id);
      setMessage('Teacher deleted successfully!');
      loadTeachers();
    } catch (err) {
      setMessage('Error deleting teacher.');
      console.error(err);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadTeachers();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Teachers</h1>
        <p className="text-text-secondary">Manage school teachers</p>
      </div>

      {message && (
        <div className="rounded-lg bg-primary bg-opacity-10 p-4 text-primary">
          {message}
        </div>
      )}

      <div className="rounded-[2rem] border border-muted bg-white p-8 shadow-xl">
        <h2 className="mb-6 text-xl font-semibold text-text-primary">
          {editingId ? 'Edit Teacher' : 'Add New Teacher'}
        </h2>

        <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
          <input
            type="text"
            name="teacherId"
            placeholder="Teacher ID"
            value={formValues.teacherId}
            onChange={handleInputChange}
            className="rounded-lg border border-muted px-4 py-2"
            required
          />

          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            value={formValues.fullName}
            onChange={handleInputChange}
            className="rounded-lg border border-muted px-4 py-2"
            required
          />

          <select
            name="gender"
            value={formValues.gender}
            onChange={handleInputChange}
            className="rounded-lg border border-muted px-4 py-2"
          >
            <option value="other">Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>

          <input
            type="date"
            name="dateOfBirth"
            value={formValues.dateOfBirth}
            onChange={handleInputChange}
            className="rounded-lg border border-muted px-4 py-2"
          />

          <input
            type="tel"
            name="phone"
            placeholder="Phone"
            value={formValues.phone}
            onChange={handleInputChange}
            className="rounded-lg border border-muted px-4 py-2"
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formValues.email}
            onChange={handleInputChange}
            className="rounded-lg border border-muted px-4 py-2"
          />

          <input
            type="text"
            name="address"
            placeholder="Address"
            value={formValues.address}
            onChange={handleInputChange}
            className="rounded-lg border border-muted px-4 py-2"
          />

          <select
            name="qualification"
            value={formValues.qualification}
            onChange={handleInputChange}
            className="rounded-lg border border-muted px-4 py-2"
          >
            <option value="Bachelor">Bachelor</option>
            <option value="Master">Master</option>
            <option value="PhD">PhD</option>
            <option value="Other">Other</option>
          </select>

          <input
            type="text"
            name="specialization"
            placeholder="Specialization"
            value={formValues.specialization}
            onChange={handleInputChange}
            className="rounded-lg border border-muted px-4 py-2"
          />

          <input
            type="number"
            name="experienceYears"
            placeholder="Experience Years"
            value={formValues.experienceYears}
            onChange={handleInputChange}
            min="0"
            className="rounded-lg border border-muted px-4 py-2"
          />

          <input
            type="text"
            name="className"
            placeholder="Class Name"
            value={formValues.className}
            onChange={handleInputChange}
            className="rounded-lg border border-muted px-4 py-2"
          />

          <input
            type="text"
            placeholder="Subjects (comma-separated)"
            value={formValues.subjects?.join(', ')}
            onChange={handleSubjectsChange}
            className="rounded-lg border border-muted px-4 py-2"
          />

          <select
            name="status"
            value={formValues.status}
            onChange={handleInputChange}
            className="rounded-lg border border-muted px-4 py-2"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <input
            type="date"
            name="joinDate"
            value={formValues.joinDate}
            onChange={handleInputChange}
            className="rounded-lg border border-muted px-4 py-2"
          />

          <textarea
            name="remarks"
            placeholder="Remarks"
            value={formValues.remarks}
            onChange={handleInputChange}
            className="rounded-lg border border-muted px-4 py-2 md:col-span-2"
            rows={3}
          />

          <button
            type="submit"
            className="rounded-lg bg-primary px-6 py-2 font-medium text-white hover:opacity-90 md:col-span-2"
          >
            {editingId ? 'Update' : 'Add'} Teacher
          </button>

          {editingId && (
            <button
              type="button"
              onClick={() => {
                setFormValues(emptyTeacher);
                setEditingId(null);
              }}
              className="rounded-lg border border-muted px-6 py-2 font-medium text-text-primary hover:bg-background md:col-span-2"
            >
              Cancel
            </button>
          )}
        </form>
      </div>

      <div className="rounded-[2rem] border border-muted bg-white p-8 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-text-primary">Teachers List</h2>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-lg border border-muted px-4 py-2"
            />
            <button
              type="submit"
              className="rounded-lg bg-primary px-6 py-2 font-medium text-white hover:opacity-90"
            >
              Search
            </button>
          </form>
        </div>

        {loading ? (
          <p className="text-center text-text-secondary">Loading...</p>
        ) : teachers.length === 0 ? (
          <p className="text-center text-text-secondary">No teachers found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="border-b border-muted">
                <tr>
                  <th className="py-3 text-left text-sm font-semibold text-text-primary">Teacher ID</th>
                  <th className="py-3 text-left text-sm font-semibold text-text-primary">Name</th>
                  <th className="py-3 text-left text-sm font-semibold text-text-primary">Email</th>
                  <th className="py-3 text-left text-sm font-semibold text-text-primary">Qualification</th>
                  <th className="py-3 text-left text-sm font-semibold text-text-primary">Class</th>
                  <th className="py-3 text-left text-sm font-semibold text-text-primary">Experience</th>
                  <th className="py-3 text-left text-sm font-semibold text-text-primary">Status</th>
                  <th className="py-3 text-left text-sm font-semibold text-text-primary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher) => (
                  <tr key={teacher._id} className="border-b border-muted hover:bg-background">
                    <td className="py-3 text-sm text-text-primary">{teacher.teacherId}</td>
                    <td className="py-3 text-sm text-text-primary">{teacher.fullName}</td>
                    <td className="py-3 text-sm text-text-secondary">{teacher.email}</td>
                    <td className="py-3 text-sm text-text-primary">{teacher.qualification}</td>
                    <td className="py-3 text-sm text-text-primary">{teacher.className}</td>
                    <td className="py-3 text-sm text-text-primary">{teacher.experienceYears} yrs</td>
                    <td className="py-3">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                          teacher.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {teacher.status}
                      </span>
                    </td>
                    <td className="py-3 text-sm">
                      <button
                        onClick={() => handleEdit(teacher)}
                        className="mr-2 text-primary hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(teacher._id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeachersPage;
