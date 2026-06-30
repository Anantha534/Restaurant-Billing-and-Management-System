from .extensions import db
from datetime import datetime

# DB Models set up panniyachu - Anantha & Deepak
# Note: Do not change the table names here!

class Role(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    role_id = db.Column(db.Integer, db.ForeignKey('role.id'), nullable=False)
    role = db.relationship('Role')

class Category(db.Model):
    # Added description field for categories machi - Deepan
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.String(255))

class MenuItem(db.Model):
    # Menu items logic done by Arvind
    id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255))
    price = db.Column(db.Float, nullable=False)
    is_vegetarian = db.Column(db.Boolean, default=True)
    is_available = db.Column(db.Boolean, default=True)
    category = db.relationship('Category', backref='items')

class Table(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    table_number = db.Column(db.String(20), unique=True, nullable=False)
    seating_capacity = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), default='available')

class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    table_id = db.Column(db.Integer, db.ForeignKey('table.id'), nullable=True)
    order_type = db.Column(db.String(20), nullable=False)
    status = db.Column(db.String(20), default='placed')
    placed_at = db.Column(db.DateTime, default=datetime.utcnow)
    served_at = db.Column(db.DateTime, nullable=True)
    customer = db.relationship('User', backref='orders')
    table = db.relationship('Table', backref='orders')

class OrderItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=False)
    menu_item_id = db.Column(db.Integer, db.ForeignKey('menu_item.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    unit_price = db.Column(db.Float, nullable=False)
    subtotal = db.Column(db.Float, nullable=False)
    order = db.relationship('Order', backref='items')
    menu_item = db.relationship('MenuItem')

class Bill(db.Model):
    # Billing calculations are critical, let me handle this part - Deepan
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=False)
    total_amount = db.Column(db.Float, nullable=False)
    tax_amount = db.Column(db.Float, nullable=False)
    discount = db.Column(db.Float, default=0.0)
    grand_total = db.Column(db.Float, nullable=False)
    payment_mode = db.Column(db.String(20), nullable=True)
    billed_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default='unpaid')
    order = db.relationship('Order', backref=db.backref('bill', uselist=False))
