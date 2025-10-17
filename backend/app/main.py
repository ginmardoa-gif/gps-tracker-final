from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from flask_bcrypt import Bcrypt
from app.config import Config
from app.models import db, Vehicle, Location, SavedLocation, User
from datetime import datetime, timedelta
import math

app = Flask(__name__)
app.config.from_object(Config)
CORS(app, 
     supports_credentials=True, 
     origins=[
         'http://192.168.100.222:3000',
         'https://192.168.100.222:8443',
         'http://192.168.100.222:8080'
     ],
     allow_headers=['Content-Type', 'Authorization'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])

db.init_app(app)
bcrypt = Bcrypt(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

with app.app_context():
    db.create_all()
    
    if Vehicle.query.count() == 0:
        for i in range(1, 6):
            vehicle = Vehicle(name=f'Vehicle {i}', device_id=f'device_{i}')
            db.session.add(vehicle)
        db.session.commit()
        print("Created 5 default vehicles")
    
    if User.query.count() == 0:
        admin_password = bcrypt.generate_password_hash('admin123').decode('utf-8')
        admin_user = User(
            username='admin', 
            email='admin@gpstracker.local', 
            password_hash=admin_password,
            role='admin'
        )
        db.session.add(admin_user)
        db.session.commit()
        print("Created default admin user (username: admin, password: admin123)")

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'message': 'GPS Tracker API is running'})

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json
    
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400
    
    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    user = User(
        username=data['username'], 
        email=data['email'], 
        password_hash=hashed_password,
        role=data.get('role', 'viewer')
    )
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({'message': 'User registered successfully'}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(username=data['username']).first()
    
    if user and bcrypt.check_password_hash(user.password_hash, data['password']):
        login_user(user, remember=True)
        return jsonify({
            'message': 'Login successful',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role
            }
        })
    
    return jsonify({'error': 'Invalid username or password'}), 401

@app.route('/api/auth/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'message': 'Logged out successfully'})

@app.route('/api/auth/check', methods=['GET'])
def check_auth():
    if current_user.is_authenticated:
        return jsonify({
            'authenticated': True,
            'user': {
                'id': current_user.id,
                'username': current_user.username,
                'email': current_user.email,
                'role': current_user.role
            }
        })
    return jsonify({'authenticated': False})

@app.route('/api/gps', methods=['POST'])
def receive_gps():
    data = request.json
    
    required_fields = ['device_id', 'latitude', 'longitude']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    vehicle = Vehicle.query.filter_by(device_id=data['device_id']).first()
    if not vehicle:
        return jsonify({'error': 'Vehicle not found'}), 404
    
    location = Location(
        vehicle_id=vehicle.id,
        latitude=float(data['latitude']),
        longitude=float(data['longitude']),
        speed=float(data.get('speed', 0.0)),
        timestamp=datetime.utcnow()
    )
    db.session.add(location)
    detect_and_save_stops(vehicle.id, location)
    db.session.commit()
    
    return jsonify({'message': 'GPS data received', 'vehicle': vehicle.name, 'location_id': location.id}), 201

def detect_and_save_stops(vehicle_id, current_location):
    time_window = datetime.utcnow() - timedelta(minutes=10)
    recent_locations = Location.query.filter(
        Location.vehicle_id == vehicle_id,
        Location.timestamp >= time_window
    ).order_by(Location.timestamp.desc()).all()
    
    if len(recent_locations) < 5:
        return
    
    first_loc = recent_locations[-1]
    distance = calculate_distance(
        first_loc.latitude, first_loc.longitude,
        current_location.latitude, current_location.longitude
    )
    
    if distance < 0.05 and len(recent_locations) >= 5:
        time_diff = (current_location.timestamp - first_loc.timestamp).total_seconds() / 60
        
        if time_diff >= 5:
            existing_stop = SavedLocation.query.filter(
                SavedLocation.vehicle_id == vehicle_id,
                SavedLocation.timestamp >= time_window
            ).first()
            
            if not existing_stop:
                saved_loc = SavedLocation(
                    vehicle_id=vehicle_id,
                    name='Auto-detected Stop',
                    latitude=current_location.latitude,
                    longitude=current_location.longitude,
                    stop_duration_minutes=int(time_diff),
                    visit_type='auto_detected',
                    timestamp=first_loc.timestamp
                )
                db.session.add(saved_loc)

def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

@app.route('/api/vehicles', methods=['GET'])
@login_required
def get_vehicles():
    # Return ALL vehicles (both active and inactive)
    vehicles = Vehicle.query.all()
    return jsonify([{
        'id': v.id,
        'name': v.name,
        'device_id': v.device_id,
        'is_active': v.is_active
    } for v in vehicles])

@app.route('/api/vehicles/<int:vehicle_id>/location', methods=['GET'])
@login_required
def get_vehicle_location(vehicle_id):
    location = Location.query.filter_by(vehicle_id=vehicle_id).order_by(Location.timestamp.desc()).first()
    
    if not location:
        return jsonify({'error': 'No location data'}), 404
    
    return jsonify({
        'latitude': location.latitude,
        'longitude': location.longitude,
        'speed': location.speed,
        'timestamp': location.timestamp.isoformat()
    })

@app.route('/api/vehicles/<int:vehicle_id>/history', methods=['GET'])
@login_required
def get_vehicle_history(vehicle_id):
    hours = request.args.get('hours', default=24, type=int)
    time_window = datetime.utcnow() - timedelta(hours=hours)
    
    locations = Location.query.filter(
        Location.vehicle_id == vehicle_id,
        Location.timestamp >= time_window
    ).order_by(Location.timestamp.asc()).all()
    
    return jsonify([{
        'latitude': loc.latitude,
        'longitude': loc.longitude,
        'speed': loc.speed,
        'timestamp': loc.timestamp.isoformat()
    } for loc in locations])

@app.route('/api/vehicles/<int:vehicle_id>/saved-locations', methods=['GET'])
@login_required
def get_saved_locations(vehicle_id):
    saved_locs = SavedLocation.query.filter_by(vehicle_id=vehicle_id).order_by(SavedLocation.timestamp.desc()).all()
    
    return jsonify([{
        'id': sl.id,
        'name': sl.name,
        'latitude': sl.latitude,
        'longitude': sl.longitude,
        'stop_duration_minutes': sl.stop_duration_minutes,
        'visit_type': sl.visit_type,
        'timestamp': sl.timestamp.isoformat(),
        'notes': sl.notes
    } for sl in saved_locs])

@app.route('/api/vehicles/<int:vehicle_id>/saved-locations', methods=['POST'])
@login_required
def save_location(vehicle_id):
    data = request.json
    
    saved_loc = SavedLocation(
        vehicle_id=vehicle_id,
        name=data.get('name', 'Saved Location'),
        latitude=float(data['latitude']),
        longitude=float(data['longitude']),
        visit_type='manual',
        notes=data.get('notes', '')
    )
    db.session.add(saved_loc)
    db.session.commit()
    
    return jsonify({'message': 'Location saved', 'id': saved_loc.id}), 201

@app.route('/api/vehicles/<int:vehicle_id>/saved-locations/<int:location_id>', methods=['PUT'])
@login_required
def update_saved_location(vehicle_id, location_id):
    data = request.json
    saved_loc = SavedLocation.query.filter_by(id=location_id, vehicle_id=vehicle_id).first()
    
    if not saved_loc:
        return jsonify({'error': 'Location not found'}), 404
    
    if 'name' in data:
        saved_loc.name = data['name']
    if 'notes' in data:
        saved_loc.notes = data['notes']
    
    db.session.commit()
    return jsonify({'message': 'Location updated', 'id': saved_loc.id})

@app.route('/api/vehicles/<int:vehicle_id>/saved-locations/<int:location_id>', methods=['DELETE'])
@login_required
def delete_saved_location(vehicle_id, location_id):
    saved_loc = SavedLocation.query.filter_by(id=location_id, vehicle_id=vehicle_id).first()
    
    if not saved_loc:
        return jsonify({'error': 'Location not found'}), 404
    
    db.session.delete(saved_loc)
    db.session.commit()
    return jsonify({'message': 'Location deleted'})

@app.route('/api/vehicles/<int:vehicle_id>/export', methods=['GET'])
@login_required
def export_vehicle_data(vehicle_id):
    format_type = request.args.get('format', 'json')
    hours = request.args.get('hours', default=24, type=int)
    time_window = datetime.utcnow() - timedelta(hours=hours)
    
    locations = Location.query.filter(
        Location.vehicle_id == vehicle_id,
        Location.timestamp >= time_window
    ).order_by(Location.timestamp.asc()).all()
    
    if format_type == 'csv':
        import io
        import csv
        
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(['Timestamp', 'Latitude', 'Longitude', 'Speed'])
        
        for loc in locations:
            writer.writerow([loc.timestamp.isoformat(), loc.latitude, loc.longitude, loc.speed])
        
        return output.getvalue(), 200, {
            'Content-Type': 'text/csv',
            'Content-Disposition': f'attachment; filename=vehicle_{vehicle_id}_data.csv'
        }
    
    return jsonify([{
        'timestamp': loc.timestamp.isoformat(),
        'latitude': loc.latitude,
        'longitude': loc.longitude,
        'speed': loc.speed
    } for loc in locations])

@app.route('/api/vehicles/<int:vehicle_id>/stats', methods=['GET'])
@login_required
def get_vehicle_stats(vehicle_id):
    hours = request.args.get('hours', default=24, type=int)
    time_window = datetime.utcnow() - timedelta(hours=hours)
    
    locations = Location.query.filter(
        Location.vehicle_id == vehicle_id,
        Location.timestamp >= time_window
    ).all()
    
    if not locations:
        return jsonify({'total_points': 0, 'avg_speed': 0, 'max_speed': 0, 'distance_km': 0})
    
    speeds = [loc.speed for loc in locations]
    avg_speed = sum(speeds) / len(speeds) if speeds else 0
    max_speed = max(speeds) if speeds else 0
    
    total_distance = 0
    for i in range(1, len(locations)):
        prev = locations[i-1]
        curr = locations[i]
        total_distance += calculate_distance(prev.latitude, prev.longitude, curr.latitude, curr.longitude)
    
    return jsonify({
        'total_points': len(locations),
        'avg_speed': round(avg_speed, 2),
        'max_speed': round(max_speed, 2),
        'distance_km': round(total_distance, 2),
        'time_period_hours': hours
    })

# ============= USER MANAGEMENT =============

@app.route('/api/users', methods=['GET'])
@login_required
def get_users():
    users = User.query.all()
    return jsonify([{
        'id': u.id,
        'username': u.username,
        'email': u.email,
        'is_active': u.is_active,
        'role': u.role,
        'created_at': u.created_at.isoformat()
    } for u in users])

@app.route('/api/users/<int:user_id>', methods=['PUT'])
@login_required
def update_user(user_id):
    data = request.json
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if 'username' in data:
        existing = User.query.filter_by(username=data['username']).first()
        if existing and existing.id != user_id:
            return jsonify({'error': 'Username already exists'}), 400
        user.username = data['username']
    
    if 'email' in data:
        existing = User.query.filter_by(email=data['email']).first()
        if existing and existing.id != user_id:
            return jsonify({'error': 'Email already exists'}), 400
        user.email = data['email']
    
    if 'password' in data and data['password']:
        user.password_hash = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    
    if 'is_active' in data:
        user.is_active = data['is_active']
    
    if 'role' in data:
        user.role = data['role']
    
    db.session.commit()
    return jsonify({'message': 'User updated successfully'})

@app.route('/api/users/<int:user_id>', methods=['DELETE'])
@login_required
def delete_user(user_id):
    if user_id == current_user.id:
        return jsonify({'error': 'Cannot delete your own account'}), 400
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'User deleted successfully'})

# ============= VEHICLE MANAGEMENT =============

@app.route('/api/vehicles', methods=['POST'])
@login_required
def create_vehicle():
    data = request.json
    
    existing = Vehicle.query.filter_by(device_id=data['device_id']).first()
    if existing:
        return jsonify({'error': 'Device ID already exists'}), 400
    
    vehicle = Vehicle(
        name=data['name'],
        device_id=data['device_id'],
        is_active=data.get('is_active', True)
    )
    
    db.session.add(vehicle)
    db.session.commit()
    
    return jsonify({
        'message': 'Vehicle created successfully',
        'vehicle': {
            'id': vehicle.id,
            'name': vehicle.name,
            'device_id': vehicle.device_id,
            'is_active': vehicle.is_active
        }
    }), 201

@app.route('/api/vehicles/<int:vehicle_id>', methods=['PUT'])
@login_required
def update_vehicle(vehicle_id):
    data = request.json
    vehicle = Vehicle.query.get(vehicle_id)
    
    if not vehicle:
        return jsonify({'error': 'Vehicle not found'}), 404
    
    if 'name' in data:
        vehicle.name = data['name']
    
    if 'device_id' in data:
        existing = Vehicle.query.filter_by(device_id=data['device_id']).first()
        if existing and existing.id != vehicle_id:
            return jsonify({'error': 'Device ID already exists'}), 400
        vehicle.device_id = data['device_id']
    
    if 'is_active' in data:
        vehicle.is_active = data['is_active']
    
    db.session.commit()
    return jsonify({'message': 'Vehicle updated successfully'})

@app.route('/api/vehicles/<int:vehicle_id>', methods=['DELETE'])
@login_required
def delete_vehicle(vehicle_id):
    vehicle = Vehicle.query.get(vehicle_id)
    
    if not vehicle:
        return jsonify({'error': 'Vehicle not found'}), 404
    
    db.session.delete(vehicle)
    db.session.commit()
    return jsonify({'message': 'Vehicle deleted successfully'})

# ============= PLACES OF INTEREST =============

@app.route('/api/places-of-interest', methods=['GET'])
@login_required
def get_places_of_interest():
    from app.models import PlaceOfInterest
    places = PlaceOfInterest.query.order_by(PlaceOfInterest.created_at.desc()).all()
    
    return jsonify([{
        'id': p.id,
        'name': p.name,
        'address': p.address,
        'latitude': p.latitude,
        'longitude': p.longitude,
        'category': p.category,
        'description': p.description,
        'created_at': p.created_at.isoformat(),
        'created_by': p.creator.username if p.creator else None
    } for p in places])

@app.route('/api/places-of-interest', methods=['POST'])
@login_required
def create_place_of_interest():
    from app.models import PlaceOfInterest
    data = request.json
    
    place = PlaceOfInterest(
        name=data['name'],
        address=data.get('address', ''),
        latitude=float(data['latitude']),
        longitude=float(data['longitude']),
        category=data.get('category', 'General'),
        description=data.get('description', ''),
        created_by=current_user.id
    )
    
    db.session.add(place)
    db.session.commit()
    
    return jsonify({
        'message': 'Place of interest created successfully',
        'place': {
            'id': place.id,
            'name': place.name,
            'latitude': place.latitude,
            'longitude': place.longitude
        }
    }), 201

@app.route('/api/places-of-interest/<int:place_id>', methods=['PUT'])
@login_required
def update_place_of_interest(place_id):
    from app.models import PlaceOfInterest
    place = PlaceOfInterest.query.get(place_id)
    
    if not place:
        return jsonify({'error': 'Place not found'}), 404
    
    data = request.json
    
    if 'name' in data:
        place.name = data['name']
    if 'address' in data:
        place.address = data['address']
    if 'latitude' in data:
        place.latitude = float(data['latitude'])
    if 'longitude' in data:
        place.longitude = float(data['longitude'])
    if 'category' in data:
        place.category = data['category']
    if 'description' in data:
        place.description = data['description']
    
    db.session.commit()
    return jsonify({'message': 'Place updated successfully'})

@app.route('/api/places-of-interest/<int:place_id>', methods=['DELETE'])
@login_required
def delete_place_of_interest(place_id):
    from app.models import PlaceOfInterest
    place = PlaceOfInterest.query.get(place_id)
    
    if not place:
        return jsonify({'error': 'Place not found'}), 404
    
    db.session.delete(place)
    db.session.commit()
    return jsonify({'message': 'Place deleted successfully'})

@app.route('/api/geocode', methods=['GET'])
@login_required
def geocode_address():
    """Geocode address using Nominatim (OpenStreetMap)"""
    address = request.args.get('address', '')
    
    if not address:
        return jsonify({'error': 'Address parameter required'}), 400
    
    import urllib.parse
    import urllib.request
    import json
    
    try:
        encoded_address = urllib.parse.quote(address)
        url = f'https://nominatim.openstreetmap.org/search?q={encoded_address}&format=json&limit=5'
        
        req = urllib.request.Request(url)
        req.add_header('User-Agent', 'GPS-Tracker-App/1.0')
        
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode())
            
        results = [{
            'name': item.get('display_name', ''),
            'latitude': float(item.get('lat', 0)),
            'longitude': float(item.get('lon', 0)),
            'type': item.get('type', ''),
            'importance': item.get('importance', 0)
        } for item in data]
        
        return jsonify(results)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
