from flask import Flask
from .config import Config
from .extensions import db, jwt, cors, celery
from .models import User, Role, Category, MenuItem, Table, Order, OrderItem, Bill

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})
    celery.conf.update(app.config)
    
    from .routes import auth_bp, api_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(api_bp, url_prefix='/api')
    
    return app
