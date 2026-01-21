import React, { useState, useEffect } from 'react';
import { Heart, X, Share2, Bell, Settings, MapPin, Users, Calendar, Search, User, Home, Check } from 'lucide-react';

const SUPABASE_URL = 'https://nwrglwfobtvqqrdemoag.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53cmdsd2ZvYnR2cXFyZGVtb2FnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMDYyMDUsImV4cCI6MjA4NDU4MjIwNX0.tNwEmzXnes_r7HrOhD3iO3YgN7rP9LW4nmGM46cfI8M'; // Replace with your actual key

let supabaseClient = null;

// Initialize Supabase
const initSupabase = () => {
  if (typeof window !== 'undefined' && window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
};

const crewMembers = [
  { id: 1, name: "Alex Chen", avatar: "AC", online: true },
  { id: 2, name: "Jordan Smith", avatar: "JS", online: true },
  { id: 3, name: "Sam Rivera", avatar: "SR", online: false },
  { id: 4, name: "Casey Morgan", avatar: "CM", online: true }
];

function EventCard({ event, onSwipe, style }) {
  const [dragStart, setDragStart] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e) => {
    setDragStart(e.type.includes('mouse') ? e.clientX : e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleDragMove = (e) => {
    if (!isDragging) return;
    const currentX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    setDragOffset(currentX - dragStart);
  };

  const handleDragEnd = () => {
    if (Math.abs(dragOffset) > 100) {
      onSwipe(dragOffset > 0 ? 'right' : 'left');
    }
    setDragOffset(0);
    setIsDragging(false);
  };

  const rotation = dragOffset / 20;
  const opacity = 1 - Math.abs(dragOffset) / 400;

  return (
    <div
      style={{
        ...style,
        transform: `translateX(${dragOffset}px) rotate(${rotation}deg)`,
        opacity,
        transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}
      onMouseDown={handleDragStart}
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
      onTouchStart={handleDragStart}
      onTouchMove={handleDragMove}
      onTouchEnd={handleDragEnd}
      className="absolute w-full cursor-grab active:cursor-grabbing"
    >
      <div className="relative bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl">
        <div className="relative h-72">
          <img src={event.image_url} alt={event.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
          
          <div className="absolute top-4 left-4 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase">
            {event.category.replace('-', ' ')}
          </div>

          {dragOffset < -50 && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-500 bg-opacity-20">
              <div className="bg-red-500 rounded-full p-4">
                <X className="w-12 h-12 text-white" />
              </div>
            </div>
          )}
          {dragOffset > 50 && (
            <div className="absolute inset-0 flex items-center justify-center bg-emerald-500 bg-opacity-20">
              <div className="bg-emerald-500 rounded-full p-4">
                <Heart className="w-12 h-12 text-white" />
              </div>
            </div>
          )}
        </div>

        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-2">{event.name}</h2>
          <p className="text-zinc-400 text-sm mb-4">{event.description}</p>
          
          <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
            <MapPin className="w-4 h-4" />
            <span>{event.venue} • {event.neighborhood}</span>
            {event.distance && (
              <>
                <span className="text-zinc-600">•</span>
                <span>{event.distance}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm mb-4">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4 text-zinc-400" />
              <span className="text-zinc-300">{event.time}</span>
            </div>
          </div>

          <div className="inline-block bg-emerald-500 bg-opacity-20 text-emerald-400 px-3 py-1 rounded-full text-sm font-semibold">
            Free Entry
          </div>
        </div>
      </div>
    </div>
  );
}

function ShareModal({ event, onClose }) {
  const [selected, setSelected] = useState([]);

  const toggleMember = (id) => {
    setSelected(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-3xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">Share with Crew</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <div className="bg-zinc-800 rounded-2xl p-4 mb-4">
            <p className="text-white font-semibold">{event.name}</p>
            <p className="text-zinc-400 text-sm">{event.venue}</p>
          </div>

          <div className="space-y-2">
            {crewMembers.map(member => (
              <button
                key={member.id}
                onClick={() => toggleMember(member.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition ${
                  selected.includes(member.id) 
                    ? 'bg-orange-500 bg-opacity-20 border-2 border-orange-500' 
                    : 'bg-zinc-800 border-2 border-transparent'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-white font-semibold">
                  {member.avatar}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white font-medium">{member.name}</p>
                  <p className="text-xs text-zinc-400">{member.online ? '🟢 Online' : '⚪ Offline'}</p>
                </div>
                {selected.includes(member.id) && (
                  <Check className="w-5 h-5 text-orange-500" />
                )}
              </button>
            ))}
          </div>
        </div>

        <button
          disabled={selected.length === 0}
          onClick={() => {
            alert(`Shared with ${selected.length} ${selected.length === 1 ? 'person' : 'people'}!`);
            onClose();
          }}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send to {selected.length} {selected.length === 1 ? 'Person' : 'People'}
        </button>
      </div>
    </div>
  );
}

function AuthScreen({ onAuth }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = () => {
    if (!name || !email) {
      alert('Please enter your name and email');
      return;
    }
    onAuth({ name, email, phone });
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-3xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-white mb-2">
          Crew<span className="text-orange-500">Q</span>
        </h1>
        <p className="text-zinc-400 mb-6">Dallas Nightlife, Solved</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-3 bg-zinc-800 text-white border border-zinc-700 rounded-xl focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 bg-zinc-800 text-white border border-zinc-700 rounded-xl focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2">Phone (optional)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
              className="w-full px-4 py-3 bg-zinc-800 text-white border border-zinc-700 rounded-xl focus:outline-none focus:border-orange-500"
            />
          </div>

          <button
            onClick={handleSubmit}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-bold"
          >
            Continue to CrewQ
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [currentTab, setCurrentTab] = useState('discover');
  const [mode, setMode] = useState('crew');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [events, setEvents] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load Supabase script
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = () => {
      initSupabase();
      checkAuth();
    };
    document.body.appendChild(script);
  }, []);

  const checkAuth = async () => {
    const profile = localStorage.getItem('crewq_user_profile');
    if (profile) {
      setUserProfile(JSON.parse(profile));
      await loadEvents();
    }
    setLoading(false);
  };

  const handleAuth = async (profile) => {
    setUserProfile(profile);
    localStorage.setItem('crewq_user_profile', JSON.stringify(profile));
    await loadEvents();
  };

  const loadEvents = async () => {
    if (!supabaseClient) return;
    
    try {
      const { data, error } = await supabaseClient
        .from('events')
        .select('*')
        .order('date', { ascending: true });
      
      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const handleSwipe = (direction) => {
    if (direction === 'right') {
      const liked = JSON.parse(localStorage.getItem('crewq_liked') || '[]');
      liked.push(events[currentIndex]);
      localStorage.setItem('crewq_liked', JSON.stringify(liked));
    }
    if (currentIndex < events.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!userProfile) {
    return <AuthScreen onAuth={handleAuth} />;
  }

  const currentEvent = events[currentIndex];

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              Crew<span className="text-orange-500">Q</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative">
              <Bell className="w-6 h-6 text-zinc-400" />
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                3
              </span>
            </button>
            <button>
              <Settings className="w-6 h-6 text-zinc-400" />
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 mb-4">
          <div className="flex gap-2 bg-zinc-800 rounded-full p-1.5">
            <button
              onClick={() => setMode('crew')}
              className={`px-8 py-2.5 rounded-full text-base font-bold transition ${
                mode === 'crew' 
                  ? 'bg-orange-500 text-white' 
                  : 'text-zinc-400'
              }`}
            >
              Crew
            </button>
            <button
              onClick={() => setMode('solo')}
              className={`px-8 py-2.5 rounded-full text-base font-bold transition ${
                mode === 'solo' 
                  ? 'bg-orange-500 text-white' 
                  : 'text-zinc-400'
              }`}
            >
              Solo
            </button>
          </div>
          
          <div className="flex items-center gap-2 text-zinc-400">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">Dallas, Texas</span>
          </div>
        </div>
      </div>

      {currentTab === 'discover' && (
        <div className="px-4 py-6 pb-32">
          {currentIndex >= events.length ? (
            <div className="text-center py-20">
              <Heart className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">All caught up!</h2>
              <p className="text-zinc-400">Check back later for more events</p>
            </div>
          ) : (
            <div className="relative h-[500px]">
              {events.slice(currentIndex, currentIndex + 2).reverse().map((event, idx) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onSwipe={idx === 1 ? handleSwipe : () => {}}
                  style={{
                    zIndex: idx === 1 ? 10 : 9,
                    scale: idx === 1 ? 1 : 0.95,
                    top: idx === 1 ? 0 : '10px'
                  }}
                />
              ))}

              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4 z-20">
                <button
                  onClick={() => handleSwipe('left')}
                  className="w-12 h-12 rounded-full bg-zinc-800 bg-opacity-90 backdrop-blur-sm border border-zinc-700 flex items-center justify-center hover:bg-red-500 hover:border-red-500 transition shadow-lg"
                >
                  <X className="w-5 h-5 text-white" />
                </button>

                <button
                  onClick={() => setShowShareModal(true)}
                  className="w-12 h-12 rounded-full bg-zinc-800 bg-opacity-90 backdrop-blur-sm border border-zinc-700 flex items-center justify-center hover:bg-orange-500 hover:border-orange-500 transition shadow-lg"
                >
                  <Share2 className="w-5 h-5 text-white" />
                </button>

                <button
                  onClick={() => handleSwipe('right')}
                  className="w-12 h-12 rounded-full bg-zinc-800 bg-opacity-90 backdrop-blur-sm border border-zinc-700 flex items-center justify-center hover:bg-emerald-500 hover:border-emerald-500 transition shadow-lg"
                >
                  <Heart className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {currentTab !== 'discover' && (
        <div className="px-4 py-20 text-center">
          <p className="text-zinc-400">Coming soon!</p>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 px-6 py-4">
        <div className="flex justify-around items-center max-w-md mx-auto">
          {[
            { id: 'discover', icon: Home, label: 'Discover' },
            { id: 'search', icon: Search, label: 'Search' },
            { id: 'events', icon: Calendar, label: 'Events' },
            { id: 'crew', icon: Users, label: 'Crew' },
            { id: 'profile', icon: User, label: 'Profile' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className="flex flex-col items-center gap-1"
            >
              <tab.icon className={`w-6 h-6 ${currentTab === tab.id ? 'text-orange-500' : 'text-zinc-500'}`} />
              <span className={`text-xs ${currentTab === tab.id ? 'text-orange-500' : 'text-zinc-500'}`}>
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {showShareModal && currentEvent && (
        <ShareModal 
          event={currentEvent}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
