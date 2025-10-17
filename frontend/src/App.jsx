import React, { useState, useEffect } from 'react';
import Map from './components/Map';
import VehicleList from './components/VehicleList';
import VehicleHistory from './components/VehicleHistory';
import VehicleStats from './components/VehicleStats';
import Login from './components/Login';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehicleHistory, setVehicleHistory] = useState([]);
  const [savedLocations, setSavedLocations] = useState([]);
  const [historyHours, setHistoryHours] = useState(24);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/check', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.authenticated) {
        setIsAuthenticated(true);
        setCurrentUser(data.user);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (user) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      setIsAuthenticated(false);
      setCurrentUser(null);
      setVehicles([]);
      setSelectedVehicle(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/vehicles', {
        credentials: 'include'
      });
      const vehiclesData = await response.json();
      
      const vehiclesWithLocations = await Promise.all(
        vehiclesData.map(async (vehicle) => {
          try {
            const locResponse = await fetch(`/api/vehicles/${vehicle.id}/location`, {
              credentials: 'include'
            });
            if (locResponse.ok) {
              const location = await locResponse.json();
              return { ...vehicle, lastLocation: location };
            }
          } catch (err) {
            console.log(`No location for vehicle ${vehicle.id}`);
          }
          return vehicle;
        })
      );
      
      setVehicles(vehiclesWithLocations);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const fetchVehicleHistory = async (vehicleId) => {
    try {
      const response = await fetch(`/api/vehicles/${vehicleId}/history?hours=${historyHours}`, {
        credentials: 'include'
      });
      const data = await response.json();
      setVehicleHistory(data);
    } catch (error) {
      console.error('Error fetching history:', error);
      setVehicleHistory([]);
    }
  };

  const fetchSavedLocations = async (vehicleId) => {
    try {
      const response = await fetch(`/api/vehicles/${vehicleId}/saved-locations`, {
        credentials: 'include'
      });
      const data = await response.json();
      setSavedLocations(data);
    } catch (error) {
      console.error('Error fetching saved locations:', error);
      setSavedLocations([]);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchVehicles();
      const interval = setInterval(fetchVehicles, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedVehicle && isAuthenticated) {
      fetchVehicleHistory(selectedVehicle.id);
      fetchSavedLocations(selectedVehicle.id);
      
      const interval = setInterval(() => {
        fetchVehicleHistory(selectedVehicle.id);
        fetchSavedLocations(selectedVehicle.id);
      }, 10000);
      
      return () => clearInterval(interval);
    } else {
      setVehicleHistory([]);
      setSavedLocations([]);
    }
  }, [selectedVehicle, historyHours, isAuthenticated]);

  const handleSelectVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="text-4xl mb-4">📍</div>
          <div className="text-xl text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <header className="bg-blue-600 text-white p-4 shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">GPS Tracker Dashboard</h1>
            <p className="text-sm text-blue-100">Real-time vehicle tracking and location history</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium">{currentUser?.username}</div>
              <div className="text-xs text-blue-200">{currentUser?.email}</div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        <aside className="w-80 flex flex-col gap-4 overflow-y-auto">
          <VehicleList
            vehicles={vehicles}
            selectedVehicle={selectedVehicle}
            onSelectVehicle={handleSelectVehicle}
          />
          
          {selectedVehicle && (
            <>
              <div className="bg-white rounded-lg shadow p-4">
                <label className="block text-sm font-medium mb-2">History Duration</label>
                <select
                  value={historyHours}
                  onChange={(e) => setHistoryHours(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={1}>Last 1 hour</option>
                  <option value={6}>Last 6 hours</option>
                  <option value={24}>Last 24 hours</option>
                  <option value={72}>Last 3 days</option>
                  <option value={168}>Last 7 days</option>
                </select>
              </div>
              
              <VehicleHistory
                savedLocations={savedLocations}
                onRefresh={() => fetchSavedLocations(selectedVehicle.id)}
                vehicleId={selectedVehicle.id}
              />
              
              <VehicleStats
                vehicleId={selectedVehicle.id}
                historyHours={historyHours}
              />
            </>
          )}
        </aside>
        
        <main className="flex-1 bg-white rounded-lg shadow overflow-hidden">
          <Map
            vehicles={vehicles}
            selectedVehicle={selectedVehicle}
            vehicleHistory={vehicleHistory}
            savedLocations={savedLocations}
          />
        </main>
      </div>
    </div>
  );
}

export default App;
