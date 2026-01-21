const SUPABASE_URL = 'https://nwrglwfobtvqqrdemoag.supabase.co';
let supabaseClient = null;
let events = [];
let currentEventIndex = 0;
let currentFilter = 'all';
let userProfile = null;

document.addEventListener('DOMContentLoaded', () => {
    checkSetup();
});

function checkSetup() {
    const apiKey = localStorage.getItem('crewq_api_key');
    if (apiKey) {
        initSupabase(apiKey);
        loadUserProfile();
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
    loadUserProfile();
    showApp();
}

function initSupabase(apiKey) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, apiKey, {
        auth: { persistSession: false }
    });
}

function loadUserProfile() {
    const profile = localStorage.getItem('crewq_user_profile');
    if (profile) {
        userProfile = JSON.parse(profile);
    }
}

async function showApp() {
    if (!userProfile) {
        showProfileCreation();
        return;
    }

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
            <button class="nav-btn" onclick="showCrews()">
                <span>👥</span>
                <span>Crews</span>
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

function showProfileCreation() {
    document.getElementById('app').innerHTML = `
        <div class="header">
            <h1>🎉 CrewQ</h1>
            <p>Dallas Nightlife, Solved</p>
        </div>
        <div class="setup-screen">
            <h2 style="margin-bottom: 15px;">Create Your Profile</h2>
            <p style="margin-bottom: 15px; color: #6b7280;">Let's get you set up!</p>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 600;">Name</label>
                <input type="text" id="profileName" placeholder="Your name" style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px;">
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 600;">Email</label>
                <input type="email" id="profileEmail" placeholder="your@email.com" style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px;">
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 600;">Phone (optional)</label>
                <input type="tel" id="profilePhone" placeholder="(555) 123-4567" style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px;">
            </div>
            
            <button class="btn" onclick="saveProfile()">Start Exploring</button>
        </div>
    `;
}

function saveProfile() {
    const name = document.getElementById('profileName').value.trim();
    const email = document.getElementById('profileEmail').value.trim();
    const phone = document.getElementById('profilePhone').value.trim();
    
    if (!name || !email) {
        alert('Please enter your name and email');
        return;
    }
    
    userProfile = { name, email, phone };
    localStorage.setItem('crewq_user_profile', JSON.stringify(userProfile));
    showApp();
}

async function loadEvents() {
    try {
        const { data, error } = await supabaseClient
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

    const filters = ['all', 'happy-hour', 'trivia', 'live-music', 'food-special', 'karaoke', 'comedy', 'brunch', 'sports'];
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
        <div class="event-card" id="eventCard">
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
    const card = document.getElementById('eventCard');
    
    // Add animation
    card.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
    card.style.transform = direction === 'right' ? 'translateX(500px) rotate(20deg)' : 'translateX(-500px) rotate(-20deg)';
    card.style.opacity = '0';
    
    setTimeout(() => {
        if (direction === 'right') {
            const liked = JSON.parse(localStorage.getItem('crewq_liked') || '[]');
            const filteredEvents = currentFilter === 'all' 
                ? events 
                : events.filter(e => e.category === currentFilter);
            liked.push(filteredEvents[currentEventIndex]);
            localStorage.setItem('crewq_liked', JSON.stringify(liked));
        }
        
        currentEventIndex++;
        showFeed();
    }, 300);
}

function showCrews() {
    updateNavActive(1);
    renderContent(`
        <div class="event-card">
            <div class="event-content">
                <h2>Crews</h2>
                <p style="color: #6b7280; margin: 15px 0;">Create crews with friends to plan events together. Coming soon!</p>
                <button class="btn">+ Create Crew</button>
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
                <p style="color: #6b7280; margin: 15px 0;">Ask me anything about Dallas nightlife! Coming soon!</p>
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
                <div style="background: #f3f4f6; padding: 15px; border-radius: 10px; margin: 15px 0;">
                    <p style="margin-bottom: 10px;"><strong>Name:</strong> ${userProfile.name}</p>
                    <p style="margin-bottom: 10px;"><strong>Email:</strong> ${userProfile.email}</p>
                    ${userProfile.phone ? `<p style="margin-bottom: 10px;"><strong>Phone:</strong> ${userProfile.phone}</p>` : ''}
                </div>
                <div style="background: #f3f4f6; padding: 15px; border-radius: 10px;">
                    <h3 style="margin-bottom: 10px;">Your Stats</h3>
                    <p>❤️ Liked Events: ${liked.length}</p>
                    <p>👥 Crews: 0</p>
                    <p>✅ Check-ins: 0</p>
                </div>
                <button class="btn" onclick="editProfile()" style="margin-top: 15px; background: #6b7280;">Edit Profile</button>
            </div>
        </div>
    `);
}

function editProfile() {
    userProfile = null;
    localStorage.removeItem('crewq_user_profile');
    showProfileCreation();
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
