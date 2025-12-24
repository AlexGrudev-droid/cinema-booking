async function register() {
    const name = document.getElementById('name').value;
    const login = document.getElementById('login').value;
    const password = document.getElementById('password').value;

    const res = await fetch('/api/register', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({name, login, password})
    });
    const data = await res.json();
    document.getElementById('msg').innerText = data.message || data.error;
}

async function login() {
    const login = document.getElementById('login').value;
    const password = document.getElementById('password').value;

    const res = await fetch('/api/login', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({login, password})
    });
    const data = await res.json();
    document.getElementById('msg').innerText = data.message || data.error;
    if (res.ok) window.location.href = '/templates/cinema/sessions.html';
}

let currentSessionId = null;

// --- Авторизация и регистрация ---
async function register() {
    const name = document.getElementById('name').value;
    const login = document.getElementById('login').value;
    const password = document.getElementById('password').value;

    const res = await fetch('/api/register', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({name, login, password})
    });
    const data = await res.json();
    document.getElementById('msg').innerText = data.message || data.error;
}

async function login() {
    const loginVal = document.getElementById('login').value;
    const password = document.getElementById('password').value;

    const res = await fetch('/api/login', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({login: loginVal, password})
    });
    const data = await res.json();
    document.getElementById('msg').innerText = data.message || data.error;
    if (res.ok) window.location.href = '/templates/cinema/sessions.html';
}

// --- Сеансы ---
async function loadSessions() {
    const res = await fetch('/api/sessions');
    const sessions = await res.json();
    const tbody = document.querySelector('#sessions-table tbody');
    tbody.innerHTML = '';

    sessions.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${s.movie}</td>
            <td>${s.date}</td>
            <td>${s.time}</td>
            <td>
                <button onclick="openSeats(${s.id})" ${s.is_past ? 'disabled' : ''}>
                    Посмотреть места
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openSeats(sessionId) {
    currentSessionId = sessionId;
    window.location.href = '/templates/cinema/seats.html';
}

// --- Места ---
async function loadSeats() {
    if (!currentSessionId) return;
    const res = await fetch(`/api/sessions/${currentSessionId}/seats`);
    const seats = await res.json();
    const container = document.getElementById('seats-container');
    container.innerHTML = '';

    seats.forEach(seat => {
        const div = document.createElement('div');
        div.classList.add('seat');
        div.innerText = seat.number;

        if (seat.user) div.classList.add(seat.user === 'Вы' ? 'own' : 'booked');
        div.onclick = () => toggleSeat(seat);
        container.appendChild(div);
    });
}

async function toggleSeat(seat) {
    if (seat.user === 'Вы') {
        await fetch('/api/seats/unbook', {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({seat_id: seat.id})
        });
    } else if (!seat.user) {
        await fetch('/api/seats/book', {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({seat_id: seat.id})
        });
    } else {
        alert('Место занято другим пользователем');
    }
    loadSeats();
}

// --- Автозагрузка ---
if (window.location.pathname.endsWith('sessions.html')) {
    loadSessions();
}
if (window.location.pathname.endsWith('seats.html')) {
    loadSeats();
}

async function login() {
    const loginVal = document.getElementById('login').value;
    const password = document.getElementById('password').value;

    const res = await fetch('/api/login', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({login: loginVal, password})
    });
    const data = await res.json();
    document.getElementById('msg').innerText = data.message || data.error;
    if(res.ok){
        sessionStorage.setItem('role', data.role);
        sessionStorage.setItem('name', data.name);
        window.location.href='/templates/cinema/sessions.html';
    }
}

