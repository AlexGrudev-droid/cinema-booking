from cinema_app import app
from cinema.models import db, CinemaSession, Seat
from datetime import datetime, timedelta

with app.app_context():
    # Примеры фильмов
    movies = [
        ("Аватар: Путь воды", 1),
        ("Интерстеллар", 2),
        ("Начало", 3),
        ("Дюна", 4),
        ("Титаник", 5),
        ("Марсианин", 6),
        ("Матрица", 7),
        ("Властелин колец", 8),
        ("Форсаж 9", 9),
        ("Чёрная Пантера", 10)
    ]

    for title, day_offset in movies:
        date = datetime.today() + timedelta(days=day_offset)
        session = CinemaSession(
            movie=title,
            date=date.strftime("%Y-%m-%d"),
            time="19:00"
        )
        db.session.add(session)
        db.session.commit()

        # Создаём 30 мест для каждого сеанса
        for i in range(1, 31):
            seat = Seat(session_id=session.id, seat_number=i)
            db.session.add(seat)
        db.session.commit()

    print("База заполнена 10 сеансами и местами.")