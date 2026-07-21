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
import { listTransport } from '../services/transport.api';
import { listAcademicYears, type AcademicYear } from '../services/academicYear.api';
import { listGrades, type Grade } from '../services/grade.api';
import { listClasses, type ClassItem } from '../services/class.api';
import { getSchoolSettings, type SchoolSettings } from '../services/schoolSettings.api';
import { getCurrencyFormatter } from '../utils/price';
import { formatDateForApi, formatDateForDisplay, formatDateForInput } from '../utils/date';
import { getLivePaymentSummary, getTuitionAmountForPlan } from '../utils/paymentForm';
import {
  createLegacyPaymentPayload,
  getPaymentEntrySections,
  getPaymentSummaryItems,
  type PaymentFeeEntry
} from '../utils/paymentFeeExtensions';
import PaymentReceipt, { type PrintableReceiptData } from '../components/receipts/PaymentReceipt';

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
  billingPeriod?: string;
  gracePeriodDays?: number;
  paymentLifecycleStatus?: 'paid' | 'due_soon' | 'grace_period' | 'overdue';
  paymentLifecycleStatusLabel?: string;
  feeEntries?: PaymentFeeEntry[];
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
  monthlyTuition?: number;
  academicYearId?: string;
  gradeId?: string;
  classId?: string;
}

interface PaymentFormValues {
  receiptNumber: string;
  studentId: string;
  studentName: string;
  englishName: string;
  khmerName: string;
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
  billingPeriod: string;
  remarks: string;
  feeEntries: PaymentFeeEntry[];
}

const today = formatDateForInput(new Date());
const monthKeyDefault = formatDateForInput(new Date()).slice(0, 7);

const money = (value: number) => Number(value.toFixed(2));

const buildFeeEntries = (tuitionAmount: number, existingEntries: PaymentFeeEntry[] = []) => {
  const sections = getPaymentEntrySections();

  return sections.map((section) => {
    const existingEntry = existingEntries.find((entry) => entry.type === section.key);
    const amount = section.key === 'tuition' ? money(tuitionAmount) : Number(existingEntry?.amount || 0);

    return {
      id: existingEntry?.id || `${section.key}-${Math.random().toString(36).slice(2, 8)}`,
      label: existingEntry?.label || section.label,
      amount,
      type: section.key,
      description: existingEntry?.description || section.description
    } satisfies PaymentFeeEntry;
  });
};

const emptyPaymentForm: PaymentFormValues = {
  receiptNumber: '',
  studentId: '',
  studentName: '',
  englishName: '',
  khmerName: '',
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
  billingPeriod: monthKeyDefault,
  remarks: '',
  feeEntries: buildFeeEntries(0)
};

const getAcademicYearId = (value?: AcademicYearRef) => (typeof value === 'string' ? value : value?._id || '');
const getGradeId = (value?: GradeRef) => (typeof value === 'string' ? value : value?._id || '');
const getClassId = (value?: ClassRef) => (typeof value === 'string' ? value : value?._id || '');

const calcRemaining = (tuitionAmount: number, discount: number, amount: number) => {
  const totalDue = Math.max(money(tuitionAmount) - money(discount), 0);
  return Math.max(money(totalDue - money(amount)), 0);
};

const splitFullName = (fullName: string) => {
  const trimmed = fullName?.trim() || '';
  if (!trimmed) return { englishName: '', khmerName: '' };

  const parts = trimmed.split(/\s*\/\s*/).map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { englishName: parts[0], khmerName: parts.slice(1).join(' / ') };
  }

  return { englishName: trimmed, khmerName: '' };
};

const planMultiplier = (plan: PaymentPlan | string) => {
  if (plan === 'quarterly') return 3;
  if (plan === 'yearly' || plan === 'annual') return 12;
  if (plan === 'semi-annual' || plan === 'semiannual') return 6;
  return 1;
};

const getPlanAdjustedTuitionAmount = (value: number, fromPlan: PaymentPlan | string, toPlan: PaymentPlan | string) => {
  const fromMultiplier = planMultiplier(fromPlan);
  const toMultiplier = planMultiplier(toPlan);
  if (!fromMultiplier || !toMultiplier) return money(value);
  const baseValue = money(value / fromMultiplier);
  return money(baseValue * toMultiplier);
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
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState('');
  const [selectedGradeId, setSelectedGradeId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<StudentLookupItem[]>([]);
  const [selectedTransport, setSelectedTransport] = useState<{ routeName?: string; monthlyFee?: number } | null>(null);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null);
  const [studentLookupSearch, setStudentLookupSearch] = useState('');
  const [studentLookupOpen, setStudentLookupOpen] = useState(false);

  const currencyFormatter = useMemo(
    () => getCurrencyFormatter(schoolSettings?.defaultCurrency || 'USD'),
    [schoolSettings?.defaultCurrency]
  );

  const [reportMonth, setReportMonth] = useState(monthKeyDefault);
  const [monthlySummary, setMonthlySummary] = useState<MonthlyPaymentSummary | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentRecord | null>(null);
  const [timelineStudentId, setTimelineStudentId] = useState('');
  const [monthlyDueDay, setMonthlyDueDay] = useState('1');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successPayment, setSuccessPayment] = useState<{ receiptNumber: string; paidAmount: number; remainingBalance: number } | null>(null);
  const [printableReceipt, setPrintableReceipt] = useState<PrintableReceiptData | null>(null);
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
        paymentMethod: (paymentMethodFilter || undefined) as PaymentMethod | undefined,
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
          billingPeriod: item.billingPeriod || '',
          gracePeriodDays: item.gracePeriodDays,
          feeEntries: item.feeEntries || [],
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
    return {
      ...next,
      feeEntries:
        next.feeEntries.length > 0
          ? next.feeEntries.map((entry) => {
              if (entry.type === 'tuition') return { ...entry, amount: money(next.tuitionAmount) };
              if (entry.type === 'transport') {
                const monthly = Number(selectedTransport?.monthlyFee || 0);
                const multiplier = planMultiplier(next.paymentPlan || next.paymentType || 'monthly');
                return { ...entry, amount: money(monthly * multiplier), label: selectedTransport?.routeName ? `Transport (${selectedTransport.routeName})` : entry.label, description: selectedTransport?.routeName || entry.description };
              }
              return entry;
            })
          : buildFeeEntries(next.tuitionAmount),
      remainingBalance: computed
    };
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

      if (key === 'paymentDate' && !prev.billingPeriod) {
        const fallbackBillingPeriod = typeof value === 'string' ? value : prev.paymentDate;
        const derivedBillingPeriod = formatDateForApi(fallbackBillingPeriod)?.slice(0, 7) || '';
        next.billingPeriod = derivedBillingPeriod;
      }

      if (key === 'paymentPlan') {
        next.paymentType = value as PaymentPlan;
        next.tuitionAmount = getPlanAdjustedTuitionAmount(prev.tuitionAmount, prev.paymentPlan || prev.paymentType || 'monthly', value as PaymentPlan);
      }

      if (key === 'paymentType') {
        next.paymentPlan = value as PaymentPlan;
        next.tuitionAmount = getPlanAdjustedTuitionAmount(prev.tuitionAmount, prev.paymentPlan || prev.paymentType || 'monthly', value as PaymentPlan);
      }

      if (key === 'tuitionAmount' || key === 'amount' || key === 'discount' || key === 'paymentType' || key === 'paymentPlan') {
        return recalculateRemainingBalance(next);
      }

      return next;
    });
  };

  const handleFeeEntryAmountChange = (feeType: PaymentFeeEntry['type'], value: number) => {
    setFormValues((prev) => {
      const nextEntries = prev.feeEntries.map((entry) => (entry.type === feeType ? { ...entry, amount: money(value) } : entry));
      const next = { ...prev, feeEntries: nextEntries } as PaymentFormValues;

      if (feeType === 'tuition') {
        return recalculateRemainingBalance({ ...next, tuitionAmount: value, amount: prev.amount });
      }

      return next;
    });
  };

  const applyStudentLookup = async (studentId: string) => {
    const selected = students.find((item) => item.studentId === studentId);
    if (!selected) return;

    const linkedClass = classes.find((item) => item._id === selected.classId);
    const linkedAcademicYear = academicYears.find((item) => item._id === selected.academicYearId);

    const { englishName, khmerName } = splitFullName(selected.fullName || '');

    setFormValues((prev) => {
      const nextTuitionAmount = editingId
        ? prev.tuitionAmount
        : money(getTuitionAmountForPlan(Number(selected.monthlyTuition || 0), prev.paymentPlan || prev.paymentType || 'monthly'));

      const next = {
        ...prev,
        studentId: selected.studentId,
        studentName: selected.fullName || prev.studentName,
        englishName,
        khmerName,
        className: linkedClass?.className || selected.className || prev.className,
        academicYearId: selected.academicYearId || prev.academicYearId,
        gradeId: selected.gradeId || prev.gradeId,
        classId: selected.classId || prev.classId,
        academicYear: linkedAcademicYear ? `${linkedAcademicYear.code} - ${linkedAcademicYear.name}` : prev.academicYear,
        tuitionAmount: nextTuitionAmount
      };
      return recalculateRemainingBalance(next);
    });

    // fetch transport record for selected student (use student._id as source of truth)
    try {
      const resp = await listTransport({ studentId: selected._id, perPage: 5 });
      const items = resp.data?.items || [];
      const transportRec = items.find((r: any) => r.status === 'active') || items[0] || null;
      const monthly = Number(transportRec?.monthlyFee || 0);
      const routeName = transportRec?.routeName || '';

      setSelectedTransport({ routeName, monthlyFee: monthly });

      // update feeEntries transport amount and label
      setFormValues((prev) => {
        const multiplier = planMultiplier(prev.paymentPlan || prev.paymentType || 'monthly');
        const nextEntries = prev.feeEntries.map((entry) => {
          if (entry.type === 'transport') {
            return { ...entry, amount: money(monthly * multiplier), label: routeName ? `Transport (${routeName})` : entry.label, description: routeName || entry.description };
          }
          if (entry.type === 'tuition') return { ...entry, amount: money(prev.tuitionAmount) };
          return entry;
        });

        return { ...prev, feeEntries: nextEntries, remainingBalance: calcRemaining(prev.tuitionAmount, prev.discount, prev.amount) } as PaymentFormValues;
      });
    } catch (err) {
      console.error('Unable to fetch transport record for student', err);
      setSelectedTransport(null);
    }

    setStudentLookupSearch(`${selected.studentId} - ${selected.fullName}`);
    setStudentLookupOpen(false);
  };

  const filteredStudents = useMemo(() => {
    const query = studentLookupSearch.trim().toLowerCase();
    if (!query) return students;

    return students.filter((student) => {
      const label = `${student.studentId} - ${student.fullName}`.toLowerCase();
      return label.includes(query);
    });
  }, [students, studentLookupSearch]);

  const handleAdd = () => {
    setEditingId(null);
    setSelectedReceipt(null);
    setFormValues({ ...emptyPaymentForm, feeEntries: buildFeeEntries(0) });
    setMessage('');
    setShowSuccessDialog(false);
    setSuccessPayment(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEdit = (payment: PaymentRecord) => {
    setEditingId(payment._id);
    setSelectedReceipt(null);
    const { englishName, khmerName } = splitFullName(payment.studentName || '');

    setFormValues({
      receiptNumber: payment.receiptNumber || '',
      studentId: payment.studentId,
      studentName: payment.studentName,
      englishName,
      khmerName,
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
      billingPeriod: payment.billingPeriod || '',
      remarks: payment.remarks || '',
      feeEntries: buildFeeEntries(Number(payment.tuitionAmount || 0), payment.feeEntries || [])
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toPayload = (): PaymentPayload => {
    const legacyPayload = createLegacyPaymentPayload({
      studentId: formValues.studentId.trim(),
      studentName: formValues.studentName.trim() || formValues.studentId.trim(),
      className: formValues.className.trim(),
      amount: money(formValues.amount),
      discount: money(formValues.discount),
      paymentDate: formatDateForApi(formValues.paymentDate) || formatDateForInput(formValues.paymentDate),
      paymentMethod: formValues.paymentMethod,
      remarks: formValues.remarks.trim() || undefined,
      paymentPlan: formValues.paymentPlan,
      status: formValues.status,
      feeEntries: formValues.feeEntries
    });

    return {
      ...legacyPayload,
      receiptNumber: formValues.receiptNumber || undefined,
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
      billingPeriod: formValues.billingPeriod.trim() || formatDateForApi(formValues.paymentDate)?.slice(0, 7) || monthKeyDefault,
      gracePeriodDays,
      cashier: formValues.cashier.trim() || undefined,
      paymentDate: formatDateForApi(formValues.paymentDate) || formatDateForInput(formValues.paymentDate),
      paymentMethod: formValues.paymentMethod,
      academicYear: formValues.academicYear.trim() || undefined,
      semester: formValues.semester,
      status: formValues.status,
      remarks: formValues.remarks.trim() || undefined,
      feeEntries: formValues.feeEntries
    };
  };

  const validateForm = () => {
    if (!formValues.studentId.trim()) return 'Student ID is required.';
    if (!formValues.studentName.trim() && !formValues.studentId.trim()) return 'Student name is required.';
    if (!formValues.paymentDate) return 'Payment date is required.';
    if (formValues.tuitionAmount < 0 || formValues.amount < 0 || formValues.discount < 0) return 'Amounts cannot be negative.';
    return '';
  };

  const livePaymentSummary = useMemo(() => {
    return getLivePaymentSummary(formValues.tuitionAmount, formValues.discount, formValues.amount, formValues.paymentPlan, formValues.paymentDate);
  }, [formValues.amount, formValues.discount, formValues.paymentDate, formValues.paymentPlan, formValues.tuitionAmount]);

  const feeSummaryItems = useMemo(
    () => getPaymentSummaryItems(formValues.tuitionAmount, formValues.discount, formValues.amount),
    [formValues.amount, formValues.discount, formValues.tuitionAmount]
  );

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
        const response = await createPayment(payload);
        const receiptNumber = response?.receiptNumber || payload.receiptNumber || 'N/A';
        setSuccessPayment({
          receiptNumber,
          paidAmount: Number(payload.amount || 0),
          remainingBalance: Number(payload.remainingBalance || 0)
        });
        setShowSuccessDialog(true);
        setMessage('Payment created successfully.');
      }

      setEditingId(null);
      setFormValues({ ...emptyPaymentForm, feeEntries: buildFeeEntries(0) });
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
    const source = selectedReceipt || (successPayment ? ({
      receiptNumber: successPayment.receiptNumber,
      paymentDate: formValues.paymentDate,
      studentId: formValues.studentId,
      studentName: formValues.studentName,
      khmerName: formValues.khmerName,
      englishName: formValues.englishName,
      gradeName: grades.find((item) => item._id === formValues.gradeId)?.code || '-',
      className: formValues.className || '-',
      paymentPlan: formValues.paymentPlan,
      tuitionAmount: formValues.tuitionAmount,
      discount: formValues.discount,
      amount: formValues.amount,
      remainingBalance: formValues.remainingBalance,
      paymentMethod: formValues.paymentMethod,
      cashier: formValues.cashier || user?.name || 'Cashier',
      academicYear: formValues.academicYear || '-',
      billingPeriod: formValues.billingPeriod || monthKeyDefault,
      feeEntries: formValues.feeEntries
    } as PrintableReceiptData) : null);

    if (!source) return;

    setPrintableReceipt(source);
    window.setTimeout(() => window.print(), 100);
  };

  const handleReceiptDownload = () => {
    if (!successPayment) return;

    const receiptText = [
      `Receipt ${successPayment.receiptNumber}`,
      `Paid Amount: ${currencyFormatter.format(successPayment.paidAmount)}`,
      `Remaining Balance: ${currencyFormatter.format(successPayment.remainingBalance)}`
    ].join('\n');

    const blob = new Blob([receiptText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt-${successPayment.receiptNumber}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage('Receipt summary downloaded for handoff.');
  };

  const handleReprintReceipt = (payment: PaymentRecord) => {
    setSelectedReceipt(payment);
    setMessage(`Receipt ${payment.receiptNumber} ready for reprint.`);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const handlePrintHistoryReceipt = (payment: PaymentRecord) => {
    const source: PrintableReceiptData = {
      receiptNumber: payment.receiptNumber,
      paymentDate: payment.paymentDate,
      studentId: payment.studentId,
      studentName: payment.studentName,
      khmerName: payment.studentName,
      englishName: payment.studentName,
      gradeName: getGradeLabel(payment),
      className: getClassLabel(payment),
      paymentPlan: payment.paymentPlan,
      tuitionAmount: Number(payment.tuitionAmount || 0),
      discount: Number(payment.discount || 0),
      amount: Number(payment.amount || 0),
      remainingBalance: Number(payment.remainingBalance || 0),
      paymentMethod: payment.paymentMethod,
      cashier: payment.cashier || user?.name || 'Cashier',
      academicYear: getAcademicYearLabel(payment),
      billingPeriod: payment.billingPeriod || '',
      feeEntries: payment.feeEntries || []
    };

    setPrintableReceipt(source);
    window.setTimeout(() => window.print(), 100);
  };

  const handleExportCsv = () => {
    const rows = filteredPayments.map((payment) => ({
      receiptNumber: payment.receiptNumber,
      student: `${payment.studentName} (${payment.studentId})`,
      paymentDate: formatDateForDisplay(payment.paymentDate),
      method: payment.paymentMethod.replace('_', ' '),
      totalPaid: Number(payment.amount || 0),
      remainingBalance: Number(payment.remainingBalance || 0),
      status: getBadgeLabel(payment)
    }));

    const header = ['Receipt Number', 'Student', 'Payment Date', 'Method', 'Total Paid', 'Remaining Balance', 'Status'];
    const csv = [header.join(','), ...rows.map((row) => [row.receiptNumber, row.student, row.paymentDate, row.method, row.totalPaid, row.remainingBalance, row.status].join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'payments-history.csv';
    link.click();
    URL.revokeObjectURL(url);
    setMessage('Payment history exported as CSV.');
  };

  const handleExportExcel = () => {
    const rows = filteredPayments.map((payment) => ({
      receiptNumber: payment.receiptNumber,
      student: `${payment.studentName} (${payment.studentId})`,
      paymentDate: formatDateForDisplay(payment.paymentDate),
      method: payment.paymentMethod.replace('_', ' '),
      totalPaid: Number(payment.amount || 0),
      remainingBalance: Number(payment.remainingBalance || 0),
      status: getBadgeLabel(payment)
    }));

    const worksheet = rows.map((row) => Object.values(row).join('\t')).join('\n');
    const blob = new Blob([worksheet], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'payments-history.xls';
    link.click();
    URL.revokeObjectURL(url);
    setMessage('Payment history exported as Excel-compatible spreadsheet.');
  };

  const handleHistoryPdfExport = () => {
    const pdfText = filteredPayments.map((payment) => `${payment.receiptNumber} | ${payment.studentName} | ${currencyFormatter.format(Number(payment.amount || 0))} | ${currencyFormatter.format(Number(payment.remainingBalance || 0))}`).join('\n');
    const blob = new Blob([pdfText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'payments-history.txt';
    link.click();
    URL.revokeObjectURL(url);
    setMessage('Payment history export prepared for PDF handoff.');
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

  const paymentStats = useMemo(() => {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayPayments = payments.filter((payment) => {
      const paymentDate = new Date(payment.paymentDate);
      return paymentDate >= startOfToday && paymentDate <= today;
    });

    const todaysCollection = todayPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const todaysTransactions = todayPayments.length;
    const outstandingBalance = payments.reduce((sum, payment) => sum + Number(payment.remainingBalance || 0), 0);
    const overdueStudents = new Set(overduePayments.map((payment) => payment.studentId)).size;

    return {
      todaysCollection,
      todaysTransactions,
      outstandingBalance,
      overdueStudents
    };
  }, [overduePayments, payments]);

  const filteredPayments = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : null;

    return payments.filter((payment) => {
      const paymentDate = new Date(payment.paymentDate);
      const student = students.find((item) => item.studentId === payment.studentId);
      const searchableText = [
        payment.receiptNumber,
        payment.studentName,
        payment.studentId,
        student?.phone,
        student?.guardianPhone
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (normalizedSearch && !searchableText.includes(normalizedSearch)) return false;
      if (from && paymentDate < from) return false;
      if (to) {
        const endOfDay = new Date(to);
        endOfDay.setHours(23, 59, 59, 999);
        if (paymentDate > endOfDay) return false;
      }
      if (paymentMethodFilter && payment.paymentMethod !== paymentMethodFilter) return false;
      if (statusFilter) {
        const computedStatus = getComputedPaymentStatus(payment);
        const matchesStatus = statusFilter === 'pending' ? payment.status === 'pending' : computedStatus === statusFilter;
        if (!matchesStatus) return false;
      }
      if (paymentPlanFilter && payment.paymentPlan !== paymentPlanFilter) return false;
      return true;
    });
  }, [dateFrom, dateTo, paymentMethodFilter, paymentPlanFilter, payments, searchTerm, statusFilter, students]);

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

        {printableReceipt && (
          <div className="hidden print:block">
            <PaymentReceipt
              payment={printableReceipt}
              schoolSettings={schoolSettings}
              currencyFormatter={currencyFormatter}
            />
          </div>
        )}

        {showSuccessDialog && successPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="payment-success-title">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                    Payment completed
                  </div>
                  <h3 id="payment-success-title" className="mt-3 text-2xl font-semibold text-slate-900">
                    Payment created successfully
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Receipt <span className="font-semibold text-slate-900">{successPayment.receiptNumber}</span> was saved for the student.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowSuccessDialog(false);
                    setSuccessPayment(null);
                  }}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Close
                </button>
              </div>

              <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="text-sm font-semibold text-emerald-800">Receipt Summary</div>
                <div className="mt-2 grid gap-2 text-sm text-emerald-900">
                  <div>Receipt Number: {successPayment.receiptNumber}</div>
                  <div>Paid Amount: {currencyFormatter.format(successPayment.paidAmount)}</div>
                  <div>Remaining Balance: {currencyFormatter.format(successPayment.remainingBalance)}</div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800"
                >
                  Print Receipt
                </button>
                <button
                  type="button"
                  onClick={handleReceiptDownload}
                  className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Download PDF
                </button>
                <button
                  type="button"
                  onClick={handleAdd}
                  className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
                >
                  New Payment
                </button>
              </div>
            </div>
          </div>
        )}

        {!showSuccessDialog && message && (
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
              aria-label="Start new payment form"
              className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              New Payment
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Student Information</h3>
                  <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700">
                    Read only
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <label className="space-y-1 text-sm md:col-span-2">
                    <span className="font-medium text-slate-700">Student Lookup</span>
                    <div className="relative">
                      <input
                        type="text"
                        value={studentLookupSearch}
                        onFocus={() => setStudentLookupOpen(true)}
                        onChange={(e) => {
                          const nextValue = e.target.value;
                          setStudentLookupSearch(nextValue);
                          setStudentLookupOpen(true);
                          if (!nextValue) {
                            handleFormChange('studentId', '');
                          }
                        }}
                        placeholder="Search student by ID or name"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                      />
                      {studentLookupOpen && filteredStudents.length > 0 && (
                        <div className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                          {filteredStudents.map((student) => (
                            <button
                              key={student._id}
                              type="button"
                              onClick={() => {
                                handleFormChange('studentId', student.studentId);
                                applyStudentLookup(student.studentId);
                              }}
                              className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-100"
                            >
                              {student.studentId} - {student.fullName}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </label>

                  <label className="space-y-1 text-sm">
                    <span className="font-medium text-slate-700">Student ID</span>
                    <input
                      type="text"
                      value={formValues.studentId}
                      onChange={(e) => handleFormChange('studentId', e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2"
                      required
                    />
                  </label>

                  <label className="space-y-1 text-sm">
                    <span className="font-medium text-slate-700">Student Name</span>
                    <input
                      type="text"
                      value={formValues.studentName || formValues.studentId || '-'}
                      readOnly
                      className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2"
                    />
                  </label>

                  <label className="space-y-1 text-sm">
                    <span className="font-medium text-slate-700">Khmer Name</span>
                    <input
                      type="text"
                      value={formValues.khmerName}
                      readOnly
                      className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2"
                    />
                  </label>

                  <label className="space-y-1 text-sm">
                    <span className="font-medium text-slate-700">Route</span>
                    <input
                      type="text"
                      value={selectedTransport?.routeName || '-'}
                      readOnly
                      className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2"
                    />
                  </label>

                  <label className="space-y-1 text-sm">
                    <span className="font-medium text-slate-700">Monthly Route Fee</span>
                    <input
                      type="text"
                      value={currencyFormatter.format(Number(selectedTransport?.monthlyFee || 0))}
                      readOnly
                      className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2"
                    />
                  </label>

                  <label className="space-y-1 text-sm">
                    <span className="font-medium text-slate-700">Transport Charge</span>
                    <input
                      type="text"
                      value={currencyFormatter.format(Number(selectedTransport?.monthlyFee || 0) * planMultiplier(formValues.paymentPlan))}
                      readOnly
                      className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2"
                    />
                  </label>

                  <label className="space-y-1 text-sm">
                    <span className="font-medium text-slate-700">English Name</span>
                    <input
                      type="text"
                      value={formValues.englishName}
                      readOnly
                      className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2"
                    />
                  </label>

                  <label className="space-y-1 text-sm">
                    <span className="font-medium text-slate-700">Grade</span>
                    <input
                      type="text"
                      value={grades.find((item) => item._id === formValues.gradeId) ? `${grades.find((item) => item._id === formValues.gradeId)?.code} - ${grades.find((item) => item._id === formValues.gradeId)?.name}` : '-'}
                      readOnly
                      className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2"
                    />
                  </label>

                  <label className="space-y-1 text-sm">
                    <span className="font-medium text-slate-700">Class</span>
                    <input
                      type="text"
                      value={formValues.className || '-'}
                      readOnly
                      className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2"
                    />
                  </label>

                  <label className="space-y-1 text-sm">
                    <span className="font-medium text-slate-700">Academic Year</span>
                    <input
                      type="text"
                      value={formValues.academicYear || '-'}
                      readOnly
                      className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2"
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
                      <option value="semi-annual">Semi-Annual</option>
                      <option value="yearly">Yearly</option>
                    </select>
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
                    />
                  </label>

                  <label className="space-y-1 text-sm">
                    <span className="font-medium text-slate-700">Outstanding Balance</span>
                    <input
                      type="text"
                      value={currencyFormatter.format(formValues.remainingBalance)}
                      readOnly
                      className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2"
                    />
                  </label>

                  <label className="space-y-1 text-sm">
                    <span className="font-medium text-slate-700">Next Due Date</span>
                    <input
                      type="text"
                      value={livePaymentSummary.nextDueDate || '-'}
                      readOnly
                      className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2"
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Receive Payment</h3>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    Fast entry
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
                    <span className="font-medium text-slate-700">Payment Plan</span>
                    <select
                      value={formValues.paymentPlan}
                      onChange={(e) => handleFormChange('paymentPlan', e.target.value as PaymentPlan)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="semi-annual">Semi-Annual</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </label>

                  <label className="space-y-1 text-sm">
                    <span className="font-medium text-slate-700">Billing Period</span>
                    <input
                      type="text"
                      value={formValues.billingPeriod}
                      onChange={(e) => handleFormChange('billingPeriod', e.target.value)}
                      placeholder="YYYY-MM"
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
                    <span className="font-medium text-slate-700">Reference Number</span>
                    <input
                      type="text"
                      value={formValues.receiptNumber}
                      onChange={(e) => handleFormChange('receiptNumber', e.target.value)}
                      placeholder="Optional"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </label>

                  <label className="space-y-1 text-sm md:col-span-2">
                    <span className="font-medium text-slate-700">Remarks</span>
                    <textarea
                      value={formValues.remarks}
                      onChange={(e) => handleFormChange('remarks', e.target.value)}
                      rows={2}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </label>
                </div>

                <div className="mt-4 rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-900">
                  <div className="font-semibold">Live Summary</div>
                  <div className="mt-2 grid gap-2 md:grid-cols-3">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-cyan-700">Net Amount</div>
                      <div className="mt-1 font-semibold">{currencyFormatter.format(livePaymentSummary.netAmount)}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-cyan-700">Remaining Balance</div>
                      <div className="mt-1 font-semibold">{currencyFormatter.format(livePaymentSummary.remainingBalance)}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-cyan-700">Status</div>
                      <div className={`mt-1 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${livePaymentSummary.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                        {livePaymentSummary.status === 'paid' ? 'Paid' : 'Pending'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold">Fee breakdown</div>
                      <div className="text-xs text-violet-700">Extension-ready for tuition, transport, books, registration, and more.</div>
                    </div>
                    <span className="rounded-full bg-violet-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-violet-700">
                      Future-ready
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 md:grid-cols-3">
                    {feeSummaryItems.map((item) => (
                      <div key={item.label} className="rounded-lg border border-violet-100 bg-white/70 p-3">
                        <div className="text-[11px] uppercase tracking-wide text-violet-700">{item.label}</div>
                        <div className="mt-1 font-semibold text-violet-900">{item.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {formValues.feeEntries.map((entry) => (
                      <label key={entry.id} className="space-y-1 rounded-lg border border-violet-200 bg-white p-3 text-sm text-violet-900">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold">{entry.label}</span>
                          <span className="text-[11px] uppercase tracking-wide text-violet-600">{entry.type}</span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={entry.amount}
                          onChange={(e) => handleFeeEntryAmountChange(entry.type, Number(e.target.value || 0))}
                          className="w-full rounded-lg border border-violet-200 px-3 py-2"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-900">
              <div className="font-semibold">Quick Cashier Summary</div>
              <div className="mt-1">Expected installment for current plan: {currencyFormatter.format(expectedInstallmentAmount)}</div>
              <div>Total due after discount: {currencyFormatter.format(formValues.tuitionAmount - formValues.discount)}</div>
              <div>Outstanding balance: {currencyFormatter.format(formValues.remainingBalance)}</div>
            </div>

            <div className="flex gap-3">
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
              <option value="semi-annual">Semi-Annual</option>
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
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Payment History</h2>
              <p className="text-sm text-slate-500">Search, filter, and manage payment records with a professional history view.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={handleExportCsv} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                Export CSV
              </button>
              <button type="button" onClick={handleExportExcel} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                Export Excel
              </button>
              <button type="button" onClick={handleHistoryPdfExport} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                Download PDF
              </button>
              <button onClick={handleAdd} className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800">
                + Add Payment
              </button>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl bg-emerald-50 p-4">
              <div className="text-xs uppercase tracking-wide text-emerald-700">Today's Collection</div>
              <div className="mt-2 text-2xl font-semibold text-emerald-900">{currencyFormatter.format(paymentStats.todaysCollection)}</div>
            </div>
            <div className="rounded-xl bg-sky-50 p-4">
              <div className="text-xs uppercase tracking-wide text-sky-700">Today's Transactions</div>
              <div className="mt-2 text-2xl font-semibold text-sky-900">{paymentStats.todaysTransactions}</div>
            </div>
            <div className="rounded-xl bg-amber-50 p-4">
              <div className="text-xs uppercase tracking-wide text-amber-700">Outstanding Balance</div>
              <div className="mt-2 text-2xl font-semibold text-amber-900">{currencyFormatter.format(paymentStats.outstandingBalance)}</div>
            </div>
            <div className="rounded-xl bg-rose-50 p-4">
              <div className="text-xs uppercase tracking-wide text-rose-700">Overdue Students</div>
              <div className="mt-2 text-2xl font-semibold text-rose-900">{paymentStats.overdueStudents}</div>
            </div>
          </div>

          <form className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6" onSubmit={handleSearch}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Receipt / Student / ID / Phone"
              className="rounded-lg border border-slate-300 px-3 py-2 xl:col-span-2"
            />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
            <select value={paymentMethodFilter} onChange={(e) => setPaymentMethodFilter(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2">
              <option value="">All Methods</option>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="check">Check</option>
              <option value="mobile_money">Mobile Money</option>
            </select>
            <button type="submit" className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
              Apply Filters
            </button>
          </form>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-3 py-2 text-left">Receipt Number</th>
                  <th className="px-3 py-2 text-left">Student</th>
                  <th className="px-3 py-2 text-left">Route</th>
                  <th className="px-3 py-2 text-left">Plan</th>
                  <th className="px-3 py-2 text-left">Billing</th>
                  <th className="px-3 py-2 text-left">Payment Date</th>
                  <th className="px-3 py-2 text-left">Method</th>
                  <th className="px-3 py-2 text-right">Total Paid</th>
                  <th className="px-3 py-2 text-right">Remaining Balance</th>
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
                ) : filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-6 text-center text-slate-500">
                      No payments found.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
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
                      <td className="px-3 py-2">{((payment.feeEntries || []).find(e => e.type === 'transport')?.description) || ((payment.feeEntries || []).find(e => e.type === 'transport')?.label) || '-'}</td>
                      <td className="px-3 py-2">{payment.paymentPlan || payment.paymentType || '-'}</td>
                      <td className="px-3 py-2">{payment.billingPeriod || '-'}</td>
                      <td className="px-3 py-2">{formatDateForDisplay(payment.paymentDate)}</td>
                      <td className="px-3 py-2 capitalize">{payment.paymentMethod.replace('_', ' ')}</td>
                      <td className="px-3 py-2 text-right font-semibold text-emerald-700">{currencyFormatter.format(Number(payment.amount || 0))}</td>
                      <td className="px-3 py-2 text-right font-semibold text-rose-700">{currencyFormatter.format(Number(payment.remainingBalance || 0))}</td>
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
                        <button onClick={() => handleReprintReceipt(payment)} className="mr-2 text-slate-700 hover:text-slate-900">
                          View Receipt
                        </button>
                        <button onClick={() => handlePrintHistoryReceipt(payment)} className="mr-2 text-cyan-700 hover:text-cyan-900">
                          Print Receipt
                        </button>
                        <button onClick={() => handleEdit(payment)} className="mr-2 text-amber-700 hover:text-amber-900">
                          Edit
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
                <div className="text-sm"><span className="font-semibold">Billing Period:</span> {selectedReceipt.billingPeriod || '-'}</div>
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
