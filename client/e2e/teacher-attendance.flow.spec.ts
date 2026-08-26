import { test, expect } from '@playwright/test';

const teacherUser = {
  id: 'teacher-e2e-1',
  email: 'teacher.e2e@example.com',
  displayName: 'Teacher E2E',
  role: 'teacher'
};

test('teacher can complete browser-level check-in flow with location and QR token', async ({ page }) => {
  let checkedIn = false;

  await page.addInitScript((user) => {
    localStorage.setItem('authToken', 'e2e-auth-token');
    localStorage.setItem('user', JSON.stringify(user));

    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: (success: any) => {
          success({
            coords: {
              latitude: 11.5564,
              longitude: 104.9282,
              accuracy: 5
            },
            timestamp: Date.now()
          });
        }
      }
    });
  }, teacherUser);

  await page.route('**/api/**', async (route) => {
    const requestUrl = new URL(route.request().url());
    const pathname = requestUrl.pathname;

    if (pathname.endsWith('/api/teacher-attendance/today')) {
      const payload = checkedIn
        ? {
            success: true,
            data: {
              attendance: {
                _id: 'att-1',
                teacherId: 't-1',
                userId: 'u-1',
                attendanceDate: '2026-08-07',
                checkInTime: new Date().toISOString(),
                checkOutTime: null,
                attendanceMethod: 'QR',
                status: 'PRESENT',
                latitude: 11.5564,
                longitude: 104.9282,
                gpsAccuracy: 5
              },
              canCheckIn: false,
              canCheckOut: true
            }
          }
        : {
            success: true,
            data: {
              attendance: null,
              canCheckIn: true,
              canCheckOut: false
            }
          };

      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) });
      return;
    }

    if (pathname.endsWith('/api/teacher-attendance/check-in')) {
      checkedIn = true;
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            _id: 'att-1',
            teacherId: 't-1',
            userId: 'u-1',
            attendanceDate: '2026-08-07',
            checkInTime: new Date().toISOString(),
            checkOutTime: null,
            attendanceMethod: 'QR',
            status: 'PRESENT'
          }
        })
      });
      return;
    }

    if (pathname.endsWith('/api/teacher-attendance/history')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            items: checkedIn
              ? [
                  {
                    _id: 'att-1',
                    teacherId: 't-1',
                    userId: 'u-1',
                    attendanceDate: '2026-08-07',
                    checkInTime: new Date().toISOString(),
                    checkOutTime: null,
                    attendanceMethod: 'QR',
                    status: 'PRESENT'
                  }
                ]
              : [],
            meta: {
              page: 1,
              limit: 10,
              total: checkedIn ? 1 : 0
            }
          }
        })
      });
      return;
    }

    if (pathname.endsWith('/api/auth/me')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: teacherUser })
      });
      return;
    }

    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [] }) });
  });

  await page.goto('/teacher/attendance');

  await expect(page.getByRole('heading', { name: 'Attendance Dashboard' })).toBeVisible();

  await page.getByRole('button', { name: 'Use Current Location' }).click();
  await expect(page.getByText('Accuracy accepted')).toBeVisible();

  await page.getByPlaceholder('Enter QR token').fill('qr-e2e-token-0000001');
  await page.getByRole('button', { name: 'Check In' }).click();

  await expect(page.getByText('Check-in successful.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Check Out' })).toBeVisible();
});
