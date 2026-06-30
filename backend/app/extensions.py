from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from celery import Celery

db = SQLAlchemy()
jwt = JWTManager()
cors = CORS()
celery = Celery()
