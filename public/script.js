document.addEventListener('DOMContentLoaded', function() {
    // Общие элементы
    const themeToggle = document.getElementById('themeToggle');
    const currentTheme = localStorage.getItem('theme') || 'light-theme';
    document.body.className = currentTheme;
    
    // Функция для показа сообщений
    function showMessage(text, isError = false) {
        const messageDiv = document.getElementById('message');
        if (!messageDiv) return;
        
        messageDiv.textContent = text;
        messageDiv.className = 'message ' + (isError ? 'error' : 'success');
        
        setTimeout(() => {
            messageDiv.textContent = '';
            messageDiv.className = 'message';
        }, 3000);
    }
    
    // Переключение темы
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const newTheme = document.body.classList.contains('light-theme') ? 'dark-theme' : 'light-theme';
            document.body.className = newTheme;
            localStorage.setItem('theme', newTheme);
            themeToggle.textContent = newTheme === 'light-theme' ? 'Тёмная тема' : 'Светлая тема';
        });
        themeToggle.textContent = currentTheme === 'light-theme' ? 'Тёмная тема' : 'Светлая тема';
    }
    
    // Логика для index.html
    if (document.getElementById('loginForm')) {
        // Переключение вкладок
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', function() {
                document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                const tabId = this.getAttribute('data-tab');
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.style.display = 'none';
                });
                document.getElementById(tabId).style.display = 'block';
            });
        });
        
        // Форма входа
        document.getElementById('loginForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;
            
            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                
                const data = await response.json();
                if (response.ok) {
                    window.location.href = '/profile';
                } else {
                    showMessage(data.error || 'Ошибка входа', true);
                }
            } catch (error) {
                showMessage('Произошла ошибка', true);
            }
        });
        
        // Форма регистрации
        document.getElementById('registerForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const username = document.getElementById('registerUsername').value;
            const password = document.getElementById('registerPassword').value;
            
            try {
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                
                const data = await response.json();
                if (response.ok) {
                    showMessage('Регистрация прошла успешно! Теперь вы можете войти.');
                    document.querySelector('.tab-button[data-tab="login"]').click();
                    document.getElementById('loginUsername').value = username;
                    document.getElementById('loginPassword').value = '';
                    document.getElementById('registerUsername').value = '';
                    document.getElementById('registerPassword').value = '';
                } else {
                    showMessage(data.error || 'Ошибка регистрации', true);
                }
            } catch (error) {
                showMessage('Произошла ошибка', true);
            }
        });
    }
    
    // Логика для profile.html
    if (document.getElementById('logoutButton')) {
        // Проверка и отображение имени пользователя
        const usernameElement = document.getElementById('username');
        if (usernameElement && usernameElement.textContent === '{{username}}') {
            fetch('/user-data')
                .then(response => {
                    if (!response.ok) throw new Error('Не авторизован');
                    return response.json();
                })
                .then(data => {
                    usernameElement.textContent = data.username;
                })
                .catch(error => {
                    console.error('Ошибка:', error);
                    window.location.href = '/';
                });
        }
        
        // Выход из системы
        document.getElementById('logoutButton').addEventListener('click', async function() {
            try {
                const response = await fetch('/logout', { method: 'POST' });
                if (response.ok) {
                    window.location.href = '/';
                }
            } catch (error) {
                console.error('Ошибка выхода:', error);
            }
        });
        
        // Загрузка данных
        const loadData = async () => {
            const dataDisplay = document.getElementById('dataDisplay');
            const cacheStatus = document.getElementById('cacheStatus');
            
            dataDisplay.innerHTML = '<p>Загрузка данных...</p>';
            cacheStatus.textContent = '';
            
            try {
                const response = await fetch('/data');
                if (!response.ok) throw new Error('Не удалось загрузить данные');
                
                const data = await response.json();
                dataDisplay.innerHTML = `
                    <p><strong>Время:</strong> ${new Date(data.timestamp).toLocaleString()}</p>
                    <p><strong>Данные:</strong> ${data.data}</p>
                `;
                cacheStatus.textContent = data.cached ? 'Данные получены из кэша' : 'Данные сгенерированы заново';
            } catch (error) {
                dataDisplay.innerHTML = `<p class="error">Ошибка загрузки данных: ${error.message}</p>`;
            }
        };
        
        document.getElementById('refreshData').addEventListener('click', loadData);
        loadData();
    }
});