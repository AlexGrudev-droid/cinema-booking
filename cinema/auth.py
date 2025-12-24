from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
from cinema.models import db, User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    name = data.get('name')
    login = data.get('login')
    password = data.get('password')

    if not name or not login or not password:
        return jsonify({'error': 'Заполните все поля'}), 400

    if User.query.filter_by(login=login).first():
        return jsonify({'error': 'Логин уже существует'}), 400

    user = User(
        name=name,
        login=login,
        password=generate_password_hash(password),
        role='user'
    )
    db.session.add(user)
    db.session.commit()

    return jsonify({'message': 'Регистрация успешна'}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    login = data.get('login')
    password = data.get('password')

    user = User.query.filter_by(login=login).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({'error': 'Неверный логин или пароль'}), 401

    session['user_id'] = user.id
    session['role'] = user.role
    session['name'] = user.name

    return jsonify({'message': 'Вход выполнен', 'role': user.role, 'name': user.name})

@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Выход выполнен'})