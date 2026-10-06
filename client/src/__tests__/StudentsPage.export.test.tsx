import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import StudentsPage, { buildStudentsCsv } from '../pages/StudentsPage';
import { useAuth } from '../hooks/useAuth';
import { listStudents, createStudent, updateStudent, deleteStudent } from '../services/student.api';

jest.mock('../hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

jest.mock('../services/student.api', () => ({
  listStudents: jest.fn(),
  createStudent: jest.fn(),
  updateStudent: jest.fn(),
  deleteStudent: jest.fn()
}));

jest.mock('../components/common/DeleteConfirmationModal', () => () => null);

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn()
}));

const makeStudent = (overrides: Record<string, unknown> = {}) => ({
  studentId: 'S-001',
  fullName: 'Student One',
  gender: 'other',
  dateOfBirth: '2015-04-03',
  phone: '012345678',
  address: 'Phnom Penh',
  guardianName: 'Guardian One',
  guardianPhone: '098765432',
  className: 'Class 1',
  academicYear: '2026-2027',
  grade: 'Grade 1',
  studyShift: 'Morning',
  status: 'active',
  monthlyTuition: 25,
  ...overrides
});

const response = (items: ReturnType<typeof makeStudent>[], total = items.length) => ({
  data: {
    items,
    meta: { page: 1, limit: items.length, total }
  }
});

const buildCsv = (student: Record<string, unknown>) =>
  buildStudentsCsv([student as Parameters<typeof buildStudentsCsv>[0][number]]);

const createObjectUrl = jest.fn().mockReturnValue('blob:student-export');
const revokeObjectUrl = jest.fn();
let originalCreateObjectUrl: PropertyDescriptor | undefined;
let originalRevokeObjectUrl: PropertyDescriptor | undefined;
let anchorClick: jest.SpyInstance;

beforeAll(() => {
  originalCreateObjectUrl = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
  originalRevokeObjectUrl = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectUrl });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectUrl });
  anchorClick = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
});

afterAll(() => {
  if (originalCreateObjectUrl) Object.defineProperty(URL, 'createObjectURL', originalCreateObjectUrl);
  else delete (URL as Partial<typeof URL>).createObjectURL;
  if (originalRevokeObjectUrl) Object.defineProperty(URL, 'revokeObjectURL', originalRevokeObjectUrl);
  else delete (URL as Partial<typeof URL>).revokeObjectURL;
  anchorClick.mockRestore();
});

describe('Student CSV export', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: { role: 'admin' } });
    (listStudents as jest.Mock).mockResolvedValue(response([]));
  });

  it('uses the explicit safe columns and preserves Khmer text', () => {
    const csv = buildCsv(makeStudent({
      fullName: 'សុភា / Sokha',
      _id: 'internal-id',
      createdBy: 'internal-creator',
      updatedBy: 'internal-updater'
    }));

    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv.slice(1).split('\r\n')[0]).toBe(
      '"Student ID","Full Name","Gender","Date of Birth","Phone","Address","Guardian Name","Guardian Phone","Class","Academic Year","Grade","Study Shift","Status","Monthly Tuition"'
    );
    expect(csv).toContain('សុភា / Sokha');
    expect(csv).not.toContain('internal-id');
    expect(csv).not.toContain('internal-creator');
    expect(csv).not.toContain('internal-updater');
  });

  it('escapes commas, quotes, and line breaks in CSV cells', () => {
    const csv = buildCsv(makeStudent({ fullName: 'Doe, "Jane"\nStudent' }));
    expect(csv).toContain('"Doe, ""Jane""\nStudent"');
  });

  it.each(['=SUM(A1:A2)', '+cmd', '-cmd', '@value'])(
    'prefixes formula-like values with an apostrophe: %s',
    (value) => {
      const csv = buildCsv(makeStudent({ fullName: value }));
      expect(csv).toContain(`"'${value}"`);
    }
  );

  it('converts null and undefined fields to empty cells', () => {
    const csv = buildCsv(makeStudent({ phone: null, address: undefined }));
    const dataRow = csv.split('\r\n')[1];
    expect(dataRow).toContain('"",""');
    expect(dataRow?.split(',')).toHaveLength(14);
  });

  it('exports every matching record using the current search instead of only the displayed page', async () => {
    const user = userEvent.setup();
    const tenStudents = Array.from({ length: 10 }, (_, index) => makeStudent({ studentId: `S-${index + 1}` }));
    const twelveStudents = Array.from({ length: 12 }, (_, index) => makeStudent({ studentId: `MATCH-${index + 1}` }));
    (listStudents as jest.Mock).mockImplementation((query) => {
      if (query.search === 'needle' && query.perPage === 1) return Promise.resolve(response([twelveStudents[0]], 12));
      if (query.search === 'needle' && query.perPage === 12) return Promise.resolve(response(twelveStudents, 12));
      if (query.search === 'needle') return Promise.resolve(response(tenStudents, 12));
      return Promise.resolve(response([]));
    });

    render(
      <MemoryRouter>
        <StudentsPage />
      </MemoryRouter>
    );

    const search = screen.getByPlaceholderText(/Search by student ID/i);
    await user.type(search, 'needle');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() => expect(listStudents).toHaveBeenCalledWith({ search: 'needle', page: 1, perPage: 10 }));

    const exportButton = await screen.findByRole('button', { name: 'Export CSV' });
    await user.click(exportButton);

    await waitFor(() => {
      expect(listStudents).toHaveBeenCalledWith({ search: 'needle', page: 1, perPage: 1 });
      expect(listStudents).toHaveBeenCalledWith({ search: 'needle', page: 1, perPage: 12 });
    });
    expect(createStudent).not.toHaveBeenCalled();
    expect(updateStudent).not.toHaveBeenCalled();
    expect(deleteStudent).not.toHaveBeenCalled();
    expect(anchorClick).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:student-export');
    expect(document.querySelector('a[download]')).toBeNull();
  });

  it('does not download when no matching students exist', async () => {
    (listStudents as jest.Mock)
      .mockResolvedValueOnce(response([]))
      .mockResolvedValueOnce(response([], 0));

    render(
      <MemoryRouter>
        <StudentsPage />
      </MemoryRouter>
    );

    await userEvent.click(await screen.findByRole('button', { name: 'Export CSV' }));
    expect(await screen.findByText('No students to export.')).toBeInTheDocument();
    expect(createObjectUrl).not.toHaveBeenCalled();
    expect(anchorClick).not.toHaveBeenCalled();
  });

  it('preserves the existing Student create flow', async () => {
    const user = userEvent.setup();
    (createStudent as jest.Mock).mockResolvedValue({ success: true });

    render(
      <MemoryRouter>
        <StudentsPage />
      </MemoryRouter>
    );

    const createButton = await screen.findByRole('button', { name: 'Create Student' });
    const addForm = screen.getByText('Add New Student').closest('form');
    expect(addForm).not.toBeNull();
    expect(within(addForm as HTMLFormElement).getByRole('button', { name: 'Create Student' })).toBe(createButton);
    await waitFor(() => expect(createButton).toBeEnabled());
    await user.type(screen.getByPlaceholderText('Student ID'), 'S-NEW');
    await user.type(screen.getByPlaceholderText('English Name'), 'New Student');
    await user.click(createButton);

    await waitFor(() => {
      expect(createStudent).toHaveBeenCalledWith(expect.objectContaining({
        studentId: 'S-NEW',
        fullName: 'New Student'
      }));
    });
    expect(await screen.findByText('Student created successfully.')).toBeInTheDocument();
  });

  it('disables export while export data is loading', async () => {
    let resolveExport: (value: ReturnType<typeof response>) => void = () => undefined;
    (listStudents as jest.Mock)
      .mockResolvedValueOnce(response([]))
      .mockImplementationOnce(() => new Promise((resolve) => { resolveExport = resolve; }));

    render(
      <MemoryRouter>
        <StudentsPage />
      </MemoryRouter>
    );

    const exportButton = await screen.findByRole('button', { name: 'Export CSV' });
    await waitFor(() => expect(exportButton).toBeEnabled());
    await userEvent.click(exportButton);
    expect(screen.getByRole('button', { name: 'Exporting...' })).toBeDisabled();
    resolveExport(response([], 0));
    await screen.findByText('No students to export.');
  });
});
