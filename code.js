const STORAGE_KEY = 'inflables_data';
// Nota: Si despliegas frontend y backend en servidores/dominios separados, cambia '/api/inflables' por la URL absoluta de tu backend (ej. 'https://tu-dominio.com/api/inflables')
const API_URL = '/api/inflables';

const iniciales = [
    { id: 1, nombre: "Castillo", rentas: 0, estado: 'limpio', fechaUltimaRenta: '' },
    { id: 2, nombre: "Unicornios", rentas: 0, estado: 'limpio', fechaUltimaRenta: '' },
    { id: 3, nombre: "Princesas", rentas: 0, estado: 'limpio', fechaUltimaRenta: '' },
    { id: 4, nombre: "Doble resbaladilla", rentas: 0, estado: 'limpio', fechaUltimaRenta: '' },
    { id: 5, nombre: "Paw patrol", rentas: 0, estado: 'limpio', fechaUltimaRenta: '' },
    { id: 6, nombre: "Bluey", rentas: 0, estado: 'limpio', fechaUltimaRenta: '' },
    { id: 7, nombre: "Mickey", rentas: 0, estado: 'limpio', fechaUltimaRenta: '' },
    { id: 8, nombre: "Dinosaurios", rentas: 0, estado: 'limpio', fechaUltimaRenta: '' },
    { id: 9, nombre: "Multi-interactivo", rentas: 0, estado: 'limpio', fechaUltimaRenta: '' },
    { id: 10, nombre: "Mario", rentas: 0, estado: 'limpio', fechaUltimaRenta: '' },
    { id: 11, nombre: "Spiderman", rentas: 0, estado: 'limpio', fechaUltimaRenta: '' }
];

let inflables = [];

async function cargarInflables() {
    try {
        const response = await fetch(API_URL, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error('No se pudo cargar inventario');
        }

        inflables = await response.json();
        renderizar();
        if (document.getElementById('dashboard-section') && !document.getElementById('dashboard-section').classList.contains('d-none')) {
            renderDashboard();
        }
    } catch (error) {
        console.error(error);
        inflables = [...iniciales];
        await guardarInflablesEnServidor();
        renderizar();
    }
}

async function guardarInflablesEnServidor() {
    try {
        await fetch(API_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(inflables)
        });
    } catch (error) {
        console.error('Error al guardar inventario en servidor:', error);
    }
}

async function marcarLimpio(id) {
    const item = inflables.find(i => i.id === id);
    if (!item) return;

    if (item.estado === 'sucio' || item.estado === 'en-reparacion') {
        item.estado = 'limpio';
    } else if (item.estado === 'limpio') {
        item.estado = 'sucio';
    }

    await guardarInflablesEnServidor();
    renderizar();

    if (document.getElementById('dashboard-section') && !document.getElementById('dashboard-section').classList.contains('d-none')) {
        renderDashboard();
    }
}

function resetApp() {
    if(confirm("¿Estás seguro de borrar TODA la base de datos local y reiniciar?")) {
        inflables = [...iniciales];
        guardarInflablesEnServidor();
        renderizar();
        if (document.getElementById('dashboard-section') && !document.getElementById('dashboard-section').classList.contains('d-none')) {
            renderDashboard();
        }
    }
}

function abrirModalNuevoInflable() {
    const modal = document.getElementById('nuevoInflableModal');
    const input = document.getElementById('nombreNuevoInflable');
    if (modal) {
        modal.style.display = 'block';
    }
    if (input) {
        input.value = '';
        input.focus();
    }
}

function cerrarModalNuevoInflable() {
    const modal = document.getElementById('nuevoInflableModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function guardarNuevoInflable() {
    const input = document.getElementById('nombreNuevoInflable');
    const nombre = input ? input.value.trim() : '';

    if (!nombre) {
        alert('Escribe el nombre del inflable antes de guardar.');
        return;
    }

    // CORRECCIÓN: Se genera un ID numérico secuencial entero para evitar overflow del tipo INTEGER en la base de datos
    const nuevoId = inflables.length > 0 ? Math.max(...inflables.map(i => i.id)) + 1 : 1;

    const nuevoInflable = {
        id: nuevoId,
        nombre,
        rentas: 0,
        estado: 'limpio',
        fechaUltimaRenta: ''
    };

    inflables.push(nuevoInflable);
    cerrarModalNuevoInflable();
    guardarInflablesEnServidor();
    renderizar();

    if (document.getElementById('dashboard-section') && !document.getElementById('dashboard-section').classList.contains('d-none')) {
        renderDashboard();
    }
}

function mostrarReporte() {
    const dashboardSection = document.getElementById('dashboard-section');
    const inflablesContainer = document.getElementById('inflables-container');

    if (dashboardSection && inflablesContainer) {
        inflablesContainer.classList.add('d-none');
        dashboardSection.classList.remove('d-none');
        renderDashboard();
    }
}

function volverInventario() {
    const dashboardSection = document.getElementById('dashboard-section');
    const inflablesContainer = document.getElementById('inflables-container');

    if (dashboardSection && inflablesContainer) {
        dashboardSection.classList.add('d-none');
        inflablesContainer.classList.remove('d-none');
    }
}

function renderDashboard() {
    const totalRentas = inflables.reduce((acc, item) => acc + item.rentas, 0);
    const limpios = inflables.filter(i => i.estado === 'limpio').length;
    const sucios = inflables.filter(i => i.estado === 'sucio').length;
    const reparaciones = inflables.filter(i => i.estado === 'en-reparacion').length;

    const kpiRentas = document.getElementById('kpi-rentas');
    const kpiLimpios = document.getElementById('kpi-limpios');
    const kpiSucios = document.getElementById('kpi-sucios');
    const kpiReparacion = document.getElementById('kpi-reparacion');

    if (kpiRentas) kpiRentas.textContent = totalRentas;
    if (kpiLimpios) kpiLimpios.textContent = limpios;
    if (kpiSucios) kpiSucios.textContent = sucios;
    if (kpiReparacion) kpiReparacion.textContent = reparaciones;

    const barChart = document.getElementById('bar-chart');
    if (barChart) {
        barChart.innerHTML = inflables.map(item => {
            const max = Math.max(...inflables.map(x => x.rentas), 1);
            const width = Math.max((item.rentas / max) * 100, item.rentas > 0 ? 10 : 4);
            return `<div class="bar-row">
                <span class="bar-label">${item.nombre}</span>
                <div class="bar-track">
                    <div class="bar-fill" style="width: ${width}%;"></div>
                </div>
                <span class="bar-value">${item.rentas}</span>
            </div>`;
        }).join('');
    }

    const donutChart = document.getElementById('donut-chart');
    const legend = document.getElementById('legend-list');
    if (donutChart && legend) {
        const total = inflables.length || 1;
        donutChart.style.background = `conic-gradient( #9fbd2b 0% ${Math.round((limpios/total)*100)}%, #B6491C ${Math.round((limpios/total)*100)}% ${Math.round(((limpios + sucios)/total)*100)}%, #9a7a34 ${Math.round(((limpios + sucios)/total)*100)}% 100%)`;
        legend.innerHTML = `
            <li><span class="legend-dot clean"></span>Limpios: ${limpios}</li>
            <li><span class="legend-dot dirty"></span>Sucios: ${sucios}</li>
            <li><span class="legend-dot repair"></span>Reparaciones: ${reparaciones}</li>
        `;
    }

    const tableBody = document.getElementById('dashboard-table-body');
    if (tableBody) {
        tableBody.innerHTML = inflables.map(item => `
            <tr>
                <td><span class="row-name">${item.nombre}</span></td>
                <td>${item.rentas}</td>
                <td>
                    <span class="status-pill ${item.estado}">${item.estado}</span>
                </td>
                <td>${item.fechaUltimaRenta || 'Sin renta'}</td>
            </tr>
        `).join('');
    }
}

function cerrarModal() {
    const modal = document.getElementById("miModal");
    if (modal) {
        modal.style.display = "none";
    }
}

function renderizar() {
    const container = document.getElementById('inflables-container');
    if (!container) return;
    container.innerHTML = '';
    
    inflables.forEach(item => {
        const col = document.createElement('div');
        col.className = 'col';
        
        const badgeClass = item.estado === 'limpio' ? 'badge-limpio' : 'badge-sucio';
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
    if (!item) return;
    
    const fechaActual = new Date().toLocaleDateString('es-ES', {
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric'
    });

    item.rentas++;
    item.estado = 'sucio';
    item.fechaUltimaRenta = fechaActual;

    guardarInflablesEnServidor();
    renderizar();

    if (document.getElementById('dashboard-section') && !document.getElementById('dashboard-section').classList.contains('d-none')) {
        renderDashboard();
    }
}

function reparar(id) {
    const item = inflables.find(i => i.id === id);
    if (item) {
        item.estado = 'en-reparacion';
        guardarInflablesEnServidor();
        renderizar();

        if (document.getElementById('dashboard-section') && !document.getElementById('dashboard-section').classList.contains('d-none')) {
            renderDashboard();
        }
    }
}

async function limpiarDatos() {
    if (confirm("¿Estás seguro de que quieres reiniciar todos los contadores a cero y marcar todos como limpios?")) {
        inflables = inflables.map(item => ({
            ...item,
            rentas: 0,
            estado: 'limpio',
            fechaUltimaRenta: ''
        }));

        await guardarInflablesEnServidor();
        renderizar();

        if (document.getElementById('dashboard-section') && !document.getElementById('dashboard-section').classList.contains('d-none')) {
            renderDashboard();
        }
    }
}

function exportarExcel() {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFFID,Nombre,Rentas,Estado,Última Renta\n";
    
    inflables.forEach(item => {
        const nombre = item.nombre.replace(/,/g, " ");
        const fecha = item.fechaUltimaRenta || "Sin rentas";
        
        csvContent += `${item.id},${nombre},${item.rentas},${item.estado},${fecha}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "reporte_inflables.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function boot() {
    await cargarInflables();
    setInterval(async () => {
        await cargarInflables();
    }, 3000);
}

boot();