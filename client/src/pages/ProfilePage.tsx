import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getProfile } from '../services/auth.api';
import { getUserProfile, updateUserProfile } from '../services/user.api';
import { useAuth } from '../hooks/useAuth';
import { Phone, CalendarDays, Edit3, Camera, Lock } from 'lucide-react';

const ProfilePage = () => {
  const { id: profileId } = useParams();
  useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [profileForm, setProfileForm] = useState({
    displayName: '',
    location: '',
    phoneNumber: '',
    avatar: ''
  });
  const [avatarPreview, setAvatarPreview] = useState('');

  const isOwner = useMemo(() => {
    if (!profile) return false;
    if (profileId) {
      return currentUser?.id === profileId || currentUser?._id === profileId;
    }
    return Boolean(currentUser);
  }, [currentUser, profileId, profile]);

  const avatarImage = avatarPreview || profile?.avatar || profile?.profileImageUrl || '';

  const getRoleLabel = (role?: string) => {
    if (!role) return 'User';
    switch (role.toLowerCase()) {
      case 'admin':
        return 'Admin';
      case 'teacher':
        return 'Teacher';
      case 'staff':
        return 'Staff';
      case 'student':
        return 'Student';
      default:
        return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setStatusMessage('');
      try {
        let storedUser = null;
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          storedUser = JSON.parse(savedUser);
          setCurrentUser(storedUser);
        }

        if (!storedUser) {
          try {
            const me = await getProfile();
            storedUser = me;
            setCurrentUser(me);
            localStorage.setItem('user', JSON.stringify(me));
          } catch (err) {
            // ignore if the user is viewing a public profile without authentication
          }
        }

        const profileData = profileId ? await getUserProfile(profileId) : await getProfile();
        let finalProfile = profileData;

        if (!profileId) {
          const profileWithDetails = await getUserProfile(profileData.id || profileData._id);
          finalProfile = profileWithDetails;
        }

        setProfile(finalProfile);
        setAvatarPreview(finalProfile.avatar || finalProfile.profileImageUrl || '');
        setProfileForm({
          displayName: finalProfile.displayName || '',
          location: finalProfile.location || '',
          phoneNumber: finalProfile.phoneNumber || '',
          avatar: ''
        });
      } catch (error) {
        console.error(error);
        const response = (error as any)?.response;
        const message = response?.data?.message;
        if (response?.status === 401 && typeof message === 'string' && message.toLowerCase().includes('invalid or expired')) {
          return;
        }
        setStatusMessage('Unable to load profile.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [profileId]);

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setAvatarPreview(dataUrl);
      setProfileForm((current) => ({ ...current, avatar: dataUrl }));
    } catch (error) {
      console.error(error);
    }
  };

  const startEdit = () => {
    if (!profile) return;
    setIsEditing(true);
    setSuccessMessage('');
    setStatusMessage('');
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setStatusMessage('');
    setSuccessMessage('');
    setAvatarPreview(profile?.avatar || profile?.profileImageUrl || '');
  };

  const saveProfile = async () => {
    setLoading(true);
    setStatusMessage('Saving profile...');
    setSuccessMessage('');

    try {
      const payload: Record<string, any> = {
        displayName: profileForm.displayName,
        location: profileForm.location,
        phoneNumber: profileForm.phoneNumber
      };

      if (profileForm.avatar) payload.avatar = profileForm.avatar;

      const updatedProfile = await updateUserProfile(payload);
      setProfile((current: any) => ({ ...current, ...updatedProfile }));
      setIsEditing(false);
      setSuccessMessage('Profile updated successfully.');
      setStatusMessage('');

      if (isOwner) {
        localStorage.setItem('user', JSON.stringify({ ...currentUser, ...updatedProfile }));
        setCurrentUser((current: any) => ({ ...current, ...updatedProfile }));
      }
    } catch (error) {
      console.error(error);
      setStatusMessage('Unable to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const profileStatus = profile?.emailVerified ? 'Active' : 'Pending verification';

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="bg-slate-950 pb-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10">
          <div className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-slate-900 via-primary to-slate-800 p-6 shadow-2xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-5">
                <div className="relative h-28 w-28 overflow-hidden rounded-[2rem] border-4 border-white bg-slate-800">
                  {avatarImage ? (
                    <img src={avatarImage} alt="User avatar" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-700 text-3xl font-bold text-white">
                      {profile?.displayName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-300">School account</p>
                  <h1 className="mt-2 text-3xl font-bold text-white">{profile?.displayName || 'User Name'}</h1>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-300">
                    <span>{getRoleLabel(profile?.role)}</span>
                    {profile?.phoneNumber && (
                      <span className="inline-flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {profile.phoneNumber}
                      </span>
                    )}
                    {profile?.createdAt && (
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        Joined {new Date(profile.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {isOwner && !isEditing && (
                  <button
                    type="button"
                    onClick={startEdit}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg transition hover:bg-slate-100"
                  >
                    <Edit3 className="h-4 w-4" /> Edit profile
                  </button>
                )}
                <Link
                  to="/account-settings"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-hover transition"
                >
                  <Lock className="h-4 w-4" /> Account settings
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-16">
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
          <aside className="space-y-6">
            <div className="rounded-3xl border border-muted bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted">Account information</p>
              <div className="mt-6 space-y-4 text-sm text-text-secondary">
                <div className="rounded-3xl bg-background p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted">Role</p>
                  <p className="mt-2 text-text-primary">{getRoleLabel(profile?.role)}</p>
                </div>
                <div className="rounded-3xl bg-background p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted">Status</p>
                  <p className="mt-2 text-text-primary">{profileStatus}</p>
                </div>
                <div className="rounded-3xl bg-background p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted">Joined</p>
                  <p className="mt-2 text-text-primary">{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'}</p>
                </div>
                <div className="rounded-3xl bg-background p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted">Email</p>
                  <p className="mt-2 text-text-primary">{profile?.email || '—'}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-muted bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted">Security</p>
                  <h2 className="mt-2 text-lg font-semibold text-text-primary">Account security</h2>
                </div>
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <div className="mt-6 space-y-4">
                <div className="rounded-3xl bg-background p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted">Email verification</p>
                  <p className="mt-2 text-text-primary">{profile?.emailVerified ? 'Verified' : 'Not verified'}</p>
                </div>
                <div className="rounded-3xl bg-background p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted">Password</p>
                  <p className="mt-2 text-text-primary">Manage your password securely from account settings.</p>
                  <Link
                    to="/account-settings"
                    className="mt-3 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover transition"
                  >
                    Change password
                  </Link>
                </div>
              </div>
            </div>
          </aside>

          <main className="space-y-6">
            {successMessage && (
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{successMessage}</div>
            )}
            {statusMessage && !successMessage && (
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">{statusMessage}</div>
            )}

            <div className="rounded-3xl border border-muted bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-text-primary">Profile details</h2>
                  <p className="mt-1 text-sm text-text-secondary">Update your school management account information.</p>
                </div>
              </div>

              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-text-secondary">Full name</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={profileForm.displayName}
                    onChange={(event) => setProfileForm((current) => ({ ...current, displayName: event.target.value }))}
                    className="mt-2 w-full rounded-3xl border border-muted bg-background px-4 py-3 text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-secondary">Email address</label>
                  <input
                    type="email"
                    disabled
                    value={profile?.email || ''}
                    className="mt-2 w-full rounded-3xl border border-muted bg-background px-4 py-3 text-sm text-text-primary outline-none"
                    placeholder="Email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-secondary">Phone number</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={profileForm.phoneNumber}
                    onChange={(event) => setProfileForm((current) => ({ ...current, phoneNumber: event.target.value }))}
                    className="mt-2 w-full rounded-3xl border border-muted bg-background px-4 py-3 text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                    placeholder="+855 12 345 678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-secondary">Location</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={profileForm.location}
                    onChange={(event) => setProfileForm((current) => ({ ...current, location: event.target.value }))}
                    className="mt-2 w-full rounded-3xl border border-muted bg-background px-4 py-3 text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                    placeholder="City, Province"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-secondary">Role</label>
                  <input
                    type="text"
                    disabled
                    value={getRoleLabel(profile?.role)}
                    className="mt-2 w-full rounded-3xl border border-muted bg-background px-4 py-3 text-sm text-text-primary outline-none"
                    placeholder="Role"
                  />
                </div>
              </div>

              <div className="mt-6 grid gap-6 sm:grid-cols-[240px_1fr]">
                <div className="rounded-3xl border border-muted bg-background p-4 text-sm text-text-secondary">
                  <div className="flex items-center gap-3">
                    <div className="h-24 w-24 overflow-hidden rounded-[1.5rem] bg-white shadow-sm">
                      {avatarImage ? (
                        <img src={avatarImage} alt="Avatar preview" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-slate-200 text-2xl font-semibold text-slate-700">{profile?.displayName?.charAt(0).toUpperCase() || 'U'}</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.22em] text-muted">Profile photo</p>
                      <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-text-secondary shadow-sm ring-1 ring-border hover:bg-background transition">
                        <Camera className="h-4 w-4" />
                        {avatarPreview || profile?.avatar || profile?.profileImageUrl ? 'Change photo' : 'Upload photo'}
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>
                    </div>
                  </div>
                </div>

                {isEditing ? (
                  <div className="flex flex-wrap gap-3 justify-end items-end">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-3xl border border-muted bg-white px-6 py-3 text-sm font-semibold text-text-secondary hover:bg-background transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveProfile}
                      disabled={loading}
                      className="rounded-3xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-hover transition disabled:cursor-not-allowed disabled:bg-background"
                    >
                      Save profile
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
