from app import create_app
from app.extensions import db
from app.models import User, Role, Category, MenuItem, Table
from werkzeug.security import generate_password_hash

app = create_app()

def seed_db():
    with app.app_context():
        db.create_all()

        admin_role = Role.query.filter_by(name='admin').first()
        if not admin_role:
            admin_role = Role(name='admin')
            db.session.add(admin_role)
            
        customer_role = Role.query.filter_by(name='customer').first()
        if not customer_role:
            customer_role = Role(name='customer')
            db.session.add(customer_role)
            
        db.session.commit()

        admin = User.query.filter_by(email='admin@ananthaskitchen.com').first()
        if not admin:
            admin = User(
                email='admin@ananthaskitchen.com',
                password=generate_password_hash('admin123'),
                name='Super Admin',
                role_id=admin_role.id
            )
            db.session.add(admin)
            
        cat_burger = Category.query.filter_by(name='Burgers').first()
        if not cat_burger:
            cat_burger = Category(name='Burgers', description='Delicious burgers')
            db.session.add(cat_burger)
            db.session.commit()
            db.session.add(MenuItem(category_id=cat_burger.id, name='Classic Burger', description='Juicy beef patty', price=199, is_vegetarian=False))
            
        cat_pizza = Category.query.filter_by(name='Pizzas').first()
        if not cat_pizza:
            cat_pizza = Category(name='Pizzas', description='Wood fired pizzas')
            db.session.add(cat_pizza)
            db.session.commit()
            db.session.add(MenuItem(category_id=cat_pizza.id, name='Margherita Pizza', description='Fresh mozzarella', price=349, is_vegetarian=True))

        t1 = Table.query.filter_by(table_number='T1').first()
        if not t1:
            db.session.add(Table(table_number='T1', seating_capacity=4))
            db.session.add(Table(table_number='T2', seating_capacity=2))
            
        db.session.commit()
        print("Database seeded successfully.")

if __name__ == '__main__':
    seed_db()
