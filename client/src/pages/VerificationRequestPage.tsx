import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestVerification } from '../services/auth.api';

const VerificationRequestPage = () => {
  const navigate = useNavigate();
  const [idCardImage, setIdCardImage] = useState<string>('');
  const [selfieImage, setSelfieImage] = useState<string>('');
  const [businessDocument, setBusinessDocument] = useState<string>('');
  const [details, setDetails] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, setter: (value: string) => void) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Only image files are supported for uploads.');
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setter(dataUrl);
      setError('');
    } catch (err) {
      setError('Unable to read the uploaded file. Please try again.');
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!idCardImage || !selfieImage) {
      setError('ID card and selfie images are required to request verification.');
      return;
    }

    setLoading(true);
    try {
      await requestVerification({
        idCardImage,
        selfieImage,
        businessDocument: businessDocument || undefined,
        details: details || undefined
      });
      setSuccess('Verification request submitted successfully. You can check your status on your profile.');
      setTimeout(() => navigate('/profile'), 1200);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Unable to submit verification request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-[2rem] bg-white p-10 shadow-2xl ring-1 ring-border">
        <div className="space-y-3 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-primary">Seller verification</p>
          <h1 className="text-3xl font-semibold text-text-primary">Request seller verification</h1>
          <p className="text-sm text-muted">Upload your ID, selfie, and optional business document to help our team verify your seller identity.</p>
        </div>

        {error && (
          <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}
        {success && (
          <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{success}</div>
        )}

        <form className="mt-10 space-y-8" onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-text-secondary">ID card image</span>
              <div className="mt-2 flex items-center gap-3 rounded-3xl border border-muted bg-background p-4">
                <input type="file" accept="image/*" onChange={(event) => handleFileChange(event, setIdCardImage)} className="text-sm text-text-secondary" />
              </div>
              {idCardImage && (
                <img src={idCardImage} alt="ID card preview" className="mt-3 h-40 w-full rounded-3xl object-cover" />
              )}
            </label>

            <label className="block">
              <span className="text-sm font-medium text-text-secondary">Selfie with ID</span>
              <div className="mt-2 flex items-center gap-3 rounded-3xl border border-muted bg-background p-4">
                <input type="file" accept="image/*" onChange={(event) => handleFileChange(event, setSelfieImage)} className="text-sm text-text-secondary" />
              </div>
              {selfieImage && (
                <img src={selfieImage} alt="Selfie preview" className="mt-3 h-40 w-full rounded-3xl object-cover" />
              )}
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-text-secondary">Business document (optional)</span>
            <textarea
              value={businessDocument}
              onChange={(event) => setBusinessDocument(event.target.value)}
              placeholder="Paste a link or describe the business license/document details"
              className="mt-2 h-24 w-full rounded-3xl border border-muted bg-background px-4 py-3 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              disabled={loading}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-text-secondary">Optional details</span>
            <textarea
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              placeholder="Tell us more about your business and why you want verification"
              className="mt-2 h-28 w-full rounded-3xl border border-muted bg-background px-4 py-3 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              disabled={loading}
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-3xl bg-primary px-6 py-4 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting request...' : 'Submit verification request'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerificationRequestPage;
