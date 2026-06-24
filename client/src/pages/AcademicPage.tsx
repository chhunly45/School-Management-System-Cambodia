import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, Clock } from 'lucide-react';

interface Program {
  _id: string;
  name: string;
  gradeLevel: string;
  totalStudents: number;
  description: string;
}

interface Subject {
  _id: string;
  name: string;
  code: string;
  program: string;
  credits: number;
  teacher?: string;
}

interface Schedule {
  _id: string;
  className: string;
  subject: string;
  teacher: string;
  day: string;
  startTime: string;
  endTime: string;
  room: string;
}

const AcademicPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'programs' | 'subjects' | 'schedules'>('programs');
  const [programs, setPrograms] = useState<Program[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);

  useEffect(() => {
    if (!user) return navigate('/login');
    if (user.role !== 'admin') return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API calls
      // const programsData = await getPrograms();
      // const subjectsData = await getSubjects();
      // const schedulesData = await getSchedules();

      setPrograms([
        {
          _id: '1',
          name: 'Science Stream',
          gradeLevel: '10',
          totalStudents: 45,
          description: 'Focus on Science subjects'
        },
        {
          _id: '2',
          name: 'Commerce Stream',
          gradeLevel: '10',
          totalStudents: 42,
          description: 'Focus on Business and Economics'
        },
        {
          _id: '3',
          name: 'Arts Stream',
          gradeLevel: '11',
          totalStudents: 38,
          description: 'Focus on Humanities'
        }
      ]);

      setSubjects([
        {
          _id: '1',
          name: 'Mathematics',
          code: 'MATH101',
          program: 'Science Stream',
          credits: 4,
          teacher: 'Mr. Sokha'
        },
        {
          _id: '2',
          name: 'Physics',
          code: 'PHYS101',
          program: 'Science Stream',
          credits: 3,
          teacher: 'Mr. Chea'
        },
        {
          _id: '3',
          name: 'Chemistry',
          code: 'CHEM101',
          program: 'Science Stream',
          credits: 3,
          teacher: 'Ms. Nary'
        }
      ]);

      setSchedules([
        {
          _id: '1',
          className: '10A',
          subject: 'Mathematics',
          teacher: 'Mr. Sokha',
          day: 'Monday',
          startTime: '08:00',
          endTime: '09:30',
          room: '101'
        },
        {
          _id: '2',
          className: '10A',
          subject: 'Physics',
          teacher: 'Mr. Chea',
          day: 'Monday',
          startTime: '09:45',
          endTime: '11:15',
          room: '201'
        },
        {
          _id: '3',
          className: '10A',
          subject: 'Chemistry',
          teacher: 'Ms. Nary',
          day: 'Tuesday',
          startTime: '08:00',
          endTime: '09:30',
          room: '301'
        }
      ]);
    } catch (err) {
      setMessage('Unable to load academic data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // TODO: Add API call to save program
      setEditingProgram(null);
      await loadData();
      setMessage('Program saved successfully.');
    } catch (err) {
      setMessage('Failed to save program.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProgram = async (id: string) => {
    if (!confirm('Delete this program?')) return;
    setLoading(true);
    try {
      // TODO: Add API call to delete program
      await loadData();
      setMessage('Program deleted successfully.');
    } catch (err) {
      setMessage('Failed to delete program.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Academic Management</h1>
        <p className="text-text-secondary">Manage programs, subjects, and class schedules</p>
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

      {/* Tabs */}
      <div className="flex gap-4 border-b border-muted">
        <button
          onClick={() => setActiveTab('programs')}
          className={`px-4 py-3 font-medium transition border-b-2 ${
            activeTab === 'programs'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Programs
          </div>
        </button>
        <button
          onClick={() => setActiveTab('subjects')}
          className={`px-4 py-3 font-medium transition border-b-2 ${
            activeTab === 'subjects'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Subjects
          </div>
        </button>
        <button
          onClick={() => setActiveTab('schedules')}
          className={`px-4 py-3 font-medium transition border-b-2 ${
            activeTab === 'schedules'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Schedules
          </div>
        </button>
      </div>

      {/* Programs Tab */}
      {activeTab === 'programs' && (
        <div className="space-y-6">
          <button
            onClick={() => setEditingProgram({} as Program)}
            className="rounded-lg bg-primary px-6 py-2 text-white font-medium hover:opacity-90 transition"
          >
            Add Program
          </button>

          {editingProgram && (
            <form onSubmit={handleSaveProgram} className="rounded-lg border border-muted bg-white p-6">
              <h3 className="text-xl font-semibold mb-4">
                {editingProgram._id ? 'Edit Program' : 'Add New Program'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Program Name"
                  defaultValue={editingProgram.name || ''}
                  className="rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
                  disabled={loading}
                />
                <input
                  type="text"
                  placeholder="Grade Level"
                  defaultValue={editingProgram.gradeLevel || ''}
                  className="rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
                  disabled={loading}
                />
                <input
                  type="number"
                  placeholder="Total Students"
                  defaultValue={editingProgram.totalStudents || ''}
                  className="rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
                  disabled={loading}
                />
                <input
                  type="text"
                  placeholder="Description"
                  defaultValue={editingProgram.description || ''}
                  className="rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
                  disabled={loading}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-primary px-4 py-2 text-white font-medium hover:opacity-90 transition disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProgram(null)}
                  className="rounded-lg border border-muted px-4 py-2 hover:bg-background transition"
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto rounded-lg border border-muted">
            <table className="w-full">
              <thead className="bg-background">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Program Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Grade Level</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Students</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Description</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {programs.map(program => (
                  <tr key={program._id} className="border-t border-muted hover:bg-background transition">
                    <td className="px-4 py-3 font-medium">{program.name}</td>
                    <td className="px-4 py-3">{program.gradeLevel}</td>
                    <td className="px-4 py-3">{program.totalStudents}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{program.description}</td>
                    <td className="px-4 py-3 space-x-2">
                      <button
                        onClick={() => setEditingProgram(program)}
                        className="text-primary hover:underline text-sm font-medium"
                        disabled={loading}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProgram(program._id)}
                        className="text-red-600 hover:underline text-sm font-medium"
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subjects Tab */}
      {activeTab === 'subjects' && (
        <div className="overflow-x-auto rounded-lg border border-muted">
          <table className="w-full">
            <thead className="bg-background">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Subject</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Code</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Program</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Credits</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Teacher</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map(subject => (
                <tr key={subject._id} className="border-t border-muted hover:bg-background transition">
                  <td className="px-4 py-3 font-medium">{subject.name}</td>
                  <td className="px-4 py-3">{subject.code}</td>
                  <td className="px-4 py-3 text-sm">{subject.program}</td>
                  <td className="px-4 py-3">{subject.credits}</td>
                  <td className="px-4 py-3">{subject.teacher || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Schedules Tab */}
      {activeTab === 'schedules' && (
        <div className="overflow-x-auto rounded-lg border border-muted">
          <table className="w-full">
            <thead className="bg-background">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Class</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Subject</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Teacher</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Day</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Time</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Room</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map(schedule => (
                <tr key={schedule._id} className="border-t border-muted hover:bg-background transition">
                  <td className="px-4 py-3 font-medium">{schedule.className}</td>
                  <td className="px-4 py-3">{schedule.subject}</td>
                  <td className="px-4 py-3">{schedule.teacher}</td>
                  <td className="px-4 py-3">{schedule.day}</td>
                  <td className="px-4 py-3">
                    {schedule.startTime} - {schedule.endTime}
                  </td>
                  <td className="px-4 py-3">{schedule.room}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AcademicPage;
