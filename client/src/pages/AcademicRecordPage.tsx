import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import {
  listAcademicRecords,
  createAcademicRecord,
  updateAcademicRecord,
  deleteAcademicRecord
} from '../services/academicRecord.api';

interface AcademicRecord {
  _id: string;
  studentId: string;
  studentName: string;
  className: string;
  subject: string;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  academicYear: string;
  semester: 1 | 2;
  examType: 'midterm' | 'final' | 'quiz';
  remarks?: string;
}

const emptyRecord: AcademicRecord = {
  _id: '',
  studentId: '',
  studentName: '',
  className: '',
  subject: '',
  score: 0,
  grade: 'F',
  academicYear: '',
  semester: 1,
  examType: 'midterm',
  remarks: ''
};

const AcademicRecordPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState<AcademicRecord[]>([]);
  const [formValues, setFormValues] = useState<AcademicRecord>(emptyRecord);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user) return navigate('/login');
    if (user.role !== 'admin') return;
    loadRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const response = await listAcademicRecords({ search: searchTerm, perPage: 200 });
      const items = response.data?.items || [];
      setRecords(items.map((item: any) => ({
        ...item,
        score: Number(item.score),
        semester: Number(item.semester) as 1 | 2
      })));
    } catch (err) {
      setMessage('Unable to load academic records.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key: keyof AcademicRecord, value: string | number) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const payload = {
      studentId: formValues.studentId,
      studentName: formValues.studentName,
      className: formValues.className,
      subject: formValues.subject,
      score: Number(formValues.score),
      academicYear: formValues.academicYear,
      semester: formValues.semester,
      examType: formValues.examType,
      remarks: formValues.remarks
    };

    try {
      if (editingId) {
        await updateAcademicRecord(editingId, payload);
        setMessage('Academic record updated successfully.');
      } else {
        await createAcademicRecord(payload);
        setMessage('Academic record created successfully.');
      }
      setEditingId(null);
      setFormValues(emptyRecord);
      await loadRecords();
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Failed to save academic record.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record: AcademicRecord) => {
    setEditingId(record._id);
    setFormValues(record);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this academic record?')) return;
    setLoading(true);
    setMessage('');
    try {
      await deleteAcademicRecord(id);
      setMessage('Academic record deleted.');
      await loadRecords();
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Failed to delete record.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await loadRecords();
  };

  if (!user || user.role !== 'admin') {
    return <div className="p-8 text-center text-red-600">Access denied. Admin only.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Academic Records</h1>
        <p className="text-text-secondary">Manage student exam results across semesters and subjects.</p>
      </div>

      {message && (
        <div className={`rounded-lg p-4 ${message.toLowerCase().includes('success') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-lg border border-muted bg-white p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input
            value={formValues.studentId}
            onChange={(e) => handleInputChange('studentId', e.target.value)}
            placeholder="Student ID"
            className="rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
            required
            disabled={loading}
          />
          <input
            value={formValues.studentName}
            onChange={(e) => handleInputChange('studentName', e.target.value)}
            placeholder="Student Name"
            className="rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
            required
            disabled={loading}
          />
          <input
            value={formValues.className}
            onChange={(e) => handleInputChange('className', e.target.value)}
            placeholder="Class Name"
            className="rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
            required
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input
            value={formValues.subject}
            onChange={(e) => handleInputChange('subject', e.target.value)}
            placeholder="Subject"
            className="rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
            required
            disabled={loading}
          />
          <input
            type="number"
            value={formValues.score}
            onChange={(e) => handleInputChange('score', Number(e.target.value))}
            placeholder="Score"
            min={0}
            max={100}
            className="rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
            required
            disabled={loading}
          />
          <select
            value={formValues.examType}
            onChange={(e) => handleInputChange('examType', e.target.value)}
            className="rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
            required
            disabled={loading}
          >
            <option value="midterm">Midterm</option>
            <option value="final">Final</option>
            <option value="quiz">Quiz</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input
            value={formValues.academicYear}
            onChange={(e) => handleInputChange('academicYear', e.target.value)}
            placeholder="Academic Year"
            className="rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
            required
            disabled={loading}
          />
          <select
            value={formValues.semester}
            onChange={(e) => handleInputChange('semester', Number(e.target.value))}
            className="rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
            required
            disabled={loading}
          >
            <option value={1}>Semester 1</option>
            <option value={2}>Semester 2</option>
          </select>
          <input
            value={formValues.remarks}
            onChange={(e) => handleInputChange('remarks', e.target.value)}
            placeholder="Remarks"
            className="rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
            disabled={loading}
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-primary px-6 py-2 text-white font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {editingId ? 'Update Record' : 'Create Record'}
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setFormValues(emptyRecord);
            }}
            className="rounded-lg border border-muted px-6 py-2 hover:bg-background transition"
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
            placeholder="Search by student, class, or subject..."
            className="flex-1 rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
            disabled={loading}
          />
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
              <th className="px-4 py-3 text-left text-sm font-semibold">Student</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Class</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Subject</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Score</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Grade</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Exam Type</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Year</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Semester</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Remarks</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record._id} className="border-t border-muted hover:bg-background transition">
                <td className="px-4 py-3 font-medium">{record.studentName}</td>
                <td className="px-4 py-3">{record.className}</td>
                <td className="px-4 py-3">{record.subject}</td>
                <td className="px-4 py-3">{record.score}</td>
                <td className="px-4 py-3">{record.grade}</td>
                <td className="px-4 py-3">{record.examType}</td>
                <td className="px-4 py-3">{record.academicYear}</td>
                <td className="px-4 py-3">{record.semester}</td>
                <td className="px-4 py-3 text-sm text-text-secondary">{record.remarks || '-'}</td>
                <td className="px-4 py-3 space-x-2">
                  <button
                    onClick={() => handleEdit(record)}
                    className="text-primary hover:underline text-sm font-medium"
                    disabled={loading}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(record._id)}
                    className="text-red-600 hover:underline text-sm font-medium"
                    disabled={loading}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-6 text-center text-text-secondary">
                  No academic records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AcademicRecordPage;
