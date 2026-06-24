import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { listBanners, createBanner, updateBanner, deleteBanner } from '../services/banner.api';
import { uploadBannerImage } from '../services/upload.api';

const AdminBannersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (!user) return navigate('/login');
    if (user.role !== 'admin') {
      setAccessDenied(true);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await listBanners();
      setBanners(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    try {
      const uploaded = await uploadBannerImage(file);
      return uploaded;
    } catch (err: any) {
      console.error('Image upload failed', err);
      throw new Error(err?.response?.data?.message || 'Image upload failed');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    const payload: any = {
      title: data.get('title'),
      subtitle: data.get('subtitle'),
      linkUrl: data.get('linkUrl'),
      position: data.get('position'),
      enabled: data.get('enabled') === 'on',
      sortOrder: Number(data.get('sortOrder') || 0)
    };

    const file = (form.querySelector('input[name="image"]') as HTMLInputElement).files?.[0];
    if (file) {
      try {
        const uploaded = await handleUpload(file as File);
        if (uploaded) {
          payload.imageUrl = uploaded.secureUrl || uploaded.url;
          payload.imagePublicId = uploaded.publicId;
        }
      } catch (err: any) {
        alert(err?.message || 'Failed to upload image.');
        return;
      }
    }

    try {
      if (editing) {
        await updateBanner(editing._id, payload);
      } else {
        await createBanner(payload);
      }
      form.reset();
      setEditing(null);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (item: any) => {
    setEditing(item);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this banner?')) return;
    try {
      await deleteBanner(id);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {accessDenied ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-8">
          <h1 className="text-2xl font-bold text-red-900 mb-2">Access Denied</h1>
          <p className="text-red-700 mb-6">You do not have permission to manage banners. Only administrators can access this page.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Back to Dashboard
          </button>
        </div>
      ) : (
        <>
          <h1 className="text-2xl font-bold mb-6">Manage Promotional Banners</h1>

      <form onSubmit={handleSave} className="space-y-4 mb-8 rounded-lg border border-muted bg-white p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input name="title" defaultValue={editing?.title || ''} placeholder="Title" className="p-3 border rounded" required />
          <input name="subtitle" defaultValue={editing?.subtitle || ''} placeholder="Subtitle" className="p-3 border rounded" />
          <input name="linkUrl" defaultValue={editing?.linkUrl || ''} placeholder="Link URL" className="p-3 border rounded" />
          <select name="position" defaultValue={editing?.position || 'top'} className="p-3 border rounded">
            <option value="top">Top</option>
            <option value="inline">Inline</option>
            <option value="sidebar">Sidebar</option>
          </select>
          <input name="sortOrder" defaultValue={editing?.sortOrder || 0} type="number" className="p-3 border rounded" />
          <label className="flex items-center gap-2"><input name="enabled" defaultChecked={editing?.enabled} type="checkbox" /> Enabled</label>
        </div>
        <div>
          <input name="image" type="file" accept="image/*" />
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-primary text-white rounded">Save</button>
          {editing && <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 border rounded">Cancel</button>}
        </div>
      </form>

      <div className="rounded-lg border border-muted bg-white p-6">
        <h2 className="text-lg font-semibold mb-4">Banners</h2>
        {loading ? <div>Loading…</div> : (
          <div className="space-y-3">
            {banners.map((b) => (
              <div key={b._id} className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-4">
                  {b.imageUrl && <img src={b.imageUrl} alt={b.title} className="w-36 h-16 object-cover rounded" />}
                  <div>
                    <div className="font-semibold">{b.title}</div>
                    <div className="text-sm text-text-secondary">{b.subtitle}</div>
                    <div className="text-xs text-text-secondary">Position: {b.position} • Enabled: {b.enabled ? 'yes' : 'no'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleEdit(b)} className="px-3 py-1 border rounded">Edit</button>
                  <button onClick={() => handleDelete(b._id)} className="px-3 py-1 bg-red-500 text-white rounded">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
};

export default AdminBannersPage;
