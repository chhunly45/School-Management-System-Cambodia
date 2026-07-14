import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { listStudents, createStudent, updateStudent, deleteStudent } from '../services/student.api';
import DeleteConfirmationModal from '../components/common/DeleteConfirmationModal';
import { listAcademicYears, type AcademicYear } from '../services/academicYear.api';
import { listGrades, type Grade } from '../services/grade.api';
import { listClasses, type ClassItem } from '../services/class.api';
import { formatDateForApi, formatDateForInput, parseLocalDate } from '../utils/date';

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
  academicYearId?: string | { _id: string; code: string; name: string };
  gradeId?: string | { _id: string; code: string; name: string; level: number };
  classId?: string | { _id: string; className: string };
  status: 'active' | 'inactive' | 'graduated';
}

interface StudentFormValues {
  studentId: string;
  englishName: string;
  khmerName: string;
  gender: 'male' | 'female' | 'other';
  dateOfBirth: string;
  phone: string;
  address: string;
  guardianName: string;
  guardianPhone: string;
  className: string;
  academicYearId: string;
  gradeId: string;
  classId: string;
  status: 'active' | 'inactive' | 'graduated';
}

type StudentField = keyof StudentFormValues;

const emptyStudentForm: StudentFormValues = {
  studentId: '',
  englishName: '',
  khmerName: '',
  gender: 'other',
  dateOfBirth: '',
  phone: '',
  address: '',
  guardianName: '',
  guardianPhone: '',
  className: '',
  academicYearId: '',
  gradeId: '',
  classId: '',
  status: 'active'
};

const getAcademicYearId = (value: Student['academicYearId']) => (typeof value === 'string' ? value : value?._id || '');
const getGradeId = (value: Student['gradeId']) => (typeof value === 'string' ? value : value?._id || '');
const getClassId = (value: Student['classId']) => (typeof value === 'string' ? value : value?._id || '');

const splitStudentName = (fullName: string) => {
  const trimmed = fullName?.trim() || '';
  if (!trimmed) return { englishName: '', khmerName: '' };

  const parts = trimmed.split(/\s*\/\s*/).map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { englishName: parts[0], khmerName: parts.slice(1).join(' / ') };
  }

  return { englishName: trimmed, khmerName: '' };
};

const buildStudentFullName = (englishName: string, khmerName: string) => {
  const english = englishName.trim();
  const khmer = khmerName.trim();
  if (!english) return khmer;
  if (!khmer) return english;
  return `${english} / ${khmer}`;
};

const StudentsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [formValues, setFormValues] = useState<StudentFormValues>(emptyStudentForm);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formErrors, setFormErrors] = useState<Partial<Record<StudentField, string>>>({});
  const [pendingDeleteStudent, setPendingDeleteStudent] = useState<Student | null>(null);
  const [responseDebug, setResponseDebug] = useState<{
    keys: string[];
    meta: any;
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0 });
  const PAGE_SIZE = 10;

  useEffect(() => {
    if (!user) return navigate('/login');
    if (user.role !== 'admin') {
      setAccessDenied(true);
      return;
    }
    void Promise.all([loadLookups(), loadStudents('', 1)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const getResponseItems = <T,>(response: any): T[] => {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.items)) return response.items;
    if (Array.isArray(response.data?.items)) return response.data.items;
    return [];
  };

  const loadLookups = async () => {
    let lookupError = false;

    try {
      const yearsResp = await listAcademicYears({ perPage: 100 });
      setAcademicYears(getResponseItems<AcademicYear>(yearsResp));
    } catch (err) {
      lookupError = true;
      console.error('Unable to load academic years lookup.', err);
    }

    try {
      const gradesResp = await listGrades({ perPage: 100 });
      setGrades(getResponseItems<Grade>(gradesResp));
    } catch (err) {
      lookupError = true;
      console.error('Unable to load grades lookup.', err);
    }

    try {
      const classesResp = await listClasses({ perPage: 100 });
      setClasses(getResponseItems<ClassItem>(classesResp));
    } catch (err) {
      lookupError = true;
      console.error('Unable to load classes lookup.', err);
    }

    if (lookupError) {
      setMessage('Unable to load some academic lookup data.');
    }
  };

  const loadStudents = async (search = '', pageNumber = 1, options: { preserveMessage?: boolean } = {}) => {
    const { preserveMessage = false } = options;
    setLoading(true);
    if (!preserveMessage) {
      setMessage('');
    }
    try {
      const response = await listStudents({ search, page: pageNumber, perPage: PAGE_SIZE }).catch((err: any) => {
        if (err?.response?.status === 304 && err.response.data) {
          return err.response.data;
        }
        throw err;
      });
      const payload = response?.data ?? response;
      const items = Array.isArray(payload?.items) ? payload.items : getResponseItems<Student>(response);
      const nextMeta = payload?.meta || response?.meta || { page: pageNumber, limit: PAGE_SIZE, total: items.length };

      setResponseDebug({
        keys: response ? Object.keys(response) : [],
        meta: nextMeta,
        page: Number(nextMeta.page) || pageNumber,
        limit: Number(nextMeta.limit) || PAGE_SIZE,
        total: Number(nextMeta.total) || 0,
        totalPages: Math.max(1, Math.ceil((Number(nextMeta.total) || 0) / (Number(nextMeta.limit) || PAGE_SIZE)))
      });

      setStudents(
        items.map((item: any) => ({
          ...item,
          dateOfBirth: item.dateOfBirth ? formatDateForInput(item.dateOfBirth) : ''
        }))
      );
      setMeta({
        page: Number(nextMeta.page) || pageNumber,
        limit: Number(nextMeta.limit) || PAGE_SIZE,
        total: Number(nextMeta.total) || 0
      });
      setPage(Number(nextMeta.page) || pageNumber);
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Unable to load students.');
      console.error('Unable to load students.', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await loadStudents(searchTerm, 1);
  };

  const handlePageChange = async (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages || loading) return;
    await loadStudents(searchTerm, nextPage);
  };

  const handleChange = (key: StudentField, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validateStudentForm = () => {
    const nextErrors: Partial<Record<StudentField, string>> = {};

    if (!formValues.studentId.trim()) {
      nextErrors.studentId = 'Student ID is required.';
    } else if (!/^[A-Za-z0-9-_/]{2,30}$/.test(formValues.studentId.trim())) {
      nextErrors.studentId = 'Use 2-30 letters, numbers, or - _ / characters.';
    }

    if (!formValues.englishName.trim() && !formValues.khmerName.trim()) {
      nextErrors.englishName = 'English name or Khmer name is required.';
    } else if (formValues.englishName.trim().length < 2 && formValues.khmerName.trim().length < 2) {
      nextErrors.englishName = 'Enter at least 2 characters for one of the names.';
    }

    if (formValues.phone.trim() && !/^\+?[0-9\s-]{7,20}$/.test(formValues.phone.trim())) {
      nextErrors.phone = 'Enter a valid phone number.';
    }

    if (formValues.guardianPhone.trim() && !/^\+?[0-9\s-]{7,20}$/.test(formValues.guardianPhone.trim())) {
      nextErrors.guardianPhone = 'Enter a valid guardian phone number.';
    }

    if (formValues.dateOfBirth) {
      const dob = parseLocalDate(formValues.dateOfBirth);
      const now = new Date();
      if (!dob) {
        nextErrors.dateOfBirth = 'Enter a valid date of birth.';
      } else if (dob > now) {
        nextErrors.dateOfBirth = 'Date of birth cannot be in the future.';
      }
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const getFieldClassName = (field: StudentField) =>
    `w-full rounded-lg border px-4 py-2 outline-none focus:border-primary ${formErrors[field] ? 'border-rose-400 bg-rose-50' : 'border-muted'}`;

  const handleAdd = () => {
    setEditingId(null);
    setFormValues(emptyStudentForm);
    setFormErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEdit = (student: Student) => {
    const { englishName, khmerName } = splitStudentName(student.fullName || '');
    setEditingId(student._id);
    setFormValues({
      studentId: student.studentId,
      englishName,
      khmerName,
      gender: student.gender,
      dateOfBirth: formatDateForInput(student.dateOfBirth),
      phone: student.phone,
      address: student.address,
      guardianName: student.guardianName,
      guardianPhone: student.guardianPhone,
      className: student.className || '',
      academicYearId: getAcademicYearId(student.academicYearId),
      gradeId: getGradeId(student.gradeId),
      classId: getClassId(student.classId),
      status: student.status
    });
    setFormErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (!validateStudentForm()) {
      setLoading(false);
      setMessage('Please fix the highlighted fields.');
      return;
    }

    const payload = {
      studentId: formValues.studentId,
      fullName: buildStudentFullName(formValues.englishName, formValues.khmerName),
      gender: formValues.gender,
      dateOfBirth: formatDateForApi(formValues.dateOfBirth) || undefined,
      phone: formValues.phone,
      address: formValues.address,
      guardianName: formValues.guardianName,
      guardianPhone: formValues.guardianPhone,
      className: formValues.className,
      academicYearId: formValues.academicYearId || undefined,
      gradeId: formValues.gradeId || undefined,
      classId: formValues.classId || undefined,
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
      setFormErrors({});
      await loadStudents(searchTerm, page, { preserveMessage: true });
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Failed to save student.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDeleteStudent) return;
    setLoading(true);
    setMessage('');

    try {
      await deleteStudent(pendingDeleteStudent._id);
      setMessage('Student deleted successfully.');
      setPendingDeleteStudent(null);
      const nextPage = page > 1 && students.length === 1 ? page - 1 : page;
      await loadStudents(searchTerm, nextPage, { preserveMessage: true });
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Failed to delete student.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);
  const startIndex = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const endIndex = meta.total === 0 ? 0 : Math.min(meta.page * meta.limit, meta.total);

  // TEMP: visual debug panel will be rendered in the JSX below (admin-only).

  const getStudentNameParts = (student: Student) => splitStudentName(student.fullName || '');

  const getAcademicYearLabel = (student: Student) => {
    if (typeof student.academicYearId !== 'string' && student.academicYearId) {
      return `${student.academicYearId.code} - ${student.academicYearId.name}`;
    }

    const selected = academicYears.find((item) => item._id === getAcademicYearId(student.academicYearId));
    return selected ? `${selected.code} - ${selected.name}` : '-';
  };

  const getGradeLabel = (student: Student) => {
    if (typeof student.gradeId !== 'string' && student.gradeId) {
      return `${student.gradeId.code} - ${student.gradeId.name}`;
    }

    const selected = grades.find((item) => item._id === getGradeId(student.gradeId));
    return selected ? `${selected.code} - ${selected.name}` : '-';
  };

  const getClassLabel = (student: Student) => {
    if (typeof student.classId !== 'string' && student.classId) {
      return student.classId.className;
    }

    const selected = classes.find((item) => item._id === getClassId(student.classId));
    return selected?.className || student.className || '-';
  };

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
            placeholder="Search by student ID, name, class, year, or grade..."
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
              className={getFieldClassName('studentId')}
              placeholder="Student ID"
              required
              disabled={loading}
            />
            {formErrors.studentId && <p className="text-sm text-rose-600">{formErrors.studentId}</p>}
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">English Name</span>
            <input
              value={formValues.englishName}
              onChange={(e) => handleChange('englishName', e.target.value)}
              className={getFieldClassName('englishName')}
              placeholder="English Name"
              disabled={loading}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Khmer Name</span>
            <input
              value={formValues.khmerName}
              onChange={(e) => handleChange('khmerName', e.target.value)}
              className={getFieldClassName('khmerName')}
              placeholder="Khmer Name"
              disabled={loading}
            />
          </label>
          {formErrors.englishName && <p className="text-sm text-rose-600 md:col-span-2">{formErrors.englishName}</p>}
          <label className="space-y-2">
            <span className="text-sm font-medium">Academic Year</span>
            <select
              value={formValues.academicYearId}
              onChange={(e) => handleChange('academicYearId', e.target.value)}
              className={getFieldClassName('academicYearId')}
              disabled={loading}
            >
              <option value="">Select Academic Year (optional)</option>
              {academicYears.map((item) => (
                <option key={item._id} value={item._id}>{`${item.code} - ${item.name}`}</option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Grade</span>
            <select
              value={formValues.gradeId}
              onChange={(e) => handleChange('gradeId', e.target.value)}
              className={getFieldClassName('gradeId')}
              disabled={loading}
            >
              <option value="">Select Grade (optional)</option>
              {grades.map((item) => (
                <option key={item._id} value={item._id}>{`${item.code} - ${item.name}`}</option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Class</span>
            <select
              value={formValues.classId}
              onChange={(e) => {
                const classId = e.target.value;
                handleChange('classId', classId);
                const selected = classes.find((item) => item._id === classId);
                if (selected) {
                  handleChange('className', selected.className);
                }
              }}
              className={getFieldClassName('classId')}
              disabled={loading}
            >
              <option value="">Select Class (optional)</option>
              {classes.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.className}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Class Name (Legacy)</span>
            <input
              value={formValues.className}
              onChange={(e) => handleChange('className', e.target.value)}
              className={getFieldClassName('className')}
              placeholder="Class name fallback"
              disabled={loading}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Gender</span>
            <select
              value={formValues.gender}
              onChange={(e) => handleChange('gender', e.target.value)}
              className={getFieldClassName('gender')}
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
              className={getFieldClassName('dateOfBirth')}
              type="date"
              disabled={loading}
            />
            {formErrors.dateOfBirth && <p className="text-sm text-rose-600">{formErrors.dateOfBirth}</p>}
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Status</span>
            <select
              value={formValues.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className={getFieldClassName('status')}
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
              className={getFieldClassName('phone')}
              placeholder="Phone"
              disabled={loading}
            />
            {formErrors.phone && <p className="text-sm text-rose-600">{formErrors.phone}</p>}
          </label>
          <label className="space-y-2 md:col-span-3">
            <span className="text-sm font-medium">Address</span>
            <input
              value={formValues.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className={getFieldClassName('address')}
              placeholder="Address"
              disabled={loading}
            />
          </label>
          <label className="space-y-2 md:col-span-3">
            <span className="text-sm font-medium">Guardian Name</span>
            <input
              value={formValues.guardianName}
              onChange={(e) => handleChange('guardianName', e.target.value)}
              className={getFieldClassName('guardianName')}
              placeholder="Guardian Name"
              disabled={loading}
            />
          </label>
          <label className="space-y-2 md:col-span-3">
            <span className="text-sm font-medium">Guardian Phone</span>
            <input
              value={formValues.guardianPhone}
              onChange={(e) => handleChange('guardianPhone', e.target.value)}
              className={getFieldClassName('guardianPhone')}
              placeholder="Guardian Phone"
              disabled={loading}
            />
            {formErrors.guardianPhone && <p className="text-sm text-rose-600">{formErrors.guardianPhone}</p>}
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
              setFormErrors({});
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
              <th className="px-4 py-3 text-left text-sm font-semibold">No.</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Student ID</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">English Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Khmer Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Gender</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Date of Birth</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Academic Year</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Grade</th>
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
                <td colSpan={13} className="px-4 py-8 text-center text-text-secondary">
                  Loading...
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={13} className="px-4 py-8 text-center text-text-secondary">
                  No students found.
                </td>
              </tr>
            ) : (
              students.map((student, index) => {
                const { englishName, khmerName } = getStudentNameParts(student);
                const rowNumber = (meta.page - 1) * meta.limit + index + 1;
                return (
                  <tr key={student._id} className="border-t border-muted hover:bg-background transition">
                    <td className="px-4 py-3 font-medium">{rowNumber}</td>
                    <td className="px-4 py-3 font-medium">{student.studentId}</td>
                    <td className="px-4 py-3">{englishName || '-'}</td>
                    <td className="px-4 py-3">{khmerName || '-'}</td>
                    <td className="px-4 py-3">{student.gender}</td>
                    <td className="px-4 py-3">{student.dateOfBirth || '-'}</td>
                    <td className="px-4 py-3">{getAcademicYearLabel(student)}</td>
                    <td className="px-4 py-3">{getGradeLabel(student)}</td>
                    <td className="px-4 py-3">{getClassLabel(student)}</td>
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
                        onClick={() => setPendingDeleteStudent(student)}
                        className="text-red-600 hover:underline text-sm font-medium"
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

        {/* Admin-only visual debug panel (temporary) */}
        {user && user.role === 'admin' && (
          <div className="mt-4 rounded-lg border border-muted bg-gray-50 p-3 text-sm text-text-secondary">
            <div className="font-semibold mb-2">[TEMP DEBUG] API Response</div>
            <div className="grid grid-cols-2 gap-2">
              <div>Response keys:</div>
              <div className="font-medium">{responseDebug ? responseDebug.keys.join(', ') : 'n/a'}</div>
              <div>Meta:</div>
              <div className="font-medium">{responseDebug ? JSON.stringify(responseDebug.meta) : 'n/a'}</div>
              <div>Page:</div>
              <div className="font-medium">{responseDebug?.page ?? 'n/a'}</div>
              <div>Limit:</div>
              <div className="font-medium">{responseDebug?.limit ?? 'n/a'}</div>
              <div>Total:</div>
              <div className="font-medium">{responseDebug?.total ?? 'n/a'}</div>
              <div>Total Pages:</div>
              <div className="font-medium">{responseDebug?.totalPages ?? 'n/a'}</div>
              <div>Students Loaded:</div>
              <div className="font-medium">{students.length}</div>
              <div>Pagination Visible:</div>
              <div className="font-medium">{totalPages > 1 ? 'Yes' : 'No'}</div>
            </div>
          </div>
        )}

      {totalPages > 1 && (
        <div className="flex flex-col gap-3 rounded-lg border border-muted bg-white p-4 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-text-secondary">
            {meta.total === 0 ? 'Showing 0 of 0 students' : `Showing ${startIndex}–${endIndex} of ${meta.total} students`}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1 || loading}
              className="rounded-lg border border-muted px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            {pageNumbers.map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => handlePageChange(pageNumber)}
                disabled={loading}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${pageNumber === page ? 'bg-primary text-white' : 'border border-muted text-text-secondary'}`}
              >
                {pageNumber}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages || loading}
              className="rounded-lg border border-muted px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={Boolean(pendingDeleteStudent)}
        title="Delete Student"
        description={pendingDeleteStudent ? `Are you sure you want to delete ${pendingDeleteStudent.fullName} (${pendingDeleteStudent.studentId})? This action cannot be undone.` : 'Are you sure you want to delete this student record?'}
        confirmLabel="Delete Student"
        cancelLabel="Cancel"
        isProcessing={loading}
        onCancel={() => setPendingDeleteStudent(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default StudentsPage;
