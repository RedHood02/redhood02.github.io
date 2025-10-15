// Variable global para almacenar todos los usuarios
let allUsers = [];

/**
 * Función principal para cargar los datos de la API
 * Realiza una petición a JSONPlaceholder API para obtener usuarios
 */
function loadUsers() {
    // Mostrar mensaje de carga
    document.getElementById('loadingMessage').style.display = 'block';
    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('usersContainer').innerHTML = '';

    // Realizar la petición a la API
    fetch('https://jsonplaceholder.typicode.com/users')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta de la API');
            }
            return response.json();
        })
        .then(users => {
            // Ocultar mensaje de carga
            document.getElementById('loadingMessage').style.display = 'none';
            
            // Guardar todos los usuarios para el filtrado
            allUsers = users;
            
            // Mostrar usuarios
            displayUsers(users);
        })
        .catch(error => {
            console.error('Error al cargar los usuarios:', error);
            
            // Ocultar mensaje de carga y mostrar error
            document.getElementById('loadingMessage').style.display = 'none';
            document.getElementById('errorMessage').style.display = 'block';
        });
}

/**
 * Función para mostrar los usuarios en la interfaz
 * Crea tarjetas para cada usuario con su información
 */
function displayUsers(users) {
    const container = document.getElementById('usersContainer');
    
    // Limpiar contenedor
    container.innerHTML = '';
    
    // Si no hay usuarios, mostrar mensaje
    if (users.length === 0) {
        container.innerHTML = '<div class="col-12"><p class="text-center">No se encontraron usuarios que coincidan con el filtro.</p></div>';
        return;
    }
    
    // Crear tarjetas para cada usuario
    users.forEach(user => {
        const userCard = document.createElement('div');
        userCard.className = 'col-md-6 col-lg-4';
        
        // Crear avatar con las iniciales del usuario
        const initials = getUserInitials(user.name);
        
        userCard.innerHTML = `
            <div class="card h-100">
                <div class="card-body">
                    <div class="user-avatar">${initials}</div>
                    <h5 class="card-title">${user.name}</h5>
                    <p class="card-text">
                        <strong>Usuario:</strong> ${user.username}<br>
                        <strong>Email:</strong> ${user.email}<br>
                        <strong>Teléfono:</strong> ${user.phone}<br>
                        <strong>Ciudad:</strong> ${user.address.city}
                    </p>
                    <a href="https://${user.website}" target="_blank" class="btn btn-outline-primary btn-sm">Visitar sitio web</a>
                </div>
            </div>
        `;
        
        container.appendChild(userCard);
    });
}

/**
 * Función para obtener las iniciales de un nombre
 */
function getUserInitials(name) {
    return name.split(' ').map(n => n[0]).join('');
}

/**
 * Función para filtrar usuarios según el texto ingresado
 * Filtra por nombre, email o ciudad
 */
function filterUsers() {
    const filterValue = document.getElementById('filterInput').value.toLowerCase();
    
    if (filterValue === '') {
        // Si no hay filtro, mostrar todos los usuarios
        displayUsers(allUsers);
    } else {
        // Filtrar usuarios por nombre, email o ciudad
        const filteredUsers = allUsers.filter(user => 
            user.name.toLowerCase().includes(filterValue) ||
            user.email.toLowerCase().includes(filterValue) ||
            user.address.city.toLowerCase().includes(filterValue)
        );
        
        // Mostrar usuarios filtrados
        displayUsers(filteredUsers);
    }
}

/**
 * Función para inicializar la aplicación
 * Configura event listeners y carga los datos iniciales
 */
function initApp() {
    // Cargar usuarios al iniciar
    loadUsers();
    
    // Configurar eventos para el filtro
    document.getElementById('filterButton').addEventListener('click', filterUsers);
    document.getElementById('filterInput').addEventListener('keyup', function(event) {
        // Filtrar al presionar Enter
        if (event.key === 'Enter') {
            filterUsers();
        }
    });
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initApp);