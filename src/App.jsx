import React, { useState, useEffect, useRef } from 'react';
import { Heart, X, Share2, Bell, Settings, MapPin, Users, Calendar, Search, User, Home, Check, Send, ChevronLeft, ChevronRight, Clock, UserPlus, MessageCircle, Edit2, LogOut, Mail, Phone } from 'lucide-react';

const SUPABASE_URL = 'https://nwrglwfobtvqqrdemoag.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53cmdsd2ZvYnR2cXFyZGVtb2FnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMDYyMDUsImV4cCI6MjA4NDU4MjIwNX0.tNwEmzXnes_r7HrOhD3iO3YgN7rP9LW4nmGM46cfI8M';

let supabaseClient = null;

const initSupabase = () => {
  if (typeof window !== 'undefined' && window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
};

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
            {event.category?.replace('-', ' ') || 'Event'}
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

function ShareModal({ event, onClose, crewMembers }) {
  const [selected, setSelected] = useState([]);

  const toggleMember = (id) => {
    setSelected(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleNativeShare = async () => {
    const shareData = {
      title: event.name,
      text: `Check out ${event.name} at ${event.venue}! Join me on CrewQ 🎉`,
      url: `https://crewq.app/events/${event.id}`
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        const shareText = `${shareData.text}\n${shareData.url}`;
        await navigator.clipboard.writeText(shareText);
        alert('Link copied to clipboard! Share it with your friends via text or any app.');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error sharing:', err);
      }
    }
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

          {crewMembers.length > 0 ? (
            <div className="space-y-2 mb-4">
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
                    {member.name?.charAt(0).toUpperCase() || '?'}
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
          ) : (
            <div className="text-center py-6 mb-4">
              <Users className="w-12 h-12 text-zinc-700 mx-auto mb-2" />
              <p className="text-zinc-400 text-sm">No crew members yet</p>
            </div>
          )}

          <button
            onClick={handleNativeShare}
            className="w-full bg-zinc-800 text-white py-3 rounded-xl font-semibold mb-3 hover:bg-zinc-700 transition flex items-center justify-center gap-2"
          >
            <Share2 className="w-5 h-5" />
            Share via Text/Social
          </button>

          {crewMembers.length > 0 && (
            <button
              disabled={selected.length === 0}
              onClick={() => {
                alert(`Shared with ${selected.length} ${selected.length === 1 ? 'person' : 'people'}!`);
                onClose();
              }}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {selected.length > 0 ? `Send to ${selected.length} ${selected.length === 1 ? 'Person' : 'People'}` : 'Select Crew Members'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AIChat() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hey! I'm your Dallas nightlife assistant. Ask me about events, venues, or what to do tonight!" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          system: 'You are a knowledgeable Dallas nightlife assistant. Help users find events, venues, and activities in Dallas. Be friendly, concise, and provide specific recommendations. Focus on Deep Ellum, Uptown, Lower Greenville, and other popular Dallas nightlife areas.'
        })
      });

      const data = await response.json();
      const assistantMessage = {
        role: 'assistant',
        content: data.content[0].text
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I had trouble connecting. Please try again!'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              msg.role === 'user' 
                ? 'bg-orange-500 text-white' 
                : 'bg-zinc-800 text-white'
            }`}>
              <p className="text-sm">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-zinc-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about events..."
            className="flex-1 bg-zinc-800 text-white rounded-full px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-orange-500 text-white rounded-full w-12 h-12 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function CalendarView({ likedEvents }) {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 1));
  const [selectedDate, setSelectedDate] = useState(null);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const getEventsForDate = (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return likedEvents.filter(event => event.date === dateStr);
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
          className="p-2 hover:bg-zinc-800 rounded-full transition"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <h2 className="text-xl font-bold text-white">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <button
          onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
          className="p-2 hover:bg-zinc-800 rounded-full transition"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-zinc-500 text-sm font-semibold py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: startingDayOfWeek }).map((_, idx) => (
          <div key={`empty-${idx}`} className="aspect-square" />
        ))}
        
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const day = idx + 1;
          const events = getEventsForDate(day);
          const hasEvents = events.length > 0;
          const today = new Date();
          const isToday = today.getDate() === day && 
                         today.getMonth() === currentDate.getMonth() && 
                         today.getFullYear() === currentDate.getFullYear();

          return (
            <button
              key={day}
              onClick={() => setSelectedDate(day)}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center transition ${
                isToday ? 'bg-orange-500 text-white' :
                hasEvents ? 'bg-zinc-800 text-white' :
                'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              <span className="text-sm font-semibold">{day}</span>
              {hasEvents && (
                <div className="flex gap-0.5 mt-1">
                  {events.slice(0, 3).map((_, i) => (
                    <div key={i} className="w-1 h-1 rounded-full bg-orange-500" />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selectedDate && getEventsForDate(selectedDate).length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-bold text-white mb-3">
            Events on {monthNames[currentDate.getMonth()]} {selectedDate}
          </h3>
          <div className="space-y-3">
            {getEventsForDate(selectedDate).map((event, idx) => (
              <div key={idx} className="bg-zinc-800 rounded-2xl p-4">
                <h4 className="text-white font-semibold mb-1">{event.name}</h4>
                <p className="text-zinc-400 text-sm mb-2">{event.venue}</p>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <Clock className="w-3 h-3" />
                  <span>{event.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {likedEvents.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-400">No saved events yet</p>
          <p className="text-zinc-600 text-sm mt-2">Like events to add them to your calendar</p>
        </div>
      )}
    </div>
  );
}

function CrewTab({ squads, onCreateSquad }) {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-white mb-6">Your Squads</h2>
      
      {squads.length > 0 ? (
        <div className="space-y-4">
          {squads.map(squad => (
            <div key={squad.id} className="bg-zinc-900 rounded-2xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">{squad.name}</h3>
                  <p className="text-zinc-400 text-sm mb-3">{squad.description}</p>
                  <div className="flex items-center gap-2 text-zinc-500 text-sm">
                    <Users className="w-4 h-4" />
                    <span>{squad.member_count || 0} members</span>
                  </div>
                </div>
              </div>

              {squad.members && squad.members.length > 0 && (
                <div className="flex items-center gap-2 mb-4 overflow-x-auto">
                  {squad.members.slice(0, 5).map(member => (
                    <div key={member.id} className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white text-sm font-semibold">
                        {member.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                    </div>
                  ))}
                  <button className="flex-shrink-0 w-10 h-10 rounded-full border-2 border-dashed border-zinc-700 flex items-center justify-center text-zinc-500 hover:border-orange-500 hover:text-orange-500 transition">
                    <UserPlus className="w-5 h-5" />
                  </button>
                </div>
              )}

              {squad.next_event && (
                <div className="bg-zinc-800 rounded-xl p-4 border border-zinc-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-orange-500 text-xs font-semibold uppercase mb-1">Next Event</p>
                      <h4 className="text-white font-semibold mb-1">{squad.next_event.name}</h4>
                      <p className="text-zinc-400 text-sm mb-2">{squad.next_event.venue}</p>
                      <div className="flex items-center gap-3 text-xs text-zinc-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{squad.next_event.date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{squad.next_event.time}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-400">No squads yet</p>
          <p className="text-zinc-600 text-sm mt-2">Create a squad to connect with friends</p>
        </div>
      )}

      <button 
        onClick={onCreateSquad}
        className="w-full mt-6 bg-zinc-900 border-2 border-dashed border-zinc-700 rounded-2xl p-6 text-zinc-400 hover:border-orange-500 hover:text-orange-500 transition flex items-center justify-center gap-2"
      >
        <UserPlus className="w-5 h-5" />
        <span className="font-semibold">Create New Squad</span>
      </button>
    </div>
  );
}

function ProfileTab({ userProfile, onLogout, onUpdateProfile }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(userProfile);
  const likedEvents = JSON.parse(localStorage.getItem('crewq_liked') || '[]');
  const [squadsCount, setSquadsCount] = useState(0);

  useEffect(() => {
    loadSquadsCount();
  }, []);

  const loadSquadsCount = async () => {
    if (!supabaseClient) return;
    try {
      const { count } = await supabaseClient
        .from('squads')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', userProfile.id);
      setSquadsCount(count || 0);
    } catch (error) {
      console.error('Error loading squads count:', error);
    }
  };

  const handleSave = async () => {
    await onUpdateProfile(editedProfile);
    setIsEditing(false);
  };

  return (
    <div className="p-4">
      <div className="bg-zinc-900 rounded-3xl p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Profile</h2>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="text-orange-500 hover:text-orange-400 transition"
            >
              <Edit2 className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(false)}
              className="text-zinc-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-3xl font-bold">
            {userProfile.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-zinc-400 mb-2">Name</label>
            {isEditing ? (
              <input
                type="text"
                value={editedProfile.name}
                onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"
              />
            ) : (
              <div className="flex items-center gap-3 bg-zinc-800 rounded-xl px-4 py-3">
                <User className="w-5 h-5 text-zinc-500" />
                <span className="text-white">{userProfile.name}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-400 mb-2">Email</label>
            {isEditing ? (
              <input
                type="email"
                value={editedProfile.email}
                onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
                className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"
              />
            ) : (
              <div className="flex items-center gap-3 bg-zinc-800 rounded-xl px-4 py-3">
                <Mail className="w-5 h-5 text-zinc-500" />
                <span className="text-white">{userProfile.email}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-400 mb-2">Phone</label>
            {isEditing ? (
              <input
                type="tel"
                value={editedProfile.phone || ''}
                onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"
              />
            ) : (
              <div className="flex items-center gap-3 bg-zinc-800 rounded-xl px-4 py-3">
                <Phone className="w-5 h-5 text-zinc-500" />
                <span className="text-white">{userProfile.phone || 'Not provided'}</span>
              </div>
            )}
          </div>
        </div>

        {isEditing && (
          <button
            onClick={handleSave}
            className="w-full mt-6 bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600 transition"
          >
            Save Changes
          </button>
        )}
      </div>

      <div className="bg-zinc-900 rounded-3xl p-6 mb-6">
        <h3 className="text-lg font-bold text-white mb-4">Activity</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-800 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-orange-500 mb-1">{likedEvents.length}</div>
            <div className="text-sm text-zinc-400">Liked Events</div>
          </div>
          <div className="bg-zinc-800 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-orange-500 mb-1">{squadsCount}</div>
            <div className="text-sm text-zinc-400">Squads</div>
          </div>
        </div>
      </div>

      <button
        onClick={onLogout}
        className="w-full bg-red-500 bg-opacity-20 text-red-500 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-opacity-30 transition"
      >
        <LogOut className="w-5 h-5" />
        Logout
      </button>
    </div>
  );
}

function AuthScreen({ onAuth }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name || !email) {
      alert('Please enter your name and email');
      return;
    }
    setIsLoading(true);
    await onAuth({ name, email, phone });
    setIsLoading(false);
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
              className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Enter your name"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2">
              Phone (Optional)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="(555) 123-4567"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition disabled:opacity-50"
          >
            {isLoading ? 'Creating Account...' : 'Get Started'}
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
  const [crewMembers, setCrewMembers] = useState([]);
  const [squads, setSquads] = useState([]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = () => {
      initSupabase();
      checkAuth();
    };
    document.body.appendChild(script);
  }, []);

  const checkAuth = async () => {
    const profileId = localStorage.getItem('crewq_user_id');
    if (profileId && supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('users')
          .select('*')
          .eq('id', profileId)
          .single();
        
        if (data && !error) {
          setUserProfile(data);
          await loadEvents();
          await loadCrewMembers(data.id);
          await loadSquads(data.id);
        } else {
          localStorage.removeItem('crewq_user_id');
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      }
    }
    setLoading(false);
  };

  const handleAuth = async (profile) => {
    if (!supabaseClient) return;
    
    try {
      // Check if user exists
      const { data: existingUser } = await supabaseClient
        .from('users')
        .select('*')
        .eq('email', profile.email)
        .single();

      let userData;
      if (existingUser) {
        userData = existingUser;
      } else {
        // Create new user
        const { data: newUser, error } = await supabaseClient
          .from('users')
          .insert([{
            name: profile.name,
            email: profile.email,
            phone: profile.phone
          }])
          .select()
          .single();

        if (error) throw error;
        userData = newUser;
      }

      setUserProfile(userData);
      localStorage.setItem('crewq_user_id', userData.id);
      await loadEvents();
      await loadCrewMembers(userData.id);
      await loadSquads(userData.id);
    } catch (error) {
      console.error('Error creating/logging in user:', error);
      alert('Error creating account. Please try again.');
    }
  };

  const handleUpdateProfile = async (updatedProfile) => {
    if (!supabaseClient) return;
    
    try {
      const { error } = await supabaseClient
        .from('users')
        .update({
          name: updatedProfile.name,
          email: updatedProfile.email,
          phone: updatedProfile.phone
        })
        .eq('id', userProfile.id);

      if (error) throw error;
      setUserProfile(updatedProfile);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('crewq_user_id');
    setUserProfile(null);
    setCurrentTab('discover');
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

  const loadCrewMembers = async (userId) => {
    if (!supabaseClient) return;
    
    try {
      const { data, error } = await supabaseClient
        .from('crew_members')
        .select('*, user:users(*)')
        .eq('user_id', userId);
      
      if (error) throw error;
      setCrewMembers(data?.map(cm => cm.user) || []);
    } catch (error) {
      console.error('Error loading crew members:', error);
    }
  };

  const loadSquads = async (userId) => {
    if (!supabaseClient) return;
    
    try {
      const { data, error } = await supabaseClient
        .from('squads')
        .select('*')
        .or(`created_by.eq.${userId},members.cs.{${userId}}`);
      
      if (error) throw error;
      setSquads(data || []);
    } catch (error) {
      console.error('Error loading squads:', error);
    }
  };

  const handleSwipe = async (direction) => {
    if (direction === 'right') {
      const liked = JSON.parse(localStorage.getItem('crewq_liked') || '[]');
      liked.push(events[currentIndex]);
      localStorage.setItem('crewq_liked', JSON.stringify(liked));

      // Save to Supabase
      if (supabaseClient && userProfile) {
        try {
          await supabaseClient
            .from('liked_events')
            .insert([{
              user_id: userProfile.id,
              event_id: events[currentIndex].id
            }]);
        } catch (error) {
          console.error('Error saving liked event:', error);
        }
      }
    }
    if (currentIndex < events.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleCreateSquad = () => {
    alert('Create Squad feature coming soon! This will open a form to create a new squad.');
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
  const likedEvents = JSON.parse(localStorage.getItem('crewq_liked') || '[]');

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
      <div className="w-full max-w-md bg-zinc-950 min-h-screen relative flex flex-col">
        {/* Header */}
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

          <div className="flex flex-col items-center gap-3">
            <div className={`flex gap-2 rounded-full p-1.5 transition-all duration-300 ${
              mode === 'crew' ? 'bg-zinc-800' : 'bg-orange-500'
            }`}>
              <button
                onClick={() => setMode('crew')}
                className={`px-8 py-2.5 rounded-full text-base font-bold transition-all duration-300 ${
                  mode === 'crew' 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-transparent text-zinc-900'
                }`}
              >
                Crew
              </button>
              <button
                onClick={() => setMode('solo')}
                className={`px-8 py-2.5 rounded-full text-base font-bold transition-all duration-300 ${
                  mode === 'solo' 
                    ? 'bg-zinc-900 text-white' 
                    : 'bg-transparent text-white'
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

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pb-24">
          {currentTab === 'discover' && (
            <div className="px-4 py-6">
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

                  <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-4 z-20">
                    <button
                      onClick={() => handleSwipe('left')}
                      className="w-14 h-14 rounded-full bg-zinc-800 bg-opacity-90 backdrop-blur-sm border border-zinc-700 flex items-center justify-center hover:bg-red-500 hover:border-red-500 transition shadow-lg"
                    >
                      <X className="w-6 h-6 text-white" />
                    </button>

                    <button
                      onClick={() => setShowShareModal(true)}
                      className="w-14 h-14 rounded-full bg-zinc-800 bg-opacity-90 backdrop-blur-sm border border-zinc-700 flex items-center justify-center hover:bg-orange-500 hover:border-orange-500 transition shadow-lg"
                    >
                      <Share2 className="w-6 h-6 text-white" />
                    </button>

                    <button
                      onClick={() => handleSwipe('right')}
                      className="w-14 h-14 rounded-full bg-zinc-800 bg-opacity-90 backdrop-blur-sm border border-zinc-700 flex items-center justify-center hover:bg-emerald-500 hover:border-emerald-500 transition shadow-lg"
                    >
                      <Heart className="w-6 h-6 text-white" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentTab === 'search' && <AIChat />}
          {currentTab === 'events' && <CalendarView likedEvents={likedEvents} />}
          {currentTab === 'crew' && <CrewTab squads={squads} onCreateSquad={handleCreateSquad} />}
          {currentTab === 'profile' && (
            <ProfileTab 
              userProfile={userProfile} 
              onLogout={handleLogout}
              onUpdateProfile={handleUpdateProfile}
            />
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-zinc-900 border-t border-zinc-800 px-6 py-4">
          <div className="flex justify-around items-center">
            {[
              { id: 'discover', icon: Home, label: 'Discover' },
              { id: 'search', icon: MessageCircle, label: 'Chat' },
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
            crewMembers={crewMembers}
          />
        )}
      </div>
    </div>
  );
}
