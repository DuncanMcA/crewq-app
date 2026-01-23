import React, { useState, useEffect, useRef } from 'react';
import { Heart, X, Share2, Bell, Settings, MapPin, Users, Calendar, Search, User, Home, Check, Send, ChevronLeft, ChevronRight, Clock, UserPlus, MessageCircle, Edit2, LogOut, Mail, Phone, Camera, CheckCircle } from 'lucide-react';

const SUPABASE_URL = 'https://nwrglwfobtvqqrdemoag.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53cmdsd2ZvYnR2cXFyZGVtb2FnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMDYyMDUsImV4cCI6MjA4NDU4MjIwNX0.tNwEmzXnes_r7HrOhD3iO3YgN7rP9LW4nmGM46cfI8M';

let supabaseClient = null;

const initSupabase = () => {
  if (typeof window !== 'undefined' && window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
};

const VIBE_OPTIONS = [
  { id: 'live-music', label: '🎸 Live Music', icon: '🎸' },
  { id: 'trivia', label: '🧠 Trivia', icon: '🧠' },
  { id: 'happy-hour', label: '🍻 Happy Hour', icon: '🍻' },
  { id: 'sports-bars', label: '🏈 Sports Bars', icon: '🏈' },
  { id: 'tacos', label: '🌮 Tacos', icon: '🌮' },
  { id: 'rooftop', label: '🌆 Rooftop', icon: '🌆' },
  { id: 'karaoke', label: '🎤 Karaoke', icon: '🎤' },
  { id: 'dancing', label: '💃 Dancing', icon: '💃' },
  { id: 'chill-drinks', label: '🍸 Chill Drinks', icon: '🍸' },
  { id: 'networking', label: '🤝 Networking', icon: '🤝' },
  { id: 'foodie', label: '🍽️ Foodie', icon: '🍽️' },
  { id: 'outdoor', label: '🌳 Outdoor', icon: '🌳' },
  { id: 'games', label: '🎮 Games', icon: '🎮' },
  { id: 'concerts', label: '🎵 Concerts', icon: '🎵' },
  { id: 'comedy', label: '😂 Comedy', icon: '😂' },
  { id: 'sunsets', label: '🌇 Sunsets', icon: '🌇' }
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
            {event.category?.replace('-', ' ') || 'Event'}
          </div>

          {event.age_restricted && (
            <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
              21+
            </div>
          )}

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

        <div className="p-6 pb-20">
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

function CreateSquadModal({ onClose, onCreate, userProfile, events }) {
  const [step, setStep] = useState(1);
  const [squadName, setSquadName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [invitedMembers, setInvitedMembers] = useState([]);
  const [phoneNumbers, setPhoneNumbers] = useState('');
  const [isSoloFriendly, setIsSoloFriendly] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Filter events to today and upcoming
  const today = new Date();
  const upcomingEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate >= today;
  }).slice(0, 10);

  const handleAddPhoneNumbers = () => {
    const phones = phoneNumbers.split(',').map(p => p.trim()).filter(p => p);
    setInvitedMembers(prev => [...new Set([...prev, ...phones])]);
    setPhoneNumbers('');
  };

  const handleRemoveMember = (phone) => {
    setInvitedMembers(prev => prev.filter(p => p !== phone));
  };

  const handleCreate = async () => {
    if (!squadName || !selectedEvent) {
      alert('Please enter a squad name and select an event');
      return;
    }

    setIsCreating(true);
    await onCreate({
      name: squadName,
      description,
      event: selectedEvent,
      invited_members: invitedMembers,
      is_solo_friendly: isSoloFriendly,
      created_by: userProfile.id
    });
    setIsCreating(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-6 z-10">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold text-white">Create Squad</h3>
            <button onClick={onClose} className="text-zinc-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex gap-2 mt-4">
            {[1, 2, 3].map(s => (
              <div
                key={s}
                className={`flex-1 h-1 rounded-full ${
                  step >= s ? 'bg-orange-500' : 'bg-zinc-800'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-2">
                  Squad Name *
                </label>
                <input
                  type="text"
                  value={squadName}
                  onChange={(e) => setSquadName(e.target.value)}
                  placeholder="e.g., Friday Night Crew, Trivia Squad"
                  className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's this squad about?"
                  className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  rows="3"
                />
              </div>

              <div className="bg-zinc-800 rounded-xl p-4 border-2 border-zinc-700">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-white font-semibold">Open to Solo Members?</p>
                    <p className="text-xs text-zinc-400 mt-1">
                      Let people join your squad even if they don't know anyone
                    </p>
                  </div>
                  <button
                    onClick={() => setIsSoloFriendly(!isSoloFriendly)}
                    className={`relative w-12 h-7 rounded-full transition ${
                      isSoloFriendly ? 'bg-orange-500' : 'bg-zinc-700'
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                        isSoloFriendly ? 'transform translate-x-5' : ''
                      }`}
                    />
                  </button>
                </div>
                {isSoloFriendly && (
                  <div className="mt-3 p-3 bg-orange-500 bg-opacity-10 rounded-lg border border-orange-500 border-opacity-30">
                    <p className="text-orange-400 text-xs">
                      ✨ Your squad will appear in Solo Mode for people looking to meet new friends!
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!squadName}
                className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold hover:bg-orange-600 transition disabled:opacity-50"
              >
                Next: Pick an Event
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-bold text-white mb-3">Pick an Event</h4>
                <p className="text-sm text-zinc-400 mb-4">
                  Choose what your squad will do together
                </p>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {upcomingEvents.map(event => (
                  <button
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className={`w-full text-left p-4 rounded-xl transition ${
                      selectedEvent?.id === event.id
                        ? 'bg-orange-500 bg-opacity-20 border-2 border-orange-500'
                        : 'bg-zinc-800 border-2 border-transparent hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex gap-3">
                      <img
                        src={event.image_url}
                        alt={event.name}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h5 className="text-white font-semibold mb-1 truncate">
                          {event.name}
                        </h5>
                        <p className="text-zinc-400 text-sm mb-1 truncate">
                          {event.venue}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <Calendar className="w-3 h-3" />
                          <span>{event.date}</span>
                          <span>•</span>
                          <span>{event.time}</span>
                        </div>
                      </div>
                      {selectedEvent?.id === event.id && (
                        <Check className="w-5 h-5 text-orange-500 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-zinc-800 text-white py-4 rounded-xl font-bold hover:bg-zinc-700 transition"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!selectedEvent}
                  className="flex-1 bg-orange-500 text-white py-4 rounded-xl font-bold hover:bg-orange-600 transition disabled:opacity-50"
                >
                  Next: Invite Friends
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-bold text-white mb-3">Invite Friends</h4>
                <p className="text-sm text-zinc-400 mb-4">
                  Add phone numbers to send squad invites
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-2">
                  Phone Numbers
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={phoneNumbers}
                    onChange={(e) => setPhoneNumbers(e.target.value)}
                    placeholder="555-1234, 555-5678 (comma separated)"
                    className="flex-1 bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    onClick={handleAddPhoneNumbers}
                    disabled={!phoneNumbers.trim()}
                    className="bg-orange-500 text-white px-4 rounded-xl font-semibold hover:bg-orange-600 transition disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </div>

              {invitedMembers.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-zinc-400 mb-2">
                    Invited ({invitedMembers.length})
                  </p>
                  <div className="space-y-2">
                    {invitedMembers.map(phone => (
                      <div
                        key={phone}
                        className="flex items-center justify-between bg-zinc-800 rounded-xl px-4 py-3"
                      >
                        <span className="text-white">{phone}</span>
                        <button
                          onClick={() => handleRemoveMember(phone)}
                          className="text-red-500 hover:text-red-400"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-zinc-800 rounded-xl p-4">
                <p className="text-sm text-zinc-400">
                  💡 <strong className="text-white">Tip:</strong> You can skip this step and invite people later!
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-zinc-800 text-white py-4 rounded-xl font-bold hover:bg-zinc-700 transition"
                >
                  Back
                </button>
                <button
                  onClick={handleCreate}
                  disabled={isCreating}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create Squad'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SquadDetailModal({ squad, onClose, onJoin, onLeave, onVote, userProfile, isMember }) {
  const [hasVoted, setHasVoted] = useState(false);
  const [vote, setVote] = useState(null);

  const handleVote = async (voteType) => {
    setVote(voteType);
    setHasVoted(true);
    await onVote(squad.id, voteType);
  };

  const totalVotes = (squad.votes_yes || 0) + (squad.votes_no || 0);
  const yesPercentage = totalVotes > 0 ? Math.round(((squad.votes_yes || 0) / totalVotes) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="relative">
          {squad.event?.image_url && (
            <div className="relative h-48">
              <img
                src={squad.event.image_url}
                alt={squad.event.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
              <button
                onClick={onClose}
                className="absolute top-4 right-4 bg-zinc-900 bg-opacity-80 rounded-full p-2 hover:bg-opacity-100 transition"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-2xl font-bold text-white">{squad.name}</h2>
                {squad.is_solo_friendly && (
                  <span className="bg-orange-500 bg-opacity-20 text-orange-400 px-2 py-1 rounded-full text-xs font-bold">
                    SOLO FRIENDLY
                  </span>
                )}
              </div>
              {squad.description && (
                <p className="text-zinc-400 text-sm mb-3">{squad.description}</p>
              )}
            </div>
          </div>

          {squad.event && (
            <div className="bg-zinc-800 rounded-xl p-4 mb-4">
              <p className="text-orange-500 text-xs font-semibold uppercase mb-2">Squad Event</p>
              <h4 className="text-white font-semibold mb-2">{squad.event.name}</h4>
              <div className="space-y-1 text-sm text-zinc-400">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{squad.event.venue}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{squad.event.date} • {squad.event.time}</span>
                </div>
              </div>
            </div>
          )}

          {isMember && !hasVoted && (
            <div className="bg-zinc-800 rounded-xl p-4 mb-4">
              <p className="text-white font-semibold mb-3">Are you in?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleVote('yes')}
                  className="flex-1 bg-emerald-500 bg-opacity-20 border-2 border-emerald-500 text-emerald-400 py-3 rounded-xl font-bold hover:bg-opacity-30 transition"
                >
                  👍 I'm In!
                </button>
                <button
                  onClick={() => handleVote('no')}
                  className="flex-1 bg-red-500 bg-opacity-20 border-2 border-red-500 text-red-400 py-3 rounded-xl font-bold hover:bg-opacity-30 transition"
                >
                  👎 Can't Make It
                </button>
              </div>
            </div>
          )}

          {hasVoted && (
            <div className="bg-zinc-800 rounded-xl p-4 mb-4">
              <p className="text-white font-semibold mb-2">
                {vote === 'yes' ? '✅ You voted YES!' : '❌ You voted NO'}
              </p>
              <p className="text-zinc-400 text-sm">Thanks for voting! Check back to see who else is going.</p>
            </div>
          )}

          {totalVotes > 0 && (
            <div className="bg-zinc-800 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-white font-semibold">Squad Vote</p>
                <p className="text-zinc-400 text-sm">{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</p>
              </div>
              <div className="flex gap-2 mb-2">
                <div className="flex-1 bg-zinc-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all"
                    style={{ width: `${yesPercentage}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-emerald-400">{yesPercentage}% Going</span>
                <span className="text-red-400">{100 - yesPercentage}% Not Going</span>
              </div>
            </div>
          )}

          <div className="mb-4">
            <p className="text-sm font-semibold text-zinc-400 mb-3">
              Members ({squad.member_count || 0})
            </p>
            <div className="flex items-center gap-2">
              {squad.members?.slice(0, 6).map(member => (
                <div
                  key={member.id}
                  className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white text-sm font-semibold overflow-hidden"
                >
                  {member.profile_picture ? (
                    <img src={member.profile_picture} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{member.name?.charAt(0).toUpperCase() || '?'}</span>
                  )}
                </div>
              ))}
              {(squad.member_count || 0) > 6 && (
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 text-xs font-semibold">
                  +{squad.member_count - 6}
                </div>
              )}
            </div>
          </div>

          {!isMember ? (
            <button
              onClick={() => onJoin(squad)}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-bold hover:shadow-lg transition"
            >
              Join Squad
            </button>
          ) : (
            <button
              onClick={() => onLeave(squad)}
              className="w-full bg-zinc-800 text-zinc-400 py-4 rounded-xl font-bold hover:bg-zinc-700 transition"
            >
              Leave Squad
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SoloFriendlySquadsView({ squads, onSquadClick, userProfile }) {
  const soloSquads = squads.filter(s => s.is_solo_friendly);

  return (
    <div className="p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Solo-Friendly Squads</h2>
        <p className="text-zinc-400 text-sm">
          Join these squads and meet new people in Dallas!
        </p>
      </div>

      {soloSquads.length > 0 ? (
        <div className="space-y-4">
          {soloSquads.map(squad => (
            <button
              key={squad.id}
              onClick={() => onSquadClick(squad)}
              className="w-full bg-zinc-900 rounded-2xl p-5 text-left hover:bg-zinc-800 transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold text-white">{squad.name}</h3>
                    <span className="bg-orange-500 bg-opacity-20 text-orange-400 px-2 py-1 rounded-full text-xs font-bold">
                      OPEN
                    </span>
                  </div>
                  {squad.description && (
                    <p className="text-zinc-400 text-sm mb-3">{squad.description}</p>
                  )}
                </div>
              </div>

              {squad.event && (
                <div className="bg-zinc-800 rounded-xl p-3 mb-3">
                  <p className="text-white font-semibold text-sm mb-1">{squad.event.name}</p>
                  <p className="text-zinc-400 text-xs">{squad.event.venue} • {squad.event.date}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {squad.members?.slice(0, 4).map(member => (
                    <div
                      key={member.id}
                      className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-white text-xs font-semibold overflow-hidden"
                    >
                      {member.profile_picture ? (
                        <img src={member.profile_picture} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{member.name?.charAt(0).toUpperCase() || '?'}</span>
                      )}
                    </div>
                  ))}
                  <span className="text-zinc-500 text-sm">{squad.member_count || 0} members</span>
                </div>
                <div className="text-orange-500 font-semibold text-sm">View Squad →</div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-400 mb-2">No solo-friendly squads yet</p>
          <p className="text-zinc-600 text-sm">Check back later or create one yourself!</p>
        </div>
      )}
    </div>
  );
}

function EventDetailModal({ event, onClose, onCheckIn, isCheckedIn, checkInCount, userProfile }) {
  const [checking, setChecking] = useState(false);

  const handleCheckIn = async () => {
    setChecking(true);
    await onCheckIn(event);
    setChecking(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-3xl max-w-md w-full overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="relative h-64">
          <img src={event.image_url} alt={event.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-zinc-900 bg-opacity-80 rounded-full p-2 hover:bg-opacity-100 transition"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          
          <div className="absolute top-4 left-4 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase">
            {event.category?.replace('-', ' ') || 'Event'}
          </div>

          {event.age_restricted && (
            <div className="absolute top-4 right-14 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
              21+
            </div>
          )}
        </div>

        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-2">{event.name}</h2>
          <p className="text-zinc-400 text-sm mb-4">{event.description}</p>
          
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2 text-zinc-300 text-sm">
              <MapPin className="w-4 h-4 text-orange-500" />
              <span>{event.venue} • {event.neighborhood}</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-300 text-sm">
              <Calendar className="w-4 h-4 text-orange-500" />
              <span>{event.time}</span>
            </div>
            {checkInCount > 0 && (
              <div className="flex items-center gap-2 text-zinc-300 text-sm">
                <Users className="w-4 h-4 text-orange-500" />
                <span>{checkInCount} {checkInCount === 1 ? 'person' : 'people'} checked in</span>
              </div>
            )}
          </div>

          {isCheckedIn ? (
            <div className="bg-emerald-500 bg-opacity-20 border-2 border-emerald-500 text-emerald-400 py-4 rounded-xl font-bold flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5" />
              You're Checked In!
            </div>
          ) : (
            <button
              onClick={handleCheckIn}
              disabled={checking}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              {checking ? 'Checking In...' : "I'm Here! Check In"}
            </button>
          )}
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
      url: `https://crewq-app.vercel.app/event/${event.id}`
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
                  <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-white font-semibold overflow-hidden">
                    {member.profile_picture ? (
                      <img src={member.profile_picture} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{member.name?.charAt(0).toUpperCase() || '?'}</span>
                    )}
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

function SharedEventView({ eventId, onJoinCrew, onClose }) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    if (!supabaseClient) return;
    
    try {
      const { data, error } = await supabaseClient
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();
      
      if (error) throw error;
      setEvent(data);
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCrew = async () => {
    setJoining(true);
    await onJoinCrew(event);
    setJoining(false);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
        <div className="text-white text-xl">Loading event...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
        <div className="bg-zinc-900 rounded-3xl max-w-md w-full p-6 text-center">
          <h3 className="text-xl font-bold text-white mb-4">Event Not Found</h3>
          <p className="text-zinc-400 mb-6">This event may have been removed or doesn't exist.</p>
          <button
            onClick={onClose}
            className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600 transition"
          >
            Continue to CrewQ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-3xl max-w-md w-full overflow-hidden">
        <div className="relative h-64">
          <img src={event.image_url} alt={event.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-zinc-900 bg-opacity-80 rounded-full p-2 hover:bg-opacity-100 transition"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <div className="inline-block bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase mb-3">
              {event.category?.replace('-', ' ') || 'Event'}
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{event.name}</h2>
            <p className="text-zinc-400 text-sm mb-4">{event.description}</p>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-zinc-300 text-sm">
                <MapPin className="w-4 h-4 text-orange-500" />
                <span>{event.venue} • {event.neighborhood}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300 text-sm">
                <Calendar className="w-4 h-4 text-orange-500" />
                <span>{event.time}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleJoinCrew}
              disabled={joining}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50"
            >
              {joining ? 'Joining...' : '🎉 Join the Crew & Like Event'}
            </button>
            
            <button
              onClick={onClose}
              className="w-full bg-zinc-800 text-white py-3 rounded-xl font-semibold hover:bg-zinc-700 transition"
            >
              Explore More Events
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AIChat({ userProfile }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Hey ${userProfile?.name || 'there'}! I'm your Dallas nightlife assistant. I can help you find events based on your vibes, recommend venues, or answer questions about what's happening tonight!` }
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
      const userContext = userProfile ? `
User Info:
- Name: ${userProfile.name}
- Age: ${userProfile.age || 'Not specified'}
- Vibes: ${userProfile.vibes?.map(v => VIBE_OPTIONS.find(vo => vo.id === v)?.label).join(', ') || 'Not specified'}
- Bio: ${userProfile.bio || 'Not provided'}

Use this info to personalize recommendations.
      ` : '';

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
          system: `You are a knowledgeable and enthusiastic Dallas nightlife assistant helping users discover the best events and venues. 

${userContext}

Your expertise includes:
- Deep Ellum: Live music venues, dive bars, punk/indie scene, The Rustic, Club Dada, Trees
- Uptown: Upscale bars, rooftop lounges, Happiest Hour, The Whippersnapper, Citizen
- Lower Greenville: Craft cocktails, neighborhood bars, Sundown at Granada, The Foundry
- Design District: Trendy spots, cocktail bars, Midnight Rambler, Sassetta
- Knox-Henderson: Wine bars, date spots, Barcadia, The Ginger Man
- West Village: Walkable bar scene, patios, The Rustic, Citizen

Be friendly, concise, and enthusiastic. Give specific recommendations based on the user's vibes and preferences. Include venue names, neighborhoods, and what makes each spot special. Keep responses conversational and helpful - you're like a local friend giving insider tips!`
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
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
              msg.role === 'user' 
                ? 'bg-orange-500 text-white' 
                : 'bg-zinc-800 text-white'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
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
            placeholder="Ask about events, venues, or what to do tonight..."
            className="flex-1 bg-zinc-800 text-white rounded-full px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500 text-sm"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-orange-500 text-white rounded-full w-12 h-12 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-600 transition"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function CalendarView({ likedEvents, onEventClick }) {
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

  // Add this new component after the CalendarView component (around line 1400)

function LiveEventsView({ events, onEventClick }) {
  const [liveEvents, setLiveEvents] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update current time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    filterLiveEvents();
  }, [events, currentTime]);

  const filterLiveEvents = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });

    const live = events.filter(event => {
      // Parse event time (assuming format like "8:00 PM - 2:00 AM")
      const timeMatch = event.time?.match(/(\d+):(\d+)\s*(AM|PM)\s*-\s*(\d+):(\d+)\s*(AM|PM)/);
      
      if (!timeMatch) return false;

      let startHour = parseInt(timeMatch[1]);
      const startMinute = parseInt(timeMatch[2]);
      const startPeriod = timeMatch[3];
      let endHour = parseInt(timeMatch[4]);
      const endMinute = parseInt(timeMatch[5]);
      const endPeriod = timeMatch[6];

      // Convert to 24-hour format
      if (startPeriod === 'PM' && startHour !== 12) startHour += 12;
      if (startPeriod === 'AM' && startHour === 12) startHour = 0;
      if (endPeriod === 'PM' && endHour !== 12) endHour += 12;
      if (endPeriod === 'AM' && endHour === 12) endHour = 0;

      // Handle events that go past midnight
      if (endHour < startHour) endHour += 24;

      const currentTimeInMinutes = currentHour * 60 + currentMinute;
      const startTimeInMinutes = startHour * 60 + startMinute;
      let endTimeInMinutes = endHour * 60 + endMinute;

      // Check if event is happening now
      if (endHour >= 24) {
        // Event goes past midnight
        return currentTimeInMinutes >= startTimeInMinutes || currentTimeInMinutes <= (endTimeInMinutes - 24 * 60);
      } else {
        return currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes <= endTimeInMinutes;
      }
    });

    setLiveEvents(live);
  };

  return (
    <div className="p-4">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="relative">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
          </div>
          <h2 className="text-2xl font-bold text-white">Live Now</h2>
        </div>
        <p className="text-zinc-400 text-sm">
          Events happening right now in Dallas
        </p>
      </div>

      {liveEvents.length > 0 ? (
        <div className="space-y-4">
          {liveEvents.map((event) => (
            <button
              key={event.id}
              onClick={() => onEventClick(event)}
              className="w-full bg-zinc-900 rounded-2xl overflow-hidden hover:bg-zinc-800 transition text-left"
            >
              <div className="relative h-40">
                <img 
                  src={event.image_url} 
                  alt={event.name} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
                
                {/* Live badge */}
                <div className="absolute top-3 left-3 flex items-center gap-2 bg-red-500 text-white px-3 py-1.5 rounded-full">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span className="text-xs font-bold uppercase">Live Now</span>
                </div>

                {event.age_restricted && (
                  <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                    21+
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-bold text-white flex-1">{event.name}</h3>
                </div>
                
                <p className="text-zinc-400 text-sm mb-3 line-clamp-2">{event.description}</p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-zinc-400 text-sm">
                    <MapPin className="w-4 h-4 text-orange-500" />
                    <span>{event.venue} • {event.neighborhood}</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400 text-sm">
                    <Clock className="w-4 h-4 text-orange-500" />
                    <span>{event.time}</span>
                  </div>
                </div>

                <div className="mt-3 inline-block bg-orange-500 bg-opacity-20 text-orange-400 px-3 py-1 rounded-full text-xs font-bold">
                  HAPPENING NOW →
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="relative inline-block mb-4">
            <Clock className="w-16 h-16 text-zinc-700" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-zinc-800 rounded-full"></div>
          </div>
          <p className="text-zinc-400 mb-2">No live events right now</p>
          <p className="text-zinc-600 text-sm">Check back later or browse upcoming events</p>
        </div>
      )}

      {/* Current time display */}
      <div className="mt-6 text-center text-zinc-500 text-sm">
        Updated: {currentTime.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        })}
      </div>
    </div>
  );
}

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
              <button
                key={idx}
                onClick={() => onEventClick(event)}
                className="w-full bg-zinc-800 rounded-2xl p-4 hover:bg-zinc-700 transition text-left"
              >
                <h4 className="text-white font-semibold mb-1">{event.name}</h4>
                <p className="text-zinc-400 text-sm mb-2">{event.venue}</p>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <Clock className="w-3 h-3" />
                  <span>{event.time}</span>
                </div>
              </button>
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
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold text-white">{squad.name}</h3>
                    {squad.is_solo_friendly && (
                      <span className="bg-orange-500 bg-opacity-20 text-orange-400 px-2 py-1 rounded-full text-xs font-bold">
                        SOLO
                      </span>
                    )}
                  </div>
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
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white text-sm font-semibold overflow-hidden">
                        {member.profile_picture ? (
                          <img src={member.profile_picture} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{member.name?.charAt(0).toUpperCase() || '?'}</span>
                        )}
                      </div>
                    </div>
                  ))}
                  <button className="flex-shrink-0 w-10 h-10 rounded-full border-2 border-dashed border-zinc-700 flex items-center justify-center text-zinc-500 hover:border-orange-500 hover:text-orange-500 transition">
                    <UserPlus className="w-5 h-5" />
                  </button>
                </div>
              )}

              {squad.event && (
                <div className="bg-zinc-800 rounded-xl p-4 border border-zinc-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-orange-500 text-xs font-semibold uppercase mb-1">Next Event</p>
                      <h4 className="text-white font-semibold mb-1">{squad.event.name}</h4>
                      <p className="text-zinc-400 text-sm mb-2">{squad.event.venue}</p>
                      <div className="flex items-center gap-3 text-xs text-zinc-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{squad.event.date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{squad.event.time}</span>
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
  const [uploadingImage, setUploadingImage] = useState(false);
  const likedEvents = JSON.parse(localStorage.getItem('crewq_liked') || '[]');
  const [squadsCount, setSquadsCount] = useState(0);
  const fileInputRef = useRef(null);

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

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedProfile({ ...editedProfile, profile_picture: reader.result });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    await onUpdateProfile(editedProfile);
    setIsEditing(false);
  };

  const handleVibeToggle = (vibeId) => {
    const currentVibes = editedProfile.vibes || [];
    const newVibes = currentVibes.includes(vibeId)
      ? currentVibes.filter(v => v !== vibeId)
      : [...currentVibes, vibeId];
    setEditedProfile({ ...editedProfile, vibes: newVibes });
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
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
              {editedProfile.profile_picture ? (
                <img src={editedProfile.profile_picture} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span>{userProfile.name?.charAt(0).toUpperCase() || '?'}</span>
              )}
            </div>
            {isEditing && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-orange-500 rounded-full p-2 hover:bg-orange-600 transition"
              >
                <Camera className="w-4 h-4 text-white" />
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
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
            <label className="block text-sm font-semibold text-zinc-400 mb-2">Age</label>
            {isEditing ? (
              <input
                type="number"
                value={editedProfile.age || ''}
                onChange={(e) => setEditedProfile({ ...editedProfile, age: e.target.value })}
                className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Your age"
              />
            ) : (
              <div className="flex items-center gap-3 bg-zinc-800 rounded-xl px-4 py-3">
                <span className="text-white">{userProfile.age || 'Not provided'}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-400 mb-2">Phone (Optional)</label>
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

          {isEditing && (
            <>
              <div>
                <label className="block text-sm font-semibold text-zinc-400 mb-2">What's your vibe?</label>
                <div className="flex flex-wrap gap-2">
                  {VIBE_OPTIONS.map(vibe => (
                    <button
                      key={vibe.id}
                      onClick={() => handleVibeToggle(vibe.id)}
                      className={`px-3 py-2 rounded-full text-sm font-semibold transition ${
                        (editedProfile.vibes || []).includes(vibe.id)
                          ? 'bg-orange-500 text-white'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {vibe.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-400 mb-2">Bio (Optional)</label>
                <textarea
                  value={editedProfile.bio || ''}
                  onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                  className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  rows="3"
                  placeholder="Tell us about yourself..."
                />
              </div>
            </>
          )}

          {!isEditing && userProfile.bio && (
            <div>
              <label className="block text-sm font-semibold text-zinc-400 mb-2">Bio</label>
              <div className="bg-zinc-800 rounded-xl px-4 py-3">
                <p className="text-white text-sm">{userProfile.bio}</p>
              </div>
            </div>
          )}

          {!isEditing && userProfile.vibes && userProfile.vibes.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-zinc-400 mb-2">Vibes</label>
              <div className="flex flex-wrap gap-2">
                {userProfile.vibes.map(vibeId => {
                  const vibe = VIBE_OPTIONS.find(v => v.id === vibeId);
                  return vibe ? (
                    <span key={vibeId} className="bg-orange-500 bg-opacity-20 text-orange-400 px-3 py-1 rounded-full text-sm font-semibold">
                      {vibe.label}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}
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
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [vibes, setVibes] = useState([]);
  const [bio, setBio] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleVibeToggle = (vibeId) => {
    setVibes(prev =>
      prev.includes(vibeId)
        ? prev.filter(v => v !== vibeId)
        : [...prev, vibeId]
    );
  };

  const handleSubmit = async () => {
    if (!name) {
      alert('Please enter your name');
      return;
    }

    setIsLoading(true);
    await onAuth({ name, age: age ? parseInt(age) : null, phone, vibes, bio, profile_picture: null });
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-3xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h1 className="text-3xl font-bold text-white mb-2">
          Crew<span className="text-orange-500">Q</span>
        </h1>
        <p className="text-zinc-400 mb-6">Dallas Nightlife, Solved</p>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-2">First Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter your first name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-2">Age (Optional)</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Your age"
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
              onClick={() => setStep(2)}
              disabled={!name}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-3">What's your vibe?</label>
              <p className="text-xs text-zinc-500 mb-3">Select all that apply</p>
              <div className="flex flex-wrap gap-2">
                {VIBE_OPTIONS.map(vibe => (
                  <button
                    key={vibe.id}
                    onClick={() => handleVibeToggle(vibe.id)}
                    className={`px-3 py-2 rounded-full text-sm font-semibold transition ${
                      vibes.includes(vibe.id)
                        ? 'bg-orange-500 text-white'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {vibe.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-2">Bio (Optional)</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                rows="3"
                placeholder="Tell us about yourself..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-zinc-800 text-white py-4 rounded-xl font-bold hover:bg-zinc-700 transition"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Get Started'}
              </button>
            </div>
          </div>
        )}
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
  const [allSquads, setAllSquads] = useState([]);
  const [sharedEventId, setSharedEventId] = useState(null);
  const [showSharedEvent, setShowSharedEvent] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [checkedInEvents, setCheckedInEvents] = useState([]);
  const [showCreateSquad, setShowCreateSquad] = useState(false);
  const [showSquadDetail, setShowSquadDetail] = useState(false);
  const [selectedSquad, setSelectedSquad] = useState(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = () => {
      initSupabase();
      checkAuth();
      checkForSharedEvent();
    };
    document.body.appendChild(script);
  }, []);

  const checkForSharedEvent = () => {
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get('event');
    
    const path = window.location.pathname;
    const eventMatch = path.match(/\/event\/([a-zA-Z0-9-]+)/);
    
    if (eventId || eventMatch) {
      setSharedEventId(eventId || eventMatch[1]);
      setShowSharedEvent(true);
    }
  };

  const handleJoinFromSharedLink = async (event) => {
    if (!userProfile) {
      alert('Please create an account or log in to join!');
      setShowSharedEvent(false);
      return;
    }

    const liked = JSON.parse(localStorage.getItem('crewq_liked') || '[]');
    if (!liked.find(e => e.id === event.id)) {
      liked.push(event);
      localStorage.setItem('crewq_liked', JSON.stringify(liked));

      if (supabaseClient) {
        try {
          await supabaseClient
            .from('liked_events')
            .insert([{
              user_id: userProfile.id,
              event_id: event.id
            }]);
        } catch (error) {
          console.error('Error saving liked event:', error);
        }
      }
    }

    setShowSharedEvent(false);
    alert('🎉 You joined the crew and liked this event! Check it out in your calendar.');
    setCurrentTab('events');
  };

  const handleCloseSharedEvent = () => {
    setShowSharedEvent(false);
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowEventDetail(true);
  };

  const handleCheckIn = async (event) => {
    if (!supabaseClient || !userProfile) return;

    try {
      await supabaseClient
        .from('event_checkins')
        .insert([{
          user_id: userProfile.id,
          event_id: event.id
        }]);

      setCheckedInEvents(prev => [...prev, event.id]);
      alert("You're checked in! Your crew will see you're here.");
    } catch (error) {
      console.error('Error checking in:', error);
      alert('Error checking in. Please try again.');
    }
  };

  const handleCreateSquad = async (squadData) => {
    if (!supabaseClient) return;
    
    try {
      const { data: newSquad, error } = await supabaseClient
        .from('squads')
        .insert([{
          name: squadData.name,
          description: squadData.description,
          created_by: squadData.created_by,
          is_solo_friendly: squadData.is_solo_friendly,
          event_id: squadData.event.id,
          member_count: 1,
          invited_members: squadData.invited_members,
          votes_yes: 0,
          votes_no: 0
        }])
        .select()
        .single();

      if (error) throw error;

      await supabaseClient
        .from('squad_members')
        .insert([{
          squad_id: newSquad.id,
          user_id: userProfile.id
        }]);

      alert('Squad created! 🎉 Invites will be sent to your friends.');
      setShowCreateSquad(false);
      await loadSquads(userProfile.id);
      await loadAllSquads();
    } catch (error) {
      console.error('Error creating squad:', error);
      alert('Error creating squad. Please try again.');
    }
  };

  const handleJoinSquad = async (squad) => {
    if (!supabaseClient || !userProfile) return;
    
    try {
      await supabaseClient
        .from('squad_members')
        .insert([{
          squad_id: squad.id,
          user_id: userProfile.id
        }]);

      await supabaseClient
        .from('squads')
        .update({ member_count: (squad.member_count || 0) + 1 })
        .eq('id', squad.id);

      alert('You joined the squad! 🎉');
      setShowSquadDetail(false);
      await loadSquads(userProfile.id);
      await loadAllSquads();
    } catch (error) {
      console.error('Error joining squad:', error);
      alert('Error joining squad. Please try again.');
    }
  };

  const handleLeaveSquad = async (squad) => {
    if (!supabaseClient || !userProfile) return;
    
    try {
      await supabaseClient
        .from('squad_members')
        .delete()
        .eq('squad_id', squad.id)
        .eq('user_id', userProfile.id);

      await supabaseClient
        .from('squads')
        .update({ member_count: Math.max((squad.member_count || 1) - 1, 0) })
        .eq('id', squad.id);

      alert('You left the squad');
      setShowSquadDetail(false);
      await loadSquads(userProfile.id);
      await loadAllSquads();
    } catch (error) {
      console.error('Error leaving squad:', error);
      alert('Error leaving squad. Please try again.');
    }
  };

  const handleVote = async (squadId, voteType) => {
    if (!supabaseClient || !userProfile) return;
    
    try {
      await supabaseClient
        .from('squad_votes')
        .insert([{
          squad_id: squadId,
          user_id: userProfile.id,
          vote: voteType
        }]);

      const { data: squad } = await supabaseClient
        .from('squads')
        .select('votes_yes, votes_no')
        .eq('id', squadId)
        .single();

      const updates = voteType === 'yes'
        ? { votes_yes: (squad.votes_yes || 0) + 1 }
        : { votes_no: (squad.votes_no || 0) + 1 };

      await supabaseClient
        .from('squads')
        .update(updates)
        .eq('id', squadId);

      await loadSquads(userProfile.id);
      await loadAllSquads();
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const loadCheckedInEvents = async (userId) => {
    if (!supabaseClient) return;
    
    try {
      const { data, error } = await supabaseClient
        .from('event_checkins')
        .select('event_id')
        .eq('user_id', userId);
      
      if (error) throw error;
      setCheckedInEvents(data?.map(c => c.event_id) || []);
    } catch (error) {
      console.error('Error loading check-ins:', error);
    }
  };

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
          await loadAllSquads();
          await loadCheckedInEvents(data.id);
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
    if (!supabaseClient) {
      alert('Database connection error. Please refresh the page.');
      return;
    }
    
    try {
      const newUserData = {
        name: profile.name
      };

      if (profile.age) newUserData.age = profile.age;
      if (profile.phone) newUserData.phone = profile.phone;
      if (profile.vibes && profile.vibes.length > 0) newUserData.vibes = profile.vibes;
      if (profile.bio) newUserData.bio = profile.bio;

      const { data: newUser, error } = await supabaseClient
        .from('users')
        .insert([newUserData])
        .select()
        .single();

      if (error) {
        console.error('Insert error:', error);
        alert('Database error: ' + error.message);
        return;
      }

      setUserProfile(newUser);
      localStorage.setItem('crewq_user_id', newUser.id);
      await loadEvents();
      await loadCrewMembers(newUser.id);
      await loadSquads(newUser.id);
      await loadAllSquads();
    } catch (error) {
      console.error('Error creating account:', error);
      alert('Error creating account: ' + error.message);
    }
  };

  const handleUpdateProfile = async (updatedProfile) => {
    if (!supabaseClient) return;
    
    try {
      const { error } = await supabaseClient
        .from('users')
        .update({
          name: updatedProfile.name,
          age: updatedProfile.age,
          phone: updatedProfile.phone,
          vibes: updatedProfile.vibes,
          bio: updatedProfile.bio,
          profile_picture: updatedProfile.profile_picture
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
        .select('friend_id, friend:users!crew_members_friend_id_fkey(*)')
        .eq('user_id', userId);
      
      if (error) throw error;
      
      const members = data?.map(cm => ({
        id: cm.friend?.id,
        name: cm.friend?.name,
        email: cm.friend?.email,
        profile_picture: cm.friend?.profile_picture,
        online: false
      })) || [];
      
      setCrewMembers(members);
    } catch (error) {
      console.error('Error loading crew members:', error);
      setCrewMembers([]);
    }
  };

const loadSquads = async (userId) => {
    if (!supabaseClient) return;
    
    try {
      const { data: squadMemberships } = await supabaseClient
        .from('squad_members')
        .select('squad_id')
        .eq('user_id', userId);

      const squadIds = squadMemberships?.map(sm => sm.squad_id) || [];
      
      if (squadIds.length === 0) {
        setSquads([]);
        return;
      }

      // First get squads
      const { data: squadsData, error: squadsError } = await supabaseClient
        .from('squads')
        .select('*')
        .in('id', squadIds);
      
      if (squadsError) throw squadsError;

      // Then get events for those squads
      const squadWithEvents = await Promise.all(
        (squadsData || []).map(async (squad) => {
          if (squad.event_id) {
            const { data: eventData } = await supabaseClient
              .from('events')
              .select('*')
              .eq('id', squad.event_id)
              .single();
            return { ...squad, event: eventData };
          }
          return squad;
        })
      );
      
      setSquads(squadWithEvents);
    } catch (error) {
      console.error('Error loading squads:', error);
      setSquads([]);
    }
  };

 const loadAllSquads = async () => {
    if (!supabaseClient) return;
    
    try {
      // First get solo-friendly squads
      const { data: squadsData, error: squadsError } = await supabaseClient
        .from('squads')
        .select('*')
        .eq('is_solo_friendly', true)
        .order('created_at', { ascending: false });
      
      if (squadsError) throw squadsError;

      // Then get events for those squads
      const squadWithEvents = await Promise.all(
        (squadsData || []).map(async (squad) => {
          if (squad.event_id) {
            const { data: eventData } = await supabaseClient
              .from('events')
              .select('*')
              .eq('id', squad.event_id)
              .single();
            return { ...squad, event: eventData };
          }
          return squad;
        })
      );
      
      setAllSquads(squadWithEvents);
    } catch (error) {
      console.error('Error loading all squads:', error);
      setAllSquads([]);
    }
  };

  const handleSwipe = async (direction) => {
    if (direction === 'right') {
      const liked = JSON.parse(localStorage.getItem('crewq_liked') || '[]');
      liked.push(events[currentIndex]);
      localStorage.setItem('crewq_liked', JSON.stringify(liked));

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
                <div className="relative h-[580px]">
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
                      className="w-16 h-16 rounded-full bg-zinc-800 bg-opacity-90 backdrop-blur-sm border border-zinc-700 flex items-center justify-center hover:bg-red-500 hover:border-red-500 transition shadow-lg"
                    >
                      <X className="w-7 h-7 text-white" />
                    </button>

                    <button
                      onClick={() => setShowShareModal(true)}
                      className="w-16 h-16 rounded-full bg-zinc-800 bg-opacity-90 backdrop-blur-sm border border-zinc-700 flex items-center justify-center hover:bg-orange-500 hover:border-orange-500 transition shadow-lg"
                    >
                      <Share2 className="w-7 h-7 text-white" />
                    </button>

                    <button
                      onClick={() => handleSwipe('right')}
                      className="w-16 h-16 rounded-full bg-zinc-800 bg-opacity-90 backdrop-blur-sm border border-zinc-700 flex items-center justify-center hover:bg-emerald-500 hover:border-emerald-500 transition shadow-lg"
                    >
                      <Heart className="w-7 h-7 text-white" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentTab === 'search' && <AIChat userProfile={userProfile} />}
          {currentTab === 'live' && <LiveEventsView events={events} onEventClick={handleEventClick} />}
          {currentTab === 'events' && <CalendarView likedEvents={likedEvents} onEventClick={handleEventClick} />}
          {currentTab === 'crew' && mode === 'crew' && (
            <CrewTab squads={squads} onCreateSquad={() => setShowCreateSquad(true)} />
          )}
          {currentTab === 'crew' && mode === 'solo' && (
            <SoloFriendlySquadsView 
              squads={allSquads} 
              onSquadClick={(squad) => {
                setSelectedSquad(squad);
                setShowSquadDetail(true);
              }}
              userProfile={userProfile}
            />
          )}
          {currentTab === 'profile' && (
            <ProfileTab 
              userProfile={userProfile} 
              onLogout={handleLogout}
              onUpdateProfile={handleUpdateProfile}
            />
          )}
        </div>

        <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-zinc-900 border-t border-zinc-800 px-6 py-4">
          <div className="flex justify-around items-center">
          {[
              { id: 'discover', icon: Home, label: 'Discover' },
              { id: 'live', icon: Clock, label: 'Live' },
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

        {showSharedEvent && sharedEventId && (
          <SharedEventView
            eventId={sharedEventId}
            onJoinCrew={handleJoinFromSharedLink}
            onClose={handleCloseSharedEvent}
          />
        )}

        {showEventDetail && selectedEvent && (
          <EventDetailModal
            event={selectedEvent}
            onClose={() => setShowEventDetail(false)}
            onCheckIn={handleCheckIn}
            isCheckedIn={checkedInEvents.includes(selectedEvent.id)}
            checkInCount={0}
            userProfile={userProfile}
          />
        )}

        {showCreateSquad && (
          <CreateSquadModal
            onClose={() => setShowCreateSquad(false)}
            onCreate={handleCreateSquad}
            userProfile={userProfile}
            events={events}
          />
        )}

        {showSquadDetail && selectedSquad && (
          <SquadDetailModal
            squad={selectedSquad}
            onClose={() => setShowSquadDetail(false)}
            onJoin={handleJoinSquad}
            onLeave={handleLeaveSquad}
            onVote={handleVote}
            userProfile={userProfile}
            isMember={selectedSquad.members?.some(m => m.id === userProfile.id)}
          />
        )}
      </div>
    </div>
  );
}
