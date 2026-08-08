import { useEffect, useMemo, useState } from 'react';
import { LocateFixed } from 'lucide-react';
import { calculateDistanceMeters, type GeoPoint } from '../../utils/geo';

type PermissionState = 'idle' | 'prompt' | 'granted' | 'denied' | 'unsupported' | 'error';

export type LocationStatus = 'Ready' | 'Permission Required' | 'Unavailable' | 'Low Accuracy';

export interface CapturedLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  capturedAt: string;
}

interface LocationStatusPanelProps {
  value: CapturedLocation | null;
  onChange: (value: CapturedLocation | null) => void;
  maxAccuracyMeters?: number;
  referenceLocation?: (GeoPoint & { label?: string }) | null;
  onStatusChange?: (status: LocationStatus) => void;
}

const formatCoordinate = (value: number): string => value.toFixed(6);

const formatPermission = (state: PermissionState): string => {
  if (state === 'granted') return 'Granted';
  if (state === 'denied') return 'Denied';
  if (state === 'prompt') return 'Prompt';
  if (state === 'unsupported') return 'Unsupported';
  if (state === 'error') return 'Error';
  return 'Idle';
};

const LocationStatusPanel = ({
  value,
  onChange,
  maxAccuracyMeters = 100,
  referenceLocation = null,
  onStatusChange
}: LocationStatusPanelProps) => {
  const [permissionState, setPermissionState] = useState<PermissionState>('idle');
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState('');

  const accuracyValid = typeof value?.accuracy === 'number' && value.accuracy <= maxAccuracyMeters;

  const resolveStatus = (): LocationStatus => {
    if (value && accuracyValid) return 'Ready';
    if (value && !accuracyValid) return 'Low Accuracy';
    if (permissionState === 'denied') return 'Permission Required';
    return 'Unavailable';
  };

  useEffect(() => {
    onStatusChange?.(resolveStatus());
  }, [accuracyValid, onStatusChange, permissionState, value]);

  const computedDistance = useMemo(() => {
    if (!value || !referenceLocation) return null;
    return calculateDistanceMeters(
      { latitude: value.latitude, longitude: value.longitude },
      { latitude: referenceLocation.latitude, longitude: referenceLocation.longitude }
    );
  }, [referenceLocation, value]);

  useEffect(() => {
    let mounted = true;

    const probePermission = async () => {
      if (!('geolocation' in navigator)) {
        if (mounted) setPermissionState('unsupported');
        return;
      }

      if (!('permissions' in navigator) || typeof navigator.permissions.query !== 'function') {
        if (mounted) setPermissionState('prompt');
        return;
      }

      try {
        const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        if (!mounted) return;

        const nextState = status.state;
        if (nextState === 'granted' || nextState === 'denied' || nextState === 'prompt') {
          setPermissionState(nextState);
        } else {
          setPermissionState('prompt');
        }

        status.onchange = () => {
          const state = status.state;
          if (state === 'granted' || state === 'denied' || state === 'prompt') {
            setPermissionState(state);
          }
        };
      } catch {
        if (mounted) setPermissionState('prompt');
      }
    };

    void probePermission();

    return () => {
      mounted = false;
    };
  }, []);

  const captureLocation = () => {
    if (!('geolocation' in navigator)) {
      setPermissionState('unsupported');
      setError('Geolocation is not supported on this browser.');
      return;
    }

    setCapturing(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next: CapturedLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          capturedAt: new Date(position.timestamp).toISOString()
        };

        onChange(next);
        setCapturing(false);
        setPermissionState('granted');
      },
      (geoError) => {
        setCapturing(false);
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setPermissionState('denied');
          setError('Location permission was denied. Please allow location access.');
          return;
        }
        setPermissionState('error');
        setError(geoError.message || 'Unable to capture location.');
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0
      }
    );
  };

  return (
    <section className="rounded-[2rem] bg-white p-6 shadow ring-1 ring-border" aria-label="Location status">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Location Status</h2>
          <p className="mt-1 text-sm text-text-secondary">Capture your current GPS location before attendance actions.</p>
        </div>
        <button
          type="button"
          onClick={captureLocation}
          disabled={capturing}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60"
        >
          <LocateFixed className="h-4 w-4" />
          {capturing ? 'Capturing...' : 'Use Current Location'}
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-2xl border border-muted bg-background p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Permission</p>
          <p className="mt-1 text-sm font-semibold text-text-primary">{formatPermission(permissionState)}</p>
        </article>
        <article className="rounded-2xl border border-muted bg-background p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Latitude</p>
          <p className="mt-1 text-sm font-semibold text-text-primary">{value ? formatCoordinate(value.latitude) : '-'}</p>
        </article>
        <article className="rounded-2xl border border-muted bg-background p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Longitude</p>
          <p className="mt-1 text-sm font-semibold text-text-primary">{value ? formatCoordinate(value.longitude) : '-'}</p>
        </article>
        <article className="rounded-2xl border border-muted bg-background p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Accuracy</p>
          <p className="mt-1 text-sm font-semibold text-text-primary">
            {value ? `${Math.round(value.accuracy)} m` : '-'}
          </p>
          {value && (
            <p className={`mt-1 text-xs ${accuracyValid ? 'text-emerald-700' : 'text-rose-700'}`}>
              {accuracyValid ? 'Accuracy accepted' : `Accuracy too low (must be <= ${maxAccuracyMeters} m)`}
            </p>
          )}
        </article>
      </div>

      {value?.capturedAt && (
        <p className="mt-3 text-xs text-text-secondary">Captured at: {new Date(value.capturedAt).toLocaleString()}</p>
      )}

      {computedDistance !== null && (
        <p className="mt-2 text-sm text-text-secondary">
          Distance to {referenceLocation?.label || 'reference point'}: {Math.round(computedDistance)} m
        </p>
      )}

      {error && <p className="mt-2 text-sm text-rose-700">{error}</p>}
    </section>
  );
};

export default LocationStatusPanel;
