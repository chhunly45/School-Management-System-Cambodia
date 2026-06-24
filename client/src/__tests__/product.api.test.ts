import { createProduct, uploadProductImages, getProducts, getProductById, deleteProductImage } from '../services/product.api';
import api from '../services/api';

jest.mock('../services/api');

const mockedApi = api as jest.Mocked<typeof api>;

describe('product.api', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('calls getProducts with query params', async () => {
    mockedApi.get.mockResolvedValue({ data: { data: { items: [], meta: { total: 0 } } } });
    const filters = { search: 'bike', minPrice: '100', maxPrice: '200' };
    await getProducts(filters);

    expect(mockedApi.get).toHaveBeenCalledWith('/products', { params: filters });
  });

  it('calls getProductById with the product id', async () => {
    mockedApi.get.mockResolvedValue({ data: { data: { _id: '123', title: 'Test Product' } } });
    await getProductById('123');

    expect(mockedApi.get).toHaveBeenCalledWith('/products/123');
  });

  it('creates a product and deletes product images', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: { data: { _id: '123', title: 'New Product' } } });
    const product = await createProduct({ title: 'New Product' });
    expect(product).toEqual({ _id: '123', title: 'New Product' });
    expect(mockedApi.post).toHaveBeenCalledWith('/products', { title: 'New Product' });

    const file = new File(['content'], 'test.png', { type: 'image/png' });
    mockedApi.post.mockResolvedValueOnce({ data: { data: { uploaded: true } } });
    const upload = await uploadProductImages('123', [file]);
    expect(upload).toEqual({ uploaded: true });
    expect(mockedApi.post).toHaveBeenCalledWith('/upload', expect.any(FormData), {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    mockedApi.delete.mockResolvedValueOnce({ data: { success: true } });
    const deleted = await deleteProductImage('img1');
    expect(deleted).toEqual({ success: true });
    expect(mockedApi.delete).toHaveBeenCalledWith('/upload/img1');
  });
});
