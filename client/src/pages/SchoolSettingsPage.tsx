import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import DeleteConfirmationModal from '../components/common/DeleteConfirmationModal';
import { listAcademicYears, type AcademicYear } from '../services/academicYear.api';
import {
  createSchoolSettings,
  deleteSchoolSettings,
  getSchoolSettings,
  updateSchoolSettings,
  type SchoolSettings,
  type SchoolSettingsPayload
} from '../services/schoolSettings.api';

type FieldKey = keyof SchoolSettingsPayload;

type SettingsErrors = Partial<Record<FieldKey | 'supportedCurrencies', string>>;

const defaultSettings: SchoolSettingsPayload = {
  schoolName: '',
  logo: '',
  address: '',
  phone: '',
  email: '',
  currentAcademicYearId: null,
  defaultCurrency: 'USD',
  supportedCurrencies: ['USD', 'KHR'],
  exchangeRateUsdToKhr: 0,
  receiptPrefix: 'RCPT',
  nextReceiptNumber: 1,
  monthlyDueDay: 1,
  gracePeriodDays: 0,
  employeeRoles: ['teacher', 'driver', 'staff'],
  footerText: '',
  principalName: '',
  qrCodeEnabled: true,
  attendanceEnabled: true,
  attendanceQrEnabled: true,
  attendanceGpsEnabled: true,
  attendanceSchoolLatitude: null,
  attendanceSchoolLongitude: null,
  attendanceAllowedRadius: 100,
  morningCheckInStart: null,
  morningCheckInEnd: null,
  afternoonCheckInStart: null,
  afternoonCheckInEnd: null,
  eveningCheckInStart: null,
  eveningCheckInEnd: null,
  attendanceStart: '06:00',
  attendanceEnd: '18:00'
};

const currencyOptions: Array<'USD' | 'KHR'> = ['USD', 'KHR'];

const SchoolSettingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<SchoolSettingsPayload>(defaultSettings);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<SettingsErrors>({});
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [logoPreview, setLogoPreview] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'admin') {
      navigate('/admin');
      return;
    }

    void Promise.all([loadAcademicYears(), loadSettings()]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadAcademicYears = async () => {
    try {
      const response = await listAcademicYears({ perPage: 100 });
      setAcademicYears(response.data?.items || []);
    } catch (error) {
      console.error(error);
    }
  };

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await getSchoolSettings();
      const data = response.data || defaultSettings;
      setSettings(response.data || null);
      setSettingsId(response.data?._id || null);
      const nextValues: SchoolSettingsPayload = {
        schoolName: data.schoolName || '',
        logo: data.logo || '',
        address: data.address || '',
        phone: data.phone || '',
        email: data.email || '',
        currentAcademicYearId: typeof data.currentAcademicYearId === 'string' ? data.currentAcademicYearId : data.currentAcademicYearId?._id || null,
        defaultCurrency: data.defaultCurrency || 'USD',
        supportedCurrencies: (data.supportedCurrencies?.length ? data.supportedCurrencies : ['USD', 'KHR']) as Array<'USD' | 'KHR'>,
        exchangeRateUsdToKhr: Number(data.exchangeRateUsdToKhr || 0),
        receiptPrefix: data.receiptPrefix || 'RCPT',
        nextReceiptNumber: Number(data.nextReceiptNumber || 1),
        monthlyDueDay: Number(data.monthlyDueDay || 1),
        gracePeriodDays: Number(data.gracePeriodDays || 0),
        employeeRoles: data.employeeRoles?.length ? data.employeeRoles : ['teacher', 'driver', 'staff'],
        footerText: data.footerText || '',
        principalName: data.principalName || '',
        qrCodeEnabled: Boolean(data.qrCodeEnabled),
        attendanceEnabled: Boolean(data.attendanceEnabled ?? true),
        attendanceQrEnabled: Boolean(data.attendanceQrEnabled ?? true),
        attendanceGpsEnabled: Boolean(data.attendanceGpsEnabled ?? true),
        attendanceSchoolLatitude: data.attendanceSchoolLatitude ?? null,
        attendanceSchoolLongitude: data.attendanceSchoolLongitude ?? null,
        attendanceAllowedRadius: Number(data.attendanceAllowedRadius ?? 100),
        morningCheckInStart: data.morningCheckInStart ?? null,
        morningCheckInEnd: data.morningCheckInEnd ?? null,
        afternoonCheckInStart: data.afternoonCheckInStart ?? null,
        afternoonCheckInEnd: data.afternoonCheckInEnd ?? null,
        eveningCheckInStart: data.eveningCheckInStart ?? null,
        eveningCheckInEnd: data.eveningCheckInEnd ?? null,
        attendanceStart: data.attendanceStart || '06:00',
        attendanceEnd: data.attendanceEnd || '18:00'
      };
      setFormValues(nextValues);
      setLogoPreview(data.logo || '');
    } catch (error) {
      console.error(error);
      setMessage('Unable to load school settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = <K extends FieldKey>(field: K, value: SchoolSettingsPayload[K]) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleLogoFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setLogoFile(file);
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setLogoPreview(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const toggleSupportedCurrency = (currency: 'USD' | 'KHR') => {
    setFormValues((prev) => {
      const nextCurrencies = prev.supportedCurrencies.includes(currency)
        ? prev.supportedCurrencies.filter((item) => item !== currency)
        : [...prev.supportedCurrencies, currency];
      return { ...prev, supportedCurrencies: nextCurrencies.length > 0 ? nextCurrencies : ['USD'] };
    });
  };

  const validate = () => {
    const nextErrors: SettingsErrors = {};

    if (!formValues.schoolName.trim()) nextErrors.schoolName = 'School name is required.';
    if (formValues.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email.trim())) nextErrors.email = 'Enter a valid email address.';
    if (!formValues.supportedCurrencies.length) nextErrors.supportedCurrencies = 'Select at least one supported currency.';
    if (formValues.exchangeRateUsdToKhr < 0) nextErrors.exchangeRateUsdToKhr = 'Exchange rate cannot be negative.';
    if (formValues.monthlyDueDay < 1 || formValues.monthlyDueDay > 31) nextErrors.monthlyDueDay = 'Monthly due day must be between 1 and 31.';
    if (formValues.gracePeriodDays < 0) nextErrors.gracePeriodDays = 'Grace period cannot be negative.';
    if (!formValues.employeeRoles.length) nextErrors.employeeRoles = 'At least one employee role is required.';
    if (formValues.nextReceiptNumber < 1) nextErrors.nextReceiptNumber = 'Next receipt number must be at least 1.';
    if (!formValues.receiptPrefix.trim()) nextErrors.receiptPrefix = 'Receipt prefix is required.';
    if (formValues.attendanceSchoolLatitude !== null && (formValues.attendanceSchoolLatitude < -90 || formValues.attendanceSchoolLatitude > 90)) {
      nextErrors.attendanceSchoolLatitude = 'Latitude must be between -90 and 90.';
    }
    if (formValues.attendanceSchoolLongitude !== null && (formValues.attendanceSchoolLongitude < -180 || formValues.attendanceSchoolLongitude > 180)) {
      nextErrors.attendanceSchoolLongitude = 'Longitude must be between -180 and 180.';
    }
    if (formValues.attendanceAllowedRadius < 1) nextErrors.attendanceAllowedRadius = 'Allowed radius must be at least 1 meter.';
    for (const field of ['morningCheckInStart', 'morningCheckInEnd', 'afternoonCheckInStart', 'afternoonCheckInEnd', 'eveningCheckInStart', 'eveningCheckInEnd'] as const) {
      const value = formValues[field];
      if (value !== null && value !== undefined && value !== '' && !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
        nextErrors[field] = 'Use 24-hour HH:mm format.';
      }
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(formValues.attendanceStart)) nextErrors.attendanceStart = 'Use 24-hour HH:mm format.';
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(formValues.attendanceEnd)) nextErrors.attendanceEnd = 'Use 24-hour HH:mm format.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildPayload = async (): Promise<SchoolSettingsPayload> => {
    let nextLogo = formValues.logo;
    if (logoFile) {
      nextLogo = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => resolve(formValues.logo);
        reader.readAsDataURL(logoFile);
      });
    } else if (logoPreview) {
      nextLogo = logoPreview;
    }

    return {
      ...formValues,
      logo: nextLogo,
      schoolName: formValues.schoolName.trim(),
      address: formValues.address.trim(),
      phone: formValues.phone.trim(),
      email: formValues.email.trim(),
      receiptPrefix: formValues.receiptPrefix.trim(),
      footerText: formValues.footerText.trim(),
      principalName: formValues.principalName.trim(),
      supportedCurrencies: [...new Set(formValues.supportedCurrencies)] as Array<'USD' | 'KHR'>
      ,employeeRoles: [...new Set(formValues.employeeRoles.map((item) => item.trim()).filter(Boolean))]
    };
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setMessage('');
    try {
      const payload = await buildPayload();
      const response = settingsId ? await updateSchoolSettings(payload) : await createSchoolSettings(payload);
      setSettings(response.data || null);
      setSettingsId(response.data?._id || null);
      setFormValues({
        schoolName: response.data?.schoolName || payload.schoolName,
        logo: response.data?.logo || payload.logo,
        address: response.data?.address || payload.address,
        phone: response.data?.phone || payload.phone,
        email: response.data?.email || payload.email,
        currentAcademicYearId:
          typeof response.data?.currentAcademicYearId === 'string'
            ? response.data.currentAcademicYearId
            : response.data?.currentAcademicYearId?._id || payload.currentAcademicYearId,
        defaultCurrency: response.data?.defaultCurrency || payload.defaultCurrency,
        supportedCurrencies: response.data?.supportedCurrencies || payload.supportedCurrencies,
        exchangeRateUsdToKhr: Number(response.data?.exchangeRateUsdToKhr ?? payload.exchangeRateUsdToKhr),
        receiptPrefix: response.data?.receiptPrefix || payload.receiptPrefix,
        nextReceiptNumber: Number(response.data?.nextReceiptNumber ?? payload.nextReceiptNumber),
        monthlyDueDay: Number(response.data?.monthlyDueDay ?? payload.monthlyDueDay),
        gracePeriodDays: Number(response.data?.gracePeriodDays ?? payload.gracePeriodDays),
        employeeRoles: response.data?.employeeRoles?.length ? response.data.employeeRoles : payload.employeeRoles,
        footerText: response.data?.footerText || payload.footerText,
        principalName: response.data?.principalName || payload.principalName,
        qrCodeEnabled: Boolean(response.data?.qrCodeEnabled ?? payload.qrCodeEnabled),
        attendanceEnabled: Boolean(response.data?.attendanceEnabled ?? payload.attendanceEnabled),
        attendanceQrEnabled: Boolean(response.data?.attendanceQrEnabled ?? payload.attendanceQrEnabled),
        attendanceGpsEnabled: Boolean(response.data?.attendanceGpsEnabled ?? payload.attendanceGpsEnabled),
        attendanceSchoolLatitude: response.data?.attendanceSchoolLatitude ?? payload.attendanceSchoolLatitude,
        attendanceSchoolLongitude: response.data?.attendanceSchoolLongitude ?? payload.attendanceSchoolLongitude,
        attendanceAllowedRadius: Number(response.data?.attendanceAllowedRadius ?? payload.attendanceAllowedRadius),
        morningCheckInStart: response.data?.morningCheckInStart ?? payload.morningCheckInStart,
        morningCheckInEnd: response.data?.morningCheckInEnd ?? payload.morningCheckInEnd,
        afternoonCheckInStart: response.data?.afternoonCheckInStart ?? payload.afternoonCheckInStart,
        afternoonCheckInEnd: response.data?.afternoonCheckInEnd ?? payload.afternoonCheckInEnd,
        eveningCheckInStart: response.data?.eveningCheckInStart ?? payload.eveningCheckInStart,
        eveningCheckInEnd: response.data?.eveningCheckInEnd ?? payload.eveningCheckInEnd,
        attendanceStart: response.data?.attendanceStart || payload.attendanceStart,
        attendanceEnd: response.data?.attendanceEnd || payload.attendanceEnd
      });
      setLogoPreview(response.data?.logo || payload.logo);
      setLogoFile(null);
      setMessage(settingsId ? 'School settings updated successfully.' : 'School settings created successfully.');
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Unable to save school settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    setMessage('');
    try {
      await deleteSchoolSettings();
      setDeleteOpen(false);
      setSettings(null);
      setSettingsId(null);
      setFormValues(defaultSettings);
      setLogoPreview('');
      setLogoFile(null);
      setMessage('School settings deleted successfully.');
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Unable to delete school settings.');
    } finally {
      setSaving(false);
    }
  };

  const academicYearLabel = useMemo(() => {
    if (!formValues.currentAcademicYearId) return 'No academic year selected';
    const selected = academicYears.find((item) => item._id === formValues.currentAcademicYearId);
    return selected ? `${selected.code} - ${selected.name}` : 'Selected academic year';
  }, [academicYears, formValues.currentAcademicYearId]);

  if (!user || user.role !== 'admin') {
    return <div className="p-8 text-center text-red-600">Access denied. Admin only.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl bg-gradient-to-r from-indigo-700 via-sky-700 to-cyan-700 p-6 text-white shadow-xl">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-100">School Settings</p>
          <h1 className="mt-2 text-3xl font-bold">Centralized school configuration</h1>
          <p className="mt-2 max-w-3xl text-sm text-cyan-50">
            Configure the single source of truth for school identity, academic defaults, finance behavior, and receipt presentation.
          </p>
        </div>

        {message && <div className="rounded-2xl bg-white p-4 text-sm text-slate-700 shadow">{message}</div>}

        <form onSubmit={handleSave} className="space-y-6">
          <section className="rounded-3xl bg-white p-6 shadow">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">General Settings</h2>
                <p className="text-sm text-slate-500">Identity and contact information for the school.</p>
              </div>
              <div className="text-sm text-slate-500">{loading ? 'Loading...' : settingsId ? 'Persisted singleton' : 'New singleton'}</div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1 text-sm md:col-span-2">
                <span className="font-medium text-slate-700">School Name</span>
                <input
                  value={formValues.schoolName}
                  onChange={(e) => handleChange('schoolName', e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2 ${errors.schoolName ? 'border-rose-400 bg-rose-50' : 'border-slate-300'}`}
                  placeholder="School name"
                />
              </label>

              <div className="md:col-span-2 grid gap-4 lg:grid-cols-[220px_1fr]">
                <div className="space-y-3">
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                    <img
                      src={logoPreview || '/placeholder-avatar.png'}
                      alt="School logo preview"
                      className="h-48 w-full object-cover"
                    />
                  </div>
                  <label className="block text-sm font-medium text-slate-700">
                    Logo file
                    <input type="file" accept="image/*" onChange={handleLogoFile} className="mt-2 block w-full text-sm" />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-1 text-sm md:col-span-2">
                    <span className="font-medium text-slate-700">Logo URL or Data URL</span>
                    <input
                      value={formValues.logo}
                      onChange={(e) => {
                        setLogoFile(null);
                        setLogoPreview(e.target.value);
                        handleChange('logo', e.target.value);
                      }}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2"
                      placeholder="https://... or base64"
                    />
                  </label>
                  <label className="space-y-1 text-sm md:col-span-2">
                    <span className="font-medium text-slate-700">Address</span>
                    <textarea
                      value={formValues.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2"
                      rows={3}
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="font-medium text-slate-700">Phone</span>
                    <input
                      value={formValues.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2"
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="font-medium text-slate-700">Email</span>
                    <input
                      value={formValues.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className={`w-full rounded-xl border px-3 py-2 ${errors.email ? 'border-rose-400 bg-rose-50' : 'border-slate-300'}`}
                    />
                  </label>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow">
            <h2 className="text-xl font-semibold text-slate-900">Attendance Settings</h2>
            <p className="text-sm text-slate-500">Control teacher attendance availability, location rules, and the daily check-in window.</p>

            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                <input type="checkbox" checked={formValues.attendanceEnabled} onChange={(e) => handleChange('attendanceEnabled', e.target.checked)} />
                Attendance Enabled
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                <input type="checkbox" checked={formValues.attendanceQrEnabled} onChange={(e) => handleChange('attendanceQrEnabled', e.target.checked)} />
                Attendance QR Enabled
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                <input type="checkbox" checked={formValues.attendanceGpsEnabled} onChange={(e) => handleChange('attendanceGpsEnabled', e.target.checked)} />
                Attendance GPS Enabled
              </label>

              <label htmlFor="attendance-school-latitude" className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">School Latitude</span>
                <input id="attendance-school-latitude" type="number" min="-90" max="90" step="any" value={formValues.attendanceSchoolLatitude ?? ''} onChange={(e) => handleChange('attendanceSchoolLatitude', e.target.value === '' ? null : Number(e.target.value))} className={`w-full rounded-xl border px-3 py-2 ${errors.attendanceSchoolLatitude ? 'border-rose-400 bg-rose-50' : 'border-slate-300'}`} />
                {errors.attendanceSchoolLatitude ? <p className="text-xs text-rose-600">{errors.attendanceSchoolLatitude}</p> : <p className="text-xs text-slate-500">Optional; -90 to 90.</p>}
              </label>
              <label htmlFor="attendance-school-longitude" className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">School Longitude</span>
                <input id="attendance-school-longitude" type="number" min="-180" max="180" step="any" value={formValues.attendanceSchoolLongitude ?? ''} onChange={(e) => handleChange('attendanceSchoolLongitude', e.target.value === '' ? null : Number(e.target.value))} className={`w-full rounded-xl border px-3 py-2 ${errors.attendanceSchoolLongitude ? 'border-rose-400 bg-rose-50' : 'border-slate-300'}`} />
                {errors.attendanceSchoolLongitude ? <p className="text-xs text-rose-600">{errors.attendanceSchoolLongitude}</p> : <p className="text-xs text-slate-500">Optional; -180 to 180.</p>}
              </label>
              <label htmlFor="attendance-allowed-radius" className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Allowed Radius (meters)</span>
                <input id="attendance-allowed-radius" type="number" min="1" step="1" value={formValues.attendanceAllowedRadius} onChange={(e) => handleChange('attendanceAllowedRadius', Number(e.target.value || 0))} className={`w-full rounded-xl border px-3 py-2 ${errors.attendanceAllowedRadius ? 'border-rose-400 bg-rose-50' : 'border-slate-300'}`} />
                {errors.attendanceAllowedRadius ? <p className="text-xs text-rose-600">{errors.attendanceAllowedRadius}</p> : <p className="text-xs text-slate-500">Must be at least 1 meter.</p>}
              </label>
              <label htmlFor="morning-checkin-start" className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Morning Check-in Start</span>
                <input id="morning-checkin-start" type="time" value={formValues.morningCheckInStart ?? ''} onChange={(e) => handleChange('morningCheckInStart', e.target.value === '' ? null : e.target.value)} className={`w-full rounded-xl border px-3 py-2 ${errors.morningCheckInStart ? 'border-rose-400 bg-rose-50' : 'border-slate-300'}`} />
                {errors.morningCheckInStart && <p className="text-xs text-rose-600">{errors.morningCheckInStart}</p>}
              </label>
              <label htmlFor="morning-checkin-end" className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Morning Check-in End</span>
                <input id="morning-checkin-end" type="time" value={formValues.morningCheckInEnd ?? ''} onChange={(e) => handleChange('morningCheckInEnd', e.target.value === '' ? null : e.target.value)} className={`w-full rounded-xl border px-3 py-2 ${errors.morningCheckInEnd ? 'border-rose-400 bg-rose-50' : 'border-slate-300'}`} />
                {errors.morningCheckInEnd && <p className="text-xs text-rose-600">{errors.morningCheckInEnd}</p>}
              </label>
              <label htmlFor="afternoon-checkin-start" className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Afternoon Check-in Start</span>
                <input id="afternoon-checkin-start" type="time" value={formValues.afternoonCheckInStart ?? ''} onChange={(e) => handleChange('afternoonCheckInStart', e.target.value === '' ? null : e.target.value)} className={`w-full rounded-xl border px-3 py-2 ${errors.afternoonCheckInStart ? 'border-rose-400 bg-rose-50' : 'border-slate-300'}`} />
                {errors.afternoonCheckInStart && <p className="text-xs text-rose-600">{errors.afternoonCheckInStart}</p>}
              </label>
              <label htmlFor="afternoon-checkin-end" className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Afternoon Check-in End</span>
                <input id="afternoon-checkin-end" type="time" value={formValues.afternoonCheckInEnd ?? ''} onChange={(e) => handleChange('afternoonCheckInEnd', e.target.value === '' ? null : e.target.value)} className={`w-full rounded-xl border px-3 py-2 ${errors.afternoonCheckInEnd ? 'border-rose-400 bg-rose-50' : 'border-slate-300'}`} />
                {errors.afternoonCheckInEnd && <p className="text-xs text-rose-600">{errors.afternoonCheckInEnd}</p>}
              </label>
              <label htmlFor="evening-checkin-start" className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Evening Check-in Start</span>
                <input id="evening-checkin-start" type="time" value={formValues.eveningCheckInStart ?? ''} onChange={(e) => handleChange('eveningCheckInStart', e.target.value === '' ? null : e.target.value)} className={`w-full rounded-xl border px-3 py-2 ${errors.eveningCheckInStart ? 'border-rose-400 bg-rose-50' : 'border-slate-300'}`} />
                {errors.eveningCheckInStart && <p className="text-xs text-rose-600">{errors.eveningCheckInStart}</p>}
              </label>
              <label htmlFor="evening-checkin-end" className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Evening Check-in End</span>
                <input id="evening-checkin-end" type="time" value={formValues.eveningCheckInEnd ?? ''} onChange={(e) => handleChange('eveningCheckInEnd', e.target.value === '' ? null : e.target.value)} className={`w-full rounded-xl border px-3 py-2 ${errors.eveningCheckInEnd ? 'border-rose-400 bg-rose-50' : 'border-slate-300'}`} />
                {errors.eveningCheckInEnd && <p className="text-xs text-rose-600">{errors.eveningCheckInEnd}</p>}
              </label>
              <label htmlFor="attendance-start" className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Attendance Start</span>
                <input id="attendance-start" type="time" value={formValues.attendanceStart} onChange={(e) => handleChange('attendanceStart', e.target.value)} className={`w-full rounded-xl border px-3 py-2 ${errors.attendanceStart ? 'border-rose-400 bg-rose-50' : 'border-slate-300'}`} />
                {errors.attendanceStart && <p className="text-xs text-rose-600">{errors.attendanceStart}</p>}
              </label>
              <label htmlFor="attendance-end" className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Attendance End</span>
                <input id="attendance-end" type="time" value={formValues.attendanceEnd} onChange={(e) => handleChange('attendanceEnd', e.target.value)} className={`w-full rounded-xl border px-3 py-2 ${errors.attendanceEnd ? 'border-rose-400 bg-rose-50' : 'border-slate-300'}`} />
                {errors.attendanceEnd && <p className="text-xs text-rose-600">{errors.attendanceEnd}</p>}
              </label>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow">
            <h2 className="text-xl font-semibold text-slate-900">Academic Settings</h2>
            <p className="text-sm text-slate-500">Defaults reused across school modules.</p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Current Academic Year</span>
                <select
                  value={formValues.currentAcademicYearId || ''}
                  onChange={(e) => handleChange('currentAcademicYearId', e.target.value || null)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                >
                  <option value="">Select academic year</option>
                  {academicYears.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.code} - {item.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500">{academicYearLabel}</p>
              </label>

              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Default Currency</span>
                <select
                  value={formValues.defaultCurrency}
                  onChange={(e) => handleChange('defaultCurrency', e.target.value as 'USD' | 'KHR')}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                >
                  <option value="USD">USD</option>
                  <option value="KHR">KHR</option>
                </select>
              </label>

              <div className="md:col-span-2">
                <div className="text-sm font-medium text-slate-700">Supported Currencies</div>
                <div className="mt-2 flex flex-wrap gap-3">
                  {currencyOptions.map((currency) => (
                    <label key={currency} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={formValues.supportedCurrencies.includes(currency)}
                        onChange={() => toggleSupportedCurrency(currency)}
                      />
                      {currency}
                    </label>
                  ))}
                </div>
                {errors.supportedCurrencies && <p className="mt-2 text-xs text-rose-600">{errors.supportedCurrencies}</p>}
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow">
            <h2 className="text-xl font-semibold text-slate-900">Finance Settings</h2>
            <p className="text-sm text-slate-500">Used by receipts and tuition flow.</p>

            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Exchange Rate (USD → KHR)</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formValues.exchangeRateUsdToKhr}
                  onChange={(e) => handleChange('exchangeRateUsdToKhr', Number(e.target.value || 0))}
                  className={`w-full rounded-xl border px-3 py-2 ${errors.exchangeRateUsdToKhr ? 'border-rose-400 bg-rose-50' : 'border-slate-300'}`}
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Receipt Prefix</span>
                <input
                  value={formValues.receiptPrefix}
                  onChange={(e) => handleChange('receiptPrefix', e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2 ${errors.receiptPrefix ? 'border-rose-400 bg-rose-50' : 'border-slate-300'}`}
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Next Receipt Number</span>
                <input
                  type="number"
                  min="1"
                  value={formValues.nextReceiptNumber}
                  onChange={(e) => handleChange('nextReceiptNumber', Number(e.target.value || 1))}
                  className={`w-full rounded-xl border px-3 py-2 ${errors.nextReceiptNumber ? 'border-rose-400 bg-rose-50' : 'border-slate-300'}`}
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Monthly Due Day</span>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={formValues.monthlyDueDay}
                  onChange={(e) => handleChange('monthlyDueDay', Number(e.target.value || 1))}
                  className={`w-full rounded-xl border px-3 py-2 ${errors.monthlyDueDay ? 'border-rose-400 bg-rose-50' : 'border-slate-300'}`}
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Grace Period (days)</span>
                <input
                  type="number"
                  min="0"
                  value={formValues.gracePeriodDays}
                  onChange={(e) => handleChange('gracePeriodDays', Number(e.target.value || 0))}
                  className={`w-full rounded-xl border px-3 py-2 ${errors.gracePeriodDays ? 'border-rose-400 bg-rose-50' : 'border-slate-300'}`}
                />
              </label>

              <label className="space-y-1 text-sm lg:col-span-3">
                <span className="font-medium text-slate-700">Employee Roles (comma separated)</span>
                <input
                  value={formValues.employeeRoles.join(', ')}
                  onChange={(e) => handleChange('employeeRoles', e.target.value.split(',').map((item) => item.trim()).filter(Boolean))}
                  className={`w-full rounded-xl border px-3 py-2 ${errors.employeeRoles ? 'border-rose-400 bg-rose-50' : 'border-slate-300'}`}
                  placeholder="teacher, driver, staff"
                />
                {errors.employeeRoles && <p className="text-xs text-rose-600">{errors.employeeRoles}</p>}
              </label>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow">
            <h2 className="text-xl font-semibold text-slate-900">Receipt Settings</h2>
            <p className="text-sm text-slate-500">Receipt formatting and public presentation.</p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="space-y-1 text-sm md:col-span-2">
                <span className="font-medium text-slate-700">Footer Text</span>
                <textarea
                  rows={3}
                  value={formValues.footerText}
                  onChange={(e) => handleChange('footerText', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Principal Name</span>
                <input
                  value={formValues.principalName}
                  onChange={(e) => handleChange('principalName', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={formValues.qrCodeEnabled}
                  onChange={(e) => handleChange('qrCodeEnabled', e.target.checked)}
                />
                QR Code Enabled
              </label>
            </div>
          </section>

          <section className="rounded-3xl bg-slate-900 p-6 text-white shadow-xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Current Singleton Overview</h2>
                <p className="text-sm text-slate-300">Shows the persisted school identity and finance defaults.</p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm">
                Receipt next number: <span className="font-semibold">{formValues.receiptPrefix}-{String(formValues.nextReceiptNumber).padStart(4, '0')}</span>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-white/10 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-300">School</div>
                <div className="mt-1 font-semibold">{formValues.schoolName || 'Untitled school'}</div>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-300">Currency</div>
                <div className="mt-1 font-semibold">{formValues.defaultCurrency}</div>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-300">QR</div>
                <div className="mt-1 font-semibold">{formValues.qrCodeEnabled ? 'Enabled' : 'Disabled'}</div>
              </div>
            </div>
          </section>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-cyan-700 px-6 py-3 text-sm font-semibold text-white hover:bg-cyan-800 disabled:opacity-60"
            >
              {saving ? 'Saving...' : settingsId ? 'Update Settings' : 'Create Settings'}
            </button>
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              disabled={!settingsId || saving}
              className="rounded-full border border-rose-300 bg-white px-6 py-3 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
            >
              Delete Settings
            </button>
            <button
              type="button"
              onClick={() => {
                setFormValues(defaultSettings);
                setSettingsId(null);
                setSettings(null);
                setLogoPreview('');
                setLogoFile(null);
                setMessage('Form reset to defaults.');
              }}
              className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Reset Form
            </button>
          </div>
        </form>

        <DeleteConfirmationModal
          isOpen={deleteOpen}
          title="Delete School Settings"
          description="This will remove the singleton settings document. The form can be saved again to recreate it."
          confirmLabel={saving ? 'Deleting...' : 'Delete'}
          isProcessing={saving}
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeleteOpen(false)}
        />
      </div>
    </div>
  );
};

export default SchoolSettingsPage;
