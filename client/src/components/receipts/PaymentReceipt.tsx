import type { SchoolSettings } from '../../services/schoolSettings.api';
import { formatDateForDisplay } from '../../utils/date';
import type { PaymentFeeEntry } from '../../utils/paymentFeeExtensions';

export interface PrintableReceiptData {
  receiptNumber: string;
  paymentDate: string;
  studentId: string;
  studentName: string;
  khmerName?: string;
  englishName?: string;
  gradeName?: string;
  className?: string;
  studyShift?: string;
  paymentPeriod?: string;
  paymentPlan: string;
  tuitionAmount: number;
  discount: number;
  amount: number;
  remainingBalance: number;
  paymentMethod: string;
  cashier?: string;
  academicYear?: string;
  billingPeriod?: string;
  feeEntries?: PaymentFeeEntry[];
}

interface PaymentReceiptProps {
  payment: PrintableReceiptData;
  schoolSettings?: SchoolSettings | null;
  currencyFormatter: Intl.NumberFormat;
}

const PaymentReceipt = ({ payment, schoolSettings, currencyFormatter }: PaymentReceiptProps) => {
  const displayDate = payment.paymentDate ? formatDateForDisplay(payment.paymentDate) : '-';
  const feeEntries = payment.feeEntries?.filter((entry) => Number(entry.amount || 0) > 0) || [];
  const showFeeBreakdown = feeEntries.length > 0;

  return (
    <>
      <style>{`
        @page {
          size: A4;
          margin: 12mm;
        }
        @media print {
          body {
            background: #ffffff;
            margin: 0;
          }
        }
      `}</style>
      <div
        style={{
          fontFamily: 'Arial, Helvetica, sans-serif',
          color: '#0f172a',
          background: '#ffffff',
          width: '210mm',
          minHeight: '297mm',
          margin: '0 auto',
          padding: '24mm',
          boxSizing: 'border-box'
        }}
      >
      <div
        style={{
          border: '1px solid #cbd5e1',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '12px',
                border: '1px dashed #94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f8fafc',
                fontSize: '12px',
                textAlign: 'center',
                color: '#64748b',
                overflow: 'hidden'
              }}
            >
              {schoolSettings?.logo ? (
                <img
                  src={schoolSettings.logo}
                  alt="School logo"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                'No Logo'
              )}
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f766e' }}>
                {schoolSettings?.schoolName || 'School Receipt'}
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                Official tuition payment receipt
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.18em' }}>
              Receipt No
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#111827' }}>{payment.receiptNumber || '-'}</div>
          </div>
        </div>

        <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Student Information</div>
            <div style={{ fontSize: '14px', lineHeight: 1.7 }}>
              <div><strong>Student ID:</strong> {payment.studentId || '-'}</div>
              <div><strong>Khmer Name:</strong> {payment.khmerName || '-'}</div>
              <div><strong>English Name:</strong> {payment.englishName || '-'}</div>
              <div><strong>Grade:</strong> {payment.gradeName || '-'}</div>
              <div><strong>Class:</strong> {payment.className || '-'}</div>
              <div><strong>Study Shift:</strong> {payment.studyShift ? payment.studyShift.charAt(0).toUpperCase() + payment.studyShift.slice(1) : '-'}</div>
            </div>
          </div>
          <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Payment Details</div>
            <div style={{ fontSize: '14px', lineHeight: 1.7 }}>
              <div><strong>Payment Date:</strong> {displayDate}</div>
              <div><strong>Payment Plan:</strong> {payment.paymentPlan || '-'}</div>
              <div><strong>Payment Period:</strong> {payment.paymentPeriod || payment.billingPeriod || '-'}</div>
              <div><strong>Billing Period:</strong> {payment.billingPeriod || '-'}</div>
              <div><strong>Payment Method:</strong> {payment.paymentMethod || '-'}</div>
              <div><strong>Cashier:</strong> {payment.cashier || '-'}</div>
              <div><strong>Academic Year:</strong> {payment.academicYear || '-'}</div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '20px', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ background: '#0f766e', color: '#ffffff', padding: '12px 16px', fontWeight: 700 }}>
            Financial Summary
          </div>
          <div style={{ padding: '16px' }}>
            {showFeeBreakdown ? (
              <>
                {feeEntries.map((entry) => (
                  <div key={entry.id || entry.type} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                    <span>{entry.label || entry.type}</span>
                    <span>{currencyFormatter.format(entry.amount || 0)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid #e2e8f0', marginTop: '8px' }}>
                  <span>Discount</span>
                  <span>- {currencyFormatter.format(payment.discount || 0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                  <span>Paid Amount</span>
                  <span>{currencyFormatter.format(payment.amount || 0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontWeight: 700, fontSize: '16px' }}>
                  <span>Remaining Balance</span>
                  <span>{currencyFormatter.format(payment.remainingBalance || 0)}</span>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                  <span>Tuition Fee</span>
                  <span>{currencyFormatter.format(payment.tuitionAmount || 0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                  <span>Discount</span>
                  <span>- {currencyFormatter.format(payment.discount || 0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                  <span>Paid Amount</span>
                  <span>{currencyFormatter.format(payment.amount || 0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontWeight: 700, fontSize: '16px' }}>
                  <span>Remaining Balance</span>
                  <span>{currencyFormatter.format(payment.remainingBalance || 0)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '36px' }}>Signature (Cashier)</div>
            <div style={{ borderTop: '1px solid #0f172a', width: '180px' }} />
          </div>
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '36px' }}>Signature (Parent/Guardian)</div>
            <div style={{ borderTop: '1px solid #0f172a', width: '180px' }} />
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default PaymentReceipt;
