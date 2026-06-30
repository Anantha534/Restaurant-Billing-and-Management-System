from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from .extensions import db
from .models import User, Role, Category, MenuItem, Table, Order, OrderItem, Bill
import datetime
import redis
import json
import logging

# Redis client set up for caching - Arvind
try:
    redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
    redis_client.ping() # test connection
except redis.ConnectionError:
    redis_client = None
    logging.warning("Redis is not available, running without cache.")

api_bp = Blueprint('api', __name__)
auth_bp = Blueprint('auth', __name__)

# Authentication APIs - Written by Deepak
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if User.query.filter_by(email=data.get('email')).first():
        return jsonify({'error': 'Email already exists'}), 400
    
    customer_role = Role.query.filter_by(name='customer').first()
    new_user = User(
        email=data['email'],
        name=data['name'],
        password=generate_password_hash(data['password']),
        role_id=customer_role.id
    )
    db.session.add(new_user)
    db.session.commit()
    
    access_token = create_access_token(identity={'id': new_user.id, 'role': 'customer', 'name': new_user.name})
    return jsonify(access_token=access_token, user={'id': new_user.id, 'name': new_user.name, 'role': 'customer'}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data.get('email')).first()
    if not user or not check_password_hash(user.password, data.get('password')):
        return jsonify({'error': 'Invalid credentials'}), 401
    if not user.is_active:
        return jsonify({'error': 'Account deactivated by admin'}), 403

    access_token = create_access_token(identity={'id': user.id, 'role': user.role.name, 'name': user.name})
    return jsonify(access_token=access_token, user={'id': user.id, 'name': user.name, 'role': user.role.name}), 200

# Menu and Categories logic added - Anantha & Arvind
@api_bp.route('/categories', methods=['GET', 'POST'])
def handle_categories():
    if request.method == 'GET':
        categories = Category.query.all()
        return jsonify([{'id': c.id, 'name': c.name, 'description': c.description} for c in categories])
    elif request.method == 'POST':
        data = request.get_json()
        new_cat = Category(name=data['name'], description=data.get('description'))
        db.session.add(new_cat)
        db.session.commit()
        return jsonify({'message': 'Category created'}), 201

@api_bp.route('/menu', methods=['GET', 'POST'])
def handle_menu():
    if request.method == 'GET':
        # Added 5-min Redis caching here machi - Deepan
        if redis_client:
            try:
                cached_menu = redis_client.get('menu_cache')
                if cached_menu:
                    return jsonify(json.loads(cached_menu))
            except redis.ConnectionError:
                pass

        items = MenuItem.query.all()
        result = [{
            'id': i.id, 'name': i.name, 'price': i.price, 'description': i.description,
            'is_vegetarian': i.is_vegetarian, 'is_available': i.is_available, 'category_id': i.category_id,
            'category_name': i.category.name if i.category else None
        } for i in items]
        
        if redis_client:
            try:
                redis_client.setex('menu_cache', 300, json.dumps(result)) # 5 min expiry
            except redis.ConnectionError:
                pass
        return jsonify(result)
        
    elif request.method == 'POST':
        data = request.get_json()
        new_item = MenuItem(
            name=data['name'], description=data.get('description'), price=data['price'],
            category_id=data['category_id'], is_vegetarian=data.get('is_vegetarian', True)
        )
        db.session.add(new_item)
        db.session.commit()
        if redis_client:
            try:
                redis_client.delete('menu_cache') # Invalidate cache
            except redis.ConnectionError:
                pass
        return jsonify({'message': 'Item added'}), 201

# Menu Item Edit/Delete logic - Anantha
@api_bp.route('/menu/<int:item_id>', methods=['PUT', 'DELETE'])
@jwt_required()
def update_menu_item(item_id):
    identity = get_jwt_identity()
    if identity.get('role') != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

    item = MenuItem.query.get_or_404(item_id)
    if request.method == 'PUT':
        data = request.get_json()
        item.name = data.get('name', item.name)
        item.price = data.get('price', item.price)
        item.description = data.get('description', item.description)
        item.is_vegetarian = data.get('is_vegetarian', item.is_vegetarian)
        item.is_available = data.get('is_available', item.is_available)
        db.session.commit()
        if redis_client:
            try:
                redis_client.delete('menu_cache')
            except redis.ConnectionError:
                pass
        return jsonify({'message': 'Item updated'})
    
    elif request.method == 'DELETE':
        db.session.delete(item)
        db.session.commit()
        if redis_client:
            try:
                redis_client.delete('menu_cache')
            except redis.ConnectionError:
                pass
        return jsonify({'message': 'Item deleted'})

@api_bp.route('/analytics', methods=['GET'])
@jwt_required()
def get_analytics():
    identity = get_jwt_identity()
    if identity.get('role') != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    # Analytics data generation - Deepak
    orders = Order.query.all()
    total_revenue = sum(b.total_amount for b in Bill.query.all()) if Bill.query.count() > 0 else 0
    dine_in = Order.query.filter_by(order_type='dine-in').count()
    takeaway = Order.query.filter_by(order_type='takeaway').count()
    
    return jsonify({
        'total_revenue': total_revenue,
        'total_orders': len(orders),
        'dine_in_count': dine_in,
        'takeaway_count': takeaway
    })

@api_bp.route('/tables', methods=['GET', 'POST'])
def handle_tables():
    if request.method == 'GET':
        tables = Table.query.all()
        return jsonify([{'id': t.id, 'table_number': t.table_number, 'capacity': t.seating_capacity, 'status': t.status} for t in tables])
    elif request.method == 'POST':
        data = request.get_json()
        new_table = Table(table_number=data['table_number'], seating_capacity=data['capacity'])
        db.session.add(new_table)
        db.session.commit()
        return jsonify({'message': 'Table added'}), 201

# Core Order Processing (Very important route!) - Deepan
@api_bp.route('/orders', methods=['GET', 'POST'])
@jwt_required()
def handle_orders():
    identity = get_jwt_identity()
    if request.method == 'GET':
        if identity['role'] == 'admin':
            orders = Order.query.all()
        else:
            orders = Order.query.filter_by(customer_id=identity['id']).all()
        
        result = []
        for o in orders:
            items = [{'name': i.menu_item.name, 'qty': i.quantity, 'subtotal': i.subtotal} for i in o.items]
            result.append({
                'id': o.id, 'status': o.status, 'type': o.order_type, 'placed_at': o.placed_at.isoformat(),
                'customer': o.customer.name, 'table': o.table.table_number if o.table else None,
                'items': items,
                'total': sum([i['subtotal'] for i in items])
            })
        return jsonify(result)
    elif request.method == 'POST':
        data = request.get_json()
        new_order = Order(
            customer_id=identity['id'],
            table_id=data.get('table_id'),
            order_type=data.get('type', 'dine-in')
        )
        db.session.add(new_order)
        db.session.flush()

        for item in data.get('items', []):
            menu_item = MenuItem.query.filter_by(name=item['name']).first()
            if menu_item:
                order_item = OrderItem(
                    order_id=new_order.id, menu_item_id=menu_item.id,
                    quantity=item.get('quantity', 1), unit_price=menu_item.price,
                    subtotal=menu_item.price * item.get('quantity', 1)
                )
                db.session.add(order_item)
        db.session.commit()
        return jsonify({'message': 'Order placed', 'order_id': new_order.id}), 201
