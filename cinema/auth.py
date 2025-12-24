from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
from cinema.models import db, User
import re

auth_bp = Blueprint('auth_bp', __name__)

def is_valid_login(login):
    return re.fullmatch(r'[A-Za-z0-9!@#\$%\^&\*\(\)_\-\+=]+', login)

def is_valid_password(password):
    return re.fullmatch(r'[A-Za-z0-9!@#\$%\^&\*\(\)_\-\+=]+', password)

# --- Регистрация ---
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    name = data.get('name')
    login_val = data.get('login')
    password = data.get('password')

    if not name or not login_val or not password:
        return jsonify({'error':'Все поля обязательны'}), 400
    if not is_valid_login(login_val):
        return jsonify({'error':'Логин содержит недопустимые символы'}), 400
    if not is_valid_password(password):
        return jsonify({'error':'Пароль содержит недопустимые символы'}), 400
    if User.query.filter_by(login=login_val).first():
        return jsonify({'error':'Логин уже существует'}), 400

    user = User(name=name, login=login_val, password=generate_password_hash(password), role='user')
    db.session.add(user)
    db.session.commit()
    return jsonify({'message':'Регистрация успешна'}), 201

# --- Логин ---
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    login_val = data.get('login')
    password = data.get('password')
    user = User.query.filter_by(login=login_val).first()
    if user and check_password_hash(user.password, password):
        session['user_id'] = user.id
        session['role'] = user.role
        return jsonify({'message':'Вход успешен', 'role': user.role, 'name': user.name}), 200
    return jsonify({'error':'Неверный логин или пароль'}), 401

# --- Выход ---
@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message':'Выход выполнен'}), 200

# --- Удаление аккаунта ---
@auth_bp.route('/delete_account', methods=['POST'])
def delete_account():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error':'Неавторизованный пользователь'}), 401
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error':'Пользователь не найден'}), 404

    # Снимаем бронь пользователя со всех мест
    from cinema.models import Seat
    seats = Seat.query.filter_by(user_id=user.id).all()
    for seat in seats:
        seat.user_id = None

    db.session.delete(user)
    db.session.commit()
    session.clear()
    return jsonify({'message':'Аккаунт успешно удалён'})