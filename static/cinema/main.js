// --- Регистрация ---
async function register() {
    const name = document.getElementById('name').value.trim();
    const login = document.getElementById('login').value.trim();
    const password = document.getElementById('password').value.trim();

    if(!name || !login || !password){
        document.getElementById('msg').innerText = 'Все поля обязательны!';
        return;
    }

    const pattern = /^[A-Za-z0-9!@#\$%\^&\*\(\)_\-\+=]+$/;
    if(!pattern.test(login)){
        document.getElementById('msg').innerText = 'Логин содержит недопустимые символы!';
        return;
    }
    if(!pattern.test(password)){
        document.getElementById('msg').innerText = 'Пароль содержит недопустимые символы!';
        return;
    }

    const res = await fetch('/api/register', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({name, login, password})
    });
    const data = await res.json();
    document.getElementById('msg').innerText = data.message || data.error;
}

// --- Логин ---
async function login() {
    const loginVal = document.getElementById('login').value.trim();
    const password = document.getElementById('password').value.trim();

    if(!loginVal || !password){
        document.getElementById('msg').innerText = 'Логин и пароль обязательны!';
        return;
    }

    const res = await fetch('/api/login', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({login: loginVal, password})
    });
    const data = await res.json();
    document.getElementById('msg').innerText = data.message || data.error;
    if(res.ok){
        sessionStorage.setItem('role', data.role);
        sessionStorage.setItem('name', data.name);
        window.location.href='/sessions';
    }
}

// --- Выход ---
async function logout() {
    await fetch('/api/logout', {method:'POST'});
    sessionStorage.clear();
    window.location.href='/login';
}

// --- Удаление аккаунта ---
async function deleteAccount() {
    if(!confirm('Вы уверены, что хотите удалить свой аккаунт? Эта операция необратима!')) return;
    const res = await fetch('/api/delete_account', {method:'POST'});
    const data = await res.json();
    alert(data.message || data.error);
    if(res.ok){
        sessionStorage.clear();
        window.location.href='/login';
    }
}

// --- Загрузка сеансов ---
async function loadSessions() {
    const res = await fetch('/api/sessions');
    const sessions = await res.json();
    const tbody = document.querySelector('#sessions-table tbody');
    tbody.innerHTML = '';

    const role = sessionStorage.getItem('role');

    sessions.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${s.movie}</td>
            <td>${s.date}</td>
            <td>${s.time}</td>
            <td>
                <button onclick="openSeats(${s.id})" ${s.is_past?'disabled':''}>Посмотреть места</button>
                ${role==='admin'?`<button onclick="deleteSession(${s.id})">Удалить</button>`:''}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// --- Переход к местам ---
function openSeats(sessionId) {
    sessionStorage.setItem('sessionId', sessionId);
    window.location.href='/seats';
}

// --- Создание сеанса (админ) ---
async function createSession() {
    const movie = document.getElementById('movie').value;
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;

    if(!movie || !date || !time){
        alert('Заполните все поля для создания сеанса');
        return;
    }

    const res = await fetch('/api/sessions',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({movie, date, time})
    });
    const data = await res.json();
    alert(data.message || data.error);
    loadSessions();
}

// --- Удаление сеанса (админ) ---
async function deleteSession(id){
    if(!confirm('Удалить сеанс?')) return;
    const res = await fetch(`/api/sessions/${id}`, {method:'DELETE'});
    const data = await res.json();
    alert(data.message || data.error);
    loadSessions();
}

// --- Загрузка мест ---
async function loadSeats() {
    const currentSessionId = sessionStorage.getItem('sessionId');
    if(!currentSessionId) return;

    const res = await fetch(`/api/sessions/${currentSessionId}/seats`);
    const seats = await res.json();
    const container = document.getElementById('seats-container');
    container.innerHTML = '';

    const role = sessionStorage.getItem('role');
    const userName = sessionStorage.getItem('name');

    seats.forEach(seat => {
        const div = document.createElement('div');
        div.classList.add('seat');
        div.innerText = seat.number;

        if(seat.user){
            div.title = seat.user; // имя, кто занял место
            if(seat.user === userName) div.classList.add('own');
            else div.classList.add('booked');
        }

        div.onclick = async () => {
            if(seat.user === userName){
                await fetch('/api/seats/unbook', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({seat_id: seat.id})});
            } else if(!seat.user){
                await fetch('/api/seats/book', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({seat_id: seat.id})});
            } else if(role === 'admin'){
                if(confirm(`Снять бронь с места ${seat.number}, занятого ${seat.user}?`)){
                    await fetch('/api/seats/unbook', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({seat_id: seat.id})});
                }
            } else {
                alert('Место занято');
            }
            loadSeats();
        };

        container.appendChild(div);
    });
}

// --- Автозагрузка страниц ---
if(window.location.pathname.endsWith('sessions.html')){
    loadSessions();
}
if(window.location.pathname.endsWith('seats.html')){
    loadSeats();
}