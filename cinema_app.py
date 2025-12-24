from flask import Flask, render_template, session, redirect, url_for
from cinema.models import db
from cinema.auth import auth_bp
from cinema.sessions import sessions_bp
from cinema.seats import seats_bp
import os

app = Flask(__name__)

# --- Настройки ---
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:////home/grudevalex/cinema-booking/db/cinema.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'secret-key-for-session'

# --- Инициализация БД ---
db.init_app(app)

# --- Подключение Blueprints ---
app.register_blueprint(auth_bp, url_prefix='/api')
app.register_blueprint(sessions_bp, url_prefix='/api')
app.register_blueprint(seats_bp, url_prefix='/api')

# --- Создание базы и таблиц ---
with app.app_context():
    if not os.path.exists('db'):
        os.makedirs('db')
    db.create_all()

    # Создание администратора, если его нет
    from werkzeug.security import generate_password_hash
    from cinema.models import User
    admin = User.query.filter_by(login='admin').first()
    if not admin:
        admin = User(name='Admin', login='admin', password=generate_password_hash('Admin123!'), role='admin')
        db.session.add(admin)
        db.session.commit()

# --- Редирект с корня на логин ---
@app.route('/')
def index():
    return redirect(url_for('login_page'))

# --- Маршруты фронтенда ---
@app.route('/login')
def login_page():
    return render_template('cinema/login.html')

@app.route('/sessions')
def sessions_page():
    if 'user_id' not in session:
        return redirect(url_for('login_page'))
    return render_template('cinema/sessions.html')

@app.route('/seats')
def seats_page():
    if 'user_id' not in session:
        return redirect(url_for('login_page'))
    return render_template('cinema/seats.html')

# --- Запуск локально ---
if __name__ == '__main__':
    app.run(debug=True)