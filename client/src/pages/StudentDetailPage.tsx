import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getStudent } from '../services/student.api';

interface StudentDetail {
  _id: string;
  studentId: string;
  fullName: string;
  gender?: string;
  dateOfBirth?: string;
  phone?: string;
  address?: string;
  guardianName?: string;
  guardianPhone?: string;
  className?: string;
  monthlyTuition?: number;
  academicYear?: string;
  course?: string;
  level?: string;
  room?: string;
  studyShift?: string;
  grade?: string;
  status?: string;
}

const StudentDetailPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!['admin', 'LIMITED_STUDENT_PAYMENT'].includes(user.role)) {
      setMessage('You do not have permission to view this student.');
      setLoading(false);
      return;
    }
    if (!id) {
      setMessage('Student not found.');
      setLoading(false);
      return;
    }

    const loadStudent = async () => {
      setLoading(true);
      setMessage('');
      try {
        const response = await getStudent(id);
        setStudent(response.data || response);
      } catch (error: any) {
        setMessage(error?.response?.data?.message || 'Unable to load student details.');
      } finally {
        setLoading(false);
      }
    };

    void loadStudent();
  }, [id, navigate, user]);

  const details: Array<[string, string | number]> = student ? [
    ['Student ID', student.studentId],
    ['Full Name', student.fullName],
    ['Gender', student.gender || '-'],
    ['Date of Birth', student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : '-'],
    ['Academic Year', student.academicYear || '-'],
    ['Course', student.course || '-'],
    ['Level', student.level || student.grade || '-'],
    ['Room', student.room || student.className || '-'],
    ['Study Shift', student.studyShift || '-'],
    ['Phone', student.phone || '-'],
    ['Address', student.address || '-'],
    ['Guardian', student.guardianName || '-'],
    ['Guardian Phone', student.guardianPhone || '-'],
    ['Monthly Tuition', student.monthlyTuition ?? 0],
    ['Status', student.status || '-']
  ] : [];

  return (
    <div className="max-w-full min-w-0 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Student Details</h1>
          <p className="text-text-secondary">{student?.fullName || student?.studentId || 'Student record'}</p>
        </div>
        <Link to="/admin/students" className="rounded-lg border border-muted px-4 py-2 text-sm font-medium text-text-primary hover:bg-background">
          Back to Students
        </Link>
      </div>

      {message && <div role="alert" className="rounded-lg border border-warning/30 bg-background p-4 text-warning">{message}</div>}
      {loading ? (
        <div className="rounded-lg border border-muted bg-white p-8 text-center text-text-secondary">Loading student...</div>
      ) : student ? (
        <dl className="grid gap-3 rounded-lg border border-muted bg-white p-6 sm:grid-cols-2 xl:grid-cols-3">
          {details.map(([label, value]) => (
            <div key={label} className="border-b border-muted pb-3">
              <dt className="text-xs font-semibold uppercase text-text-secondary">{label}</dt>
              <dd className="mt-1 break-words text-sm text-text-primary">{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
};

export default StudentDetailPage;
