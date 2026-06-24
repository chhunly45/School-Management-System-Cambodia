import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Bus, MapPin, Users } from 'lucide-react';

interface TransportRoute {
  _id: string;
  routeName: string;
  startPoint: string;
  endPoint: string;
  stops: number;
  vehicleId?: string;
  driverId?: string;
  departureTime: string;
  arrivalTime: string;
  studentsCount: number;
}

interface Vehicle {
  _id: string;
  registrationNumber: string;
  type: string;
  capacity: number;
  condition: 'good' | 'fair' | 'needs_repair';
  lastMaintenance: Date;
  driverName?: string;
}

interface StudentAssignment {
  _id: string;
  studentName: string;
  studentId: string;
  routeId: string;
  routeName: string;
  pickupLocation: string;
  dropoffLocation: string;
  status: 'active' | 'inactive' | 'transferred';
}

const TransportPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'routes' | 'vehicles' | 'assignments'>('routes');
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [assignments, setAssignments] = useState<StudentAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [editingRoute, setEditingRoute] = useState<TransportRoute | null>(null);

  useEffect(() => {
    if (!user) return navigate('/login');
    if (user.role !== 'admin') return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API calls
      // const routesData = await getTransportRoutes();
      // const vehiclesData = await getVehicles();
      // const assignmentsData = await getStudentAssignments();

      setRoutes([
        {
          _id: '1',
          routeName: 'Route A - North Zone',
          startPoint: 'Central Station',
          endPoint: 'North Market',
          stops: 5,
          vehicleId: 'V001',
          driverId: 'D001',
          departureTime: '07:00',
          arrivalTime: '08:00',
          studentsCount: 25
        },
        {
          _id: '2',
          routeName: 'Route B - South Zone',
          startPoint: 'Central Station',
          endPoint: 'South Park',
          stops: 4,
          vehicleId: 'V002',
          driverId: 'D002',
          departureTime: '07:15',
          arrivalTime: '08:15',
          studentsCount: 22
        },
        {
          _id: '3',
          routeName: 'Route C - East Zone',
          startPoint: 'Central Station',
          endPoint: 'East Mall',
          stops: 6,
          vehicleId: 'V003',
          driverId: 'D003',
          departureTime: '07:30',
          arrivalTime: '08:30',
          studentsCount: 28
        }
      ]);

      setVehicles([
        {
          _id: '1',
          registrationNumber: 'V001',
          type: 'Bus',
          capacity: 50,
          condition: 'good',
          lastMaintenance: new Date('2024-05-15'),
          driverName: 'Mr. Sokha'
        },
        {
          _id: '2',
          registrationNumber: 'V002',
          type: 'Mini Bus',
          capacity: 35,
          condition: 'good',
          lastMaintenance: new Date('2024-05-20'),
          driverName: 'Mr. Chea'
        },
        {
          _id: '3',
          registrationNumber: 'V003',
          type: 'Bus',
          capacity: 50,
          condition: 'fair',
          lastMaintenance: new Date('2024-04-10'),
          driverName: 'Mr. Pheap'
        }
      ]);

      setAssignments([
        {
          _id: '1',
          studentName: 'Sokha Minh',
          studentId: 'S001',
          routeId: '1',
          routeName: 'Route A - North Zone',
          pickupLocation: 'Central Station',
          dropoffLocation: 'North Market',
          status: 'active'
        },
        {
          _id: '2',
          studentName: 'Srey Nit',
          studentId: 'S002',
          routeId: '2',
          routeName: 'Route B - South Zone',
          pickupLocation: 'Central Station',
          dropoffLocation: 'South Park',
          status: 'active'
        },
        {
          _id: '3',
          studentName: 'Pheap Dev',
          studentId: 'S003',
          routeId: '1',
          routeName: 'Route A - North Zone',
          pickupLocation: 'Central Station',
          dropoffLocation: 'North Market',
          status: 'active'
        }
      ]);
    } catch (err) {
      setMessage('Unable to load transportation data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // TODO: Add API call to save route
      setEditingRoute(null);
      await loadData();
      setMessage('Route saved successfully.');
    } catch (err) {
      setMessage('Failed to save route.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoute = async (id: string) => {
    if (!confirm('Delete this route?')) return;
    setLoading(true);
    try {
      // TODO: Add API call to delete route
      await loadData();
      setMessage('Route deleted successfully.');
    } catch (err) {
      setMessage('Failed to delete route.');
    } finally {
      setLoading(false);
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'good':
        return 'bg-green-100 text-green-800';
      case 'fair':
        return 'bg-yellow-100 text-yellow-800';
      case 'needs_repair':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Transportation</h1>
        <p className="text-text-secondary">Manage routes, vehicles, and student assignments</p>
      </div>

      {message && (
        <div
          className={`rounded-lg p-4 ${
            message.includes('success') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b border-muted">
        <button
          onClick={() => setActiveTab('routes')}
          className={`px-4 py-3 font-medium transition border-b-2 ${
            activeTab === 'routes'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Routes ({routes.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('vehicles')}
          className={`px-4 py-3 font-medium transition border-b-2 ${
            activeTab === 'vehicles'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <div className="flex items-center gap-2">
            <Bus className="h-4 w-4" />
            Vehicles ({vehicles.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={`px-4 py-3 font-medium transition border-b-2 ${
            activeTab === 'assignments'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Assignments ({assignments.length})
          </div>
        </button>
      </div>

      {/* Routes Tab */}
      {activeTab === 'routes' && (
        <div className="space-y-6">
          <button
            onClick={() => setEditingRoute({} as TransportRoute)}
            className="rounded-lg bg-primary px-6 py-2 text-white font-medium hover:opacity-90 transition"
          >
            Add Route
          </button>

          {editingRoute && (
            <form onSubmit={handleSaveRoute} className="rounded-lg border border-muted bg-white p-6">
              <h3 className="text-xl font-semibold mb-4">
                {editingRoute._id ? 'Edit Route' : 'Add New Route'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Route Name"
                  defaultValue={editingRoute.routeName || ''}
                  className="rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
                  disabled={loading}
                />
                <input
                  type="text"
                  placeholder="Start Point"
                  defaultValue={editingRoute.startPoint || ''}
                  className="rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
                  disabled={loading}
                />
                <input
                  type="text"
                  placeholder="End Point"
                  defaultValue={editingRoute.endPoint || ''}
                  className="rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
                  disabled={loading}
                />
                <input
                  type="time"
                  placeholder="Departure Time"
                  defaultValue={editingRoute.departureTime || ''}
                  className="rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
                  disabled={loading}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-primary px-4 py-2 text-white font-medium hover:opacity-90 transition disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingRoute(null)}
                  className="rounded-lg border border-muted px-4 py-2 hover:bg-background transition"
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto rounded-lg border border-muted">
            <table className="w-full">
              <thead className="bg-background">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Route Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Start - End</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Time</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Students</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Driver</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {routes.map(route => (
                  <tr key={route._id} className="border-t border-muted hover:bg-background transition">
                    <td className="px-4 py-3 font-medium">{route.routeName}</td>
                    <td className="px-4 py-3 text-sm">
                      {route.startPoint} → {route.endPoint}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {route.departureTime} - {route.arrivalTime}
                    </td>
                    <td className="px-4 py-3">{route.studentsCount}</td>
                    <td className="px-4 py-3 text-sm">{route.driverId || '-'}</td>
                    <td className="px-4 py-3 space-x-2">
                      <button
                        onClick={() => setEditingRoute(route)}
                        className="text-primary hover:underline text-sm font-medium"
                        disabled={loading}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRoute(route._id)}
                        className="text-red-600 hover:underline text-sm font-medium"
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vehicles Tab */}
      {activeTab === 'vehicles' && (
        <div className="overflow-x-auto rounded-lg border border-muted">
          <table className="w-full">
            <thead className="bg-background">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Registration</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Capacity</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Condition</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Driver</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Last Maintenance</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map(vehicle => (
                <tr key={vehicle._id} className="border-t border-muted hover:bg-background transition">
                  <td className="px-4 py-3 font-medium">{vehicle.registrationNumber}</td>
                  <td className="px-4 py-3">{vehicle.type}</td>
                  <td className="px-4 py-3">{vehicle.capacity} seats</td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getConditionColor(vehicle.condition)}`}>
                      {vehicle.condition.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">{vehicle.driverName || '-'}</td>
                  <td className="px-4 py-3 text-sm">{new Date(vehicle.lastMaintenance).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Assignments Tab */}
      {activeTab === 'assignments' && (
        <div className="overflow-x-auto rounded-lg border border-muted">
          <table className="w-full">
            <thead className="bg-background">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Student</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Route</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Pickup Location</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Dropoff Location</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map(assignment => (
                <tr key={assignment._id} className="border-t border-muted hover:bg-background transition">
                  <td className="px-4 py-3 font-medium">{assignment.studentName}</td>
                  <td className="px-4 py-3 text-sm">{assignment.routeName}</td>
                  <td className="px-4 py-3 text-sm">{assignment.pickupLocation}</td>
                  <td className="px-4 py-3 text-sm">{assignment.dropoffLocation}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        assignment.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {assignment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TransportPage;
