import api from '../services/api';
import { uploadImages, uploadBannerImage } from '../services/upload.api';

jest.mock('../services/api', () => ({
  __esModule: true,
  default: { post: jest.fn() }
}));

describe('upload.api', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('uploadImages calls api.post and returns data', async () => {
    (api.post as jest.Mock).mockResolvedValue({ data: { data: ['u1'] } });
    const file = new File(['x'], 'x.png', { type: 'image/png' });
    const res = await uploadImages([file]);
    expect(api.post).toHaveBeenCalledWith('/upload', expect.any(FormData), expect.objectContaining({ headers: expect.any(Object) }));
    expect(res).toEqual(['u1']);
  });

  it('uploadBannerImage calls api.post and returns data', async () => {
    (api.post as jest.Mock).mockResolvedValue({ data: { data: { url: 'b1' } } });
    const file = new File(['y'], 'y.png', { type: 'image/png' });
    const res = await uploadBannerImage(file);
    expect(api.post).toHaveBeenCalledWith('/banners/upload', expect.any(FormData), expect.objectContaining({ headers: expect.any(Object) }));
    expect(res).toEqual({ url: 'b1' });
  });
});
