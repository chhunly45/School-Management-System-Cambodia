import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import {
  listCertificates,
  createCertificate,
  updateCertificate,
  deleteCertificate
} from '../services/certificate.api';
import { listStudents } from '../services/student.api';
import { formatDateForApi, formatDateForDisplay, formatDateForInput } from '../utils/date';

interface Certificate {
  _id: string;
  certificateNumber: string;
  studentId: string;
  studentName: string;
  className: string;
  certificateType: 'graduation' | 'achievement' | 'attendance' | 'honor';
  issueDate: string;
  academicYear: string;
  issuedBy?: string;
  remarks?: string;
  status: 'draft' | 'issued' | 'revoked';
}

interface StudentOption {
  _id: string;
  studentId: string;
  fullName: string;
  className: string;
}

const emptyCertificate: Certificate = {
  _id: '',
  certificateNumber: '',
  studentId: '',
  studentName: '',
  className: '',
  certificateType: 'graduation',
  issueDate: formatDateForInput(new Date()),
  academicYear: '',
  issuedBy: '',
  remarks: '',
  status: 'draft'
};

const CertificatesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [formValues, setFormValues] = useState<Certificate>(emptyCertificate);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<StudentOption[]>([]);

  useEffect(() => {
    if (!user) return navigate('/login');
    if (user.role !== 'admin') return;
    loadCertificates();
    loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadStudents = async () => {
    try {
      const response = await listStudents({ perPage: 500 });
      const items = response.data?.items || [];
      setStudents(
        items.map((item: any) => ({
          _id: item._id,
          studentId: item.studentId,
          fullName: item.fullName,
          className: item.className
        }))
      );
    } catch (err) {
      console.error(err);
      setMessage('Unable to load students.');
    }
  };

  const loadCertificates = async () => {
    setLoading(true);
    try {
      const response = await listCertificates({ search: searchTerm, perPage: 200 });
      const items = response.data?.items || [];
      setCertificates(
        items.map((item: any) => ({
          ...item,
          studentId: typeof item.studentId === 'string' ? item.studentId : item.studentId?._id,
          issueDate: item.issueDate ? formatDateForInput(item.issueDate) : ''
        }))
      );
    } catch (err) {
      setMessage('Unable to load certificates.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key: keyof Certificate, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleStudentSelect = (selectedStudentId: string) => {
    const selectedStudent = students.find((student) => student._id === selectedStudentId);
    if (!selectedStudent) {
      setFormValues((prev) => ({ ...prev, studentId: '', studentName: '', className: '' }));
      return;
    }

    setFormValues((prev) => ({
      ...prev,
      studentId: selectedStudent._id,
      studentName: selectedStudent.fullName,
      className: selectedStudent.className
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const payload = {
      certificateNumber: formValues.certificateNumber,
      studentId: formValues.studentId,
      studentName: formValues.studentName,
      className: formValues.className,
      certificateType: formValues.certificateType,
      issueDate: formatDateForApi(formValues.issueDate) || undefined,
      academicYear: formValues.academicYear,
      issuedBy: formValues.issuedBy,
      remarks: formValues.remarks,
      status: formValues.status
    };

    try {
      if (editingId) {
        await updateCertificate(editingId, payload);
        setMessage('Certificate updated successfully.');
      } else {
        await createCertificate(payload);
        setMessage('Certificate created successfully.');
      }
      setEditingId(null);
      setFormValues(emptyCertificate);
      await loadCertificates();
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Failed to save certificate.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (certificate: Certificate) => {
    setEditingId(certificate._id);
    setFormValues(certificate);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (certificateId: string) => {
    if (!window.confirm('Delete this certificate?')) return;
    setLoading(true);
    setMessage('');
    try {
      await deleteCertificate(certificateId);
      setMessage('Certificate deleted successfully.');
      await loadCertificates();
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Failed to delete certificate.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await loadCertificates();
  };

  const getCertificateTypeLabel = (type: Certificate['certificateType']) => {
    const labels: Record<string, string> = {
      graduation: 'Graduation',
      achievement: 'Achievement',
      attendance: 'Attendance',
      honor: 'Honor'
    };
    return labels[type] || type;
  };

  const getStatusColor = (status: Certificate['status']) => {
    switch (status) {
      case 'issued':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'revoked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user || user.role !== 'admin') {
    return <div className="p-8 text-center text-red-600">Access denied. Admin only.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Certificates</h1>
        <p className="text-text-secondary">Manage student certificates by academic year and status.</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input
            value={formValues.certificateNumber}
            onChange={(e) => handleInputChange('certificateNumber', e.target.value)}
            placeholder="Certificate Number"
            className="rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
            required
            disabled={loading}
          />
          <select
            value={formValues.studentId}
            onChange={(e) => handleStudentSelect(e.target.value)}
            className="rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
            required
            disabled={loading}
          >
            <option value="">Select Student</option>
            {students.map((student) => (
              <option key={student._id} value={student._id}>
                {`${student.fullName} (${student.studentId})`}
              </option>
            ))}
          </select>
          <input
            value={formValues.studentName}
            placeholder="Student Name"
            className="rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
            required
            disabled
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input
            value={formValues.className}
            placeholder="Class Name"
            className="rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
            required
            disabled
          />
          <select
            value={formValues.certificateType}
            onChange={(e) => handleInputChange('certificateType', e.target.value)}
            className="rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
            required
            disabled={loading}
          >
            <option value="graduation">Graduation</option>
            <option value="achievement">Achievement</option>
            <option value="attendance">Attendance</option>
            <option value="honor">Honor</option>
          </select>
          <input
            type="date"
            value={formValues.issueDate}
            onChange={(e) => handleInputChange('issueDate', e.target.value)}
            className="rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
            required
            disabled={loading}
          />
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
          <input
            value={formValues.issuedBy}
            onChange={(e) => handleInputChange('issuedBy', e.target.value)}
            placeholder="Issued By"
            className="rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
            disabled={loading}
          />
          <select
            value={formValues.status}
            onChange={(e) => handleInputChange('status', e.target.value)}
            className="rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
            required
            disabled={loading}
          >
            <option value="draft">Draft</option>
            <option value="issued">Issued</option>
            <option value="revoked">Revoked</option>
          </select>
        </div>

        <div className="mb-4">
          <input
            value={formValues.remarks}
            onChange={(e) => handleInputChange('remarks', e.target.value)}
            placeholder="Remarks"
            className="w-full rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
            disabled={loading}
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-primary px-6 py-2 text-white font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {editingId ? 'Update Certificate' : 'Create Certificate'}
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setFormValues(emptyCertificate);
            }}
            className="rounded-lg border border-muted px-6 py-2 hover:bg-background transition"
            disabled={loading}
          >
            Reset
          </button>
        </div>
      </form>

      <form onSubmit={handleSearch} className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by number, student, class, or year..."
          className="flex-1 rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
          disabled={loading}
        />
        <button
          type="submit"
          className="rounded-lg bg-secondary px-6 py-2 text-white font-medium hover:opacity-90 transition disabled:opacity-50"
          disabled={loading}
        >
          Search
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-muted bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead className="bg-background">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Number</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Student</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Class</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Issue Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Academic Year</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Issued By</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Remarks</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {certificates.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-text-secondary">
                    No certificates issued yet
                  </td>
                </tr>
              ) : (
                certificates.map((cert) => (
                  <tr key={cert._id} className="border-t border-muted hover:bg-background transition">
                    <td className="px-4 py-3 font-medium">{cert.certificateNumber}</td>
                    <td className="px-4 py-3 font-medium">{cert.studentName}</td>
                    <td className="px-4 py-3">{cert.className}</td>
                    <td className="px-4 py-3 text-sm">{getCertificateTypeLabel(cert.certificateType)}</td>
                    <td className="px-4 py-3 text-sm">{formatDateForDisplay(cert.issueDate)}</td>
                    <td className="px-4 py-3 text-sm">{cert.academicYear}</td>
                    <td className="px-4 py-3 text-sm">{cert.issuedBy || '-'}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{cert.remarks || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(cert.status)}`}>
                        {cert.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 space-x-2">
                        <button
                          onClick={() => handleEdit(cert)}
                          className="text-primary hover:underline text-sm font-medium"
                          disabled={loading}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(cert._id)}
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
    </div>
  );
};

export default CertificatesPage;
