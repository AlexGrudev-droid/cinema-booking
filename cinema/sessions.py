from flask import Blueprint, request, jsonify, session
from datetime import datetime
from cinema.models import db, CinemaSession, Seat, User

sessions_bp = Blueprint('sessions', __name__)

def current_user():
    if 'user_id' not in session:
        return None
    return User.query.get(session['user_id'])

@sessions_bp.route('/sessions', methods=['GET'])
def get_sessions():
    sessions = CinemaSession.query.all()
    result = []
    now = datetime.now()
    for s in sessions:
        session_time = datetime.strptime(f"{s.date} {s.time}", "%Y-%m-%d %H:%M")
        result.append({
            'id': s.id,
            'movie': s.movie,
            'date': s.date,
            'time': s.time,
            'is_past': session_time < now
        })
    return jsonify(result)

@sessions_bp.route('/sessions', methods=['POST'])
def create_session():
    user = current_user()
    if not user or user.role != 'admin':
        return jsonify({'error': 'Доступ запрещён'}), 403
    data = request.json
    movie = data.get('movie')
    date = data.get('date')
    time = data.get('time')

    new_session = CinemaSession(movie=movie, date=date, time=time)
    db.session.add(new_session)
    db.session.commit()

    for i in range(1, 31):
        db.session.add(Seat(session_id=new_session.id, seat_number=i))
    db.session.commit()
    return jsonify({'message': 'Сеанс создан'}), 201

@sessions_bp.route('/sessions/<int:session_id>', methods=['DELETE'])
def delete_session(session_id):
    user = current_user()
    if not user or user.role != 'admin':
        return jsonify({'error': 'Доступ запрещён'}), 403

    Seat.query.filter_by(session_id=session_id).delete()
    CinemaSession.query.filter_by(id=session_id).delete()
    db.session.commit()
    return jsonify({'message': 'Сеанс удалён'})