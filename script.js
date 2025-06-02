document.addEventListener('DOMContentLoaded', () => {
    const eventForm = document.getElementById('event-form');
    const errorMessage = document.getElementById('error-message');

  
    displayEvents();

    eventForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const nameInput = document.getElementById('event-name');
        const dateInput = document.getElementById('event-date');
        const startTimeInput = document.getElementById('start-time');
        const endTimeInput = document.getElementById('end-time');

        // Validação da hora de término
        if (endTimeInput.value <= startTimeInput.value) {
            errorMessage.textContent = 'A hora de fim deve ser maior que a de início.';
            return;
        }
        errorMessage.textContent = '';

        const startDateTime = new Date(`${dateInput.value}T${startTimeInput.value}`);
        const endDateTime = new Date(`${dateInput.value}T${endTimeInput.value}`);

        const newEvent = {
            id: Date.now(),
            name: nameInput.value,
            start: startDateTime.toISOString(),
            end: endDateTime.toISOString()
        };

        addEvent(newEvent);
        eventForm.reset();
        nameInput.focus();
    });
});

/**
 * Busca todos os eventos do LocalStorage.
 * @returns {Array} Lista de eventos.
 */
function getEvents() {
    return JSON.parse(localStorage.getItem('events')) || [];
}

/**
 * Salva a lista de eventos no LocalStorage.
 * @param {Array} events - A lista de eventos para salvar.
 */
function saveEvents(events) {
    localStorage.setItem('events', JSON.stringify(events));
}

/**
 * Adiciona um novo evento e atualiza a exibição.
 * @param {object} event - O objeto do evento a ser adicionado.
 */
function addEvent(event) {
    const events = getEvents();
    events.push(event);
    saveEvents(events);
    displayEvents();
}

/**
 * Deleta um evento pelo seu ID e atualiza a exibição.
 * @param {number} id - O ID do evento a ser deletado.
 */
function deleteEvent(id) {
    let events = getEvents();
    events = events.filter(event => event.id !== id);
    saveEvents(events);
    displayEvents();
}

/**
 * Algoritmo de Interval Scheduling.
 * Encontra o conjunto máximo de eventos não sobrepostos.
 * @param {Array} events - Lista de todos os eventos.
 * @returns {Set} Um Set com os IDs dos eventos agendados.
 */
function scheduleOptimalEvents(events) {
    if (events.length === 0) {
        return new Set();
    }

    // 1. Ordena os eventos pela sua hora de término
    const sortedEvents = [...events].sort((a, b) => new Date(a.end) - new Date(b.end));

    const scheduledIds = new Set();
    // 2. Adiciona o primeiro evento (o que termina mais cedo)
    let lastScheduledEvent = sortedEvents[0];
    scheduledIds.add(lastScheduledEvent.id);

    // 3. Itera sobre os eventos restantes
    for (let i = 1; i < sortedEvents.length; i++) {
        const currentEvent = sortedEvents[i];
        // Se o evento atual começa depois ou ao mesmo tempo que o último agendado terminou,
        // ele não tem conflito e pode ser adicionado.
        if (new Date(currentEvent.start) >= new Date(lastScheduledEvent.end)) {
            scheduledIds.add(currentEvent.id);
            lastScheduledEvent = currentEvent;
        }
    }

    return scheduledIds;
}

/**
 * Renderiza todos os eventos na tela, separando-os em
 * "Agenda Ideal" e "Eventos Conflitantes".
 */
function displayEvents() {
    const allEvents = getEvents();
    const scheduledEventsContainer = document.getElementById('scheduled-events');
    const conflictingEventsContainer = document.getElementById('conflicting-events');

    // Limpa as listas atuais
    scheduledEventsContainer.innerHTML = '';
    conflictingEventsContainer.innerHTML = '';

    const scheduledIds = scheduleOptimalEvents(allEvents);

    allEvents.sort((a, b) => new Date(a.start) - new Date(b.start));

    if (allEvents.length === 0) {
        scheduledEventsContainer.innerHTML = '<p class="empty-message">Nenhum evento adicionado ainda.</p>';
        return;
    }

    allEvents.forEach(event => {
        const eventElement = createEventElement(event);
        if (scheduledIds.has(event.id)) {
            eventElement.classList.add('scheduled');
            scheduledEventsContainer.appendChild(eventElement);
        } else {
            eventElement.classList.add('conflicting');
            conflictingEventsContainer.appendChild(eventElement);
        }
    });
}

/**
 * Cria o elemento HTML para um evento.
 * @param {object} event - O objeto do evento.
 * @returns {HTMLElement} O elemento div do evento.
 */
function createEventElement(event) {
    const div = document.createElement('div');
    div.className = 'event';
    div.dataset.id = event.id;

    const startDate = new Date(event.start);
    const endDate = new Date(event.end);

    const options = { weekday: 'long', day: '2-digit', month: '2-digit' };
    const dateString = startDate.toLocaleDateString('pt-BR', options);
    const timeString = `${startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

    div.innerHTML = `
        <div class="event-details">
            <h3>${event.name}</h3>
            <p>${dateString}</p>
            <p>${timeString}</p>
        </div>
        <button class="btn-delete" title="Excluir evento" onclick="deleteEvent(${event.id})">
            &times;
        </button>
    `;
    return div;
}