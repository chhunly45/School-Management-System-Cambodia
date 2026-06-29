import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import {
  listTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  type Teacher,
  type TeacherPayload
} from '../services/teacher.api';
import { listSubjects, type Subject } from '../services/subject.api';
import { listClasses, type ClassItem } from '../services/class.api';
import DeleteConfirmationModal from '../components/common/DeleteConfirmationModal';
import { formatDateForApi, formatDateForInput, parseLocalDate } from '../utils/date';

type TeacherField = keyof TeacherPayload;

interface TeacherFormValues {
  teacherId: string;
  fullName: string;
  gender: 'male' | 'female' | 'other';
  dateOfBirth: string;
  phone: string;
  email: string;
  address: string;
  qualification: 'Bachelor' | 'Master' | 'PhD' | 'Other';
  specialization: string;
  experienceYears: number;
  className: string;
  subjects: string[];
  subjectIds: string[];
  homeroomClassId: string;
  status: 'active' | 'inactive';
  joinDate: string;
  remarks: string;
}

const emptyTeacher: TeacherFormValues = {
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
  subjectIds: [],
  homeroomClassId: '',
  status: 'active',
  joinDate: formatDateForInput(new Date()),
  remarks: ''
};

const getSubjectIds = (value: Teacher['subjectIds']) => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => (typeof item === 'string' ? item : item?._id)).filter(Boolean) as string[];
};

const getHomeroomClassId = (value: Teacher['homeroomClassId']) => (typeof value === 'string' ? value : value?._id || '');

const TeachersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [formValues, setFormValues] = useState<TeacherFormValues>(emptyTeacher);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [formErrors, setFormErrors] = useState<Partial<Record<TeacherField, string>>>({});
  const [pendingDeleteTeacher, setPendingDeleteTeacher] = useState<Teacher | null>(null);

  useEffect(() => {
    if (!user) return navigate('/login');
    if (user.role !== 'admin') return;
    void Promise.all([loadLookups(), loadTeachers()]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadLookups = async () => {
    try {
      const [subjectResp, classResp] = await Promise.all([
        listSubjects({ status: 'active', perPage: 100 }),
        listClasses({ status: 'active', perPage: 100 })
      ]);

      setSubjects(subjectResp.data?.items || []);
      setClasses(classResp.data?.items || []);
    } catch (err) {
      console.error(err);
      setMessage('Unable to load teacher academic lookups.');
    }
  };

  const loadTeachers = async () => {
    setLoading(true);
    try {
      const response = await listTeachers({ search: searchTerm, perPage: 200, includeRelations: true });
      const items = response.data?.items || [];
      setTeachers(
        items.map((item: any) => ({
          ...item,
          dateOfBirth: item.dateOfBirth ? formatDateForInput(item.dateOfBirth) : '',
          joinDate: item.joinDate ? formatDateForInput(item.joinDate) : ''
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
    setFormValues((prev) => ({
      ...prev,
      [name]: name === 'experienceYears' ? Number(value) || 0 : value
    }));
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next[name as TeacherField];
      return next;
    });
  };

  const handleSubjectIdsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions).map((option) => option.value);
    setFormValues((prev) => ({ ...prev, subjectIds: selected }));
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next.subjectIds;
      return next;
    });
  };

  const handleSubjectsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const subjects = e.target.value
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s);
    setFormValues((prev) => ({ ...prev, subjects }));
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next.subjects;
      return next;
    });
  };

  const validateTeacherForm = () => {
    const nextErrors: Partial<Record<TeacherField, string>> = {};

    if (!formValues.teacherId.trim()) {
      nextErrors.teacherId = 'Teacher ID is required.';
    } else if (!/^[A-Za-z0-9-_/]{2,30}$/.test(formValues.teacherId.trim())) {
      nextErrors.teacherId = 'Use 2-30 letters, numbers, or - _ / characters.';
    }

    if (!formValues.fullName.trim()) {
      nextErrors.fullName = 'Full name is required.';
    } else if (formValues.fullName.trim().length < 2) {
      nextErrors.fullName = 'Full name must be at least 2 characters.';
    }

    if (formValues.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (formValues.phone?.trim() && !/^\+?[0-9\s-]{7,20}$/.test(formValues.phone.trim())) {
      nextErrors.phone = 'Enter a valid phone number.';
    }

    if (formValues.experienceYears < 0) {
      nextErrors.experienceYears = 'Experience years cannot be negative.';
    }

    if (formValues.dateOfBirth) {
      const dob = parseLocalDate(formValues.dateOfBirth);
      if (!dob) {
        nextErrors.dateOfBirth = 'Enter a valid date of birth.';
      } else if (dob > new Date()) {
        nextErrors.dateOfBirth = 'Date of birth cannot be in the future.';
      }
    }

    if (formValues.joinDate) {
      const joinDate = parseLocalDate(formValues.joinDate);
      if (!joinDate) {
        nextErrors.joinDate = 'Enter a valid join date.';
      }
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const getFieldClassName = (field: TeacherField) =>
    `rounded-lg border px-4 py-2 ${formErrors[field] ? 'border-rose-400 bg-rose-50' : 'border-muted'}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateTeacherForm()) {
      setMessage('Please fix the highlighted fields.');
      return;
    }

    const payload: TeacherPayload = {
      teacherId: formValues.teacherId,
      fullName: formValues.fullName,
      gender: formValues.gender,
      dateOfBirth: formatDateForApi(formValues.dateOfBirth) || undefined,
      phone: formValues.phone || undefined,
      email: formValues.email || undefined,
      address: formValues.address || undefined,
      qualification: formValues.qualification,
      specialization: formValues.specialization || undefined,
      experienceYears: formValues.experienceYears,
      className: formValues.className || undefined,
      subjects: formValues.subjects || [],
      subjectIds: formValues.subjectIds.length ? formValues.subjectIds : undefined,
      homeroomClassId: formValues.homeroomClassId || undefined,
      status: formValues.status,
      joinDate: formatDateForApi(formValues.joinDate) || undefined,
      remarks: formValues.remarks || undefined
    };

    try {
      if (editingId) {
        await updateTeacher(editingId, payload);
        setMessage('Teacher updated successfully!');
      } else {
        await createTeacher(payload);
        setMessage('Teacher added successfully!');
      }
      setFormValues(emptyTeacher);
      setEditingId(null);
      setFormErrors({});
      loadTeachers();
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Error saving teacher.');
      console.error(err);
    }
  };

  const handleEdit = (teacher: Teacher) => {
    setFormValues({
      teacherId: teacher.teacherId,
      fullName: teacher.fullName,
      gender: teacher.gender,
      dateOfBirth: teacher.dateOfBirth ? formatDateForInput(teacher.dateOfBirth) : '',
      phone: teacher.phone || '',
      email: teacher.email || '',
      address: teacher.address || '',
      qualification: teacher.qualification,
      specialization: teacher.specialization || '',
      experienceYears: teacher.experienceYears,
      className: teacher.className || '',
      subjects: teacher.subjects || [],
      subjectIds: getSubjectIds(teacher.subjectIds),
      homeroomClassId: getHomeroomClassId(teacher.homeroomClassId),
      status: teacher.status,
      joinDate: teacher.joinDate ? formatDateForInput(teacher.joinDate) : '',
      remarks: teacher.remarks || ''
    });
    setEditingId(teacher._id);
    setFormErrors({});
  };

  const handleDelete = async () => {
    if (!pendingDeleteTeacher) return;

    try {
      await deleteTeacher(pendingDeleteTeacher._id);
      setMessage('Teacher deleted successfully!');
      setPendingDeleteTeacher(null);
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

  const getTeacherSubjectsLabel = (teacher: Teacher) => {
    if (Array.isArray(teacher.subjectIds) && teacher.subjectIds.length > 0) {
      const names = teacher.subjectIds
        .map((item) => {
          if (typeof item !== 'string') return item.name;
          const matched = subjects.find((subject) => subject._id === item);
          return matched?.name || item;
        })
        .filter(Boolean);

      if (names.length > 0) {
        return names.join(', ');
      }
    }

    if (Array.isArray(teacher.subjects) && teacher.subjects.length > 0) {
      return teacher.subjects.join(', ');
    }

    return '-';
  };

  const getHomeroomClassLabel = (teacher: Teacher) => {
    if (typeof teacher.homeroomClassId !== 'string' && teacher.homeroomClassId) {
      return teacher.homeroomClassId.className;
    }

    if (typeof teacher.homeroomClassId === 'string' && teacher.homeroomClassId) {
      const matched = classes.find((item) => item._id === teacher.homeroomClassId);
      if (matched) return matched.className;
    }

    return teacher.className || '-';
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
            className={getFieldClassName('teacherId')}
            required
          />
          {formErrors.teacherId && <p className="-mt-4 text-sm text-rose-600">{formErrors.teacherId}</p>}

          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            value={formValues.fullName}
            onChange={handleInputChange}
            className={getFieldClassName('fullName')}
            required
          />
          {formErrors.fullName && <p className="-mt-4 text-sm text-rose-600">{formErrors.fullName}</p>}

          <select
            name="gender"
            value={formValues.gender}
            onChange={handleInputChange}
            className={getFieldClassName('gender')}
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
            className={getFieldClassName('dateOfBirth')}
          />
          {formErrors.dateOfBirth && <p className="-mt-4 text-sm text-rose-600">{formErrors.dateOfBirth}</p>}

          <input
            type="tel"
            name="phone"
            placeholder="Phone"
            value={formValues.phone}
            onChange={handleInputChange}
            className={getFieldClassName('phone')}
          />
          {formErrors.phone && <p className="-mt-4 text-sm text-rose-600">{formErrors.phone}</p>}

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formValues.email}
            onChange={handleInputChange}
            className={getFieldClassName('email')}
          />
          {formErrors.email && <p className="-mt-4 text-sm text-rose-600">{formErrors.email}</p>}

          <input
            type="text"
            name="address"
            placeholder="Address"
            value={formValues.address}
            onChange={handleInputChange}
            className={getFieldClassName('address')}
          />

          <select
            name="qualification"
            value={formValues.qualification}
            onChange={handleInputChange}
            className={getFieldClassName('qualification')}
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
            className={getFieldClassName('specialization')}
          />

          <input
            type="number"
            name="experienceYears"
            placeholder="Experience Years"
            value={formValues.experienceYears}
            onChange={handleInputChange}
            min="0"
            className={getFieldClassName('experienceYears')}
          />
          {formErrors.experienceYears && <p className="-mt-4 text-sm text-rose-600">{formErrors.experienceYears}</p>}

          <input
            type="text"
            name="className"
            placeholder="Class Name"
            value={formValues.className}
            onChange={handleInputChange}
            className={getFieldClassName('className')}
          />

          <input
            type="text"
            placeholder="Subjects (comma-separated)"
            value={formValues.subjects?.join(', ')}
            onChange={handleSubjectsChange}
            className={getFieldClassName('subjects')}
          />

          <label className="md:col-span-2 space-y-2">
            <span className="text-sm font-medium text-text-secondary">Subjects (Academic Reference - Optional)</span>
            <select
              multiple
              value={formValues.subjectIds}
              onChange={handleSubjectIdsChange}
              className={`${getFieldClassName('subjectIds')} w-full h-28`}
            >
              {subjects.map((subject) => (
                <option key={subject._id} value={subject._id}>{`${subject.code} - ${subject.name}`}</option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-text-secondary">Homeroom Class (Optional)</span>
            <select
              name="homeroomClassId"
              value={formValues.homeroomClassId}
              onChange={handleInputChange}
              className={getFieldClassName('homeroomClassId')}
            >
              <option value="">Select Homeroom Class</option>
              {classes.map((item) => (
                <option key={item._id} value={item._id}>{item.className}</option>
              ))}
            </select>
          </label>

          <select
            name="status"
            value={formValues.status}
            onChange={handleInputChange}
            className={getFieldClassName('status')}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <input
            type="date"
            name="joinDate"
            value={formValues.joinDate}
            onChange={handleInputChange}
            className={getFieldClassName('joinDate')}
          />
          {formErrors.joinDate && <p className="-mt-4 text-sm text-rose-600">{formErrors.joinDate}</p>}

          <textarea
            name="remarks"
            placeholder="Remarks"
            value={formValues.remarks}
            onChange={handleInputChange}
            className={`${getFieldClassName('remarks')} md:col-span-2`}
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
                setFormErrors({});
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
                  <th className="py-3 text-left text-sm font-semibold text-text-primary">Subjects</th>
                  <th className="py-3 text-left text-sm font-semibold text-text-primary">Homeroom Class</th>
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
                    <td className="py-3 text-sm text-text-primary">{getTeacherSubjectsLabel(teacher)}</td>
                    <td className="py-3 text-sm text-text-primary">{getHomeroomClassLabel(teacher)}</td>
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
                        onClick={() => setPendingDeleteTeacher(teacher)}
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

      <DeleteConfirmationModal
        isOpen={Boolean(pendingDeleteTeacher)}
        title="Delete Teacher"
        description={pendingDeleteTeacher ? `Are you sure you want to delete ${pendingDeleteTeacher.fullName} (${pendingDeleteTeacher.teacherId})? This action cannot be undone.` : 'Are you sure you want to delete this teacher?'}
        confirmLabel="Delete Teacher"
        cancelLabel="Cancel"
        onCancel={() => setPendingDeleteTeacher(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default TeachersPage;
