import { getPostLoginPath } from './LoginPage';

describe('post-login routing', () => {
  it('routes teachers to teacher attendance', () => {
    expect(getPostLoginPath({ role: 'teacher' })).toBe('/teacher/attendance');
  });

  it('keeps administrators on the admin dashboard', () => {
    expect(getPostLoginPath({ role: 'admin' })).toBe('/admin/school-dashboard');
  });

  it('starts limited student/payment users on the Student workspace', () => {
    expect(getPostLoginPath({ role: 'LIMITED_STUDENT_PAYMENT' })).toBe('/admin/students');
  });

  it('keeps seller, user, and unknown roles on the default dashboard', () => {
    expect(getPostLoginPath({ role: 'seller' })).toBe('/dashboard');
    expect(getPostLoginPath({ role: 'user' })).toBe('/dashboard');
    expect(getPostLoginPath()).toBe('/dashboard');
  });
});