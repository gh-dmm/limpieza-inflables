const STORAGE_KEY = 'inflables_data';
const iniciales = [
    { id: 1, nombre: "Castillo", rentas: 0, estado: 'limpio' },
    { id: 2, nombre: "Unicornios", rentas: 0, estado: 'limpio' },
    { id: 3, nombre: "Princesas", rentas: 0, estado: 'limpio' },
    { id: 4, nombre: "Doble resbaladilla", rentas: 0, estado: 'limpio' },
    { id: 5, nombre: "Paw patrol", rentas: 0, estado: 'limpio' },
    { id: 6, nombre: "Bluey", rentas: 0, estado: 'limpio' },
    { id: 7, nombre: "Mickey", rentas: 0, estado: 'limpio' },
    { id: 8, nombre: "Dinosaurios", rentas: 0, estado: 'limpio' },
    { id: 9, nombre: "Multi-interactivo", rentas: 0, estado: 'limpio' },
    { id: 10, nombre: "Mario", rentas: 0, estado: 'limpio' },
    { id: 11, nombre: "Spiderman", rentas: 0, estado: 'limpio' }
    // ... agrega hasta los 11
];

let inflables = JSON.parse(localStorage.getItem(STORAGE_KEY)) || iniciales;
function marcarLimpio(id) {
    const item = inflables.find(i => i.id === id);
    
    if (item) {
        item.estado = 'limpio';
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(inflables));
        
        renderizar();
    }
}

function resetApp() {
    if(confirm("¿Estás seguro de borrar TODA la base de datos local y reiniciar?")) {
        localStorage.removeItem('inflables_data');
        location.reload();
    }
}
function mostrarReporte() {
    const modal = document.getElementById("miModal");
    const contenedor = document.getElementById("contenido-reporte");
    
    // Agrupamos la lógica de lista que definimos antes
    const grupos = {
        limpio: inflables.filter(i => i.estado === 'limpio'),
        sucio: inflables.filter(i => i.estado === 'sucio'),
        'en-reparacion': inflables.filter(i => i.estado === 'en-reparacion')
    };

    let html = "<h2>Reporte Categorizado</h2><hr>";
    for (const [estado, lista] of Object.entries(grupos)) {
        html += `<h4>${estado.toUpperCase()}</h4><ul>`;
        lista.forEach(i => html += `<li>${i.nombre} - Rentas: ${i.rentas}</li>`);
        html += `</ul>`;
    }

    contenedor.innerHTML = html;
    modal.style.display = "block"; // Abre el modal
}

function cerrarModal() {
    document.getElementById("miModal").style.display = "none";
}


function renderizar() {
    const container = document.getElementById('inflables-container');
    container.innerHTML = '';
    
    inflables.forEach(item => {
        const col = document.createElement('div');
        col.className = 'col';
        
        // Determinar color de badge
        const badgeClass = item.estado === 'limpio' ? 'bg-primary' : 'bg-warning text-dark';
        const icono = item.estado === 'limpio' ? 'bi-check-circle' : 'bi-exclamation-triangle';

        col.innerHTML = `
            <div class="card h-100 border-0 shadow-sm">
                <div class="card-body">
                    <h5 class="card-title fw-bold">${item.nombre}</h5>
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <span class="badge ${badgeClass} badge-status"><i class="bi ${icono}"></i> ${item.estado.toUpperCase()}</span>
                        <span class="text-muted fw-bold">Rentado: ${item.rentas} veces</span>
                    </div>
                    
                    <p class="card-text">
                        <small class="text-muted">
                        Rentas: <strong>${item.rentas}</strong> 
                        ${item.fechaUltimaRenta ? `<br>Última renta: ${item.fechaUltimaRenta}` : ''}
                        </small>
                    </p>
                    <div class="d-grid gap-2 mt-2">
                        <button class="btn btn-success btn-sm" onclick="rentar(${item.id})">
                            <i class="bi bi-plus-circle"></i> Rentar
                        </button>
                        <button class="btn btn-outline-secondary btn-sm" onclick="marcarLimpio(${item.id})">
                            <i class="bi bi-stars"></i> Marcar Limpio
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="reparar(${item.id})">
    <i class="bi bi-tools"></i> Reparar
</button>

                    </div>
                </div>
            </div>
        `;
        container.appendChild(col);
    });
}

function rentar(id) {
    const item = inflables.find(i => i.id === id);
    
    const fechaActual = new Date().toLocaleDateString('es-ES', {
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric'
    });

    item.rentas++;
    item.estado = 'sucio';
    item.fechaUltimaRenta = fechaActual; // Nuevo campo para el historial
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inflables));
    renderizar();
}
function reparar(id) {
    const item = inflables.find(i => i.id === id);
    if (item) {
        item.estado = 'en-reparacion';
        localStorage.setItem(STORAGE_KEY, JSON.stringify(inflables));
        renderizar(); 
    }
}




function limpiarDatos() {
    if (confirm("¿Estás seguro de que quieres reiniciar todos los contadores a cero y marcar todos como limpios?")) {
        inflables = inflables.map(item => ({
            ...item, 
            rentas: 0, 
            estado: 'limpio'
        }));
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(inflables));
        renderizar();
    }
}

function exportarExcel() {
      let csvContent = "data:text/csv;charset=utf-8,\uFEFFID,Nombre,Rentas,Estado,Última Renta\n";
    
    inflables.forEach(item => {
        const nombre = item.nombre.replace(/,/g, " ");
        const fecha = item.fechaUltimaRenta || "Sin rentas";
        
        csvContent += `${item.id},${nombre},${item.rentas},${item.estado},${fecha}\n`;
    });

    // 3. Creación del archivo de descarga
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "reporte_inflables.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ... función limpiarDatos igual que antes
renderizar();
