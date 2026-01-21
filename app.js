const SUPABASE_URL = 'https://nwrglwfobtvqqrdemoag.supabase.co';
let supabase = null;
let events = [];
let currentEventIndex = 0;
let currentFilter = 'all';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkSetup();
});

function checkSetup() {
    const apiKey = localStorage.getItem('crewq_api_key');
    if (apiKey) {
        initSupabase(apiKey);
        showApp();
    } else {
        showSetup();
    }
}

function showSetup() {
    document.getElementById('app').innerHTML = `
        <div class="header">
            <h1>🎉 CrewQ</h1>
            <p>Dallas Nightlife, Solved</p>
        </div>
        <div class="setup-screen">
            <h2 style="margin-bottom: 15px;">Setup</h2>
            <p style="margin-bottom: 15px; color: #6b7280;">Enter your Supabase API key to get started.</p>
            <input type="text" id="apiKeyInput" placeholder="Your Supabase anon key...">
            <button class="btn" onclick="saveApiKey()">Connect</button>
        </div>
    `;
}

function saveApiKey() {
    const apiKey = document.getElementById('apiKeyInput').value.trim();
    if (!apiKey) {
        alert('Please enter your API key');
        return;
    }
    localStorage.setItem('crewq_api_key', apiKey);
    initSupabase(apiKey);
    showApp();
}

function initSupabase(apiKey) {
    supabase = window.supabase.createClient(SUPABASE_URL, apiKey, {
        auth: { persistSession: false }
    });
}

async function showApp() {
    document.getElementById('app').innerHTML = `
        <div class="header">
            <h1>🎉 CrewQ</h1>
            <p>Dallas Nightlife</p>
        </div>
        <div class="loading">Loading events...</div>
        <div class="bottom-nav">
            <button class="nav-btn active" onclick="showFeed()">
                <span>🏠</span>
                <span>Feed</span>
            </button>
            <button class="nav-btn" onclick="showSquads()">
                <span>👥</span>
                <span>Squads</span>
            </button>
            <button class="nav-btn" onclick="showAI()">
                <span>🤖</span>
                <span>AI</span>
            </button>
            <button class="nav-btn" onclick="showProfile()">
                <span>👤</span>
                <span>Profile</span>
            </button>
        </div>
    `;
    
    await loadEvents();
    showFeed();
}

async function loadEvents() {
    try {
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .order('date', { ascending: true });
        
        if (error) throw error;
        events = data || [];
    } catch (error) {
        console.error('Error loading events:', error);
        alert('Error loading events. Check your setup.');
    }
}

function showFeed() {
    updateNavActive(0);
    
    if (events.length === 0) {
        renderContent(`
            <div class="event-card">
                <div class="event-content">
                    <h2>No events yet!</h2>
                    <p>Add some events to your database to get started.</p>
                </div>
            </div>
        `);
        return;
    }

    const filters = ['all', 'happy-hour', 'trivia', 'live-music', 'food-special'];
    const filteredEvents = currentFilter === 'all' 
        ? events 
        : events.filter(e => e.category === currentFilter);
    
    if (currentEventIndex >= filteredEvents.length) {
        currentEventIndex = 0;
    }

    const event = filteredEvents[currentEventIndex];
    
    renderContent(`
        <div class="filter-pills">
            ${filters.map(f => `
                <button class="filter-pill ${currentFilter === f ? 'active' : ''}" 
                        onclick="filterEvents('${f}')">
                    ${f === 'all' ? 'All' : f.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </button>
            `).join('')}
        </div>
        <div class="event-card">
            <img src="${event.image_url}" alt="${event.name}">
            <div class="event-content">
                <h2>${event.name}</h2>
                <div class="event-meta">
                    📍 ${event.venue} • ${event.neighborhood}<br>
                    📅 ${new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}<br>
                    🕐 ${event.time}
                </div>
                <p>${event.description}</p>
                <div class="event-actions">
                    <button class="pass-btn" onclick="swipeEvent('left')">❌ Pass</button>
                    <button class="interested-btn" onclick="swipeEvent('right')">❤️ Interested</button>
                </div>
            </div>
        </div>
    `);
}

function filterEvents(filter) {
    currentFilter = filter;
    currentEventIndex = 0;
    showFeed();
}

function swipeEvent(direction) {
    if (direction === 'right') {
        // Save to liked events
        const liked = JSON.parse(localStorage.getItem('crewq_liked') || '[]');
        const filteredEvents = currentFilter === 'all' 
            ? events 
            : events.filter(e => e.category === currentFilter);
        liked.push(filteredEvents[currentEventIndex]);
        localStorage.setItem('crewq_liked', JSON.stringify(liked));
    }
    
    currentEventIndex++;
    showFeed();
}

function showSquads() {
    updateNavActive(1);
    renderContent(`
        <div class="event-card">
            <div class="event-content">
                <h2>Squads</h2>
                <p style="color: #6b7280; margin: 15px 0;">Create squads with friends to plan events together.</p>
                <button class="btn">+ Create Squad</button>
            </div>
        </div>
    `);
}

function showAI() {
    updateNavActive(2);
    renderContent(`
        <div class="event-card">
            <div class="event-content">
                <h2>AI Recommendations</h2>
                <p style="color: #6b7280; margin: 15px 0;">Ask me anything about Dallas nightlife!</p>
                <input type="text" placeholder="What are you looking for tonight?" style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; margin: 10px 0;">
                <button class="btn">Get Recommendations</button>
            </div>
        </div>
    `);
}

function showProfile() {
    updateNavActive(3);
    const liked = JSON.parse(localStorage.getItem('crewq_liked') || '[]');
    renderContent(`
        <div class="event-card">
            <div class="event-content">
                <h2>Profile</h2>
                <p style="color: #6b7280; margin: 15px 0;">Your CrewQ stats:</p>
                <div style="background: #f3f4f6; padding: 15px; border-radius: 10px;">
                    <p>❤️ Liked Events: ${liked.length}</p>
                    <p>👥 Squads: 0</p>
                    <p>✅ Check-ins: 0</p>
                </div>
            </div>
        </div>
    `);
}

function renderContent(html) {
    const header = document.querySelector('.header');
    const nav = document.querySelector('.bottom-nav');
    document.getElementById('app').innerHTML = '';
    document.getElementById('app').appendChild(header);
    document.getElementById('app').insertAdjacentHTML('beforeend', html);
    document.getElementById('app').appendChild(nav);
}

function updateNavActive(index) {
    const buttons = document.querySelectorAll('.nav-btn');
    buttons.forEach((btn, i) => {
        if (i === index) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}
