from flask import Flask, render_template, session
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

# --- Создание базы и таблиц (если не существует) ---
with app.app_context():
    if not os.path.exists('db'):
        os.makedirs('db')
    db.create_all()

# --- Маршруты фронтенда ---
@app.route('/login')
def login_page():
    return render_template('cinema/login.html')

@app.route('/sessions')
def sessions_page():
    if 'user_id' not in session:
        return render_template('cinema/login.html')
    return render_template('cinema/sessions.html')

@app.route('/seats')
def seats_page():
    if 'user_id' not in session:
        return render_template('cinema/login.html')
    return render_template('cinema/seats.html')

# --- Запуск локально (для отладки) ---
if __name__ == '__main__':
    app.run(debug=True)