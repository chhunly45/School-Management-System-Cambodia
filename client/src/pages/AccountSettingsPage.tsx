import { useEffect, useState } from 'react';
import { getProfile, updateProfile, changePassword } from '../services/auth.api';
import { getPasswordStrength, getPasswordStrengthLabel } from '../utils/password';

const AccountSettingsPage = () => {
  const [profile, setProfile] = useState<any>(null);
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getProfile();
        setProfile(data);
        setDisplayName(data.displayName || '');
        setPhoneNumber(data.phoneNumber || '');
        setImageUrl(data.profileImageUrl || '');
      } catch (err) {
        // ignore
      }
    };
    load();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setImageFile(f);
  };

  const submitProfile = async () => {
    setLoading(true);
    setMessage('');
    try {
      const payload: any = { displayName, phoneNumber };
      if (imageFile) {
        // convert to base64
        const reader = new FileReader();
        const base64 = await new Promise<string | null>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(imageFile as Blob);
        });
        if (base64) payload.profileImageUrl = base64;
      } else if (imageUrl) {
        payload.profileImageUrl = imageUrl;
      }

      const updated = await updateProfile(payload);
      setProfile(updated);
      setMessage('Profile updated');
      localStorage.setItem('user', JSON.stringify(updated));
    } catch (err: any) {
      setMessage(err?.message || 'Unable to update profile');
    } finally {
      setLoading(false);
    }
  };

  const submitPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      setMessage('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage('Password changed');
    } catch (err: any) {
      setMessage(err?.response?.data?.message || err?.message || 'Unable to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12">
      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>

      <section className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="font-semibold mb-3">Profile</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <div className="sm:col-span-1">
            <div className="h-28 w-28 rounded-2xl overflow-hidden bg-background border">
              <img src={profile?.profileImageUrl || '/placeholder-avatar.png'} alt="avatar" className="h-full w-full object-cover" />
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium">Display name</label>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
            <label className="block text-sm font-medium mt-3">Phone number</label>
            <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />

            <label className="block text-sm font-medium mt-3">Profile image (file)</label>
            <input type="file" accept="image/*" onChange={handleImageChange} className="mt-1" />
            <label className="block text-sm font-medium mt-3">Or image URL</label>
            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />

            <div className="mt-4">
              <button onClick={submitProfile} disabled={loading} className="rounded-lg bg-primary text-white px-4 py-2">
                Save profile
              </button>
            </div> 
          </div>
        </div>
      </section>

      <section className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="font-semibold mb-3">Change password</h2>
        <div className="grid grid-cols-1 gap-3">
          <input type="password" placeholder="Current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
          <input type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
          <p className="mt-2 text-sm text-muted">ប្រើយ៉ាងហោចណាស់ 8 តួ។ ការបន្ថែមលេខ និងសញ្ញាពិសេសនឹងធ្វើឱ្យលេខសម្ងាត់កាន់តែមានសុវត្ថិភាព។</p>
          {getPasswordStrength(newPassword) && (
            <p className="text-sm mt-1">
              កម្លាំងលេខសម្ងាត់:{' '}
              <span className={
                getPasswordStrength(newPassword) === 'Strong'
                  ? 'text-emerald-600'
                  : getPasswordStrength(newPassword) === 'Medium'
                  ? 'text-amber-600'
                  : 'text-rose-600'
              }>{getPasswordStrengthLabel(getPasswordStrength(newPassword))}</span>
            </p>
          )}
          <input type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
          <div>
            <button onClick={submitPassword} disabled={loading} className="rounded-lg bg-accent text-white px-4 py-2">
              Change password
            </button>
          </div> 
        </div>
      </section>

      <section className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="font-semibold mb-3">Verification status</h2>
        <p>
          Email verified: {profile?.emailVerified ? 'Yes' : 'No'}
        </p>
        <p>Seller verification: {profile?.verificationStatus || 'none'}</p>
      </section>

      {message && <div className="mt-4 text-sm text-text-secondary">{message}</div>} 
    </div>
  );
};

export default AccountSettingsPage;
