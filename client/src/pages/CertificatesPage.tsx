import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Award, Download, Trash2 } from 'lucide-react';

interface Certificate {
  _id: string;
  studentName: string;
  studentId: string;
  certificateType: 'completion' | 'achievement' | 'merit' | 'participation';
  dateIssued: Date;
  issuedBy: string;
  status: 'draft' | 'issued' | 'printed';
  fileUrl?: string;
}

const CertificatesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [generatingFor, setGeneratingFor] = useState<string>('');
  const [certificateType, setCertificateType] = useState<'completion' | 'achievement' | 'merit' | 'participation'>(
    'completion'
  );
  const [studentSearch, setStudentSearch] = useState('');

  useEffect(() => {
    if (!user) return navigate('/login');
    if (user.role !== 'admin') return;
    loadCertificates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadCertificates = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const res = await getCertificates();

      setCertificates([
        {
          _id: '1',
          studentName: 'Sokha Minh',
          studentId: 'S001',
          certificateType: 'completion',
          dateIssued: new Date('2024-06-15'),
          issuedBy: 'Principal',
          status: 'issued',
          fileUrl: '/certificates/S001_completion.pdf'
        },
        {
          _id: '2',
          studentName: 'Srey Nit',
          studentId: 'S002',
          certificateType: 'achievement',
          dateIssued: new Date('2024-06-18'),
          issuedBy: 'Dean',
          status: 'issued',
          fileUrl: '/certificates/S002_achievement.pdf'
        }
      ]);
    } catch (err) {
      setMessage('Unable to load certificates.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generatingFor) {
      setMessage('Please select a student.');
      return;
    }

    setLoading(true);
    try {
      // TODO: Add API call to generate certificate
      const newCertificate: Certificate = {
        _id: Date.now().toString(),
        studentName: 'Selected Student',
        studentId: generatingFor,
        certificateType,
        dateIssued: new Date(),
        issuedBy: user?.email || 'Admin',
        status: 'draft',
        fileUrl: `/certificates/${generatingFor}_${certificateType}.pdf`
      };

      setCertificates([...certificates, newCertificate]);
      setGeneratingFor('');
      setCertificateType('completion');
      setMessage('Certificate generated successfully.');
    } catch (err) {
      setMessage('Failed to generate certificate.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (certificateId: string) => {
    try {
      // TODO: Add API call to download certificate
      const cert = certificates.find(c => c._id === certificateId);
      if (cert?.fileUrl) {
        window.open(cert.fileUrl, '_blank');
      }
    } catch (err) {
      setMessage('Failed to download certificate.');
    }
  };

  const handleDelete = async (certificateId: string) => {
    if (!confirm('Delete this certificate?')) return;

    setLoading(true);
    try {
      // TODO: Add API call to delete certificate
      setCertificates(certificates.filter(c => c._id !== certificateId));
      setMessage('Certificate deleted successfully.');
    } catch (err) {
      setMessage('Failed to delete certificate.');
    } finally {
      setLoading(false);
    }
  };

  const getCertificateTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      completion: 'Completion Certificate',
      achievement: 'Achievement Certificate',
      merit: 'Merit Certificate',
      participation: 'Participation Certificate'
    };
    return labels[type] || type;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'issued':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'printed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Certificates</h1>
        <p className="text-text-secondary">Generate and manage student certificates</p>
      </div>

      {message && (
        <div
          className={`rounded-lg p-4 ${
            message.includes('success') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {message}
        </div>
      )}

      {/* Certificate Generation Form */}
      <form onSubmit={handleGenerateCertificate} className="rounded-lg border border-muted bg-white p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Award className="h-5 w-5" />
          Generate New Certificate
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Student ID</label>
            <input
              type="text"
              placeholder="e.g., S001"
              value={generatingFor}
              onChange={(e) => setGeneratingFor(e.target.value)}
              className="w-full rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Certificate Type</label>
            <select
              value={certificateType}
              onChange={(e) => setCertificateType(e.target.value as any)}
              className="w-full rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
              disabled={loading}
            >
              <option value="completion">Completion</option>
              <option value="achievement">Achievement</option>
              <option value="merit">Merit</option>
              <option value="participation">Participation</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading || !generatingFor}
              className="w-full rounded-lg bg-primary px-4 py-2 text-white font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </div>
        <p className="text-sm text-text-secondary">
          Search for student by ID or name to select. Leave blank to generate for all.
        </p>
      </form>

      {/* Issued Certificates */}
      <div className="rounded-lg border border-muted">
        <div className="border-b border-muted bg-background px-6 py-4">
          <h3 className="font-semibold text-lg">Issued Certificates</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background border-b border-muted">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Student</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Certificate Type</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Date Issued</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Issued By</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
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
              ) : certificates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-secondary">
                    No certificates issued yet
                  </td>
                </tr>
              ) : (
                certificates.map(cert => (
                  <tr key={cert._id} className="border-t border-muted hover:bg-background transition">
                    <td className="px-4 py-3 font-medium">{cert.studentName}</td>
                    <td className="px-4 py-3 text-sm">{getCertificateTypeLabel(cert.certificateType)}</td>
                    <td className="px-4 py-3 text-sm">{new Date(cert.dateIssued).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm">{cert.issuedBy}</td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(cert.status)}`}>
                        {cert.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDownload(cert._id)}
                          className="text-primary hover:underline text-sm font-medium flex items-center gap-1"
                          disabled={loading}
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </button>
                        <button
                          onClick={() => handleDelete(cert._id)}
                          className="text-red-600 hover:underline text-sm font-medium flex items-center gap-1"
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4" />
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
      </div>
    </div>
  );
};

export default CertificatesPage;
