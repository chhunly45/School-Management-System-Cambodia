import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getProfile } from '../services/auth.api';
import { getUserProfile, updateUserProfile } from '../services/user.api';
import { getProducts } from '../services/product.api';
import { getSellerReviews, createReview } from '../services/review.api';
import { useAuth } from '../hooks/useAuth';
import { getProvinces, getDistricts } from '../services/location.api';
import ProductCard from '../components/marketplace/ProductCard';
import { getProductCoverImageUrl } from '../utils/product';
import {
  MapPin,
  Mail,
  Phone,
  Shield,
  TrendingUp,
  CalendarDays,
  Link2,
  Globe,
  Edit3,
  Camera,
  Image,
  Star
} from 'lucide-react';
import { formatPriceKHR, formatPriceUSD } from '../utils/price';

const defaultCover = 'https://images.unsplash.com/photo-1528222354215-6da0c9bd62f9?auto=format&fit=crop&w=1600&q=80';
const defaultAvatar = 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=256&q=80';

const ProfilePage = () => {
  const { id: profileId } = useParams();
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewSummary, setReviewSummary] = useState<any>({ avgRating: 0, totalReviews: 0 });
  const [activeTab, setActiveTab] = useState<'products' | 'about' | 'reviews'>('products');
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [profileForm, setProfileForm] = useState({
    displayName: '',
    bio: '',
    location: '',
    phoneNumber: '',
    telegram: '',
    facebook: '',
    avatar: '',
    coverImage: ''
  });
  const [avatarPreview, setAvatarPreview] = useState('');
  const [coverPreview, setCoverPreview] = useState('');

  const isOwner = useMemo(() => {
    if (!profile) return false;
    if (profileId) {
      return currentUser?.id === profileId || currentUser?._id === profileId;
    }
    return Boolean(currentUser);
  }, [currentUser, profileId, profile]);

  const username = useMemo(() => {
    if (!profile?.displayName) return '@seller';
    return `@${profile.displayName.toLowerCase().replace(/\s+/g, '')}`;
  }, [profile]);

  const coverImage = coverPreview || profile?.coverImage || defaultCover;
  const avatarImage = avatarPreview || profile?.avatar || profile?.profileImageUrl || defaultAvatar;
  const stats = profile?.stats || {
    totalProducts: products.length,
    totalViews: products.reduce((sum, product) => sum + (product.viewsCount || 0), 0),
    favoritesCount: 0
  };

  const getLocationName = (province: number, district: number) => {
    const provinceObj = provinces.find((p) => p.id === province);
    if (!provinceObj) return '';
    if (!district) return provinceObj.name;
    const districtObj = provinceObj.districts?.find((d: any) => d.id === district);
    return districtObj ? `${districtObj.name}, ${provinceObj.name}` : provinceObj.name;
  };

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setStatusMessage('');
      try {
        const provincesList = await getProvinces();
        setProvinces(provincesList);

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
          const profileWithStats = await getUserProfile(profileData.id || profileData._id);
          finalProfile = profileWithStats;
        }

        setProfile(finalProfile);
        setAvatarPreview(finalProfile.avatar || finalProfile.profileImageUrl || '');
        setCoverPreview(finalProfile.coverImage || '');
        setProfileForm({
          displayName: finalProfile.displayName || '',
          bio: finalProfile.bio || '',
          location: finalProfile.location || '',
          phoneNumber: finalProfile.phoneNumber || '',
          telegram: finalProfile.telegram || '',
          facebook: finalProfile.facebook || '',
          avatar: '',
          coverImage: ''
        });

        if (finalProfile?.id || finalProfile?._id) {
          const [productsResponse, reviewsResponse] = await Promise.all([
            getProducts({ seller: finalProfile.id || finalProfile._id, page: '1', perPage: '12' }),
            getSellerReviews(finalProfile.id || finalProfile._id, { page: '1', perPage: '10' })
          ]);
          setProducts(productsResponse.items || []);
          setReviews(reviewsResponse.items || []);
          setReviewSummary(reviewsResponse.summary || { avgRating: 0, totalReviews: 0 });
        }
      } catch (error) {
        console.error(error);
        const response = (error as any)?.response;
        const message = response?.data?.message;
        if (response?.status === 401 && typeof message === 'string' && message.toLowerCase().includes('invalid or expired')) {
          return;
        }
        setStatusMessage('Unable to load profile.');
        setProfile(null);
        setProducts([]);
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

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>, field: 'avatar' | 'coverImage') => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await readFileAsDataUrl(file);
      if (field === 'avatar') {
        setAvatarPreview(dataUrl);
      } else {
        setCoverPreview(dataUrl);
      }
      setProfileForm((current) => ({ ...current, [field]: dataUrl }));
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
    setCoverPreview(profile?.coverImage || '');
  };

  const saveProfile = async () => {
    setLoading(true);
    setStatusMessage('Saving profile...');
    setSuccessMessage('');

    try {
      const payload: Record<string, any> = {
        displayName: profileForm.displayName,
        bio: profileForm.bio,
        location: profileForm.location,
        phoneNumber: profileForm.phoneNumber,
        telegram: profileForm.telegram,
        facebook: profileForm.facebook
      };

      if (profileForm.avatar) payload.avatar = profileForm.avatar;
      if (profileForm.coverImage) payload.coverImage = profileForm.coverImage;

      const updatedProfile = await updateUserProfile(payload);
      setProfile((current: any) => ({ ...current, ...updatedProfile, stats: current?.stats }));
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

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="relative h-64 sm:h-80 overflow-hidden bg-text-primary">
        <img src={coverImage} alt="Seller cover" className="h-full w-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-text-primary via-text-primary/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-5">
                <div className="relative -mt-12 h-32 w-32 overflow-hidden rounded-[2rem] border-4 border-white bg-background shadow-2xl">
                  <img src={avatarImage} alt="Seller avatar" className="h-full w-full object-cover" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-bold text-white">{profile?.displayName || 'Seller Name'}</h1>
                    {profile?.verified && <Shield className="h-6 w-6 text-emerald-300" />}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted">
                    <span>{username}</span>
                    {profile?.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-4 w-4" /> {profile.location}
                      </span>
                    )}
                    {profile?.createdAt && (
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-4 w-4" /> Joined {new Date(profile.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {isOwner && (
                  <button
                    type="button"
                    onClick={startEdit}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-text-primary shadow-lg transition hover:bg-background"
                  >
                    <Edit3 className="h-4 w-4" /> Edit profile
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveTab('products')}
                  className={`rounded-full px-5 py-3 text-sm font-semibold transition ${activeTab === 'products' ? 'bg-primary text-white' : 'bg-white text-text-secondary hover:bg-background'}`}
                >
                  Products
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('about')}
                  className={`rounded-full px-5 py-3 text-sm font-semibold transition ${activeTab === 'about' ? 'bg-primary text-white' : 'bg-white text-text-secondary hover:bg-background'}`}
                >
                  About
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('reviews')}
                  className={`rounded-full px-5 py-3 text-sm font-semibold transition ${activeTab === 'reviews' ? 'bg-primary text-white' : 'bg-white text-text-secondary hover:bg-background'}`}
                >
                  Reviews
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr] -mt-10">
          <aside className="space-y-6">
            <div className="rounded-3xl border border-muted bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Seller profile</p>
                  <h2 className="mt-3 text-xl font-bold text-text-primary">{profile?.displayName || 'Seller'}</h2>
                </div>
                <div className="space-y-2 text-right">
                  <div className="rounded-3xl bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">
                    {profile?.role === 'seller' ? 'Seller' : 'User'}
                  </div>
                  {profile?.sellerVerificationStatus === 'verified' ? (
                    <div className="rounded-3xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                      Verified Seller ✓
                    </div>
                  ) : profile?.sellerVerificationStatus === 'unverified' ? (
                    <div className="rounded-3xl bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-700">
                      Unverified Seller
                    </div>
                  ) : null}
                  {profile?.sellerVerificationStatus === 'unverified' && authUser?.id === profile?.id && (
                    <button
                      type="button"
                      onClick={() => window.location.assign('/verification/request')}
                      className="ml-2 inline-flex rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-hover transition"
                    >
                      Request verification
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-background p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted">Listings</p>
                  <p className="mt-3 text-2xl font-semibold text-text-primary">{stats.totalProducts}</p>
                </div>
                <div className="rounded-3xl bg-background p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted">Views</p>
                  <p className="mt-3 text-2xl font-semibold text-text-primary">{stats.totalViews}</p>
                </div>
                <div className="rounded-3xl bg-background p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted">Favorites</p>
                  <p className="mt-3 text-2xl font-semibold text-text-primary">{stats.favoritesCount}</p>
                </div>
                <div className="rounded-3xl bg-background p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted">Member since</p>
                  <p className="mt-3 text-2xl font-semibold text-text-primary">{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-muted bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted">Verification</p>
                {profile?.emailVerified ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <Shield className="h-4 w-4" /> Verified
                  </span>
                ) : null}
              </div>
              <div className="mt-4 space-y-3 text-sm text-text-secondary">
                <div className="rounded-3xl bg-background p-4">
                  <p className="font-semibold text-text-primary">Status</p>
                  <p className="mt-2">
                    {profile?.sellerVerificationStatus === 'unverified'
                      ? 'Unverified seller'
                      : profile?.emailVerified
                      ? 'Email verified'
                      : profile?.verified
                      ? 'Seller verified'
                      : profile?.verificationStatus === 'pending'
                      ? 'Verification pending'
                      : profile?.verificationStatus === 'rejected'
                      ? 'Verification rejected'
                      : 'Not verified'}
                  </p>
                </div>
                {profile?.sellerVerificationStatus === 'unverified' && authUser?.id === profile?.id && (
                  <div className="rounded-3xl border border-muted bg-white p-4 text-sm text-text-secondary">
                    <p className="font-semibold text-text-primary">Want higher buyer trust?</p>
                    <p className="mt-2">Submit your verification request to get a verified seller badge.</p>
                    <button
                      type="button"
                      onClick={() => window.location.assign('/verification/request')}
                      className="mt-4 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover transition"
                    >
                      Request verification
                    </button>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 text-text-secondary">
                  <span className="inline-flex items-center gap-2 rounded-3xl bg-background px-3 py-2">
                    <Shield className="h-4 w-4 text-green-500" /> Secure transactions
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-3xl bg-background px-3 py-2">
                    <TrendingUp className="h-4 w-4 text-primary" /> Fast response
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-muted bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted">Contact actions</p>
              <div className="mt-5 grid gap-3">
                {profile?.phoneNumber ? (
                  <a
                    href={`tel:${profile.phoneNumber}`}
                    className="inline-flex items-center justify-center rounded-3xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover"
                  >
                    Call seller
                  </a>
                ) : null}
                {profile?.email ? (
                  <a
                    href={`mailto:${profile.email}`}
                    className="inline-flex items-center justify-center rounded-3xl bg-text-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover"
                  >
                    Email seller
                  </a>
                ) : null}
                {profile?.telegram ? (
                  <a
                    href={profile.telegram.startsWith('http') ? profile.telegram : `https://t.me/${profile.telegram.replace(/^@/, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-3xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    Telegram
                  </a>
                ) : null}
                {profile?.facebook ? (
                  <a
                    href={profile.facebook.startsWith('http') ? profile.facebook : profile.facebook.startsWith('facebook.com') ? `https://${profile.facebook}` : `https://www.facebook.com/${profile.facebook.replace(/^\//, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-3xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover"
                  >
                    Facebook
                  </a>
                ) : null}
                {!profile?.phoneNumber && !profile?.email && !profile?.telegram && !profile?.facebook ? (
                  <p className="rounded-3xl bg-background p-4 text-sm text-muted">No direct contact details available yet.</p>
                ) : null}
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

            {isEditing ? (
              <div className="rounded-3xl border border-muted bg-white p-6 shadow-sm">
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-text-secondary">Display name</label>
                    <input
                      className="w-full rounded-3xl border border-muted bg-background px-4 py-3 text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      value={profileForm.displayName}
                      onChange={(event) => setProfileForm((current) => ({ ...current, displayName: event.target.value }))}
                      placeholder="Display name"
                    />
                    <label className="block text-sm font-semibold text-text-secondary">About</label>
                    <textarea
                      className="w-full rounded-3xl border border-muted bg-background px-4 py-3 text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      rows={5}
                      value={profileForm.bio}
                      onChange={(event) => setProfileForm((current) => ({ ...current, bio: event.target.value }))}
                      placeholder="Tell buyers about your store"
                    />
                    <label className="block text-sm font-semibold text-text-secondary">Location</label>
                    <input
                      className="w-full rounded-3xl border border-muted bg-background px-4 py-3 text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      value={profileForm.location}
                      onChange={(event) => setProfileForm((current) => ({ ...current, location: event.target.value }))}
                      placeholder="City, Province"
                    />
                    <label className="block text-sm font-semibold text-text-secondary">Phone number</label>
                    <input
                      className="w-full rounded-3xl border border-muted bg-background px-4 py-3 text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      value={profileForm.phoneNumber}
                      onChange={(event) => setProfileForm((current) => ({ ...current, phoneNumber: event.target.value }))}
                      placeholder="+855 12 345 678"
                    />
                    <label className="block text-sm font-semibold text-text-secondary">Telegram</label>
                    <input
                      className="w-full rounded-3xl border border-muted bg-background px-4 py-3 text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      value={profileForm.telegram}
                      onChange={(event) => setProfileForm((current) => ({ ...current, telegram: event.target.value }))}
                      placeholder="@yourusername"
                    />
                    <label className="block text-sm font-semibold text-text-secondary">Facebook</label>
                    <input
                      className="w-full rounded-3xl border border-muted bg-background px-4 py-3 text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      value={profileForm.facebook}
                      onChange={(event) => setProfileForm((current) => ({ ...current, facebook: event.target.value }))}
                      placeholder="facebook.com/yourpage"
                    />
                  </div>

                  <div className="space-y-6">
                    <div className="rounded-3xl border border-muted bg-background p-4 text-sm text-text-secondary">
                      <div className="flex items-center gap-3">
                        <Camera className="h-5 w-5 text-muted" />
                        <span className="font-semibold text-text-secondary">Avatar</span>
                      </div>
                      <div className="mt-4 flex items-center gap-4">
                        <div className="h-20 w-20 overflow-hidden rounded-3xl bg-white">
                          <img src={avatarPreview || defaultAvatar} alt="Avatar preview" className="h-full w-full object-cover" />
                        </div>
                        <label className="cursor-pointer rounded-3xl bg-white px-4 py-3 text-sm font-semibold text-text-secondary shadow-sm ring-1 ring-border hover:bg-background transition">
                          Choose avatar
                          <input type="file" accept="image/*" className="hidden" onChange={(event) => handleImageUpload(event, 'avatar')} />
                        </label>
                      </div>
                    </div>
                    <div className="rounded-3xl border border-muted bg-background p-4 text-sm text-text-secondary">
                      <div className="flex items-center gap-3">
                        <Image className="h-5 w-5 text-muted" />
                        <span className="font-semibold text-text-secondary">Cover image</span>
                      </div>
                      <div className="mt-4">
                        <div className="h-32 overflow-hidden rounded-3xl bg-white">
                          <img src={coverPreview || defaultCover} alt="Cover preview" className="h-full w-full object-cover" />
                        </div>
                        <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-3xl bg-white px-4 py-3 text-sm font-semibold text-text-secondary shadow-sm ring-1 ring-border hover:bg-background transition">
                          Choose cover
                          <input type="file" accept="image/*" className="hidden" onChange={(event) => handleImageUpload(event, 'coverImage')} />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
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
              </div>
            ) : null}

            {activeTab === 'products' && !isEditing && (
              <div className="rounded-3xl border border-muted bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-lg font-bold text-text-primary">Products by {profile?.displayName || 'this seller'}</h2>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => window.location.assign('/post-product')}
                      className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover transition"
                    >
                      Post new product
                    </button>
                  )}
                </div>
                <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {loading ? (
                    <div className="col-span-full rounded-3xl border border-muted bg-background p-8 text-center text-muted">Loading products…</div>
                  ) : products.length > 0 ? (
                    products.map((product) => (
                      <ProductCard
                        key={product._id || product.id}
                        id={product.slug || product._id || product.id}
                        title={product.title}
                        price={product.price}
                        location={product.location}
                        category={product.category?.labelKh || product.category?.name}
                        imageUrl={getProductCoverImageUrl(product, product.imageUrl || '')}
                        viewsCount={product.viewsCount}
                        featured={product.featured || product.isFeatured}
                        seller={product.seller}
                      />
                    ))
                  ) : (
                    <div className="col-span-full rounded-3xl border border-dashed border-muted bg-background p-10 text-center text-muted">
                      {profileId ? 'This seller has no active listings yet.' : 'You have no active listings yet.'}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'about' && !isEditing && (
              <div className="rounded-3xl border border-muted bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-text-primary">About this Seller</h2>
                <div className="mt-6 space-y-6 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-text-secondary">Biography</p>
                      <p className="mt-3 text-text-secondary">{profile?.bio || 'No biography has been added yet.'}</p>
                    </div>
                  </div>
                  <div className="rounded-3xl bg-background p-6">
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted">Contact information</p>
                    <div className="mt-4 space-y-3 text-text-secondary">
                      {profile?.phoneNumber && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted" />
                          <a className="text-text-secondary hover:text-primary" href={`tel:${profile.phoneNumber}`}>
                            {profile.phoneNumber}
                          </a>
                        </div>
                      )}
                      {profile?.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted" />
                          <a className="text-text-secondary hover:text-primary" href={`mailto:${profile.email}`}>
                            {profile.email}
                          </a>
                        </div>
                      )}
                      {profile?.telegram && (
                        <div className="flex items-center gap-2">
                          <Link2 className="h-4 w-4 text-muted" />
                          <a
                            className="text-text-secondary hover:text-primary"
                            href={profile.telegram.startsWith('http') ? profile.telegram : `https://t.me/${profile.telegram.replace(/^@/, '')}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {profile.telegram}
                          </a>
                        </div>
                      )}
                      {profile?.facebook && (
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted" />
                          <a
                            className="text-text-secondary hover:text-primary"
                            href={profile.facebook.startsWith('http') ? profile.facebook : `https://www.facebook.com/${profile.facebook.replace(/^\//, '')}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {profile.facebook}
                          </a>
                        </div>
                      )}
                      {profile?.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted" />
                          <span>{profile.location}</span>
                        </div>
                      )}
                      {(profile?.province || profile?.district) && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted" />
                          <span>{getLocationName(profile.province, profile.district)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && !isEditing && (
              <div className="rounded-3xl border border-muted bg-white p-6 shadow-sm space-y-6">
                <div className="flex flex-wrap items-center gap-6">
                  <div>
                    <p className="text-sm text-muted">Average Rating</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-3xl font-bold text-text-primary">{reviewSummary.avgRating.toFixed(1)}</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star key={i} className={`h-5 w-5 ${i <= Math.round(reviewSummary.avgRating) ? 'fill-amber-400 text-amber-400' : 'text-muted'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-3xl bg-background px-6 py-4">
                    <p className="text-sm text-muted">Total Reviews</p>
                    <p className="mt-2 text-2xl font-bold text-text-primary">{reviewSummary.totalReviews}</p>
                  </div>
                </div>

                {authUser && !isOwner && (
                  <div className="border-t pt-6">
                    <h3 className="text-base font-semibold text-text-primary">Leave a Review</h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-text-secondary">Rating</label>
                        <div className="mt-2 flex gap-2">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setReviewForm({ ...reviewForm, rating: i })}
                              className="focus:outline-none transition"
                            >
                              <Star className={`h-6 w-6 ${i <= reviewForm.rating ? 'fill-amber-400 text-amber-400' : 'text-muted'}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary">Comment (optional)</label>
                        <textarea
                          value={reviewForm.comment}
                          onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                          placeholder="Share your experience..."
                          className="mt-2 w-full rounded-3xl border border-muted bg-background px-4 py-3 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                          rows={4}
                          disabled={reviewLoading}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!profile?.id && !profile?._id) return;
                          setReviewLoading(true);
                          try {
                            await createReview({
                              seller: profile.id || profile._id,
                              rating: reviewForm.rating,
                              comment: reviewForm.comment
                            });
                            setReviewForm({ rating: 5, comment: '' });
                            const updated = await getSellerReviews(profile.id || profile._id, { page: '1', perPage: '10' });
                            setReviews(updated.items || []);
                            setReviewSummary(updated.summary || { avgRating: 0, totalReviews: 0 });
                            setSuccessMessage('Review posted successfully!');
                            setTimeout(() => setSuccessMessage(''), 4000);
                          } catch (err: any) {
                            const errorMsg = err.response?.data?.message || 'Unable to post review';
                            setStatusMessage(errorMsg);
                          } finally {
                            setReviewLoading(false);
                          }
                        }}
                        disabled={reviewLoading}
                        className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-hover transition disabled:opacity-50"
                      >
                        {reviewLoading ? 'Posting...' : 'Post Review'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-4 border-t pt-6">
                  <h3 className="text-base font-semibold text-text-primary">All Reviews</h3>
                  {reviews.length > 0 ? (
                    reviews.map((review: any) => (
                      <div key={review._id} className="rounded-3xl bg-background p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-text-primary">{review.reviewer?.displayName || 'Anonymous'}</p>
                            <div className="mt-1 flex gap-1">
                              {[1, 2, 3, 4, 5].map((i) => (
                                <Star key={i} className={`h-4 w-4 ${i <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted'}`} />
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-muted">{new Date(review.createdAt).toLocaleDateString()}</p>
                        </div>
                        {review.comment && <p className="mt-2 text-sm text-text-secondary">{review.comment}</p>}
                      </div>
                    ))
                  ) : (
                    <p className="text-text-secondary">No reviews yet. Be the first to share your experience!</p>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;


