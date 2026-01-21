const SUPABASE_URL = 'https://nwrglwfobtvqqrdemoag.supabase.co';
// IMPORTANT: Replace this with your actual anon key
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53cmdsd2ZvYnR2cXFyZGVtb2FnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMDYyMDUsImV4cCI6MjA4NDU4MjIwNX0.tNwEmzXnes_r7HrOhD3iO3YgN7rP9LW4nmGM46cfI8M';

let supabaseClient = null;
let events = [];
let currentEventIndex = 0;
let currentFilter = 'all';
let userProfile = null;

document.addEventListener('DOMContentLoaded', () => {
    initSupabase(SUPABASE_ANON_KEY);
    checkAuth();
});

function initSupabase(apiKey) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, apiKey, {
        auth: { persistSession: true }
    });
}

async function checkAuth() {
    const profile = localStorage.getItem('crewq_user_profile');
    if (profile) {
        userProfile = JSON.parse(profile);
        await showApp();
    } else {
        showAuth();
    }
}

function showAuth() {
    document.getElementById('app').innerHTML = `
        <div class="header">
            <h1>🎉 CrewQ</h1>
            <p>Dallas Nightlife, Solved</p>
        </div>
        <div class="setup-screen">
            <h2 style="margin-bottom: 15px;">Welcome to CrewQ</h2>
            <p style="margin-bottom: 20px; color: #6b7280;">Sign in or create an account to start discovering Dallas events</p>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">Name</label>
                <input type="text" id="authName" placeholder="Your name" style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px;">
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">Email</label>
                <input type="email" id="authEmail" placeholder="your@email.com" style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px;">
            </div>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">Phone (optional)</label>
                <input type="tel" id="authPhone" placeholder="(555) 123-4567" style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px;">
            </div>
            
            <button class="btn" onclick="signIn()">Continue to CrewQ</button>
        </div>
    `;
}

async function signIn() {
    const name = document.getElementById('authName').value.trim();
    const email = document.getElementById('authEmail').value.trim();
    const phone = document.getElementById('authPhone').value.trim();
    
    if (!name || !email) {
        alert('Please enter your name and email');
        return;
    }
    
    // Save to Supabase users table
    try {
        const { data, error } = await supabaseClient
            .from('users')
            .upsert([{ email, name, phone }], { onConflict: 'email' })
            .select();
        
        if (error) throw error;
        
        userProfile = { name, email, phone, id: data[0].id };
        localStorage.setItem('crewq_user_profile', JSON.stringify(userProfile));
        
        await showApp();
    } catch (error) {
        console.error('Error saving user:', error);
        // Still allow them to continue even if DB save fails
        userProfile = { name, email, phone };
        localStorage.setItem('crewq_user_profile', JSON.stringify(userProfile));
        await showApp();
    }
}

async function showApp() {
    document.getElementById('app').innerHTML = `
        <div class="header">
            <h1>🎉 CrewQ</h1>
            <p>Hey ${userProfile.name}!</p>
        </div>
        <div class="loading">Loading events...</div>
        <div class="bottom-nav">
            <button class="nav-btn active" onclick="showFeed()">
                <span>🏠</span>
                <span>Feed</span>
            </button>
            <button class="nav-btn" onclick="showCalendar()">
                <span>📅</span>
                <span>Calendar</span>
            </button>
            <button class="nav-btn" onclick="showCrews()">
                <span>👥</span>
                <span>Crews</span>
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
        const { data, error } = await supabaseClient
            .from('events')
            .select('*')
            .order('date', { ascending: true });
        
        if (error) throw error;
        events = data || [];
    } catch (error) {
        console.error('Error loading events:', error);
    }
}

function showFeed() {
    updateNavActive(0);
    
    if (events.length === 0) {
        renderContent(`
            <div class="event-card">
                <div class="event-content">
                    <h2>No events yet!</h2>
                    <p>Check back soon for Dallas events!</p>
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
        renderContent(`
            <div class="event-card">
                <div class="event-content">
                    <h2>🎉 All caught up!</h2>
                    <p style="margin: 15px 0; color: #6b7280;">You've seen all events in this category.</p>
                    <button class="btn" onclick="showCalendar()">View Your Calendar</button>
                </div>
            </div>
        `);
        return;
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
    
    card.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
    card.style.transform = direction === 'right' ? 'translateX(500px) rotate(20deg)' : 'translateX(-500px) rotate(-20deg)';
    card.style.opacity = '0';
    
    setTimeout(() => {
        if (direction === 'right') {
            const liked = JSON.parse(localStorage.getItem('crewq_liked') || '[]');
            const filteredEvents = currentFilter === 'all' 
                ? events 
                : events.filter(e => e.category === currentFilter);
            const event = filteredEvents[currentEventIndex];
            
            // Add timestamp and user info
            liked.push({
                ...event,
                likedAt: new Date().toISOString(),
                sharedWith: []
            });
            localStorage.setItem('crewq_liked', JSON.stringify(liked));
        }
        
        currentEventIndex++;
        showFeed();
    }, 300);
}

function showCalendar() {
    updateNavActive(1);
    const liked = JSON.parse(localStorage.getItem('crewq_liked') || '[]');
    
    if (liked.length === 0) {
        renderContent(`
            <div class="event-card">
                <div class="event-content">
                    <h2>📅 Your Calendar</h2>
                    <p style="color: #6b7280; margin: 15px 0;">No events saved yet! Swipe right on events you're interested in.</p>
                    <button class="btn" onclick="showFeed()">Discover Events</button>
                </div>
            </div>
        `);
        return;
    }
    
    // Sort by date
    const sorted = liked.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    renderContent(`
        <h2 style="color: white; margin-bottom: 20px; font-size: 1.5rem;">📅 Your Calendar</h2>
        ${sorted.map((event, idx) => `
            <div class="event-card" style="margin-bottom: 15px;">
                <div style="display: flex; gap: 15px; padding: 15px;">
                    <img src="${event.image_url}" alt="${event.name}" style="width: 80px; height: 80px; border-radius: 8px; object-fit: cover;">
                    <div style="flex: 1;">
                        <h3 style="font-size: 1rem; margin-bottom: 5px;">${event.name}</h3>
                        <p style="font-size: 0.85rem; color: #6b7280; margin-bottom: 5px;">📍 ${event.venue}</p>
                        <p style="font-size: 0.85rem; color: #6b7280; margin-bottom: 8px;">📅 ${new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • ${event.time}</p>
                        ${event.sharedWith && event.sharedWith.length > 0 ? `
                            <div style="background: #f3f4f6; padding: 8px; border-radius: 6px; font-size: 0.8rem;">
                                <strong>Shared with:</strong>
                                ${event.sharedWith.map(s => `
                                    <div style="margin-top: 4px;">
                                        ${s.name}: ${s.response === 'interested' ? '✅ Interested' : s.response === 'passed' ? '❌ Passed' : '⏳ Pending'}
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <button onclick="shareEvent(${idx})" style="background: #667eea; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; cursor: pointer;">
                                Share with Friends
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `).join('')}
    `);
}

function shareEvent(eventIndex) {
    const liked = JSON.parse(localStorage.getItem('crewq_liked') || '[]');
    const event = liked[eventIndex];
    
    const friendName = prompt('Enter friend\'s name:');
    if (!friendName) return;
    
    if (!event.sharedWith) event.sharedWith = [];
    event.sharedWith.push({
        name: friendName,
        response: 'pending',
        sharedAt: new Date().toISOString()
    });
    
    liked[eventIndex] = event;
    localStorage.setItem('crewq_liked', JSON.stringify(liked));
    
    alert(`Event shared with ${friendName}!`);
    showCalendar();
}

function showCrews() {
    updateNavActive(2);
    renderContent(`
        <div class="event-card">
            <div class="event-content">
                <h2>👥 Crews</h2>
                <p style="color: #6b7280; margin: 15px 0;">Create crews with friends to plan events together. Coming soon!</p>
                <button class="btn">+ Create Crew</button>
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
                <h2>👤 Profile</h2>
                <div style="background: #f3f4f6; padding: 15px; border-radius: 10px; margin: 15px 0;">
                    <p style="margin-bottom: 10px;"><strong>Name:</strong> ${userProfile.name}</p>
                    <p style="margin-bottom: 10px;"><strong>Email:</strong> ${userProfile.email}</p>
                    ${userProfile.phone ? `<p style="margin-bottom: 10px;"><strong>Phone:</strong> ${userProfile.phone}</p>` : ''}
                </div>
                <div style="background: #f3f4f6; padding: 15px; border-radius: 10px;">
                    <h3 style="margin-bottom: 10px;">Your Stats</h3>
                    <p>❤️ Interested: ${liked.length} events</p>
                    <p>👥 Crews: 0</p>
                    <p>📤 Shared: ${liked.reduce((acc, e) => acc + (e.sharedWith?.length || 0), 0)} times</p>
                </div>
                <button class="btn" onclick="signOut()" style="margin-top: 15px; background: #ef4444;">Sign Out</button>
            </div>
        </div>
    `);
}

function signOut() {
    if (confirm('Are you sure you want to sign out?')) {
        localStorage.removeItem('crewq_user_profile');
        userProfile = null;
        showAuth();
    }
}

function renderContent(html) {
    const header = document.querySelector('.header');
    const nav = document.querySelector('.bottom-nav');
    document.getElementById('app').innerHTML = '';
    if (header) document.getElementById('app').appendChild(header);
    document.getElementById('app').insertAdjacentHTML('beforeend', html);
    if (nav) document.getElementById('app').appendChild(nav);
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
