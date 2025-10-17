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
        admin_user = User(username='admin', email='admin@gpstracker.local', password_hash=admin_password)
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
    user = User(username=data['username'], email=data['email'], password_hash=hashed_password)
    
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
            'user': {'id': user.id, 'username': user.username, 'email': user.email}
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
            'user': {'id': current_user.id, 'username': current_user.username, 'email': current_user.email}
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
    vehicles = Vehicle.query.filter_by(is_active=True).all()
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

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
