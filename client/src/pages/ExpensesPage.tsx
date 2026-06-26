import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import DeleteConfirmationModal from '../components/common/DeleteConfirmationModal';
import { getSchoolSettings, type SchoolSettings } from '../services/schoolSettings.api';
import { formatAmount } from '../utils/price';
import {
  createExpense,
  deleteExpense,
  listExpenses,
  updateExpense,
  type Expense,
  type ExpenseCategory,
  type ExpensePayload,
  type ExpensePaymentMethod
} from '../services/expense.api';

type ExpenseField = keyof ExpensePayload;

interface ExpenseFormValues {
  expenseDate: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  currency: string;
  paymentMethod: ExpensePaymentMethod;
  receiptNumber: string;
  notes: string;
}

const CATEGORY_OPTIONS: Array<{ value: ExpenseCategory; label: string }> = [
  { value: 'salary', label: 'Salary' },
  { value: 'fuel', label: 'Fuel' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'office_supplies', label: 'Office Supplies' },
  { value: 'teaching_materials', label: 'Teaching Materials' },
  { value: 'other', label: 'Other' }
];

const PAYMENT_OPTIONS: Array<{ value: ExpensePaymentMethod; label: string }> = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'card', label: 'Card' },
  { value: 'mobile_payment', label: 'Mobile Payment' },
  { value: 'check', label: 'Check' },
  { value: 'other', label: 'Other' }
];

const emptyExpenseForm: ExpenseFormValues = {
  expenseDate: new Date().toISOString().slice(0, 10),
  category: 'other',
  description: '',
  amount: 0,
  currency: 'USD',
  paymentMethod: 'cash',
  receiptNumber: '',
  notes: ''
};

const toLabel = (value: string) => value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const ExpensesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [formValues, setFormValues] = useState<ExpenseFormValues>(emptyExpenseForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Partial<Record<ExpenseField, string>>>({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [supportedCurrencies, setSupportedCurrencies] = useState<string[]>(['USD', 'KHR']);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0 });
  const [pendingDeleteExpense, setPendingDeleteExpense] = useState<Expense | null>(null);

  useEffect(() => {
    if (!user) return navigate('/login');
    if (user.role !== 'admin') return;
    void Promise.all([loadSettings(), loadExpenses()]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, page]);

  const loadSettings = async () => {
    try {
      const response = await getSchoolSettings();
      const loaded = response?.data || null;
      const currencies = loaded?.supportedCurrencies?.length
        ? loaded.supportedCurrencies
        : [loaded?.defaultCurrency || 'USD', 'KHR'];

      setSettings(loaded);
      setSupportedCurrencies(currencies);
      setFormValues((prev) => ({
        ...prev,
        currency: prev.currency || loaded?.defaultCurrency || 'USD'
      }));
    } catch (error) {
      console.error(error);
      setMessage('Unable to load school settings.');
    }
  };

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const response = await listExpenses({
        search: searchTerm || undefined,
        category: (categoryFilter || undefined) as ExpenseCategory | undefined,
        paymentMethod: (paymentFilter || undefined) as ExpensePaymentMethod | undefined,
        currency: currencyFilter || undefined,
        page,
        perPage: 10
      });
      setExpenses(response.data?.items || []);
      setMeta(response.data?.meta || { page, limit: 10, total: 0 });
    } catch (error) {
      console.error(error);
      setMessage('Unable to load expenses.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: name === 'amount' ? Number(value) || 0 : value
    }));

    setFormErrors((prev) => {
      const next = { ...prev };
      delete next[name as ExpenseField];
      return next;
    });
  };

  const validateExpenseForm = () => {
    const nextErrors: Partial<Record<ExpenseField, string>> = {};

    if (!formValues.expenseDate) nextErrors.expenseDate = 'Expense date is required.';
    if (!formValues.description.trim()) nextErrors.description = 'Description is required.';
    if (formValues.amount <= 0) nextErrors.amount = 'Amount must be greater than zero.';
    if (!supportedCurrencies.includes(formValues.currency)) nextErrors.currency = 'Currency must follow School Settings.';

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const getFieldClassName = (field: ExpenseField) =>
    `rounded-lg border px-4 py-2 ${formErrors[field] ? 'border-rose-400 bg-rose-50' : 'border-muted'}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateExpenseForm()) {
      setMessage('Please fix the highlighted fields.');
      return;
    }

    const payload: ExpensePayload = {
      expenseDate: formValues.expenseDate,
      category: formValues.category,
      description: formValues.description,
      amount: formValues.amount,
      currency: formValues.currency,
      paymentMethod: formValues.paymentMethod,
      receiptNumber: formValues.receiptNumber || undefined,
      notes: formValues.notes || undefined
    };

    try {
      if (editingId) {
        await updateExpense(editingId, payload);
        setMessage('Expense updated successfully.');
      } else {
        await createExpense(payload);
        setMessage('Expense created successfully.');
      }

      setFormValues({
        ...emptyExpenseForm,
        currency: settings?.defaultCurrency || 'USD'
      });
      setEditingId(null);
      setFormErrors({});
      await loadExpenses();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Error saving expense.');
      console.error(error);
    }
  };

  const handleEdit = (expense: Expense) => {
    setFormValues({
      expenseDate: expense.expenseDate ? new Date(expense.expenseDate).toISOString().slice(0, 10) : '',
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
      currency: expense.currency,
      paymentMethod: expense.paymentMethod,
      receiptNumber: expense.receiptNumber || '',
      notes: expense.notes || ''
    });
    setEditingId(expense._id);
    setFormErrors({});
  };

  const handleDelete = async () => {
    if (!pendingDeleteExpense) return;
    try {
      await deleteExpense(pendingDeleteExpense._id);
      setMessage('Expense deleted successfully.');
      setPendingDeleteExpense(null);
      await loadExpenses();
    } catch (error) {
      setMessage('Error deleting expense.');
      console.error(error);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    await loadExpenses();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Expense Management</h1>
        <p className="text-text-secondary">Manage school expenses</p>
      </div>

      {message && (
        <div className="rounded-lg bg-primary bg-opacity-10 p-4 text-primary">
          {message}
        </div>
      )}

      <div className="rounded-[2rem] border border-muted bg-white p-8 shadow-xl">
        <h2 className="mb-6 text-xl font-semibold text-text-primary">
          {editingId ? 'Edit Expense' : 'Add New Expense'}
        </h2>

        <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
          <input type="date" name="expenseDate" value={formValues.expenseDate} onChange={handleInputChange} className={getFieldClassName('expenseDate')} required />

          <select name="category" value={formValues.category} onChange={handleInputChange} className={getFieldClassName('category')}>
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <input name="description" placeholder="Description" value={formValues.description} onChange={handleInputChange} className={getFieldClassName('description')} required />
          <input type="number" min={0.01} step="0.01" name="amount" placeholder="Amount" value={formValues.amount} onChange={handleInputChange} className={getFieldClassName('amount')} required />

          <select name="currency" value={formValues.currency} onChange={handleInputChange} className={getFieldClassName('currency')}>
            {supportedCurrencies.map((currencyCode) => (
              <option key={currencyCode} value={currencyCode}>{currencyCode}</option>
            ))}
          </select>

          <select name="paymentMethod" value={formValues.paymentMethod} onChange={handleInputChange} className={getFieldClassName('paymentMethod')}>
            {PAYMENT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <input name="receiptNumber" placeholder="Receipt Number (optional)" value={formValues.receiptNumber} onChange={handleInputChange} className={getFieldClassName('receiptNumber')} />
          <textarea name="notes" placeholder="Notes" value={formValues.notes} onChange={handleInputChange} className="rounded-lg border border-muted px-4 py-2" rows={2} />

          <div className="md:col-span-2 flex gap-3">
            <button type="submit" className="rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-white hover:bg-primary-hover">
              {editingId ? 'Update Expense' : 'Add Expense'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setFormValues({
                    ...emptyExpenseForm,
                    currency: settings?.defaultCurrency || 'USD'
                  });
                  setFormErrors({});
                }}
                className="rounded-lg border border-muted px-6 py-2 text-sm font-semibold text-text-secondary hover:bg-background"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="rounded-[2rem] border border-muted bg-white p-8 shadow-xl">
        <form onSubmit={handleSearch} className="mb-6 grid gap-4 md:grid-cols-5">
          <input
            type="text"
            placeholder="Search expenses"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-lg border border-muted px-4 py-2"
          />
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="rounded-lg border border-muted px-4 py-2">
            <option value="">All Categories</option>
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="rounded-lg border border-muted px-4 py-2">
            <option value="">All Payment Methods</option>
            {PAYMENT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select value={currencyFilter} onChange={(e) => setCurrencyFilter(e.target.value)} className="rounded-lg border border-muted px-4 py-2">
            <option value="">All Currencies</option>
            {supportedCurrencies.map((currencyCode) => (
              <option key={currencyCode} value={currencyCode}>{currencyCode}</option>
            ))}
          </select>
          <button type="submit" className="rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-white hover:bg-primary-hover">
            Search
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-muted bg-background text-left text-sm font-medium text-text-secondary">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Receipt</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-4 text-sm text-text-secondary" colSpan={7}>Loading expenses...</td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-sm text-text-secondary" colSpan={7}>No expenses found.</td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense._id} className="border-b border-muted text-sm text-text-primary">
                    <td className="px-4 py-3">{new Date(expense.expenseDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{toLabel(expense.category)}</td>
                    <td className="px-4 py-3">{expense.description}</td>
                    <td className="px-4 py-3">{formatAmount(expense.amount, expense.currency)}</td>
                    <td className="px-4 py-3">{toLabel(expense.paymentMethod)}</td>
                    <td className="px-4 py-3">{expense.receiptNumber || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => handleEdit(expense)} className="rounded-lg border border-muted px-3 py-1 text-xs font-medium text-text-secondary hover:bg-background">Edit</button>
                        <button type="button" onClick={() => setPendingDeleteExpense(expense)} className="rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-text-secondary">
          <div>
            Showing {expenses.length} of {meta.total} expenses
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
              disabled={page <= 1 || loading}
              className="rounded-full border border-muted px-3 py-1 font-semibold hover:bg-background disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-2">Page {meta.page || page}</span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(current + 1, Math.max(1, Math.ceil(meta.total / meta.limit))))}
              disabled={page >= Math.max(1, Math.ceil(meta.total / meta.limit)) || loading}
              className="rounded-full border border-muted px-3 py-1 font-semibold hover:bg-background disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={Boolean(pendingDeleteExpense)}
        title="Delete Expense"
        description={`Are you sure you want to delete expense: ${pendingDeleteExpense?.description || ''}?`}
        confirmLabel="Delete"
        onConfirm={() => void handleDelete()}
        onCancel={() => setPendingDeleteExpense(null)}
      />
    </div>
  );
};

export default ExpensesPage;