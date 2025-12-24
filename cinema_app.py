from flask import Flask
from cinema.models import db
from cinema.auth import auth_bp
from cinema.sessions import sessions_bp
from cinema.seats import seats_bp
import os

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:////home/grudevalex/cinema-booking/db/cinema.db'  # <- сюда
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'secret-key-for-session'

from flask import render_template, session

# --- Маршрут для логина / регистрации ---
@app.route('/login')
def login_page():
    return render_template('cinema/login.html')

# --- Маршрут для списка сеансов ---
@app.route('/sessions')
def sessions_page():
    # Проверяем авторизацию
    if 'user_id' not in session:
        return render_template('cinema/login.html')
    return render_template('cinema/sessions.html')

# --- Маршрут для просмотра мест на сеанс ---
@app.route('/seats')
def seats_page():
    # Проверяем авторизацию
    if 'user_id' not in session:
        return render_template('cinema/login.html')
    return render_template('cinema/seats.html')

# Инициализация БД
db.init_app(app)

# Подключение Blueprints
app.register_blueprint(auth_bp, url_prefix='/api')
app.register_blueprint(sessions_bp, url_prefix='/api')
app.register_blueprint(seats_bp, url_prefix='/api')

# Создание базы и таблиц
with app.app_context():
    if not os.path.exists('db'):
        os.makedirs('db')
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True)