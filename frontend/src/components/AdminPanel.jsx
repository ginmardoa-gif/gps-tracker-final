import React, { useState, useEffect } from 'react';

function AdminPanel({ currentUserRole }) {
  const [activeTab, setActiveTab] = useState('users');
  
  // If not admin, default to vehicles tab
  useEffect(() => {
    if (currentUserRole !== 'admin' && activeTab === 'users') {
      setActiveTab('vehicles');
    }
  }, [currentUserRole]);
  
  return (
    <div className="h-full flex flex-col bg-gray-100">
      <div className="bg-white shadow">
        <div className="flex border-b">
          {currentUserRole === 'admin' && (
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'users'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Users
            </button>
          )}
          <button
            onClick={() => setActiveTab('vehicles')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'vehicles'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Vehicles
          </button>
          <button
            onClick={() => setActiveTab('poi')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'poi'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Places of Interest
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'users' && currentUserRole === 'admin' && <UserManagement />}
        {activeTab === 'vehicles' && <VehicleManagement />}
        {activeTab === 'poi' && <POIManagement />}
      </div>
    </div>
  );
}

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'viewer',
    is_active: true
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users', { credentials: 'include' });
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setShowAddModal(false);
        setFormData({ username: '', email: '', password: '', role: 'viewer', is_active: true });
        fetchUsers();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to add user');
      }
    } catch (error) {
      alert('Error adding user');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setEditingUser(null);
        setFormData({ username: '', email: '', password: '', role: 'viewer', is_active: true });
        fetchUsers();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update user');
      }
    } catch (error) {
      alert('Error updating user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        fetchUsers();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete user');
      }
    } catch (error) {
      alert('Error deleting user');
    }
  };

  const getRoleBadgeColor = (role) => {
    switch(role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'operator': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">User Management</h2>
        <button
          onClick={() => {
            setFormData({ username: '', email: '', password: '', role: 'viewer', is_active: true });
            setShowAddModal(true);
          }}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
        >
          Add User
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">{user.username}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${getRoleBadgeColor(user.role)}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => {
                      setEditingUser(user);
                      setFormData({
                        username: user.username,
                        email: user.email,
                        password: '',
                        role: user.role,
                        is_active: user.is_active
                      });
                    }}
                    className="text-blue-600 hover:text-blue-800 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(showAddModal || editingUser) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">
              {editingUser ? 'Edit User' : 'Add New User'}
            </h3>
            <form onSubmit={editingUser ? handleUpdateUser : handleAddUser}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Password {editingUser && '(leave empty to keep current)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  required={!editingUser}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="viewer">Viewer (View only)</option>
                  <option value="operator">Operator (View + Track)</option>
                  <option value="manager">Manager (View + Track + Manage)</option>
                  <option value="admin">Admin (Full access)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.role === 'admin' && 'Full system access'}
                  {formData.role === 'manager' && 'Can manage vehicles and places'}
                  {formData.role === 'operator' && 'Can view and track vehicles'}
                  {formData.role === 'viewer' && 'Read-only access'}
                </p>
              </div>
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm">Active Account</span>
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
                >
                  {editingUser ? 'Update' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingUser(null);
                    setFormData({ username: '', email: '', password: '', role: 'viewer', is_active: true });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function VehicleManagement() {
  const [vehicles, setVehicles] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'inactive'
  const [formData, setFormData] = useState({
    name: '',
    device_id: '',
    is_active: true
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/vehicles', { credentials: 'include' });
      const data = await response.json();
      setVehicles(data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setShowAddModal(false);
        setFormData({ name: '', device_id: '', is_active: true });
        fetchVehicles();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to add vehicle');
      }
    } catch (error) {
      alert('Error adding vehicle');
    }
  };

  const handleUpdateVehicle = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/vehicles/${editingVehicle.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setEditingVehicle(null);
        setFormData({ name: '', device_id: '', is_active: true });
        fetchVehicles();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update vehicle');
      }
    } catch (error) {
      alert('Error updating vehicle');
    }
  };

  const handleToggleActive = async (vehicle) => {
    try {
      const response = await fetch(`/api/vehicles/${vehicle.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_active: !vehicle.is_active })
      });
      
      if (response.ok) {
        fetchVehicles();
      }
    } catch (error) {
      alert('Error toggling vehicle status');
    }
  };

  const handleDeleteVehicle = async (vehicleId) => {
    if (!window.confirm('Are you sure? This will delete all tracking data for this vehicle!')) return;
    
    try {
      const response = await fetch(`/api/vehicles/${vehicleId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        fetchVehicles();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete vehicle');
      }
    } catch (error) {
      alert('Error deleting vehicle');
    }
  };

  const filteredVehicles = vehicles.filter(v => {
    if (filterStatus === 'active') return v.is_active;
    if (filterStatus === 'inactive') return !v.is_active;
    return true;
  });

  return (
    <div className="max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Vehicle Management</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 rounded text-sm ${
                filterStatus === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All ({vehicles.length})
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-3 py-1 rounded text-sm ${
                filterStatus === 'active'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Active ({vehicles.filter(v => v.is_active).length})
            </button>
            <button
              onClick={() => setFilterStatus('inactive')}
              className={`px-3 py-1 rounded text-sm ${
                filterStatus === 'inactive'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Inactive ({vehicles.filter(v => !v.is_active).length})
            </button>
          </div>
        </div>
        <button
          onClick={() => {
            setFormData({ name: '', device_id: '', is_active: true });
            setShowAddModal(true);
          }}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
        >
          Add Vehicle
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredVehicles.map(vehicle => (
              <tr key={vehicle.id} className={!vehicle.is_active ? 'bg-gray-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap font-medium">{vehicle.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vehicle.device_id}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleToggleActive(vehicle)}
                    className={`px-3 py-1 text-xs rounded-full font-medium ${
                      vehicle.is_active 
                        ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {vehicle.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => {
                      setEditingVehicle(vehicle);
                      setFormData({
                        name: vehicle.name,
                        device_id: vehicle.device_id,
                        is_active: vehicle.is_active
                      });
                    }}
                    className="text-blue-600 hover:text-blue-800 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteVehicle(vehicle.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(showAddModal || editingVehicle) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">
              {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
            </h3>
            <form onSubmit={editingVehicle ? handleUpdateVehicle : handleAddVehicle}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Vehicle Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., Delivery Van 1"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Device ID</label>
                <input
                  type="text"
                  value={formData.device_id}
                  onChange={(e) => setFormData({...formData, device_id: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., device_6"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Must match the device ID used in mobile app</p>
              </div>
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm">Active</span>
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
                >
                  {editingVehicle ? 'Update' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingVehicle(null);
                    setFormData({ name: '', device_id: '', is_active: true });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function POIManagement() {
  const [places, setPlaces] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPlace, setEditingPlace] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    category: 'General',
    description: ''
  });

  useEffect(() => {
    fetchPlaces();
  }, []);

  const fetchPlaces = async () => {
    try {
      const response = await fetch('/api/places-of-interest', { credentials: 'include' });
      const data = await response.json();
      setPlaces(data);
    } catch (error) {
      console.error('Error fetching places:', error);
    }
  };

  const handleSearchAddress = async (address) => {
    if (address.length < 3) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`, {
        credentials: 'include'
      });
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Error searching address:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectSearchResult = (result) => {
    setFormData({
      ...formData,
      name: formData.name || result.name.split(',')[0],
      address: result.name,
      latitude: result.latitude.toString(),
      longitude: result.longitude.toString()
    });
    setSearchResults([]);
  };

  const handleAddPlace = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/places-of-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setShowAddModal(false);
        setFormData({ name: '', address: '', latitude: '', longitude: '', category: 'General', description: '' });
        fetchPlaces();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to add place');
      }
    } catch (error) {
      alert('Error adding place');
    }
  };

  const handleUpdatePlace = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/places-of-interest/${editingPlace.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setEditingPlace(null);
        setFormData({ name: '', address: '', latitude: '', longitude: '', category: 'General', description: '' });
        fetchPlaces();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update place');
      }
    } catch (error) {
      alert('Error updating place');
    }
  };

  const handleDeletePlace = async (placeId) => {
    if (!window.confirm('Are you sure you want to delete this place?')) return;
    
    try {
      const response = await fetch(`/api/places-of-interest/${placeId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        fetchPlaces();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete place');
      }
    } catch (error) {
      alert('Error deleting place');
    }
  };

  return (
    <div className="max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Places of Interest</h2>
        <button
          onClick={() => {
            setFormData({ name: '', address: '', latitude: '', longitude: '', category: 'General', description: '' });
            setShowAddModal(true);
          }}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
        >
          Add Place
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Coordinates</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {places.map(place => (
              <tr key={place.id}>
                <td className="px-6 py-4 whitespace-nowrap font-medium">{place.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{place.address || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                    {place.category}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => {
                      setEditingPlace(place);
                      setFormData({
                        name: place.name,
                        address: place.address || '',
                        latitude: place.latitude.toString(),
                        longitude: place.longitude.toString(),
                        category: place.category,
                        description: place.description || ''
                      });
                    }}
                    className="text-blue-600 hover:text-blue-800 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeletePlace(place.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(showAddModal || editingPlace) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {editingPlace ? 'Edit Place of Interest' : 'Add New Place of Interest'}
            </h3>
            <form onSubmit={editingPlace ? handleUpdatePlace : handleAddPlace}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Search Address</label>
                <input
                  type="text"
                  onChange={(e) => handleSearchAddress(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Search for an address..."
                />
                {searching && <p className="text-sm text-gray-500 mt-1">Searching...</p>}
                {searchResults.length > 0 && (
                  <div className="mt-2 border rounded-lg max-h-48 overflow-y-auto">
                    {searchResults.map((result, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectSearchResult(result)}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                      >
                        <div className="text-sm font-medium">{result.name}</div>
                        <div className="text-xs text-gray-500">
                          {result.latitude.toFixed(4)}, {result.longitude.toFixed(4)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., Main Warehouse"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Full address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Latitude *</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="5.8520"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Longitude *</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="-55.2038"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="General">General</option>
                  <option value="Customer">Customer</option>
                  <option value="Warehouse">Warehouse</option>
                  <option value="Office">Office</option>
                  <option value="Service">Service Center</option>
                  <option value="Parking">Parking</option>
                  <option value="Fuel">Fuel Station</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows="3"
                  placeholder="Additional notes..."
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
                >
                  {editingPlace ? 'Update' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingPlace(null);
                    setFormData({ name: '', address: '', latitude: '', longitude: '', category: 'General', description: '' });
                    setSearchResults([]);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
