// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
function showMessage(id, text, isError = true) {
    const el = document.getElementById(id);
    el.style.color = isError ? 'red' : 'green';
    el.innerText = text;
}

function isValidInput(value) {
    // латиница, цифры, знаки препинания
    const regex = /^[A-Za-z0-9!"#$%&'()*+,\-.\/:;<=>?@[\\\]^_`{|}~]+$/;
    return regex.test(value);
}

// ===== АВТОРИЗАЦИЯ =====
async function login() {
    const login = document.getElementById('login').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!login || !password) {
        showMessage('msg', 'Заполните все поля');
        return;
    }

    if (!isValidInput(login) || !isValidInput(password)) {
        showMessage('msg', 'Недопустимые символы');
        return;
    }

    const res = await fetch('/api/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({login, password})
    });

    const data = await res.json();

    if (data.error) {
        showMessage('msg', data.error);
    } else {
        sessionStorage.setItem('name', data.name);
        sessionStorage.setItem('role', data.role);
        window.location.href = '/sessions';
    }
}

// ===== РЕГИСТРАЦИЯ =====
async function register() {
    const name = document.getElementById('name').value.trim();
    const login = document.getElementById('login').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!name || !login || !password) {
        showMessage('msg', 'Заполните все поля');
        return;
    }

    if (!isValidInput(login) || !isValidInput(password)) {
        showMessage('msg', 'Недопустимые символы');
        return;
    }

    const res = await fetch('/api/register', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name, login, password})
    });

    const data = await res.json();

    if (data.error) {
        showMessage('msg', data.error);
    } else {
        alert('Регистрация успешна');
        window.location.href = '/login';
    }
}

// ===== ВЫХОД =====
async function logout() {
    await fetch('/api/logout', {method: 'POST'});
    sessionStorage.clear();
    window.location.href = '/login';
}

// ===== УДАЛЕНИЕ АККАУНТА =====
async function deleteAccount() {
    if (!confirm('Удалить аккаунт?')) return;

    const res = await fetch('/api/delete_account', {method: 'DELETE'});
    const data = await res.json();

    if (data.error) {
        alert(data.error);
    } else {
        sessionStorage.clear();
        alert('Аккаунт удалён');
        window.location.href = '/login';
    }
}

// ===== СЕАНСЫ =====
async function loadSessions() {
    const res = await fetch('/api/sessions');
    const sessions = await res.json();
    const tbody = document.querySelector('#sessions-table tbody');
    const role = sessionStorage.getItem('role');

    tbody.innerHTML = '';

    sessions.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${s.movie}</td>
            <td>${s.date}</td>
            <td>${s.time}</td>
            <td>
                <button onclick="openSeats(${s.id})" ${s.is_past ? 'disabled' : ''}>
                    Места
                </button>
                ${role === 'admin' ? `<button onclick="deleteSession(${s.id})">Удалить</button>` : ''}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openSeats(sessionId) {
    sessionStorage.setItem('sessionId', sessionId);
    window.location.href = '/seats';
}

async function createSession() {
    const movie = document.getElementById('movie').value;
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;

    const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({movie, date, time})
    });

    const data = await res.json();
    alert(data.message || data.error);
    loadSessions();
}

async function deleteSession(id) {
    if (!confirm('Удалить сеанс?')) return;
    const res = await fetch(`/api/sessions/${id}`, {method: 'DELETE'});
    const data = await res.json();
    alert(data.message || data.error);
    loadSessions();
}

// ===== МЕСТА =====
async function loadSeats() {
    const sessionId = sessionStorage.getItem('sessionId');
    const role = sessionStorage.getItem('role');
    const userName = sessionStorage.getItem('name');

    const res = await fetch(`/api/sessions/${sessionId}/seats`);
    const seats = await res.json();
    const container = document.getElementById('seats-container');

    container.innerHTML = '';

    seats.forEach(seat => {
        const div = document.createElement('div');
        div.className = 'seat';
        div.innerText = seat.number;

        if (seat.user) {
            div.title = seat.user;
            if (seat.user === userName) {
                div.classList.add('own');
            } else {
                div.classList.add('booked');
            }
        }

        div.onclick = async () => {
            if (seat.user === userName) {
                await fetch('/api/seats/unbook', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({seat_id: seat.id})
                });
            } else if (!seat.user) {
                await fetch('/api/seats/book', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({seat_id: seat.id})
                });
            } else if (role === 'admin') {
                if (confirm(`Снять бронь с ${seat.user}?`)) {
                    await fetch('/api/seats/admin_unbook', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({seat_id: seat.id})
                    });
                }
            } else {
                alert('Место занято');
            }
            loadSeats();
        };

        container.appendChild(div);
    });
}