import api from '../services/api';
import { getNotifications, getNotificationsCount, markNotificationRead } from '../services/notification.api';

jest.mock('../services/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), patch: jest.fn() }
}));

describe('notification.api', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('getNotifications returns data', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: { data: [{ id: 'n1' }] } });
    const res = await getNotifications();
    expect(api.get).toHaveBeenCalledWith('/notifications');
    expect(res).toEqual([{ id: 'n1' }]);
  });

  it('getNotificationsCount returns count or zero', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: { data: { count: 5 } } });
    const c = await getNotificationsCount();
    expect(api.get).toHaveBeenCalledWith('/notifications/count');
    expect(c).toBe(5);

    (api.get as jest.Mock).mockResolvedValue({ data: { data: null } });
    const c2 = await getNotificationsCount();
    expect(c2).toBe(0);
  });

  it('markNotificationRead calls patch and returns data', async () => {
    (api.patch as jest.Mock).mockResolvedValue({ data: { data: { ok: true } } });
    const res = await markNotificationRead('n1');
    expect(api.patch).toHaveBeenCalledWith('/notifications/n1/read');
    expect(res).toEqual({ ok: true });
  });
});
