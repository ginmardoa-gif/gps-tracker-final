#!/bin/bash

# User Management Helper Script
# Quick commands for managing users from command line

echo "================================================"
echo "GPS Tracker - User Management"
echo "================================================"
echo ""
echo "1. List all users"
echo "2. Create new user"
echo "3. Change user role"
echo "4. Reset user password"
echo "5. Activate/Deactivate user"
echo "6. Delete user"
echo ""
read -p "Select option (1-6): " option

case $option in
    1)
        echo ""
        echo "All Users:"
        echo "------------------------------------------------"
        docker compose exec -T db psql -U gpsadmin gps_tracker -c "
        SELECT id, username, email, role, is_active, created_at 
        FROM users 
        ORDER BY id;"
        ;;
    
    2)
        echo ""
        read -p "Username: " username
        read -p "Email: " email
        read -s -p "Password: " password
        echo ""
        echo "Role options: admin, manager, operator, viewer"
        read -p "Role: " role
        
        docker compose exec backend python -c "
from app.models import db, User
from app.main import app, bcrypt
with app.app_context():
    hashed = bcrypt.generate_password_hash('$password').decode('utf-8')
    user = User(username='$username', email='$email', password_hash=hashed, role='$role')
    db.session.add(user)
    db.session.commit()
    print('✅ User created successfully!')
"
        ;;
    
    3)
        echo ""
        read -p "Username: " username
        echo "Role options: admin, manager, operator, viewer"
        read -p "New role: " role
        
        docker compose exec backend python -c "
from app.models import db, User
from app.main import app
with app.app_context():
    user = User.query.filter_by(username='$username').first()
    if user:
        user.role = '$role'
        db.session.commit()
        print('✅ Role updated to: $role')
    else:
        print('❌ User not found')
"
        ;;
    
    4)
        echo ""
        read -p "Username: " username
        read -s -p "New password: " password
        echo ""
        
        docker compose exec backend python -c "
from app.models import db, User
from app.main import app, bcrypt
with app.app_context():
    user = User.query.filter_by(username='$username').first()
    if user:
        user.password_hash = bcrypt.generate_password_hash('$password').decode('utf-8')
        db.session.commit()
        print('✅ Password updated successfully')
    else:
        print('❌ User not found')
"
        ;;
    
    5)
        echo ""
        read -p "Username: " username
        read -p "Activate? (yes/no): " activate
        
        if [ "$activate" = "yes" ]; then
            status="True"
        else
            status="False"
        fi
        
        docker compose exec backend python -c "
from app.models import db, User
from app.main import app
with app.app_context():
    user = User.query.filter_by(username='$username').first()
    if user:
        user.is_active = $status
        db.session.commit()
        print('✅ User status updated')
    else:
        print('❌ User not found')
"
        ;;
    
    6)
        echo ""
        read -p "Username to delete: " username
        read -p "Are you sure? (type 'DELETE' to confirm): " confirm
        
        if [ "$confirm" = "DELETE" ]; then
            docker compose exec backend python -c "
from app.models import db, User
from app.main import app
with app.app_context():
    user = User.query.filter_by(username='$username').first()
    if user:
        db.session.delete(user)
        db.session.commit()
        print('✅ User deleted')
    else:
        print('❌ User not found')
"
        else
            echo "❌ Deletion cancelled"
        fi
        ;;
    
    *)
        echo "Invalid option"
        ;;
esac

echo ""
