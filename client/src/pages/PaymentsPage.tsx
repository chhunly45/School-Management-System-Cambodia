import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import {
  listPayments,
  createPayment,
  updatePayment,
  deletePayment,
  getMonthlyPaymentSummary,
  type PaymentPayload,
  type PaymentPlan,
  type PaymentMethod,
  type PaymentStatus,
  type MonthlyPaymentSummary
} from '../services/payment.api';
import { listStudents } from '../services/student.api';
import { listAcademicYears, type AcademicYear } from '../services/academicYear.api';
import { listGrades, type Grade } from '../services/grade.api';
import { listClasses, type ClassItem } from '../services/class.api';
import { getSchoolSettings, type SchoolSettings } from '../services/schoolSettings.api';
import { getCurrencyFormatter } from '../utils/price';
import { formatDateForApi, formatDateForDisplay, formatDateForInput } from '../utils/date';

type AcademicYearRef = string | { _id: string; code: string; name: string };
type GradeRef = string | { _id: string; code: string; name: string; level: number };
type ClassRef = string | { _id: string; className: string };

interface PaymentRecord {
  _id: string;
  receiptNumber: string;
  studentId: string;
  studentName: string;
  className: string;
  academicYearId?: AcademicYearRef;
  gradeId?: GradeRef;
  classId?: ClassRef;
  paymentType: PaymentPlan;
  paymentPlan: PaymentPlan;
  tuitionAmount: number;
  amount: number;
  discount: number;
  remainingBalance: number;
  dueDate?: string;
  monthlyDueDay?: number;
  quarterlyDueDates?: string[];
  yearlyDueDate?: string;
  gracePeriodDays?: number;
  paymentLifecycleStatus?: 'paid' | 'due_soon' | 'grace_period' | 'overdue';
  paymentLifecycleStatusLabel?: string;
  cashier?: string;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  academicYear: string;
  semester: 1 | 2;
  status: PaymentStatus;
  remarks: string;
}

interface StudentLookupItem {
  _id: string;
  studentId: string;
  fullName: string;
  phone?: string;
  guardianPhone?: string;
  className: string;
  academicYearId?: string;
  gradeId?: string;
  classId?: string;
}

interface PaymentFormValues {
  receiptNumber: string;
  studentId: string;
  studentName: string;
  className: string;
  academicYearId: string;
  gradeId: string;
  classId: string;
  paymentType: PaymentPlan;
  paymentPlan: PaymentPlan;
  tuitionAmount: number;
  amount: number;
  discount: number;
  remainingBalance: number;
  cashier: string;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  academicYear: string;
  semester: 1 | 2;
  status: PaymentStatus;
  remarks: string;
}

const today = formatDateForInput(new Date());
const monthKeyDefault = formatDateForInput(new Date()).slice(0, 7);

const emptyPaymentForm: PaymentFormValues = {
  receiptNumber: '',
  studentId: '',
  studentName: '',
  className: '',
  academicYearId: '',
  gradeId: '',
  classId: '',
  paymentType: 'monthly',
  paymentPlan: 'monthly',
  tuitionAmount: 0,
  amount: 0,
  discount: 0,
  remainingBalance: 0,
  cashier: '',
  paymentDate: today,
  paymentMethod: 'cash',
  academicYear: '',
  semester: 1,
  status: 'pending',
  remarks: ''
};

const getAcademicYearId = (value?: AcademicYearRef) => (typeof value === 'string' ? value : value?._id || '');
const getGradeId = (value?: GradeRef) => (typeof value === 'string' ? value : value?._id || '');
const getClassId = (value?: ClassRef) => (typeof value === 'string' ? value : value?._id || '');

const money = (value: number) => Number(value.toFixed(2));

const calcRemaining = (tuitionAmount: number, discount: number, amount: number) => {
  const totalDue = Math.max(money(tuitionAmount) - money(discount), 0);
  return Math.max(money(totalDue - money(amount)), 0);
};

const planMultiplier = (plan: PaymentPlan) => {
  if (plan === 'quarterly') return 3;
  if (plan === 'yearly') return 12;
  return 1;
};

const getComputedPaymentStatus = (payment: PaymentRecord): 'paid' | 'due_soon' | 'grace_period' | 'overdue' => {
  if (payment.paymentLifecycleStatus) return payment.paymentLifecycleStatus;
  if (payment.status === 'paid') return 'paid';
  if (payment.status === 'overdue') return 'overdue';
  return 'due_soon';
};

const PaymentsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [formValues, setFormValues] = useState<PaymentFormValues>(emptyPaymentForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentPlanFilter, setPaymentPlanFilter] = useState('');
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState('');
  const [selectedGradeId, setSelectedGradeId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');

  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<StudentLookupItem[]>([]);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null);

  const currencyFormatter = useMemo(
    () => getCurrencyFormatter(schoolSettings?.defaultCurrency || 'USD'),
    [schoolSettings?.defaultCurrency]
  );

  const [reportMonth, setReportMonth] = useState(monthKeyDefault);
  const [monthlySummary, setMonthlySummary] = useState<MonthlyPaymentSummary | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentRecord | null>(null);
  const [timelineStudentId, setTimelineStudentId] = useState('');
  const [monthlyDueDay, setMonthlyDueDay] = useState('1');
  const [quarterlyDueDates, setQuarterlyDueDates] = useState('01-15,04-15,07-15,10-15');
  const [yearlyDueDate, setYearlyDueDate] = useState('08-31');
  const [gracePeriodDays, setGracePeriodDays] = useState(7);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'admin') {
      setAccessDenied(true);
      return;
    }
    void Promise.all([loadLookups(), loadSchoolSettings(), loadPayments(), loadMonthlySummary()]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadLookups = async () => {
    try {
      const [yearsResp, gradesResp, classesResp, studentsResp] = await Promise.all([
        listAcademicYears({ perPage: 100 }),
        listGrades({ perPage: 100 }),
        listClasses({ perPage: 100 }),
        listStudents({ perPage: 300 })
      ]);

      setAcademicYears(yearsResp.data?.items || []);
      setGrades(gradesResp.data?.items || []);
      setClasses(classesResp.data?.items || []);
      setStudents(studentsResp.data?.items || []);
    } catch (err) {
      console.error(err);
      setMessage('Unable to load academic and student lookups.');
    }
  };

  const loadSchoolSettings = async () => {
    try {
      const response = await getSchoolSettings();
      const data = response.data || null;
      setSchoolSettings(data);
      if (data) {
        setMonthlyDueDay(String(data.monthlyDueDay || 1));
        setGracePeriodDays(Number(data.gracePeriodDays || 0));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadPayments = async () => {
    setLoading(true);
    try {
      const response = await listPayments({
        search: searchTerm || undefined,
        status: (statusFilter || undefined) as PaymentStatus | undefined,
        paymentPlan: (paymentPlanFilter || undefined) as PaymentPlan | undefined,
        academicYearId: selectedAcademicYearId || undefined,
        gradeId: selectedGradeId || undefined,
        classId: selectedClassId || undefined,
        includeRelations: true,
        perPage: 100
      });

      const items = response.data?.items || [];
      setPayments(
        items.map((item: any) => ({
          ...item,
          paymentType: item.paymentType || 'monthly',
          paymentPlan: item.paymentPlan || item.paymentType || 'monthly',
          tuitionAmount: Number(item.tuitionAmount || 0),
          amount: Number(item.amount || 0),
          discount: Number(item.discount || 0),
          remainingBalance:
            item.remainingBalance !== undefined
              ? Number(item.remainingBalance || 0)
              : calcRemaining(Number(item.tuitionAmount || item.amount || 0), Number(item.discount || 0), Number(item.amount || 0)),
          paymentDate: item.paymentDate ? formatDateForInput(item.paymentDate) : '',
          semester: item.semester || 1,
          academicYear: item.academicYear || '',
          dueDate: item.dueDate ? formatDateForInput(item.dueDate) : undefined,
          monthlyDueDay: item.monthlyDueDay,
          quarterlyDueDates: item.quarterlyDueDates,
          yearlyDueDate: item.yearlyDueDate,
          gracePeriodDays: item.gracePeriodDays,
          paymentLifecycleStatus: item.paymentLifecycleStatus,
          paymentLifecycleStatusLabel: item.paymentLifecycleStatusLabel
        }))
      );
    } catch (err) {
      console.error(err);
      setMessage('Unable to load payments.');
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlySummary = async () => {
    try {
      const [year, month] = reportMonth.split('-').map(Number);
      const response = await getMonthlyPaymentSummary({
        year,
        month,
        academicYearId: selectedAcademicYearId || undefined,
        gradeId: selectedGradeId || undefined,
        classId: selectedClassId || undefined
      });
      setMonthlySummary(response.data || null);
    } catch (err) {
      console.error(err);
      setMessage('Unable to load monthly payment summary.');
    }
  };

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await Promise.all([loadPayments(), loadMonthlySummary()]);
  };

  const recalculateRemainingBalance = (next: PaymentFormValues) => {
    const computed = calcRemaining(next.tuitionAmount, next.discount, next.amount);
    return { ...next, remainingBalance: computed };
  };

  const getBadgeLabel = (payment: PaymentRecord) => {
    if (payment.paymentLifecycleStatusLabel) return payment.paymentLifecycleStatusLabel;
    const status = getComputedPaymentStatus(payment);
    if (status === 'paid') return 'Paid';
    if (status === 'grace_period') return 'Grace Period';
    if (status === 'due_soon') return 'Due Soon';
    return 'Overdue';
  };

  const handleFormChange = (key: keyof PaymentFormValues, value: string | number) => {
    setFormValues((prev) => {
      const next = { ...prev, [key]: value } as PaymentFormValues;

      if (key === 'paymentPlan') {
        next.paymentType = value as PaymentPlan;
      }

      if (key === 'paymentType') {
        next.paymentPlan = value as PaymentPlan;
      }

      if (key === 'tuitionAmount' || key === 'amount' || key === 'discount' || key === 'paymentType' || key === 'paymentPlan') {
        return recalculateRemainingBalance(next);
      }

      return next;
    });
  };

  const applyStudentLookup = (studentId: string) => {
    const selected = students.find((item) => item.studentId === studentId);
    if (!selected) return;

    const linkedClass = classes.find((item) => item._id === selected.classId);
    const linkedAcademicYear = academicYears.find((item) => item._id === selected.academicYearId);

    setFormValues((prev) => {
      const next = {
        ...prev,
        studentId: selected.studentId,
        studentName: selected.fullName || prev.studentName,
        className: linkedClass?.className || selected.className || prev.className,
        academicYearId: selected.academicYearId || prev.academicYearId,
        gradeId: selected.gradeId || prev.gradeId,
        classId: selected.classId || prev.classId,
        academicYear: linkedAcademicYear ? `${linkedAcademicYear.code} - ${linkedAcademicYear.name}` : prev.academicYear
      };
      return recalculateRemainingBalance(next);
    });
  };

  const handleAdd = () => {
    setEditingId(null);
    setSelectedReceipt(null);
    setFormValues(emptyPaymentForm);
    setMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEdit = (payment: PaymentRecord) => {
    setEditingId(payment._id);
    setSelectedReceipt(null);
    setFormValues({
      receiptNumber: payment.receiptNumber || '',
      studentId: payment.studentId,
      studentName: payment.studentName,
      className: payment.className,
      academicYearId: getAcademicYearId(payment.academicYearId),
      gradeId: getGradeId(payment.gradeId),
      classId: getClassId(payment.classId),
      paymentType: payment.paymentType || payment.paymentPlan || 'monthly',
      paymentPlan: payment.paymentPlan || payment.paymentType || 'monthly',
      tuitionAmount: Number(payment.tuitionAmount || 0),
      amount: Number(payment.amount || 0),
      discount: Number(payment.discount || 0),
      remainingBalance: Number(payment.remainingBalance || 0),
      cashier: payment.cashier || '',
      paymentDate: payment.paymentDate,
      paymentMethod: payment.paymentMethod,
      academicYear: payment.academicYear || '',
      semester: payment.semester || 1,
      status: payment.status,
      remarks: payment.remarks || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toPayload = (): PaymentPayload => ({
    receiptNumber: formValues.receiptNumber || undefined,
    studentId: formValues.studentId.trim(),
    studentName: formValues.studentName.trim(),
    className: formValues.className.trim(),
    academicYearId: formValues.academicYearId || undefined,
    gradeId: formValues.gradeId || undefined,
    classId: formValues.classId || undefined,
    paymentType: formValues.paymentType,
    paymentPlan: formValues.paymentPlan,
    tuitionAmount: money(formValues.tuitionAmount),
    amount: money(formValues.amount),
    discount: money(formValues.discount),
    remainingBalance: money(formValues.remainingBalance),
    monthlyDueDay: Number(monthlyDueDay || 1),
    quarterlyDueDates: quarterlyDueDates.split(',').map((item) => item.trim()).filter(Boolean),
    yearlyDueDate: yearlyDueDate.trim() || undefined,
    gracePeriodDays,
    cashier: formValues.cashier.trim() || undefined,
    paymentDate: formatDateForApi(formValues.paymentDate) || formatDateForInput(formValues.paymentDate),
    paymentMethod: formValues.paymentMethod,
    academicYear: formValues.academicYear.trim() || undefined,
    semester: formValues.semester,
    status: formValues.status,
    remarks: formValues.remarks.trim() || undefined
  });

  const validateForm = () => {
    if (!formValues.studentId.trim()) return 'Student ID is required.';
    if (!formValues.studentName.trim()) return 'Student name is required.';
    if (!formValues.className.trim() && !formValues.classId) return 'Class is required.';
    if (!formValues.paymentDate) return 'Payment date is required.';
    if (formValues.tuitionAmount < 0 || formValues.amount < 0 || formValues.discount < 0) return 'Amounts cannot be negative.';
    return '';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const validationError = validateForm();
    if (validationError) {
      setLoading(false);
      setMessage(validationError);
      return;
    }

    try {
      const payload = toPayload();
      if (editingId) {
        await updatePayment(editingId, payload);
        setMessage('Payment updated successfully.');
      } else {
        await createPayment(payload);
        setMessage('Payment created successfully.');
      }

      setEditingId(null);
      setFormValues(emptyPaymentForm);
      await Promise.all([loadPayments(), loadMonthlySummary()]);
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Error saving payment. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this payment?')) return;

    setLoading(true);
    setMessage('');
    try {
      await deletePayment(id);
      setMessage('Payment deleted successfully.');
      if (selectedReceipt?._id === id) {
        setSelectedReceipt(null);
      }
      await Promise.all([loadPayments(), loadMonthlySummary()]);
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Error deleting payment. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getAcademicYearLabel = (payment: PaymentRecord) => {
    if (typeof payment.academicYearId !== 'string' && payment.academicYearId) {
      return `${payment.academicYearId.code} - ${payment.academicYearId.name}`;
    }
    const selected = academicYears.find((item) => item._id === getAcademicYearId(payment.academicYearId));
    return selected ? `${selected.code} - ${selected.name}` : payment.academicYear || '-';
  };

  const getGradeLabel = (payment: PaymentRecord) => {
    if (typeof payment.gradeId !== 'string' && payment.gradeId) {
      return `${payment.gradeId.code} - ${payment.gradeId.name}`;
    }
    const selected = grades.find((item) => item._id === getGradeId(payment.gradeId));
    return selected ? `${selected.code} - ${selected.name}` : '-';
  };

  const getClassLabel = (payment: PaymentRecord) => {
    if (typeof payment.classId !== 'string' && payment.classId) {
      return payment.classId.className;
    }
    const selected = classes.find((item) => item._id === getClassId(payment.classId));
    return selected?.className || payment.className || '-';
  };

  const expectedInstallmentAmount = useMemo(() => {
    const multiplier = planMultiplier(formValues.paymentPlan);
    return money(formValues.tuitionAmount / multiplier);
  }, [formValues.paymentPlan, formValues.tuitionAmount]);

  const handlePrintReceipt = () => {
    if (!selectedReceipt) return;
    window.print();
  };

  const handleReprintReceipt = (payment: PaymentRecord) => {
    setSelectedReceipt(payment);
    setMessage(`Receipt ${payment.receiptNumber} ready for reprint.`);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const getStudentContact = (studentId: string) => students.find((item) => item.studentId === studentId);

  const getParentPhone = (studentId: string) => {
    const student = getStudentContact(studentId);
    return student?.guardianPhone || student?.phone || '';
  };

  const callParentPhone = (studentId: string) => {
    const phone = getParentPhone(studentId);
    if (!phone) {
      setMessage('Parent phone is not available for this student.');
      return;
    }
    window.location.href = `tel:${phone}`;
  };

  const copyParentPhone = async (studentId: string) => {
    const phone = getParentPhone(studentId);
    if (!phone) {
      setMessage('Parent phone is not available for this student.');
      return;
    }

    try {
      await navigator.clipboard.writeText(phone);
      setMessage(`Parent phone copied: ${phone}`);
    } catch (err) {
      console.error(err);
      setMessage('Unable to copy parent phone from browser clipboard.');
    }
  };

  const overduePayments = useMemo(
    () =>
      payments.filter((payment) => {
        const computedStatus = getComputedPaymentStatus(payment);
        return computedStatus === 'overdue';
      }),
    [payments]
  );

  const timelinePayments = useMemo(() => {
    if (!timelineStudentId) return [];
    return payments
      .filter((item) => item.studentId === timelineStudentId)
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  }, [payments, timelineStudentId]);

  if (accessDenied) {
    return <div className="p-8 text-center text-red-500">Access Denied. Admin only.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl bg-gradient-to-r from-sky-700 via-cyan-700 to-emerald-700 p-6 text-white shadow-xl">
          <h1 className="text-3xl font-bold">Tuition and Payment Management</h1>
          <p className="mt-1 text-sm text-cyan-50">Manage tuition plans, payment records, outstanding balances, and receipts in one place.</p>
        </div>

        {message && (
          <div className={`rounded-xl p-4 ${message.toLowerCase().includes('error') || message.toLowerCase().includes('unable') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {message}
          </div>
        )}

        <section className="rounded-2xl bg-white p-6 shadow">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Payment Entry</h2>
            <button
              type="button"
              onClick={handleAdd}
              className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              New Payment
            </button>
          </div>

          <form onSubmit={handleSave} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Student Lookup</span>
              <select
                value={formValues.studentId}
                onChange={(e) => {
                  handleFormChange('studentId', e.target.value);
                  applyStudentLookup(e.target.value);
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="">Select student by ID</option>
                {students.map((student) => (
                  <option key={student._id} value={student.studentId}>
                    {student.studentId} - {student.fullName}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Receipt Number</span>
              <input
                type="text"
                value={formValues.receiptNumber}
                onChange={(e) => handleFormChange('receiptNumber', e.target.value)}
                placeholder="Leave blank for auto generation"
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Student Name</span>
              <input
                type="text"
                value={formValues.studentName}
                onChange={(e) => handleFormChange('studentName', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                required
              />
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Class Name</span>
              <input
                type="text"
                value={formValues.className}
                onChange={(e) => handleFormChange('className', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                required
              />
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Academic Year</span>
              <select
                value={formValues.academicYearId}
                onChange={(e) => handleFormChange('academicYearId', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="">Select academic year</option>
                {academicYears.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.code} - {item.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Grade</span>
              <select
                value={formValues.gradeId}
                onChange={(e) => handleFormChange('gradeId', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="">Select grade</option>
                {grades.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.code} - {item.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Class</span>
              <select
                value={formValues.classId}
                onChange={(e) => handleFormChange('classId', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="">Select class</option>
                {classes.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.className}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Academic Year (Legacy)</span>
              <input
                type="text"
                value={formValues.academicYear}
                onChange={(e) => handleFormChange('academicYear', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="e.g., 2025-2026"
              />
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Payment Plan</span>
              <select
                value={formValues.paymentPlan}
                onChange={(e) => handleFormChange('paymentPlan', e.target.value as PaymentPlan)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Monthly Due Day</span>
              <input
                type="number"
                min="1"
                max="31"
                value={monthlyDueDay}
                onChange={(e) => setMonthlyDueDay(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Quarterly Due Dates</span>
              <input
                type="text"
                value={quarterlyDueDates}
                onChange={(e) => setQuarterlyDueDates(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="MM-DD,MM-DD,MM-DD"
              />
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Yearly Due Date</span>
              <input
                type="text"
                value={yearlyDueDate}
                onChange={(e) => setYearlyDueDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="MM-DD"
              />
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Grace Period Days</span>
              <input
                type="number"
                min="0"
                max="365"
                value={gracePeriodDays}
                onChange={(e) => setGracePeriodDays(Number(e.target.value || 0))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Tuition Amount</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formValues.tuitionAmount}
                onChange={(e) => handleFormChange('tuitionAmount', Number(e.target.value || 0))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                required
              />
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Discount</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formValues.discount}
                onChange={(e) => handleFormChange('discount', Number(e.target.value || 0))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Paid Amount</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formValues.amount}
                onChange={(e) => handleFormChange('amount', Number(e.target.value || 0))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                required
              />
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Remaining Balance</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formValues.remainingBalance}
                onChange={(e) => handleFormChange('remainingBalance', Number(e.target.value || 0))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Payment Date</span>
              <input
                type="date"
                value={formValues.paymentDate}
                onChange={(e) => handleFormChange('paymentDate', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                required
              />
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Payment Method</span>
              <select
                value={formValues.paymentMethod}
                onChange={(e) => handleFormChange('paymentMethod', e.target.value as PaymentMethod)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="check">Check</option>
                <option value="mobile_money">Mobile Money</option>
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Status</span>
              <select
                value={formValues.status}
                onChange={(e) => handleFormChange('status', e.target.value as PaymentStatus)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Cashier</span>
              <input
                type="text"
                value={formValues.cashier}
                onChange={(e) => handleFormChange('cashier', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="Cashier name"
              />
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Semester</span>
              <select
                value={formValues.semester}
                onChange={(e) => handleFormChange('semester', Number(e.target.value) as 1 | 2)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
              </select>
            </label>

            <label className="space-y-1 text-sm md:col-span-2 xl:col-span-4">
              <span className="font-medium text-slate-700">Remarks</span>
              <textarea
                value={formValues.remarks}
                onChange={(e) => handleFormChange('remarks', e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-900 md:col-span-2 xl:col-span-4">
              <div className="font-semibold">Payment Plan Preview</div>
              <div className="mt-1">Expected installment for current plan: {currencyFormatter.format(expectedInstallmentAmount)}</div>
              <div>Total due after discount: {currencyFormatter.format(formValues.tuitionAmount - formValues.discount)}</div>
              <div>Outstanding balance: {currencyFormatter.format(formValues.remainingBalance)}</div>
            </div>

            <div className="flex gap-3 md:col-span-2 xl:col-span-4">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-cyan-700 px-5 py-2 font-semibold text-white hover:bg-cyan-800 disabled:bg-slate-400"
              >
                {loading ? 'Saving...' : editingId ? 'Update Payment' : 'Create Payment'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={handleAdd}
                  className="rounded-lg bg-slate-500 px-5 py-2 font-semibold text-white hover:bg-slate-600"
                >
                  Clear
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">Search and Filters</h2>
          <form onSubmit={handleSearch} className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search receipt, student ID, name"
              className="rounded-lg border border-slate-300 px-3 py-2 xl:col-span-2"
            />

            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2">
              <option value="">All status</option>
              <option value="paid">Paid</option>
              <option value="due_soon">Due Soon</option>
              <option value="grace_period">Grace Period</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>

            <select
              value={paymentPlanFilter}
              onChange={(e) => setPaymentPlanFilter(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">All plans</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>

            <select
              value={selectedAcademicYearId}
              onChange={(e) => setSelectedAcademicYearId(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">All academic years</option>
              {academicYears.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.code}
                </option>
              ))}
            </select>

            <button type="submit" className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white hover:bg-emerald-800">
              Apply
            </button>

            <select
              value={timelineStudentId}
              onChange={(e) => setTimelineStudentId(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">Timeline: select student</option>
              {students.map((student) => (
                <option key={student._id} value={student.studentId}>
                  {student.studentId} - {student.fullName}
                </option>
              ))}
            </select>
          </form>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Overdue Tuition List</h2>
            <div className="text-sm text-slate-500">{overduePayments.length} overdue records</div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-rose-50 text-rose-900">
                <tr>
                  <th className="px-3 py-2 text-left">Student</th>
                  <th className="px-3 py-2 text-left">Class</th>
                  <th className="px-3 py-2 text-left">Due Date</th>
                  <th className="px-3 py-2 text-right">Remaining</th>
                  <th className="px-3 py-2 text-center">Parent Phone</th>
                </tr>
              </thead>
              <tbody>
                {overduePayments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                      No overdue tuition records.
                    </td>
                  </tr>
                ) : (
                  overduePayments.map((payment) => (
                    <tr key={`overdue-${payment._id}`} className="border-b border-slate-100">
                      <td className="px-3 py-2">
                        <div className="font-medium text-slate-900">{payment.studentName}</div>
                        <div className="text-xs text-slate-500">{payment.studentId}</div>
                      </td>
                      <td className="px-3 py-2">{getClassLabel(payment)}</td>
                      <td className="px-3 py-2">{formatDateForDisplay(payment.dueDate || payment.paymentDate)}</td>
                      <td className="px-3 py-2 text-right font-semibold text-rose-700">{currencyFormatter.format(Number(payment.remainingBalance || 0))}</td>
                      <td className="px-3 py-2 text-center">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => callParentPhone(payment.studentId)}
                            className="rounded bg-sky-100 px-2 py-1 text-xs font-medium text-sky-800 hover:bg-sky-200"
                          >
                            Call
                          </button>
                          <button
                            type="button"
                            onClick={() => void copyParentPhone(payment.studentId)}
                            className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-800 hover:bg-slate-200"
                          >
                            Copy
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">Payment History Timeline Per Student</h2>

          {!timelineStudentId ? (
            <p className="text-sm text-slate-500">Select a student from the Timeline filter to view chronological payment events.</p>
          ) : timelinePayments.length === 0 ? (
            <p className="text-sm text-slate-500">No payment events found for selected student.</p>
          ) : (
            <div className="space-y-3">
              {timelinePayments.map((payment) => {
                const computedStatus = getComputedPaymentStatus(payment);
                return (
                  <div key={`timeline-${payment._id}`} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-slate-900">
                        {formatDateForDisplay(payment.paymentDate)} • {payment.receiptNumber}
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          computedStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-700'
                            : computedStatus === 'due_soon'
                            ? 'bg-sky-100 text-sky-700'
                            : computedStatus === 'grace_period'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {getBadgeLabel(payment)}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-1 gap-2 text-sm text-slate-700 md:grid-cols-4">
                      <div>Plan: {payment.paymentPlan}</div>
                      <div>Paid: {currencyFormatter.format(Number(payment.amount || 0))}</div>
                      <div>Remaining: {currencyFormatter.format(Number(payment.remainingBalance || 0))}</div>
                      <div>Method: {payment.paymentMethod.replace('_', ' ')}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-white p-6 shadow">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Monthly Summary</h2>
            <div className="flex items-center gap-2">
              <input
                type="month"
                value={reportMonth}
                onChange={(e) => setReportMonth(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2"
              />
              <button type="button" onClick={loadMonthlySummary} className="rounded-lg bg-sky-700 px-4 py-2 text-white hover:bg-sky-800">
                Refresh
              </button>
            </div>
          </div>

          {monthlySummary ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="rounded-xl bg-slate-100 p-4">
                <div className="text-xs uppercase text-slate-500">Records</div>
                <div className="mt-1 text-2xl font-bold text-slate-900">{monthlySummary.totals.totalRecords}</div>
              </div>
              <div className="rounded-xl bg-emerald-50 p-4">
                <div className="text-xs uppercase text-emerald-700">Total Paid</div>
                <div className="mt-1 text-2xl font-bold text-emerald-800">{currencyFormatter.format(Number(monthlySummary.totals.totalPaid || 0))}</div>
              </div>
              <div className="rounded-xl bg-amber-50 p-4">
                <div className="text-xs uppercase text-amber-700">Total Discount</div>
                <div className="mt-1 text-2xl font-bold text-amber-800">{currencyFormatter.format(Number(monthlySummary.totals.totalDiscount || 0))}</div>
              </div>
              <div className="rounded-xl bg-rose-50 p-4">
                <div className="text-xs uppercase text-rose-700">Outstanding</div>
                <div className="mt-1 text-2xl font-bold text-rose-800">{currencyFormatter.format(Number(monthlySummary.totals.totalRemainingBalance || 0))}</div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-600">No summary data for the selected period.</p>
          )}
        </section>

        <section className="rounded-2xl bg-white p-6 shadow">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Payment History</h2>
            <button onClick={handleAdd} className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800">
              + Add Payment
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-3 py-2 text-left">Receipt</th>
                  <th className="px-3 py-2 text-left">Student</th>
                  <th className="px-3 py-2 text-left">Class</th>
                  <th className="px-3 py-2 text-left">Plan</th>
                  <th className="px-3 py-2 text-right">Tuition</th>
                  <th className="px-3 py-2 text-right">Paid</th>
                  <th className="px-3 py-2 text-right">Balance</th>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-6 text-center text-slate-500">
                      Loading...
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-6 text-center text-slate-500">
                      No payments found.
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment._id} className="border-b border-slate-100">
                      {(() => {
                        const computedStatus = getComputedPaymentStatus(payment);
                        return (
                          <>
                      <td className="px-3 py-2 font-mono text-xs">{payment.receiptNumber}</td>
                      <td className="px-3 py-2">
                        <div className="font-medium text-slate-900">{payment.studentName}</div>
                        <div className="text-xs text-slate-500">{payment.studentId}</div>
                        <div className="mt-1 inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => callParentPhone(payment.studentId)}
                            className="rounded bg-sky-100 px-2 py-1 text-[11px] font-medium text-sky-800 hover:bg-sky-200"
                          >
                            Call Parent
                          </button>
                          <button
                            type="button"
                            onClick={() => void copyParentPhone(payment.studentId)}
                            className="rounded bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-800 hover:bg-slate-200"
                          >
                            Copy Phone
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div>{getClassLabel(payment)}</div>
                        <div className="text-xs text-slate-500">{getGradeLabel(payment)}</div>
                        <div className="text-xs text-slate-500">{getAcademicYearLabel(payment)}</div>
                      </td>
                      <td className="px-3 py-2 capitalize">{payment.paymentPlan}</td>
                      <td className="px-3 py-2 text-right">{currencyFormatter.format(Number(payment.tuitionAmount || 0))}</td>
                      <td className="px-3 py-2 text-right font-semibold text-emerald-700">{currencyFormatter.format(Number(payment.amount || 0))}</td>
                      <td className="px-3 py-2 text-right font-semibold text-rose-700">{currencyFormatter.format(Number(payment.remainingBalance || 0))}</td>
                      <td className="px-3 py-2">{formatDateForDisplay(payment.paymentDate)}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            computedStatus === 'paid'
                              ? 'bg-emerald-100 text-emerald-700'
                              : computedStatus === 'due_soon'
                              ? 'bg-sky-100 text-sky-700'
                              : computedStatus === 'grace_period'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {getBadgeLabel(payment)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button onClick={() => handleEdit(payment)} className="mr-2 text-cyan-700 hover:text-cyan-900">
                          Edit
                        </button>
                        <button onClick={() => handleReprintReceipt(payment)} className="mr-2 text-slate-700 hover:text-slate-900">
                          Reprint
                        </button>
                        <button onClick={() => handleDelete(payment._id)} className="text-rose-700 hover:text-rose-900">
                          Delete
                        </button>
                      </td>
                          </>
                        );
                      })()}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {selectedReceipt && (
          <section className="rounded-2xl border-2 border-dashed border-cyan-300 bg-white p-6 shadow">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Receipt Preview</h2>
                <p className="text-sm text-slate-500">For print and student handover.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={handlePrintReceipt} className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800">
                  Print Receipt
                </button>
                <button onClick={() => setSelectedReceipt(null)} className="rounded-lg bg-slate-500 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-600">
                  Close
                </button>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="md:col-span-2 space-y-2">
                <div className="text-sm">
                  <span className="font-semibold">School:</span> {schoolSettings?.schoolName || 'School Settings'}
                </div>
                <div className="text-sm">
                  <span className="font-semibold">School Logo:</span>{' '}
                  {schoolSettings?.logo ? <span className="text-slate-600">Configured</span> : '[No logo configured]'}
                </div>
                <div className="text-sm"><span className="font-semibold">Receipt No:</span> {selectedReceipt.receiptNumber}</div>
                <div className="text-sm"><span className="font-semibold">Student:</span> {selectedReceipt.studentName} ({selectedReceipt.studentId})</div>
                <div className="text-sm"><span className="font-semibold">Class:</span> {getClassLabel(selectedReceipt)}</div>
                <div className="text-sm"><span className="font-semibold">Academic:</span> {getAcademicYearLabel(selectedReceipt)}</div>
                <div className="text-sm"><span className="font-semibold">Plan:</span> {selectedReceipt.paymentPlan}</div>
                <div className="text-sm"><span className="font-semibold">Paid:</span> {currencyFormatter.format(Number(selectedReceipt.amount))}</div>
                <div className="text-sm"><span className="font-semibold">Remaining:</span> {currencyFormatter.format(Number(selectedReceipt.remainingBalance))}</div>
                <div className="text-sm"><span className="font-semibold">Cashier:</span> {selectedReceipt.cashier || '-'}</div>
                <div className="text-sm"><span className="font-semibold">Date:</span> {formatDateForDisplay(selectedReceipt.paymentDate)}</div>
                <div className="text-sm"><span className="font-semibold">Remarks:</span> {selectedReceipt.remarks || '-'}</div>
                <div className="text-sm"><span className="font-semibold">Footer:</span> {schoolSettings?.footerText || '-'}</div>
                <div className="text-sm"><span className="font-semibold">Principal:</span> {schoolSettings?.principalName || '-'}</div>
              </div>
              <div className="rounded-xl border border-slate-300 p-4 text-center">
                <div className="text-xs uppercase tracking-wider text-slate-500">{schoolSettings?.qrCodeEnabled ? 'QR Enabled' : 'QR Disabled'}</div>
                <div className="mt-4 rounded-lg border border-dashed border-slate-400 p-8 text-xs text-slate-500">
                  {schoolSettings?.qrCodeEnabled ? '[RECEIPT-QR]' : 'QR code disabled in school settings'}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default PaymentsPage;
