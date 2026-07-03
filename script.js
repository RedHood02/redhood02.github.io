// ============================================================
// DATOS SIMULADOS (Base de datos en memoria - SIN EJEMPLOS)
// ============================================================

const DB = {
    users: [],
    characters: [],
    campaigns: [],
    reports: [],
    currentUser: null,
    editingCharacterId: null,
    editingCampaignId: null,
    editingCommentId: null,
    viewingUserId: null,
    nextId: {
        user: 1,
        character: 1,
        campaign: 1,
        comment: 1,
        report: 1
    }
};

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

// ============================================================
// UTILIDADES
// ============================================================

function generateId(type) {
    return DB.nextId[type]++;
}

function getCurrentUser() {
    return DB.currentUser;
}

function isLoggedIn() {
    return DB.currentUser !== null;
}

function isModerator() {
    return isLoggedIn() && DB.currentUser.role === 'moderator';
}

function isAdmin() {
    return isLoggedIn() && DB.currentUser.role === 'admin';
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getStatusBadge(status) {
    const map = {
        'draft': 'status-draft',
        'published': 'status-published',
        'removed': 'status-removed'
    };
    const labels = {
        'draft': '📝 Borrador',
        'published': '✅ Publicado',
        'removed': '🚫 Retirado'
    };
    return `<span class="status-badge ${map[status] || 'status-draft'}">${labels[status] || status}</span>`;
}

function getUserName(userId) {
    const user = DB.users.find(u => u.id === userId);
    return user ? user.name : 'Desconocido';
}

function getUserRole(userId) {
    const user = DB.users.find(u => u.id === userId);
    return user ? user.role : 'user';
}

function getCharacter(id) {
    return DB.characters.find(c => c.id === id);
}

function getCampaign(id) {
    return DB.campaigns.find(c => c.id === id);
}

function getPublishedCharacters() {
    return DB.characters.filter(c => c.status === 'published');
}

function getPublishedCampaigns() {
    return DB.campaigns.filter(c => c.status === 'published');
}

// ============================================================
// NAVEGACIÓN CON CONTROL DE ACCESO
// ============================================================

function navigateTo(page, params = null) {
    console.log('Navegando a:', page, params);
    
    // 🔒 Verificar autenticación para páginas protegidas
    const protectedPages = ['my-posts', 'profile'];
    if (protectedPages.includes(page) && !isLoggedIn()) {
        showToast('🔒 Debes iniciar sesión para acceder a esta sección', 'warning');
        page = 'login';
    }
    
    // 🔒 Verificar moderador para página de moderación
    if (page === 'moderator' && !isModerator() && !isAdmin()) {
        showToast('⛔ Acceso denegado. Solo moderadores pueden acceder.', 'error');
        page = 'home';
    }
    
    // Actualizar navegación activa
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    const navLink = document.querySelector(`.nav-link[data-page="${page}"]`);
    if (navLink) navLink.classList.add('active');

    // Renderizar página
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) {
        console.error('mainContent no encontrado');
        return;
    }
    
    switch(page) {
        case 'home':
            renderHome(mainContent);
            break;
        case 'register':
            renderRegister(mainContent);
            break;
        case 'login':
            renderLogin(mainContent);
            break;
        case 'explore':
            renderExplore(mainContent);
            break;
        case 'characters':
            renderCharacters(mainContent);
            break;
        case 'my-posts':
            renderMyPosts(mainContent);
            break;
        case 'profile':
            renderProfile(mainContent, params);
            break;
        case 'moderator':
            renderModerator(mainContent);
            break;
        case 'campaign-detail':
            renderCampaignDetail(mainContent, params);
            break;
        case 'character-detail':
            renderCharacterDetail(mainContent, params);
            break;
        default:
            renderHome(mainContent);
    }

    // Actualizar UI según autenticación
    updateAuthUI();
}

function updateAuthUI() {
    const authButtons = document.getElementById('authButtons');
    const userInfo = document.getElementById('userInfo');
    const userName = document.getElementById('userNameDisplay');
    const myPostsLink = document.getElementById('myPostsLink');
    const profileLink = document.getElementById('profileLink');
    const moderatorLink = document.getElementById('moderatorLink');

    if (!authButtons || !userInfo || !userName) return;

    if (isLoggedIn()) {
        // ✅ Usuario logueado - mostrar opciones de usuario
        authButtons.style.display = 'none';
        userInfo.style.display = 'flex';
        userName.textContent = DB.currentUser.name;
        
        // Mostrar enlaces protegidos
        if (myPostsLink) myPostsLink.style.display = 'inline';
        if (profileLink) profileLink.style.display = 'inline';
        
        // Mostrar moderación solo si es moderador o admin
        if (moderatorLink) {
            moderatorLink.style.display = (isModerator() || isAdmin()) ? 'inline' : 'none';
        }
    } else {
        // ❌ Usuario NO logueado - ocultar todo lo protegido
        authButtons.style.display = 'flex';
        userInfo.style.display = 'none';
        
        if (myPostsLink) myPostsLink.style.display = 'none';
        if (profileLink) profileLink.style.display = 'none';
        if (moderatorLink) moderatorLink.style.display = 'none';
    }
}

// ============================================================
// PÁGINAS
// ============================================================

// ---------- HOME ----------
function renderHome(container) {
    const user = getCurrentUser();
    const greeting = user ? `¡Bienvenido, ${user.name}!` : '¡Bienvenido a RolCommunity!';
    const publishedCampaigns = getPublishedCampaigns();
    const publishedCharacters = getPublishedCharacters();
    
    container.innerHTML = `
        <div class="page">
            <h1 class="page-title">🎲 ${greeting}</h1>
            <p class="page-subtitle">El portal para jugadores de rol de mesa digitalizados</p>
            
            <div class="grid-3">
                <div class="card">
                    <div class="card-header">
                        <span class="card-title">📜 Personajes</span>
                        <span class="card-subtitle">${publishedCharacters.length} publicados</span>
                    </div>
                    <p>Explora personajes creados por la comunidad.</p>
                    <br>
                    <button class="btn btn-primary" onclick="navigateTo('characters')">Ver personajes</button>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <span class="card-title">🏰 Campañas</span>
                        <span class="card-subtitle">${publishedCampaigns.length} publicadas</span>
                    </div>
                    <p>Explora campañas creadas por la comunidad y comparte las tuyas.</p>
                    <br>
                    <button class="btn btn-primary" onclick="navigateTo('explore')">Explorar campañas</button>
                </div>

                <div class="card">
                    <div class="card-header">
                        <span class="card-title">👥 Comunidad</span>
                        <span class="card-subtitle">${DB.users.length} miembros</span>
                    </div>
                    <p>Conecta con otros jugadores y comparte tus creaciones.</p>
                    <br>
                    ${isLoggedIn() ? `<button class="btn btn-outline" onclick="navigateTo('profile')">Mi perfil</button>` : `<button class="btn btn-outline" onclick="navigateTo('register')">Únete ahora</button>`}
                </div>
            </div>
        </div>
    `;
}

// ---------- REGISTRO ----------
function renderRegister(container) {
    const isFirstUser = DB.users.length === 0;
    
    container.innerHTML = `
        <div class="page">
            <h1 class="page-title">📝 Registro</h1>
            <p class="page-subtitle">Crea tu cuenta para acceder a todas las funcionalidades</p>
            
            ${isFirstUser ? `
                <div class="alert alert-info" style="margin-bottom:1.5rem; border-left: 4px solid #f7971e;">
                    👑 <strong>¡Primer usuario del sistema!</strong><br>
                    Serás registrado como <strong>Administrador</strong> automáticamente. 
                    Podrás asignar moderadores desde el panel de moderación.
                </div>
            ` : ''}
            
            <div class="card" style="max-width:500px; margin:0 auto;">
                <form id="registerForm" onsubmit="handleRegister(event)">
                    <div class="form-group">
                        <label>Nombre completo</label>
                        <input type="text" id="regName" placeholder="Tu nombre" required>
                    </div>
                    <div class="form-group">
                        <label>Correo electrónico</label>
                        <input type="email" id="regEmail" placeholder="correo@ejemplo.cl" required>
                    </div>
                    <div class="form-group">
                        <label>Contraseña</label>
                        <input type="password" id="regPassword" placeholder="Mínimo 6 caracteres" required minlength="6">
                    </div>
                    <div id="regMessage"></div>
                    <button type="submit" class="btn btn-primary btn-block">Crear cuenta</button>
                    <p style="text-align:center; margin-top:1rem;">
                        ¿Ya tienes cuenta? <a href="javascript:void(0)" onclick="navigateTo('login')">Inicia sesión</a>
                    </p>
                </form>
            </div>
        </div>
    `;
}

function handleRegister(event) {
    event.preventDefault();
    console.log('📝 Procesando registro...');
    
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const message = document.getElementById('regMessage');

    // Validar que los elementos existen
    if (!name || !email || !password) {
        message.innerHTML = `<div class="alert alert-danger">❌ Todos los campos son obligatorios</div>`;
        return;
    }

    if (password.length < 6) {
        message.innerHTML = `<div class="alert alert-danger">❌ La contraseña debe tener al menos 6 caracteres</div>`;
        return;
    }

    // Verificar si el correo ya existe
    if (DB.users.find(u => u.email === email)) {
        message.innerHTML = `<div class="alert alert-danger">❌ El correo ya está registrado</div>`;
        return;
    }

    // ✅ DETECTAR SI ES EL PRIMER USUARIO
    const isFirstUser = DB.users.length === 0;
    let role = 'user';
    if (isFirstUser) {
        role = 'admin';
    }

    // Crear usuario
    const newUser = {
        id: generateId('user'),
        name: name,
        email: email,
        password: password,
        role: role,
        createdAt: new Date().toISOString().split('T')[0]
    };
    DB.users.push(newUser);

    console.log('✅ Usuario creado:', newUser);

    const roleMessage = role === 'admin' ? ' 👑 (Administrador - Primer usuario del sistema)' : '';
    message.innerHTML = `
        <div class="alert alert-success">
            ✅ ¡Cuenta creada exitosamente${roleMessage}! 
            Se ha enviado un correo de confirmación (simulado).
        </div>
    `;
    
    showToast(`✅ ¡Cuenta creada como ${role}${roleMessage}!`, 'success');

    setTimeout(() => navigateTo('login'), 1500);
}

// ---------- LOGIN ----------
function renderLogin(container) {
    container.innerHTML = `
        <div class="page">
            <h1 class="page-title">🔐 Iniciar Sesión</h1>
            <p class="page-subtitle">Accede a tu cuenta y contenido</p>
            
            <div class="card" style="max-width:500px; margin:0 auto;">
                <form id="loginForm" onsubmit="handleLogin(event)">
                    <div class="form-group">
                        <label>Correo electrónico</label>
                        <input type="email" id="loginEmail" placeholder="correo@ejemplo.cl" required>
                    </div>
                    <div class="form-group">
                        <label>Contraseña</label>
                        <input type="password" id="loginPassword" placeholder="Tu contraseña" required>
                    </div>
                    <div id="loginMessage"></div>
                    <button type="submit" class="btn btn-primary btn-block">Ingresar</button>
                    <p style="text-align:center; margin-top:1rem;">
                        ¿No tienes cuenta? <a href="javascript:void(0)" onclick="navigateTo('register')">Regístrate</a>
                    </p>
                </form>
            </div>
        </div>
    `;
}

function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const message = document.getElementById('loginMessage');

    const user = DB.users.find(u => u.email === email && u.password === password);

    if (!user) {
        message.innerHTML = `<div class="alert alert-danger">❌ Credenciales inválidas. Verifica tu correo y contraseña.</div>`;
        return;
    }

    DB.currentUser = user;
    message.innerHTML = `<div class="alert alert-success">✅ ¡Bienvenido, ${user.name}!</div>`;
    showToast(`✅ ¡Bienvenido, ${user.name}!`, 'success');
    
    setTimeout(() => navigateTo('home'), 500);
}

function logout() {
    const name = DB.currentUser?.name || 'Usuario';
    DB.currentUser = null;
    showToast(`👋 ¡Hasta luego, ${name}!`, 'info');
    navigateTo('home');
}

// ============================================================
// EXPLORAR PERSONAJES PÚBLICOS
// ============================================================

function renderCharacters(container) {
    const publishedCharacters = getPublishedCharacters();
    
    let charactersHTML = '';
    if (publishedCharacters.length === 0) {
        charactersHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <div class="empty-state-title">No hay personajes publicados</div>
                <div class="empty-state-text">Sé el primero en publicar un personaje</div>
                ${isLoggedIn() ? `<button class="btn btn-primary" onclick="navigateTo('my-posts')">Crear personaje</button>` : `<button class="btn btn-outline" onclick="navigateTo('login')">Inicia sesión para crear</button>`}
            </div>
        `;
    } else {
        charactersHTML = publishedCharacters.map(c => `
            <div class="card" onclick="navigateTo('character-detail', ${c.id})" style="cursor:pointer;">
                <div class="card-header">
                    <span class="card-title">${c.name}</span>
                    <span class="card-subtitle">👤 ${getUserName(c.userId)}</span>
                </div>
                <p><strong>Raza:</strong> ${c.race} | <strong>Clase:</strong> ${c.class}</p>
                <p><strong>📅 Creado:</strong> ${formatDate(c.createdAt)}</p>
                <div style="display:flex; gap:0.5rem; margin-top:0.5rem; flex-wrap:wrap;">
                    <span class="status-badge status-published">⭐ ${c.rating && c.ratings?.length > 0 ? (c.rating).toFixed(1) + '/5' : 'Sin valorar'}</span>
                </div>
            </div>
        `).join('');
    }

    container.innerHTML = `
        <div class="page">
            <h1 class="page-title">📜 Personajes Públicos</h1>
            <p class="page-subtitle">Explora personajes creados por la comunidad</p>
            ${isLoggedIn() ? `<button class="btn btn-primary" onclick="navigateTo('my-posts')">➕ Crear personaje</button>` : `<button class="btn btn-outline" onclick="navigateTo('login')">Inicia sesión para crear</button>`}
            <br><br>
            ${charactersHTML}
        </div>
    `;
}

// ============================================================
// DETALLE DE PERSONAJE PÚBLICO
// ============================================================

function renderCharacterDetail(container, characterId) {
    const character = getCharacter(characterId);
    if (!character) {
        container.innerHTML = `<div class="alert alert-danger">Personaje no encontrado</div>`;
        return;
    }

    if (character.status !== 'published') {
        container.innerHTML = `
            <div class="page">
                <div class="alert alert-warning">Este personaje no está disponible públicamente.</div>
                <button class="btn btn-outline btn-sm" onclick="navigateTo('characters')">← Volver a personajes</button>
            </div>
        `;
        return;
    }

    const userRating = isLoggedIn() && character.ratings ? 
        character.ratings.some(r => r.userId === DB.currentUser.id) : false;

    container.innerHTML = `
        <div class="page">
            <button class="btn btn-outline btn-sm" onclick="navigateTo('characters')">← Volver a personajes</button>
            <br><br>
            
            <div class="card">
                <div class="card-header">
                    <span class="card-title">${character.name}</span>
                    <span class="card-subtitle">⭐ ${character.rating && character.ratings?.length > 0 ? character.rating.toFixed(1) + '/5' : 'Sin valorar'}</span>
                </div>
                
                <p><strong>👤 Creador:</strong> ${getUserName(character.userId)}</p>
                <p><strong>🧝 Raza:</strong> ${character.race}</p>
                <p><strong>⚔️ Clase:</strong> ${character.class}</p>
                <p><strong>📅 Creado:</strong> ${formatDate(character.createdAt)}</p>
                <p><strong>⭐ Valoración:</strong> ${character.rating && character.ratings?.length > 0 ? character.rating.toFixed(1) + '/5' : 'Sin valorar'} (${character.ratings?.length || 0} valoraciones)</p>
            </div>

            ${isLoggedIn() && !userRating && character.status === 'published' ? `
                <div class="card">
                    <h4>⭐ Valorar este personaje</h4>
                    <div class="stars" id="characterRatingStars">
                        ${[1,2,3,4,5].map(i => `
                            <span class="star" data-value="${i}" onclick="rateCharacter(${character.id}, ${i})">★</span>
                        `).join('')}
                    </div>
                </div>
            ` : isLoggedIn() && userRating ? `
                <div class="card">
                    <h4>⭐ ¡Ya valoraste este personaje!</h4>
                </div>
            ` : ''}

            ${isLoggedIn() && character.status === 'published' ? `
                <div class="card">
                    <button class="btn btn-danger btn-sm" onclick="openReportModal(${character.id}, 'character')">
                        🚨 Reportar contenido inapropiado
                    </button>
                </div>
            ` : ''}
        </div>
    `;
}

// ============================================================
// VALORAR PERSONAJE
// ============================================================

function rateCharacter(characterId, rating) {
    if (!isLoggedIn()) {
        showToast('🔒 Debes iniciar sesión para valorar', 'warning');
        navigateTo('login');
        return;
    }

    const character = getCharacter(characterId);
    if (!character) {
        showToast('Personaje no encontrado', 'error');
        return;
    }

    if (character.ratings && character.ratings.some(r => r.userId === DB.currentUser.id)) {
        showToast('Ya valoraste este personaje', 'info');
        return;
    }

    if (!character.ratings) character.ratings = [];
    character.ratings.push({ userId: DB.currentUser.id, rating: rating });
    
    const total = character.ratings.reduce((sum, r) => sum + r.rating, 0);
    character.rating = total / character.ratings.length;

    document.querySelectorAll('#characterRatingStars .star').forEach(s => {
        s.classList.toggle('active', parseInt(s.dataset.value) <= rating);
    });

    showToast(`⭐ ¡Valoraste este personaje con ${rating} estrellas!`, 'success');
    
    setTimeout(() => navigateTo('character-detail', characterId), 500);
}

// ============================================================
// MIS PUBLICACIONES - SOLO ACCESIBLE PARA USUARIOS AUTENTICADOS
// ============================================================

function renderMyPosts(container) {
    // 🔒 VERIFICACIÓN DE SEGURIDAD - Solo accesible si está logueado
    if (!isLoggedIn()) {
        container.innerHTML = `
            <div class="page">
                <div class="card" style="text-align:center; padding:3rem; max-width:500px; margin:0 auto;">
                    <div style="font-size:4rem; margin-bottom:1rem;">🔒</div>
                    <h2>Acceso restringido</h2>
                    <p style="color:#6c757d; margin-bottom:1.5rem;">Debes iniciar sesión para ver tus personajes y campañas.</p>
                    <button class="btn btn-primary" onclick="navigateTo('login')">Iniciar Sesión</button>
                    <br><br>
                    <p>¿No tienes cuenta? <a href="javascript:void(0)" onclick="navigateTo('register')">Regístrate aquí</a></p>
                </div>
            </div>
        `;
        return;
    }

    // Si está logueado, mostrar el contenido normal
    const userId = DB.currentUser.id;
    const myCharacters = DB.characters.filter(c => c.userId === userId);
    const myCampaigns = DB.campaigns.filter(c => c.userId === userId);

    // Personajes
    let charactersHTML = '';
    if (myCharacters.length === 0) {
        charactersHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <div class="empty-state-title">No tienes personajes</div>
                <div class="empty-state-text">Crea tu primer personaje</div>
                <button class="btn btn-primary" onclick="showCreateCharacter()">➕ Crear personaje</button>
            </div>
        `;
    } else {
        charactersHTML = myCharacters.map(c => `
            <div class="card">
                <div class="card-header">
                    <span class="card-title">${c.name}</span>
                    <span>${getStatusBadge(c.status)}</span>
                </div>
                <p><strong>Raza:</strong> ${c.race} | <strong>Clase:</strong> ${c.class}</p>
                <p><strong>Creado:</strong> ${formatDate(c.createdAt)}</p>
                <p><strong>⭐ Valoración:</strong> ${c.rating && c.ratings?.length > 0 ? c.rating.toFixed(1) + '/5' : 'Sin valorar'}</p>
                <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-top:0.5rem;">
                    <button class="btn btn-outline btn-sm" onclick="editCharacter(${c.id})">✏️ Editar</button>
                    ${c.status === 'draft' ? `<button class="btn btn-success btn-sm" onclick="publishCharacter(${c.id})">📢 Publicar</button>` : ''}
                    ${c.status === 'published' ? `<button class="btn btn-warning btn-sm" onclick="unpublishCharacter(${c.id})">📝 Volver a borrador</button>` : ''}
                    <button class="btn btn-danger btn-sm" onclick="deleteCharacter(${c.id})">🗑️ Eliminar</button>
                </div>
            </div>
        `).join('');
    }

    // Campañas
    let campaignsHTML = '';
    if (myCampaigns.length === 0) {
        campaignsHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <div class="empty-state-title">No tienes campañas</div>
                <div class="empty-state-text">Crea tu primera campaña</div>
                <button class="btn btn-primary" onclick="showCreateCampaign()">➕ Crear campaña</button>
            </div>
        `;
    } else {
        campaignsHTML = myCampaigns.map(c => `
            <div class="card">
                <div class="card-header">
                    <span class="card-title">${c.name}</span>
                    <span>${getStatusBadge(c.status)}</span>
                </div>
                <p>${c.description.substring(0, 100)}${c.description.length > 100 ? '...' : ''}</p>
                <p><strong>🎲 Sistema:</strong> ${c.system} | <strong>👥 Jugadores:</strong> ${c.maxPlayers}</p>
                <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-top:0.5rem;">
                    <button class="btn btn-outline btn-sm" onclick="editCampaign(${c.id})">✏️ Editar</button>
                    ${c.status === 'draft' ? `<button class="btn btn-success btn-sm" onclick="publishCampaign(${c.id})">📢 Publicar</button>` : ''}
                    ${c.status === 'published' ? `<button class="btn btn-warning btn-sm" onclick="unpublishCampaign(${c.id})">📝 Volver a borrador</button>` : ''}
                    <button class="btn btn-danger btn-sm" onclick="deleteCampaign(${c.id})">🗑️ Eliminar</button>
                </div>
                <br>
                <button class="btn btn-outline btn-sm" onclick="navigateTo('campaign-detail', ${c.id})">👁️ Ver detalle</button>
            </div>
        `).join('');
    }

    container.innerHTML = `
        <div class="page">
            <h1 class="page-title">📋 Mis Publicaciones</h1>
            <p class="page-subtitle">Gestiona tus personajes y campañas</p>
            
            <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:1rem;">
                <button class="btn btn-primary" onclick="showCreateCharacter()">➕ Crear personaje</button>
                <button class="btn btn-primary" onclick="showCreateCampaign()">➕ Crear campaña</button>
            </div>

            <h2>📜 Personajes</h2>
            ${charactersHTML}

            <h2>🏰 Campañas</h2>
            ${campaignsHTML}
        </div>
    `;
}

// ============================================================
// CRUD PERSONAJES
// ============================================================

function showCreateCharacter() {
    if (!isLoggedIn()) {
        showToast('🔒 Debes iniciar sesión para crear personajes', 'warning');
        navigateTo('login');
        return;
    }
    
    DB.editingCharacterId = null;
    openModal(`
        <h2>➕ Crear Personaje</h2>
        <form id="characterForm" onsubmit="saveCharacter(event)">
            <div class="form-group">
                <label>Nombre del personaje *</label>
                <input type="text" id="charName" placeholder="Nombre del personaje" required>
            </div>
            <div class="form-group">
                <label>Raza *</label>
                <input type="text" id="charRace" placeholder="Ej: Elfo, Enano, Humano" required>
            </div>
            <div class="form-group">
                <label>Clase *</label>
                <input type="text" id="charClass" placeholder="Ej: Guerrero, Mago, Pícaro" required>
            </div>
            <p style="color:#6c757d; font-size:0.85rem; margin-bottom:1rem;">* Campos obligatorios</p>
            <button type="submit" class="btn btn-primary btn-block">Guardar personaje</button>
        </form>
    `);
}

function editCharacter(id) {
    if (!isLoggedIn()) {
        showToast('🔒 Debes iniciar sesión para editar personajes', 'warning');
        navigateTo('login');
        return;
    }
    
    const character = getCharacter(id);
    if (!character) {
        showToast('Personaje no encontrado', 'error');
        return;
    }
    if (character.userId !== DB.currentUser.id) {
        showToast('No tienes permiso para editar este personaje', 'error');
        return;
    }

    DB.editingCharacterId = id;
    openModal(`
        <h2>✏️ Editar Personaje</h2>
        <form id="characterForm" onsubmit="saveCharacter(event)">
            <div class="form-group">
                <label>Nombre del personaje *</label>
                <input type="text" id="charName" value="${character.name}" required>
            </div>
            <div class="form-group">
                <label>Raza *</label>
                <input type="text" id="charRace" value="${character.race}" required>
            </div>
            <div class="form-group">
                <label>Clase *</label>
                <input type="text" id="charClass" value="${character.class}" required>
            </div>
            <p style="color:#6c757d; font-size:0.85rem; margin-bottom:1rem;">* Campos obligatorios</p>
            <div style="display:flex; gap:0.5rem;">
                <button type="submit" class="btn btn-primary" style="flex:1;">Guardar cambios</button>
                <button type="button" class="btn btn-danger" onclick="deleteCharacter(${id})">🗑️ Eliminar</button>
            </div>
        </form>
    `);
}

function saveCharacter(event) {
    event.preventDefault();
    
    if (!isLoggedIn()) {
        showToast('🔒 Debes iniciar sesión para guardar personajes', 'warning');
        closeModal();
        navigateTo('login');
        return;
    }
    
    const name = document.getElementById('charName').value.trim();
    const race = document.getElementById('charRace').value.trim();
    const cls = document.getElementById('charClass').value.trim();

    if (!name || !race || !cls) {
        showToast('Todos los campos son obligatorios', 'error');
        return;
    }

    if (DB.editingCharacterId) {
        const character = getCharacter(DB.editingCharacterId);
        if (character) {
            character.name = name;
            character.race = race;
            character.class = cls;
            showToast('✅ Personaje actualizado correctamente', 'success');
        }
    } else {
        const newCharacter = {
            id: generateId('character'),
            name: name,
            race: race,
            class: cls,
            userId: DB.currentUser.id,
            status: 'draft',
            ratings: [],
            rating: 0,
            createdAt: new Date().toISOString().split('T')[0]
        };
        DB.characters.push(newCharacter);
        showToast('✅ Personaje creado correctamente', 'success');
    }

    closeModal();
    navigateTo('my-posts');
}

function deleteCharacter(id) {
    if (!isLoggedIn()) {
        showToast('🔒 Debes iniciar sesión', 'warning');
        return;
    }
    
    if (!confirm('¿Estás seguro de eliminar este personaje?')) return;
    DB.characters = DB.characters.filter(c => c.id !== id);
    closeModal();
    showToast('🗑️ Personaje eliminado', 'info');
    navigateTo('my-posts');
}

function publishCharacter(id) {
    if (!isLoggedIn()) {
        showToast('🔒 Debes iniciar sesión para publicar', 'warning');
        return;
    }
    
    const character = getCharacter(id);
    if (!character) return;
    if (character.userId !== DB.currentUser.id) {
        showToast('No tienes permiso para publicar este personaje', 'error');
        return;
    }
    character.status = 'published';
    showToast('📢 Personaje publicado correctamente', 'success');
    navigateTo('my-posts');
}

function unpublishCharacter(id) {
    if (!isLoggedIn()) {
        showToast('🔒 Debes iniciar sesión', 'warning');
        return;
    }
    
    const character = getCharacter(id);
    if (!character) return;
    if (character.userId !== DB.currentUser.id) {
        showToast('No tienes permiso para modificar este personaje', 'error');
        return;
    }
    character.status = 'draft';
    showToast('📝 Personaje vuelto a borrador', 'info');
    navigateTo('my-posts');
}

// ============================================================
// CRUD CAMPAÑAS
// ============================================================

function showCreateCampaign() {
    if (!isLoggedIn()) {
        showToast('🔒 Debes iniciar sesión para crear campañas', 'warning');
        navigateTo('login');
        return;
    }
    
    DB.editingCampaignId = null;
    openModal(`
        <h2>🎲 Crear Campaña</h2>
        <form id="campaignForm" onsubmit="saveCampaign(event)">
            <div class="form-group">
                <label>Nombre de la campaña *</label>
                <input type="text" id="campName" placeholder="Nombre de la campaña" required>
            </div>
            <div class="form-group">
                <label>Descripción *</label>
                <textarea id="campDescription" placeholder="Describe tu campaña..." required></textarea>
            </div>
            <div class="form-group">
                <label>Sistema de reglas *</label>
                <input type="text" id="campSystem" placeholder="Ej: D&D 5e, Pathfinder" required>
            </div>
            <div class="form-group">
                <label>Número máximo de jugadores *</label>
                <input type="number" id="campPlayers" placeholder="1-10" min="1" max="10" required>
            </div>
            <p style="color:#6c757d; font-size:0.85rem; margin-bottom:1rem;">* Campos obligatorios</p>
            <button type="submit" class="btn btn-primary btn-block">Guardar campaña</button>
        </form>
    `);
}

function editCampaign(id) {
    if (!isLoggedIn()) {
        showToast('🔒 Debes iniciar sesión para editar campañas', 'warning');
        navigateTo('login');
        return;
    }
    
    const campaign = getCampaign(id);
    if (!campaign) {
        showToast('Campaña no encontrada', 'error');
        return;
    }
    if (campaign.userId !== DB.currentUser.id) {
        showToast('No tienes permiso para editar esta campaña', 'error');
        return;
    }

    DB.editingCampaignId = id;
    openModal(`
        <h2>✏️ Editar Campaña</h2>
        <form id="campaignForm" onsubmit="saveCampaign(event)">
            <div class="form-group">
                <label>Nombre de la campaña *</label>
                <input type="text" id="campName" value="${campaign.name}" required>
            </div>
            <div class="form-group">
                <label>Descripción *</label>
                <textarea id="campDescription" required>${campaign.description}</textarea>
            </div>
            <div class="form-group">
                <label>Sistema de reglas *</label>
                <input type="text" id="campSystem" value="${campaign.system}" required>
            </div>
            <div class="form-group">
                <label>Número máximo de jugadores *</label>
                <input type="number" id="campPlayers" value="${campaign.maxPlayers}" min="1" max="10" required>
            </div>
            <p style="color:#6c757d; font-size:0.85rem; margin-bottom:1rem;">* Campos obligatorios</p>
            <div style="display:flex; gap:0.5rem;">
                <button type="submit" class="btn btn-primary" style="flex:1;">Guardar cambios</button>
                <button type="button" class="btn btn-danger" onclick="deleteCampaign(${id})">🗑️ Eliminar</button>
            </div>
        </form>
    `);
}

function saveCampaign(event) {
    event.preventDefault();
    
    if (!isLoggedIn()) {
        showToast('🔒 Debes iniciar sesión para guardar campañas', 'warning');
        closeModal();
        navigateTo('login');
        return;
    }
    
    const name = document.getElementById('campName').value.trim();
    const description = document.getElementById('campDescription').value.trim();
    const system = document.getElementById('campSystem').value.trim();
    const maxPlayers = parseInt(document.getElementById('campPlayers').value);

    if (!name || !description || !system || !maxPlayers) {
        showToast('Todos los campos son obligatorios', 'error');
        return;
    }

    if (DB.editingCampaignId) {
        const campaign = getCampaign(DB.editingCampaignId);
        if (campaign) {
            campaign.name = name;
            campaign.description = description;
            campaign.system = system;
            campaign.maxPlayers = maxPlayers;
            showToast('✅ Campaña actualizada correctamente', 'success');
        }
    } else {
        const newCampaign = {
            id: generateId('campaign'),
            name: name,
            description: description,
            system: system,
            maxPlayers: maxPlayers,
            userId: DB.currentUser.id,
            status: 'draft',
            rating: 0,
            ratings: [],
            comments: [],
            createdAt: new Date().toISOString().split('T')[0]
        };
        DB.campaigns.push(newCampaign);
        showToast('✅ Campaña creada correctamente', 'success');
    }

    closeModal();
    navigateTo('my-posts');
}

function deleteCampaign(id) {
    if (!isLoggedIn()) {
        showToast('🔒 Debes iniciar sesión', 'warning');
        return;
    }
    
    if (!confirm('¿Estás seguro de eliminar esta campaña?')) return;
    DB.campaigns = DB.campaigns.filter(c => c.id !== id);
    closeModal();
    showToast('🗑️ Campaña eliminada', 'info');
    navigateTo('my-posts');
}

function publishCampaign(id) {
    if (!isLoggedIn()) {
        showToast('🔒 Debes iniciar sesión para publicar', 'warning');
        return;
    }
    
    const campaign = getCampaign(id);
    if (!campaign) return;
    if (campaign.userId !== DB.currentUser.id) {
        showToast('No tienes permiso para publicar esta campaña', 'error');
        return;
    }
    campaign.status = 'published';
    showToast('📢 Campaña publicada correctamente', 'success');
    navigateTo('my-posts');
}

function unpublishCampaign(id) {
    if (!isLoggedIn()) {
        showToast('🔒 Debes iniciar sesión', 'warning');
        return;
    }
    
    const campaign = getCampaign(id);
    if (!campaign) return;
    if (campaign.userId !== DB.currentUser.id) {
        showToast('No tienes permiso para modificar esta campaña', 'error');
        return;
    }
    campaign.status = 'draft';
    showToast('📝 Campaña vuelta a borrador', 'info');
    navigateTo('my-posts');
}

// ============================================================
// EXPLORAR CAMPAÑAS
// ============================================================

function renderExplore(container) {
    const publishedCampaigns = getPublishedCampaigns();
    
    let campaignsHTML = '';
    if (publishedCampaigns.length === 0) {
        campaignsHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <div class="empty-state-title">No hay campañas publicadas</div>
                <div class="empty-state-text">Sé el primero en publicar una campaña</div>
                ${isLoggedIn() ? `<button class="btn btn-primary" onclick="navigateTo('my-posts')">Crear campaña</button>` : `<button class="btn btn-outline" onclick="navigateTo('login')">Inicia sesión para crear</button>`}
            </div>
        `;
    } else {
        campaignsHTML = publishedCampaigns.map(c => `
            <div class="card" onclick="navigateTo('campaign-detail', ${c.id})" style="cursor:pointer;">
                <div class="card-header">
                    <span class="card-title">${c.name}</span>
                    <span class="card-subtitle">⭐ ${c.rating && c.ratings?.length > 0 ? (c.rating).toFixed(1) + '/5' : 'Sin valorar'}</span>
                </div>
                <p>${c.description.substring(0, 120)}${c.description.length > 120 ? '...' : ''}</p>
                <div style="display:flex; gap:0.5rem; margin-top:0.5rem; flex-wrap:wrap;">
                    <span class="status-badge status-published">🎲 ${c.system}</span>
                    <span class="status-badge status-draft">👥 ${c.maxPlayers} jugadores</span>
                    <span class="status-badge status-published">📅 ${formatDate(c.createdAt)}</span>
                    <span class="status-badge status-published">👤 ${getUserName(c.userId)}</span>
                </div>
            </div>
        `).join('');
    }

    container.innerHTML = `
        <div class="page">
            <h1 class="page-title">🏰 Explorar Campañas</h1>
            <p class="page-subtitle">Descubre campañas de la comunidad</p>
            ${isLoggedIn() ? `<button class="btn btn-primary" onclick="navigateTo('my-posts')">➕ Crear nueva campaña</button>` : `<button class="btn btn-outline" onclick="navigateTo('login')">Inicia sesión para crear</button>`}
            <br><br>
            ${campaignsHTML}
        </div>
    `;
}

// ============================================================
// CAMPAÑA DETALLE
// ============================================================

function renderCampaignDetail(container, campaignId) {
    const campaign = getCampaign(campaignId);
    if (!campaign) {
        container.innerHTML = `<div class="alert alert-danger">Campaña no encontrada</div>`;
        return;
    }

    if (campaign.status !== 'published') {
        container.innerHTML = `
            <div class="page">
                <div class="alert alert-warning">Esta campaña no está disponible públicamente.</div>
                <button class="btn btn-outline btn-sm" onclick="navigateTo('explore')">← Volver</button>
            </div>
        `;
        return;
    }

    const userRating = isLoggedIn() && campaign.ratings ? 
        campaign.ratings.some(r => r.userId === DB.currentUser.id) : false;

    const commentsHTML = campaign.comments && campaign.comments.length > 0 ?
        campaign.comments.map(c => `
            <div class="comment">
                <span class="comment-author">${getUserName(c.userId)}</span>
                <span class="comment-date">${formatDate(c.date)}</span>
                <div class="comment-text">${c.text}</div>
                ${isLoggedIn() && DB.currentUser.id === c.userId ? `
                    <div class="comment-actions">
                        <button class="btn btn-danger btn-sm" onclick="deleteComment(${campaignId}, ${c.id})">🗑️ Eliminar</button>
                    </div>
                ` : ''}
            </div>
        `).join('') :
        '<p style="color:#6c757d;">No hay comentarios aún. ¡Sé el primero!</p>';

    container.innerHTML = `
        <div class="page">
            <button class="btn btn-outline btn-sm" onclick="navigateTo('explore')">← Volver</button>
            <br><br>
            
            <div class="card">
                <div class="card-header">
                    <span class="card-title">${campaign.name}</span>
                    <span>${getStatusBadge(campaign.status)}</span>
                </div>
                
                <p><strong>📖 Descripción:</strong> ${campaign.description}</p>
                <p><strong>🎲 Sistema:</strong> ${campaign.system}</p>
                <p><strong>👥 Jugadores:</strong> ${campaign.maxPlayers}</p>
                <p><strong>📅 Creada:</strong> ${formatDate(campaign.createdAt)}</p>
                <p><strong>👤 Creador:</strong> ${getUserName(campaign.userId)}</p>
                <p><strong>⭐ Valoración:</strong> ${campaign.rating && campaign.ratings?.length > 0 ? campaign.rating.toFixed(1) + '/5' : 'Sin valorar'} (${campaign.ratings?.length || 0} valoraciones)</p>
            </div>

            ${isLoggedIn() && !userRating && campaign.status === 'published' ? `
                <div class="card">
                    <h4>⭐ Valorar esta campaña</h4>
                    <div class="stars" id="ratingStars">
                        ${[1,2,3,4,5].map(i => `
                            <span class="star" data-value="${i}" onclick="rateCampaign(${campaign.id}, ${i})">★</span>
                        `).join('')}
                    </div>
                </div>
            ` : isLoggedIn() && userRating ? `
                <div class="card">
                    <h4>⭐ ¡Ya valoraste esta campaña! (${campaign.ratings.find(r => r.userId === DB.currentUser.id)?.rating || ''} estrellas)</h4>
                </div>
            ` : ''}

            <div class="card">
                <h4>💬 Comentarios (${campaign.comments?.length || 0})</h4>
                ${commentsHTML}
                
                ${isLoggedIn() ? `
                    <br>
                    <form onsubmit="handleComment(event, ${campaign.id})">
                        <div class="form-group">
                            <label>Agregar comentario</label>
                            <textarea id="commentText" placeholder="Escribe tu comentario..." required></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary btn-sm">Publicar comentario</button>
                    </form>
                ` : `<p style="color:#6c757d;">Inicia sesión para comentar</p>`}
            </div>

            ${isLoggedIn() && campaign.status === 'published' ? `
                <div class="card">
                    <button class="btn btn-danger btn-sm" onclick="openReportModal(${campaign.id}, 'campaign')">
                        🚨 Reportar contenido inapropiado
                    </button>
                </div>
            ` : ''}
        </div>
    `;
}

// ============================================================
// VALORACIONES
// ============================================================

function rateCampaign(campaignId, rating) {
    if (!isLoggedIn()) {
        showToast('🔒 Debes iniciar sesión para valorar', 'warning');
        navigateTo('login');
        return;
    }

    const campaign = getCampaign(campaignId);
    if (!campaign) {
        showToast('Campaña no encontrada', 'error');
        return;
    }

    if (campaign.ratings && campaign.ratings.some(r => r.userId === DB.currentUser.id)) {
        showToast('Ya valoraste esta campaña', 'info');
        return;
    }

    if (!campaign.ratings) campaign.ratings = [];
    campaign.ratings.push({ userId: DB.currentUser.id, rating: rating });
    
    const total = campaign.ratings.reduce((sum, r) => sum + r.rating, 0);
    campaign.rating = total / campaign.ratings.length;

    document.querySelectorAll('#ratingStars .star').forEach(s => {
        s.classList.toggle('active', parseInt(s.dataset.value) <= rating);
    });

    showToast(`⭐ ¡Valoraste esta campaña con ${rating} estrellas!`, 'success');
    
    setTimeout(() => navigateTo('campaign-detail', campaignId), 500);
}

// ============================================================
// COMENTARIOS
// ============================================================

function handleComment(event, campaignId) {
    event.preventDefault();
    if (!isLoggedIn()) {
        showToast('🔒 Debes iniciar sesión para comentar', 'warning');
        navigateTo('login');
        return;
    }

    const text = document.getElementById('commentText').value.trim();
    if (!text) {
        showToast('El comentario no puede estar vacío', 'error');
        return;
    }

    const campaign = getCampaign(campaignId);
    if (!campaign) {
        showToast('Campaña no encontrada', 'error');
        return;
    }

    if (!campaign.comments) campaign.comments = [];
    campaign.comments.push({
        id: generateId('comment'),
        userId: DB.currentUser.id,
        text: text,
        date: new Date().toISOString().split('T')[0]
    });

    showToast('💬 Comentario publicado', 'success');
    navigateTo('campaign-detail', campaignId);
}

function deleteComment(campaignId, commentId) {
    if (!isLoggedIn()) {
        showToast('🔒 Debes iniciar sesión', 'warning');
        return;
    }
    
    if (!confirm('¿Eliminar este comentario?')) return;
    const campaign = getCampaign(campaignId);
    if (!campaign) return;
    campaign.comments = campaign.comments.filter(c => c.id !== commentId);
    showToast('🗑️ Comentario eliminado', 'info');
    navigateTo('campaign-detail', campaignId);
}

// ============================================================
// REPORTES
// ============================================================

function openReportModal(contentId, contentType) {
    if (!isLoggedIn()) {
        showToast('🔒 Debes iniciar sesión para reportar contenido', 'warning');
        navigateTo('login');
        return;
    }
    
    openModal(`
        <h2>🚨 Reportar Contenido</h2>
        <p>¿Por qué consideras que este contenido es inapropiado?</p>
        <form onsubmit="handleReport(event, ${contentId}, '${contentType}')">
            <div class="form-group">
                <label>Motivo del reporte</label>
                <select id="reportReason" required>
                    <option value="">Selecciona un motivo</option>
                    <option value="ofensivo">Contenido ofensivo</option>
                    <option value="spam">Spam o publicidad</option>
                    <option value="inapropiado">Contenido inapropiado</option>
                    <option value="falso">Información falsa</option>
                    <option value="otros">Otros</option>
                </select>
            </div>
            <button type="submit" class="btn btn-danger btn-block">Enviar reporte</button>
        </form>
    `);
}

function handleReport(event, contentId, contentType) {
    event.preventDefault();
    
    if (!isLoggedIn()) {
        showToast('🔒 Debes iniciar sesión', 'warning');
        closeModal();
        navigateTo('login');
        return;
    }
    
    const reason = document.getElementById('reportReason').value;

    if (!reason) {
        showToast('Selecciona un motivo', 'error');
        return;
    }

    const newReport = {
        id: generateId('report'),
        contentId: contentId,
        contentType: contentType,
        reason: reason,
        reportedBy: DB.currentUser.id,
        status: 'pending',
        createdAt: new Date().toISOString().split('T')[0]
    };
    DB.reports.push(newReport);

    closeModal();
    showToast('✅ Reporte enviado. El moderador revisará el contenido.', 'success');
    navigateTo('explore');
}

// ============================================================
// MODERADOR - GESTIÓN DE PERFILES DE MODERADOR
// ============================================================

function renderModerator(container) {
    if (!isModerator() && !isAdmin()) {
        container.innerHTML = `
            <div class="page">
                <div class="alert alert-danger" style="text-align:center; padding:3rem;">
                    <div style="font-size:4rem; margin-bottom:1rem;">⛔</div>
                    <h2>Acceso denegado</h2>
                    <p style="color:#6c757d;">Solo moderadores pueden acceder a esta sección.</p>
                    <br>
                    <button class="btn btn-primary" onclick="navigateTo('home')">Volver al inicio</button>
                </div>
            </div>
        `;
        return;
    }

    const pendingReports = DB.reports.filter(r => r.status === 'pending');
    const reviewedReports = DB.reports.filter(r => r.status === 'reviewed');
    const moderators = DB.users.filter(u => u.role === 'moderator' || u.role === 'admin');

    let pendingHTML = '';
    if (pendingReports.length === 0) {
        pendingHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">✅</div>
                <div class="empty-state-title">No hay reportes pendientes</div>
                <div class="empty-state-text">La comunidad está tranquila</div>
            </div>
        `;
    } else {
        pendingHTML = pendingReports.map(r => {
            const content = r.contentType === 'campaign' ? 
                getCampaign(r.contentId) : 
                getCharacter(r.contentId);
            const contentName = content ? content.name : 'Contenido eliminado';
            
            return `
                <div class="card">
                    <div class="card-header">
                        <span class="card-title">🚨 Reporte #${r.id}</span>
                        <span class="status-badge status-draft">⏳ Pendiente</span>
                    </div>
                    <p><strong>Contenido:</strong> ${contentName}</p>
                    <p><strong>Tipo:</strong> ${r.contentType}</p>
                    <p><strong>Motivo:</strong> ${r.reason}</p>
                    <p><strong>Reportado por:</strong> ${getUserName(r.reportedBy)}</p>
                    <p><strong>Fecha:</strong> ${formatDate(r.createdAt)}</p>
                    <div style="display:flex; gap:0.5rem; margin-top:0.5rem; flex-wrap:wrap;">
                        <button class="btn btn-danger btn-sm" onclick="removeContent(${r.id}, ${r.contentId}, '${r.contentType}')">
                            🚫 Retirar contenido
                        </button>
                        <button class="btn btn-outline btn-sm" onclick="dismissReport(${r.id})">
                            ✅ Desestimar reporte
                        </button>
                        ${r.contentType === 'campaign' ? `
                            <button class="btn btn-outline btn-sm" onclick="navigateTo('campaign-detail', ${r.contentId})">
                                👁️ Ver contenido
                            </button>
                        ` : r.contentType === 'character' ? `
                            <button class="btn btn-outline btn-sm" onclick="navigateTo('character-detail', ${r.contentId})">
                                👁️ Ver contenido
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    let reviewedHTML = '';
    if (reviewedReports.length > 0) {
        reviewedHTML = reviewedReports.map(r => `
            <div class="card">
                <div class="card-header">
                    <span class="card-title">✅ Reporte #${r.id}</span>
                    <span class="status-badge status-published">✅ Revisado</span>
                </div>
                <p><strong>Motivo:</strong> ${r.reason}</p>
                <p><strong>Fecha:</strong> ${formatDate(r.createdAt)}</p>
            </div>
        `).join('');
    }

    let moderatorsHTML = moderators.length > 0 ?
        moderators.map(u => `
            <div class="card">
                <div class="card-header">
                    <span class="card-title">${u.name}</span>
                    <span class="status-badge ${u.role === 'admin' ? 'status-published' : 'status-draft'}">${u.role === 'admin' ? '👑 Admin' : '🛡️ Moderador'}</span>
                </div>
                <p><strong>📧 Correo:</strong> ${u.email}</p>
                <p><strong>📅 ID:</strong> #${u.id}</p>
                ${isAdmin() && u.id !== DB.currentUser.id ? `
                    <button class="btn btn-danger btn-sm" onclick="removeModerator(${u.id})">🗑️ Remover moderador</button>
                ` : ''}
            </div>
        `).join('') :
        '<p style="color:#6c757d;">No hay moderadores registrados</p>';

    container.innerHTML = `
        <div class="page">
            <h1 class="page-title">🛡️ Panel de Moderación</h1>
            <p class="page-subtitle">Gestiona los reportes y moderadores de la comunidad</p>

            ${isAdmin() ? `
                <div class="card" style="border: 2px solid #f7971e;">
                    <h3>👑 Administración de Moderadores</h3>
                    <p>Asigna o remueve permisos de moderador a usuarios.</p>
                    <br>
                    <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                        <select id="userToModerate" style="padding:0.6rem 1rem; border:2px solid #e0e0e0; border-radius:8px; flex:1;">
                            <option value="">Selecciona un usuario...</option>
                            ${DB.users.filter(u => u.role === 'user').map(u => `
                                <option value="${u.id}">${u.name} (${u.email})</option>
                            `).join('')}
                        </select>
                        <button class="btn btn-primary" onclick="assignModerator()">➕ Asignar Moderador</button>
                    </div>
                </div>
            ` : ''}

            <h2>👥 Moderadores (${moderators.length})</h2>
            ${moderatorsHTML}

            <br>
            <h2>📋 Reportes Pendientes (${pendingReports.length})</h2>
            ${pendingHTML}

            <br>
            <h2>📋 Reportes Revisados (${reviewedReports.length})</h2>
            ${reviewedHTML || '<p style="color:#6c757d;">No hay reportes revisados aún</p>'}
        </div>
    `;
}

// ============================================================
// ADMIN - ASIGNAR MODERADOR
// ============================================================

function assignModerator() {
    if (!isAdmin()) {
        showToast('⛔ Solo administradores pueden asignar moderadores', 'error');
        return;
    }

    const select = document.getElementById('userToModerate');
    const userId = parseInt(select.value);

    if (!userId) {
        showToast('Selecciona un usuario', 'warning');
        return;
    }

    const user = DB.users.find(u => u.id === userId);
    if (!user) {
        showToast('Usuario no encontrado', 'error');
        return;
    }

    if (user.role === 'moderator' || user.role === 'admin') {
        showToast('Este usuario ya es moderador o administrador', 'info');
        return;
    }

    user.role = 'moderator';
    showToast(`✅ ${user.name} ahora es moderador`, 'success');
    navigateTo('moderator');
}

function removeModerator(userId) {
    if (!isAdmin()) {
        showToast('⛔ Solo administradores pueden remover moderadores', 'error');
        return;
    }

    if (!confirm('¿Estás seguro de remover este moderador?')) return;

    const user = DB.users.find(u => u.id === userId);
    if (!user) {
        showToast('Usuario no encontrado', 'error');
        return;
    }

    if (user.role === 'admin') {
        showToast('No puedes remover a un administrador', 'error');
        return;
    }

    user.role = 'user';
    showToast(`✅ ${user.name} ya no es moderador`, 'info');
    navigateTo('moderator');
}

// ============================================================
// MODERADOR - GESTIÓN DE REPORTES
// ============================================================

function dismissReport(reportId) {
    if (!isModerator() && !isAdmin()) {
        showToast('⛔ Acceso denegado', 'error');
        return;
    }
    
    if (!confirm('¿Desestimar este reporte?')) return;
    const report = DB.reports.find(r => r.id === reportId);
    if (report) report.status = 'reviewed';
    showToast('✅ Reporte desestimado', 'info');
    navigateTo('moderator');
}

function removeContent(reportId, contentId, contentType) {
    if (!isModerator() && !isAdmin()) {
        showToast('⛔ Acceso denegado', 'error');
        return;
    }
    
    if (!confirm('⚠️ ¿Retirar este contenido de la comunidad? Esta acción es irreversible.')) return;

    if (contentType === 'campaign') {
        const campaign = getCampaign(contentId);
        if (campaign) {
            campaign.status = 'removed';
            showToast('🚫 Campaña retirada', 'warning');
        }
    } else if (contentType === 'character') {
        const character = getCharacter(contentId);
        if (character) {
            character.status = 'removed';
            showToast('🚫 Personaje retirado', 'warning');
        }
    }

    const report = DB.reports.find(r => r.id === reportId);
    if (report) report.status = 'reviewed';

    showToast('✅ Contenido retirado correctamente. El creador recibirá una notificación.', 'success');
    navigateTo('moderator');
}

// ============================================================
// PERFIL
// ============================================================

function renderProfile(container, userId) {
    // Si se pasa un userId específico, mostrar perfil de ese usuario
    // Si no, mostrar el perfil del usuario actual
    const targetUserId = userId || (isLoggedIn() ? DB.currentUser.id : null);
    
    if (!targetUserId) {
        container.innerHTML = `
            <div class="page">
                <div class="card" style="text-align:center; padding:3rem; max-width:500px; margin:0 auto;">
                    <div style="font-size:4rem; margin-bottom:1rem;">🔒</div>
                    <h2>Acceso restringido</h2>
                    <p style="color:#6c757d; margin-bottom:1.5rem;">Debes iniciar sesión para ver tu perfil.</p>
                    <button class="btn btn-primary" onclick="navigateTo('login')">Iniciar Sesión</button>
                    <br><br>
                    <p>¿No tienes cuenta? <a href="javascript:void(0)" onclick="navigateTo('register')">Regístrate aquí</a></p>
                </div>
            </div>
        `;
        return;
    }

    const user = DB.users.find(u => u.id === targetUserId);
    if (!user) {
        container.innerHTML = `<div class="alert alert-danger">Usuario no encontrado</div>`;
        return;
    }

    const isOwnProfile = isLoggedIn() && DB.currentUser.id === targetUserId;
    const myCharacters = DB.characters.filter(c => c.userId === targetUserId && c.status === 'published');
    const myCampaigns = DB.campaigns.filter(c => c.userId === targetUserId && c.status === 'published');

    container.innerHTML = `
        <div class="page">
            <h1 class="page-title">${isOwnProfile ? '👤 Mi Perfil' : `👤 Perfil de ${user.name}`}</h1>
            
            <div class="card">
                <h3>${user.name}</h3>
                ${isOwnProfile ? `<p><strong>📧 Correo:</strong> ${user.email}</p>` : ''}
                <p><strong>👤 Rol:</strong> ${user.role === 'admin' ? '👑 Administrador' : user.role === 'moderator' ? '🛡️ Moderador' : '🎲 Jugador'}</p>
                <p><strong>📅 Miembro desde:</strong> ${formatDate(user.createdAt || new Date().toISOString().split('T')[0])}</p>
                ${isOwnProfile ? `
                    <br>
                    <button class="btn btn-outline btn-sm" onclick="editProfile()">✏️ Editar perfil</button>
                ` : ''}
            </div>

            <div class="grid-2">
                <div class="card" onclick="navigateTo('characters')" style="cursor:pointer;">
                    <h4>📜 Personajes publicados (${myCharacters.length})</h4>
                    ${myCharacters.length > 0 ? 
                        myCharacters.map(c => `<p>• ${c.name} (${c.race} ${c.class})</p>`).join('') :
                        '<p style="color:#6c757d;">No ha publicado personajes</p>'
                    }
                </div>
                <div class="card" onclick="navigateTo('explore')" style="cursor:pointer;">
                    <h4>🏰 Campañas publicadas (${myCampaigns.length})</h4>
                    ${myCampaigns.length > 0 ? 
                        myCampaigns.map(c => `<p>• ${c.name} (⭐ ${c.rating && c.ratings?.length > 0 ? c.rating.toFixed(1) : 'Sin valorar'})</p>`).join('') :
                        '<p style="color:#6c757d;">No ha publicado campañas</p>'
                    }
                </div>
            </div>
        </div>
    `;
}

function editProfile() {
    if (!isLoggedIn()) {
        showToast('🔒 Debes iniciar sesión para editar tu perfil', 'warning');
        navigateTo('login');
        return;
    }
    
    const user = DB.currentUser;
    openModal(`
        <h2>✏️ Editar Perfil</h2>
        <form onsubmit="saveProfile(event)">
            <div class="form-group">
                <label>Nombre</label>
                <input type="text" id="editName" value="${user.name}" required>
            </div>
            <div class="form-group">
                <label>Nueva contraseña (dejar vacío para no cambiar)</label>
                <input type="password" id="editPassword" placeholder="Nueva contraseña" minlength="6">
            </div>
            <button type="submit" class="btn btn-primary btn-block">Guardar cambios</button>
        </form>
    `);
}

function saveProfile(event) {
    event.preventDefault();
    
    if (!isLoggedIn()) {
        showToast('🔒 Debes iniciar sesión', 'warning');
        closeModal();
        navigateTo('login');
        return;
    }
    
    const user = DB.currentUser;
    const name = document.getElementById('editName').value.trim();
    const password = document.getElementById('editPassword').value;

    if (!name) {
        showToast('El nombre no puede estar vacío', 'error');
        return;
    }

    user.name = name;
    if (password && password.length >= 6) {
        user.password = password;
    }

    closeModal();
    showToast('✅ Perfil actualizado correctamente', 'success');
    navigateTo('profile');
}

// ============================================================
// MODAL
// ============================================================

function openModal(html) {
    const overlay = document.getElementById('modalOverlay');
    const body = document.getElementById('modalBody');
    if (overlay && body) {
        body.innerHTML = html;
        overlay.style.display = 'flex';
    }
}

function closeModal() {
    const overlay = document.getElementById('modalOverlay');
    const body = document.getElementById('modalBody');
    if (overlay) {
        overlay.style.display = 'none';
    }
    if (body) {
        body.innerHTML = '';
    }
}

// ============================================================
// INICIALIZACIÓN
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Portal de Rol inicializado');
    console.log('📊 Base de datos vacía - Sin ejemplos');
    console.log('💡 Crea tu primer usuario para comenzar');
    
    navigateTo('home');
});