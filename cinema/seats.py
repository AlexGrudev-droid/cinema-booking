from flask import Blueprint, request, jsonify, session
from cinema.models import db, Seat, User

seats_bp = Blueprint('seats', __name__)

def current_user():
    if 'user_id' not in session:
        return None
    return User.query.get(session['user_id'])

@seats_bp.route('/sessions/<int:session_id>/seats', methods=['GET'])
def get_seats(session_id):
    seats = Seat.query.filter_by(session_id=session_id).all()
    result = []
    for seat in seats:
        result.append({
            'id': seat.id,
            'number': seat.seat_number,
            'user': seat.user.name if seat.user else None
        })
    return jsonify(result)

@seats_bp.route('/seats/book', methods=['POST'])
def book_seat():
    user = current_user()
    if not user:
        return jsonify({'error': 'Требуется авторизация'}), 401

    seat_id = request.json.get('seat_id')
    seat = Seat.query.get(seat_id)
    if not seat or seat.user_id:
        return jsonify({'error': 'Место занято'}), 400

    # Ограничение брони для неадмина
    if user.role != 'admin':
        count = Seat.query.filter_by(session_id=seat.session_id, user_id=user.id).count()
        if count >= 5:
            return jsonify({'error': 'Можно забронировать не более 5 мест'}), 400

    seat.user_id = user.id
    db.session.commit()
    return jsonify({'message': 'Место забронировано'})

@seats_bp.route('/seats/unbook', methods=['POST'])
def unbook_seat():
    user = current_user()
    if not user:
        return jsonify({'error': 'Требуется авторизация'}), 401

    seat_id = request.json.get('seat_id')
    seat = Seat.query.get(seat_id)
    if not seat:
        return jsonify({'error': 'Место не найдено'}), 404

    # Админ может снять бронь любого, пользователь — только свою
    if user.role != 'admin' and seat.user_id != user.id:
        return jsonify({'error': 'Нельзя снять чужую бронь'}), 403

    seat.user_id = None
    db.session.commit()
    return jsonify({'message': 'Бронь снята'})