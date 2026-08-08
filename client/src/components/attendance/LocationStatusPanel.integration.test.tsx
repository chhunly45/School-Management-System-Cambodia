import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import LocationStatusPanel from './LocationStatusPanel';

jest.mock('lucide-react', () => ({
  LocateFixed: () => <svg aria-label="locate-icon" />
}));

describe('LocationStatusPanel integration behavior', () => {
  const originalPermissions = navigator.permissions;
  const originalGeolocation = navigator.geolocation;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'permissions', {
      configurable: true,
      value: originalPermissions
    });

    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: originalGeolocation
    });
  });

  it('14) location permission denied state is surfaced', async () => {
    Object.defineProperty(navigator, 'permissions', {
      configurable: true,
      value: {
        query: jest.fn().mockResolvedValue({ state: 'denied' })
      }
    });

    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: jest.fn((success, error) => {
          error({ code: 1, message: 'User denied Geolocation' });
        })
      }
    });

    render(
      <LocationStatusPanel
        value={null}
        onChange={jest.fn()}
        maxAccuracyMeters={120}
        referenceLocation={{ latitude: 11.5564, longitude: 104.9282, label: 'school' }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /use current location/i }));

    await waitFor(() => {
      expect(screen.getByText(/denied/i)).toBeInTheDocument();
      expect(screen.getByText(/user denied geolocation/i)).toBeInTheDocument();
    });
  });
});
