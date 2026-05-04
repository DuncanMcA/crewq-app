import React, { useState, useEffect, useRef } from 'react';
import { Heart, X, Share2, Bell, BellOff, Settings, MapPin, Users, Calendar, Search, User, Home, Check, Send, ChevronLeft, ChevronRight, Clock, UserPlus, MessageCircle, Edit2, LogOut, Mail, Phone, Camera, CheckCircle, Trash2, Eye, EyeOff, Shield, Sparkles, ExternalLink, Globe, UtensilsCrossed, Award, Trophy, Star, Flame, Music, Mic, Beer, Coffee, Utensils, Sunrise, Moon, Key, Crown, Zap, Target, Navigation, Map, Filter, Car, Building2, Plus, BarChart3, DollarSign } from 'lucide-react';

// Theme color configuration
// Dark mode: Purple neon nighttime vibe
// Light mode: Orange/yellow sunny daytime vibe
const THEME = {
  dark: {
    primary: 'violet-500',
    primaryHover: 'violet-600',
    primaryBg: 'violet-500',
    primaryText: 'violet-400',
    primaryBorder: 'violet-500',
    primaryGlow: 'violet-500/20',
    gradient: 'from-violet-500 to-purple-600',
    gradientAlt: 'from-purple-500 to-pink-500',
    accent: 'purple-400',
    bg: 'black',
    bgSecondary: 'zinc-900',
    bgTertiary: 'zinc-800',
    text: 'white',
    textSecondary: 'zinc-400',
    border: 'zinc-800',
  },
  light: {
    primary: 'orange-500',
    primaryHover: 'orange-600',
    primaryBg: 'orange-500',
    primaryText: 'orange-600',
    primaryBorder: 'orange-400',
    primaryGlow: 'orange-500/20',
    gradient: 'from-orange-400 to-yellow-500',
    gradientAlt: 'from-yellow-400 to-orange-500',
    accent: 'amber-500',
    bg: 'amber-50',
    bgSecondary: 'white',
    bgTertiary: 'amber-100',
    text: 'zinc-900',
    textSecondary: 'zinc-600',
    border: 'amber-200',
  }
};

// Helper function to get theme-aware classes
const getThemeColor = (darkMode, type) => {
  return darkMode ? THEME.dark[type] : THEME.light[type];
};

// Toast Notification Component
function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-emerald-500' 
    : type === 'error' ? 'bg-red-500' 
    : type === 'info' ? 'bg-blue-500' 
    : 'bg-orange-500';

  const icon = type === 'success' ? '✓' 
    : type === 'error' ? '✕' 
    : type === 'info' ? 'ℹ' 
    : '🎉';

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] animate-slide-down">
      <div className={`${bgColor} text-white px-6 py-3 rounded-2xl shadow-lg flex items-center gap-3 max-w-sm`}>
        <span className="text-lg">{icon}</span>
        <span className="font-medium text-sm">{message}</span>
        <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

const SUPABASE_URL = 'https://nwrglwfobtvqqrdemoag.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53cmdsd2ZvYnR2cXFyZGVtb2FnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMDYyMDUsImV4cCI6MjA4NDU4MjIwNX0.tNwEmzXnes_r7HrOhD3iO3YgN7rP9LW4nmGM46cfI8M';

// API Keys - Use environment variables in production
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';
const GOOGLE_PLACES_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY || '';

// Dallas Neighborhoods with approximate center coordinates
const DALLAS_NEIGHBORHOODS = [
  { id: 'deep-ellum', name: 'Deep Ellum', center: [-96.7836, 32.7842], color: '#f97316' },
  { id: 'uptown', name: 'Uptown', center: [-96.8022, 32.8021], color: '#3b82f6' },
  { id: 'lower-greenville', name: 'Lower Greenville', center: [-96.7700, 32.8250], color: '#22c55e' },
  { id: 'bishop-arts', name: 'Bishop Arts', center: [-96.8269, 32.7468], color: '#a855f7' },
  { id: 'design-district', name: 'Design District', center: [-96.8194, 32.7903], color: '#ec4899' },
  { id: 'downtown', name: 'Downtown', center: [-96.7970, 32.7767], color: '#eab308' },
  { id: 'knox-henderson', name: 'Knox/Henderson', center: [-96.7858, 32.8172], color: '#14b8a6' },
  { id: 'oak-lawn', name: 'Oak Lawn', center: [-96.8106, 32.8089], color: '#f43f5e' },
  { id: 'trinity-groves', name: 'Trinity Groves', center: [-96.8389, 32.7783], color: '#8b5cf6' },
  { id: 'victory-park', name: 'Victory Park', center: [-96.8097, 32.7875], color: '#06b6d4' },
  { id: 'lakewood', name: 'Lakewood', center: [-96.7350, 32.8150], color: '#84cc16' },
  { id: 'oak-cliff', name: 'Oak Cliff', center: [-96.8450, 32.7350], color: '#f59e0b' }
];

// Dallas center for default map view
const DALLAS_CENTER = [-96.7970, 32.7767];
const DEFAULT_ZOOM = 12;

let supabaseClient = null;

const initSupabase = () => {
  if (typeof window !== 'undefined' && window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
  }
};

// Location utilities
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  // Haversine formula for distance in miles
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const formatDistance = (miles) => {
  if (miles === null || miles === undefined || isNaN(miles)) return '';
  if (miles < 0.1) return 'Here';
  if (miles < 1) return `${(miles * 5280 / 1000).toFixed(1)}k ft`;
  return `${miles.toFixed(1)} mi`;
};

// Patch A — Mapbox forward geocoder. Returns { latitude, longitude } or null.
// Fails silently — distance filter fails open when lat/lng missing.
const geocodeAddress = async (address) => {
  if (!address || !MAPBOX_TOKEN) return null;
  try {
    const encoded = encodeURIComponent(address.trim());
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${MAPBOX_TOKEN}&limit=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const feature = data?.features?.[0];
    if (!feature?.center || feature.center.length < 2) return null;
    // Mapbox returns [lng, lat]
    return {
      longitude: feature.center[0],
      latitude: feature.center[1],
      place_name: feature.place_name || null
    };
  } catch (err) {
    console.warn('Geocoding failed for address:', address, err);
    return null;
  }
};

// Patch A — Pull together a venue's full address for geocoding
const buildAddressString = (parts) => {
  const cleaned = [parts.address, parts.neighborhood, parts.city || 'Dallas', parts.state || 'TX']
    .filter(p => p && String(p).trim())
    .map(p => String(p).trim());
  return cleaned.join(', ');
};

const isEventLive = (event) => {
  const now = new Date();
  const eventDate = new Date(event.date);
  
  // Check if it's the same day
  if (eventDate.toDateString() !== now.toDateString()) return false;
  
  // Parse event time
  if (!event.time) return false;
  
  const timeMatch = event.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!timeMatch) return false;
  
  let startHours = parseInt(timeMatch[1]);
  const startMinutes = parseInt(timeMatch[2]);
  const period = timeMatch[3].toUpperCase();
  
  if (period === 'PM' && startHours !== 12) startHours += 12;
  if (period === 'AM' && startHours === 12) startHours = 0;
  
  const eventStart = new Date(eventDate);
  eventStart.setHours(startHours, startMinutes, 0, 0);
  
  // Event is live if it started within the last 4 hours
  const eventEnd = new Date(eventStart.getTime() + 4 * 60 * 60 * 1000);
  
  return now >= eventStart && now <= eventEnd;
};

// Get user's current location (one-time)
const getUserLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // Cache for 5 minutes
      }
    );
  });
};

// Validate check-in location (within 250 meters)
const validateCheckInLocation = async (eventLat, eventLng) => {
  try {
    const userLocation = await getUserLocation();
    const distance = calculateDistance(
      userLocation.latitude, 
      userLocation.longitude, 
      eventLat, 
      eventLng
    );
    // 250 meters = ~0.155 miles
    return distance <= 0.155;
  } catch (error) {
    console.error('Location validation error:', error);
    return null; // null means couldn't verify
  }
};

// Badge/Award System
const BADGES = [
  // Getting Started Badges
  { id: 'first-checkin', name: 'First Steps', description: 'Check in to your first event', icon: '👟', category: 'getting-started', requirement: { type: 'checkins', count: 1 }, points: 10 },
  { id: 'profile-complete', name: 'Looking Good', description: 'Complete your profile with bio and vibes', icon: '✨', category: 'getting-started', requirement: { type: 'profile-complete' }, points: 15 },
  { id: 'first-squad', name: 'Squad Leader', description: 'Create your first squad', icon: '👑', category: 'getting-started', requirement: { type: 'squads-created', count: 1 }, points: 20 },
  { id: 'first-share', name: 'Spread the Word', description: 'Share an event with friends', icon: '📢', category: 'getting-started', requirement: { type: 'shares', count: 1 }, points: 10 },
  { id: 'first-like', name: 'Heartbreaker', description: 'Like your first event', icon: '💕', category: 'getting-started', requirement: { type: 'likes', count: 1 }, points: 5 },
  
  // App Engagement Badges
  { id: 'daily-3', name: 'Getting Started', description: 'Open the app 3 days', icon: '📱', category: 'engagement', requirement: { type: 'days-active', count: 3 }, points: 15 },
  { id: 'daily-7', name: 'Weekly Regular', description: 'Open the app 7 days', icon: '📲', category: 'engagement', requirement: { type: 'days-active', count: 7 }, points: 30 },
  { id: 'daily-30', name: 'Monthly Maven', description: 'Open the app 30 days', icon: '🗓️', category: 'engagement', requirement: { type: 'days-active', count: 30 }, points: 100 },
  { id: 'swipe-25', name: 'Swipe Happy', description: 'Swipe through 25 events', icon: '👆', category: 'engagement', requirement: { type: 'swipes', count: 25 }, points: 20 },
  { id: 'swipe-100', name: 'Event Explorer', description: 'Swipe through 100 events', icon: '🔄', category: 'engagement', requirement: { type: 'swipes', count: 100 }, points: 50 },
  { id: 'swipe-500', name: 'Swipe Master', description: 'Swipe through 500 events', icon: '🌀', category: 'engagement', requirement: { type: 'swipes', count: 500 }, points: 150 },
  { id: 'likes-10', name: 'Picky Picker', description: 'Like 10 events', icon: '💝', category: 'engagement', requirement: { type: 'likes', count: 10 }, points: 25 },
  { id: 'likes-50', name: 'Event Enthusiast', description: 'Like 50 events', icon: '❤️‍🔥', category: 'engagement', requirement: { type: 'likes', count: 50 }, points: 75 },
  
  // Check-in Milestone Badges
  { id: 'checkin-5', name: 'Regular', description: 'Check in to 5 events', icon: '🎯', category: 'milestones', requirement: { type: 'checkins', count: 5 }, points: 25 },
  { id: 'checkin-10', name: 'Local Legend', description: 'Check in to 10 events', icon: '⭐', category: 'milestones', requirement: { type: 'checkins', count: 10 }, points: 50 },
  { id: 'checkin-25', name: 'Dallas Veteran', description: 'Check in to 25 events', icon: '🏆', category: 'milestones', requirement: { type: 'checkins', count: 25 }, points: 100 },
  { id: 'checkin-50', name: 'Nightlife Pro', description: 'Check in to 50 events', icon: '💎', category: 'milestones', requirement: { type: 'checkins', count: 50 }, points: 200 },
  { id: 'checkin-100', name: 'Dallas Royalty', description: 'Check in to 100 events', icon: '👸', category: 'milestones', requirement: { type: 'checkins', count: 100 }, points: 500 },
  
  // Streak Badges
  { id: 'streak-3', name: 'Hot Streak', description: 'Use the app 3 days in a row', icon: '🔥', category: 'streaks', requirement: { type: 'streak', count: 3 }, points: 30 },
  { id: 'streak-7', name: 'Week Warrior', description: 'Use the app 7 days in a row', icon: '⚡', category: 'streaks', requirement: { type: 'streak', count: 7 }, points: 75 },
  { id: 'streak-14', name: 'Unstoppable', description: 'Use the app 14 days in a row', icon: '🚀', category: 'streaks', requirement: { type: 'streak', count: 14 }, points: 150 },
  { id: 'streak-30', name: 'Month of Madness', description: 'Use the app 30 days in a row', icon: '🌟', category: 'streaks', requirement: { type: 'streak', count: 30 }, points: 300 },
  
  // Weekend Check-in Streaks
  { id: 'weekend-streak-2', name: 'Weekend Regular', description: 'Check in 2 weekends in a row', icon: '🎊', category: 'streaks', requirement: { type: 'weekend-streak', count: 2 }, points: 40 },
  { id: 'weekend-streak-4', name: 'Month of Weekends', description: 'Check in 4 weekends in a row', icon: '🔥', category: 'streaks', requirement: { type: 'weekend-streak', count: 4 }, points: 100 },
  { id: 'weekend-streak-8', name: 'Two Month Terror', description: 'Check in 8 weekends in a row', icon: '💪', category: 'streaks', requirement: { type: 'weekend-streak', count: 8 }, points: 250 },
  { id: 'weekend-streak-12', name: 'Quarter Champion', description: 'Check in 12 weekends in a row', icon: '👑', category: 'streaks', requirement: { type: 'weekend-streak', count: 12 }, points: 500 },
  
  // Monthly Goals
  { id: 'monthly-venues-4', name: 'Explorer', description: 'Visit 4 different venues this month', icon: '🧭', category: 'monthly', requirement: { type: 'monthly-venues', count: 4 }, points: 50 },
  { id: 'monthly-venues-8', name: 'Adventurer', description: 'Visit 8 different venues this month', icon: '🗺️', category: 'monthly', requirement: { type: 'monthly-venues', count: 8 }, points: 100 },
  { id: 'monthly-checkins-6', name: 'Active Month', description: 'Check in to 6 events this month', icon: '📅', category: 'monthly', requirement: { type: 'monthly-checkins', count: 6 }, points: 75 },
  { id: 'monthly-checkins-12', name: 'Party Animal', description: 'Check in to 12 events this month', icon: '🎉', category: 'monthly', requirement: { type: 'monthly-checkins', count: 12 }, points: 200 },
  
  // Event Type Badges
  { id: 'karaoke-king', name: 'Karaoke King', description: 'Check in to 3 karaoke nights', icon: '🎤', category: 'event-types', requirement: { type: 'category-checkins', category: 'karaoke', count: 3 }, points: 40 },
  { id: 'trivia-master', name: 'Trivia Master', description: 'Check in to 3 trivia nights', icon: '🧠', category: 'event-types', requirement: { type: 'category-checkins', category: 'trivia', count: 3 }, points: 40 },
  { id: 'live-music-lover', name: 'Music Lover', description: 'Check in to 5 live music events', icon: '🎸', category: 'event-types', requirement: { type: 'category-checkins', category: 'live-music', count: 5 }, points: 50 },
  { id: 'happy-hour-hero', name: 'Happy Hour Hero', description: 'Check in to 5 happy hours', icon: '🍻', category: 'event-types', requirement: { type: 'category-checkins', category: 'happy-hour', count: 5 }, points: 50 },
  { id: 'rooftop-regular', name: 'Rooftop Regular', description: 'Check in to 3 rooftop events', icon: '🌆', category: 'event-types', requirement: { type: 'category-checkins', category: 'rooftop', count: 3 }, points: 40 },
  { id: 'dance-machine', name: 'Dance Machine', description: 'Check in to 5 dancing events', icon: '💃', category: 'event-types', requirement: { type: 'category-checkins', category: 'dancing', count: 5 }, points: 50 },
  { id: 'sports-fanatic', name: 'Sports Fanatic', description: 'Check in to 5 sports bar events', icon: '🏈', category: 'event-types', requirement: { type: 'category-checkins', category: 'sports-bars', count: 5 }, points: 50 },
  { id: 'foodie-explorer', name: 'Foodie Explorer', description: 'Check in to 5 foodie events', icon: '🍽️', category: 'event-types', requirement: { type: 'category-checkins', category: 'foodie', count: 5 }, points: 50 },
  { id: 'comedy-fan', name: 'Comedy Fan', description: 'Check in to 3 comedy shows', icon: '😂', category: 'event-types', requirement: { type: 'category-checkins', category: 'comedy', count: 3 }, points: 40 },
  { id: 'concert-goer', name: 'Concert Goer', description: 'Check in to 5 concerts', icon: '🎵', category: 'event-types', requirement: { type: 'category-checkins', category: 'concerts', count: 5 }, points: 50 },
  
  // Social Badges
  { id: 'social-butterfly', name: 'Social Butterfly', description: 'Join 5 different squads', icon: '🦋', category: 'social', requirement: { type: 'squads-joined', count: 5 }, points: 60 },
  { id: 'crew-builder', name: 'Crew Builder', description: 'Create 3 squads', icon: '🏗️', category: 'social', requirement: { type: 'squads-created', count: 3 }, points: 50 },
  { id: 'solo-adventurer', name: 'Solo Adventurer', description: 'Check in solo to 5 events', icon: '🎒', category: 'social', requirement: { type: 'solo-checkins', count: 5 }, points: 40 },
  { id: 'open-to-all', name: 'Open to All', description: 'Create a solo-friendly squad', icon: '🤝', category: 'social', requirement: { type: 'solo-squad-created' }, points: 25 },
  { id: 'friend-magnet', name: 'Friend Magnet', description: 'Have 10 people join your squads', icon: '🧲', category: 'social', requirement: { type: 'squad-members-total', count: 10 }, points: 75 },
  
  // Time-based Badges
  { id: 'early-bird', name: 'Early Bird', description: 'Check in to 3 brunch/morning events', icon: '🌅', category: 'time-based', requirement: { type: 'time-checkins', time: 'morning', count: 3 }, points: 35 },
  { id: 'night-owl', name: 'Night Owl', description: 'Check in after 11 PM 5 times', icon: '🦉', category: 'time-based', requirement: { type: 'time-checkins', time: 'late-night', count: 5 }, points: 45 },
  { id: 'weekend-warrior', name: 'Weekend Warrior', description: 'Check in on 10 weekends', icon: '🎉', category: 'time-based', requirement: { type: 'weekend-checkins', count: 10 }, points: 60 },
  
  // Neighborhood Explorer Badges
  { id: 'deep-ellum-regular', name: 'Deep Ellum Regular', description: 'Check in to 5 Deep Ellum events', icon: '🎨', category: 'neighborhoods', requirement: { type: 'neighborhood-checkins', neighborhood: 'Deep Ellum', count: 5 }, points: 45 },
  { id: 'uptown-explorer', name: 'Uptown Explorer', description: 'Check in to 5 Uptown events', icon: '🏙️', category: 'neighborhoods', requirement: { type: 'neighborhood-checkins', neighborhood: 'Uptown', count: 5 }, points: 45 },
  { id: 'bishop-arts-lover', name: 'Bishop Arts Lover', description: 'Check in to 5 Bishop Arts events', icon: '🎭', category: 'neighborhoods', requirement: { type: 'neighborhood-checkins', neighborhood: 'Bishop Arts', count: 5 }, points: 45 },
  { id: 'downtown-dweller', name: 'Downtown Dweller', description: 'Check in to 5 Downtown events', icon: '🌃', category: 'neighborhoods', requirement: { type: 'neighborhood-checkins', neighborhood: 'Downtown', count: 5 }, points: 45 },
  { id: 'neighborhood-hopper', name: 'Neighborhood Hopper', description: 'Check in to events in 5 different neighborhoods', icon: '🗺️', category: 'neighborhoods', requirement: { type: 'unique-neighborhoods', count: 5 }, points: 75 },
  
  // Special Badges
  { id: 'trendsetter', name: 'Trendsetter', description: 'Be first to check in to a new event', icon: '🌟', category: 'special', requirement: { type: 'first-checkin' }, points: 50 },
  { id: 'variety-seeker', name: 'Variety Seeker', description: 'Check in to 8 different event categories', icon: '🎲', category: 'special', requirement: { type: 'unique-categories', count: 8 }, points: 80 },
  { id: 'event-suggester', name: 'Event Suggester', description: 'Suggest an event that gets added', icon: '💡', category: 'special', requirement: { type: 'suggestion-approved' }, points: 100 },
  
  // Ultimate Badge - Key to the City
  { id: 'key-to-city', name: 'Key to the City', description: 'Earn 25 badges to unlock the ultimate Dallas award', icon: '🔑', category: 'ultimate', requirement: { type: 'badges-earned', count: 25 }, points: 1000, isUltimate: true }
];

const BADGE_CATEGORIES = [
  { id: 'getting-started', name: 'Getting Started', icon: '🚀' },
  { id: 'engagement', name: 'Engagement', icon: '📱' },
  { id: 'milestones', name: 'Milestones', icon: '🏆' },
  { id: 'streaks', name: 'Streaks', icon: '🔥' },
  { id: 'event-types', name: 'Event Types', icon: '🎭' },
  { id: 'social', name: 'Social', icon: '👥' },
  { id: 'time-based', name: 'Time Based', icon: '⏰' },
  { id: 'neighborhoods', name: 'Neighborhoods', icon: '📍' },
  { id: 'special', name: 'Special', icon: '✨' },
  { id: 'ultimate', name: 'Ultimate', icon: '🔑' }
];

// Gender options for profile and squad restrictions
const GENDER_OPTIONS = [
  { id: 'woman', label: 'Woman' },
  { id: 'man', label: 'Man' },
  { id: 'prefer-not-to-say', label: 'Prefer not to say' }
];

// Patch 4 — Relationship status (5 options per spec, default prefer-not-to-say)
const RELATIONSHIP_OPTIONS = [
  { id: 'prefer-not-to-say', label: 'Prefer not to say', icon: '🤐' },
  { id: 'single',            label: 'Single',            icon: '💫' },
  { id: 'in-relationship',   label: 'In a relationship', icon: '💑' },
  { id: 'engaged',           label: 'Engaged',           icon: '💍' },
  { id: 'married',           label: 'Married',           icon: '💞' },
];

// Patch 6 — ToS / Privacy versioning (bump these when content changes to re-prompt)
const TOS_VERSION = '1.0';
const TOS_LAST_UPDATED = 'April 28, 2026';

// Patch 3 — Feed visibility constants
const FEED_DAYS_AHEAD = 7;          // hard filter: events within this many days
const COMING_UP_DAYS_MIN = 7;       // "Coming Up" lane lower bound (days out)
const COMING_UP_DAYS_MAX = 30;      // "Coming Up" lane upper bound
// Patch B.2 — Daily cap removed. Feed shows all events that pass hard filters.
const DEFAULT_FEED_DISTANCE_MILES = 25; // default discover radius

// Patch 5 — User submission gate
const MIN_BADGES_TO_SUBMIT = 3;

// Patch B — Display city. Static for now; designed to swap to a per-user value when expanding to other cities.
const DISPLAY_CITY = 'Dallas, Texas';

// Patch B.2 — Minimum time on screen before logging a view (filters out fast scroll-bys)
const FEED_CARD_VIEW_MS_MIN = 1500;

// Patch B — Resolve solo-friendliness. Order: explicit DB column → date_night signal → category heuristic.
// Returns true (solo OK), false (not solo), or null (unknown — treat as ok in lenient mode).
const resolveSoloFriendly = (event) => {
  // Admin override (column may not exist on older rows — null is treated as "use heuristic")
  if (event.solo_friendly === true) return true;
  if (event.solo_friendly === false) return false;
  
  // Explicit not-solo signals
  if (event.date_night === true) return false;
  if (event.age_tag === 'date-night') return false;
  if (event.kid_friendly === true) return false; // assume kid-friendly = brought-a-kid context, not solo
  
  // Category-based heuristic
  const cat = (event.category || '').toLowerCase();
  const NOT_SOLO_CATEGORIES = new Set([
    'date-night', 'romantic', 'couples',
    'family', 'kids', 'kid-friendly',
    'birthday', 'private-party'
  ]);
  if (NOT_SOLO_CATEGORIES.has(cat)) return false;
  
  // Tag-based heuristic
  const tags = Array.isArray(event.tags) ? event.tags : (Array.isArray(event.vibes) ? event.vibes : []);
  const NOT_SOLO_TAGS = new Set(['date-night', 'romantic', 'couples-only', 'private']);
  if (tags.some(t => NOT_SOLO_TAGS.has((t || '').toLowerCase()))) return false;
  
  // Default to solo-friendly — most public events work for solo attendees
  return true;
};

// Patch B — Search helper. Case-insensitive substring across the obvious fields.
const matchesSearch = (event, query) => {
  if (!query) return true;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    event.name, event.venue, event.neighborhood,
    event.category, event.type, event.description,
    ...(Array.isArray(event.tags) ? event.tags : [])
  ].filter(Boolean).map(s => String(s).toLowerCase()).join(' | ');
  return haystack.includes(q);
};

// Patch B — Categories for the browse chip row. Picks the most common ones from the spec.
const BROWSE_CATEGORIES = [
  { id: 'all',         label: 'All' },
  { id: 'live-music',  label: '🎵 Live Music' },
  { id: 'happy-hour',  label: '🍻 Happy Hour' },
  { id: 'trivia',      label: '🧠 Trivia' },
  { id: 'karaoke',     label: '🎤 Karaoke' },
  { id: 'comedy',      label: '😂 Comedy' },
  { id: 'sports',      label: '🏈 Sports' },
  { id: 'food',        label: '🍽️ Food' },
  { id: 'nightlife',   label: '🪩 Nightlife' },
  { id: 'creative',    label: '🎨 Creative' },
  { id: 'community',   label: '👥 Community' },
];


// Patch A — Stock image library, ~120 curated images organized by category.
// Diverse along: people (race/age/body type/gender), event types (nightlife + daytime + niche),
// and venue contexts (bars, restaurants, parks, galleries, studios, community spaces).
// Used by: admin event creator, business portal event creator, user submission modal.
const STOCK_IMAGE_CATEGORIES = [
  {
    id: 'live-music',
    label: 'Live Music',
    icon: '🎵',
    images: [
      { label: 'Live band',         url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800' },
      { label: 'Concert crowd',     url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800' },
      { label: 'Jazz club',         url: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800' },
      { label: 'Piano bar',         url: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=800' },
      { label: 'Acoustic set',      url: 'https://images.unsplash.com/photo-1499415479124-43c32433a620?w=800' },
      { label: 'Open mic',          url: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800' },
      { label: 'DJ set',            url: 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=800' },
      { label: 'Outdoor concert',   url: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800' },
      { label: 'Singer-songwriter', url: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800' },
      { label: 'Hip-hop show',      url: 'https://images.unsplash.com/photo-1574391884720-bbc049ec09ad?w=800' },
    ]
  },
  {
    id: 'bars-drinks',
    label: 'Bars & Drinks',
    icon: '🍻',
    images: [
      { label: 'Happy hour',     url: 'https://images.unsplash.com/photo-1575037614876-c38a4d44f5b8?w=800' },
      { label: 'Cocktails',      url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800' },
      { label: 'Wine bar',       url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800' },
      { label: 'Whiskey flight', url: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=800' },
      { label: 'Craft beer',     url: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=800' },
      { label: 'Bar scene',      url: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800' },
      { label: 'Tequila tasting',url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800' },
      { label: 'Mezcal bar',     url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800' },
      { label: 'Beer garden',    url: 'https://images.unsplash.com/photo-1538488881038-e252a119ace7?w=800' },
      { label: 'Speakeasy',      url: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800' },
      { label: 'Tiki bar',       url: 'https://images.unsplash.com/photo-1546171753-97d7676e4602?w=800' },
      { label: 'Wine tasting',   url: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800' },
    ]
  },
  {
    id: 'nightlife',
    label: 'Nightlife',
    icon: '🪩',
    images: [
      { label: 'DJ booth',     url: 'https://images.unsplash.com/photo-1598387993281-cecf8b71a8f8?w=800' },
      { label: 'Club lights',  url: 'https://images.unsplash.com/photo-1504680177321-2e6a879aac86?w=800' },
      { label: 'Disco ball',   url: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800' },
      { label: 'Dance floor',  url: 'https://images.unsplash.com/photo-1581974944026-5d6ed762f617?w=800' },
      { label: 'Latin night',  url: 'https://images.unsplash.com/photo-1535525153412-5a42439a210d?w=800' },
      { label: 'Salsa dancing',url: 'https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=800' },
      { label: 'Drag show',    url: 'https://images.unsplash.com/photo-1626124619495-c5664a6116a6?w=800' },
      { label: 'Late night',   url: 'https://images.unsplash.com/photo-1516802273409-68526ee1bdd6?w=800' },
      { label: 'Neon vibes',   url: 'https://images.unsplash.com/photo-1557787163-1635e2efb160?w=800' },
      { label: 'Lit venue',    url: 'https://images.unsplash.com/photo-1578736641330-3155e606cd40?w=800' },
    ]
  },
  {
    id: 'food-dining',
    label: 'Food & Dining',
    icon: '🍽️',
    images: [
      { label: 'Brunch',          url: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=800' },
      { label: 'Tacos',           url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800' },
      { label: 'Pizza',           url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800' },
      { label: 'Burgers',         url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800' },
      { label: 'BBQ',             url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800' },
      { label: 'Sushi',           url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800' },
      { label: 'Tasting menu',    url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800' },
      { label: 'Food hall',       url: 'https://images.unsplash.com/photo-1533777324565-a040eb52facd?w=800' },
      { label: 'Pop-up dinner',   url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800' },
      { label: 'Vegan / plant',   url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800' },
      { label: 'Coffee shop',     url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800' },
      { label: 'Bakery',          url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800' },
    ]
  },
  {
    id: 'games-entertainment',
    label: 'Games & Entertainment',
    icon: '🎲',
    images: [
      { label: 'Trivia night',     url: 'https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=800' },
      { label: 'Karaoke',          url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800' },
      { label: 'Comedy show',      url: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=800' },
      { label: 'Board game night', url: 'https://images.unsplash.com/photo-1611371805429-8b5c1b2c34ba?w=800' },
      { label: 'Pool / billiards', url: 'https://images.unsplash.com/photo-1585314540237-13cb52440d96?w=800' },
      { label: 'Bingo',            url: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=800' },
      { label: 'Arcade',           url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800' },
      { label: 'Bowling',          url: 'https://images.unsplash.com/photo-1538511503723-f7c6e4a01dcc?w=800' },
      { label: 'Video games',      url: 'https://images.unsplash.com/photo-1580327344181-c1163234e5a0?w=800' },
      { label: 'Magic show',       url: 'https://images.unsplash.com/photo-1500627964684-141351970a7f?w=800' },
    ]
  },
  {
    id: 'creative-arts',
    label: 'Creative & Arts',
    icon: '🎨',
    images: [
      { label: 'Paint and sip',   url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800' },
      { label: 'Pottery class',   url: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800' },
      { label: 'Art gallery',     url: 'https://images.unsplash.com/photo-1577720580479-7d839d829c73?w=800' },
      { label: 'Gallery opening', url: 'https://images.unsplash.com/photo-1605429523419-d828abe425a8?w=800' },
      { label: 'Craft workshop',  url: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=800' },
      { label: 'Photography',     url: 'https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?w=800' },
      { label: 'Film screening',  url: 'https://images.unsplash.com/photo-1489599735184-3f1f1e0f8e9e?w=800' },
      { label: 'Theater',         url: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800' },
      { label: 'Dance class',     url: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=800' },
      { label: 'Music workshop',  url: 'https://images.unsplash.com/photo-1485579149621-3123dd979885?w=800' },
    ]
  },
  {
    id: 'community-social',
    label: 'Community & Social',
    icon: '👥',
    images: [
      { label: 'Book club',       url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800' },
      { label: 'Run club',        url: 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800' },
      { label: 'Cycling group',   url: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800' },
      { label: 'Yoga class',      url: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800' },
      { label: 'Meditation',      url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800' },
      { label: 'Networking',      url: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800' },
      { label: 'Language meetup', url: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800' },
      { label: 'Volunteer event', url: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800' },
      { label: 'Knitting circle', url: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=800' },
      { label: 'Group fitness',   url: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800' },
    ]
  },
  {
    id: 'sports-watching',
    label: 'Sports & Watch Parties',
    icon: '🏈',
    images: [
      { label: 'Sports bar',     url: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=800' },
      { label: 'Watch party',    url: 'https://images.unsplash.com/photo-1577471488278-16eec37ffcc2?w=800' },
      { label: 'Football',       url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800' },
      { label: 'Basketball',     url: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800' },
      { label: 'Baseball',       url: 'https://images.unsplash.com/photo-1508344928928-7165b67de128?w=800' },
      { label: 'Hockey',         url: 'https://images.unsplash.com/photo-1515703407324-5f753afd8be8?w=800' },
      { label: 'UFC / boxing',   url: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800' },
      { label: 'Tailgate',       url: 'https://images.unsplash.com/photo-1543351611-58f69d7c1781?w=800' },
    ]
  },
  {
    id: 'venues-spaces',
    label: 'Venue Types',
    icon: '🌆',
    images: [
      { label: 'Rooftop',          url: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800' },
      { label: 'Skyline view',     url: 'https://images.unsplash.com/photo-1470219556762-1771e7f9427d?w=800' },
      { label: 'Patio',            url: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800' },
      { label: 'Lounge',           url: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=800' },
      { label: 'Park / outdoor',   url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800' },
      { label: 'Warehouse space',  url: 'https://images.unsplash.com/photo-1572177812156-58036aae439c?w=800' },
      { label: 'Backyard / lawn',  url: 'https://images.unsplash.com/photo-1532635241-17e820acc59f?w=800' },
      { label: 'Brewery',          url: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=800' },
      { label: 'Distillery',       url: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=800' },
      { label: 'Pool / poolside',  url: 'https://images.unsplash.com/photo-1505816014357-96b5ff457e9a?w=800' },
    ]
  },
  {
    id: 'celebration',
    label: 'Celebration & Special',
    icon: '🎉',
    images: [
      { label: 'Party',         url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800' },
      { label: 'Celebration',   url: 'https://images.unsplash.com/photo-1496843916299-590492c751f4?w=800' },
      { label: 'Birthday',      url: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800' },
      { label: 'Holiday party', url: 'https://images.unsplash.com/photo-1543589077-47d81606c1bf?w=800' },
      { label: 'Festival',      url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800' },
      { label: 'Pride event',   url: 'https://images.unsplash.com/photo-1563346116-23e0a5b30dc4?w=800' },
      { label: 'NYE',           url: 'https://images.unsplash.com/photo-1546271876-af6caec5fae4?w=800' },
      { label: 'Halloween',     url: 'https://images.unsplash.com/photo-1509557965875-b88c97052f0e?w=800' },
    ]
  },
  {
    id: 'family-daytime',
    label: 'Family & Daytime',
    icon: '👨‍👩‍👧',
    images: [
      { label: 'Farmers market',  url: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800' },
      { label: 'Family event',    url: 'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=800' },
      { label: 'Kids activity',   url: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800' },
      { label: 'Outdoor festival',url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800' },
      { label: 'Picnic',          url: 'https://images.unsplash.com/photo-1526401485004-46910ecc8e51?w=800' },
      { label: 'Pet-friendly',    url: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800' },
      { label: 'Storytime',       url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800' },
      { label: 'Cooking class',   url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800' },
    ]
  },
  {
    id: 'date-romantic',
    label: 'Date Night',
    icon: '💕',
    images: [
      { label: 'Romantic dinner', url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800' },
      { label: 'Couple dancing',  url: 'https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=800' },
      { label: 'Wine for two',    url: 'https://images.unsplash.com/photo-1510627489930-0c1b0bfb6785?w=800' },
      { label: 'Sunset patio',    url: 'https://images.unsplash.com/photo-1501426026826-31c667bdf23d?w=800' },
      { label: 'Candlelit',       url: 'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800' },
      { label: 'Couple cooking',  url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800' },
    ]
  }
];

// Flat list for legacy/fallback consumers
const STOCK_IMAGE_FLAT = STOCK_IMAGE_CATEGORIES.flatMap(cat => cat.images);


// Life stage options
const LIFE_STAGE_OPTIONS = [
  { id: 'single', label: 'Single', icon: '💫' },
  { id: 'in-relationship', label: 'In a relationship', icon: '💑' },
  { id: 'married', label: 'Married', icon: '💍' },
  { id: 'parent', label: 'Parent', icon: '👶' },
  { id: 'expecting', label: 'Expecting', icon: '🤰' },
  { id: 'empty-nester', label: 'Empty nester', icon: '🏠' }
];

// Squad restriction presets
const SQUAD_GENDER_OPTIONS = [
  { id: 'all', label: 'Everyone welcome', icon: '👥' },
  { id: 'women-only', label: 'Women only', icon: '👩' },
  { id: 'men-only', label: 'Men only', icon: '👨' }
];

// Rejection reasons (preset, no free text)
const REJECTION_REASONS = [
  { id: 'squad-full', label: 'Squad is at capacity right now' },
  { id: 'plans-changed', label: 'Our plans have changed' },
  { id: 'private-group', label: 'Keeping it to close friends this time' },
  { id: 'timing', label: 'Timing didn\'t work out' }
];

// Intent options for onboarding (What are you here for?)
const INTENT_OPTIONS = [
  { id: 'find-spots', label: 'Find new spots', icon: '🍻', description: 'Discover bars, restaurants & venues' },
  { id: 'meet-people', label: 'Meet new people', icon: '👯', description: 'Connect with others who share my vibe' },
  { id: 'plan-nights', label: 'Plan nights out', icon: '📅', description: 'Organize outings with friends & crew' },
  { id: 'stay-informed', label: 'Stay in the loop', icon: '🎉', description: 'Know what\'s happening in Dallas' },
  { id: 'go-solo', label: 'Go out solo', icon: '🙋', description: 'Find events welcoming to solo attendees' },
  { id: 'new-to-dallas', label: 'I\'m new to Dallas', icon: '🆕', description: 'Get to know the city\'s nightlife' },
  { id: 'date-night', label: 'Date night ideas', icon: '💑', description: 'Find romantic or fun spots for couples' }
];

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

// Ambience options for events
const AMBIENCE_OPTIONS = [
  { id: 'chill', label: 'Chill', icon: '😌', color: 'bg-blue-500' },
  { id: 'energetic', label: 'Energetic', icon: '⚡', color: 'bg-yellow-500' },
  { id: 'loud', label: 'Loud', icon: '🔊', color: 'bg-red-500' },
  { id: 'intimate', label: 'Intimate', icon: '🕯️', color: 'bg-purple-500' },
  { id: 'lively', label: 'Lively', icon: '🎉', color: 'bg-orange-500' },
  { id: 'relaxed', label: 'Relaxed', icon: '🌿', color: 'bg-green-500' },
  { id: 'upscale', label: 'Upscale', icon: '✨', color: 'bg-amber-500' },
  { id: 'casual', label: 'Casual', icon: '👋', color: 'bg-teal-500' }
];

const BIO_QUESTIONS = [
  { id: 'cowboys', question: "Do you go to sports bars to watch Cowboys games?", tag: 'Cowboys fan' },
  { id: 'rooftops', question: "Do you love rooftop bars when it's nice out?", tag: 'rooftop lover' },
  { id: 'new-restaurants', question: "Are you down to hit up a new restaurant every month?", tag: 'foodie explorer' },
  { id: 'drinks-weekly', question: "Do you go out for drinks at least twice a week?", tag: 'regular' },
  { id: 'dive-bars', question: "Do you enjoy dive bars with a real local vibe?", tag: 'dive bar enthusiast' },
  { id: 'happy-hour', question: "Are you into happy hour deals most weeks?", tag: 'happy hour hunter' },
  { id: 'live-music-dj', question: "Do you like bars with live music or DJs on weekends?", tag: 'music lover' },
  { id: 'breweries', question: "Do you go to breweries that have big patios?", tag: 'brewery hopper' },
  { id: 'brunch', question: "Are you someone who loves bottomless brunch/mimosas?", tag: 'brunch enthusiast' },
  { id: 'ufc', question: "Do you hit up bars to watch UFC or big fights?", tag: 'fight night fan' },
  { id: 'cocktails', question: "Do you prefer cocktail bars over beer-and-shot spots?", tag: 'cocktail connoisseur' },
  { id: 'solo', question: "Are you open to going to bars alone sometimes?", tag: 'solo adventurer' },
  { id: 'patios', question: "Do you love patios year-round (even when it's chilly)?", tag: 'patio person' },
  { id: 'try-food', question: "Do you go to restaurants mainly to try new food?", tag: 'culinary curious' },
  { id: 'speakeasy', question: "Are you into speakeasy or hidden-bar vibes?", tag: 'speakeasy seeker' },
  { id: 'trivia', question: "Do you attend trivia nights at bars regularly?", tag: 'trivia buff' },
  { id: 'dog-friendly', question: "Do you like dog-friendly patios or beer gardens?", tag: 'dog-friendly fan' },
  { id: 'late-night', question: "Do you go out for late-night eats after the bars close?", tag: 'late-night snacker' },
  { id: 'group-hangs', question: "Are you down for group hangs at places with big tables?", tag: 'group hangout person' },
  { id: 'soccer', question: "Do you enjoy watching soccer (Premier League, MLS, etc.) at bars?", tag: 'soccer fan' },
  { id: 'lively', question: "Do you like places that get lively after 10 PM?", tag: 'night owl' },
  { id: 'craft-beer', question: "Are you into craft beer spots or taprooms?", tag: 'craft beer lover' },
  { id: 'comedy', question: "Do you go to comedy nights or open mics at bars?", tag: 'comedy fan' },
  { id: 'cocktail-menu', question: "Do you love restaurants with killer cocktail menus?", tag: 'cocktail menu hunter' },
  { id: 'favorites', question: "Are you someone who returns to the same few favorite spots over and over?", tag: 'loyal regular' }
];

const generateBioFromAnswers = (answers, userName) => {
  const yesAnswers = Object.entries(answers).filter(([_, value]) => value === true);
  const tags = yesAnswers.map(([id]) => BIO_QUESTIONS.find(q => q.id === id)?.tag).filter(Boolean);
  
  // Varied opening phrases for new users (first person)
  const newUserOpenings = [
    `I'm new to the Dallas nightlife scene and ready to explore!`,
    `Just landed in Dallas and ready to discover the best spots!`,
    `I'm here to find my new favorite Dallas hangouts!`,
    `Fresh to the Dallas scene, I'm eager to explore what the city has to offer!`
  ];
  
  if (tags.length === 0) {
    return newUserOpenings[Math.floor(Math.random() * newUserOpenings.length)];
  }
  
  // Group similar interests
  const sports = tags.filter(t => ['Cowboys fan', 'fight night fan', 'soccer fan'].includes(t));
  const drinks = tags.filter(t => ['cocktail connoisseur', 'craft beer lover', 'happy hour hunter', 'cocktail menu hunter'].includes(t));
  const food = tags.filter(t => ['foodie explorer', 'culinary curious', 'late-night snacker', 'brunch enthusiast'].includes(t));
  const vibes = tags.filter(t => ['rooftop lover', 'dive bar enthusiast', 'speakeasy seeker', 'patio person', 'brewery hopper'].includes(t));
  const social = tags.filter(t => ['solo adventurer', 'group hangout person', 'loyal regular', 'regular'].includes(t));
  const entertainment = tags.filter(t => ['music lover', 'trivia buff', 'comedy fan', 'night owl'].includes(t));
  const lifestyle = tags.filter(t => ['dog-friendly fan'].includes(t));

  let bio = '';
  
  // Varied openings based on traits (first person)
  const regularOpenings = [
    `I'm a Dallas nightlife regular who's always down for a good time. `,
    `I know the Dallas scene inside and out. `,
    `A true Dallas local – I'm always in the know about what's happening. `
  ];
  
  const soloOpenings = [
    `I'm not afraid to explore Dallas solo and love meeting new people. `,
    `I embrace solo adventures and am always up for making new connections. `,
    `Flying solo doesn't faze me – I'm here to explore and connect. `
  ];
  
  const generalOpenings = [
    `I love exploring what Dallas has to offer. `,
    `I'm all about discovering Dallas's best kept secrets. `,
    `I bring good energy wherever I go in Dallas. `,
    `Always up for something new – I'm exploring the Dallas scene. `
  ];
  
  // Opening
  if (social.includes('regular')) {
    bio = regularOpenings[Math.floor(Math.random() * regularOpenings.length)];
  } else if (social.includes('solo adventurer')) {
    bio = soloOpenings[Math.floor(Math.random() * soloOpenings.length)];
  } else {
    bio = generalOpenings[Math.floor(Math.random() * generalOpenings.length)];
  }

  // Drinks preference with variety (first person)
  if (drinks.length > 0) {
    const cocktailPhrases = [
      "Craft cocktails are definitely my thing. ",
      "A well-made cocktail is my love language. ",
      "I appreciate a bar with a solid cocktail program. "
    ];
    const beerPhrases = [
      "You'll find me checking out the latest craft beer spots. ",
      "Craft beer is my go-to. ",
      "I'm always on the hunt for new breweries and taprooms. "
    ];
    const hhPhrases = [
      "I know all the best happy hour deals in town. ",
      "Happy hour? I've got the inside scoop on every deal. ",
      "Never paying full price – I know every happy hour in Dallas. "
    ];
    
    if (drinks.includes('cocktail connoisseur') || drinks.includes('cocktail menu hunter')) {
      bio += cocktailPhrases[Math.floor(Math.random() * cocktailPhrases.length)];
    } else if (drinks.includes('craft beer lover')) {
      bio += beerPhrases[Math.floor(Math.random() * beerPhrases.length)];
    } else if (drinks.includes('happy hour hunter')) {
      bio += hhPhrases[Math.floor(Math.random() * hhPhrases.length)];
    }
  }

  // Venue vibes (first person)
  if (vibes.length > 0) {
    const vibeList = [];
    if (vibes.includes('rooftop lover')) vibeList.push('rooftops');
    if (vibes.includes('patio person')) vibeList.push('patios');
    if (vibes.includes('dive bar enthusiast')) vibeList.push('dive bars');
    if (vibes.includes('speakeasy seeker')) vibeList.push('speakeasies');
    if (vibes.includes('brewery hopper')) vibeList.push('breweries');
    
    if (vibeList.length > 0) {
      const vibePhrases = [
        `I'm drawn to ${vibeList.slice(0, 2).join(' and ')}. `,
        `${vibeList.slice(0, 2).join(' and ').charAt(0).toUpperCase() + vibeList.slice(0, 2).join(' and ').slice(1)} are my scene. `,
        `You'll often catch me at ${vibeList.slice(0, 2).join(' or ')}. `
      ];
      bio += vibePhrases[Math.floor(Math.random() * vibePhrases.length)];
    }
  }

  // Sports with variety (first person)
  if (sports.length > 0) {
    const cowboysPhrases = [
      "Game days mean finding the perfect sports bar for Cowboys action. ",
      "Sundays are for Cowboys games at the best sports bars. ",
      "How 'bout them Cowboys? I'm always watching. "
    ];
    const ufcPhrases = [
      "I never miss a big UFC fight night. ",
      "Fight nights are a must – I'm always locked in for UFC. ",
      "Big fights mean big nights out for me. "
    ];
    const soccerPhrases = [
      "Early mornings for Premier League? Count me in. ",
      "Soccer fans unite – I'm watching every match. ",
      "Whether it's MLS or Premier League, I'm there for it. "
    ];
    
    if (sports.includes('Cowboys fan')) {
      bio += cowboysPhrases[Math.floor(Math.random() * cowboysPhrases.length)];
    } else if (sports.includes('fight night fan')) {
      bio += ufcPhrases[Math.floor(Math.random() * ufcPhrases.length)];
    } else if (sports.includes('soccer fan')) {
      bio += soccerPhrases[Math.floor(Math.random() * soccerPhrases.length)];
    }
  }

  // Food with variety (first person)
  if (food.length > 0) {
    const foodiePhrases = [
      "Always hunting for the next great restaurant to try. ",
      "Food is an adventure – I'm always exploring new spots. ",
      "My restaurant list is never-ending (in the best way). "
    ];
    const brunchPhrases = [
      "Weekend brunch is a must. ",
      "Bottomless mimosas? Say less. ",
      "Brunch is a lifestyle, not just a meal. "
    ];
    const lateNightPhrases = [
      "Late-night eats after the bars? Absolutely. ",
      "The night doesn't end until I find good late-night food. ",
      "Post-bar tacos are a requirement. "
    ];
    
    if (food.includes('foodie explorer') || food.includes('culinary curious')) {
      bio += foodiePhrases[Math.floor(Math.random() * foodiePhrases.length)];
    }
    if (food.includes('brunch enthusiast')) {
      bio += brunchPhrases[Math.floor(Math.random() * brunchPhrases.length)];
    }
    if (food.includes('late-night snacker')) {
      bio += lateNightPhrases[Math.floor(Math.random() * lateNightPhrases.length)];
    }
  }

  // Entertainment with variety (first person)
  if (entertainment.length > 0) {
    const musicPhrases = [
      "Live music and DJ nights are my jam. ",
      "If there's a good DJ or live band, I'm there. ",
      "Music is the vibe – live shows are always on my agenda. "
    ];
    const triviaPhrases = [
      "Trivia nights are a weekly tradition. ",
      "I take trivia seriously (in a fun way). ",
      "Quiz night champion in the making. "
    ];
    const comedyPhrases = [
      "Comedy nights and open mics are always on my radar. ",
      "A good laugh is always on the schedule. ",
      "Comedy shows are my thing – the funnier, the better. "
    ];
    const nightOwlPhrases = [
      "The party really starts after 10 PM for me. ",
      "Night owl energy – I come alive when the sun goes down. ",
      "Early nights? Not in my vocabulary. "
    ];
    
    if (entertainment.includes('music lover')) {
      bio += musicPhrases[Math.floor(Math.random() * musicPhrases.length)];
    }
    if (entertainment.includes('trivia buff')) {
      bio += triviaPhrases[Math.floor(Math.random() * triviaPhrases.length)];
    }
    if (entertainment.includes('comedy fan')) {
      bio += comedyPhrases[Math.floor(Math.random() * comedyPhrases.length)];
    }
    if (entertainment.includes('night owl')) {
      bio += nightOwlPhrases[Math.floor(Math.random() * nightOwlPhrases.length)];
    }
  }

  // Lifestyle
  if (lifestyle.includes('dog-friendly fan')) {
    const dogPhrases = [
      "Bonus points if the patio is dog-friendly! ",
      "Dogs welcome? Even better. ",
      "Pup-friendly patios are a major plus. "
    ];
    bio += dogPhrases[Math.floor(Math.random() * dogPhrases.length)];
  }

  // Social style closing (first person)
  const groupClosings = [
    "I love bringing the crew together at spots with big tables.",
    "Squad hangs at spacious spots are my specialty.",
    "Big tables, bigger groups – that's my style."
  ];
  const loyalClosings = [
    "Once I find a spot I love, I keep coming back.",
    "Loyalty runs deep – my favorite spots know me by name.",
    "When I find a gem, I'm a regular for life."
  ];
  
  if (social.includes('group hangout person')) {
    bio += groupClosings[Math.floor(Math.random() * groupClosings.length)];
  } else if (social.includes('loyal regular')) {
    bio += loyalClosings[Math.floor(Math.random() * loyalClosings.length)];
  }

  return bio.trim();
};

function BioBuilderModal({ onClose, onSaveBio, userName, currentAnswers, currentBio = '' }) {
  const [answers, setAnswers] = useState(currentAnswers || {});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedBio, setEditedBio] = useState('');

  const handleAnswer = (answer) => {
    const question = BIO_QUESTIONS[currentQuestionIndex];
    setAnswers({ ...answers, [question.id]: answer });
    
    if (currentQuestionIndex < BIO_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      const generated = generateBioFromAnswers({ ...answers, [question.id]: answer }, userName);
      setEditedBio(generated);
      setShowPreview(true);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const generatedBio = generateBioFromAnswers(answers, userName);
  const progress = ((currentQuestionIndex + 1) / BIO_QUESTIONS.length) * 100;

  // Initialize editedBio when entering preview
  useEffect(() => {
    if (showPreview && !editedBio) {
      setEditedBio(generatedBio);
    }
  }, [showPreview, generatedBio]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {!showPreview ? (
          <>
            {/* Header */}
            <div className="p-6 border-b border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Bio Builder</h2>
                <button onClick={onClose} className="text-zinc-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-zinc-800 rounded-full h-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-zinc-500 text-sm mt-2">
                Question {currentQuestionIndex + 1} of {BIO_QUESTIONS.length}
              </p>
            </div>

            {/* Question */}
            <div className="p-6">
              <p className="text-white text-lg font-medium mb-8 text-center">
                {BIO_QUESTIONS[currentQuestionIndex].question}
              </p>

              {/* Answer buttons */}
              <div className="flex gap-4 mb-6">
                <button
                  onClick={() => handleAnswer(true)}
                  className="flex-1 bg-orange-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-600 transition"
                >
                  👍 Yes
                </button>
                <button
                  onClick={() => handleAnswer(false)}
                  className="flex-1 bg-zinc-800 border-2 border-zinc-700 text-zinc-400 py-4 rounded-xl font-bold text-lg hover:bg-zinc-700 transition"
                >
                  👎 No
                </button>
              </div>

              {/* Back button */}
              {currentQuestionIndex > 0 && (
                <button
                  onClick={handleBack}
                  className="w-full text-zinc-500 hover:text-white transition"
                >
                  ← Back to previous question
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Preview Header */}
            <div className="p-6 border-b border-zinc-800">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  {isEditing ? 'Edit Your Bio' : 'Your Bio Preview'}
                </h2>
                <button onClick={onClose} className="text-zinc-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Bio Preview/Edit */}
            <div className="p-6">
              {isEditing ? (
                <div className="mb-4">
                  <textarea
                    value={editedBio}
                    onChange={(e) => setEditedBio(e.target.value)}
                    className="w-full bg-zinc-800 text-white rounded-xl p-4 min-h-[150px] outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                    placeholder="Write your bio here..."
                  />
                  <p className="text-zinc-500 text-xs mt-2">{editedBio.length} characters</p>
                </div>
              ) : (
                <div className="bg-zinc-800 rounded-xl p-4 mb-4">
                  <p className="text-white leading-relaxed">{editedBio || generatedBio}</p>
                </div>
              )}

              {/* Edit/Delete buttons when not editing */}
              {!isEditing && (
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 bg-zinc-800 text-zinc-300 py-2 rounded-xl font-semibold hover:bg-zinc-700 transition flex items-center justify-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Text
                  </button>
                  <button
                    onClick={() => setEditedBio('')}
                    className="flex-1 bg-red-500 bg-opacity-20 text-red-400 py-2 rounded-xl font-semibold hover:bg-opacity-30 transition flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear Bio
                  </button>
                </div>
              )}

              {/* Done editing button */}
              {isEditing && (
                <button
                  onClick={() => setIsEditing(false)}
                  className="w-full bg-zinc-800 text-zinc-300 py-2 rounded-xl font-semibold hover:bg-zinc-700 transition mb-4"
                >
                  Done Editing
                </button>
              )}

              <div className="space-y-3">
                <button
                  onClick={() => {
                    onSaveBio(editedBio || generatedBio, answers);
                    onClose();
                  }}
                  disabled={!editedBio && !generatedBio}
                  className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold hover:bg-orange-600 transition disabled:opacity-50"
                >
                  {editedBio ? 'Save This Bio' : 'Save Without Bio'}
                </button>
                <button
                  onClick={() => {
                    setCurrentQuestionIndex(0);
                    setAnswers({});
                    setEditedBio('');
                    setShowPreview(false);
                    setIsEditing(false);
                  }}
                  className="w-full bg-zinc-800 text-zinc-300 py-4 rounded-xl font-bold hover:bg-zinc-700 transition"
                >
                  Start Over
                </button>
                <button
                  onClick={() => {
                    setShowPreview(false);
                    setIsEditing(false);
                  }}
                  className="w-full text-zinc-500 hover:text-white transition"
                >
                  ← Go back and edit answers
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function EventCard({ event, onSwipe, style, isTrending, vibeMatch, countdown, goingCount, rsvpUsers }) {
  const [dragStart, setDragStart] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [swiping, setSwiping] = useState(false);
  const cardRef = useRef(null);

  const handleDragStart = (e) => {
    if (swiping) return;
    e.preventDefault();
    const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    setDragStart(clientX);
    setIsDragging(true);
  };

  const handleDragMove = (e) => {
    if (!isDragging || swiping) return;
    e.preventDefault();
    const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    setDragOffset(clientX - dragStart);
  };

  const handleDragEnd = (e) => {
    if (!isDragging || swiping) return;
    e.preventDefault();
    
    if (Math.abs(dragOffset) > 80) {
      setSwiping(true);
      const direction = dragOffset > 0 ? 'right' : 'left';
      
      // Animate card off screen
      setDragOffset(direction === 'right' ? 500 : -500);
      
      // Trigger swipe after animation
      setTimeout(() => {
        onSwipe(direction);
        setDragOffset(0);
        setIsDragging(false);
        setSwiping(false);
      }, 200);
    } else {
      setDragOffset(0);
      setIsDragging(false);
    }
  };

  // Reset if touch is lost
  useEffect(() => {
    const handleTouchCancel = () => {
      if (!swiping) {
        setDragOffset(0);
        setIsDragging(false);
      }
    };
    
    window.addEventListener('touchcancel', handleTouchCancel);
    return () => window.removeEventListener('touchcancel', handleTouchCancel);
  }, [swiping]);

  const rotation = dragOffset / 25;
  const opacity = Math.max(0.5, 1 - Math.abs(dragOffset) / 500);

  return (
    <div
      ref={cardRef}
      style={{
        ...style,
        transform: `translateX(${dragOffset}px) rotate(${rotation}deg)`,
        opacity,
        transition: isDragging ? 'none' : 'all 0.3s ease-out',
        touchAction: 'none',
        userSelect: 'none'
      }}
      onMouseDown={handleDragStart}
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={() => !swiping && isDragging && handleDragEnd({ preventDefault: () => {} })}
      onTouchStart={handleDragStart}
      onTouchMove={handleDragMove}
      onTouchEnd={handleDragEnd}
      className="absolute w-full cursor-grab active:cursor-grabbing select-none"
    >
      <div className="relative bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl">
        {/* Mobile: h-48, Desktop: h-72 */}
        <div className="relative h-48 sm:h-64 md:h-72">
          <img 
            src={event.image_url} 
            alt={event.name} 
            className="w-full h-full object-cover pointer-events-none" 
            draggable="false"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
          
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex gap-2">
            <div className="bg-orange-500 text-white px-2 py-1 sm:px-3 rounded-full text-xs font-bold uppercase">
              {event.category?.replace('-', ' ') || 'Event'}
            </div>
            {event.ambience && (() => {
              const amb = AMBIENCE_OPTIONS.find(a => a.id === event.ambience);
              return amb ? (
                <div className={`${amb.color} text-white px-2 py-1 sm:px-3 rounded-full text-xs font-bold flex items-center gap-1`}>
                  <span>{amb.icon}</span>
                  <span className="hidden sm:inline">{amb.label}</span>
                </div>
              ) : null;
            })()}
          </div>

          {(event.age_tag === '21+' || event.age_restriction === '21+') && (
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-red-500 text-white px-2 py-1 sm:px-3 rounded-full text-xs font-bold">
              21+
            </div>
          )}
          {(event.age_tag === '18+' || event.age_restriction === '18+') && (
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-amber-500 text-white px-2 py-1 sm:px-3 rounded-full text-xs font-bold">
              18+
            </div>
          )}
          {/* Patch 5 — Tag for user-submitted events */}
          {event.submitted_by_user_id && (
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-violet-500/90 backdrop-blur text-white px-2 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1">
              <span>👥</span> Submitted by a CrewQ user
            </div>
          )}

          {dragOffset < -40 && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-500 bg-opacity-30 transition-opacity">
              <div className="bg-red-500 rounded-full p-3 sm:p-4 shadow-lg">
                <X className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
              </div>
            </div>
          )}
          {dragOffset > 40 && (
            <div className="absolute inset-0 flex items-center justify-center bg-emerald-500 bg-opacity-30 transition-opacity">
              <div className="bg-emerald-500 rounded-full p-3 sm:p-4 shadow-lg">
                <Heart className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
              </div>
            </div>
          )}
        </div>

        {/* Mobile: smaller padding, Desktop: normal padding */}
        <div className="p-4 pb-16 sm:p-6 sm:pb-20">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">{event.name}</h2>
          <p className="text-zinc-400 text-xs sm:text-sm mb-2 sm:mb-4 line-clamp-2">{event.description}</p>
          
          <div className="flex items-center gap-2 text-zinc-400 text-xs sm:text-sm mb-2">
            <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="truncate">{event.venue} • {event.neighborhood}</span>
            {event.distance && (
              <>
                <span className="text-zinc-600">•</span>
                <span>{event.distance}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs sm:text-sm mb-2 sm:mb-4">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-zinc-400" />
              <span className="text-zinc-300">{event.time}</span>
            </div>
            {countdown && (
              <div className="flex items-center gap-1 text-orange-400">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="font-semibold">{countdown}</span>
              </div>
            )}
          </div>

          {/* Social Proof Row */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {isTrending && (
              <div className="flex items-center gap-1 bg-red-500 bg-opacity-20 text-red-400 px-2 py-1 rounded-full text-xs font-semibold">
                <Flame className="w-3 h-3" />
                <span>Trending</span>
              </div>
            )}
            {vibeMatch && vibeMatch >= 70 && (
              <div className="flex items-center gap-1 bg-violet-500 bg-opacity-20 text-violet-400 px-2 py-1 rounded-full text-xs font-semibold">
                <Sparkles className="w-3 h-3" />
                <span>{vibeMatch}% match</span>
              </div>
            )}
            {goingCount > 0 && (
              <div className="flex items-center gap-1 bg-emerald-500 bg-opacity-20 text-emerald-400 px-2 py-1 rounded-full text-xs font-semibold">
                <Users className="w-3 h-3" />
                <span>{goingCount} going</span>
              </div>
            )}
          </div>

          {/* People Going - Show faces */}
          {rsvpUsers && rsvpUsers.length > 0 && (
            <div className="flex items-center gap-2 mb-2">
              <div className="flex -space-x-2">
                {rsvpUsers.slice(0, 4).map((user, idx) => (
                  <div key={idx} className="w-6 h-6 rounded-full bg-zinc-700 border-2 border-zinc-900 overflow-hidden">
                    {user.profile_picture ? (
                      <img src={user.profile_picture} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-white">
                        {user.name?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                ))}
                {rsvpUsers.length > 4 && (
                  <div className="w-6 h-6 rounded-full bg-zinc-700 border-2 border-zinc-900 flex items-center justify-center text-xs text-zinc-400">
                    +{rsvpUsers.length - 4}
                  </div>
                )}
              </div>
              <span className="text-zinc-400 text-xs">
                {rsvpUsers[0]?.name?.split(' ')[0]}{rsvpUsers.length > 1 ? ` & ${rsvpUsers.length - 1} more` : ''} going
              </span>
            </div>
          )}

          <div className="inline-block bg-emerald-500 bg-opacity-20 text-emerald-400 px-2 py-1 sm:px-3 rounded-full text-xs sm:text-sm font-semibold">
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
  
  // Squad restrictions
  const [genderRestriction, setGenderRestriction] = useState('all');
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');
  const [minBadges, setMinBadges] = useState(0);
  const [requiresApproval, setRequiresApproval] = useState(true);
  
  // New fields
  const [maxMembers, setMaxMembers] = useState('');
  const [meetingSpot, setMeetingSpot] = useState('');
  const [meetingInstructions, setMeetingInstructions] = useState('');

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
      created_by: userProfile.id,
      // Restriction fields
      gender_restriction: isSoloFriendly ? genderRestriction : 'all',
      min_age: isSoloFriendly && minAge ? parseInt(minAge) : null,
      max_age: isSoloFriendly && maxAge ? parseInt(maxAge) : null,
      min_badges: isSoloFriendly ? minBadges : 0,
      requires_approval: isSoloFriendly ? requiresApproval : false,
      // New fields
      max_members: maxMembers ? parseInt(maxMembers) : null,
      meeting_spot: meetingSpot,
      meeting_instructions: meetingInstructions
    });
    setIsCreating(false);
  };

  // Calculate total steps based on settings
  const totalSteps = isSoloFriendly ? 5 : 4;

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
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map(s => (
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

              {/* Member Cap */}
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-2">
                  Maximum Members (Optional)
                </label>
                <div className="flex gap-2">
                  {[null, 4, 6, 8, 10, 15].map(num => (
                    <button
                      key={num || 'unlimited'}
                      onClick={() => setMaxMembers(num ? num.toString() : '')}
                      className={`flex-1 py-3 rounded-xl text-sm font-semibold transition ${
                        (maxMembers === '' && num === null) || (parseInt(maxMembers) === num)
                          ? 'bg-orange-500 text-white'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                    >
                      {num === null ? '∞' : num}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  Squad will auto-close when limit is reached
                </p>
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
                  onClick={() => setStep(isSoloFriendly ? 3 : 4)}
                  disabled={!selectedEvent}
                  className="flex-1 bg-orange-500 text-white py-4 rounded-xl font-bold hover:bg-orange-600 transition disabled:opacity-50"
                >
                  {isSoloFriendly ? 'Next: Set Rules' : 'Next: Meeting Details'}
                </button>
              </div>
            </div>
          )}

          {step === 3 && isSoloFriendly && (
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-bold text-white mb-3">Squad Rules</h4>
                <p className="text-sm text-zinc-400 mb-4">
                  Set who can request to join your squad
                </p>
              </div>

              {/* Gender Restriction */}
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-2">
                  Who can join?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {SQUAD_GENDER_OPTIONS.map(option => (
                    <button
                      key={option.id}
                      onClick={() => setGenderRestriction(option.id)}
                      className={`p-3 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${
                        genderRestriction === option.id
                          ? 'bg-orange-500 text-white'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                    >
                      <span>{option.icon}</span>
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Age Range */}
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-2">
                  Age Range (Optional)
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    value={minAge}
                    onChange={(e) => setMinAge(e.target.value)}
                    placeholder="Min"
                    className="w-24 bg-zinc-800 text-white rounded-xl px-3 py-3 outline-none focus:ring-2 focus:ring-orange-500 text-center"
                  />
                  <span className="text-zinc-500">to</span>
                  <input
                    type="number"
                    value={maxAge}
                    onChange={(e) => setMaxAge(e.target.value)}
                    placeholder="Max"
                    className="w-24 bg-zinc-800 text-white rounded-xl px-3 py-3 outline-none focus:ring-2 focus:ring-orange-500 text-center"
                  />
                </div>
              </div>

              {/* Minimum Badges */}
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-2">
                  Minimum Badges Required
                </label>
                <div className="flex gap-2">
                  {[0, 1, 3, 5, 10].map(num => (
                    <button
                      key={num}
                      onClick={() => setMinBadges(num)}
                      className={`flex-1 py-3 rounded-xl text-sm font-semibold transition ${
                        minBadges === num
                          ? 'bg-orange-500 text-white'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                    >
                      {num === 0 ? 'Any' : `${num}+`}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  Higher badge requirements help ensure active, trusted members
                </p>
              </div>

              {/* Approval Toggle */}
              <div className="bg-zinc-800 rounded-xl p-4 border-2 border-zinc-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-semibold">Review Join Requests</p>
                    <p className="text-xs text-zinc-400 mt-1">
                      {requiresApproval 
                        ? 'You\'ll approve each person before they join' 
                        : 'Anyone meeting requirements joins automatically'}
                    </p>
                  </div>
                  <button
                    onClick={() => setRequiresApproval(!requiresApproval)}
                    className={`relative w-12 h-7 rounded-full transition ${
                      requiresApproval ? 'bg-orange-500' : 'bg-zinc-700'
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                        requiresApproval ? 'transform translate-x-5' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-zinc-800 text-white py-4 rounded-xl font-bold hover:bg-zinc-700 transition"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="flex-1 bg-orange-500 text-white py-4 rounded-xl font-bold hover:bg-orange-600 transition"
                >
                  Next: Meeting Details
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-bold text-white mb-3">Meeting Details</h4>
                <p className="text-sm text-zinc-400 mb-4">
                  How will your squad find each other?
                </p>
              </div>

              {/* Meeting Spot */}
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-2">
                  Meeting Spot
                </label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {['At the bar', 'Near the entrance', 'At a table', 'Outside/Patio', 'Near the stage'].map(spot => (
                    <button
                      key={spot}
                      onClick={() => setMeetingSpot(spot)}
                      className={`p-3 rounded-xl text-sm font-semibold transition ${
                        meetingSpot === spot
                          ? 'bg-orange-500 text-white'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                    >
                      {spot}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={['At the bar', 'Near the entrance', 'At a table', 'Outside/Patio', 'Near the stage'].includes(meetingSpot) ? '' : meetingSpot}
                  onChange={(e) => setMeetingSpot(e.target.value)}
                  placeholder="Or type a custom meeting spot (up to 50 chars)..."
                  maxLength={50}
                  className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Meeting Instructions */}
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-2">
                  How will they recognize you? (Optional)
                </label>
                <textarea
                  value={meetingInstructions}
                  onChange={(e) => setMeetingInstructions(e.target.value)}
                  placeholder="e.g., I'll be wearing a red jacket, Look for the table with the CrewQ sign"
                  className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  rows="3"
                />
              </div>

              <div className="bg-zinc-800 rounded-xl p-4">
                <p className="text-sm text-zinc-400">
                  💡 <strong className="text-white">Tip:</strong> Clear meeting details help solo members feel confident joining!
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(isSoloFriendly ? 3 : 2)}
                  className="flex-1 bg-zinc-800 text-white py-4 rounded-xl font-bold hover:bg-zinc-700 transition"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(5)}
                  className="flex-1 bg-orange-500 text-white py-4 rounded-xl font-bold hover:bg-orange-600 transition"
                >
                  Next: Invite Friends
                </button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-bold text-white mb-3">Invite Friends</h4>
                <p className="text-sm text-zinc-400 mb-4">
                  Add phone numbers to send squad invites
                </p>
              </div>

              {/* Access Contacts Button */}
              <button
                onClick={async () => {
                  try {
                    // Request contacts permission using Contacts API
                    if ('contacts' in navigator && 'ContactsManager' in window) {
                      const props = ['tel', 'name'];
                      const opts = { multiple: true };
                      const contacts = await navigator.contacts.select(props, opts);
                      const phones = contacts
                        .filter(c => c.tel && c.tel.length > 0)
                        .map(c => c.tel[0])
                        .filter(Boolean);
                      if (phones.length > 0) {
                        setInvitedMembers(prev => [...new Set([...prev, ...phones])]);
                      }
                    } else {
                      // Fallback for browsers that don't support Contacts API
                      alert('Contact access requires a mobile device. Please enter phone numbers manually below.');
                    }
                  } catch (err) {
                    console.log('Contacts access:', err);
                    if (err.name !== 'TypeError') {
                      alert('Unable to access contacts. Please enter phone numbers manually.');
                    }
                  }
                }}
                className="w-full bg-gradient-to-r from-violet-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition flex items-center justify-center gap-2"
              >
                <Phone className="w-5 h-5" />
                Import from Contacts
              </button>

              <div className="relative flex items-center gap-4">
                <div className="flex-1 h-px bg-zinc-700" />
                <span className="text-zinc-500 text-sm">or enter manually</span>
                <div className="flex-1 h-px bg-zinc-700" />
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
                  onClick={() => setStep(4)}
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

// Edit Squad Modal
function EditSquadModal({ squad, onClose, onSave }) {
  const [name, setName] = useState(squad.name || '');
  const [description, setDescription] = useState(squad.description || '');
  const [maxMembers, setMaxMembers] = useState(squad.max_members ? squad.max_members.toString() : '');
  const [meetingSpot, setMeetingSpot] = useState(squad.meeting_spot || '');
  const [meetingInstructions, setMeetingInstructions] = useState(squad.meeting_instructions || '');
  const [isSoloFriendly, setIsSoloFriendly] = useState(squad.is_solo_friendly || false);
  const [genderRestriction, setGenderRestriction] = useState(squad.gender_restriction || 'all');
  const [minAge, setMinAge] = useState(squad.min_age ? squad.min_age.toString() : '');
  const [maxAge, setMaxAge] = useState(squad.max_age ? squad.max_age.toString() : '');
  const [minBadges, setMinBadges] = useState(squad.min_badges || 0);
  const [requiresApproval, setRequiresApproval] = useState(squad.requires_approval !== false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name) return;
    setIsSaving(true);
    await onSave({
      ...squad,
      name,
      description,
      max_members: maxMembers ? parseInt(maxMembers) : null,
      meeting_spot: meetingSpot,
      meeting_instructions: meetingInstructions,
      is_solo_friendly: isSoloFriendly,
      gender_restriction: isSoloFriendly ? genderRestriction : 'all',
      min_age: isSoloFriendly && minAge ? parseInt(minAge) : null,
      max_age: isSoloFriendly && maxAge ? parseInt(maxAge) : null,
      min_badges: isSoloFriendly ? minBadges : 0,
      requires_approval: isSoloFriendly ? requiresApproval : false
    });
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-6 z-10">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold text-white">Edit Squad</h3>
            <button onClick={onClose} className="text-zinc-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2">Squad Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              rows="2"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2">Maximum Members</label>
            <div className="flex gap-2">
              {[null, 4, 6, 8, 10, 15].map(num => (
                <button
                  key={num || 'unlimited'}
                  onClick={() => setMaxMembers(num ? num.toString() : '')}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold transition ${
                    (maxMembers === '' && num === null) || (parseInt(maxMembers) === num)
                      ? 'bg-orange-500 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {num === null ? '∞' : num}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2">Meeting Spot</label>
            <input
              type="text"
              value={meetingSpot}
              onChange={(e) => setMeetingSpot(e.target.value)}
              placeholder="e.g., At the bar, Near the entrance"
              className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2">Meeting Instructions</label>
            <textarea
              value={meetingInstructions}
              onChange={(e) => setMeetingInstructions(e.target.value)}
              placeholder="How will they recognize you?"
              className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              rows="2"
            />
          </div>

          <div className="bg-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-semibold">Open to Solo Members</p>
                <p className="text-xs text-zinc-400">Let strangers request to join</p>
              </div>
              <button
                onClick={() => setIsSoloFriendly(!isSoloFriendly)}
                className={`relative w-12 h-7 rounded-full transition ${
                  isSoloFriendly ? 'bg-orange-500' : 'bg-zinc-700'
                }`}
              >
                <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                  isSoloFriendly ? 'transform translate-x-5' : ''
                }`} />
              </button>
            </div>
          </div>

          {isSoloFriendly && (
            <>
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-2">Who can join?</label>
                <div className="grid grid-cols-3 gap-2">
                  {SQUAD_GENDER_OPTIONS.map(option => (
                    <button
                      key={option.id}
                      onClick={() => setGenderRestriction(option.id)}
                      className={`p-2 rounded-xl text-xs font-semibold transition ${
                        genderRestriction === option.id
                          ? 'bg-orange-500 text-white'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {option.icon} {option.label.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-2">Age Range</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    value={minAge}
                    onChange={(e) => setMinAge(e.target.value)}
                    placeholder="Min"
                    className="w-20 bg-zinc-800 text-white rounded-xl px-3 py-2 outline-none text-sm text-center"
                  />
                  <span className="text-zinc-500 text-sm">to</span>
                  <input
                    type="number"
                    value={maxAge}
                    onChange={(e) => setMaxAge(e.target.value)}
                    placeholder="Max"
                    className="w-20 bg-zinc-800 text-white rounded-xl px-3 py-2 outline-none text-sm text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-2">Min Badges</label>
                <div className="flex gap-2">
                  {[0, 1, 3, 5, 10].map(num => (
                    <button
                      key={num}
                      onClick={() => setMinBadges(num)}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold transition ${
                        minBadges === num ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {num === 0 ? 'Any' : `${num}+`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-zinc-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-semibold text-sm">Require Approval</p>
                    <p className="text-xs text-zinc-400">Review requests before joining</p>
                  </div>
                  <button
                    onClick={() => setRequiresApproval(!requiresApproval)}
                    className={`relative w-12 h-7 rounded-full transition ${
                      requiresApproval ? 'bg-orange-500' : 'bg-zinc-700'
                    }`}
                  >
                    <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                      requiresApproval ? 'transform translate-x-5' : ''
                    }`} />
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 bg-zinc-800 text-white py-3 rounded-xl font-bold hover:bg-zinc-700 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!name || isSaving}
              className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SquadDetailModal({ squad, onClose, onJoin, onLeave, onVote, userProfile, isMember, onEventClick, onEdit, onDelete, onMute, onOpenChat }) {
  const [hasVoted, setHasVoted] = useState(false);
  const [vote, setVote] = useState(null);
  const [squadMembers, setSquadMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [viewingMember, setViewingMember] = useState(null);
  const [memberBadges, setMemberBadges] = useState([]);
  const [loadingMemberBadges, setLoadingMemberBadges] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [squadLeader, setSquadLeader] = useState(null);

  // Check if squad is muted
  useEffect(() => {
    if (userProfile?.id && squad?.id) {
      const mutedSquads = JSON.parse(localStorage.getItem(`crewq_${userProfile.id}_muted_squads`) || '[]');
      setIsMuted(mutedSquads.includes(squad.id));
    }
  }, [userProfile?.id, squad?.id]);

  // Load squad leader info
  useEffect(() => {
    const loadLeader = async () => {
      if (!supabaseClient || !squad?.created_by) return;
      try {
        const { data } = await supabaseClient
          .from('users')
          .select('id, name, profile_picture')
          .eq('id', squad.created_by)
          .single();
        if (data) setSquadLeader(data);
      } catch (error) {
        console.error('Error loading squad leader:', error);
      }
    };
    loadLeader();
  }, [squad?.created_by]);

  // Handle mute toggle
  const handleMuteToggle = () => {
    if (onMute) {
      onMute(squad);
      setIsMuted(!isMuted);
    }
  };

  // Load member's badges when viewing their profile
  const loadMemberBadges = async (memberId) => {
    if (!supabaseClient || !memberId) return;
    setLoadingMemberBadges(true);
    try {
      const { data } = await supabaseClient
        .from('user_badges')
        .select('badge_id')
        .eq('user_id', memberId);
      setMemberBadges(data?.map(b => b.badge_id) || []);
    } catch (error) {
      console.error('Error loading member badges:', error);
    }
    setLoadingMemberBadges(false);
  };

  const handleViewMember = async (member) => {
    // Respect privacy settings
    if (member.profile_visibility === 'squad_only' && member.id !== userProfile?.id) {
      // For squad_only profiles, only show if we're in the same squad
      if (!isMember) return;
    }
    setViewingMember(member);
    await loadMemberBadges(member.id);
  };

  // Load squad members when modal opens
  useEffect(() => {
    const loadMembers = async () => {
      if (!supabaseClient || !squad?.id) return;
      setLoadingMembers(true);
      try {
        const { data } = await supabaseClient
          .from('squad_members')
          .select('user_id, users(*)')
          .eq('squad_id', squad.id);
        
        const members = (data || []).map(m => m.users).filter(Boolean);
        setSquadMembers(members);
      } catch (error) {
        console.error('Error loading members:', error);
      }
      setLoadingMembers(false);
    };
    
    loadMembers();
  }, [squad?.id]);

  const handleVote = async (voteType) => {
    setVote(voteType);
    setHasVoted(true);
    await onVote(squad.id, voteType);
  };

  const totalVotes = (squad.votes_yes || 0) + (squad.votes_no || 0);
  const yesPercentage = totalVotes > 0 ? Math.round(((squad.votes_yes || 0) / totalVotes) * 100) : 0;

  // Use loaded members or fallback to squad.members - actual count takes precedence
  const displayMembers = squadMembers.length > 0 ? squadMembers : (squad.members || []);
  const actualMemberCount = squadMembers.length > 0 ? squadMembers.length : (squad.member_count || displayMembers.length || 0);

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
            <button
              onClick={() => onEventClick && onEventClick(squad.event)}
              className="w-full bg-zinc-800 rounded-xl p-4 mb-4 text-left hover:bg-zinc-700 transition"
            >
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
              <p className="text-orange-500 text-xs mt-2">Tap to view event details →</p>
            </button>
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

          {/* Squad Members Section */}
          <div className="mb-4">
            <p className="text-sm font-semibold text-zinc-400 mb-3">
              Members ({actualMemberCount})
            </p>
            {loadingMembers ? (
              <div className="flex items-center gap-2 text-zinc-500 text-sm">
                <div className="animate-spin w-4 h-4 border-2 border-zinc-500 border-t-transparent rounded-full"></div>
                Loading members...
              </div>
            ) : isMember && displayMembers.length > 0 ? (
              // Show detailed member list for squad members
              <div className="space-y-2">
                {displayMembers.map(member => (
                  <button
                    key={member.id}
                    onClick={() => handleViewMember(member)}
                    className="w-full flex items-center gap-3 bg-zinc-800 rounded-xl p-3 hover:bg-zinc-700 transition text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-white text-sm font-semibold overflow-hidden">
                      {member.profile_picture ? (
                        <img src={member.profile_picture} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{member.name?.charAt(0).toUpperCase() || '?'}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{member.name}</p>
                      {member.gender && (
                        <span className={`text-xs ${
                          member.gender === 'woman' ? 'text-pink-400' :
                          member.gender === 'man' ? 'text-blue-400' :
                          'text-zinc-500'
                        }`}>
                          {member.gender === 'woman' ? '♀ Woman' : 
                           member.gender === 'man' ? '♂ Man' : ''}
                        </span>
                      )}
                    </div>
                    {member.id === userProfile?.id && (
                      <span className="text-xs text-orange-500 bg-orange-500 bg-opacity-20 px-2 py-1 rounded-full">You</span>
                    )}
                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                  </button>
                ))}
              </div>
            ) : (
              // Show avatars for non-members
              <div className="flex items-center gap-2">
                {displayMembers.slice(0, 6).map(member => (
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
                {actualMemberCount > 6 && (
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 text-xs font-semibold">
                    +{actualMemberCount - 6}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Member Profile Popup */}
          {viewingMember && (
            <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[60] p-4">
              <div className="bg-zinc-900 rounded-2xl max-w-sm w-full p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Member Profile</h3>
                  <button onClick={() => setViewingMember(null)} className="text-zinc-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="text-center mb-4">
                  <div className="w-20 h-20 rounded-full bg-zinc-700 flex items-center justify-center mx-auto mb-3 overflow-hidden">
                    {viewingMember.profile_picture ? (
                      <img src={viewingMember.profile_picture} alt={viewingMember.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl text-white">{viewingMember.name?.charAt(0).toUpperCase() || '?'}</span>
                    )}
                  </div>
                  <h4 className="text-xl font-bold text-white">{viewingMember.name}</h4>
                  {viewingMember.gender && (
                    <span className={`text-sm ${
                      viewingMember.gender === 'woman' ? 'text-pink-400' :
                      viewingMember.gender === 'man' ? 'text-blue-400' :
                      'text-zinc-400'
                    }`}>
                      {viewingMember.gender === 'woman' ? '♀ Woman' : 
                       viewingMember.gender === 'man' ? '♂ Man' : 
                       viewingMember.gender}
                    </span>
                  )}
                </div>

                {viewingMember.bio && (
                  <div className="bg-zinc-800 rounded-xl p-3 mb-4">
                    <p className="text-zinc-300 text-sm">{viewingMember.bio}</p>
                  </div>
                )}

                {/* Member's Badges */}
                <div>
                  <p className="text-sm font-semibold text-zinc-400 mb-2">Badges Earned</p>
                  {loadingMemberBadges ? (
                    <div className="text-zinc-500 text-sm">Loading badges...</div>
                  ) : memberBadges.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {memberBadges.map(badgeId => {
                        const badge = BADGES.find(b => b.id === badgeId);
                        return badge ? (
                          <div key={badgeId} className="flex items-center gap-1 bg-zinc-800 rounded-lg px-2 py-1" title={badge.description}>
                            <span>{badge.icon}</span>
                            <span className="text-xs text-zinc-300">{badge.name}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  ) : (
                    <p className="text-zinc-500 text-sm">No badges yet</p>
                  )}
                </div>

                <button
                  onClick={() => setViewingMember(null)}
                  className="w-full mt-4 bg-zinc-800 text-white py-3 rounded-xl font-semibold hover:bg-zinc-700 transition"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Squad Leader */}
          {squadLeader && (
            <div className="bg-violet-500 bg-opacity-10 border border-violet-500 border-opacity-30 rounded-xl p-4 mb-4">
              <p className="text-violet-400 text-xs font-semibold uppercase mb-2">👑 Squad Leader</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center overflow-hidden">
                  {squadLeader.profile_picture ? (
                    <img src={squadLeader.profile_picture} alt={squadLeader.name} className="w-full h-full object-cover" />
                  ) : (
                    <Crown className="w-5 h-5 text-violet-400" />
                  )}
                </div>
                <div>
                  <p className="text-white font-semibold">{squadLeader.name}</p>
                  {squadLeader.id === userProfile?.id && (
                    <span className="text-xs text-violet-400">That's you!</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Meeting Spot */}
          {(squad.meeting_spot || squad.meeting_instructions) && (
            <div className="bg-emerald-500 bg-opacity-10 border border-emerald-500 border-opacity-30 rounded-xl p-4 mb-4">
              <p className="text-emerald-400 text-xs font-semibold uppercase mb-2">📍 Meeting Details</p>
              {squad.meeting_spot && (
                <p className="text-white font-semibold mb-1">{squad.meeting_spot}</p>
              )}
              {squad.meeting_instructions && (
                <p className="text-emerald-300 text-sm">{squad.meeting_instructions}</p>
              )}
            </div>
          )}

          {/* Member Cap Status */}
          {squad.max_members && (
            <div className={`rounded-xl p-3 mb-4 ${
              actualMemberCount >= squad.max_members
                ? 'bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30'
                : 'bg-zinc-800'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Squad Capacity</span>
                <span className={`text-sm font-semibold ${
                  actualMemberCount >= squad.max_members ? 'text-red-400' : 'text-white'
                }`}>
                  {actualMemberCount} / {squad.max_members}
                </span>
              </div>
              {actualMemberCount >= squad.max_members && (
                <p className="text-red-400 text-xs mt-1">🔒 Squad is full</p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {!isMember ? (
            squad.max_members && actualMemberCount >= squad.max_members ? (
              <div className="w-full bg-zinc-800 text-zinc-500 py-4 rounded-xl font-bold text-center">
                Squad is Full
              </div>
            ) : squad.requires_approval ? (
              <button
                onClick={() => onJoin(squad, true)}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-bold hover:shadow-lg transition"
              >
                Request to Join
              </button>
            ) : (
              <button
                onClick={() => onJoin(squad, false)}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-bold hover:shadow-lg transition"
              >
                Join Squad
              </button>
            )
          ) : (
            <div className="space-y-2">
              {/* Squad Chat Button */}
              <button
                onClick={() => onOpenChat && onOpenChat(squad)}
                className="w-full bg-gradient-to-r from-violet-500 to-purple-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Squad Chat
              </button>

              <button
                onClick={() => onLeave(squad)}
                className="w-full bg-zinc-800 text-zinc-400 py-3 rounded-xl font-bold hover:bg-zinc-700 transition"
              >
                Leave Squad
              </button>
              
              {/* Squad Creator Options */}
              {squad.created_by === userProfile?.id && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800">
                  <button
                    onClick={() => onEdit && onEdit(squad)}
                    className="flex items-center justify-center gap-2 bg-zinc-800 text-orange-400 py-3 rounded-xl font-semibold hover:bg-zinc-700 transition"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Squad
                  </button>
                  <button
                    onClick={() => onDelete && onDelete(squad)}
                    className="flex items-center justify-center gap-2 bg-red-500 bg-opacity-20 text-red-400 py-3 rounded-xl font-semibold hover:bg-opacity-30 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              )}
              
              {/* Mute notifications toggle for all members */}
              <div className="flex items-center justify-between py-3 border-t border-zinc-800 mt-3">
                <div className="flex items-center gap-2">
                  {isMuted ? <BellOff className="w-4 h-4 text-zinc-500" /> : <Bell className="w-4 h-4 text-zinc-400" />}
                  <span className="text-sm text-zinc-400">Notifications {isMuted ? '(Muted)' : '(On)'}</span>
                </div>
                <button
                  onClick={handleMuteToggle}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                    isMuted ? 'bg-zinc-600' : 'bg-orange-500'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-200 ${
                      isMuted ? 'left-1' : 'left-7'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Show restrictions if any */}
          {squad.is_solo_friendly && (squad.gender_restriction !== 'all' || squad.min_age || squad.max_age || squad.min_badges > 0) && (
            <div className="mt-4 bg-zinc-800 rounded-xl p-4">
              <p className="text-sm font-semibold text-zinc-400 mb-2">Squad Requirements</p>
              <div className="space-y-1 text-sm text-zinc-500">
                {squad.gender_restriction && squad.gender_restriction !== 'all' && (
                  <p>• {SQUAD_GENDER_OPTIONS.find(o => o.id === squad.gender_restriction)?.label || squad.gender_restriction}</p>
                )}
                {squad.min_age && squad.max_age && (
                  <p>• Ages {squad.min_age} - {squad.max_age}</p>
                )}
                {squad.min_age && !squad.max_age && (
                  <p>• Ages {squad.min_age}+</p>
                )}
                {!squad.min_age && squad.max_age && (
                  <p>• Ages up to {squad.max_age}</p>
                )}
                {squad.min_badges > 0 && (
                  <p>• Minimum {squad.min_badges} badges earned</p>
                )}
                {squad.requires_approval && (
                  <p>• Approval required to join</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Settings Modal
function SettingsModal({ onClose, darkMode, setDarkMode, userProfile, onLogout, onLinkGoogle, onUpdateProfile, onResetEvents, isAdmin, onOpenAdmin, onOpenNotificationPrefs }) {
  const [activeSection, setActiveSection] = useState(null);
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Editable states for Account section
  const [editName, setEditName] = useState(userProfile?.name || '');
  const [editAge, setEditAge] = useState(userProfile?.age || '');
  const [editGender, setEditGender] = useState(userProfile?.gender || '');
  const [editBio, setEditBio] = useState(userProfile?.bio || '');
  
  // Privacy settings
  const [allowSquadRequests, setAllowSquadRequests] = useState(userProfile?.allow_squad_requests !== false);
  const [showAgeToSquads, setShowAgeToSquads] = useState(userProfile?.show_age_to_squads !== false);
  const [showProfilePublicly, setShowProfilePublicly] = useState(userProfile?.show_profile_publicly !== false);
  
  // Content preferences
  const [showOver21Only, setShowOver21Only] = useState(localStorage.getItem('crewq_show_21_only') === 'true');
  const [notificationsEnabled, setNotificationsEnabled] = useState(localStorage.getItem('crewq_notifications') !== 'false');

  const settingsSections = [
    { id: 'account', label: 'Account', icon: User, description: 'Manage your profile details' },
    { id: 'privacy', label: 'Privacy & Social', icon: Shield, description: 'Control who sees your profile' },
    { id: 'content', label: 'Content & Display', icon: Eye, description: 'Customize your experience' },
    { id: 'data', label: 'Data & Storage', icon: Trash2, description: 'Manage your data' },
    { id: 'about', label: 'About', icon: Sparkles, description: 'App info and support' }
  ];

  const handleLinkGoogle = async () => {
    setIsLinkingGoogle(true);
    try {
      await onLinkGoogle();
    } catch (error) {
      console.error('Error linking Google:', error);
    }
    setIsLinkingGoogle(false);
  };

  const handleSaveAccount = async () => {
    setIsSaving(true);
    try {
      await onUpdateProfile({
        name: editName,
        age: editAge ? parseInt(editAge) : null,
        gender: editGender,
        bio: editBio
      });
      setActiveSection(null);
    } catch (error) {
      console.error('Error saving account:', error);
    }
    setIsSaving(false);
  };

  const handleSavePrivacy = async () => {
    setIsSaving(true);
    try {
      await onUpdateProfile({
        allow_squad_requests: allowSquadRequests,
        show_age_to_squads: showAgeToSquads,
        show_profile_publicly: showProfilePublicly
      });
      setActiveSection(null);
    } catch (error) {
      console.error('Error saving privacy settings:', error);
    }
    setIsSaving(false);
  };

  const handleSaveContent = () => {
    localStorage.setItem('crewq_show_21_only', showOver21Only.toString());
    localStorage.setItem('crewq_notifications', notificationsEnabled.toString());
    setActiveSection(null);
  };

  const isGoogleLinked = !!userProfile?.auth_id || !!userProfile?.email;

  // Render sub-pages
  if (activeSection === 'account') {
    return (
      <div className={`fixed inset-0 z-50 ${darkMode ? 'bg-black bg-opacity-90' : 'bg-white bg-opacity-95'}`}>
        <div className={`h-full max-w-md mx-auto ${darkMode ? 'bg-zinc-950' : 'bg-amber-50'}`}>
          <div className={`sticky top-0 z-10 px-4 py-4 border-b ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-amber-50 border-amber-200'}`}>
            <div className="flex items-center gap-3">
              <button onClick={() => setActiveSection(null)} className={darkMode ? 'text-zinc-400' : 'text-zinc-600'}>
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Account</h2>
            </div>
          </div>
          
          <div className="p-4 space-y-4">
            {/* Profile Picture */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className={`w-24 h-24 rounded-full overflow-hidden ${darkMode ? 'bg-zinc-800' : 'bg-amber-100'}`}>
                  {userProfile?.profile_picture ? (
                    <img src={userProfile.profile_picture} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className={`w-10 h-10 ${darkMode ? 'text-zinc-600' : 'text-amber-400'}`} />
                    </div>
                  )}
                </div>
                <p className={`text-center text-xs mt-2 ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  {isGoogleLinked ? 'Photo from Google' : 'No photo'}
                </p>
              </div>
            </div>

            {/* Account Info (Read-only) */}
            <div className={`rounded-2xl p-4 ${darkMode ? 'bg-zinc-900' : 'bg-white'}`}>
              <h3 className={`font-semibold mb-4 ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Your Info</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className={darkMode ? 'text-zinc-400' : 'text-zinc-600'}>Name</span>
                  <span className={darkMode ? 'text-white' : 'text-zinc-900'}>{userProfile?.name || 'Not set'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className={darkMode ? 'text-zinc-400' : 'text-zinc-600'}>Age</span>
                  <span className={darkMode ? 'text-white' : 'text-zinc-900'}>{userProfile?.age || 'Not set'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className={darkMode ? 'text-zinc-400' : 'text-zinc-600'}>Gender</span>
                  <span className={darkMode ? 'text-white' : 'text-zinc-900'}>
                    {GENDER_OPTIONS.find(g => g.id === userProfile?.gender)?.label || 'Not set'}
                  </span>
                </div>
                
                {userProfile?.email && (
                  <div className="flex justify-between">
                    <span className={darkMode ? 'text-zinc-400' : 'text-zinc-600'}>Email</span>
                    <span className={darkMode ? 'text-white' : 'text-zinc-900'}>{userProfile.email}</span>
                  </div>
                )}
              </div>
              
              <p className={`text-xs mt-4 ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                Contact support to update your age or gender.
              </p>
            </div>

            {/* Public/Private Profile Toggle */}
            <div className={`rounded-2xl p-4 ${darkMode ? 'bg-zinc-900' : 'bg-white'}`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className={`font-semibold ${darkMode ? 'text-white' : 'text-zinc-900'}`}>
                    Public Profile
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    {showProfilePublicly 
                      ? 'Others can see your profile when browsing squads' 
                      : 'Your profile is hidden from others'}
                  </p>
                </div>
                <button
                  onClick={() => setShowProfilePublicly(!showProfilePublicly)}
                  className={`relative w-14 h-8 rounded-full transition ${
                    showProfilePublicly ? 'bg-orange-500' : darkMode ? 'bg-zinc-700' : 'bg-zinc-300'
                  }`}
                >
                  <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform shadow ${
                    showProfilePublicly ? 'transform translate-x-6' : ''
                  }`} />
                </button>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSavePrivacy}
              disabled={isSaving}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (activeSection === 'privacy') {
    return (
      <div className={`fixed inset-0 z-50 ${darkMode ? 'bg-black bg-opacity-90' : 'bg-white bg-opacity-95'}`}>
        <div className={`h-full max-w-md mx-auto ${darkMode ? 'bg-zinc-950' : 'bg-amber-50'}`}>
          <div className={`sticky top-0 z-10 px-4 py-4 border-b ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-amber-50 border-amber-200'}`}>
            <div className="flex items-center gap-3">
              <button onClick={() => setActiveSection(null)} className={darkMode ? 'text-zinc-400' : 'text-zinc-600'}>
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Privacy & Social</h2>
            </div>
          </div>
          
          <div className="p-4 space-y-4">
            {/* Allow Squad Requests */}
            <div className={`rounded-2xl p-4 ${darkMode ? 'bg-zinc-900' : 'bg-white'}`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className={`font-semibold ${darkMode ? 'text-white' : 'text-zinc-900'}`}>
                    Allow Squad Invites
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    Let others invite you to their squads
                  </p>
                </div>
                <button
                  onClick={() => setAllowSquadRequests(!allowSquadRequests)}
                  className={`relative w-14 h-8 rounded-full transition ${
                    allowSquadRequests ? 'bg-orange-500' : darkMode ? 'bg-zinc-700' : 'bg-zinc-300'
                  }`}
                >
                  <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform shadow ${
                    allowSquadRequests ? 'transform translate-x-6' : ''
                  }`} />
                </button>
              </div>
            </div>

            {/* Show Age to Squads */}
            <div className={`rounded-2xl p-4 ${darkMode ? 'bg-zinc-900' : 'bg-white'}`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className={`font-semibold ${darkMode ? 'text-white' : 'text-zinc-900'}`}>
                    Show Age to Squad Leaders
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    Display your age when requesting to join squads
                  </p>
                </div>
                <button
                  onClick={() => setShowAgeToSquads(!showAgeToSquads)}
                  className={`relative w-14 h-8 rounded-full transition ${
                    showAgeToSquads ? 'bg-orange-500' : darkMode ? 'bg-zinc-700' : 'bg-zinc-300'
                  }`}
                >
                  <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform shadow ${
                    showAgeToSquads ? 'transform translate-x-6' : ''
                  }`} />
                </button>
              </div>
            </div>

            {/* Show Profile Publicly */}
            <div className={`rounded-2xl p-4 ${darkMode ? 'bg-zinc-900' : 'bg-white'}`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className={`font-semibold ${darkMode ? 'text-white' : 'text-zinc-900'}`}>
                    Public Profile
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    Allow others to see your profile when browsing squads
                  </p>
                </div>
                <button
                  onClick={() => setShowProfilePublicly(!showProfilePublicly)}
                  className={`relative w-14 h-8 rounded-full transition ${
                    showProfilePublicly ? 'bg-orange-500' : darkMode ? 'bg-zinc-700' : 'bg-zinc-300'
                  }`}
                >
                  <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform shadow ${
                    showProfilePublicly ? 'transform translate-x-6' : ''
                  }`} />
                </button>
              </div>
            </div>

            {/* Info Box */}
            <div className={`rounded-2xl p-4 ${darkMode ? 'bg-blue-500 bg-opacity-10' : 'bg-blue-50'}`}>
              <div className="flex gap-3">
                <Shield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className={`font-semibold ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>Your Privacy Matters</p>
                  <p className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                    We never share your personal information with third parties. Your data stays within CrewQ.
                  </p>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSavePrivacy}
              disabled={isSaving}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (activeSection === 'content') {
    return (
      <div className={`fixed inset-0 z-50 ${darkMode ? 'bg-black bg-opacity-90' : 'bg-white bg-opacity-95'}`}>
        <div className={`h-full max-w-md mx-auto ${darkMode ? 'bg-zinc-950' : 'bg-amber-50'}`}>
          <div className={`sticky top-0 z-10 px-4 py-4 border-b ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-amber-50 border-amber-200'}`}>
            <div className="flex items-center gap-3">
              <button onClick={() => setActiveSection(null)} className={darkMode ? 'text-zinc-400' : 'text-zinc-600'}>
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Content & Display</h2>
            </div>
          </div>
          
          <div className="p-4 space-y-4">
            {/* Theme Toggle */}
            <div className={`rounded-2xl p-4 ${darkMode ? 'bg-zinc-900' : 'bg-white'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {darkMode ? <Moon className="w-5 h-5 text-orange-500" /> : <Sunrise className="w-5 h-5 text-orange-500" />}
                  <div>
                    <p className={`font-semibold ${darkMode ? 'text-white' : 'text-zinc-900'}`}>
                      {darkMode ? 'Dark Mode' : 'Light Mode'}
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      {darkMode ? 'Easy on the eyes at night' : 'Bright and clean look'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`relative w-14 h-8 rounded-full transition ${
                    darkMode ? 'bg-orange-500' : 'bg-zinc-300'
                  }`}
                >
                  <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform shadow ${
                    darkMode ? 'transform translate-x-6' : ''
                  }`} />
                </button>
              </div>
            </div>

            {/* 21+ Events Only */}
            <div className={`rounded-2xl p-4 ${darkMode ? 'bg-zinc-900' : 'bg-white'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Beer className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className={`font-semibold ${darkMode ? 'text-white' : 'text-zinc-900'}`}>
                      21+ Events Only
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      Only show events at bars and clubs
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowOver21Only(!showOver21Only)}
                  className={`relative w-14 h-8 rounded-full transition ${
                    showOver21Only ? 'bg-orange-500' : darkMode ? 'bg-zinc-700' : 'bg-zinc-300'
                  }`}
                >
                  <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform shadow ${
                    showOver21Only ? 'transform translate-x-6' : ''
                  }`} />
                </button>
              </div>
            </div>

            {/* Push Notifications */}
            <div className={`rounded-2xl p-4 ${darkMode ? 'bg-zinc-900' : 'bg-white'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className={`font-semibold ${darkMode ? 'text-white' : 'text-zinc-900'}`}>
                      Notifications
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      Get notified about events and squads
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className={`relative w-14 h-8 rounded-full transition ${
                    notificationsEnabled ? 'bg-orange-500' : darkMode ? 'bg-zinc-700' : 'bg-zinc-300'
                  }`}
                >
                  <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform shadow ${
                    notificationsEnabled ? 'transform translate-x-6' : ''
                  }`} />
                </button>
              </div>
              
              {/* Customize Notifications */}
              {notificationsEnabled && onOpenNotificationPrefs && (
                <button
                  onClick={onOpenNotificationPrefs}
                  className={`w-full p-3 rounded-xl text-left flex items-center justify-between ${
                    darkMode ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-100 hover:bg-zinc-200'
                  } transition mt-2`}
                >
                  <div className="flex items-center gap-3">
                    <Settings className="w-5 h-5 text-orange-500" />
                    <span className={darkMode ? 'text-white' : 'text-zinc-900'}>Customize Notifications</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${darkMode ? 'text-zinc-600' : 'text-zinc-400'}`} />
                </button>
              )}
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveContent}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-bold hover:shadow-lg transition"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (activeSection === 'data') {
    return (
      <div className={`fixed inset-0 z-50 ${darkMode ? 'bg-black bg-opacity-90' : 'bg-white bg-opacity-95'}`}>
        <div className={`h-full max-w-md mx-auto ${darkMode ? 'bg-zinc-950' : 'bg-amber-50'}`}>
          <div className={`sticky top-0 z-10 px-4 py-4 border-b ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-amber-50 border-amber-200'}`}>
            <div className="flex items-center gap-3">
              <button onClick={() => setActiveSection(null)} className={darkMode ? 'text-zinc-400' : 'text-zinc-600'}>
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Data & Storage</h2>
            </div>
          </div>
          
          <div className="p-4 space-y-4">
            {/* Reset Seen Events */}
            <div className={`rounded-2xl p-4 ${darkMode ? 'bg-zinc-900' : 'bg-white'}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${darkMode ? 'bg-zinc-800' : 'bg-amber-100'}`}>
                  <Zap className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className={`font-semibold ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Reset Event Feed</p>
                  <p className={`text-sm ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    See all events again from the beginning
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (onResetEvents) onResetEvents();
                  setActiveSection(null);
                }}
                className={`w-full py-3 rounded-xl font-semibold transition ${
                  darkMode ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-amber-100 text-zinc-900 hover:bg-amber-200'
                }`}
              >
                Reset Event Feed
              </button>
            </div>

            {/* Clear Liked Events */}
            <div className={`rounded-2xl p-4 ${darkMode ? 'bg-zinc-900' : 'bg-white'}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${darkMode ? 'bg-zinc-800' : 'bg-amber-100'}`}>
                  <Heart className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className={`font-semibold ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Clear Liked Events</p>
                  <p className={`text-sm ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    Remove all events from your liked list
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to clear all liked events?')) {
                    const userKey = `crewq_${userProfile?.id}`;
                    localStorage.removeItem(`${userKey}_liked`);
                    window.location.reload();
                  }
                }}
                className={`w-full py-3 rounded-xl font-semibold transition ${
                  darkMode ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-amber-100 text-zinc-900 hover:bg-amber-200'
                }`}
              >
                Clear Liked Events
              </button>
            </div>

            {/* Storage Info */}
            <div className={`rounded-2xl p-4 ${darkMode ? 'bg-zinc-900' : 'bg-white'}`}>
              <h3 className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Storage Usage</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className={darkMode ? 'text-zinc-400' : 'text-zinc-600'}>Saved Events</span>
                  <span className={darkMode ? 'text-white' : 'text-zinc-900'}>
                    {JSON.parse(localStorage.getItem(`crewq_${userProfile?.id}_liked`) || '[]').length} events
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={darkMode ? 'text-zinc-400' : 'text-zinc-600'}>Passed Events</span>
                  <span className={darkMode ? 'text-white' : 'text-zinc-900'}>
                    {JSON.parse(localStorage.getItem(`crewq_${userProfile?.id}_passed`) || '[]').length} events
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={darkMode ? 'text-zinc-400' : 'text-zinc-600'}>RSVP'd Events</span>
                  <span className={darkMode ? 'text-white' : 'text-zinc-900'}>
                    {JSON.parse(localStorage.getItem(`crewq_${userProfile?.id}_rsvped`) || '[]').length} events
                  </span>
                </div>
              </div>
            </div>

            {/* Delete Account - Simplified */}
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                  alert('Please contact support@crewq.app to complete account deletion.');
                }
              }}
              className={`w-full py-3 rounded-xl text-sm ${darkMode ? 'text-zinc-500 hover:text-red-400' : 'text-zinc-400 hover:text-red-500'} transition`}
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (activeSection === 'about') {
    return (
      <div className={`fixed inset-0 z-50 ${darkMode ? 'bg-black bg-opacity-90' : 'bg-white bg-opacity-95'}`}>
        <div className={`h-full max-w-md mx-auto ${darkMode ? 'bg-zinc-950' : 'bg-amber-50'}`}>
          <div className={`sticky top-0 z-10 px-4 py-4 border-b ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-amber-50 border-amber-200'}`}>
            <div className="flex items-center gap-3">
              <button onClick={() => setActiveSection(null)} className={darkMode ? 'text-zinc-400' : 'text-zinc-600'}>
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-zinc-900'}`}>About</h2>
            </div>
          </div>
          
          <div className="p-4 space-y-4">
            {/* App Info */}
            <div className={`rounded-2xl p-6 text-center ${darkMode ? 'bg-zinc-900' : 'bg-white'}`}>
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-white">CQ</span>
              </div>
              <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-zinc-900'}`}>CrewQ</h3>
              <p className={`text-sm ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Dallas Nightlife, Solved</p>
              <p className={`text-xs mt-2 ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Version 1.0.0</p>
            </div>

            {/* Mission */}
            <div className={`rounded-2xl p-4 ${darkMode ? 'bg-zinc-900' : 'bg-white'}`}>
              <h3 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Our Mission</h3>
              <p className={`text-sm ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                CrewQ helps you discover the best nightlife events in Dallas and connect with people who share your vibe. 
                Whether you're looking for a chill rooftop happy hour or an all-night dance party, we've got you covered.
              </p>
            </div>

            {/* Links */}
            <div className={`rounded-2xl overflow-hidden ${darkMode ? 'bg-zinc-900' : 'bg-white'}`}>
              <button className={`w-full p-4 text-left flex items-center justify-between border-b ${
                darkMode ? 'border-zinc-800 hover:bg-zinc-800' : 'border-amber-100 hover:bg-amber-50'
              }`}>
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-orange-500" />
                  <span className={darkMode ? 'text-white' : 'text-zinc-900'}>Website</span>
                </div>
                <ExternalLink className={`w-4 h-4 ${darkMode ? 'text-zinc-600' : 'text-zinc-400'}`} />
              </button>
              
              <button className={`w-full p-4 text-left flex items-center justify-between border-b ${
                darkMode ? 'border-zinc-800 hover:bg-zinc-800' : 'border-amber-100 hover:bg-amber-50'
              }`}>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-orange-500" />
                  <span className={darkMode ? 'text-white' : 'text-zinc-900'}>Contact Support</span>
                </div>
                <ExternalLink className={`w-4 h-4 ${darkMode ? 'text-zinc-600' : 'text-zinc-400'}`} />
              </button>
              
              <button className={`w-full p-4 text-left flex items-center justify-between border-b ${
                darkMode ? 'border-zinc-800 hover:bg-zinc-800' : 'border-amber-100 hover:bg-amber-50'
              }`}>
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-orange-500" />
                  <span className={darkMode ? 'text-white' : 'text-zinc-900'}>Privacy Policy</span>
                </div>
                <ExternalLink className={`w-4 h-4 ${darkMode ? 'text-zinc-600' : 'text-zinc-400'}`} />
              </button>
              
              <button className={`w-full p-4 text-left flex items-center justify-between ${
                darkMode ? 'hover:bg-zinc-800' : 'hover:bg-amber-50'
              }`}>
                <div className="flex items-center gap-3">
                  <Star className="w-5 h-5 text-orange-500" />
                  <span className={darkMode ? 'text-white' : 'text-zinc-900'}>Rate the App</span>
                </div>
                <ExternalLink className={`w-4 h-4 ${darkMode ? 'text-zinc-600' : 'text-zinc-400'}`} />
              </button>
            </div>

            {/* Patch 6 — No-affiliation disclaimer + beta acknowledgement */}
            <div className={`mx-1 mb-3 p-3 rounded-xl text-xs leading-relaxed ${darkMode ? 'bg-zinc-800/60 text-zinc-400 border border-zinc-700' : 'bg-amber-100/60 text-zinc-600 border border-amber-200'}`}>
              <p className="font-semibold mb-1">⚠️ Beta &amp; Disclaimer</p>
              <p>CrewQ is in beta. Event listings are aggregated from public sources — confirm details with the venue before you go. CrewQ is not affiliated with, endorsed by, or sponsored by any venue or event listed.</p>
            </div>

            {/* Credits */}
            <div className={`text-center py-4 ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
              <p className="text-sm">Made with ❤️ in Dallas</p>
              <p className="text-xs mt-1">© 2026 CrewQ. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Settings Page
  return (
    <div className={`fixed inset-0 z-50 ${darkMode ? 'bg-black bg-opacity-90' : 'bg-white bg-opacity-95'}`}>
      <div className={`h-full max-w-md mx-auto ${darkMode ? 'bg-zinc-950' : 'bg-amber-50'}`}>
        {/* Header */}
        <div className={`sticky top-0 z-10 px-4 py-4 border-b ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Settings</h2>
            <button onClick={onClose} className={darkMode ? 'text-zinc-400' : 'text-zinc-600'}>
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 80px)' }}>
          {/* Google Account Status */}
          <div className={`rounded-2xl p-4 ${darkMode ? 'bg-zinc-900' : 'bg-white'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isGoogleLinked 
                  ? 'bg-emerald-500 bg-opacity-20' 
                  : 'bg-zinc-800'
              }`}>
                {isGoogleLinked ? (
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill={darkMode ? '#9CA3AF' : '#6B7280'} d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill={darkMode ? '#9CA3AF' : '#6B7280'} d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill={darkMode ? '#9CA3AF' : '#6B7280'} d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill={darkMode ? '#9CA3AF' : '#6B7280'} d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <p className={`font-semibold ${darkMode ? 'text-white' : 'text-zinc-900'}`}>
                  {isGoogleLinked ? 'Google Account Linked' : 'Link Google Account'}
                </p>
                <p className={`text-sm ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  {isGoogleLinked 
                    ? `Signed in as ${userProfile?.email || 'Google User'}`
                    : 'Sync your profile across devices'}
                </p>
              </div>
            </div>
            {!isGoogleLinked && (
              <button
                onClick={handleLinkGoogle}
                disabled={isLinkingGoogle}
                className="w-full bg-white text-zinc-800 py-3 rounded-xl font-semibold hover:bg-zinc-100 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLinkingGoogle ? (
                  <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                {isLinkingGoogle ? 'Linking...' : 'Link with Google'}
              </button>
            )}
          </div>

          {/* Settings Sections */}
          <div className="space-y-2">
            {settingsSections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full rounded-2xl p-4 text-left transition ${
                  darkMode ? 'bg-zinc-900 hover:bg-zinc-800' : 'bg-white hover:bg-amber-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    darkMode ? 'bg-zinc-800' : 'bg-amber-100'
                  }`}>
                    <section.icon className={`w-5 h-5 ${darkMode ? 'text-orange-500' : 'text-orange-600'}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold ${darkMode ? 'text-white' : 'text-zinc-900'}`}>{section.label}</p>
                    <p className={`text-sm ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{section.description}</p>
                  </div>
                  <ChevronRight className={`w-5 h-5 ${darkMode ? 'text-zinc-600' : 'text-zinc-400'}`} />
                </div>
              </button>
            ))}
          </div>

          {/* Admin Portal - Only for admins */}
          {isAdmin && (
            <button
              onClick={onOpenAdmin}
              className={`w-full rounded-2xl p-4 text-left ${darkMode ? 'bg-violet-500 bg-opacity-10' : 'bg-violet-50'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${darkMode ? 'bg-violet-500 bg-opacity-20' : 'bg-violet-100'}`}>
                  <Shield className="w-5 h-5 text-violet-500" />
                </div>
                <div className="flex-1">
                  <p className={`font-semibold ${darkMode ? 'text-violet-400' : 'text-violet-600'}`}>Admin Portal</p>
                  <p className={`text-sm ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Manage venues & events</p>
                </div>
                <ChevronRight className={`w-5 h-5 ${darkMode ? 'text-zinc-600' : 'text-zinc-400'}`} />
              </div>
            </button>
          )}

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className={`w-full rounded-2xl p-4 text-left ${
              darkMode ? 'bg-red-500 bg-opacity-10' : 'bg-red-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                darkMode ? 'bg-red-500 bg-opacity-20' : 'bg-red-100'
              }`}>
                <LogOut className="w-5 h-5 text-red-500" />
              </div>
              <p className="font-semibold text-red-500">Log Out</p>
            </div>
          </button>

          {/* App Version */}
          <p className={`text-center text-sm ${darkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>
            CrewQ v1.0.0 • Dallas Nightlife, Solved
          </p>
        </div>
      </div>
    </div>
  );
}

// Notification Preferences Modal
function NotificationPreferencesModal({ onClose, darkMode, userProfile, onSavePreferences }) {
  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem(`crewq_${userProfile?.id}_notification_prefs`);
    return saved ? JSON.parse(saved) : {
      squadActivity: true,
      friendActivity: true,
      eventReminders: true,
      venueUpdates: true,
      weeklyDigest: true,
      reminderTime: '1hour' // '1hour', '2hours', '30min'
    };
  });

  const handleToggle = (key) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    localStorage.setItem(`crewq_${userProfile?.id}_notification_prefs`, JSON.stringify(preferences));
    if (onSavePreferences) onSavePreferences(preferences);
    onClose();
  };

  const notificationTypes = [
    { 
      key: 'squadActivity', 
      icon: '👥', 
      title: 'Squad Activity', 
      description: 'When your squad is heading out or members update status'
    },
    { 
      key: 'friendActivity', 
      icon: '❤️', 
      title: 'Friend Activity', 
      description: 'When people you follow RSVP to events'
    },
    { 
      key: 'eventReminders', 
      icon: '⏰', 
      title: 'Event Reminders', 
      description: 'Reminder before events you\'ve RSVP\'d to'
    },
    { 
      key: 'venueUpdates', 
      icon: '🏢', 
      title: 'Venue Updates', 
      description: 'New events from venues you\'ve visited'
    },
    { 
      key: 'weeklyDigest', 
      icon: '📅', 
      title: 'Weekly Digest', 
      description: 'Friday summary of weekend events'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className={`${darkMode ? 'bg-zinc-900' : 'bg-white'} rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto`}>
        <div className={`sticky top-0 ${darkMode ? 'bg-zinc-900' : 'bg-white'} p-6 border-b ${darkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Notification Preferences</h2>
            <button onClick={onClose} className={darkMode ? 'text-zinc-400' : 'text-zinc-600'}>
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {notificationTypes.map(item => (
            <div key={item.key} className={`flex items-center justify-between p-4 rounded-xl ${darkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
              <div className="flex items-center gap-3 flex-1">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className={`font-semibold ${darkMode ? 'text-white' : 'text-zinc-900'}`}>{item.title}</p>
                  <p className={`text-sm ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{item.description}</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle(item.key)}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  preferences[item.key] ? 'bg-orange-500' : darkMode ? 'bg-zinc-600' : 'bg-zinc-300'
                }`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${
                  preferences[item.key] ? 'left-6' : 'left-1'
                }`} />
              </button>
            </div>
          ))}

          {/* Reminder Time Selector */}
          {preferences.eventReminders && (
            <div className={`p-4 rounded-xl ${darkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
              <p className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Remind me before events</p>
              <div className="flex gap-2">
                {[
                  { value: '30min', label: '30 min' },
                  { value: '1hour', label: '1 hour' },
                  { value: '2hours', label: '2 hours' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setPreferences(prev => ({ ...prev, reminderTime: opt.value }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                      preferences.reminderTime === opt.value
                        ? 'bg-orange-500 text-white'
                        : darkMode ? 'bg-zinc-700 text-zinc-300' : 'bg-white text-zinc-600'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleSave}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-bold hover:shadow-lg transition"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}

// Squad Chat Component
function SquadChat({ squad, userProfile, darkMode, onClose, supabaseClient, showToast }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const pollIntervalRef = useRef(null);

  const isLeader = squad?.created_by === userProfile?.id;

  // Quick status messages
  const quickStatuses = [
    { emoji: '🚗', text: 'On my way!' },
    { emoji: '⏰', text: 'Running late' },
    { emoji: '📍', text: 'I\'m here!' },
    { emoji: '❌', text: 'Can\'t make it' }
  ];

  // Load messages
  const loadMessages = async () => {
    if (!supabaseClient || !squad?.id) return;
    
    try {
      const { data, error } = await supabaseClient
        .from('squad_messages')
        .select('*, users(id, name, profile_picture, profile_visibility)')
        .eq('squad_id', squad.id)
        .order('created_at', { ascending: true })
        .limit(100);
      
      if (!error && data) {
        setMessages(data);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
    }
    setLoading(false);
  };

  // Poll for new messages every 5 seconds
  useEffect(() => {
    loadMessages();
    pollIntervalRef.current = setInterval(loadMessages, 5000);
    
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [squad?.id]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text, imageUrl = null) => {
    if (!supabaseClient || !userProfile?.id || (!text.trim() && !imageUrl)) return;
    
    setSending(true);
    try {
      const { error } = await supabaseClient
        .from('squad_messages')
        .insert([{
          squad_id: squad.id,
          user_id: userProfile.id,
          message: text.trim(),
          image_url: imageUrl,
          is_status: false,
          created_at: new Date().toISOString()
        }]);
      
      if (error) {
        console.error('Send error:', error);
        if (showToast) showToast('Could not send message — try again', 'error');
      } else {
        setNewMessage('');
        await loadMessages();
      }
    } catch (err) {
      console.error('Error sending message:', err);
      if (showToast) showToast('Could not send message — try again', 'error');
    }
    setSending(false);
  };

  const sendQuickStatus = async (status) => {
    if (!supabaseClient || !userProfile?.id) return;
    
    try {
      await supabaseClient
        .from('squad_messages')
        .insert([{
          squad_id: squad.id,
          user_id: userProfile.id,
          message: `${status.emoji} ${status.text}`,
          is_status: true,
          created_at: new Date().toISOString()
        }]);
      
      await loadMessages();
    } catch (err) {
      console.error('Error sending status:', err);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      // For MVP, convert to base64 and store inline
      // In production, upload to Supabase Storage
      const reader = new FileReader();
      reader.onloadend = async () => {
        await sendMessage('', reader.result);
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error uploading image:', err);
      setUploadingImage(false);
    }
  };

  const deleteMessage = async (messageId) => {
    if (!supabaseClient || !isLeader) return;
    
    try {
      await supabaseClient
        .from('squad_messages')
        .delete()
        .eq('id', messageId);
      
      await loadMessages();
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  const pinMessage = async (messageId) => {
    if (!supabaseClient || !isLeader) return;
    
    try {
      // Unpin all other messages first
      await supabaseClient
        .from('squad_messages')
        .update({ is_pinned: false })
        .eq('squad_id', squad.id);
      
      // Pin this message
      await supabaseClient
        .from('squad_messages')
        .update({ is_pinned: true })
        .eq('id', messageId);
      
      await loadMessages();
    } catch (err) {
      console.error('Error pinning message:', err);
    }
  };

  const pinnedMessage = messages.find(m => m.is_pinned);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className={`${darkMode ? 'bg-zinc-900' : 'bg-white'} rounded-3xl max-w-md w-full h-[85vh] flex flex-col`}>
        {/* Header */}
        <div className={`p-4 border-b ${darkMode ? 'border-zinc-800' : 'border-zinc-200'} flex items-center justify-between`}>
          <div>
            <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-zinc-900'}`}>{squad.name}</h3>
            <p className={`text-sm ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Squad Chat</p>
          </div>
          <button onClick={onClose} className={darkMode ? 'text-zinc-400' : 'text-zinc-600'}>
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Pinned Message */}
        {pinnedMessage && (
          <div className={`px-4 py-2 ${darkMode ? 'bg-orange-500/10 border-orange-500/30' : 'bg-orange-50 border-orange-200'} border-b`}>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-orange-500">📌</span>
              <span className={darkMode ? 'text-orange-300' : 'text-orange-700'}>{pinnedMessage.message}</span>
            </div>
          </div>
        )}

        {/* Quick Status Buttons */}
        <div className={`px-4 py-2 border-b ${darkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <div className="flex gap-2 overflow-x-auto">
            {quickStatuses.map((status, idx) => (
              <button
                key={idx}
                onClick={() => sendQuickStatus(status)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition ${
                  darkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                <span>{status.emoji}</span>
                <span>{status.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageCircle className={`w-12 h-12 ${darkMode ? 'text-zinc-700' : 'text-zinc-300'} mb-3`} />
              <p className={darkMode ? 'text-zinc-500' : 'text-zinc-400'}>No messages yet</p>
              <p className={`text-sm ${darkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>Start the conversation!</p>
            </div>
          ) : (
            messages.map(msg => {
              const isOwn = msg.user_id === userProfile?.id;
              const userName = msg.users?.profile_visibility === 'public' || isOwn 
                ? msg.users?.name?.split(' ')[0] 
                : 'Member';
              
              return (
                <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] ${msg.is_status ? 'w-full' : ''}`}>
                    {msg.is_status ? (
                      <div className={`text-center py-2 text-sm ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        <span className="font-medium">{userName}</span> {msg.message}
                      </div>
                    ) : (
                      <div className={`rounded-2xl px-4 py-2 ${
                        isOwn 
                          ? 'bg-orange-500 text-white rounded-br-md' 
                          : darkMode ? 'bg-zinc-800 text-white rounded-bl-md' : 'bg-zinc-100 text-zinc-900 rounded-bl-md'
                      }`}>
                        {!isOwn && (
                          <p className={`text-xs font-semibold mb-1 ${isOwn ? 'text-orange-200' : darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                            {userName}
                          </p>
                        )}
                        {msg.image_url && (
                          <img src={msg.image_url} alt="Shared" className="rounded-lg max-w-full mb-2" />
                        )}
                        {msg.message && <p>{msg.message}</p>}
                        <p className={`text-xs mt-1 ${isOwn ? 'text-orange-200' : darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    )}
                    
                    {/* Leader actions */}
                    {isLeader && !isOwn && !msg.is_status && (
                      <div className="flex gap-2 mt-1">
                        <button onClick={() => pinMessage(msg.id)} className="text-xs text-zinc-500 hover:text-orange-500">📌 Pin</button>
                        <button onClick={() => deleteMessage(msg.id)} className="text-xs text-zinc-500 hover:text-red-500">🗑️ Delete</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className={`p-4 border-t ${darkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              className={`p-2 rounded-full transition ${darkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-600'}`}
            >
              {uploadingImage ? (
                <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="w-5 h-5" />
              )}
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(newMessage)}
              placeholder="Message your squad..."
              className={`flex-1 px-4 py-2 rounded-full outline-none ${
                darkMode ? 'bg-zinc-800 text-white placeholder-zinc-500' : 'bg-zinc-100 text-zinc-900 placeholder-zinc-400'
              }`}
            />
            <button
              onClick={() => sendMessage(newMessage)}
              disabled={!newMessage.trim() || sending}
              className="p-2 bg-orange-500 text-white rounded-full disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Leaderboard Component
function LeaderboardModal({ onClose, darkMode, userProfile, supabaseClient }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('allTime'); // 'weekly', 'monthly', 'allTime'
  const [userRank, setUserRank] = useState(null);

  useEffect(() => {
    loadLeaderboard();
  }, [timeframe]);

  const loadLeaderboard = async () => {
    if (!supabaseClient) return;
    setLoading(true);
    
    try {
      // Get all users with their badges for points calculation
      const { data: users } = await supabaseClient
        .from('users')
        .select('id, name, profile_picture, profile_visibility')
        .limit(100);

      const { data: allBadges } = await supabaseClient
        .from('user_badges')
        .select('user_id, badge_id, created_at');

      // Calculate points for each user
      const userPoints = (users || []).map(user => {
        let badges = (allBadges || []).filter(b => b.user_id === user.id);
        
        // Filter by timeframe
        if (timeframe === 'weekly') {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          badges = badges.filter(b => new Date(b.created_at) > weekAgo);
        } else if (timeframe === 'monthly') {
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          badges = badges.filter(b => new Date(b.created_at) > monthAgo);
        }

        const points = badges.reduce((sum, b) => {
          const badge = BADGES.find(badge => badge.id === b.badge_id);
          return sum + (badge?.points || 0);
        }, 0);

        return {
          ...user,
          points,
          badgeCount: badges.length
        };
      });

      // Sort by points
      userPoints.sort((a, b) => b.points - a.points);

      // Find user's rank
      const myRank = userPoints.findIndex(u => u.id === userProfile?.id) + 1;
      setUserRank(myRank || null);

      setLeaderboard(userPoints.slice(0, 50));
    } catch (err) {
      console.error('Error loading leaderboard:', err);
    }
    setLoading(false);
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className={`${darkMode ? 'bg-zinc-900' : 'bg-white'} rounded-3xl max-w-md w-full max-h-[85vh] flex flex-col`}>
        {/* Header */}
        <div className={`p-6 border-b ${darkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-zinc-900'}`}>🏆 Leaderboard</h2>
            <button onClick={onClose} className={darkMode ? 'text-zinc-400' : 'text-zinc-600'}>
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Timeframe Toggle */}
          <div className="flex gap-2">
            {[
              { id: 'weekly', label: 'This Week' },
              { id: 'monthly', label: 'This Month' },
              { id: 'allTime', label: 'All Time' }
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => setTimeframe(opt.id)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                  timeframe === opt.id
                    ? 'bg-orange-500 text-white'
                    : darkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Your Rank */}
        {userRank && (
          <div className={`mx-6 mt-4 p-4 rounded-xl ${darkMode ? 'bg-orange-500/10 border border-orange-500/30' : 'bg-orange-50 border border-orange-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getRankIcon(userRank)}</span>
                <div>
                  <p className={`font-semibold ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Your Rank</p>
                  <p className={`text-sm ${darkMode ? 'text-orange-300' : 'text-orange-600'}`}>
                    {leaderboard.find(u => u.id === userProfile?.id)?.points || 0} points
                  </p>
                </div>
              </div>
              <span className={`text-2xl font-bold ${darkMode ? 'text-orange-400' : 'text-orange-500'}`}>
                #{userRank}
              </span>
            </div>
          </div>
        )}

        {/* Leaderboard List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((user, idx) => {
                const rank = idx + 1;
                const isCurrentUser = user.id === userProfile?.id;
                const displayName = user.profile_visibility === 'public' || isCurrentUser
                  ? user.name
                  : 'Anonymous';
                
                return (
                  <div
                    key={user.id}
                    className={`flex items-center gap-3 p-3 rounded-xl transition ${
                      isCurrentUser
                        ? darkMode ? 'bg-orange-500/20 border border-orange-500/30' : 'bg-orange-100 border border-orange-300'
                        : darkMode ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-100 hover:bg-zinc-200'
                    }`}
                  >
                    <span className={`w-8 text-center font-bold ${rank <= 3 ? 'text-xl' : darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      {getRankIcon(rank)}
                    </span>
                    
                    <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center overflow-hidden">
                      {user.profile_picture ? (
                        <img src={user.profile_picture} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white">{displayName.charAt(0)}</span>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <p className={`font-semibold ${darkMode ? 'text-white' : 'text-zinc-900'}`}>
                        {displayName} {isCurrentUser && <span className="text-orange-500">(You)</span>}
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        {user.badgeCount} badges
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className={`font-bold ${darkMode ? 'text-orange-400' : 'text-orange-500'}`}>
                        {user.points}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>points</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Notifications Modal
function NotificationsModal({ 
  onClose, 
  darkMode, 
  notifications, 
  pendingJoinRequests, 
  onReviewRequest,
  onCheckIn,
  onEventClick,
  onClearAll
}) {
  const totalNotifs = notifications.length + pendingJoinRequests.length;

  const handleNotificationClick = (notif) => {
    if (notif.event && onEventClick) {
      onEventClick(notif.event);
      onClose();
    }
  };

  return (
    <div className={`fixed inset-0 z-50 ${darkMode ? 'bg-black bg-opacity-90' : 'bg-white bg-opacity-95'}`}>
      <div className={`h-full max-w-md mx-auto ${darkMode ? 'bg-zinc-950' : 'bg-amber-50'}`}>
        {/* Header */}
        <div className={`sticky top-0 z-10 px-4 py-4 border-b ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Notifications</h2>
            <div className="flex items-center gap-3">
              {notifications.length > 0 && (
                <button 
                  onClick={onClearAll}
                  className="text-orange-500 text-sm font-semibold hover:text-orange-400 transition"
                >
                  Clear All
                </button>
              )}
              <button onClick={onClose} className={darkMode ? 'text-zinc-400' : 'text-zinc-600'}>
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 80px)' }}>
          {/* Pending Join Requests */}
          {pendingJoinRequests.length > 0 && (
            <div>
              <h3 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Squad Requests ({pendingJoinRequests.length})
              </h3>
              <div className="space-y-2">
                {pendingJoinRequests.map(request => (
                  <button
                    key={request.id}
                    onClick={() => onReviewRequest(request)}
                    className={`w-full rounded-2xl p-4 text-left transition ${
                      darkMode ? 'bg-orange-500 bg-opacity-10 border border-orange-500 border-opacity-30' : 'bg-orange-50 border border-orange-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden ${
                        darkMode ? 'bg-zinc-800' : 'bg-orange-100'
                      }`}>
                        {request.user?.profile_picture ? (
                          <img src={request.user.profile_picture} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-orange-600'}`}>
                            {request.user?.name?.charAt(0).toUpperCase() || '?'}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`font-semibold ${darkMode ? 'text-white' : 'text-zinc-900'}`}>
                          {request.user?.name} wants to join
                        </p>
                        <p className={`text-sm ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                          {request.squad?.name}
                        </p>
                      </div>
                      <div className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                        Review
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Other Notifications */}
          {notifications.length > 0 && (
            <div>
              <h3 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Activity
              </h3>
              <div className="space-y-2">
                {notifications.map(notif => (
                  <button
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    disabled={!notif.event}
                    className={`w-full rounded-2xl p-4 text-left transition ${
                      notif.priority 
                        ? (darkMode ? 'bg-emerald-500 bg-opacity-10 border border-emerald-500 border-opacity-30' : 'bg-emerald-50 border border-emerald-200')
                        : (darkMode ? 'bg-zinc-900' : 'bg-white')
                    } ${notif.event ? 'hover:bg-opacity-80 cursor-pointer' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        notif.type === 'checkin_reminder' 
                          ? 'bg-emerald-500 bg-opacity-20' 
                          : notif.type === 'event_reminder'
                          ? 'bg-orange-500 bg-opacity-20'
                          : notif.type === 'squad_request_approved'
                          ? 'bg-emerald-500 bg-opacity-20'
                          : notif.type === 'squad_request_declined'
                          ? 'bg-red-500 bg-opacity-20'
                          : 'bg-zinc-800'
                      }`}>
                        {notif.type === 'checkin_reminder' ? (
                          <MapPin className="w-5 h-5 text-emerald-500" />
                        ) : notif.type === 'event_reminder' ? (
                          <Calendar className="w-5 h-5 text-orange-500" />
                        ) : notif.type === 'badge_earned' ? (
                          <Trophy className="w-5 h-5 text-yellow-500" />
                        ) : notif.type === 'squad_request_approved' ? (
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                        ) : notif.type === 'squad_request_declined' ? (
                          <X className="w-5 h-5 text-red-500" />
                        ) : (
                          <Bell className="w-5 h-5 text-zinc-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`font-semibold ${darkMode ? 'text-white' : 'text-zinc-900'}`}>{notif.title}</p>
                        <p className={`text-sm ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{notif.message}</p>
                        <p className={`text-xs mt-1 ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>{notif.time}</p>
                        
                        {notif.type === 'checkin_reminder' && notif.event && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onCheckIn(notif.event);
                            }}
                            className="mt-2 bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                          >
                            Check In Now
                          </button>
                        )}
                        
                        {notif.event && notif.type !== 'checkin_reminder' && (
                          <p className="text-xs text-orange-500 mt-2">Tap to view event →</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {totalNotifs === 0 && (
            <div className="text-center py-12">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                darkMode ? 'bg-zinc-800' : 'bg-amber-100'
              }`}>
                <Bell className={`w-8 h-8 ${darkMode ? 'text-zinc-600' : 'text-amber-400'}`} />
              </div>
              <p className={`font-semibold ${darkMode ? 'text-white' : 'text-zinc-900'}`}>All caught up!</p>
              <p className={`text-sm ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                No new notifications right now
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Profile Preview for squad leaders reviewing join requests
function ProfilePreviewModal({ user, onClose, onApprove, onReject, rejectionReasons }) {
  const [showRejectOptions, setShowRejectOptions] = useState(false);
  const [selectedReason, setSelectedReason] = useState(null);

  const handleReject = () => {
    if (!selectedReason) {
      return;
    }
    onReject(user, selectedReason);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-zinc-900 rounded-3xl max-w-sm w-full max-h-[90vh] overflow-y-auto my-auto">
        <div className="sticky top-0 bg-zinc-900 rounded-t-3xl z-10 p-6 pb-0">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">Join Request</h3>
            <button onClick={onClose} className="text-zinc-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 pt-2">
          {/* Profile Preview */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 rounded-full bg-zinc-800 mx-auto mb-4 flex items-center justify-center overflow-hidden">
              {user?.profile_picture ? (
                <img src={user.profile_picture} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-white">
                  {user?.name?.charAt(0).toUpperCase() || '?'}
                </span>
              )}
            </div>
            <h4 className="text-xl font-bold text-white mb-2">{user?.name}</h4>
            
            {/* Gender - More Prominent */}
            {user?.gender && (
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-2 ${
                user.gender === 'woman' ? 'bg-pink-500 bg-opacity-20 text-pink-400 border border-pink-500 border-opacity-30' :
                user.gender === 'man' ? 'bg-blue-500 bg-opacity-20 text-blue-400 border border-blue-500 border-opacity-30' :
                'bg-zinc-700 text-zinc-400'
              }`}>
                <span className="text-lg">
                  {user.gender === 'woman' ? '♀' : user.gender === 'man' ? '♂' : ''}
                </span>
                <span>
                  {user.gender === 'woman' ? 'Woman' : 
                   user.gender === 'man' ? 'Man' : 
                   'Not specified'}
                </span>
              </div>
            )}
            
            {/* Age */}
            {user?.show_age_to_squads !== false && user?.age && (
              <p className="text-zinc-400 text-sm">{user.age} years old</p>
            )}
          </div>

          {/* Bio */}
          {user?.bio && (
            <div className="bg-zinc-800 rounded-xl p-4 mb-4">
              <p className="text-sm text-zinc-300">{user.bio}</p>
            </div>
          )}

          {/* Vibes */}
          {user?.vibes && user.vibes.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-semibold text-zinc-400 mb-2">Vibes</p>
              <div className="flex flex-wrap gap-2">
                {user.vibes.map(vibe => {
                  const vibeOption = VIBE_OPTIONS.find(v => v.id === vibe);
                  return vibeOption ? (
                    <span key={vibe} className="bg-zinc-800 text-zinc-300 px-3 py-1 rounded-full text-sm">
                      {vibeOption.icon} {vibeOption.label?.replace(vibeOption.icon, '').trim()}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Badge Count */}
          <div className="flex items-center gap-2 mb-6 text-zinc-400">
            <Trophy className="w-4 h-4" />
            <span className="text-sm">{user?.badge_count || 0} badges earned</span>
          </div>

          {!showRejectOptions ? (
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectOptions(true)}
                className="flex-1 bg-zinc-800 text-zinc-400 py-3 rounded-xl font-semibold hover:bg-zinc-700 transition"
              >
                Decline
              </button>
              <button
                onClick={() => onApprove(user)}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition"
              >
                Approve
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-zinc-400">Select a reason:</p>
              {REJECTION_REASONS.map(reason => (
                <button
                  key={reason.id}
                  onClick={() => setSelectedReason(reason.id)}
                  className={`w-full p-3 rounded-xl text-left text-sm transition ${
                    selectedReason === reason.id
                      ? 'bg-orange-500 bg-opacity-20 border-2 border-orange-500 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {reason.label}
                </button>
              ))}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowRejectOptions(false)}
                  className="flex-1 bg-zinc-800 text-zinc-400 py-3 rounded-xl font-semibold hover:bg-zinc-700 transition"
                >
                  Back
                </button>
                <button
                  onClick={handleReject}
                  disabled={!selectedReason}
                  className="flex-1 bg-red-500 text-white py-3 rounded-xl font-semibold hover:bg-red-600 transition disabled:opacity-50"
                >
                  Confirm Decline
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SoloFriendlySquadsView({ squads, onSquadClick, userProfile }) {
  // Filter squads based on user's eligibility
  const soloSquads = squads.filter(s => {
    if (!s.is_solo_friendly) return false;
    
    // Check gender restriction
    if (s.gender_restriction && s.gender_restriction !== 'all') {
      const userGender = userProfile?.gender;
      if (s.gender_restriction === 'women-only' && userGender !== 'woman') return false;
      if (s.gender_restriction === 'men-only' && userGender !== 'man') return false;
    }
    
    // Check age restriction
    const userAge = userProfile?.age;
    if (s.min_age && userAge && userAge < s.min_age) return false;
    if (s.max_age && userAge && userAge > s.max_age) return false;
    
    // Check badge restriction - we'd need to pass userBadges, simplified for now
    // if (s.min_badges && (userBadges?.length || 0) < s.min_badges) return false;
    
    return true;
  });

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

function EventDetailModal({ event, onClose, onCheckIn, isCheckedIn, checkInCount, userProfile, historicalCount = 0, onRSVP, onUndoRSVP, hasRSVPed, showPostRsvp = false, onClearPostRsvp }) {
  const [checking, setChecking] = useState(false);
  const [rsvping, setRsvping] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Patch C — Post-RSVP follow-up: show calendar + bring-a-friend prompts inline after a successful RSVP
  // showPostRsvp comes from parent (set when handleRSVP succeeds for THIS event)
  // Calendar export: build a Google Calendar URL with the event details
  const buildCalendarUrl = () => {
    if (!event?.date || !event?.time) return null;
    try {
      const start = new Date(`${event.date}T${event.time}`);
      const end = event.end_time ? new Date(`${event.date}T${event.end_time}`) : new Date(start.getTime() + 2 * 60 * 60 * 1000);
      const fmt = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
      const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: event.name || 'CrewQ Event',
        dates: `${fmt(start)}/${fmt(end)}`,
        details: `${event.description || ''}\n\nFound on CrewQ: https://crewq-app.vercel.app`,
        location: [event.venue, event.address, event.neighborhood].filter(Boolean).join(', ')
      });
      return `https://calendar.google.com/calendar/render?${params.toString()}`;
    } catch {
      return null;
    }
  };

  // Bring-a-friend SMS — opens native SMS with pre-filled message
  const buildFriendSmsHref = () => {
    if (!event) return '#';
    const dateStr = event.date && event.time ? new Date(`${event.date}T${event.time}`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
    const body = `Hey, want to come to ${event.name}${event.venue ? ` at ${event.venue}` : ''}${dateStr ? ` on ${dateStr}` : ''}? I just RSVP'd on CrewQ — https://crewq-app.vercel.app`;
    return `sms:&body=${encodeURIComponent(body)}`;
  };

  // Get all images - support both single image_url and image_urls array
  const getAllImages = () => {
    const images = [];
    if (event.image_url) images.push(event.image_url);
    if (event.image_urls && Array.isArray(event.image_urls)) {
      event.image_urls.forEach(url => {
        if (url && !images.includes(url)) images.push(url);
      });
    }
    if (event.additional_images && Array.isArray(event.additional_images)) {
      event.additional_images.forEach(url => {
        if (url && !images.includes(url)) images.push(url);
      });
    }
    return images.length > 0 ? images : ['https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800'];
  };
  
  const images = getAllImages();
  const hasMultipleImages = images.length > 1;

  const handleCheckIn = async () => {
    setChecking(true);
    await onCheckIn(event);
    setChecking(false);
  };

  const handleRSVPClick = async () => {
    if (!onRSVP) return;
    setRsvping(true);
    await onRSVP(event);
    setRsvping(false);
  };

  const handleUndoRSVPClick = async () => {
    if (!onUndoRSVP) return;
    setRsvping(true);
    await onUndoRSVP(event);
    setRsvping(false);
  };

  const isRSVPed = hasRSVPed && hasRSVPed(event.id);

  // Get ambience details if available
  const ambience = event.ambience ? AMBIENCE_OPTIONS.find(a => a.id === event.ambience) : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-3xl max-w-md w-full overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Image Carousel */}
        <div className="relative h-64">
          <img src={images[currentImageIndex]} alt={event.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
          
          {/* Carousel Navigation */}
          {hasMultipleImages && (
            <>
              <button
                onClick={() => setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              {/* Dots Indicator */}
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-2 h-2 rounded-full transition ${
                      idx === currentImageIndex ? 'bg-white' : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-zinc-900 bg-opacity-80 rounded-full p-2 hover:bg-opacity-100 transition"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          
          <div className="absolute top-4 left-4 flex gap-2">
            <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase">
              {event.category?.replace('-', ' ') || 'Event'}
            </div>
            {ambience && (
              <div className={`${ambience.color} text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1`}>
                <span>{ambience.icon}</span>
                <span>{ambience.label}</span>
              </div>
            )}
          </div>

          {(event.age_tag === '21+' || event.age_restriction === '21+') && (
            <div className="absolute top-4 right-14 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
              21+
            </div>
          )}
          {(event.age_tag === '18+' || event.age_restriction === '18+') && (
            <div className="absolute top-4 right-14 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold">
              18+
            </div>
          )}
        </div>

        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-2">{event.name}</h2>
          <p className="text-zinc-400 text-sm mb-4">{event.description}</p>
          
          <div className="space-y-3 mb-4">
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
                <Users className="w-4 h-4 text-emerald-500" />
                <span>{checkInCount} {checkInCount === 1 ? 'person' : 'people'} checked in now</span>
              </div>
            )}
            {historicalCount > 0 && (
              <div className="flex items-center gap-2 text-zinc-400 text-sm">
                <CheckCircle className="w-4 h-4 text-zinc-500" />
                <span>{historicalCount} {historicalCount === 1 ? 'person has' : 'people have'} attended in the past</span>
              </div>
            )}
          </div>

          {/* Website and Menu Links */}
          {(event.website_url || event.menu_url) && (
            <div className="flex gap-2 mb-6">
              {event.website_url && (
                <a
                  href={event.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition"
                >
                  <Globe className="w-4 h-4" />
                  Website
                  <ExternalLink className="w-3 h-3 text-zinc-400" />
                </a>
              )}
              {event.menu_url && (
                <a
                  href={event.menu_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition"
                >
                  <UtensilsCrossed className="w-4 h-4" />
                  Menu
                  <ExternalLink className="w-3 h-3 text-zinc-400" />
                </a>
              )}
            </div>
          )}

          {/* RSVP Button */}
          {onRSVP && (
            <div className="mb-3">
              {isRSVPed ? (
                <div className="space-y-2">
                  <div className="bg-emerald-500 bg-opacity-20 border-2 border-emerald-500 text-emerald-400 py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    RSVP Confirmed!
                  </div>
                  {/* Patch C — Post-RSVP follow-up sheet (calendar + bring a friend) */}
                  {showPostRsvp && (
                    <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-4 space-y-3">
                      <p className="text-sm font-semibold text-white">🎉 Locked in! What's next?</p>
                      <div className="grid grid-cols-2 gap-2">
                        {buildCalendarUrl() && (
                          <a
                            href={buildCalendarUrl()}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => onClearPostRsvp && onClearPostRsvp()}
                            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition text-center"
                          >
                            <Calendar className="w-5 h-5 text-violet-400" />
                            <span className="text-xs text-white font-semibold">Add to Calendar</span>
                          </a>
                        )}
                        <a
                          href={buildFriendSmsHref()}
                          onClick={() => onClearPostRsvp && onClearPostRsvp()}
                          className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition text-center"
                        >
                          <UserPlus className="w-5 h-5 text-violet-400" />
                          <span className="text-xs text-white font-semibold">Bring a Friend</span>
                        </a>
                      </div>
                      <button
                        onClick={() => onClearPostRsvp && onClearPostRsvp()}
                        className="w-full text-xs text-zinc-500 hover:text-zinc-300 transition py-1"
                      >
                        Skip for now
                      </button>
                    </div>
                  )}
                  {onUndoRSVP && (
                    <button
                      onClick={handleUndoRSVPClick}
                      disabled={rsvping}
                      className="w-full py-2 text-zinc-400 text-sm hover:text-red-400 transition flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      {rsvping ? 'Cancelling...' : 'Cancel RSVP'}
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleRSVPClick}
                  disabled={rsvping}
                  className="w-full bg-gradient-to-r from-violet-500 to-purple-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Calendar className="w-5 h-5" />
                  {rsvping ? 'RSVPing...' : 'RSVP to This Event'}
                </button>
              )}
            </div>
          )}

          {/* Patch C2a — Check-In only renders when the event is actually happening
             (between -30min before start and end_time, or 4h after start if no end_time).
             Future events: no Check-In button (you can't check in to next week's trivia).
             Past events: also hidden. */}
          {(() => {
            if (!event?.date || !event?.time) return null;
            const now = new Date();
            const start = new Date(`${event.date}T${event.time}`);
            const end = event.end_time
              ? new Date(`${event.date}T${event.end_time}`)
              : new Date(start.getTime() + 4 * 60 * 60 * 1000);
            // Allow check-in 30 minutes before start
            const checkInOpen = new Date(start.getTime() - 30 * 60 * 1000);
            const isActive = now >= checkInOpen && now <= end;
            if (!isActive && !isCheckedIn) return null; // hide button entirely for non-active events
            // Already checked-in users always see the confirmation
            return isCheckedIn ? (
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
            );
          })()}
        </div>
      </div>
    </div>
  );
}

function EventSuggestionModal({ onClose, userProfile, supabaseClient, userBadges = [], showToast }) {
  // Patch 5 — Gate: requires MIN_BADGES_TO_SUBMIT badges
  const earnedCount = Array.isArray(userBadges) ? userBadges.length : 0;
  const isUnlocked = earnedCount >= MIN_BADGES_TO_SUBMIT;

  const [venueName, setVenueName] = useState('');
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [ageTag, setAgeTag] = useState('21+');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Patch A — Use shared image library; legacy alias for fallback default
  const quickImages = STOCK_IMAGE_FLAT;

  const ageTagToRestriction = (tag) => {
    if (tag === '21+' || tag === 'date-night') return '21+';
    if (tag === '18+') return '18+';
    return 'all';
  };

  const handleSubmit = async () => {
    if (!isUnlocked) return;
    if (!venueName.trim() || !eventName.trim() || !eventDate || !eventTime || !neighborhood) {
      if (showToast) showToast('Please fill in all required fields', 'error');
      else alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      // Patch A — Geocode the venue address
      let geoLat = null, geoLng = null;
      const geo = await geocodeAddress(buildAddressString({
        address: venueName.trim(), // Best guess — venueName + neighborhood + city
        neighborhood: neighborhood,
        city: 'Dallas'
      }));
      if (geo) { geoLat = geo.latitude; geoLng = geo.longitude; }
      
      if (supabaseClient) {
        // Insert directly into events as pending — admin sees it in approval queue
        const { error } = await supabaseClient
          .from('events')
          .insert([{
            name: eventName.trim(),
            venue: venueName.trim(),
            neighborhood: neighborhood,
            date: eventDate,
            time: eventTime,
            description: description.trim() || null,
            image_url: imageUrl || quickImages[0].url,
            age_tag: ageTag,
            age_restriction: ageTagToRestriction(ageTag),
            kid_friendly: ageTag === 'kid-friendly',
            date_night: ageTag === 'date-night',
            status: 'pending',
            submitted_by_user_id: userProfile?.id || null,
            // Patch A — geocoded location
            latitude: geoLat,
            longitude: geoLng,
            views: 0,
            rsvps: 0,
            checkins: 0
          }]);
        if (error) throw error;
      }
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting event:', error);
      if (showToast) showToast('Could not submit — try again', 'error');
      else alert('Error submitting. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Locked state — under 3 badges
  if (!isUnlocked) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
        <div className="bg-zinc-900 rounded-3xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Submit an Event</h2>
            <button onClick={onClose} className="text-zinc-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="text-center py-6">
            <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🔒</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Earn {MIN_BADGES_TO_SUBMIT} badges to unlock</h3>
            <p className="text-zinc-400 text-sm mb-6">
              Active CrewQ users can submit events for review. You've earned <span className="text-orange-400 font-semibold">{earnedCount} of {MIN_BADGES_TO_SUBMIT}</span> badges so far.
            </p>
            <div className="bg-zinc-800 rounded-xl p-4 mb-6">
              <div className="w-full h-2 bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all"
                  style={{ width: `${Math.min((earnedCount / MIN_BADGES_TO_SUBMIT) * 100, 100)}%` }}
                />
              </div>
              <p className="text-zinc-500 text-xs mt-2">{MIN_BADGES_TO_SUBMIT - earnedCount} badge{MIN_BADGES_TO_SUBMIT - earnedCount !== 1 ? 's' : ''} to go</p>
            </div>
            <p className="text-zinc-500 text-xs mb-6">Earn badges by completing your profile, swiping events, joining squads, and checking in to events.</p>
            <button
              onClick={onClose}
              className="w-full bg-zinc-800 text-white py-3 rounded-xl font-semibold hover:bg-zinc-700 transition"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
        <div className="bg-zinc-900 rounded-3xl max-w-md w-full p-6 text-center">
          <div className="w-16 h-16 bg-emerald-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Submitted for review!</h2>
          <p className="text-zinc-400 mb-6">An admin will review your event. You'll get a notification once it's approved or rejected.</p>
          <button
            onClick={onClose}
            className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600 transition"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-3xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-white">Submit an Event</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        <p className="text-zinc-500 text-xs mb-6">Your submission will be reviewed before going live. Keep it accurate so the community can trust it.</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-zinc-400 mb-2">Event Name *</label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="e.g. Live Jazz Night"
              className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-400 mb-2">Venue *</label>
            <input
              type="text"
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              placeholder="e.g. The Rustic"
              className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-400 mb-2">Neighborhood *</label>
            <select
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Select neighborhood</option>
              {DALLAS_NEIGHBORHOODS.map(n => <option key={n.id} value={n.name}>{n.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-zinc-400 mb-2">Date *</label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-zinc-400 mb-2">Time *</label>
              <input
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-400 mb-2">Age</label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all-ages',     label: 'All Ages',     emoji: '👨‍👩‍👧' },
                { id: 'kid-friendly', label: 'Kid-friendly', emoji: '👶' },
                { id: '18+',          label: '18+',          emoji: '🔞' },
                { id: '21+',          label: '21+',          emoji: '🍻' },
                { id: 'date-night',   label: 'Date Night',   emoji: '💕' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setAgeTag(t.id)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition ${
                    ageTag === t.id ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-300'
                  }`}
                >{t.emoji} {t.label}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-400 mb-2">Image</label>
            <ImagePicker value={imageUrl} onChange={setImageUrl} darkMode={true} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-400 mb-2">What's it about?</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A few words about the event"
              rows={3}
              className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <p className="text-amber-400 text-xs">
              ⚠️ Only submit events you genuinely know about. False or misleading submissions may result in losing submission privileges.
            </p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3 rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit for Review'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Patch B — Vertical-scroll TikTok-style card for the Discover feed.
// Patch C — Full-viewport: image fills the entire card, content overlays bottom with gradient.
// Card itself is tappable (opens detail). Save + Pass are corner icons. RSVP lives in detail view.
function EventFeedCard({
  event,
  isSaved,
  vibeMatch,
  goingCount,
  darkMode = true,
  onCardTap,   // tap anywhere on the card opens detail
  onSave,
  onPass,
  onView,      // (event, durationMs) — fires on scroll-out
  cardHeight,  // Patch C2a — exact pixel height matching scroll container
}) {
  const cardRef = useRef(null);
  // Track total ms this card has been ≥50% visible
  const viewStateRef = useRef({
    visibleSince: null,
    accumulatedMs: 0,
    hasBeenLogged: false,
  });

  // Patch B.2 — IntersectionObserver tracks accumulated view-duration.
  useEffect(() => {
    if (!cardRef.current) return;

    const flush = (final = false) => {
      const s = viewStateRef.current;
      if (s.visibleSince != null) {
        s.accumulatedMs += Date.now() - s.visibleSince;
        s.visibleSince = null;
      }
      if (!s.hasBeenLogged && s.accumulatedMs >= FEED_CARD_VIEW_MS_MIN) {
        s.hasBeenLogged = true;
        if (onView) onView(event, s.accumulatedMs);
      } else if (final && !s.hasBeenLogged && s.accumulatedMs > 0) {
        s.hasBeenLogged = true;
        if (onView) onView(event, s.accumulatedMs);
      }
    };

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const isVisible = entry.isIntersecting && entry.intersectionRatio >= 0.5;
        const s = viewStateRef.current;
        if (isVisible && s.visibleSince == null) {
          s.visibleSince = Date.now();
        } else if (!isVisible && s.visibleSince != null) {
          flush(false);
        }
      });
    }, { threshold: [0, 0.5, 1] });

    obs.observe(cardRef.current);

    return () => {
      obs.disconnect();
      flush(true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.id]);

  // Format date as "Today" / "Tomorrow" / weekday / "Mon, May 5"
  const formatEventDate = (dateStr) => {
    if (!dateStr) return '';
    const evt = new Date(dateStr + 'T00:00:00');
    if (isNaN(evt.getTime())) return dateStr;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const inAWeek = new Date(today);
    inAWeek.setDate(inAWeek.getDate() + 7);
    if (evt.getTime() === today.getTime()) return 'Today';
    if (evt.getTime() === tomorrow.getTime()) return 'Tomorrow';
    if (evt < inAWeek) return evt.toLocaleDateString('en-US', { weekday: 'long' });
    return evt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatEventTime = (timeStr) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h, 10);
    if (isNaN(hour)) return timeStr;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${m || '00'} ${ampm}`;
  };

  const ageTag = event.age_tag || event.age_restriction;
  const showAgeBadge = ageTag === '21+' || ageTag === '18+';
  const isFree = !event.cover_charge || parseFloat(event.cover_charge) === 0;

  // Truncate description aggressively — single line max in overlay
  const shortDesc = event.description
    ? (event.description.length > 90 ? event.description.slice(0, 90).trim() + '…' : event.description)
    : null;

  // Stop propagation on icon taps so they don't trigger the card-level open
  const stop = (fn) => (e) => { e.stopPropagation(); if (fn) fn(); };

  return (
    <article
      ref={cardRef}
      onClick={() => onCardTap && onCardTap(event)}
      className="discover-feed-card relative w-full overflow-hidden bg-black cursor-pointer"
      style={cardHeight ? { height: `${cardHeight}px` } : { height: '100vh' }}
    >
      {/* Hero image — fills entire card */}
      {event.image_url && (
        <img
          src={event.image_url}
          alt={event.name}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          draggable={false}
        />
      )}

      {/* Top gradient — readable date pill / community badge */}
      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black/70 via-black/30 to-transparent pointer-events-none" />

      {/* Top row: date pill + community pill */}
      <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 z-10">
        <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-violet-500 text-white shadow-lg" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
          {formatEventDate(event.date)} · {formatEventTime(event.time)}
        </span>
        {event.submitted_by_user_id && (
          <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-violet-500/80 backdrop-blur text-white">
            👥 Community
          </span>
        )}
      </div>

      {/* Right-edge action stack — TikTok-style vertical icons */}
      <div className="absolute right-3 bottom-44 flex flex-col items-center gap-3 z-20">
        <button
          onClick={stop(() => onSave && onSave(event))}
          className="flex flex-col items-center gap-1"
          aria-label={isSaved ? 'Saved' : 'Save'}
        >
          <span className={`w-12 h-12 rounded-full flex items-center justify-center transition shadow-lg ${
            isSaved ? 'bg-violet-500 text-white' : 'bg-black/40 backdrop-blur-md text-white border border-white/20'
          }`}>
            <Heart className={`w-6 h-6 ${isSaved ? 'fill-current' : ''}`} />
          </span>
          <span className="text-[10px] text-white font-semibold" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>
            {isSaved ? 'Saved' : 'Save'}
          </span>
        </button>
        <button
          onClick={stop(() => onPass && onPass(event))}
          className="flex flex-col items-center gap-1"
          aria-label="Not for me"
        >
          <span className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/20 flex items-center justify-center transition shadow-lg">
            <X className="w-6 h-6" />
          </span>
          <span className="text-[10px] text-white font-semibold" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>
            Pass
          </span>
        </button>
      </div>

      {/* Bottom gradient + content overlay */}
      <div className="absolute bottom-0 inset-x-0 pt-32 pb-6 px-5 bg-gradient-to-t from-black via-black/80 to-transparent">
        <div className="space-y-2.5 max-w-[calc(100%-72px)]" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
          <h2 className="text-2xl sm:text-3xl font-bold leading-tight text-white">
            {event.name}
          </h2>
          <p className="text-sm text-white/90 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{event.venue}{event.neighborhood ? ` · ${event.neighborhood}` : ''}</span>
          </p>
          {/* Pills row */}
          <div className="flex flex-wrap items-center gap-1.5">
            {isFree ? (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 backdrop-blur">
                Free
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white/15 text-white border border-white/20 backdrop-blur">
                ${parseFloat(event.cover_charge).toFixed(0)}
              </span>
            )}
            {showAgeBadge && (
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold backdrop-blur ${ageTag === '21+' ? 'bg-red-500/30 text-red-200 border border-red-400/40' : 'bg-amber-500/30 text-amber-200 border border-amber-400/40'}`}>
                {ageTag}
              </span>
            )}
            {event.category && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white/15 text-white border border-white/20 backdrop-blur capitalize">
                {event.category.replace(/-/g, ' ')}
              </span>
            )}
            {vibeMatch > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-violet-500/30 text-violet-200 border border-violet-400/40 backdrop-blur">
                ✨ {vibeMatch} match{vibeMatch > 1 ? 'es' : ''}
              </span>
            )}
            {goingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white/15 text-white border border-white/20 backdrop-blur">
                {goingCount} going
              </span>
            )}
          </div>
          {/* Single-line description preview */}
          {shortDesc && (
            <p className="text-sm text-white/85 leading-relaxed">
              {shortDesc}
            </p>
          )}
          {/* Tap-to-open hint */}
          <div className="pt-1">
            <span className="text-[11px] font-semibold text-white/70 uppercase tracking-wider">
              Tap card for details →
            </span>
          </div>
        </div>
      </div>
    </article>
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

// Events Tab with Live Map and Calendar views
function EventsTab({ events, likedEvents, onEventClick, onUnlikeEvent, userLocation, onRequestLocation, onRSVP, onUndoRSVP, hasRSVPed }) {
  const [viewMode, setViewMode] = useState('live'); // 'live', 'calendar', 'liked'
  const [showAllEvents, setShowAllEvents] = useState(true); // Toggle between live only vs all events
  const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 1));
  const [selectedDate, setSelectedDate] = useState(null);
  const [distanceFilter, setDistanceFilter] = useState('all'); // 'all', '1', '5', '10'
  const [showFilters, setShowFilters] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [dayFilter, setDayFilter] = useState('all'); // 'all', 'today', 'tomorrow', 'weekend', 'week'
  const [showSearchFilters, setShowSearchFilters] = useState(false);
  const [showLikedOnMap, setShowLikedOnMap] = useState(true);
  const [showRsvpOnMap, setShowRsvpOnMap] = useState(true);

  // Get live events (happening right now)
  const liveEvents = events.filter(isEventLive);
  
  // Filter events by search query and day filter
  const getSearchFilteredEvents = (eventList) => {
    let filtered = eventList;
    
    // Text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e => 
        e.name?.toLowerCase().includes(query) ||
        e.venue?.toLowerCase().includes(query) ||
        e.neighborhood?.toLowerCase().includes(query) ||
        e.category?.toLowerCase().includes(query) ||
        e.description?.toLowerCase().includes(query)
      );
    }
    
    // Day filter
    if (dayFilter !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
      
      // Get weekend dates
      const dayOfWeek = today.getDay();
      const saturday = new Date(today);
      saturday.setDate(today.getDate() + (6 - dayOfWeek));
      const sunday = new Date(saturday);
      sunday.setDate(sunday.getDate() + 1);
      const mondayAfter = new Date(sunday);
      mondayAfter.setDate(mondayAfter.getDate() + 1);
      
      // Week end
      const weekEnd = new Date(today);
      weekEnd.setDate(today.getDate() + 7);
      
      filtered = filtered.filter(e => {
        if (!e.date) return true;
        const eventDate = new Date(e.date);
        eventDate.setHours(0, 0, 0, 0);
        
        switch (dayFilter) {
          case 'today':
            return eventDate.getTime() === today.getTime();
          case 'tomorrow':
            return eventDate.getTime() === tomorrow.getTime();
          case 'weekend':
            return eventDate >= saturday && eventDate < mondayAfter;
          case 'week':
            return eventDate >= today && eventDate < weekEnd;
          default:
            return true;
        }
      });
    }
    
    return filtered;
  };
  
  // Get events to display on map based on toggle
  const mapEvents = showAllEvents ? events : liveEvents;
  
  // Filter events by distance if user location is available
  const getFilteredEvents = (eventList) => {
    if (!userLocation || distanceFilter === 'all') return eventList;
    
    return eventList.filter(event => {
      if (!event.latitude || !event.longitude) return true; // Include events without coordinates
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        event.latitude,
        event.longitude
      );
      return distance <= parseInt(distanceFilter);
    });
  };

  // Apply all filters: distance, search, day
  const filteredMapEvents = getSearchFilteredEvents(getFilteredEvents(mapEvents));

  // Add distance to events
  const eventsWithDistance = (eventList) => {
    if (!userLocation) return eventList;
    return eventList.map(event => ({
      ...event,
      distance: event.latitude && event.longitude
        ? calculateDistance(userLocation.latitude, userLocation.longitude, event.latitude, event.longitude)
        : null
    }));
  };

  // Initialize Mapbox
  useEffect(() => {
    console.log('Map useEffect triggered', { viewMode, hasContainer: !!mapContainerRef.current, hasMapRef: !!mapRef.current });
    
    if (viewMode !== 'live' || !mapContainerRef.current || mapRef.current) {
      console.log('Map useEffect early return', { viewMode, hasContainer: !!mapContainerRef.current, hasMapRef: !!mapRef.current });
      return;
    }

    // Load Mapbox CSS
    if (!document.getElementById('mapbox-css')) {
      const link = document.createElement('link');
      link.id = 'mapbox-css';
      link.rel = 'stylesheet';
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
      document.head.appendChild(link);
      console.log('Mapbox CSS loaded');
    }

    // Load Mapbox JS
    if (!window.mapboxgl) {
      console.log('Loading Mapbox JS script...');
      const script = document.createElement('script');
      script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
      script.onload = () => {
        console.log('Mapbox JS script loaded');
        initializeMap();
      };
      script.onerror = (e) => {
        console.error('Failed to load Mapbox JS script', e);
      };
      document.head.appendChild(script);
    } else {
      console.log('Mapbox JS already loaded, initializing map');
      initializeMap();
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [viewMode]);

  const initializeMap = () => {
    console.log('initializeMap called', { 
      hasMapboxgl: !!window.mapboxgl, 
      hasContainer: !!mapContainerRef.current,
      token: MAPBOX_TOKEN ? 'exists' : 'MISSING'
    });
    
    if (!window.mapboxgl || !mapContainerRef.current) {
      console.error('Mapbox not ready:', { mapboxgl: !!window.mapboxgl, container: !!mapContainerRef.current });
      return;
    }

    // Check if token exists
    if (!MAPBOX_TOKEN) {
      console.error('Mapbox token is missing! Check VITE_MAPBOX_TOKEN environment variable.');
      setMapLoaded(true); // Set to true to hide loading spinner and show error
      return;
    }

    window.mapboxgl.accessToken = MAPBOX_TOKEN;
    
    try {
      console.log('Creating Mapbox map with center:', userLocation ? [userLocation.longitude, userLocation.latitude] : DALLAS_CENTER);
      
      const map = new window.mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: userLocation ? [userLocation.longitude, userLocation.latitude] : DALLAS_CENTER,
        zoom: userLocation ? 13 : DEFAULT_ZOOM
      });

      map.on('load', () => {
        console.log('Mapbox map loaded successfully');
        setMapLoaded(true);
        
        // Add user location marker if available
        if (userLocation) {
          const userMarker = document.createElement('div');
          userMarker.className = 'user-location-marker';
          userMarker.innerHTML = `
            <div style="width: 20px; height: 20px; background: #3b82f6; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>
            <div style="width: 40px; height: 40px; background: rgba(59, 130, 246, 0.2); border-radius: 50%; position: absolute; top: -10px; left: -10px; animation: pulse 2s infinite;"></div>
          `;
          
          new window.mapboxgl.Marker({ element: userMarker })
            .setLngLat([userLocation.longitude, userLocation.latitude])
            .addTo(map);
        }

        // Add event markers
        updateMarkers(map, filteredMapEvents);
      });

      map.on('error', (e) => {
        console.error('Mapbox error:', e);
        setMapLoaded(true); // Hide loading spinner
      });

      mapRef.current = map;
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapLoaded(true); // Hide loading spinner
    }
  };

  // Get RSVP'd event IDs for map display
  const getRsvpedEventIds = () => {
    const userKey = localStorage.getItem('crewq_user_id') || 'guest';
    const rsvped = JSON.parse(localStorage.getItem(`crewq_${userKey}_rsvped`) || '[]');
    return rsvped;
  };

  const updateMarkers = (map, eventList) => {
    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const likedIds = likedEvents.map(e => e.id);
    const rsvpedIds = getRsvpedEventIds();

    // Add new markers for regular events
    eventList.forEach(event => {
      if (!event.latitude || !event.longitude) return;

      const isLiked = likedIds.includes(event.id);
      const isRsvped = rsvpedIds.includes(event.id);
      
      // Skip if filters are off
      if (isLiked && !showLikedOnMap && !isRsvped) return;
      if (isRsvped && !showRsvpOnMap && !isLiked) return;

      // Determine marker color
      let bgColor = 'linear-gradient(135deg, #f97316, #ea580c)'; // Orange - regular
      let shadowColor = 'rgba(249, 115, 22, 0.4)';
      let emoji = '🎵';
      
      if (isRsvped) {
        bgColor = 'linear-gradient(135deg, #8b5cf6, #7c3aed)'; // Purple - RSVP'd
        shadowColor = 'rgba(139, 92, 246, 0.4)';
        emoji = '✓';
      } else if (isLiked) {
        bgColor = 'linear-gradient(135deg, #ec4899, #db2777)'; // Pink - Liked
        shadowColor = 'rgba(236, 72, 153, 0.4)';
        emoji = '❤️';
      }

      const el = document.createElement('div');
      el.className = 'event-marker';
      el.innerHTML = `
        <div style="
          width: 36px; 
          height: 36px; 
          background: ${bgColor}; 
          border-radius: 50% 50% 50% 0; 
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 3px 10px ${shadowColor};
          cursor: pointer;
        ">
          <span style="transform: rotate(45deg); font-size: 14px;">${emoji}</span>
        </div>
      `;
      
      el.addEventListener('click', () => {
        onEventClick(event);
      });

      const marker = new window.mapboxgl.Marker({ element: el })
        .setLngLat([event.longitude, event.latitude])
        .addTo(map);

      markersRef.current.push(marker);
    });

    // Add markers for liked events not in main list
    if (showLikedOnMap) {
      likedEvents.forEach(event => {
        if (!event.latitude || !event.longitude) return;
        if (eventList.find(e => e.id === event.id)) return; // Already added

        const isRsvped = rsvpedIds.includes(event.id);
        let bgColor = 'linear-gradient(135deg, #ec4899, #db2777)';
        let shadowColor = 'rgba(236, 72, 153, 0.4)';
        let emoji = '❤️';
        
        if (isRsvped && showRsvpOnMap) {
          bgColor = 'linear-gradient(135deg, #8b5cf6, #7c3aed)';
          shadowColor = 'rgba(139, 92, 246, 0.4)';
          emoji = '✓';
        }

        const el = document.createElement('div');
        el.className = 'event-marker liked-marker';
        el.innerHTML = `
          <div style="
            width: 36px; 
            height: 36px; 
            background: ${bgColor}; 
            border-radius: 50% 50% 50% 0; 
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 3px 10px ${shadowColor};
            cursor: pointer;
          ">
            <span style="transform: rotate(45deg); font-size: 14px;">${emoji}</span>
          </div>
        `;
        
        el.addEventListener('click', () => {
          onEventClick(event);
        });

        const marker = new window.mapboxgl.Marker({ element: el })
          .setLngLat([event.longitude, event.latitude])
          .addTo(map);

        markersRef.current.push(marker);
      });
    }
  };

  // Update markers when events change
  useEffect(() => {
    if (mapRef.current && mapLoaded) {
      updateMarkers(mapRef.current, filteredMapEvents);
    }
  }, [filteredMapEvents, mapLoaded, showAllEvents, likedEvents, showLikedOnMap, showRsvpOnMap]);

  // Calendar functions
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return { 
      daysInMonth: lastDay.getDate(), 
      startingDayOfWeek: firstDay.getDay() 
    };
  };

  const getEventsForDate = (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return likedEvents.filter(event => event.date === dateStr);
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="flex flex-col h-full">
      {/* View Mode Toggle */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex gap-1 bg-zinc-900 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('live')}
            className={`flex-1 py-2 px-3 rounded-lg font-semibold text-sm transition flex items-center justify-center gap-2 ${
              viewMode === 'live' ? 'bg-orange-500 text-white' : 'text-zinc-400'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${viewMode === 'live' ? 'bg-white' : 'bg-red-500'} ${liveEvents.length > 0 ? 'animate-pulse' : ''}`} />
            Live ({liveEvents.length})
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex-1 py-2 px-3 rounded-lg font-semibold text-sm transition flex items-center justify-center gap-2 ${
              viewMode === 'calendar' ? 'bg-orange-500 text-white' : 'text-zinc-400'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Calendar
          </button>
          <button
            onClick={() => setViewMode('liked')}
            className={`flex-1 py-2 px-3 rounded-lg font-semibold text-sm transition flex items-center justify-center gap-2 ${
              viewMode === 'liked' ? 'bg-orange-500 text-white' : 'text-zinc-400'
            }`}
          >
            <Heart className="w-4 h-4" />
            Liked ({likedEvents.length})
          </button>
        </div>
      </div>

      {/* Live Map View */}
      {viewMode === 'live' && (
        <div className="flex-1 flex flex-col">
          {/* Filter Bar */}
          <div className="px-4 py-2 flex items-center gap-2 flex-wrap">
            {/* Live / All Events Toggle */}
            <div className="flex bg-zinc-800 rounded-lg p-1">
              <button
                onClick={() => setShowAllEvents(false)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
                  !showAllEvents 
                    ? 'bg-red-500 text-white' 
                    : 'text-zinc-400'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${!showAllEvents ? 'bg-white' : 'bg-red-500'} ${liveEvents.length > 0 ? 'animate-pulse' : ''}`} />
                Live ({liveEvents.length})
              </button>
              <button
                onClick={() => setShowAllEvents(true)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  showAllEvents 
                    ? 'bg-orange-500 text-white' 
                    : 'text-zinc-400'
                }`}
              >
                All ({events.length})
              </button>
            </div>

            <button
              onClick={() => onRequestLocation && onRequestLocation()}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                userLocation 
                  ? 'bg-emerald-500 bg-opacity-20 text-emerald-400' 
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              <Navigation className="w-4 h-4" />
              {userLocation ? 'Located' : 'Location'}
            </button>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                distanceFilter !== 'all' 
                  ? 'bg-orange-500 bg-opacity-20 text-orange-400' 
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              <Filter className="w-4 h-4" />
              {distanceFilter === 'all' ? 'All Dallas' : `${distanceFilter} mi`}
            </button>
          </div>

          {/* Search Bar */}
          <div className="px-4 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events, venues, neighborhoods..."
                className="w-full bg-zinc-800 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-500 placeholder-zinc-500"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Day Filter Pills */}
          <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
            {[
              { id: 'all', label: 'Any Day' },
              { id: 'today', label: 'Today' },
              { id: 'tomorrow', label: 'Tomorrow' },
              { id: 'weekend', label: 'This Weekend' },
              { id: 'week', label: 'This Week' },
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => setDayFilter(opt.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                  dayFilter === opt.id
                    ? 'bg-orange-500 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Map Legend & Toggles */}
          <div className="px-4 pb-2">
            <div className="flex items-center gap-4 text-xs">
              <span className="text-zinc-500">Show on map:</span>
              <button
                onClick={() => setShowLikedOnMap(!showLikedOnMap)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition ${
                  showLikedOnMap ? 'bg-pink-500/20 text-pink-400' : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                <span>❤️</span> Liked
              </button>
              <button
                onClick={() => setShowRsvpOnMap(!showRsvpOnMap)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition ${
                  showRsvpOnMap ? 'bg-violet-500/20 text-violet-400' : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                <span>✓</span> RSVP'd
              </button>
            </div>
          </div>

          {/* Distance Filter Dropdown */}
          {showFilters && (
            <div className="px-4 pb-2">
              <div className="bg-zinc-800 rounded-xl p-2 flex gap-2">
                {['all', '1', '5', '10'].map(distance => (
                  <button
                    key={distance}
                    onClick={() => {
                      setDistanceFilter(distance);
                      setShowFilters(false);
                    }}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                      distanceFilter === distance
                        ? 'bg-orange-500 text-white'
                        : 'text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    {distance === 'all' ? 'All' : `${distance} mi`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Map Container */}
          <div className="relative" style={{ height: '300px' }}>
            <div ref={mapContainerRef} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
            
            {!mapLoaded && (
              <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-zinc-400 text-sm">Loading map...</p>
                </div>
              </div>
            )}

            {/* Map Legend */}
            <div className="absolute bottom-4 left-4 bg-zinc-900 bg-opacity-90 rounded-xl p-3 text-xs z-10">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 bg-orange-500 rounded-full" />
                <span className="text-zinc-300">{showAllEvents ? 'Event' : 'Live Event'}</span>
              </div>
              {userLocation && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span className="text-zinc-300">You</span>
                </div>
              )}
            </div>
          </div>

          {/* Events List */}
          <div className="bg-zinc-900 border-t border-zinc-800 max-h-[40%] overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-zinc-400 mb-3">
                {filteredMapEvents.length > 0 
                  ? `${filteredMapEvents.length} ${showAllEvents ? 'Events' : 'Live Events'}`
                  : showAllEvents ? 'No Events Found' : 'No Live Events Right Now'
                }
              </h3>
              
              {filteredMapEvents.length > 0 ? (
                <div className="space-y-2">
                  {eventsWithDistance(filteredMapEvents).map(event => {
                    const isLive = isEventLive(event);
                    return (
                    <button
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className="w-full bg-zinc-800 rounded-xl p-3 flex items-center gap-3 text-left hover:bg-zinc-700 transition"
                    >
                      {event.image_url && (
                        <img 
                          src={event.image_url} 
                          alt={event.name}
                          className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        {isLive && (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-xs text-red-400 font-semibold">LIVE</span>
                          </div>
                        )}
                        <h4 className="text-white font-semibold truncate">{event.name}</h4>
                        <p className="text-zinc-400 text-sm truncate">{event.venue}</p>
                        {!isLive && (
                          <p className="text-zinc-500 text-xs">{event.date} • {event.time}</p>
                        )}
                      </div>
                      {event.distance != null && typeof event.distance === 'number' && (
                        <div className="text-right flex-shrink-0">
                          <p className="text-orange-400 font-semibold text-sm">
                            {formatDistance(event.distance)}
                          </p>
                        </div>
                      )}
                    </button>
                  );})}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Map className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-500 text-sm">
                    {showAllEvents ? 'No events found' : 'No events happening right now'}
                  </p>
                  <p className="text-zinc-600 text-xs mt-1">
                    {showAllEvents ? 'Events need coordinates to show on map' : 'Toggle to "All" to see upcoming events'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="flex-1 overflow-y-auto p-4">
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
              const dayEvents = getEventsForDate(day);
              const hasEvents = dayEvents.length > 0;
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
                      {dayEvents.slice(0, 3).map((_, i) => (
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
                  <div key={idx} className="bg-zinc-800 rounded-2xl p-4 flex items-center gap-3">
                    <button onClick={() => onEventClick(event)} className="flex-1 text-left">
                      <h4 className="text-white font-semibold mb-1">{event.name}</h4>
                      <p className="text-zinc-400 text-sm mb-2">{event.venue}</p>
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <Clock className="w-3 h-3" />
                        <span>{event.time}</span>
                      </div>
                    </button>
                    <button
                      onClick={() => onUnlikeEvent(event)}
                      className="p-2 bg-red-500 bg-opacity-20 rounded-full hover:bg-opacity-40 transition"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
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
      )}

      {/* Liked Events View */}
      {viewMode === 'liked' && (
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-lg font-bold text-white mb-3">All Liked Events</h3>
          {likedEvents.length > 0 ? (
            <div className="space-y-3">
              {eventsWithDistance(likedEvents).map((event, idx) => (
                <div key={idx} className="bg-zinc-800 rounded-2xl p-4">
                  <button onClick={() => onEventClick(event)} className="w-full text-left mb-3">
                    <h4 className="text-white font-semibold mb-1">{event.name}</h4>
                    <p className="text-zinc-400 text-sm mb-1">{event.venue}</p>
                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                      <span>{event.date}</span>
                      <span>•</span>
                      <span>{event.time}</span>
                      {event.distance != null && typeof event.distance === 'number' && (
                        <>
                          <span>•</span>
                          <span className="text-orange-400">{formatDistance(event.distance)}</span>
                        </>
                      )}
                    </div>
                  </button>
                  <div className="flex gap-2">
                    {onRSVP && hasRSVPed && hasRSVPed(event.id) ? (
                      // Already RSVPed - show confirmed with undo option
                      <div className="flex-1 flex items-center gap-2">
                        <div className="flex-1 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          RSVP'd
                        </div>
                        {onUndoRSVP && (
                          <button
                            onClick={() => onUndoRSVP(event)}
                            className="p-2 text-zinc-500 hover:text-red-400 transition"
                            title="Cancel RSVP"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ) : onRSVP ? (
                      // Not RSVPed - show RSVP button
                      <button
                        onClick={() => onRSVP(event)}
                        className="flex-1 py-2 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-orange-500 text-white hover:bg-orange-600 transition"
                      >
                        <Calendar className="w-4 h-4" />
                        RSVP
                      </button>
                    ) : null}
                    <button
                      onClick={() => onUnlikeEvent(event)}
                      className="p-2 bg-red-500 bg-opacity-20 rounded-xl hover:bg-opacity-40 transition"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-400">No liked events yet</p>
              <p className="text-zinc-600 text-sm mt-2">Swipe right on events to like them</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Keep old CalendarView for backwards compatibility but redirect to EventsTab
function CalendarView({ likedEvents, onEventClick, onUnlikeEvent }) {
  return <EventsTab 
    events={[]} 
    likedEvents={likedEvents} 
    onEventClick={onEventClick} 
    onUnlikeEvent={onUnlikeEvent}
  />;
}

function CrewTab({ squads, onCreateSquad, onSquadClick }) {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-white mb-6">Your Squads</h2>
      
      {squads.length > 0 ? (
        <div className="space-y-4">
          {squads.map(squad => (
            <button 
              key={squad.id} 
              onClick={() => onSquadClick && onSquadClick(squad)}
              className="w-full bg-zinc-900 rounded-2xl p-5 text-left hover:bg-zinc-800 transition"
            >
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
                  <div className="flex items-center gap-4 text-zinc-500 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{squad.member_count || 0} members</span>
                    </div>
                    {squad.max_members && (
                      <span className={`text-xs ${(squad.member_count || 0) >= squad.max_members ? 'text-red-400' : 'text-zinc-600'}`}>
                        (max {squad.max_members})
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-600" />
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
                  {(squad.member_count || 0) > 5 && (
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 text-xs font-semibold">
                      +{(squad.member_count || 0) - 5}
                    </div>
                  )}
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

              {/* Meeting spot preview */}
              {squad.meeting_spot && (
                <div className="mt-3 flex items-center gap-2 text-emerald-400 text-xs">
                  <MapPin className="w-3 h-3" />
                  <span>Meeting: {squad.meeting_spot}</span>
                </div>
              )}
            </button>
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

function AwardsTab({ userProfile, userBadges, userStats, onOpenLeaderboard }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBadge, setSelectedBadge] = useState(null);
  const categoryScrollRef = useRef(null);
  
  const earnedBadgeIds = userBadges || [];
  const earnedCount = earnedBadgeIds.length;
  const totalBadges = BADGES.length;
  const totalPoints = BADGES.filter(b => earnedBadgeIds.includes(b.id)).reduce((sum, b) => sum + b.points, 0);
  
  // Progress towards Key to the City (now 25 badges)
  const keyToCity = BADGES.find(b => b.id === 'key-to-city');
  const keyProgress = Math.min(earnedCount, keyToCity?.requirement?.count || 25);
  
  const filteredBadges = selectedCategory === 'all' 
    ? BADGES 
    : BADGES.filter(b => b.category === selectedCategory);

  const getBadgeProgress = (badge) => {
    if (earnedBadgeIds.includes(badge.id)) return 100;
    
    const stats = userStats || {};
    const req = badge.requirement;
    
    switch (req.type) {
      case 'checkins':
        return Math.min(100, ((stats.totalCheckins || 0) / req.count) * 100);
      case 'squads-created':
        return Math.min(100, ((stats.squadsCreated || 0) / req.count) * 100);
      case 'squads-joined':
        return Math.min(100, ((stats.squadsJoined || 0) / req.count) * 100);
      case 'streak':
        return Math.min(100, ((stats.currentStreak || 0) / req.count) * 100);
      case 'category-checkins':
        const catCheckins = stats.categoryCheckins?.[req.category] || 0;
        return Math.min(100, (catCheckins / req.count) * 100);
      case 'badges-earned':
        return Math.min(100, (earnedCount / req.count) * 100);
      case 'days-active':
        return Math.min(100, ((stats.daysActive || 0) / req.count) * 100);
      case 'swipes':
        return Math.min(100, ((stats.totalSwipes || 0) / req.count) * 100);
      case 'likes':
        return Math.min(100, ((stats.totalLikes || 0) / req.count) * 100);
      case 'profile-complete':
        return stats.profileComplete ? 100 : 0;
      default:
        return 0;
    }
  };

  const handleShareBadge = async (badge) => {
    const shareText = `🏆 I just earned the "${badge.name}" badge on CrewQ!\n\n${badge.icon} ${badge.description}\n\nJoin me in exploring Dallas nightlife! 🎉`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: `I earned ${badge.name} on CrewQ!`,
          text: shareText,
          url: 'https://crewq-app.vercel.app'
        });
      } else {
        await navigator.clipboard.writeText(shareText + '\n\nhttps://crewq-app.vercel.app');
        alert('Copied to clipboard! Share it with your friends.');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error sharing:', err);
      }
    }
  };

  return (
    <div className="p-4 pb-8">
      {/* Header with Total Points */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-6 mb-6 text-center">
        <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
          <Trophy className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-1">Your Awards</h2>
        <p className="text-orange-100 mb-4">{earnedCount} of {totalBadges} badges earned</p>
        
        <div className="bg-white bg-opacity-20 rounded-xl p-4 mb-4">
          <div className="text-3xl font-bold text-white mb-1">{totalPoints}</div>
          <div className="text-orange-100 text-sm">Total Points</div>
        </div>

        {/* Leaderboard Button */}
        <button
          onClick={onOpenLeaderboard}
          className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2"
        >
          <Trophy className="w-5 h-5" />
          View Leaderboard
        </button>
      </div>

      {/* Key to the City Progress */}
      <div className="bg-zinc-900 rounded-3xl p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${
            earnedBadgeIds.includes('key-to-city') 
              ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 animate-pulse' 
              : 'bg-zinc-800'
          }`}>
            🔑
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold text-lg">Key to the City</h3>
            <p className="text-zinc-400 text-sm">Earn 25 badges to unlock</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-orange-500">{keyProgress}/25</div>
          </div>
        </div>
        
        <div className="w-full bg-zinc-800 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-orange-500 to-yellow-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${(keyProgress / 25) * 100}%` }}
          />
        </div>
        
        {earnedBadgeIds.includes('key-to-city') && (
          <div className="mt-4 text-center">
            <span className="text-yellow-400 font-bold">🎉 Congratulations! You have the Key to the City! 🎉</span>
          </div>
        )}
      </div>

      {/* Category Filter - Drag to scroll, no scrollbar */}
      <div className="mb-6 -mx-4 px-4">
        <div 
          ref={categoryScrollRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide touch-pan-x"
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <button
            onClick={() => setSelectedCategory('all')}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${
              selectedCategory === 'all'
                ? 'bg-orange-500 text-white'
                : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            All ({totalBadges})
          </button>
          {BADGE_CATEGORIES.map(cat => {
            const catBadges = BADGES.filter(b => b.category === cat.id);
            const earnedInCat = catBadges.filter(b => earnedBadgeIds.includes(b.id)).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat.id
                    ? 'bg-orange-500 text-white'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {cat.icon} {cat.name} ({earnedInCat}/{catBadges.length})
              </button>
            );
          })}
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-3 gap-3">
        {filteredBadges.map(badge => {
          const isEarned = earnedBadgeIds.includes(badge.id);
          const progress = getBadgeProgress(badge);
          
          return (
            <button
              key={badge.id}
              onClick={() => setSelectedBadge(badge)}
              className={`relative p-4 rounded-2xl transition-all active:scale-95 ${
                isEarned 
                  ? 'bg-gradient-to-br from-zinc-800 to-zinc-900 border-2 border-orange-500' 
                  : 'bg-zinc-900 border-2 border-zinc-800 opacity-60'
              }`}
            >
              <div className={`text-3xl mb-2 ${!isEarned && 'grayscale opacity-50'}`}>
                {badge.icon}
              </div>
              <div className={`text-xs font-semibold truncate ${isEarned ? 'text-white' : 'text-zinc-500'}`}>
                {badge.name}
              </div>
              
              {!isEarned && progress > 0 && (
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="w-full bg-zinc-800 rounded-full h-1">
                    <div 
                      className="bg-orange-500 h-1 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
              
              {isEarned && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-3xl max-w-sm w-full p-6 text-center relative">
            <button 
              onClick={() => setSelectedBadge(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className={`w-24 h-24 rounded-full flex items-center justify-center text-5xl mx-auto mb-4 ${
              earnedBadgeIds.includes(selectedBadge.id)
                ? 'bg-gradient-to-br from-orange-500 to-orange-600'
                : 'bg-zinc-800 grayscale'
            }`}>
              {selectedBadge.icon}
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2">{selectedBadge.name}</h3>
            <p className="text-zinc-400 mb-4">{selectedBadge.description}</p>
            
            <div className="flex items-center justify-center gap-2 mb-4">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-yellow-500 font-bold">{selectedBadge.points} points</span>
            </div>
            
            {earnedBadgeIds.includes(selectedBadge.id) ? (
              <>
                <div className="bg-emerald-500 bg-opacity-20 border border-emerald-500 rounded-xl p-4 mb-4">
                  <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                  <span className="text-emerald-400 font-semibold">Badge Earned!</span>
                </div>
                
                <button
                  onClick={() => handleShareBadge(selectedBadge)}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition mb-3"
                >
                  <Share2 className="w-5 h-5" />
                  Share This Badge
                </button>
              </>
            ) : (
              <div className="bg-zinc-800 rounded-xl p-4 mb-4">
                <div className="text-zinc-400 text-sm mb-2">Progress</div>
                <div className="w-full bg-zinc-700 rounded-full h-2 mb-2">
                  <div 
                    className="bg-orange-500 h-2 rounded-full transition-all"
                    style={{ width: `${getBadgeProgress(selectedBadge)}%` }}
                  />
                </div>
                <div className="text-zinc-500 text-xs">
                  {Math.round(getBadgeProgress(selectedBadge))}% complete
                </div>
              </div>
            )}
            
            <button
              onClick={() => setSelectedBadge(null)}
              className="w-full bg-zinc-800 text-white py-3 rounded-xl font-semibold hover:bg-zinc-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileTab({ userProfile, onLogout, onUpdateProfile, userBadges = [], attendedEvents = [], onEventClick, onNavigate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(userProfile);
  const [uploadingImage, setUploadingImage] = useState(false);
  const likedEvents = JSON.parse(localStorage.getItem(`crewq_${userProfile?.id}_liked`) || '[]');
  const [squadsCount, setSquadsCount] = useState(0);
  const fileInputRef = useRef(null);
  const [showBioBuilder, setShowBioBuilder] = useState(false);

  // Get earned badge details
  const earnedBadges = BADGES.filter(b => userBadges.includes(b.id));

  useEffect(() => {
    loadSquadsCount();
  }, []);

  useEffect(() => {
    setEditedProfile({
      ...userProfile,
      profile_visibility: userProfile.profile_visibility || 'squad_only'
    });
  }, [userProfile]);

  const handleSaveBio = async (bio, bioAnswers) => {
    const updatedProfile = { ...editedProfile, bio, bio_answers: bioAnswers };
    setEditedProfile(updatedProfile);
    await onUpdateProfile(updatedProfile);
  };

  const loadSquadsCount = async () => {
    if (!supabaseClient) return;
    try {
      // Count squads the user is a member of
      const { count } = await supabaseClient
        .from('squad_members')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userProfile.id);
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

  const handleRemovePhoto = () => {
    setEditedProfile({ ...editedProfile, profile_picture: null });
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

  const handlePrivacyToggle = () => {
    const newVisibility = editedProfile.profile_visibility === 'public' ? 'squad_only' : 'public';
    setEditedProfile({ ...editedProfile, profile_visibility: newVisibility });
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
              <div className="absolute -bottom-1 -right-1 flex gap-1">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-orange-500 rounded-full p-2 hover:bg-orange-600 transition"
                  title="Upload photo"
                >
                  <Camera className="w-4 h-4 text-white" />
                </button>
                {editedProfile.profile_picture && (
                  <button
                    onClick={handleRemovePhoto}
                    className="bg-red-500 rounded-full p-2 hover:bg-red-600 transition"
                    title="Remove photo"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                )}
              </div>
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

          {/* Patch 4 — Relationship status */}
          <div>
            <label className="block text-sm font-semibold text-zinc-400 mb-2">Relationship Status</label>
            {isEditing ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  {RELATIONSHIP_OPTIONS.map(option => {
                    const current = editedProfile.relationship_status || 'prefer-not-to-say';
                    return (
                      <button
                        key={option.id}
                        onClick={() => setEditedProfile({ ...editedProfile, relationship_status: option.id })}
                        className={`px-3 py-3 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${
                          current === option.id ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                        }`}
                      >
                        <span>{option.icon}</span>
                        <span className="truncate">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
                {(editedProfile.relationship_status || 'prefer-not-to-say') !== 'prefer-not-to-say' && (
                  <button
                    onClick={() => setEditedProfile({ ...editedProfile, show_relationship_status: !editedProfile.show_relationship_status })}
                    className={`mt-2 w-full flex items-center justify-between p-3 rounded-xl border-2 transition ${
                      editedProfile.show_relationship_status ? 'bg-orange-500/20 border-orange-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                    }`}
                  >
                    <span className="text-sm font-medium">Show on my profile</span>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs ${editedProfile.show_relationship_status ? 'bg-orange-500' : 'bg-zinc-700'}`}>
                      {editedProfile.show_relationship_status && '✓'}
                    </span>
                  </button>
                )}
                <p className="text-xs text-zinc-500 mt-1">Private by default — toggle to share with squads.</p>
              </>
            ) : (
              <div className="flex items-center gap-3 bg-zinc-800 rounded-xl px-4 py-3">
                {(() => {
                  const opt = RELATIONSHIP_OPTIONS.find(o => o.id === (userProfile.relationship_status || 'prefer-not-to-say'));
                  const showing = userProfile.show_relationship_status;
                  return (
                    <>
                      <span>{opt?.icon || '🤐'}</span>
                      <span className="text-white">{opt?.label || 'Prefer not to say'}</span>
                      {!showing && opt?.id !== 'prefer-not-to-say' && (
                        <span className="ml-auto text-xs text-zinc-500">Private</span>
                      )}
                    </>
                  );
                })()}
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
                <label className="block text-sm font-semibold text-zinc-400 mb-2">Bio</label>
                <button
                  onClick={() => setShowBioBuilder(true)}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl px-4 py-4 font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition"
                >
                  <Sparkles className="w-5 h-5" />
                  {userProfile.bio ? 'Rebuild My Bio' : 'Build My Bio'}
                </button>
                {editedProfile.bio && (
                  <div className="mt-3 bg-zinc-800 rounded-xl px-4 py-3">
                    <p className="text-zinc-300 text-sm">{editedProfile.bio}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {!isEditing && userProfile.bio && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-zinc-400">Bio</label>
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setTimeout(() => setShowBioBuilder(true), 100);
                  }}
                  className="text-orange-500 hover:text-orange-400 text-xs font-semibold flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit
                </button>
              </div>
              <div className="bg-zinc-800 rounded-xl px-4 py-3">
                <p className="text-white text-sm">{userProfile.bio}</p>
              </div>
            </div>
          )}

          {!isEditing && !userProfile.bio && (
            <div>
              <label className="block text-sm font-semibold text-zinc-400 mb-2">Bio</label>
              <button
                onClick={() => {
                  setIsEditing(true);
                  setTimeout(() => setShowBioBuilder(true), 100);
                }}
                className="w-full bg-zinc-800 border-2 border-dashed border-zinc-700 text-zinc-400 rounded-xl px-4 py-4 font-semibold flex items-center justify-center gap-2 hover:border-orange-500 hover:text-orange-500 transition"
              >
                <Sparkles className="w-5 h-5" />
                Build Your Bio
              </button>
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
          <button 
            onClick={() => onNavigate && onNavigate('events')}
            className="bg-zinc-800 rounded-xl p-4 text-center hover:bg-zinc-700 transition"
          >
            <div className="text-3xl font-bold text-orange-500 mb-1">{likedEvents.length}</div>
            <div className="text-sm text-zinc-400">Liked Events</div>
            <div className="text-xs text-orange-500 mt-1">View →</div>
          </button>
          <button 
            onClick={() => onNavigate && onNavigate('crew')}
            className="bg-zinc-800 rounded-xl p-4 text-center hover:bg-zinc-700 transition"
          >
            <div className="text-3xl font-bold text-orange-500 mb-1">{squadsCount}</div>
            <div className="text-sm text-zinc-400">Squads</div>
            <div className="text-xs text-orange-500 mt-1">View →</div>
          </button>
        </div>
      </div>

      {/* Privacy Settings Section */}
      <div className="bg-zinc-900 rounded-3xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-bold text-white">Privacy Settings</h3>
        </div>
        
        <div className="space-y-4">
          {/* Toggle Row */}
          <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-xl">
            <div className="flex-1 pr-4">
              <p className="text-white font-semibold mb-1">Profile Visibility</p>
              <p className="text-zinc-400 text-sm">
                {(editedProfile.profile_visibility || userProfile.profile_visibility) === 'public' 
                  ? 'Public: Anyone can see your profile in Solo mode' 
                  : 'Private: Only squad members can see your profile'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Public</span>
              <button
                onClick={async () => {
                  const currentVisibility = editedProfile.profile_visibility || userProfile.profile_visibility || 'squad_only';
                  const newVisibility = currentVisibility === 'public' ? 'squad_only' : 'public';
                  const updatedProfile = { ...editedProfile, profile_visibility: newVisibility };
                  setEditedProfile(updatedProfile);
                  await onUpdateProfile(updatedProfile);
                }}
                className={`relative w-14 h-8 rounded-full transition-colors duration-200 cursor-pointer ${
                  (editedProfile.profile_visibility || userProfile.profile_visibility) === 'public'
                    ? 'bg-zinc-600'
                    : 'bg-orange-500'
                }`}
                title={(editedProfile.profile_visibility || userProfile.profile_visibility) === 'public' ? 'Switch to Private' : 'Switch to Public'}
              >
                <div
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-200 ${
                    (editedProfile.profile_visibility || userProfile.profile_visibility) === 'public'
                      ? 'left-1'
                      : 'left-7'
                  }`}
                />
              </button>
              <span className="text-xs text-zinc-500">Private</span>
            </div>
          </div>

          {/* Status Indicator */}
          <div className={`flex items-center gap-3 p-4 rounded-xl ${
            (editedProfile.profile_visibility || userProfile.profile_visibility) === 'public'
              ? 'bg-emerald-500 bg-opacity-10 border border-emerald-500 border-opacity-30'
              : 'bg-orange-500 bg-opacity-10 border border-orange-500 border-opacity-30'
          }`}>
            {(editedProfile.profile_visibility || userProfile.profile_visibility) === 'public' ? (
              <>
                <Eye className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="text-emerald-400 font-semibold">Public Profile</p>
                  <p className="text-emerald-400 text-opacity-70 text-xs">Solo users can see you're attending events</p>
                </div>
              </>
            ) : (
              <>
                <EyeOff className="w-5 h-5 text-orange-400" />
                <div>
                  <p className="text-orange-400 font-semibold">Private Profile</p>
                  <p className="text-orange-400 text-opacity-70 text-xs">Only squad members can see your profile</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Earned Badges Section */}
      {earnedBadges.length > 0 && (
        <button 
          onClick={() => onNavigate && onNavigate('awards')}
          className="w-full bg-zinc-900 rounded-3xl p-6 mb-6 text-left hover:bg-zinc-800 transition"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-orange-500" />
              Earned Badges
            </h3>
            <span className="text-sm text-zinc-400">{earnedBadges.length} earned</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {earnedBadges.slice(0, 8).map(badge => (
              <div
                key={badge.id}
                className="flex flex-col items-center bg-zinc-800 rounded-xl p-3 min-w-[70px]"
              >
                <span className="text-2xl mb-1">{badge.icon}</span>
                <span className="text-xs text-zinc-400 text-center leading-tight">{badge.name}</span>
              </div>
            ))}
            {earnedBadges.length > 8 && (
              <div className="flex flex-col items-center justify-center bg-zinc-800 rounded-xl p-3 min-w-[70px]">
                <span className="text-lg text-orange-500 font-bold">+{earnedBadges.length - 8}</span>
                <span className="text-xs text-zinc-400">more</span>
              </div>
            )}
          </div>
          <p className="text-xs text-orange-500 mt-3 text-center">
            Tap to view all badges in Awards →
          </p>
        </button>
      )}

      {/* Previously Attended Events Section */}
      {attendedEvents.length > 0 && (
        <div className="bg-zinc-900 rounded-3xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              Previously Attended
            </h3>
            <span className="text-sm text-zinc-400">{attendedEvents.length} events</span>
          </div>
          <div className="space-y-3">
            {attendedEvents.slice(0, 5).map(event => (
              <button
                key={event.id}
                onClick={() => onEventClick && onEventClick(event)}
                className="w-full flex items-center gap-3 bg-zinc-800 rounded-xl p-3 hover:bg-zinc-700 transition text-left"
              >
                {event.image_url && (
                  <img
                    src={event.image_url}
                    alt={event.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{event.name}</p>
                  <p className="text-xs text-zinc-400">{event.venue}</p>
                </div>
                <div className="text-right flex items-center gap-2">
                  <p className="text-xs text-zinc-500">{event.date}</p>
                  <ChevronRight className="w-4 h-4 text-zinc-600" />
                </div>
              </button>
            ))}
            {attendedEvents.length > 5 && (
              <p className="text-xs text-zinc-500 text-center">
                + {attendedEvents.length - 5} more events attended
              </p>
            )}
          </div>
        </div>
      )}

      <button
        onClick={onLogout}
        className="w-full bg-red-500 bg-opacity-20 text-red-500 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-opacity-30 transition"
      >
        <LogOut className="w-5 h-5" />
        Logout
      </button>

      {showBioBuilder && (
        <BioBuilderModal
          onClose={() => setShowBioBuilder(false)}
          onSaveBio={handleSaveBio}
          userName={userProfile.name}
          currentAnswers={userProfile.bio_answers || {}}
        />
      )}
    </div>
  );
}

// Patch 6 — Legal modal (Terms of Service / Privacy Policy)
// Patch A — Reusable image picker. Categorized accordion with custom URL fallback.
// Used by admin form, business portal form, and user submission modal.
function ImagePicker({ value, onChange, darkMode = true, defaultCategory = 'live-music' }) {
  const [openCat, setOpenCat] = useState(defaultCategory);
  const [showCustom, setShowCustom] = useState(false);
  const [customUrl, setCustomUrl] = useState('');

  // If the current value matches a stock image, find its category
  useEffect(() => {
    const stockMatch = STOCK_IMAGE_CATEGORIES.find(cat => cat.images.some(i => i.url === value));
    if (stockMatch && !showCustom) {
      setOpenCat(stockMatch.id);
    } else if (value && !STOCK_IMAGE_FLAT.some(i => i.url === value)) {
      // Value is a custom URL
      setCustomUrl(value);
      setShowCustom(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const baseBg = darkMode ? 'bg-zinc-800' : 'bg-amber-50';
  const baseHover = darkMode ? 'hover:bg-zinc-700' : 'hover:bg-amber-100';
  const textColor = darkMode ? 'text-white' : 'text-zinc-900';
  const subtextColor = darkMode ? 'text-zinc-400' : 'text-zinc-600';
  const borderColor = darkMode ? 'border-zinc-700' : 'border-amber-200';

  const totalImageCount = STOCK_IMAGE_FLAT.length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className={`text-xs ${subtextColor}`}>{totalImageCount} stock images organized by category</span>
        <button
          type="button"
          onClick={() => setShowCustom(!showCustom)}
          className={`text-xs font-semibold ${darkMode ? 'text-violet-400 hover:text-violet-300' : 'text-orange-600 hover:text-orange-700'}`}
        >
          {showCustom ? '← Use stock library' : 'Use custom URL →'}
        </button>
      </div>

      {showCustom ? (
        <div className="space-y-2">
          <input
            type="url"
            value={customUrl}
            onChange={e => {
              setCustomUrl(e.target.value);
              if (onChange) onChange(e.target.value);
            }}
            placeholder="https://example.com/image.jpg"
            className={`w-full px-4 py-3 ${baseBg} border ${borderColor} rounded-xl ${textColor} text-sm`}
          />
          {customUrl && (
            <div className={`relative rounded-xl overflow-hidden border ${borderColor}`}>
              <img
                src={customUrl}
                alt="Preview"
                className="w-full h-40 object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          )}
          <p className={`text-xs ${subtextColor}`}>Tip: paste a Unsplash, Imgur, or any public image URL.</p>
        </div>
      ) : (
        <div className={`rounded-xl border ${borderColor} overflow-hidden`}>
          {STOCK_IMAGE_CATEGORIES.map(cat => {
            const isOpen = openCat === cat.id;
            return (
              <div key={cat.id} className={`${darkMode ? 'border-b border-zinc-700/50' : 'border-b border-amber-200/50'} last:border-b-0`}>
                <button
                  type="button"
                  onClick={() => setOpenCat(isOpen ? null : cat.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 ${baseBg} ${baseHover} text-left transition`}
                >
                  <span className={`text-sm font-semibold ${textColor}`}>
                    <span className="mr-2">{cat.icon}</span>
                    {cat.label}
                    <span className={`ml-2 text-xs ${subtextColor}`}>({cat.images.length})</span>
                  </span>
                  <span className={`text-xs ${subtextColor}`}>{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen && (
                  <div className={`p-2 ${darkMode ? 'bg-zinc-900' : 'bg-white'}`}>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {cat.images.map((img, idx) => {
                        const selected = value === img.url;
                        return (
                          <button
                            key={`${cat.id}-${idx}`}
                            type="button"
                            onClick={() => onChange && onChange(img.url)}
                            title={img.label}
                            className={`relative aspect-square rounded-lg overflow-hidden border-2 transition ${selected ? (darkMode ? 'border-violet-500 ring-2 ring-violet-500/40' : 'border-orange-500 ring-2 ring-orange-500/40') : 'border-transparent hover:border-zinc-500'}`}
                          >
                            <img src={img.url} alt={img.label} className="w-full h-full object-cover" loading="lazy" />
                            {selected && (
                              <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-violet-500 text-white text-xs flex items-center justify-center">✓</span>
                            )}
                            <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1 py-0.5 truncate">{img.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LegalModal({ type, onClose, darkMode }) {
  const isTos = type === 'tos';
  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60] p-4">
      <div className={`${darkMode ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'} rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col`}>
        <div className={`flex items-center justify-between p-5 border-b ${darkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <h2 className="text-xl font-bold">{isTos ? 'Terms of Service' : 'Privacy Policy'}</h2>
          <button onClick={onClose} className={darkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'}><X className="w-6 h-6" /></button>
        </div>
        <div className="overflow-y-auto p-5 space-y-4 text-sm leading-relaxed">
          <p className={darkMode ? 'text-zinc-500' : 'text-zinc-500'}>Version {TOS_VERSION} · Last updated {TOS_LAST_UPDATED}</p>
          {isTos ? (
            <>
              <section>
                <h3 className="font-semibold text-base mb-1">1. Beta Product Notice</h3>
                <p className={darkMode ? 'text-zinc-300' : 'text-zinc-700'}>CrewQ is currently in beta. Features may change, break, or be removed without notice. Event listings may be incomplete or outdated. Always confirm details directly with the venue before making plans.</p>
              </section>
              <section>
                <h3 className="font-semibold text-base mb-1">2. No Affiliation With Venues</h3>
                <p className={darkMode ? 'text-zinc-300' : 'text-zinc-700'}>CrewQ aggregates publicly available information about Dallas-area venues and events. We are not affiliated with, endorsed by, or sponsored by any venue listed. Venue names, logos, and event details are the property of their respective owners.</p>
              </section>
              <section>
                <h3 className="font-semibold text-base mb-1">3. User Conduct</h3>
                <p className={darkMode ? 'text-zinc-300' : 'text-zinc-700'}>You agree to use CrewQ respectfully. Do not harass, threaten, or impersonate other users. Squad coordination features are provided to help groups organize — meeting strangers from any app carries inherent risks. CrewQ is not responsible for in-person interactions that take place off the platform.</p>
              </section>
              <section>
                <h3 className="font-semibold text-base mb-1">4. User-Submitted Content</h3>
                <p className={darkMode ? 'text-zinc-300' : 'text-zinc-700'}>Events you submit are reviewed before going live. We may reject or remove submissions that violate these terms or our content guidelines. You retain ownership of what you submit but grant CrewQ a license to display it within the app.</p>
              </section>
              <section>
                <h3 className="font-semibold text-base mb-1">5. Eligibility</h3>
                <p className={darkMode ? 'text-zinc-300' : 'text-zinc-700'}>You must be at least 18 to create an account. Age-restricted events (21+) require you to verify your age at the venue — CrewQ does not perform identity verification.</p>
              </section>
              <section>
                <h3 className="font-semibold text-base mb-1">6. Termination</h3>
                <p className={darkMode ? 'text-zinc-300' : 'text-zinc-700'}>We may suspend or terminate accounts for violations of these terms. You may delete your account at any time from settings.</p>
              </section>
              <section>
                <h3 className="font-semibold text-base mb-1">7. Disclaimer</h3>
                <p className={darkMode ? 'text-zinc-300' : 'text-zinc-700'}>CrewQ is provided "as is." We make no warranties about event accuracy, venue availability, or the conduct of other users. Use at your own discretion.</p>
              </section>
              <section>
                <h3 className="font-semibold text-base mb-1">8. Contact</h3>
                <p className={darkMode ? 'text-zinc-300' : 'text-zinc-700'}>Questions or concerns: duncan.mcaloon@gmail.com</p>
              </section>
            </>
          ) : (
            <>
              <section>
                <h3 className="font-semibold text-base mb-1">What we collect</h3>
                <p className={darkMode ? 'text-zinc-300' : 'text-zinc-700'}>Account details you provide (name, age, gender, vibes, optional phone, optional photo, optional relationship status), location when you grant permission (used only to filter nearby events — never stored long-term), events you swipe and RSVP to, and basic usage analytics.</p>
              </section>
              <section>
                <h3 className="font-semibold text-base mb-1">How we use it</h3>
                <p className={darkMode ? 'text-zinc-300' : 'text-zinc-700'}>To personalize your event feed, surface squads that match your vibe, send you relevant notifications, and share aggregate (never personally identifiable) data with venue partners.</p>
              </section>
              <section>
                <h3 className="font-semibold text-base mb-1">What stays private</h3>
                <p className={darkMode ? 'text-zinc-300' : 'text-zinc-700'}>Your relationship status is private by default. Your profile is squad-only by default. We never sell personal data. We do not share your individual swipe history, RSVPs, or location with any third party.</p>
              </section>
              <section>
                <h3 className="font-semibold text-base mb-1">Your rights</h3>
                <p className={darkMode ? 'text-zinc-300' : 'text-zinc-700'}>You can edit profile fields at any time, change visibility settings, and request account deletion (which removes your data within 30 days).</p>
              </section>
              <section>
                <h3 className="font-semibold text-base mb-1">Cookies & tracking</h3>
                <p className={darkMode ? 'text-zinc-300' : 'text-zinc-700'}>CrewQ uses local storage to remember your session and cache lightweight preferences. We do not use third-party advertising trackers.</p>
              </section>
              <section>
                <h3 className="font-semibold text-base mb-1">Children</h3>
                <p className={darkMode ? 'text-zinc-300' : 'text-zinc-700'}>CrewQ is not directed to anyone under 18.</p>
              </section>
              <section>
                <h3 className="font-semibold text-base mb-1">Contact</h3>
                <p className={darkMode ? 'text-zinc-300' : 'text-zinc-700'}>Privacy questions: duncan.mcaloon@gmail.com</p>
              </section>
            </>
          )}
        </div>
        <div className={`p-4 border-t ${darkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <button onClick={onClose} className={`w-full py-3 rounded-xl font-semibold text-white ${darkMode ? 'bg-violet-500 hover:bg-violet-600' : 'bg-orange-500 hover:bg-orange-600'} transition`}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function AuthScreen({ onAuth, onGoogleAuth, onOpenBusinessPortal }) {
  const [step, setStep] = useState(0); // 0 = welcome/login choice, 1 = basic info, 2 = vibes
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');
  const [vibes, setVibes] = useState([]);
  const [intents, setIntents] = useState([]);
  const [bio, setBio] = useState('');
  // Patch 4 — Relationship status with private-by-default toggle
  const [relationshipStatus, setRelationshipStatus] = useState('prefer-not-to-say');
  const [showRelationshipStatus, setShowRelationshipStatus] = useState(false);
  // Patch 6 — Require ToS acceptance to sign up
  const [tosAccepted, setTosAccepted] = useState(false);
  const [showTosModal, setShowTosModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  // Time-based theming for auth screen
  const hour = new Date().getHours();
  const isNightMode = hour >= 17 || hour < 6;

  const handleVibeToggle = (vibeId) => {
    setVibes(prev =>
      prev.includes(vibeId)
        ? prev.filter(v => v !== vibeId)
        : [...prev, vibeId]
    );
  };

  const handleIntentToggle = (intentId) => {
    setIntents(prev =>
      prev.includes(intentId)
        ? prev.filter(i => i !== intentId)
        : [...prev, intentId]
    );
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await onGoogleAuth();
    } catch (error) {
      console.error('Google sign in error:', error);
    }
    setIsGoogleLoading(false);
  };

  const handleSubmit = async () => {
    if (!name) {
      alert('Please enter your name');
      return;
    }
    if (!tosAccepted) {
      alert('Please accept the Terms of Service and Privacy Policy to continue');
      return;
    }

    setIsLoading(true);
    await onAuth({ 
      name, 
      age: age ? parseInt(age) : null, 
      gender: gender || null,
      phone, 
      vibes,
      intents,
      bio, 
      profile_picture: null,
      allow_squad_requests: true,
      show_age_to_squads: true,
      // Patch 4
      relationship_status: relationshipStatus,
      show_relationship_status: showRelationshipStatus,
      // Patch 6
      tos_accepted_at: new Date().toISOString(),
      tos_version: TOS_VERSION
    });
    setIsLoading(false);
  };

  // Theme colors based on time
  const accentColor = isNightMode ? 'violet' : 'orange';
  const gradientClasses = isNightMode ? 'from-violet-500 to-purple-600' : 'from-orange-400 to-yellow-500';
  const bgClass = isNightMode ? 'bg-black' : 'bg-amber-50';
  const cardBgClass = isNightMode ? 'bg-zinc-900' : 'bg-white';
  const textClass = isNightMode ? 'text-white' : 'text-zinc-900';
  const textSecondaryClass = isNightMode ? 'text-zinc-400' : 'text-zinc-600';
  const inputBgClass = isNightMode ? 'bg-zinc-800 text-white' : 'bg-amber-50 text-zinc-900';
  const progressBgClass = isNightMode ? 'bg-zinc-800' : 'bg-amber-200';

  return (
    <div className={`min-h-screen ${bgClass} flex items-center justify-center p-4`}>
      <div className={`${cardBgClass} rounded-3xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl`}>
        <h1 className={`text-3xl font-bold ${textClass} mb-2`}>
          Crew<span className={isNightMode ? 'text-violet-400' : 'text-orange-500'}>Q</span>
        </h1>
        <p className={`${textSecondaryClass} mb-6`}>Dallas Nightlife, Solved</p>

        {step === 0 && (
          <div className="space-y-4">
            <div className="text-center mb-8">
              <div className={`w-24 h-24 bg-gradient-to-br ${gradientClasses} rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg ${isNightMode ? 'shadow-violet-500/25' : 'shadow-orange-500/25'}`}>
                <Users className="w-12 h-12 text-white" />
              </div>
              <h2 className={`text-xl font-bold ${textClass} mb-2`}>Welcome to CrewQ</h2>
              <p className={`${textSecondaryClass} text-sm`}>
                Discover events, build your crew, and experience Dallas nightlife like never before.
              </p>
            </div>

            {/* Google Sign In Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className={`w-full ${isNightMode ? 'bg-white text-zinc-800 hover:bg-zinc-100' : 'bg-zinc-900 text-white hover:bg-zinc-800'} py-4 rounded-xl font-bold text-lg transition disabled:opacity-50 flex items-center justify-center gap-3`}
            >
              {isGoogleLoading ? (
                <div className="w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              {isGoogleLoading ? 'Signing in...' : 'Continue with Google'}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className={`w-full border-t ${isNightMode ? 'border-zinc-800' : 'border-amber-200'}`}></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className={`px-4 ${cardBgClass} ${textSecondaryClass}`}>or</span>
              </div>
            </div>

            {/* Continue without account */}
            <button
              onClick={() => setStep(1)}
              className={`w-full ${isNightMode ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-amber-100 hover:bg-amber-200'} ${textClass} py-4 rounded-xl font-bold text-lg transition`}
            >
              Continue as Guest
            </button>

            <p className={`text-xs ${textSecondaryClass} text-center mt-4`}>
              Sign in with Google to sync your profile across devices
            </p>

            {/* For Business Link */}
            <button
              onClick={onOpenBusinessPortal}
              className={`w-full mt-6 py-3 text-sm ${textSecondaryClass} hover:opacity-80 transition flex items-center justify-center gap-2`}
            >
              <Building2 className="w-4 h-4" />
              For Business
            </button>
          </div>
        )}

        {step >= 1 && (
          <>
            {/* Progress indicator */}
            <div className="flex gap-2 mb-6">
              {[1, 2].map(s => (
                <div
                  key={s}
                  className={`flex-1 h-1 rounded-full ${
                    step >= s ? (isNightMode ? 'bg-violet-500' : 'bg-orange-500') : progressBgClass
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-semibold ${textSecondaryClass} mb-2`}>First Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full ${inputBgClass} rounded-xl px-4 py-3 outline-none focus:ring-2 ${isNightMode ? 'focus:ring-violet-500' : 'focus:ring-orange-500'}`}
                placeholder="What should we call you?"
              />
            </div>

            <div>
              <label className={`block text-sm font-semibold ${textSecondaryClass} mb-2`}>Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className={`w-full ${inputBgClass} rounded-xl px-4 py-3 outline-none focus:ring-2 ${isNightMode ? 'focus:ring-violet-500' : 'focus:ring-orange-500'}`}
                placeholder="Your age"
              />
              <p className={`text-xs ${textSecondaryClass} mt-1`}>Used for 21+ event filtering</p>
            </div>

            <div>
              <label className={`block text-sm font-semibold ${textSecondaryClass} mb-2`}>Gender</label>
              <div className="grid grid-cols-2 gap-2">
                {GENDER_OPTIONS.map(option => (
                  <button
                    key={option.id}
                    onClick={() => setGender(option.id)}
                    className={`px-4 py-3 rounded-xl text-sm font-semibold transition ${
                      gender === option.id
                        ? (isNightMode ? 'bg-violet-500 text-white' : 'bg-orange-500 text-white')
                        : (isNightMode ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-amber-100 text-zinc-600 hover:bg-amber-200')
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Patch 4 — Relationship status (private by default) */}
            <div>
              <label className={`block text-sm font-semibold ${textSecondaryClass} mb-2`}>Relationship Status</label>
              <div className="grid grid-cols-2 gap-2">
                {RELATIONSHIP_OPTIONS.map(option => (
                  <button
                    key={option.id}
                    onClick={() => setRelationshipStatus(option.id)}
                    className={`px-3 py-3 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${
                      relationshipStatus === option.id
                        ? (isNightMode ? 'bg-violet-500 text-white' : 'bg-orange-500 text-white')
                        : (isNightMode ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-amber-100 text-zinc-600 hover:bg-amber-200')
                    }`}
                  >
                    <span>{option.icon}</span>
                    <span className="truncate">{option.label}</span>
                  </button>
                ))}
              </div>
              {relationshipStatus !== 'prefer-not-to-say' && (
                <button
                  onClick={() => setShowRelationshipStatus(!showRelationshipStatus)}
                  className={`mt-2 w-full flex items-center justify-between p-3 rounded-xl border-2 transition ${
                    showRelationshipStatus
                      ? (isNightMode ? 'bg-violet-500/20 border-violet-500 text-white' : 'bg-orange-500/20 border-orange-500 text-zinc-900')
                      : (isNightMode ? 'bg-zinc-800 border-zinc-700 text-zinc-400' : 'bg-amber-100 border-amber-200 text-zinc-600')
                  }`}
                >
                  <span className="text-sm font-medium">Show on my profile</span>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs ${showRelationshipStatus ? (isNightMode ? 'bg-violet-500' : 'bg-orange-500') : (isNightMode ? 'bg-zinc-700' : 'bg-amber-200')}`}>
                    {showRelationshipStatus && '✓'}
                  </span>
                </button>
              )}
              <p className={`text-xs ${textSecondaryClass} mt-1`}>Private by default — toggle to share with squads.</p>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!name}
              className={`w-full bg-gradient-to-r ${gradientClasses} text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition disabled:opacity-50 ${isNightMode ? 'shadow-violet-500/25' : 'shadow-orange-500/25'}`}
            >
              Next
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            {/* What are you here for? */}
            <div>
              <label className={`block text-sm font-semibold ${textSecondaryClass} mb-2`}>What are you here for?</label>
              <p className={`text-xs ${textSecondaryClass} mb-3`}>Select all that apply</p>
              <div className="space-y-2">
                {INTENT_OPTIONS.map(intent => (
                  <button
                    key={intent.id}
                    onClick={() => handleIntentToggle(intent.id)}
                    className={`w-full p-3 rounded-xl text-left transition flex items-center gap-3 ${
                      intents.includes(intent.id)
                        ? (isNightMode ? 'bg-violet-500 bg-opacity-20 border-2 border-violet-500' : 'bg-orange-500 bg-opacity-20 border-2 border-orange-500')
                        : (isNightMode ? 'bg-zinc-800 border-2 border-transparent hover:border-zinc-700' : 'bg-amber-100 border-2 border-transparent hover:border-amber-300')
                    }`}
                  >
                    <span className="text-2xl">{intent.icon}</span>
                    <div>
                      <p className={`font-semibold ${intents.includes(intent.id) ? (isNightMode ? 'text-violet-400' : 'text-orange-600') : textClass}`}>
                        {intent.label}
                      </p>
                      <p className={`text-xs ${textSecondaryClass}`}>{intent.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* What's your vibe? */}
            <div>
              <label className={`block text-sm font-semibold ${textSecondaryClass} mb-2`}>What's your vibe?</label>
              <p className={`text-xs ${textSecondaryClass} mb-3`}>Select all that apply</p>
              <div className="flex flex-wrap gap-2">
                {VIBE_OPTIONS.map(vibe => (
                  <button
                    key={vibe.id}
                    onClick={() => handleVibeToggle(vibe.id)}
                    className={`px-3 py-2 rounded-full text-sm font-semibold transition ${
                      vibes.includes(vibe.id)
                        ? (isNightMode ? 'bg-violet-500 text-white' : 'bg-orange-500 text-white')
                        : (isNightMode ? 'bg-zinc-800 text-zinc-400' : 'bg-amber-100 text-zinc-600')
                    }`}
                  >
                    {vibe.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Patch 6 — ToS acceptance */}
            <div className={`p-3 rounded-xl ${isNightMode ? 'bg-zinc-800' : 'bg-amber-100'}`}>
              <button
                onClick={() => setTosAccepted(!tosAccepted)}
                className="w-full flex items-start gap-3 text-left"
              >
                <span className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 flex items-center justify-center text-white text-xs ${tosAccepted ? (isNightMode ? 'bg-violet-500' : 'bg-orange-500') : (isNightMode ? 'bg-zinc-700' : 'bg-amber-200')}`}>
                  {tosAccepted && '✓'}
                </span>
                <span className={`text-xs ${textSecondaryClass} leading-relaxed`}>
                  I agree to the{' '}
                  <span
                    onClick={(e) => { e.stopPropagation(); setShowTosModal(true); }}
                    className={`underline font-semibold ${isNightMode ? 'text-violet-400' : 'text-orange-600'}`}
                  >Terms of Service</span>
                  {' '}and{' '}
                  <span
                    onClick={(e) => { e.stopPropagation(); setShowPrivacyModal(true); }}
                    className={`underline font-semibold ${isNightMode ? 'text-violet-400' : 'text-orange-600'}`}
                  >Privacy Policy</span>
                  . CrewQ is a beta product and is not affiliated with any venue listed.
                </span>
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className={`flex-1 ${isNightMode ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-amber-100 hover:bg-amber-200'} ${textClass} py-4 rounded-xl font-bold transition`}
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading || !tosAccepted}
                className={`flex-1 bg-gradient-to-r ${gradientClasses} text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition disabled:opacity-50`}
              >
                {isLoading ? 'Creating...' : 'Get Started'}
              </button>
            </div>
          </div>
        )}
        {/* Patch 6 — ToS / Privacy modals */}
        {showTosModal && <LegalModal type="tos" onClose={() => setShowTosModal(false)} darkMode={isNightMode} />}
        {showPrivacyModal && <LegalModal type="privacy" onClose={() => setShowPrivacyModal(false)} darkMode={isNightMode} />}
      </div>
    </div>
  );
}

// Google OAuth Onboarding Modal - for new Google users to complete their profile
function GoogleOnboardingModal({ pendingUser, onComplete }) {
  const [step, setStep] = useState(1);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [vibes, setVibes] = useState([]);
  const [intents, setIntents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  // Patch 4 — Relationship status
  const [relationshipStatus, setRelationshipStatus] = useState('prefer-not-to-say');
  const [showRelationshipStatus, setShowRelationshipStatus] = useState(false);
  // Patch 6 — ToS
  const [tosAccepted, setTosAccepted] = useState(false);
  const [showTosModal, setShowTosModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const handleVibeToggle = (vibeId) => {
    setVibes(prev =>
      prev.includes(vibeId)
        ? prev.filter(v => v !== vibeId)
        : [...prev, vibeId]
    );
  };

  const handleIntentToggle = (intentId) => {
    setIntents(prev =>
      prev.includes(intentId)
        ? prev.filter(i => i !== intentId)
        : [...prev, intentId]
    );
  };

  const handleSubmit = async () => {
    if (!tosAccepted) {
      alert('Please accept the Terms of Service and Privacy Policy to continue');
      return;
    }
    setIsLoading(true);
    await onComplete({
      ...pendingUser,
      age: age ? parseInt(age) : null,
      gender: gender || null,
      vibes,
      intents,
      allow_squad_requests: true,
      show_age_to_squads: true,
      // Patch 4
      relationship_status: relationshipStatus,
      show_relationship_status: showRelationshipStatus,
      // Patch 6
      tos_accepted_at: new Date().toISOString(),
      tos_version: TOS_VERSION
    });
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-900 rounded-3xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Welcome Header */}
        <div className="text-center mb-6">
          {pendingUser.profile_picture && (
            <img 
              src={pendingUser.profile_picture} 
              alt={pendingUser.name}
              className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-orange-500"
            />
          )}
          <h1 className="text-2xl font-bold text-white mb-1">
            Welcome, {pendingUser.name}! 👋
          </h1>
          <p className="text-zinc-400 text-sm">Let's personalize your experience</p>
        </div>

        {/* Progress indicator */}
        <div className="flex gap-2 mb-6">
          {[1, 2].map(s => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full ${
                step >= s ? 'bg-orange-500' : 'bg-zinc-800'
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-2">Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Your age"
              />
              <p className="text-xs text-zinc-500 mt-1">Used for 21+ event filtering</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-2">Gender</label>
              <div className="grid grid-cols-2 gap-2">
                {GENDER_OPTIONS.map(option => (
                  <button
                    key={option.id}
                    onClick={() => setGender(option.id)}
                    className={`px-4 py-3 rounded-xl text-sm font-semibold transition ${
                      gender === option.id
                        ? 'bg-orange-500 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-zinc-500 mt-1">Helps match you with the right squads</p>
            </div>

            {/* Patch 4 — Relationship status (private by default) */}
            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-2">Relationship Status</label>
              <div className="grid grid-cols-2 gap-2">
                {RELATIONSHIP_OPTIONS.map(option => (
                  <button
                    key={option.id}
                    onClick={() => setRelationshipStatus(option.id)}
                    className={`px-3 py-3 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${
                      relationshipStatus === option.id
                        ? 'bg-orange-500 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    <span>{option.icon}</span>
                    <span className="truncate">{option.label}</span>
                  </button>
                ))}
              </div>
              {relationshipStatus !== 'prefer-not-to-say' && (
                <button
                  onClick={() => setShowRelationshipStatus(!showRelationshipStatus)}
                  className={`mt-2 w-full flex items-center justify-between p-3 rounded-xl border-2 transition ${
                    showRelationshipStatus ? 'bg-orange-500/20 border-orange-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                  }`}
                >
                  <span className="text-sm font-medium">Show on my profile</span>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs ${showRelationshipStatus ? 'bg-orange-500' : 'bg-zinc-700'}`}>
                    {showRelationshipStatus && '✓'}
                  </span>
                </button>
              )}
              <p className="text-xs text-zinc-500 mt-1">Private by default — toggle to share with squads.</p>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition"
            >
              Next
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            {/* What are you here for? */}
            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-2">What are you here for?</label>
              <p className="text-xs text-zinc-500 mb-3">Select all that apply</p>
              <div className="space-y-2">
                {INTENT_OPTIONS.map(intent => (
                  <button
                    key={intent.id}
                    onClick={() => handleIntentToggle(intent.id)}
                    className={`w-full p-3 rounded-xl text-left transition flex items-center gap-3 ${
                      intents.includes(intent.id)
                        ? 'bg-orange-500 bg-opacity-20 border-2 border-orange-500'
                        : 'bg-zinc-800 border-2 border-transparent hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-2xl">{intent.icon}</span>
                    <div>
                      <p className={`font-semibold ${intents.includes(intent.id) ? 'text-orange-400' : 'text-white'}`}>
                        {intent.label}
                      </p>
                      <p className="text-xs text-zinc-500">{intent.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* What's your vibe? */}
            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-2">What's your vibe?</label>
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

            {/* Patch 6 — ToS acceptance */}
            <div className="p-3 rounded-xl bg-zinc-800">
              <button
                onClick={() => setTosAccepted(!tosAccepted)}
                className="w-full flex items-start gap-3 text-left"
              >
                <span className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 flex items-center justify-center text-white text-xs ${tosAccepted ? 'bg-orange-500' : 'bg-zinc-700'}`}>
                  {tosAccepted && '✓'}
                </span>
                <span className="text-xs text-zinc-400 leading-relaxed">
                  I agree to the{' '}
                  <span onClick={(e) => { e.stopPropagation(); setShowTosModal(true); }} className="underline font-semibold text-orange-400">Terms of Service</span>
                  {' '}and{' '}
                  <span onClick={(e) => { e.stopPropagation(); setShowPrivacyModal(true); }} className="underline font-semibold text-orange-400">Privacy Policy</span>
                  . CrewQ is a beta product and is not affiliated with any venue listed.
                </span>
              </button>
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
                disabled={isLoading || !tosAccepted}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition disabled:opacity-50"
              >
                {isLoading ? 'Setting up...' : 'Let\'s Go! 🎉'}
              </button>
            </div>
          </div>
        )}
        {/* Patch 6 — ToS / Privacy modals */}
        {showTosModal && <LegalModal type="tos" onClose={() => setShowTosModal(false)} darkMode={true} />}
        {showPrivacyModal && <LegalModal type="privacy" onClose={() => setShowPrivacyModal(false)} darkMode={true} />}
      </div>
    </div>
  );
}

// ============================================
// ENHANCED ADMIN PORTAL - CrewQ
// Features: Clickable stats, Edit modals, User analytics, Detailed views
// ============================================

const BUSINESS_VENUE_TYPES = [
  { id: 'bar', label: 'Bar', icon: '🍺' },
  { id: 'restaurant', label: 'Restaurant', icon: '🍽️' },
  { id: 'club', label: 'Nightclub', icon: '🎵' },
  { id: 'lounge', label: 'Lounge', icon: '🛋️' },
  { id: 'brewery', label: 'Brewery', icon: '🍻' },
  { id: 'rooftop', label: 'Rooftop', icon: '🌃' },
];

const BUSINESS_EVENT_CATEGORIES = [
  { id: 'nightlife', name: 'Nightlife', icon: '🌙' },
  { id: 'social', name: 'Social', icon: '👥' },
  { id: 'wellness', name: 'Wellness', icon: '💪' },
  { id: 'professional', name: 'Professional', icon: '💼' },
  { id: 'special', name: 'Special Interest', icon: '⭐' },
];

const BUSINESS_EVENT_TYPES = {
  nightlife: ['Happy Hour', 'DJ Night', 'Live Music', 'Ladies Night', 'Karaoke', 'Industry Night'],
  social: ['Trivia Night', 'Game Night', 'Watch Party', 'Speed Dating', 'Singles Mixer'],
  wellness: ['Yoga & Brunch', 'Sober Social', 'Meditation'],
  professional: ['Networking Event', 'Corporate Happy Hour', 'Mixer'],
  special: ['Wine Tasting', 'Beer Tasting', 'Comedy Show', 'Art Night', 'Themed Party'],
};

const ADMIN_EMAILS = ['duncan.mcaloon@gmail.com'];

const isAdminUser = async (email) => {
  if (!email) return false;
  if (ADMIN_EMAILS.includes(email.toLowerCase())) return true;
  try {
    if (supabaseClient) {
      const { data } = await supabaseClient.from('admin_users').select('email').eq('email', email.toLowerCase()).single();
      return !!data;
    }
  } catch { }
  return false;
};

function AdminPortal({ onClose, userEmail }) {
  const [currentView, setCurrentView] = useState('dashboard');
  const [establishments, setEstablishments] = useState([]);
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [editingVenue, setEditingVenue] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);

  useEffect(() => { loadData(); }, []);

  // Auto-refresh every 60 seconds, but only on dashboard view (not during editing)
  useEffect(() => {
    if (currentView !== 'dashboard') return; // Don't refresh while editing
    
    const refreshInterval = setInterval(() => {
      loadData();
    }, 60000); // Changed to 60 seconds
    return () => clearInterval(refreshInterval);
  }, [currentView]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: estData } = await supabaseClient.from('establishments').select('*').order('created_at', { ascending: false });
      setEstablishments(estData || []);
      const { data: evtData } = await supabaseClient.from('events').select('*').order('date', { ascending: false });
      setEvents(evtData || []);
      const { data: userData } = await supabaseClient.from('users').select('*').order('created_at', { ascending: false });
      setUsers(userData || []);
    } catch (error) { console.error('Error loading data:', error); }
    setLoading(false);
  };

  const showToastMsg = (msg, type = 'success') => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3000); };

  const totalViews = events.reduce((sum, e) => sum + (e.views || 0), 0);
  const totalRsvps = events.reduce((sum, e) => sum + (e.rsvps || 0), 0);
  const totalCheckins = events.reduce((sum, e) => sum + (e.checkins || 0), 0);
  const pendingVenues = establishments.filter(e => e.status === 'pending');
  const liveEvents = events.filter(e => !e.status || e.status === 'live');
  const topEvents = [...events].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 10);

  // CRUD
  const handleCreateVenue = async (venueData) => {
    try {
      const { data, error } = await supabaseClient.from('establishments').insert([venueData]).select().single();
      if (error) throw error;
      setEstablishments([data, ...establishments]);
      showToastMsg(`Venue "${venueData.name}" created!`);
      setCurrentView('venues');
    } catch (err) { console.error(err); showToastMsg('Error creating venue', 'error'); }
  };

  const handleUpdateVenue = async (id, updates) => {
    try {
      const { data, error } = await supabaseClient.from('establishments').update(updates).eq('id', id).select().single();
      if (error) throw error;
      setEstablishments(establishments.map(e => e.id === id ? data : e));
      showToastMsg('Venue updated!');
      setEditingVenue(null);
    } catch { showToastMsg('Error updating venue', 'error'); }
  };

  const handleDeleteVenue = async (id) => {
    if (!confirm('Delete this venue?')) return;
    try {
      await supabaseClient.from('establishments').delete().eq('id', id);
      setEstablishments(establishments.filter(e => e.id !== id));
      showToastMsg('Venue deleted');
      setSelectedVenue(null);
      setCurrentView('venues');
    } catch { showToastMsg('Error deleting venue', 'error'); }
  };

  const handleCreateEvent = async (eventData) => {
    try {
      const { data, error } = await supabaseClient.from('events').insert([eventData]).select().single();
      if (error) throw error;
      setEvents([data, ...events]);
      showToastMsg(`Event "${eventData.name}" created!`);
      setCurrentView('events');
    } catch (err) {
      // Patch A.1 — Surface the real Supabase error so missing columns / constraint violations are visible
      console.error('Create event failed:', err, 'Payload:', eventData);
      const msg = err?.message || err?.hint || err?.details || 'Error creating event';
      showToastMsg(`Create failed: ${msg}`, 'error');
    }
  };

  const handleUpdateEvent = async (id, updates) => {
    try {
      const { data, error } = await supabaseClient.from('events').update(updates).eq('id', id).select().single();
      if (error) throw error;
      setEvents(events.map(e => e.id === id ? data : e));
      showToastMsg('Event updated!');
      setEditingEvent(null);
      if (selectedEvent?.id === id) setSelectedEvent(data);
    } catch (err) {
      console.error('Update event failed:', err);
      const msg = err?.message || err?.hint || 'Error updating event';
      showToastMsg(`Update failed: ${msg}`, 'error');
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!confirm('Delete this event?')) return;
    try {
      await supabaseClient.from('events').delete().eq('id', id);
      setEvents(events.filter(e => e.id !== id));
      showToastMsg('Event deleted');
      setSelectedEvent(null);
      setCurrentView('events');
    } catch { showToastMsg('Error deleting event', 'error'); }
  };

  // Patch A — Backfill helper: geocode every event missing lat/long
  const handleBackfillGeocoding = async () => {
    if (!supabaseClient) return;
    try {
      const { data: missing, error } = await supabaseClient
        .from('events')
        .select('id, name, venue, address, neighborhood')
        .or('latitude.is.null,longitude.is.null')
        .limit(50);
      if (error) throw error;
      if (!missing || missing.length === 0) {
        showToastMsg('All events already have coordinates ✓');
        return;
      }
      showToastMsg(`Geocoding ${missing.length} events…`);
      let success = 0;
      for (const ev of missing) {
        const geo = await geocodeAddress(buildAddressString({
          address: ev.address || ev.venue,
          neighborhood: ev.neighborhood,
          city: 'Dallas'
        }));
        if (geo) {
          await supabaseClient
            .from('events')
            .update({ latitude: geo.latitude, longitude: geo.longitude })
            .eq('id', ev.id);
          success++;
        }
        // Stay well under Mapbox's 600/min free tier
        await new Promise(r => setTimeout(r, 200));
      }
      showToastMsg(`Geocoded ${success} of ${missing.length} events`);
      // Reload events
      const { data: reloaded } = await supabaseClient.from('events').select('*').order('created_at', { ascending: false });
      if (reloaded) setEvents(reloaded);
    } catch (err) {
      console.error('Backfill error:', err);
      showToastMsg('Backfill failed — check console', 'error');
    }
  };

  // Approval handlers
  const handleApproveEvent = async (id) => {
    try {
      const { data, error } = await supabaseClient
        .from('events')
        .update({ status: 'live', approved_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      setEvents(events.map(e => e.id === id ? data : e));
      // Patch 5 — Notify the submitter (only if it was a user-submitted event)
      if (data.submitted_by_user_id) {
        try {
          await supabaseClient
            .from('notifications')
            .insert([{
              user_id: data.submitted_by_user_id,
              type: 'event_approved',
              title: 'Your event was approved!',
              message: `"${data.name}" is now live in the Discover feed.`,
              event_id: data.id,
              read: false,
              created_at: new Date().toISOString()
            }]);
        } catch (notifErr) {
          console.error('Failed to send approval notification:', notifErr);
        }
      }
      showToastMsg('Event approved! Now live in Discover.');
    } catch { showToastMsg('Error approving event', 'error'); }
  };

  const handleRejectEvent = async (id, reason) => {
    try {
      const { data, error } = await supabaseClient
        .from('events')
        .update({ status: 'rejected', rejection_reason: reason || 'Did not meet guidelines' })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      setEvents(events.map(e => e.id === id ? data : e));
      // Patch 5 — Notify the submitter (only if it was a user-submitted event)
      if (data.submitted_by_user_id) {
        try {
          await supabaseClient
            .from('notifications')
            .insert([{
              user_id: data.submitted_by_user_id,
              type: 'event_rejected',
              title: 'Event submission not approved',
              message: `"${data.name}" wasn't approved. Reason: ${data.rejection_reason}`,
              event_id: data.id,
              read: false,
              created_at: new Date().toISOString()
            }]);
        } catch (notifErr) {
          console.error('Failed to send rejection notification:', notifErr);
        }
      }
      showToastMsg('Event rejected.');
    } catch { showToastMsg('Error rejecting event', 'error'); }
  };

  // Pending counts
  const pendingEvents = events.filter(e => e.status === 'pending');

  // ========== APPROVALS QUEUE ==========
  const ApprovalsQueue = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => setCurrentView('dashboard')} className="p-2 hover:bg-gray-800 rounded-lg"><ChevronLeft className="w-5 h-5 text-gray-400" /></button>
        <div>
          <h1 className="text-xl font-bold text-white">Approvals Queue</h1>
          <p className="text-gray-400 text-sm">{pendingEvents.length} pending review</p>
        </div>
      </div>

      {pendingEvents.length === 0 ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
          <CheckCircle className="w-16 h-16 mx-auto text-emerald-500 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">All caught up!</h2>
          <p className="text-gray-400">No events pending approval</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingEvents.map(event => (
            <div key={event.id} className="bg-gray-800 rounded-xl border border-amber-500/30 overflow-hidden">
              <div className="p-4 bg-amber-500/10 border-b border-amber-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">{event.name}</p>
                    <p className="text-amber-400 text-xs">Pending Review</p>
                  </div>
                </div>
                <span className="text-gray-500 text-xs">{event.created_at ? new Date(event.created_at).toLocaleDateString() : ''}</span>
              </div>
              
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-gray-500">Venue</p><p className="text-white">{event.venue || '-'}</p></div>
                  <div><p className="text-gray-500">Neighborhood</p><p className="text-white">{event.neighborhood || '-'}</p></div>
                  <div><p className="text-gray-500">Date</p><p className="text-white">{event.date || '-'}</p></div>
                  <div><p className="text-gray-500">Time</p><p className="text-white">{event.time || '-'}</p></div>
                  <div><p className="text-gray-500">Category</p><p className="text-white">{event.category || '-'}</p></div>
                  <div><p className="text-gray-500">Type</p><p className="text-white">{event.type || '-'}</p></div>
                </div>
                
                {event.description && (
                  <div><p className="text-gray-500 text-sm">Description</p><p className="text-gray-300 text-sm">{event.description}</p></div>
                )}
                
                {event.drink_specials && (
                  <div><p className="text-gray-500 text-sm">Drink Specials</p><p className="text-emerald-400 text-sm">{event.drink_specials}</p></div>
                )}

                {event.image_url && (
                  <div>
                    <p className="text-gray-500 text-sm mb-2">Event Image</p>
                    <img src={event.image_url} alt={event.name} className="w-full h-32 object-cover rounded-lg" />
                  </div>
                )}

                <div className="flex gap-3 pt-3 border-t border-gray-700">
                  <button 
                    onClick={() => handleApproveEvent(event.id)} 
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition"
                  >
                    <Check className="w-5 h-5" />
                    Approve
                  </button>
                  <button 
                    onClick={() => {
                      const reason = prompt('Rejection reason (optional):');
                      handleRejectEvent(event.id, reason);
                    }} 
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 text-red-400 rounded-xl font-semibold hover:bg-red-500/30 transition"
                  >
                    <X className="w-5 h-5" />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ========== DASHBOARD ==========
  const AdminDashboard = () => (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-white">Admin Dashboard</h1><p className="text-gray-400">CrewQ Analytics & Management</p></div>
      
      {/* Approvals Queue Alert */}
      {pendingEvents.length > 0 && (
        <button onClick={() => setCurrentView('approvals')} className="w-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl p-4 border border-amber-500/50 text-left hover:border-amber-400 transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold">Pending Approvals</p>
                <p className="text-amber-400 text-sm">{pendingEvents.length} event{pendingEvents.length !== 1 ? 's' : ''} awaiting review</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-amber-400" />
          </div>
        </button>
      )}
      
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setCurrentView('venues')} className="bg-gray-800 rounded-xl p-4 border border-gray-700 text-left hover:border-blue-500 transition">
          <Building2 className="w-7 h-7 text-blue-400 mb-2" />
          <p className="text-2xl font-bold text-white">{establishments.length}</p>
          <p className="text-gray-400 text-sm">Venues</p>
          {pendingVenues.length > 0 && <p className="text-amber-400 text-xs mt-1">{pendingVenues.length} pending</p>}
        </button>
        <button onClick={() => setCurrentView('events')} className="bg-gray-800 rounded-xl p-4 border border-gray-700 text-left hover:border-emerald-500 transition">
          <Calendar className="w-7 h-7 text-emerald-400 mb-2" />
          <p className="text-2xl font-bold text-white">{events.length}</p>
          <p className="text-gray-400 text-sm">Events</p>
          <p className="text-emerald-400 text-xs mt-1">{liveEvents.length} live</p>
        </button>
        <button onClick={() => setCurrentView('analytics-views')} className="bg-gray-800 rounded-xl p-4 border border-gray-700 text-left hover:border-purple-500 transition">
          <Eye className="w-7 h-7 text-purple-400 mb-2" />
          <p className="text-2xl font-bold text-white">{totalViews.toLocaleString()}</p>
          <p className="text-gray-400 text-sm">Total Views</p>
        </button>
        <button onClick={() => setCurrentView('analytics-engagement')} className="bg-gray-800 rounded-xl p-4 border border-gray-700 text-left hover:border-amber-500 transition">
          <Users className="w-7 h-7 text-amber-400 mb-2" />
          <p className="text-2xl font-bold text-white">{totalRsvps}</p>
          <p className="text-gray-400 text-sm">RSVPs</p>
          <p className="text-amber-400 text-xs mt-1">{totalCheckins} check-ins</p>
        </button>
      </div>

      <button onClick={() => setCurrentView('users')} className="w-full bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl p-4 text-left hover:opacity-90 transition">
        <div className="flex items-center justify-between">
          <div><p className="text-white font-semibold">User Analytics</p><p className="text-violet-200 text-sm">{users.length} users</p></div>
          <div className="text-right"><p className="text-2xl font-bold text-white">{users.filter(u => u.created_at && new Date(u.created_at) > new Date(Date.now() - 7*24*60*60*1000)).length}</p><p className="text-violet-200 text-xs">new this week</p></div>
        </div>
      </button>

      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <h2 className="font-semibold text-white mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setCurrentView('approvals')} className="flex items-center gap-3 p-3 bg-amber-500/20 rounded-xl hover:bg-amber-500/30 border border-amber-500/30">
            <Clock className="w-5 h-5 text-amber-400" /><span className="text-white text-sm">Review Queue {pendingEvents.length > 0 && `(${pendingEvents.length})`}</span>
          </button>
          <button onClick={() => setCurrentView('create-event')} className="flex items-center gap-3 p-3 bg-emerald-500/20 rounded-xl hover:bg-emerald-500/30 border border-emerald-500/30">
            <Calendar className="w-5 h-5 text-emerald-400" /><span className="text-white text-sm">Create Event</span>
          </button>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700">
        <div className="p-4 border-b border-gray-700 flex justify-between"><h2 className="font-semibold text-white">Recent Events</h2><button onClick={() => setCurrentView('events')} className="text-violet-400 text-sm">View All →</button></div>
        <div className="divide-y divide-gray-700">
          {events.slice(0, 5).map(evt => (
            <button key={evt.id} onClick={() => { setSelectedEvent(evt); setCurrentView('event-detail'); }} className="w-full p-4 flex items-center gap-3 hover:bg-gray-750 text-left">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center"><Calendar className="w-6 h-6 text-white" /></div>
              <div className="flex-1 min-w-0"><p className="text-white font-medium truncate">{evt.name}</p><p className="text-gray-500 text-xs">{evt.venue} • {evt.date}</p></div>
              <div className="text-right text-xs"><div><span className="text-white font-medium">{evt.views || 0}</span><span className="text-gray-500 ml-1">views</span></div><div><span className="text-white font-medium">{evt.rsvps || 0}</span><span className="text-gray-500 ml-1">rsvps</span></div></div>
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          ))}
          {events.length === 0 && <div className="p-8 text-center text-gray-500">No events yet</div>}
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700">
        <div className="p-4 border-b border-gray-700"><h2 className="font-semibold text-white">🔥 Top Events</h2></div>
        <div className="p-4 space-y-3">
          {topEvents.slice(0, 3).map((evt, i) => (
            <button key={evt.id} onClick={() => { setSelectedEvent(evt); setCurrentView('event-detail'); }} className="w-full flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 text-left">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i === 0 ? 'bg-amber-500 text-black' : i === 1 ? 'bg-gray-400 text-black' : 'bg-amber-700 text-white'}`}>{i + 1}</div>
              <div className="flex-1 min-w-0"><p className="text-white font-medium truncate">{evt.name}</p><p className="text-gray-500 text-xs">{evt.venue}</p></div>
              <div className="text-right"><p className="text-white font-medium">{(evt.views || 0).toLocaleString()}</p><p className="text-gray-500 text-xs">views</p></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ========== ANALYTICS VIEWS ==========
  const AnalyticsViews = () => {
    const eventsByViews = [...events].sort((a, b) => (b.views || 0) - (a.views || 0));
    const venueViews = {};
    events.forEach(e => { venueViews[e.venue || 'Unknown'] = (venueViews[e.venue || 'Unknown'] || 0) + (e.views || 0); });
    const sortedVenueViews = Object.entries(venueViews).sort((a, b) => b[1] - a[1]);
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setCurrentView('dashboard')} className="p-2 hover:bg-gray-800 rounded-lg"><ChevronLeft className="w-5 h-5 text-gray-400" /></button>
          <div><h1 className="text-xl font-bold text-white">Views Analytics</h1><p className="text-gray-400 text-sm">{totalViews.toLocaleString()} total</p></div>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <h3 className="text-white font-semibold mb-3">By Venue</h3>
          <div className="space-y-3">
            {sortedVenueViews.slice(0, 10).map(([venue, views], i) => (
              <div key={venue} className="flex items-center gap-3">
                <span className="text-gray-500 text-sm w-6">{i + 1}</span>
                <div className="flex-1"><p className="text-white text-sm">{venue}</p><div className="h-2 bg-gray-700 rounded-full mt-1"><div className="h-full bg-purple-500 rounded-full" style={{ width: `${(views / (sortedVenueViews[0]?.[1] || 1)) * 100}%` }} /></div></div>
                <span className="text-white font-medium">{views.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700">
          <div className="p-4 border-b border-gray-700"><h3 className="text-white font-semibold">All Events</h3></div>
          <div className="divide-y divide-gray-700 max-h-80 overflow-y-auto">
            {eventsByViews.map((evt, i) => (
              <button key={evt.id} onClick={() => { setSelectedEvent(evt); setCurrentView('event-detail'); }} className="w-full p-3 flex items-center gap-3 hover:bg-gray-750 text-left">
                <span className="text-gray-500 text-sm w-6">{i + 1}</span>
                <div className="flex-1 min-w-0"><p className="text-white text-sm truncate">{evt.name}</p><p className="text-gray-500 text-xs">{evt.venue}</p></div>
                <span className="text-purple-400 font-medium">{(evt.views || 0).toLocaleString()}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ========== ANALYTICS ENGAGEMENT ==========
  const AnalyticsEngagement = () => {
    const eventsByRsvp = [...events].sort((a, b) => (b.rsvps || 0) - (a.rsvps || 0));
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setCurrentView('dashboard')} className="p-2 hover:bg-gray-800 rounded-lg"><ChevronLeft className="w-5 h-5 text-gray-400" /></button>
          <div><h1 className="text-xl font-bold text-white">Engagement</h1></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700"><Users className="w-6 h-6 text-amber-400 mb-2" /><p className="text-2xl font-bold text-white">{totalRsvps}</p><p className="text-gray-400 text-sm">RSVPs</p></div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700"><CheckCircle className="w-6 h-6 text-emerald-400 mb-2" /><p className="text-2xl font-bold text-white">{totalCheckins}</p><p className="text-gray-400 text-sm">Check-ins</p></div>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700">
          <div className="p-4 border-b border-gray-700"><h3 className="text-white font-semibold">Events by RSVPs</h3></div>
          <div className="divide-y divide-gray-700 max-h-80 overflow-y-auto">
            {eventsByRsvp.filter(e => e.rsvps > 0).map((evt, i) => (
              <button key={evt.id} onClick={() => { setSelectedEvent(evt); setCurrentView('event-detail'); }} className="w-full p-3 flex items-center gap-3 hover:bg-gray-750 text-left">
                <span className="text-gray-500 text-sm w-6">{i + 1}</span>
                <div className="flex-1 min-w-0"><p className="text-white text-sm truncate">{evt.name}</p><p className="text-gray-500 text-xs">{evt.venue}</p></div>
                <span className="text-amber-400 font-medium">{evt.rsvps || 0}</span>
              </button>
            ))}
            {eventsByRsvp.filter(e => e.rsvps > 0).length === 0 && <div className="p-8 text-center text-gray-500">No RSVPs yet</div>}
          </div>
        </div>
      </div>
    );
  };

  // ========== USER ANALYTICS ==========
  const UserAnalytics = () => {
    const recentUsers = users.filter(u => u.created_at && new Date(u.created_at) > new Date(Date.now() - 7*24*60*60*1000));
    const vibeStats = {};
    users.forEach(u => (u.vibes || []).forEach(v => { vibeStats[v] = (vibeStats[v] || 0) + 1; }));
    const sortedVibes = Object.entries(vibeStats).sort((a, b) => b[1] - a[1]);
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setCurrentView('dashboard')} className="p-2 hover:bg-gray-800 rounded-lg"><ChevronLeft className="w-5 h-5 text-gray-400" /></button>
          <div><h1 className="text-xl font-bold text-white">Users</h1></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700"><Users className="w-6 h-6 text-violet-400 mb-2" /><p className="text-2xl font-bold text-white">{users.length}</p><p className="text-gray-400 text-sm">Total</p></div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700"><Zap className="w-6 h-6 text-emerald-400 mb-2" /><p className="text-2xl font-bold text-white">{recentUsers.length}</p><p className="text-gray-400 text-sm">New This Week</p></div>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <h3 className="text-white font-semibold mb-3">Popular Vibes</h3>
          <div className="flex flex-wrap gap-2">{sortedVibes.slice(0, 12).map(([vibe, count]) => (<span key={vibe} className="px-3 py-1 bg-violet-500/20 text-violet-300 rounded-full text-sm">{vibe} ({count})</span>))}</div>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700">
          <div className="p-4 border-b border-gray-700"><h3 className="text-white font-semibold">Recent Users</h3></div>
          <div className="divide-y divide-gray-700 max-h-64 overflow-y-auto">
            {users.slice(0, 20).map(user => (
              <div key={user.id} className="p-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">{user.profile_picture ? <img src={user.profile_picture} className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-gray-400" />}</div>
                <div className="flex-1 min-w-0"><p className="text-white text-sm truncate">{user.name || 'Anonymous'}</p><p className="text-gray-500 text-xs">{user.email || 'No email'}</p></div>
                <p className="text-gray-500 text-xs">{user.created_at ? new Date(user.created_at).toLocaleDateString() : ''}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ========== EVENT DETAIL ==========
  const EventDetail = () => {
    if (!selectedEvent) return null;
    const e = selectedEvent;
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => { setSelectedEvent(null); setCurrentView('events'); }} className="p-2 hover:bg-gray-800 rounded-lg"><ChevronLeft className="w-5 h-5 text-gray-400" /></button>
          <div className="flex-1"><h1 className="text-xl font-bold text-white truncate">{e.name}</h1></div>
          <button onClick={() => setEditingEvent(e)} className="p-2 hover:bg-gray-800 rounded-lg"><Edit2 className="w-5 h-5 text-blue-400" /></button>
        </div>
        <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center"><Calendar className="w-8 h-8 text-white" /></div>
            <div><p className="text-white font-bold text-lg">{e.name}</p><p className="text-violet-200">{e.venue}</p></div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div><p className="text-2xl font-bold text-white">{e.views || 0}</p><p className="text-violet-200 text-xs">Views</p></div>
            <div><p className="text-2xl font-bold text-white">{e.rsvps || 0}</p><p className="text-violet-200 text-xs">RSVPs</p></div>
            <div><p className="text-2xl font-bold text-white">{e.checkins || 0}</p><p className="text-violet-200 text-xs">Check-ins</p></div>
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 space-y-3">
          <h3 className="text-white font-semibold">Details</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-gray-500">Date</p><p className="text-white">{e.date || '-'}</p></div>
            <div><p className="text-gray-500">Time</p><p className="text-white">{e.time || '-'}</p></div>
            <div><p className="text-gray-500">Neighborhood</p><p className="text-white">{e.neighborhood || '-'}</p></div>
            <div><p className="text-gray-500">Category</p><p className="text-white">{e.category || '-'}</p></div>
            <div><p className="text-gray-500">Type</p><p className="text-white">{e.type || '-'}</p></div>
            <div><p className="text-gray-500">Status</p><p className={e.status === 'live' || !e.status ? 'text-emerald-400' : 'text-amber-400'}>{e.status || 'live'}</p></div>
          </div>
          {e.drink_specials && <div><p className="text-gray-500 text-sm">Specials</p><p className="text-white">{e.drink_specials}</p></div>}
          {e.description && <div><p className="text-gray-500 text-sm">Description</p><p className="text-white text-sm">{e.description}</p></div>}
        </div>
        <div className="flex gap-3">
          <button onClick={() => setEditingEvent(e)} className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl font-semibold">Edit</button>
          <button onClick={() => handleDeleteEvent(e.id)} className="px-4 py-3 bg-red-500/20 text-red-400 rounded-xl font-semibold">Delete</button>
        </div>
      </div>
    );
  };

  // ========== VENUE DETAIL ==========
  const VenueDetail = () => {
    if (!selectedVenue) return null;
    const v = selectedVenue;
    const venueEvents = events.filter(e => e.establishment_id === v.id || e.venue === v.name);
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => { setSelectedVenue(null); setCurrentView('venues'); }} className="p-2 hover:bg-gray-800 rounded-lg"><ChevronLeft className="w-5 h-5 text-gray-400" /></button>
          <div className="flex-1"><h1 className="text-xl font-bold text-white truncate">{v.name}</h1></div>
          <button onClick={() => setEditingVenue(v)} className="p-2 hover:bg-gray-800 rounded-lg"><Edit2 className="w-5 h-5 text-blue-400" /></button>
        </div>
        <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center text-3xl">{BUSINESS_VENUE_TYPES.find(t => t.id === v.venue_type)?.icon || '🏢'}</div>
            <div><p className="text-white font-bold text-lg">{v.name}</p><p className="text-blue-200">{v.neighborhood}</p></div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div><p className="text-2xl font-bold text-white">{venueEvents.length}</p><p className="text-blue-200 text-xs">Events</p></div>
            <div><p className="text-2xl font-bold text-white">{venueEvents.reduce((s, e) => s + (e.views || 0), 0)}</p><p className="text-blue-200 text-xs">Views</p></div>
            <div><p className="text-2xl font-bold text-white">{venueEvents.reduce((s, e) => s + (e.rsvps || 0), 0)}</p><p className="text-blue-200 text-xs">RSVPs</p></div>
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 space-y-3">
          <h3 className="text-white font-semibold">Details</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-gray-500">Type</p><p className="text-white">{BUSINESS_VENUE_TYPES.find(t => t.id === v.venue_type)?.label || '-'}</p></div>
            <div><p className="text-gray-500">Status</p><p className={v.status === 'approved' ? 'text-emerald-400' : 'text-amber-400'}>{v.status || 'pending'}</p></div>
            {v.address && <div className="col-span-2"><p className="text-gray-500">Address</p><p className="text-white">{v.address}</p></div>}
            {v.phone && <div><p className="text-gray-500">Phone</p><p className="text-white">{v.phone}</p></div>}
            {v.email && <div><p className="text-gray-500">Email</p><p className="text-white">{v.email}</p></div>}
          </div>
        </div>
        {venueEvents.length > 0 && (
          <div className="bg-gray-800 rounded-xl border border-gray-700">
            <div className="p-4 border-b border-gray-700"><h3 className="text-white font-semibold">Events</h3></div>
            <div className="divide-y divide-gray-700">
              {venueEvents.slice(0, 5).map(evt => (
                <button key={evt.id} onClick={() => { setSelectedEvent(evt); setCurrentView('event-detail'); }} className="w-full p-3 flex items-center gap-3 hover:bg-gray-750 text-left">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div className="flex-1 min-w-0"><p className="text-white text-sm truncate">{evt.name}</p><p className="text-gray-500 text-xs">{evt.date}</p></div>
                  <span className="text-gray-400 text-sm">{evt.views || 0} views</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={() => setEditingVenue(v)} className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl font-semibold">Edit</button>
          <button onClick={() => handleDeleteVenue(v.id)} className="px-4 py-3 bg-red-500/20 text-red-400 rounded-xl font-semibold">Delete</button>
        </div>
      </div>
    );
  };

  // ========== EDIT MODALS ==========
  const EditVenueModal = () => {
    const [form, setForm] = useState(editingVenue || {});
    if (!editingVenue) return null;
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="p-4 border-b border-gray-700 flex justify-between"><h2 className="text-lg font-bold text-white">Edit Venue</h2><button onClick={() => setEditingVenue(null)}><X className="w-5 h-5 text-gray-400" /></button></div>
          <div className="p-4 space-y-4">
            <div><label className="block text-sm text-gray-400 mb-1">Name</label><input value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" /></div>
            <div><label className="block text-sm text-gray-400 mb-1">Neighborhood</label><select value={form.neighborhood || ''} onChange={e => setForm({...form, neighborhood: e.target.value})} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"><option value="">Select...</option>{DALLAS_NEIGHBORHOODS.map(n => <option key={n.id} value={n.name}>{n.name}</option>)}</select></div>
            <div><label className="block text-sm text-gray-400 mb-1">Type</label><select value={form.venue_type || ''} onChange={e => setForm({...form, venue_type: e.target.value})} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"><option value="">Select...</option>{BUSINESS_VENUE_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}</select></div>
            <div><label className="block text-sm text-gray-400 mb-1">Address</label><input value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" /></div>
            <div><label className="block text-sm text-gray-400 mb-1">Phone</label><input value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" /></div>
            <div><label className="block text-sm text-gray-400 mb-1">Status</label><select value={form.status || 'pending'} onChange={e => setForm({...form, status: e.target.value})} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"><option value="pending">Pending</option><option value="approved">Approved</option><option value="suspended">Suspended</option></select></div>
          </div>
          <div className="p-4 border-t border-gray-700 flex gap-3"><button onClick={() => setEditingVenue(null)} className="flex-1 px-4 py-2 border border-gray-600 text-gray-400 rounded-lg">Cancel</button><button onClick={() => handleUpdateVenue(editingVenue.id, form)} className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold">Save</button></div>
        </div>
      </div>
    );
  };

  const EditEventModal = () => {
    const [form, setForm] = useState(editingEvent || {});
    if (!editingEvent) return null;
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="p-4 border-b border-gray-700 flex justify-between"><h2 className="text-lg font-bold text-white">Edit Event</h2><button onClick={() => setEditingEvent(null)}><X className="w-5 h-5 text-gray-400" /></button></div>
          <div className="p-4 space-y-4">
            <div><label className="block text-sm text-gray-400 mb-1">Name</label><input value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" /></div>
            <div><label className="block text-sm text-gray-400 mb-1">Venue</label><input value={form.venue || ''} onChange={e => setForm({...form, venue: e.target.value})} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" /></div>
            <div><label className="block text-sm text-gray-400 mb-1">Neighborhood</label><select value={form.neighborhood || ''} onChange={e => setForm({...form, neighborhood: e.target.value})} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"><option value="">Select...</option>{DALLAS_NEIGHBORHOODS.map(n => <option key={n.id} value={n.name}>{n.name}</option>)}</select></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm text-gray-400 mb-1">Date</label><input type="date" value={form.date || ''} onChange={e => setForm({...form, date: e.target.value})} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" /></div>
              <div><label className="block text-sm text-gray-400 mb-1">Time</label><input type="time" value={form.time || ''} onChange={e => setForm({...form, time: e.target.value})} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" /></div>
            </div>
            <div><label className="block text-sm text-gray-400 mb-1">Drink Specials</label><input value={form.drink_specials || ''} onChange={e => setForm({...form, drink_specials: e.target.value})} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" /></div>
            <div><label className="block text-sm text-gray-400 mb-1">Description</label><textarea value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} rows={2} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" /></div>
            <div><label className="block text-sm text-gray-400 mb-1">Status</label><select value={form.status || 'live'} onChange={e => setForm({...form, status: e.target.value})} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"><option value="live">Live</option><option value="draft">Draft</option><option value="ended">Ended</option></select></div>
          </div>
          <div className="p-4 border-t border-gray-700 flex gap-3"><button onClick={() => setEditingEvent(null)} className="flex-1 px-4 py-2 border border-gray-600 text-gray-400 rounded-lg">Cancel</button><button onClick={() => handleUpdateEvent(editingEvent.id, form)} className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg font-semibold">Save</button></div>
        </div>
      </div>
    );
  };

  // ========== CREATE VENUE ==========
  const CreateVenueForm = () => {
    const [venueType, setVenueType] = useState('');
    const [neighborhood, setNeighborhood] = useState('');
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const handleSubmit = () => {
      if (!name || !neighborhood || !venueType) { showToastMsg('Fill required fields', 'error'); return; }
      handleCreateVenue({ name, neighborhood, venue_type: venueType, address, phone, email, status: 'approved' });
    };
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4"><button onClick={() => setCurrentView('dashboard')} className="p-2 hover:bg-gray-800 rounded-lg"><ChevronLeft className="w-5 h-5 text-gray-400" /></button><div><h1 className="text-xl font-bold text-white">Add Venue</h1></div></div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 space-y-4">
          <div><label className="block text-sm text-gray-400 mb-2">Name *</label><input value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white" placeholder="Venue name" /></div>
          <div><label className="block text-sm text-gray-400 mb-2">Type *</label><div className="grid grid-cols-3 gap-2">{BUSINESS_VENUE_TYPES.map(t => (<button key={t.id} type="button" onClick={() => setVenueType(t.id)} className={`p-3 rounded-xl border-2 text-center ${venueType === t.id ? 'border-blue-500 bg-blue-500/20' : 'border-gray-600'}`}><span className="text-lg">{t.icon}</span><p className="text-xs text-white mt-1">{t.label}</p></button>))}</div></div>
          <div><label className="block text-sm text-gray-400 mb-2">Neighborhood *</label><select value={neighborhood} onChange={e => setNeighborhood(e.target.value)} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white"><option value="">Select...</option>{DALLAS_NEIGHBORHOODS.map(n => <option key={n.id} value={n.name}>{n.name}</option>)}</select></div>
          <div><label className="block text-sm text-gray-400 mb-2">Address</label><input value={address} onChange={e => setAddress(e.target.value)} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white" placeholder="123 Main St" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm text-gray-400 mb-2">Phone</label><input value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white" /></div>
            <div><label className="block text-sm text-gray-400 mb-2">Email</label><input value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white" /></div>
          </div>
        </div>
        <div className="flex gap-3"><button onClick={() => setCurrentView('dashboard')} className="flex-1 px-4 py-3 border border-gray-600 text-gray-400 rounded-xl">Cancel</button><button onClick={handleSubmit} className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl font-semibold">Create</button></div>
      </div>
    );
  };

  // ========== CREATE EVENT ==========
  const CreateEventForm = () => {
    const [mode, setMode] = useState('quick'); // 'quick' or 'full'
    const [cat, setCat] = useState('');
    const [evtType, setEvtType] = useState('');
    const [venueId, setVenueId] = useState('');
    const [name, setName] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [specials, setSpecials] = useState('');
    const [desc, setDesc] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [eventVibes, setEventVibes] = useState([]);
    
    // Quick add fields (no pre-existing venue needed)
    const [venueName, setVenueName] = useState('');
    const [neighborhood, setNeighborhood] = useState('');
    const [venueAddress, setVenueAddress] = useState('');
    
    // Recurring event
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurringDay, setRecurringDay] = useState(''); // 'monday', 'tuesday', etc.
    const [recurringWeeks, setRecurringWeeks] = useState(4); // How many weeks to create
    
    // Patch 1 — new event fields
    const [ageTag, setAgeTag] = useState('21+'); // 'all-ages' | 'kid-friendly' | '18+' | '21+' | 'date-night'
    const [kidFriendly, setKidFriendly] = useState(false);
    const [dateNight, setDateNight] = useState(false);
    const [menuUrl, setMenuUrl] = useState('');
    const [duplicateFromId, setDuplicateFromId] = useState('');
    
    // For selecting existing venues
    const approvedVenues = establishments.filter(e => e.status === 'approved');
    const allVenues = establishments;
    
    // Age tag options (5 — per spec)
    const AGE_TAGS = [
      { id: 'all-ages',     label: 'All Ages',     emoji: '👨‍👩‍👧' },
      { id: 'kid-friendly', label: 'Kid-friendly', emoji: '👶' },
      { id: '18+',          label: '18+',          emoji: '🔞' },
      { id: '21+',          label: '21+',          emoji: '🍻' },
      { id: 'date-night',   label: 'Date Night',   emoji: '💕' },
    ];
    
    // Map age_tag → age_restriction (text col) for backward compat
    const ageTagToRestriction = (tag) => {
      if (tag === '21+' || tag === 'date-night') return '21+';
      if (tag === '18+') return '18+';
      return 'all'; // all-ages, kid-friendly
    };
    
    // Duplicate-event handler — copies fields from selected event into the form
    const handleDuplicateFrom = (eventId) => {
      setDuplicateFromId(eventId);
      if (!eventId) return;
      const src = events.find(e => String(e.id) === String(eventId));
      if (!src) return;
      // Pre-fill everything except date (user picks a new date)
      setName(src.name || '');
      setVenueId(src.establishment_id ? String(src.establishment_id) : '');
      if (!src.establishment_id) {
        setVenueName(src.venue || '');
        setNeighborhood(src.neighborhood || '');
        setVenueAddress(src.address || '');
      }
      setTime(src.time || '');
      setEndTime(src.end_time || '');
      setCat(src.category || '');
      setEvtType(src.type || '');
      setSpecials(src.drink_specials || '');
      setDesc(src.description || '');
      setImageUrl(src.image_url || '');
      setEventVibes(Array.isArray(src.tags) ? src.tags : (Array.isArray(src.vibes) ? src.vibes : []));
      setAgeTag(src.age_tag || (src.age_restriction === '18+' ? '18+' : src.age_restriction === 'all' ? 'all-ages' : '21+'));
      setKidFriendly(!!src.kid_friendly);
      setDateNight(!!src.date_night);
      setMenuUrl(src.menu_url || '');
      showToastMsg(`Duplicated "${src.name}" — pick a new date`, 'success');
    };
    
    // Common image URLs for quick selection - 40 options
    // Patch A — Use shared STOCK_IMAGE_CATEGORIES via ImagePicker; keep `quickImages` alias for legacy refs in this scope
    const quickImages = STOCK_IMAGE_FLAT;
    
    const handleQuickSubmit = async () => {
      if (!name) { showToastMsg('Please enter an event name', 'error'); return; }
      if (!date) { showToastMsg('Please select a date', 'error'); return; }
      if (!time) { showToastMsg('Please select a time', 'error'); return; }
      if (!venueName && !venueId) { showToastMsg('Please enter a venue name or select one', 'error'); return; }
      if (!neighborhood && !venueId) { showToastMsg('Please select a neighborhood', 'error'); return; }
      
      let finalVenue = venueName;
      let finalNeighborhood = neighborhood;
      let finalEstablishmentId = null;
      
      // If using existing venue
      if (venueId) {
        const venue = allVenues.find(e => String(e.id) === String(venueId));
        if (venue) {
          finalVenue = venue.name;
          finalNeighborhood = venue.neighborhood;
          finalEstablishmentId = venue.id;
        }
      }
      
      // Create events (multiple if recurring)
      const datesToCreate = [date];
      
      if (isRecurring && recurringWeeks > 1) {
        const startDate = new Date(date);
        for (let i = 1; i < recurringWeeks; i++) {
          const nextDate = new Date(startDate);
          nextDate.setDate(nextDate.getDate() + (7 * i));
          datesToCreate.push(nextDate.toISOString().split('T')[0]);
        }
      }
      
      // Patch A — Geocode the venue address once (shared across all recurring instances)
      // Patch A.1 — Wrapped in try/catch: geocoding must never block event creation
      let geoLat = null;
      let geoLng = null;
      try {
        if (venueId) {
          // Existing venue: prefer its stored coords, geocode its stored address otherwise
          const v = allVenues.find(e => String(e.id) === String(venueId));
          if (v?.latitude != null && v?.longitude != null) {
            geoLat = v.latitude;
            geoLng = v.longitude;
          } else if (v?.address || v?.neighborhood) {
            const geo = await geocodeAddress(buildAddressString({
              address: v.address,
              neighborhood: v.neighborhood,
              city: v.city || 'Dallas'
            }));
            if (geo) { geoLat = geo.latitude; geoLng = geo.longitude; }
          }
        } else if (venueAddress || finalNeighborhood) {
          // New venue: geocode the address the admin entered
          const geo = await geocodeAddress(buildAddressString({
            address: venueAddress,
            neighborhood: finalNeighborhood,
            city: 'Dallas'
          }));
          if (geo) { geoLat = geo.latitude; geoLng = geo.longitude; }
        }
      } catch (geoErr) {
        console.warn('Geocoding step failed — saving without coordinates:', geoErr);
      }
      
      for (const eventDate of datesToCreate) {
        await handleCreateEvent({ 
          name, 
          date: eventDate, 
          time,
          end_time: endTime || null,
          venue: finalVenue, 
          neighborhood: finalNeighborhood,
          address: venueAddress || null,
          establishment_id: finalEstablishmentId, 
          category: cat || 'nightlife', 
          type: evtType || 'Event', 
          drink_specials: specials, 
          description: desc, 
          image_url: imageUrl || quickImages[0].url,
          tags: eventVibes, // Patch A.2 — schema uses `tags` column for event vibes (not `vibes`)
          status: 'live',
          recurring: isRecurring,
          // Patch 1 — new fields
          age_tag: ageTag,
          age_restriction: ageTagToRestriction(ageTag),
          kid_friendly: kidFriendly,
          date_night: dateNight,
          menu_url: menuUrl || null,
          // Patch A — geocoded coordinates (null if geocoding fails — distance filter fails open)
          latitude: geoLat,
          longitude: geoLng,
          views: 0,
          rsvps: 0,
          checkins: 0
        });
      }
      
      if (datesToCreate.length > 1) {
        showToastMsg(`Created ${datesToCreate.length} recurring events!`, 'success');
      }
    };
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setCurrentView('dashboard')} className="p-2 hover:bg-gray-800 rounded-lg">
              <ChevronLeft className="w-5 h-5 text-gray-400" />
            </button>
            <div><h1 className="text-xl font-bold text-white">Create Event</h1></div>
          </div>
        </div>
        
        {/* Mode Toggle */}
        <div className="flex gap-2 bg-gray-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); setMode('quick'); }}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition ${mode === 'quick' ? 'bg-orange-500 text-white' : 'text-gray-400'}`}
          >
            ⚡ Quick Add
          </button>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); setMode('full'); }}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition ${mode === 'full' ? 'bg-orange-500 text-white' : 'text-gray-400'}`}
          >
            📝 Full Details
          </button>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Duplicate from existing event — quick-fill */}
          {events.length > 0 && (
            <div className="p-3 bg-violet-500/10 border border-violet-500/30 rounded-xl">
              <label className="block text-xs text-violet-300 mb-2 font-semibold uppercase tracking-wide">⚡ Duplicate from existing event</label>
              <select
                value={duplicateFromId}
                onChange={e => handleDuplicateFrom(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
              >
                <option value="">— Start from scratch —</option>
                {[...events]
                  .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
                  .slice(0, 50)
                  .map(ev => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name} — {ev.venue || 'No venue'} ({ev.date || 'no date'})
                    </option>
                  ))}
              </select>
              <p className="text-violet-300/60 text-xs mt-1">Copies all fields except date. Pick a new date below.</p>
            </div>
          )}

          {/* Event Name - Always Required */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Event Name *</label>
            <input 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white text-lg" 
              placeholder="e.g., Friday Live Music Night" 
            />
          </div>

          {/* Venue Section */}
          <div className="space-y-3">
            <label className="block text-sm text-gray-400">Venue</label>
            
            {/* Existing Venue Dropdown */}
            {allVenues.length > 0 && (
              <select 
                value={venueId} 
                onChange={e => {
                  setVenueId(e.target.value);
                  if (e.target.value) {
                    setVenueName('');
                    setNeighborhood('');
                  }
                }} 
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white"
              >
                <option value="">-- Select existing venue or enter new below --</option>
                {allVenues.map(v => <option key={v.id} value={v.id}>{v.name} - {v.neighborhood}</option>)}
              </select>
            )}
            
            {/* OR New Venue */}
            {!venueId && (
              <div className="space-y-3 pl-3 border-l-2 border-orange-500">
                <input 
                  value={venueName} 
                  onChange={e => setVenueName(e.target.value)} 
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white" 
                  placeholder="Venue name (e.g., The Rustic)" 
                />
                <select 
                  value={neighborhood} 
                  onChange={e => setNeighborhood(e.target.value)} 
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white"
                >
                  <option value="">Select neighborhood *</option>
                  {DALLAS_NEIGHBORHOODS.map(n => <option key={n.id} value={n.name}>{n.name}</option>)}
                </select>
                <input 
                  value={venueAddress} 
                  onChange={e => setVenueAddress(e.target.value)} 
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white" 
                  placeholder="Address (e.g., 2714 Elm St, Dallas TX)" 
                />
              </div>
            )}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Date *</label>
              <input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)} 
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white" 
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Start Time *</label>
              <input 
                type="time" 
                value={time} 
                onChange={e => setTime(e.target.value)} 
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white" 
              />
            </div>
          </div>

          {/* Age Tag — single-select (5 options) */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Age *</label>
            <div className="flex flex-wrap gap-2">
              {AGE_TAGS.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={(e) => { e.preventDefault(); setAgeTag(t.id); }}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition ${
                    ageTag === t.id ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tag toggles — Kid-friendly & Date-night (additional descriptors for filtering) */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); setKidFriendly(!kidFriendly); }}
              className={`flex items-center justify-between p-3 rounded-xl border-2 transition ${
                kidFriendly ? 'bg-emerald-500/20 border-emerald-500 text-white' : 'bg-gray-700/50 border-gray-600 text-gray-400'
              }`}
            >
              <span className="text-sm font-medium">👶 Kid-friendly</span>
              <span className={`w-5 h-5 rounded-full ${kidFriendly ? 'bg-emerald-500' : 'bg-gray-600'}`}>
                {kidFriendly && <span className="text-white text-xs flex items-center justify-center h-full">✓</span>}
              </span>
            </button>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); setDateNight(!dateNight); }}
              className={`flex items-center justify-between p-3 rounded-xl border-2 transition ${
                dateNight ? 'bg-pink-500/20 border-pink-500 text-white' : 'bg-gray-700/50 border-gray-600 text-gray-400'
              }`}
            >
              <span className="text-sm font-medium">💕 Date Night</span>
              <span className={`w-5 h-5 rounded-full ${dateNight ? 'bg-pink-500' : 'bg-gray-600'}`}>
                {dateNight && <span className="text-white text-xs flex items-center justify-center h-full">✓</span>}
              </span>
            </button>
          </div>

          {/* Patch A — Categorized image picker (120 stock + custom URL) */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Event Image</label>
            <ImagePicker value={imageUrl} onChange={setImageUrl} darkMode={true} />
          </div>

          {/* Recurring Event Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-xl">
            <div>
              <p className="text-white font-medium">Recurring Event?</p>
              <p className="text-gray-400 text-sm">Auto-create for multiple weeks</p>
            </div>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); setIsRecurring(!isRecurring); }}
              className={`relative w-12 h-7 rounded-full transition-colors ${isRecurring ? 'bg-orange-500' : 'bg-gray-600'}`}
            >
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${isRecurring ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
          
          {isRecurring && (
            <div className="pl-3 border-l-2 border-orange-500">
              <label className="block text-sm text-gray-400 mb-2">Create for how many weeks?</label>
              <div className="flex gap-2">
                {[2, 4, 8, 12].map(w => (
                  <button
                    key={w}
                    type="button"
                    onClick={(e) => { e.preventDefault(); setRecurringWeeks(w); }}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                      recurringWeeks === w ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    {w} weeks
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Full Details Mode - Additional Fields */}
          {mode === 'full' && (
            <>
              <div>
                <label className="block text-sm text-gray-400 mb-2">End Time</label>
                <input 
                  type="time" 
                  value={endTime} 
                  onChange={e => setEndTime(e.target.value)} 
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Category</label>
                  <select value={cat} onChange={e => { setCat(e.target.value); setEvtType(''); }} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white">
                    <option value="">Select...</option>
                    {BUSINESS_EVENT_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Type</label>
                  <select value={evtType} onChange={e => setEvtType(e.target.value)} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white" disabled={!cat}>
                    <option value="">Select...</option>
                    {cat && BUSINESS_EVENT_TYPES[cat]?.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">Drink Specials</label>
                <input value={specials} onChange={e => setSpecials(e.target.value)} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white" placeholder="e.g., $5 margaritas, half-off apps" />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">Description</label>
                <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white" placeholder="Describe your event..." />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">Menu URL <span className="text-gray-500">(optional)</span></label>
                <input
                  type="url"
                  value={menuUrl}
                  onChange={e => setMenuUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white"
                  placeholder="https://example.com/menu.pdf"
                />
                <p className="text-gray-500 text-xs mt-1">Shows on the event card if provided.</p>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">Event Vibes</label>
                <div className="flex flex-wrap gap-2">
                  {VIBE_OPTIONS.slice(0, 10).map(vibe => (
                    <button
                      key={vibe.id}
                      type="button"
                      onClick={(e) => { 
                        e.preventDefault(); 
                        setEventVibes(prev => prev.includes(vibe.id) ? prev.filter(v => v !== vibe.id) : [...prev, vibe.id]);
                      }}
                      className={`px-3 py-1.5 rounded-full text-sm transition ${
                        eventVibes.includes(vibe.id) ? 'bg-violet-500 text-white' : 'bg-gray-700 text-gray-300'
                      }`}
                    >
                      {vibe.icon}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Quick Category Buttons (Quick Mode) */}
          {mode === 'quick' && (
            <div>
              <label className="block text-sm text-gray-400 mb-2">Event Type (tap one)</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'live-music', label: '🎵 Live Music' },
                  { id: 'happy-hour', label: '🍻 Happy Hour' },
                  { id: 'trivia', label: '🧠 Trivia' },
                  { id: 'karaoke', label: '🎤 Karaoke' },
                  { id: 'dj', label: '💃 DJ/Dancing' },
                  { id: 'sports', label: '🏈 Sports' },
                  { id: 'comedy', label: '😂 Comedy' },
                  { id: 'brunch', label: '🥂 Brunch' },
                  { id: 'networking', label: '🤝 Networking' },
                  { id: 'other', label: '✨ Other' },
                ].map(type => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={(e) => { e.preventDefault(); setCat(type.id); }}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition ${
                      cat === type.id ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <p className="text-emerald-400 text-sm">
              ✓ Event goes live immediately
              {isRecurring && ` • Creating ${recurringWeeks} events`}
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button type="button" onClick={(e) => { e.preventDefault(); setCurrentView('dashboard'); }} className="flex-1 px-4 py-3 border border-gray-600 text-gray-400 rounded-xl">Cancel</button>
          <button 
            type="button"
            onClick={(e) => { e.preventDefault(); handleQuickSubmit(); }} 
            disabled={!name || !date || !time || (!venueName && !venueId) || (!neighborhood && !venueId)}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold disabled:opacity-50"
          >
            {isRecurring ? `Create ${recurringWeeks} Events` : 'Create Event'}
          </button>
        </div>
      </div>
    );
  };

  // ========== LISTS ==========
  const VenuesList = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4"><button onClick={() => setCurrentView('dashboard')} className="p-2 hover:bg-gray-800 rounded-lg"><ChevronLeft className="w-5 h-5 text-gray-400" /></button><div><h1 className="text-xl font-bold text-white">Venues</h1><p className="text-gray-400 text-sm">{establishments.length} total</p></div></div>
        <button onClick={() => setCurrentView('create-venue')} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl text-sm"><Plus className="w-4 h-4" />Add</button>
      </div>
      <div className="space-y-3">
        {establishments.map(v => (
          <button key={v.id} onClick={() => { setSelectedVenue(v); setCurrentView('venue-detail'); }} className="w-full bg-gray-800 rounded-xl border border-gray-700 p-4 text-left hover:border-gray-600">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center text-xl">{BUSINESS_VENUE_TYPES.find(t => t.id === v.venue_type)?.icon || '🏢'}</div>
              <div className="flex-1 min-w-0"><p className="text-white font-medium truncate">{v.name}</p><p className="text-gray-500 text-sm">{v.neighborhood}</p></div>
              <div className="text-right"><span className={`px-2 py-1 rounded-full text-xs ${v.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>{v.status || 'pending'}</span><p className="text-gray-500 text-xs mt-1">{events.filter(e => e.establishment_id === v.id || e.venue === v.name).length} events</p></div>
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </div>
          </button>
        ))}
        {establishments.length === 0 && <div className="text-center py-12 text-gray-500"><Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No venues</p><button onClick={() => setCurrentView('create-venue')} className="text-blue-400 mt-2">Add first venue</button></div>}
      </div>
    </div>
  );

  const EventsList = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4"><button onClick={() => setCurrentView('dashboard')} className="p-2 hover:bg-gray-800 rounded-lg"><ChevronLeft className="w-5 h-5 text-gray-400" /></button><div><h1 className="text-xl font-bold text-white">Events</h1><p className="text-gray-400 text-sm">{events.length} total</p></div></div>
        <button onClick={() => setCurrentView('create-event')} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm"><Plus className="w-4 h-4" />Create</button>
      </div>
      <div className="space-y-3">
        {events.map(e => (
          <button key={e.id} onClick={() => { setSelectedEvent(e); setCurrentView('event-detail'); }} className="w-full bg-gray-800 rounded-xl border border-gray-700 p-4 text-left hover:border-gray-600">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center"><Calendar className="w-5 h-5 text-white" /></div>
              <div className="flex-1 min-w-0"><p className="text-white font-medium truncate">{e.name}</p><p className="text-gray-500 text-sm">{e.venue} • {e.date}</p></div>
              <div className="text-right"><p className="text-white font-medium">{e.views || 0}</p><p className="text-gray-500 text-xs">views</p></div>
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </div>
          </button>
        ))}
        {events.length === 0 && <div className="text-center py-12 text-gray-500"><Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No events</p></div>}
      </div>
    </div>
  );

  // ========== NAVIGATION ==========
  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home }, 
    { id: 'approvals', label: 'Approvals', icon: Clock, badge: pendingEvents.length },
    { id: 'venues', label: 'Venues', icon: Building2 }, 
    { id: 'events', label: 'Events', icon: Calendar }, 
    { id: 'users', label: 'Users', icon: Users }
  ];
  const getActiveNav = () => {
    if (['dashboard', 'analytics-views', 'analytics-engagement'].includes(currentView)) return 'dashboard';
    if (currentView === 'approvals') return 'approvals';
    if (['venues', 'venue-detail', 'create-venue'].includes(currentView)) return 'venues';
    if (['events', 'event-detail', 'create-event'].includes(currentView)) return 'events';
    if (currentView === 'users') return 'users';
    return 'dashboard';
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900">
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2"><div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center"><Shield className="w-5 h-5 text-white" /></div><div><span className="font-bold text-white">CrewQ</span><span className="text-xs block text-gray-400">Admin</span></div></div>
        <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
      </div>
      <div className="p-4 pb-24 overflow-y-auto" style={{ height: 'calc(100vh - 130px)' }}>
        {loading ? <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
          : currentView === 'dashboard' ? <AdminDashboard />
          : currentView === 'approvals' ? <ApprovalsQueue />
          : currentView === 'analytics-views' ? <AnalyticsViews />
          : currentView === 'analytics-engagement' ? <AnalyticsEngagement />
          : currentView === 'users' ? <UserAnalytics />
          : currentView === 'create-venue' ? <CreateVenueForm />
          : currentView === 'create-event' ? <CreateEventForm />
          : currentView === 'venues' ? <VenuesList />
          : currentView === 'venue-detail' ? <VenueDetail />
          : currentView === 'events' ? <EventsList />
          : currentView === 'event-detail' ? <EventDetail />
          : <AdminDashboard />}
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 px-4 py-2">
        <div className="flex justify-around">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setCurrentView(item.id)} className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg relative ${getActiveNav() === item.id ? 'text-violet-400 bg-violet-500/10' : 'text-gray-500'}`}>
              <item.icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
              {item.badge > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center">{item.badge}</span>}
            </button>
          ))}
        </div>
      </div>
      {editingVenue && <EditVenueModal />}
      {editingEvent && <EditEventModal />}
      {toast && <div className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-white text-sm ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>{toast.message}</div>}
    </div>
  );
}

// ============================================
// CREWQ BUSINESS PORTAL - Comprehensive Business Management
// Desktop-optimized with sidebar navigation
// ============================================

// Expanded Event Categories with "Other" option
const BUSINESS_EVENT_CATEGORIES_EXPANDED = [
  { id: 'nightlife', name: 'Nightlife', icon: '🌙' },
  { id: 'social', name: 'Social', icon: '👥' },
  { id: 'food_drink', name: 'Food & Drink', icon: '🍽️' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎭' },
  { id: 'sports', name: 'Sports', icon: '⚽' },
  { id: 'wellness', name: 'Wellness', icon: '💪' },
  { id: 'professional', name: 'Professional', icon: '💼' },
  { id: 'cultural', name: 'Cultural', icon: '🎨' },
  { id: 'special', name: 'Special Interest', icon: '⭐' },
  { id: 'other', name: 'Other', icon: '📌' },
];

const BUSINESS_EVENT_TYPES_EXPANDED = {
  nightlife: ['Happy Hour', 'DJ Night', 'Live Music', 'Ladies Night', 'Karaoke', 'Industry Night', 'Club Night', 'Late Night', 'Other'],
  social: ['Trivia Night', 'Game Night', 'Watch Party', 'Speed Dating', 'Singles Mixer', 'Meetup', 'Networking Social', 'Other'],
  food_drink: ['Wine Tasting', 'Beer Tasting', 'Cocktail Class', 'Food Pairing', 'Brunch', 'Dinner Event', 'Tasting Menu', 'Other'],
  entertainment: ['Comedy Show', 'Open Mic', 'Live Performance', 'Drag Show', 'Burlesque', 'Magic Show', 'Improv Night', 'Other'],
  sports: ['Watch Party', 'Game Day', 'Fantasy Draft', 'Sports Trivia', 'Viewing Party', 'Tournament', 'Other'],
  wellness: ['Yoga & Brunch', 'Sober Social', 'Meditation', 'Fitness Class', 'Wellness Workshop', 'Sound Bath', 'Other'],
  professional: ['Networking Event', 'Corporate Happy Hour', 'Business Mixer', 'Industry Event', 'Seminar', 'Workshop', 'Other'],
  cultural: ['Art Night', 'Gallery Opening', 'Cultural Celebration', 'Heritage Event', 'Film Screening', 'Book Club', 'Other'],
  special: ['Themed Party', 'Holiday Event', 'Anniversary', 'Launch Party', 'Private Event', 'Charity Event', 'Other'],
  other: ['Custom Event', 'Private Booking', 'Special Occasion', 'Other'],
};

const VENUE_TYPES_EXPANDED = [
  { id: 'bar', label: 'Bar', icon: '🍺' },
  { id: 'restaurant', label: 'Restaurant', icon: '🍽️' },
  { id: 'club', label: 'Nightclub', icon: '🎵' },
  { id: 'lounge', label: 'Lounge', icon: '🛋️' },
  { id: 'brewery', label: 'Brewery', icon: '🍻' },
  { id: 'rooftop', label: 'Rooftop', icon: '🌃' },
  { id: 'sports_bar', label: 'Sports Bar', icon: '⚽' },
  { id: 'wine_bar', label: 'Wine Bar', icon: '🍷' },
  { id: 'cocktail_bar', label: 'Cocktail Bar', icon: '🍸' },
  { id: 'cafe', label: 'Café', icon: '☕' },
  { id: 'event_space', label: 'Event Space', icon: '🎪' },
  { id: 'other', label: 'Other', icon: '🏢' },
];

const AGE_RESTRICTIONS = [
  { id: 'all', label: 'All Ages' },
  { id: '18+', label: '18+' },
  { id: '21+', label: '21+' },
];

const DRESS_CODES = [
  { id: 'casual', label: 'Casual' },
  { id: 'smart_casual', label: 'Smart Casual' },
  { id: 'business_casual', label: 'Business Casual' },
  { id: 'cocktail', label: 'Cocktail Attire' },
  { id: 'formal', label: 'Formal' },
  { id: 'themed', label: 'Themed' },
  { id: 'none', label: 'No Dress Code' },
];

const MUSIC_GENRES = [
  'Top 40', 'Hip Hop', 'R&B', 'EDM', 'House', 'Techno', 'Latin', 'Country', 
  'Rock', 'Jazz', 'Acoustic', 'Live Band', 'DJ Mix', 'None', 'Other'
];

// Average spend per person (will be variable later)
const AVG_SPEND_PER_PERSON = 25;

function BusinessPortal({ onClose, darkMode, supabaseClient, DALLAS_NEIGHBORHOODS }) {
  // Main state
  const [currentView, setCurrentView] = useState('auth'); // Start at auth
  const [businessUser, setBusinessUser] = useState(null);
  const [venue, setVenue] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Detect mobile screen and auto-collapse sidebar
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarCollapsed(true);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Onboarding state - use individual state variables to prevent re-render issues
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [venueName, setVenueName] = useState('');
  const [venueType, setVenueType] = useState('');
  const [venueNeighborhood, setVenueNeighborhood] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [venuePhone, setVenuePhone] = useState('');
  const [venueWebsite, setVenueWebsite] = useState('');
  const [venueSupportEmail, setVenueSupportEmail] = useState('');
  const [venueDescription, setVenueDescription] = useState('');
  
  // Auth state - individual variables
  const [authMode, setAuthMode] = useState('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  
  // Event creation state - individual variables
  const [evtName, setEvtName] = useState('');
  const [evtCategory, setEvtCategory] = useState('');
  const [evtType, setEvtType] = useState('');
  const [evtDate, setEvtDate] = useState('');
  const [evtStartTime, setEvtStartTime] = useState('');
  const [evtEndTime, setEvtEndTime] = useState('');
  const [evtDescription, setEvtDescription] = useState('');
  const [evtCoverCharge, setEvtCoverCharge] = useState('');
  const [evtDrinkSpecials, setEvtDrinkSpecials] = useState('');
  const [evtFoodSpecials, setEvtFoodSpecials] = useState('');
  const [evtDressCode, setEvtDressCode] = useState('casual');
  const [evtMusicGenre, setEvtMusicGenre] = useState('');
  const [evtCapacity, setEvtCapacity] = useState('');
  const [evtImageUrl, setEvtImageUrl] = useState('');
  const [evtRecurring, setEvtRecurring] = useState(false);
  const [evtRecurringType, setEvtRecurringType] = useState('weekly');
  // Patch 2 — new event fields (mirrors admin CreateEventForm)
  const [evtAgeTag, setEvtAgeTag] = useState('21+'); // 'all-ages' | 'kid-friendly' | '18+' | '21+' | 'date-night'
  const [evtKidFriendly, setEvtKidFriendly] = useState(false);
  const [evtDateNight, setEvtDateNight] = useState(false);
  const [evtMenuUrl, setEvtMenuUrl] = useState('');
  const [evtDuplicateFromId, setEvtDuplicateFromId] = useState('');
  const [editingEvent, setEditingEvent] = useState(null);

  // Constants
  const VENUE_TYPES = [
    { id: 'bar', label: 'Bar', icon: '🍺' },
    { id: 'restaurant', label: 'Restaurant', icon: '🍽️' },
    { id: 'club', label: 'Nightclub', icon: '🎵' },
    { id: 'lounge', label: 'Lounge', icon: '🛋️' },
    { id: 'brewery', label: 'Brewery', icon: '🍻' },
    { id: 'rooftop', label: 'Rooftop', icon: '🌃' },
    { id: 'sports_bar', label: 'Sports Bar', icon: '⚽' },
    { id: 'wine_bar', label: 'Wine Bar', icon: '🍷' },
    { id: 'other', label: 'Other', icon: '🏢' },
  ];

  const EVENT_CATEGORIES = [
    { id: 'nightlife', name: 'Nightlife', icon: '🌙' },
    { id: 'social', name: 'Social', icon: '👥' },
    { id: 'food_drink', name: 'Food & Drink', icon: '🍽️' },
    { id: 'entertainment', name: 'Entertainment', icon: '🎭' },
    { id: 'sports', name: 'Sports', icon: '⚽' },
    { id: 'wellness', name: 'Wellness', icon: '💪' },
    { id: 'professional', name: 'Professional', icon: '💼' },
    { id: 'other', name: 'Other', icon: '📌' },
  ];

  const EVENT_TYPES = {
    nightlife: ['Happy Hour', 'DJ Night', 'Live Music', 'Ladies Night', 'Karaoke', 'Other'],
    social: ['Trivia Night', 'Game Night', 'Watch Party', 'Speed Dating', 'Mixer', 'Other'],
    food_drink: ['Wine Tasting', 'Beer Tasting', 'Brunch', 'Dinner Event', 'Other'],
    entertainment: ['Comedy Show', 'Open Mic', 'Live Performance', 'Other'],
    sports: ['Watch Party', 'Game Day', 'Tournament', 'Other'],
    wellness: ['Yoga', 'Meditation', 'Fitness Class', 'Other'],
    professional: ['Networking', 'Happy Hour', 'Workshop', 'Other'],
    other: ['Custom Event', 'Other'],
  };

  const AVG_SPEND = 25;

  const showToastMsg = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Load business data
  const loadBusinessData = async (userId) => {
    try {
      const { data: venueData } = await supabaseClient
        .from('establishments')
        .select('*')
        .eq('owner_id', userId)
        .single();
      
      if (venueData) {
        setVenue(venueData);
        const { data: eventsData } = await supabaseClient
          .from('events')
          .select('*')
          .eq('establishment_id', venueData.id)
          .order('date', { ascending: false });
        setEvents(eventsData || []);
      }
    } catch (err) {
      console.error('Error loading business data:', err);
    }
    setLoading(false);
  };

  // Auto-refresh data every 30 seconds when on dashboard
  useEffect(() => {
    if (!businessUser?.id || !venue?.id) return;
    
    const refreshInterval = setInterval(async () => {
      // Only refresh if on dashboard or events view
      if (currentView === 'dashboard' || currentView === 'events') {
        try {
          const { data: eventsData } = await supabaseClient
            .from('events')
            .select('*')
            .eq('establishment_id', venue.id)
            .order('date', { ascending: false });
          if (eventsData) setEvents(eventsData);
        } catch (err) {
          console.log('Refresh error:', err);
        }
      }
    }, 30000); // 30 seconds
    
    return () => clearInterval(refreshInterval);
  }, [businessUser?.id, venue?.id, currentView]);

  // Auth: Login
  const handleLogin = async () => {
    if (!authEmail || !authPassword) {
      setAuthError('Please enter email and password');
      return;
    }
    setAuthLoading(true);
    setAuthError('');
    
    try {
      const { data, error } = await supabaseClient
        .from('establishment_users')
        .select('*')
        .eq('email', authEmail.toLowerCase())
        .single();
      
      if (error || !data) {
        setAuthError('Invalid email or password');
        setAuthLoading(false);
        return;
      }
      
      if (data.password_hash !== authPassword) {
        setAuthError('Invalid email or password');
        setAuthLoading(false);
        return;
      }
      
      setBusinessUser(data);
      
      if (!data.onboarding_complete) {
        setCurrentView('onboarding');
      } else {
        setLoading(true);
        await loadBusinessData(data.id);
        setCurrentView('dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      setAuthError('Login failed. Please try again.');
    }
    setAuthLoading(false);
  };

  // Auth: Signup
  const handleSignup = async () => {
    setAuthError('');
    if (!authEmail || !authPassword || !authConfirmPassword) {
      setAuthError('Please fill in all required fields');
      return;
    }
    if (authPassword !== authConfirmPassword) {
      setAuthError('Passwords do not match');
      return;
    }
    if (authPassword.length < 6) {
      setAuthError('Password must be at least 6 characters');
      return;
    }
    
    setAuthLoading(true);
    
    try {
      const { data: existing } = await supabaseClient
        .from('establishment_users')
        .select('email')
        .eq('email', authEmail.toLowerCase())
        .single();
      
      if (existing) {
        setAuthError('An account with this email already exists');
        setAuthLoading(false);
        return;
      }
      
      const { data: userData, error: userError } = await supabaseClient
        .from('establishment_users')
        .insert([{
          email: authEmail.toLowerCase(),
          password_hash: authPassword,
          name: authName || authEmail.split('@')[0],
          role: 'owner',
          onboarding_complete: false
        }])
        .select()
        .single();
      
      if (userError) throw userError;
      
      setBusinessUser(userData);
      setCurrentView('onboarding');
      showToastMsg('Account created! Let\'s set up your venue.');
    } catch (err) {
      console.error('Signup error:', err);
      setAuthError('Failed to create account. Please try again.');
    }
    setAuthLoading(false);
  };

  // Onboarding: Complete
  const handleOnboardingComplete = async () => {
    if (!venueName || !venueAddress || !venuePhone || !venueSupportEmail) {
      showToastMsg('Please fill in all required fields', 'error');
      return;
    }
    
    setLoading(true);
    
    try {
      const { data: venueData, error: venueError } = await supabaseClient
        .from('establishments')
        .insert([{
          name: venueName,
          venue_type: venueType,
          neighborhood: venueNeighborhood,
          address: venueAddress,
          phone: venuePhone,
          website: venueWebsite,
          support_email: venueSupportEmail,
          description: venueDescription,
          owner_id: businessUser.id,
          status: 'approved'
        }])
        .select()
        .single();
      
      if (venueError) {
        console.error('Venue creation error:', venueError);
        throw venueError;
      }
      
      const { error: updateError } = await supabaseClient
        .from('establishment_users')
        .update({ 
          onboarding_complete: true,
          establishment_id: venueData.id 
        })
        .eq('id', businessUser.id);
      
      if (updateError) {
        console.error('User update error:', updateError);
      }
      
      setVenue(venueData);
      setBusinessUser({ ...businessUser, onboarding_complete: true, establishment_id: venueData.id });
      showToastMsg('🎉 You\'re all set! Start creating events.');
      setCurrentView('dashboard');
    } catch (err) {
      console.error('Onboarding error:', err);
      showToastMsg('Failed to complete setup: ' + (err.message || 'Unknown error'), 'error');
    }
    setLoading(false);
  };

  // Patch 2 — Duplicate-event handler (copies fields from selected event)
  const handleDuplicateFromEvent = (eventId) => {
    setEvtDuplicateFromId(eventId);
    if (!eventId) return;
    const src = events.find(e => String(e.id) === String(eventId));
    if (!src) return;
    setEvtName(src.name || '');
    setEvtCategory(src.category || '');
    setEvtType(src.type || '');
    setEvtStartTime(src.time || '');
    setEvtEndTime(src.end_time || '');
    setEvtDescription(src.description || '');
    setEvtCoverCharge(src.cover_charge ? String(src.cover_charge) : '');
    setEvtDrinkSpecials(src.drink_specials || '');
    setEvtFoodSpecials(src.food_specials || '');
    setEvtDressCode(src.dress_code || 'casual');
    setEvtMusicGenre(src.music_genre || '');
    setEvtCapacity(src.capacity ? String(src.capacity) : '');
    setEvtImageUrl(src.image_url || '');
    setEvtAgeTag(src.age_tag || (src.age_restriction === '18+' ? '18+' : src.age_restriction === 'all' ? 'all-ages' : '21+'));
    setEvtKidFriendly(!!src.kid_friendly);
    setEvtDateNight(!!src.date_night);
    setEvtMenuUrl(src.menu_url || '');
    showToastMsg(`Duplicated "${src.name}" — pick a new date`, 'success');
  };

  // Create Event
  const handleCreateEvent = async () => {
    if (!evtName || !evtDate || !evtStartTime) {
      showToastMsg('Please fill in Name, Date, and Time', 'error');
      return;
    }
    
    setLoading(true);
    
    try {
      // Patch A — Geocode the venue address (use stored coords if venue already has them)
      let geoLat = null, geoLng = null;
      if (venue.latitude != null && venue.longitude != null) {
        geoLat = venue.latitude;
        geoLng = venue.longitude;
      } else if (venue.address || venue.neighborhood) {
        const geo = await geocodeAddress(buildAddressString({
          address: venue.address,
          neighborhood: venue.neighborhood,
          city: venue.city || 'Dallas'
        }));
        if (geo) { geoLat = geo.latitude; geoLng = geo.longitude; }
      }
      
      const eventData = {
        name: evtName,
        venue: venue.name,
        neighborhood: venue.neighborhood,
        establishment_id: venue.id,
        category: evtCategory,
        type: evtType || 'Event',
        date: evtDate,
        time: evtStartTime,
        end_time: evtEndTime || null,
        description: evtDescription,
        cover_charge: evtCoverCharge ? parseFloat(evtCoverCharge) : 0,
        drink_specials: evtDrinkSpecials,
        food_specials: evtFoodSpecials,
        age_restriction: (evtAgeTag === '21+' || evtAgeTag === 'date-night') ? '21+' : (evtAgeTag === '18+' ? '18+' : 'all'),
        dress_code: evtDressCode,
        music_genre: evtMusicGenre,
        capacity: evtCapacity ? parseInt(evtCapacity) : null,
        image_url: evtImageUrl,
        recurring: evtRecurring,
        recurring_type: evtRecurring ? evtRecurringType : null,
        // Patch 2 — new fields
        age_tag: evtAgeTag,
        kid_friendly: evtKidFriendly,
        date_night: evtDateNight,
        menu_url: evtMenuUrl || null,
        // Patch A — geocoded location
        latitude: geoLat,
        longitude: geoLng,
        status: 'pending',
        views: 0,
        rsvps: 0,
        checkins: 0
      };
      
      const { data, error } = await supabaseClient
        .from('events')
        .insert([eventData])
        .select()
        .single();
      
      if (error) throw error;
      
      setEvents([data, ...events]);
      showToastMsg('Event submitted for approval!');
      
      // Reset form
      setEvtName(''); setEvtCategory(''); setEvtType(''); setEvtDate('');
      setEvtStartTime(''); setEvtEndTime(''); setEvtDescription('');
      setEvtCoverCharge(''); setEvtDrinkSpecials(''); setEvtFoodSpecials('');
      setEvtDressCode('casual'); setEvtMusicGenre('');
      setEvtCapacity(''); setEvtImageUrl(''); setEvtRecurring(false);
      // Patch 2 — reset new fields
      setEvtAgeTag('21+'); setEvtKidFriendly(false); setEvtDateNight(false);
      setEvtMenuUrl(''); setEvtDuplicateFromId('');
      
      setCurrentView('events');
    } catch (err) {
      console.error('Event creation error:', err);
      showToastMsg('Failed to create event', 'error');
    }
    setLoading(false);
  };

  // Analytics
  const getAnalytics = () => {
    const totalViews = events.reduce((sum, e) => sum + (e.views || 0), 0);
    const totalRsvps = events.reduce((sum, e) => sum + (e.rsvps || 0), 0);
    const totalCheckins = events.reduce((sum, e) => sum + (e.checkins || 0), 0);
    const liveEvents = events.filter(e => e.status === 'live' || e.status === 'approved').length;
    const pendingEvents = events.filter(e => e.status === 'pending').length;
    const estimatedRevenue = totalCheckins * AVG_SPEND;
    const conversionRate = totalViews > 0 ? ((totalRsvps / totalViews) * 100).toFixed(1) : 0;
    const valuePerView = totalViews > 0 ? (estimatedRevenue / totalViews).toFixed(2) : 0;
    
    return { totalViews, totalRsvps, totalCheckins, liveEvents, pendingEvents, estimatedRevenue, conversionRate, valuePerView };
  };
  // ==================== RENDER ====================
  
  // AUTH VIEW
  if (currentView === 'auth' || !businessUser) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-slate-800 rounded-2xl p-8 shadow-2xl border border-slate-700">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Crew<span className="text-orange-500">Q</span> <span className="text-slate-400 font-normal">Business</span></h1>
              <p className="text-slate-400 mt-2 text-sm">Venue Management Portal</p>
            </div>

            <div className="flex bg-slate-700/50 rounded-lg p-1 mb-6">
              <button onClick={() => { setAuthMode('login'); setAuthError(''); }} className={`flex-1 py-2 text-sm font-medium rounded-md transition ${authMode === 'login' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'}`}>Sign In</button>
              <button onClick={() => { setAuthMode('signup'); setAuthError(''); }} className={`flex-1 py-2 text-sm font-medium rounded-md transition ${authMode === 'signup' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'}`}>Create Account</button>
            </div>

            <div className="space-y-4">
              {authMode === 'signup' && (
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Your Name</label>
                  <input type="text" value={authName} onChange={e => setAuthName(e.target.value)} className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-orange-500 outline-none" placeholder="John Smith" />
                </div>
              )}
              <div>
                <label className="block text-sm text-slate-400 mb-1">Email <span className="text-red-400">*</span></label>
                <input type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-orange-500 outline-none" placeholder="you@business.com" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Password <span className="text-red-400">*</span></label>
                <input type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-orange-500 outline-none" placeholder="••••••••" />
              </div>
              {authMode === 'signup' && (
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Confirm Password <span className="text-red-400">*</span></label>
                  <input type="password" value={authConfirmPassword} onChange={e => setAuthConfirmPassword(e.target.value)} className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-orange-500 outline-none" placeholder="••••••••" />
                </div>
              )}
              {authError && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg"><p className="text-red-400 text-sm text-center">{authError}</p></div>}
              <button onClick={authMode === 'login' ? handleLogin : handleSignup} disabled={authLoading} className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-amber-600 transition disabled:opacity-50">
                {authLoading ? 'Please wait...' : (authMode === 'login' ? 'Sign In' : 'Create Account')}
              </button>
            </div>
            <p className="text-center text-sm text-slate-500 mt-6">Need help? <a href="mailto:business@crewq.com" className="text-orange-500 hover:underline">business@crewq.com</a></p>
          </div>
          <button onClick={onClose} className="w-full mt-4 py-2 text-slate-500 hover:text-slate-300 text-sm">← Back to CrewQ</button>
        </div>
        {toast && <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'} text-white`}>{toast.message}</div>}
      </div>
    );
  }

  // ONBOARDING VIEW
  if (currentView === 'onboarding' || !businessUser?.onboarding_complete) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="bg-slate-800 rounded-2xl p-8 shadow-2xl border border-slate-700">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-white">Set Up Your Venue</h1>
              <p className="text-slate-400 mt-2">Complete your profile to start creating events</p>
            </div>
            
            <div className="flex gap-2 mb-8">
              {[0, 1, 2].map(i => (<div key={i} className={`flex-1 h-1 rounded-full ${onboardingStep >= i ? 'bg-orange-500' : 'bg-slate-700'}`} />))}
            </div>

            {onboardingStep === 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-white">Basic Information</h2>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Venue Name <span className="text-red-400">*</span></label>
                  <input type="text" value={venueName} onChange={e => setVenueName(e.target.value)} className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-orange-500 outline-none" placeholder="The Rustic" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Venue Type</label>
                  <select value={venueType} onChange={e => setVenueType(e.target.value)} className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-orange-500 outline-none">
                    <option value="">Select type...</option>
                    {VENUE_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Neighborhood</label>
                  <select value={venueNeighborhood} onChange={e => setVenueNeighborhood(e.target.value)} className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-orange-500 outline-none">
                    <option value="">Select neighborhood...</option>
                    {DALLAS_NEIGHBORHOODS.map(n => <option key={n.id} value={n.name}>{n.name}</option>)}
                  </select>
                </div>
                <button onClick={() => setOnboardingStep(1)} disabled={!venueName} className="w-full py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition disabled:opacity-50">Continue</button>
              </div>
            )}

            {onboardingStep === 1 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-white">Contact Details</h2>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Address <span className="text-red-400">*</span></label>
                  <input type="text" value={venueAddress} onChange={e => setVenueAddress(e.target.value)} className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-orange-500 outline-none" placeholder="123 Main St, Dallas, TX 75201" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Phone Number <span className="text-red-400">*</span></label>
                  <input type="tel" value={venuePhone} onChange={e => setVenuePhone(e.target.value)} className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-orange-500 outline-none" placeholder="(214) 555-1234" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Website</label>
                  <input type="url" value={venueWebsite} onChange={e => setVenueWebsite(e.target.value)} className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-orange-500 outline-none" placeholder="https://yourvenue.com" />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setOnboardingStep(0)} className="flex-1 py-3 border border-slate-600 text-slate-400 rounded-lg hover:bg-slate-700 transition">Back</button>
                  <button onClick={() => setOnboardingStep(2)} disabled={!venueAddress || !venuePhone} className="flex-1 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition disabled:opacity-50">Continue</button>
                </div>
              </div>
            )}

            {onboardingStep === 2 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-white">Support & Description</h2>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Support Email <span className="text-red-400">*</span></label>
                  <input type="email" value={venueSupportEmail} onChange={e => setVenueSupportEmail(e.target.value)} className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-orange-500 outline-none" placeholder="support@yourvenue.com" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Description</label>
                  <textarea value={venueDescription} onChange={e => setVenueDescription(e.target.value)} rows={3} className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-orange-500 outline-none resize-none" placeholder="Tell customers about your venue..." />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setOnboardingStep(1)} className="flex-1 py-3 border border-slate-600 text-slate-400 rounded-lg hover:bg-slate-700 transition">Back</button>
                  <button onClick={handleOnboardingComplete} disabled={!venueSupportEmail || loading} className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-amber-600 transition disabled:opacity-50">
                    {loading ? 'Setting up...' : 'Complete Setup'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        {toast && <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'} text-white`}>{toast.message}</div>}
      </div>
    );
  }

  // MAIN DASHBOARD LAYOUT
  const analytics = getAnalytics();
  
  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex">
      {/* Mobile Menu Overlay */}
      {isMobile && showMobileMenu && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowMobileMenu(false)} />
      )}
      
      {/* Sidebar - Hidden on mobile unless menu open */}
      <div className={`bg-slate-900 border-r border-slate-800 flex flex-col transition-all z-50 ${
        isMobile 
          ? `fixed inset-y-0 left-0 ${showMobileMenu ? 'translate-x-0' : '-translate-x-full'} w-64`
          : sidebarCollapsed ? 'w-16' : 'w-64'
      }`}>
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              {(!sidebarCollapsed || isMobile) && <div><h1 className="font-bold text-white">Crew<span className="text-orange-500">Q</span></h1><p className="text-xs text-slate-500">Business</p></div>}
            </div>
            {isMobile && (
              <button onClick={() => setShowMobileMenu(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {[
            { id: 'dashboard', icon: Home, label: 'Dashboard' },
            { id: 'events', icon: Calendar, label: 'Events' },
            { id: 'create-event', icon: Plus, label: 'Create Event' },
            { id: 'audience', icon: Users, label: 'Audience' },
            { id: 'venue', icon: Building2, label: 'Venue' },
            { id: 'host-crewq', icon: Star, label: 'Host a CrewQ' },
          ].map(item => (
            <button key={item.id} onClick={() => { setCurrentView(item.id); if (isMobile) setShowMobileMenu(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${currentView === item.id ? 'bg-orange-500/20 text-orange-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {(!sidebarCollapsed || isMobile) && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-2 border-t border-slate-800">
          <button onClick={() => { setBusinessUser(null); setCurrentView('auth'); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition">
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {(!sidebarCollapsed || isMobile) && <span className="text-sm font-medium">Sign Out</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="bg-slate-800 border-b border-slate-700 px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3 md:gap-4">
            {isMobile && (
              <button onClick={() => setShowMobileMenu(true)} className="text-slate-400 hover:text-white transition p-1">
                <div className="w-5 h-0.5 bg-current mb-1" />
                <div className="w-5 h-0.5 bg-current mb-1" />
                <div className="w-5 h-0.5 bg-current" />
              </button>
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-white transition"><X className="w-5 h-5" /></button>
            {!isMobile && <span className="text-slate-500">|</span>}
            <span className="text-slate-400 text-sm md:text-base truncate">{venue?.name || 'Your Venue'}</span>
          </div>
          <span className="text-slate-400 text-xs md:text-sm truncate max-w-[120px] md:max-w-none">{businessUser?.email}</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="p-4 md:p-6">
            {/* DASHBOARD VIEW */}
            {currentView === 'dashboard' && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div><h1 className="text-2xl font-bold text-white">Dashboard</h1><p className="text-slate-400">{venue?.name}</p></div>
                  <button onClick={() => setCurrentView('create-event')} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"><Plus className="w-4 h-4" />Create Event</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-800 rounded-xl p-5 border border-slate-700"><Eye className="w-8 h-8 text-blue-400 mb-3" /><p className="text-3xl font-bold text-white">{analytics.totalViews.toLocaleString()}</p><p className="text-slate-400 text-sm">Event Views</p></div>
                  <div className="bg-slate-800 rounded-xl p-5 border border-slate-700"><Users className="w-8 h-8 text-emerald-400 mb-3" /><p className="text-3xl font-bold text-white">{analytics.totalRsvps}</p><p className="text-slate-400 text-sm">RSVPs</p></div>
                  <div className="bg-slate-800 rounded-xl p-5 border border-slate-700"><CheckCircle className="w-8 h-8 text-amber-400 mb-3" /><p className="text-3xl font-bold text-white">{analytics.totalCheckins}</p><p className="text-slate-400 text-sm">Check-ins</p></div>
                  <div className="bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-xl p-5 border border-orange-500/30"><DollarSign className="w-8 h-8 text-orange-400 mb-3" /><p className="text-3xl font-bold text-white">${analytics.estimatedRevenue.toLocaleString()}</p><p className="text-slate-400 text-sm">Est. Impact</p></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-800 rounded-xl p-5 border border-slate-700"><p className="text-slate-400 text-sm mb-1">Value Per View</p><p className="text-2xl font-bold text-white">${analytics.valuePerView}</p></div>
                  <div className="bg-slate-800 rounded-xl p-5 border border-slate-700"><p className="text-slate-400 text-sm mb-1">Live Events</p><p className="text-2xl font-bold text-emerald-400">{analytics.liveEvents}</p><p className="text-xs text-slate-500">{analytics.pendingEvents} pending</p></div>
                  <div className="bg-slate-800 rounded-xl p-5 border border-slate-700"><p className="text-slate-400 text-sm mb-1">Conversion Rate</p><p className="text-2xl font-bold text-white">{analytics.conversionRate}%</p></div>
                </div>
                <div className="bg-slate-800 rounded-xl border border-slate-700">
                  <div className="p-4 border-b border-slate-700 flex justify-between"><h2 className="font-semibold text-white">Recent Events</h2><button onClick={() => setCurrentView('events')} className="text-orange-400 text-sm hover:underline">View All</button></div>
                  <div className="divide-y divide-slate-700">
                    {events.slice(0, 5).map(event => (
                      <div key={event.id} className="p-4 flex items-center gap-4">
                        <Calendar className={`w-6 h-6 ${event.status === 'pending' ? 'text-amber-400' : 'text-emerald-400'}`} />
                        <div className="flex-1"><p className="text-white font-medium">{event.name}</p><p className="text-slate-500 text-sm">{event.date}</p></div>
                        <span className={`px-2 py-1 rounded-full text-xs ${event.status === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{event.status === 'approved' ? 'Live' : event.status}</span>
                        <div className="text-right"><p className="text-white">{event.views || 0}</p><p className="text-slate-500 text-xs">views</p></div>
                      </div>
                    ))}
                    {events.length === 0 && <div className="p-8 text-center text-slate-500">No events yet. <button onClick={() => setCurrentView('create-event')} className="text-orange-400">Create your first event</button></div>}
                  </div>
                </div>
              </div>
            )}

            {/* EVENTS LIST VIEW */}
            {currentView === 'events' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div><h1 className="text-2xl font-bold text-white">Events</h1><p className="text-slate-400">{events.length} total · {events.filter(e => e.latitude == null || e.longitude == null).length} missing coordinates</p></div>
                  <div className="flex items-center gap-2">
                    {/* Patch A — Geocode backfill */}
                    <button
                      onClick={handleBackfillGeocoding}
                      className="flex items-center gap-2 px-3 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition text-sm"
                      title="Geocode events that are missing latitude/longitude"
                    >
                      <MapPin className="w-4 h-4" />Geocode missing
                    </button>
                    <button onClick={() => setCurrentView('create-event')} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"><Plus className="w-4 h-4" />Create</button>
                  </div>
                </div>
                <div className="bg-slate-800 rounded-xl border border-slate-700">
                  {events.map(event => (
                    <button 
                      key={event.id} 
                      onClick={() => { setEditingEvent(event); setCurrentView('edit-event'); }}
                      className="w-full p-4 border-b border-slate-700 last:border-0 flex items-center gap-4 hover:bg-slate-750 transition text-left"
                    >
                      <Calendar className="w-6 h-6 text-slate-400" />
                      <div className="flex-1">
                        <p className="text-white font-medium">{event.name}</p>
                        <p className="text-slate-500 text-sm flex items-center gap-2">
                          <span>{event.venue} • {event.date}</span>
                          {(event.latitude == null || event.longitude == null) && (
                            <span className="text-amber-400 text-xs" title="Missing coordinates — click 'Geocode missing' to fix">⚠ no geo</span>
                          )}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${event.status === 'pending' ? 'bg-amber-500/20 text-amber-400' : event.status === 'live' || event.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : event.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-slate-600 text-slate-400'}`}>
                        {event.status === 'approved' ? 'Live' : event.status || 'live'}
                      </span>
                      <div className="text-right min-w-[80px]">
                        <p className="text-white font-medium">{event.views || 0}</p>
                        <p className="text-slate-500 text-xs">views</p>
                      </div>
                      <div className="text-right min-w-[60px]">
                        <p className="text-emerald-400 font-medium">{event.rsvps || 0}</p>
                        <p className="text-slate-500 text-xs">RSVPs</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-600" />
                    </button>
                  ))}
                  {events.length === 0 && <div className="p-12 text-center"><Calendar className="w-12 h-12 mx-auto text-slate-600 mb-4" /><p className="text-slate-400">No events yet</p></div>}
                </div>
              </div>
            )}

            {/* EDIT EVENT VIEW */}
            {currentView === 'edit-event' && editingEvent && (
              <div className="max-w-3xl space-y-6">
                <div className="flex items-center gap-4">
                  <button onClick={() => { setEditingEvent(null); setCurrentView('events'); }} className="p-2 hover:bg-slate-800 rounded-lg">
                    <ChevronLeft className="w-5 h-5 text-slate-400" />
                  </button>
                  <div>
                    <h1 className="text-2xl font-bold text-white">Edit Event</h1>
                    <p className="text-slate-400">{editingEvent.name}</p>
                  </div>
                </div>
                
                {/* Event Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 text-center">
                    <Eye className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{editingEvent.views || 0}</p>
                    <p className="text-slate-500 text-xs">Views</p>
                  </div>
                  <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 text-center">
                    <Users className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{editingEvent.rsvps || 0}</p>
                    <p className="text-slate-500 text-xs">RSVPs</p>
                  </div>
                  <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 text-center">
                    <CheckCircle className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{editingEvent.checkins || 0}</p>
                    <p className="text-slate-500 text-xs">Check-ins</p>
                  </div>
                </div>
                
                {/* Status Banner */}
                <div className={`p-4 rounded-xl border ${
                  editingEvent.status === 'pending' ? 'bg-amber-500/10 border-amber-500/30' :
                  editingEvent.status === 'rejected' ? 'bg-red-500/10 border-red-500/30' :
                  'bg-emerald-500/10 border-emerald-500/30'
                }`}>
                  <div className="flex items-center gap-3">
                    {editingEvent.status === 'pending' ? <Clock className="w-5 h-5 text-amber-400" /> :
                     editingEvent.status === 'rejected' ? <X className="w-5 h-5 text-red-400" /> :
                     <CheckCircle className="w-5 h-5 text-emerald-400" />}
                    <div>
                      <p className={`font-medium ${
                        editingEvent.status === 'pending' ? 'text-amber-400' :
                        editingEvent.status === 'rejected' ? 'text-red-400' :
                        'text-emerald-400'
                      }`}>
                        {editingEvent.status === 'pending' ? 'Pending Approval' :
                         editingEvent.status === 'rejected' ? 'Rejected' :
                         'Live & Active'}
                      </p>
                      {editingEvent.status === 'rejected' && editingEvent.rejection_reason && (
                        <p className="text-slate-400 text-sm">Reason: {editingEvent.rejection_reason}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Event Name</label>
                    <input 
                      type="text" 
                      value={editingEvent.name || ''} 
                      onChange={e => setEditingEvent({...editingEvent, name: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-orange-500 outline-none" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Date</label>
                      <input 
                        type="date" 
                        value={editingEvent.date || ''} 
                        onChange={e => setEditingEvent({...editingEvent, date: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-orange-500 outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Time</label>
                      <input 
                        type="time" 
                        value={editingEvent.time || ''} 
                        onChange={e => setEditingEvent({...editingEvent, time: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-orange-500 outline-none" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Description</label>
                    <textarea 
                      value={editingEvent.description || ''} 
                      onChange={e => setEditingEvent({...editingEvent, description: e.target.value})}
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-orange-500 outline-none resize-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Drink Specials</label>
                    <input 
                      type="text" 
                      value={editingEvent.drink_specials || ''} 
                      onChange={e => setEditingEvent({...editingEvent, drink_specials: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-orange-500 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Image URL</label>
                    <input 
                      type="url" 
                      value={editingEvent.image_url || ''} 
                      onChange={e => setEditingEvent({...editingEvent, image_url: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-orange-500 outline-none" 
                    />
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => { setEditingEvent(null); setCurrentView('events'); }} 
                    className="flex-1 py-3 border border-slate-600 text-slate-400 rounded-lg hover:bg-slate-700 transition"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={async () => {
                      try {
                        const { error } = await supabaseClient
                          .from('events')
                          .update({
                            name: editingEvent.name,
                            date: editingEvent.date,
                            time: editingEvent.time,
                            description: editingEvent.description,
                            drink_specials: editingEvent.drink_specials,
                            image_url: editingEvent.image_url
                          })
                          .eq('id', editingEvent.id);
                        if (error) throw error;
                        setEvents(events.map(e => e.id === editingEvent.id ? editingEvent : e));
                        showToastMsg('Event updated!');
                        setEditingEvent(null);
                        setCurrentView('events');
                      } catch (err) {
                        showToastMsg('Failed to update event', 'error');
                      }
                    }}
                    className="flex-1 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {/* CREATE EVENT VIEW */}
            {currentView === 'create-event' && (
              <div className="max-w-3xl space-y-6">
                <div><h1 className="text-2xl font-bold text-white">Create Event</h1><p className="text-slate-400">Events require admin approval before going live</p></div>
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 space-y-6">
                  {/* Patch 2 — Duplicate from existing event */}
                  {events.length > 0 && (
                    <div className="p-3 bg-violet-500/10 border border-violet-500/30 rounded-xl">
                      <label className="block text-xs text-violet-300 mb-2 font-semibold uppercase tracking-wide">⚡ Duplicate from existing event</label>
                      <select
                        value={evtDuplicateFromId}
                        onChange={e => handleDuplicateFromEvent(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                      >
                        <option value="">— Start from scratch —</option>
                        {[...events]
                          .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
                          .slice(0, 50)
                          .map(ev => (
                            <option key={ev.id} value={ev.id}>
                              {ev.name} ({ev.date || 'no date'})
                            </option>
                          ))}
                      </select>
                      <p className="text-violet-300/60 text-xs mt-1">Copies all fields except date. Pick a new date below.</p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm text-slate-400 mb-1">Event Name <span className="text-red-400">*</span></label>
                      <input type="text" value={evtName} onChange={e => setEvtName(e.target.value)} className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-orange-500 outline-none" placeholder="Friday Happy Hour" />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Category</label>
                      <select value={evtCategory} onChange={e => { setEvtCategory(e.target.value); setEvtType(''); }} className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-orange-500 outline-none">
                        <option value="">Select...</option>
                        {EVENT_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Type</label>
                      <select value={evtType} onChange={e => setEvtType(e.target.value)} className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-orange-500 outline-none" disabled={!evtCategory}>
                        <option value="">Select...</option>
                        {evtCategory && EVENT_TYPES[evtCategory]?.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Date <span className="text-red-400">*</span></label>
                      <input type="date" value={evtDate} onChange={e => setEvtDate(e.target.value)} className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-orange-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Start Time <span className="text-red-400">*</span></label>
                      <input type="time" value={evtStartTime} onChange={e => setEvtStartTime(e.target.value)} className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-orange-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">End Time</label>
                      <input type="time" value={evtEndTime} onChange={e => setEvtEndTime(e.target.value)} className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-orange-500 outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Description</label>
                    <textarea value={evtDescription} onChange={e => setEvtDescription(e.target.value)} rows={3} className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-orange-500 outline-none resize-none" placeholder="Describe your event..." />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Drink Specials</label>
                      <input type="text" value={evtDrinkSpecials} onChange={e => setEvtDrinkSpecials(e.target.value)} className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-orange-500 outline-none" placeholder="$5 margaritas" />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Food Specials</label>
                      <input type="text" value={evtFoodSpecials} onChange={e => setEvtFoodSpecials(e.target.value)} className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-orange-500 outline-none" placeholder="Half-price apps" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Cover Charge ($)</label>
                      <input type="number" value={evtCoverCharge} onChange={e => setEvtCoverCharge(e.target.value)} className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-orange-500 outline-none" placeholder="0" />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Capacity</label>
                      <input type="number" value={evtCapacity} onChange={e => setEvtCapacity(e.target.value)} className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-orange-500 outline-none" placeholder="Unlimited" />
                    </div>
                  </div>
                  {/* Patch 2 — Age tag (5 options) */}
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Age <span className="text-red-400">*</span></label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'all-ages',     label: 'All Ages',     emoji: '👨‍👩‍👧' },
                        { id: 'kid-friendly', label: 'Kid-friendly', emoji: '👶' },
                        { id: '18+',          label: '18+',          emoji: '🔞' },
                        { id: '21+',          label: '21+',          emoji: '🍻' },
                        { id: 'date-night',   label: 'Date Night',   emoji: '💕' },
                      ].map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={(e) => { e.preventDefault(); setEvtAgeTag(t.id); }}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                            evtAgeTag === t.id ? 'bg-orange-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          {t.emoji} {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Patch 2 — Kid-friendly & Date Night toggles */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setEvtKidFriendly(!evtKidFriendly); }}
                      className={`flex items-center justify-between p-3 rounded-lg border-2 transition ${
                        evtKidFriendly ? 'bg-emerald-500/20 border-emerald-500 text-white' : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      <span className="text-sm font-medium">👶 Kid-friendly</span>
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center ${evtKidFriendly ? 'bg-emerald-500 text-white text-xs' : 'bg-slate-600'}`}>
                        {evtKidFriendly && '✓'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setEvtDateNight(!evtDateNight); }}
                      className={`flex items-center justify-between p-3 rounded-lg border-2 transition ${
                        evtDateNight ? 'bg-pink-500/20 border-pink-500 text-white' : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      <span className="text-sm font-medium">💕 Date Night</span>
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center ${evtDateNight ? 'bg-pink-500 text-white text-xs' : 'bg-slate-600'}`}>
                        {evtDateNight && '✓'}
                      </span>
                    </button>
                  </div>
                  {/* Patch A — Categorized image picker (replaces single URL input) */}
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Event Image</label>
                    <ImagePicker value={evtImageUrl} onChange={setEvtImageUrl} darkMode={true} />
                  </div>
                  {/* Patch 2 — Menu URL */}
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Menu URL <span className="text-slate-500">(optional)</span></label>
                    <input type="url" value={evtMenuUrl} onChange={e => setEvtMenuUrl(e.target.value)} className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-orange-500 outline-none" placeholder="https://example.com/menu.pdf" />
                    <p className="text-slate-500 text-xs mt-1">Shows on the event card if provided.</p>
                  </div>
                  <button onClick={handleCreateEvent} disabled={loading || !evtName || !evtDate || !evtStartTime} className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-amber-600 transition disabled:opacity-50">
                    {loading ? 'Submitting...' : 'Submit for Approval'}
                  </button>
                  <p className="text-center text-slate-500 text-sm">Events typically get approved within 24 hours</p>
                </div>
              </div>
            )}

            {/* AUDIENCE VIEW */}
            {currentView === 'audience' && (
              <div className="space-y-6">
                <div><h1 className="text-2xl font-bold text-white">Audience Insights</h1><p className="text-slate-400">Anonymous demographic data</p></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-800 rounded-xl p-5 border border-slate-700"><p className="text-slate-400 text-sm">Total Reach</p><p className="text-3xl font-bold text-white mt-1">{analytics.totalViews.toLocaleString()}</p></div>
                  <div className="bg-slate-800 rounded-xl p-5 border border-slate-700"><p className="text-slate-400 text-sm">Engaged Users</p><p className="text-3xl font-bold text-white mt-1">{analytics.totalRsvps}</p></div>
                  <div className="bg-slate-800 rounded-xl p-5 border border-slate-700"><p className="text-slate-400 text-sm">Attendance</p><p className="text-3xl font-bold text-white mt-1">{analytics.totalCheckins}</p></div>
                </div>
                <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-xl p-6 border border-orange-500/30">
                  <h2 className="font-semibold text-white mb-4">Estimated Revenue Impact</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div><p className="text-slate-400 text-sm">From Check-ins</p><p className="text-3xl font-bold text-orange-400">${analytics.estimatedRevenue.toLocaleString()}</p><p className="text-slate-500 text-xs mt-1">Based on ${AVG_SPEND}/person</p></div>
                    <div><p className="text-slate-400 text-sm">Value Per View</p><p className="text-3xl font-bold text-white">${analytics.valuePerView}</p></div>
                    <div><p className="text-slate-400 text-sm">Conversion</p><p className="text-3xl font-bold text-emerald-400">{analytics.conversionRate}%</p></div>
                  </div>
                </div>
              </div>
            )}

            {/* VENUE VIEW */}
            {currentView === 'venue' && venue && (
              <div className="max-w-2xl space-y-6">
                <h1 className="text-2xl font-bold text-white">Venue Settings</h1>
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                  <div className="flex items-center gap-4 pb-4 border-b border-slate-700 mb-4">
                    <div className="w-16 h-16 bg-slate-700 rounded-xl flex items-center justify-center text-3xl">{VENUE_TYPES.find(t => t.id === venue.venue_type)?.icon || '🏢'}</div>
                    <div><h2 className="text-xl font-bold text-white">{venue.name}</h2><p className="text-slate-400">{venue.neighborhood}</p></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><p className="text-slate-500">Address</p><p className="text-white">{venue.address || '-'}</p></div>
                    <div><p className="text-slate-500">Phone</p><p className="text-white">{venue.phone || '-'}</p></div>
                    <div><p className="text-slate-500">Website</p><p className="text-white">{venue.website || '-'}</p></div>
                    <div><p className="text-slate-500">Support Email</p><p className="text-white">{venue.support_email || '-'}</p></div>
                  </div>
                </div>
              </div>
            )}

            {/* HOST CREWQ VIEW */}
            {currentView === 'host-crewq' && (
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center max-w-md">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6"><Star className="w-10 h-10 text-white" /></div>
                  <h1 className="text-2xl font-bold text-white mb-2">Host a CrewQ Event</h1>
                  <p className="text-slate-400 mb-6">Want more visibility? Partner with CrewQ to host a featured event and reach 10x more users!</p>
                  <div className="inline-block px-4 py-2 bg-amber-500/20 text-amber-400 rounded-full text-sm font-medium">🚀 Coming Soon</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {toast && <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'} text-white max-w-sm`}>{toast.message}</div>}
    </div>
  );
}

export default function App() {
  const [currentTab, setCurrentTab] = useState('discover');
  const [mode, setMode] = useState('crew');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [events, setEvents] = useState([]); // Filtered events for discover feed
  const [allEvents, setAllEvents] = useState([]); // All events for squads, map, etc.
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [crewMembers, setCrewMembers] = useState([]);
  const [squads, setSquads] = useState([]);
  const [allSquads, setAllSquads] = useState([]);
  const [sharedEventId, setSharedEventId] = useState(null);
  const [showSharedEvent, setShowSharedEvent] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [selectedEventHistoricalCount, setSelectedEventHistoricalCount] = useState(0);
  const [checkedInEvents, setCheckedInEvents] = useState([]);
  const [showCreateSquad, setShowCreateSquad] = useState(false);
  const [showSquadDetail, setShowSquadDetail] = useState(false);
  const [selectedSquad, setSelectedSquad] = useState(null);
  const [likedEventsRefresh, setLikedEventsRefresh] = useState(0);
  const [likedEvents, setLikedEvents] = useState([]);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [userBadges, setUserBadges] = useState([]);
  const [userStats, setUserStats] = useState({});
  // Patch 7 — RSVPs are now DB-backed via event_rsvps; localStorage is only a fallback cache
  const [userRsvpedEventIds, setUserRsvpedEventIds] = useState(new Set());
  const [showBadgeEarned, setShowBadgeEarned] = useState(null);
  const [attendedEvents, setAttendedEvents] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [pendingGoogleUser, setPendingGoogleUser] = useState(null); // For Google OAuth onboarding
  
  // Vibe filter for discover feed (default OFF)
  const [vibeFilterEnabled, setVibeFilterEnabled] = useState(false);
  
  // Tonight mode - shows only events happening now/soon
  const [tonightMode, setTonightMode] = useState(false);
  // Patch B — Discover feed UI state
  const [soloModeEnabled, setSoloModeEnabled] = useState(false);
  const [discoverSearchQuery, setDiscoverSearchQuery] = useState('');
  const [discoverCategoryFilter, setDiscoverCategoryFilter] = useState('all');
  const [savedEventIds, setSavedEventIds] = useState(new Set());
  // Patch B.2 — Pass-tracking. Replaces the global "_seen" filter with explicit user dismissal.
  const [passedEventIds, setPassedEventIds] = useState(new Set());
  // Patch B.2 — Most recent pass, for the 3-second Undo affordance. { event, timeoutId } | null
  const [recentPass, setRecentPass] = useState(null);
  // Patch C — Filters modal (Discover only)
  const [showDiscoverFilters, setShowDiscoverFilters] = useState(false);
  // Patch C — Post-RSVP follow-up sheet (calendar export + bring-a-friend) shown inline in EventDetailModal
  const [postRsvpEvent, setPostRsvpEvent] = useState(null);
  // Patch C2a — JS-measured scroll container height. iOS Safari requires an explicit (not flex-1) height
  // for `scroll-snap-type: y mandatory` to reliably engage. We measure window height minus the top
  // utility bar minus the bottom nav, and set the scroll container + each card to that exact height.
  const [feedScrollHeight, setFeedScrollHeight] = useState(null);
  const topBarRef = useRef(null);
  const bottomNavRef = useRef(null);

  useEffect(() => {
    const measure = () => {
      const top = topBarRef.current?.getBoundingClientRect().height || 0;
      const bottom = bottomNavRef.current?.getBoundingClientRect().height || 0;
      // window.innerHeight reflects the actual usable viewport (post-iOS-address-bar collapse)
      const h = Math.max(0, window.innerHeight - top - bottom);
      setFeedScrollHeight(h);
    };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);
    // Patch C2a fix — re-measure aggressively in the first ~1.5s to catch:
    //   - iOS Safari address-bar collapse (~200ms after first paint)
    //   - Safe-area inset reapplication (`pb-safe`) after layout settles
    //   - Late-mounting refs from conditional content
    const timers = [
      setTimeout(measure, 100),
      setTimeout(measure, 300),
      setTimeout(measure, 750),
      setTimeout(measure, 1500),
    ];
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
      timers.forEach(clearTimeout);
    };
  }, []);
  
  // New feature modals
  const [showNotificationPrefs, setShowNotificationPrefs] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSquadChat, setShowSquadChat] = useState(null); // squad object or null
  
  // Streak tracking
  const [userStreaks, setUserStreaks] = useState({
    daily: 0,
    weeklyCheckIn: 0,
    monthlyVenues: 0,
    monthlyCheckIns: 0
  });
  
  // Event RSVPs/social proof cache
  const [eventRsvpUsers, setEventRsvpUsers] = useState({}); // eventId -> [{user}]
  
  // Settings & Notifications
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    // Check if user has manual preference
    const savedTheme = localStorage.getItem('crewq_theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme === 'dark';
    }
    // Auto-switch based on time: dark mode after 5PM (17:00) until 6AM
    const hour = new Date().getHours();
    return hour >= 17 || hour < 6;
  });
  const [notifications, setNotifications] = useState([]);
  const [pendingJoinRequests, setPendingJoinRequests] = useState([]);
  const [showJoinRequestReview, setShowJoinRequestReview] = useState(null);
  const [toast, setToast] = useState(null);
  
  // Admin & Business Portal states
  const [showAdminPortal, setShowAdminPortal] = useState(false);
  const [showBusinessPortal, setShowBusinessPortal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Auto-switch theme based on time of day
  useEffect(() => {
    const checkTimeAndSwitchTheme = () => {
      const savedTheme = localStorage.getItem('crewq_theme');
      // Only auto-switch if user hasn't set a manual preference
      if (savedTheme !== 'light' && savedTheme !== 'dark') {
        const hour = new Date().getHours();
        const shouldBeDark = hour >= 17 || hour < 6;
        setDarkMode(shouldBeDark);
      }
    };
    
    // Check every minute
    const interval = setInterval(checkTimeAndSwitchTheme, 60000);
    return () => clearInterval(interval);
  }, []);

  // Helper function to show toast instead of alert
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Helper to get user-specific localStorage key
  const getUserKey = (key) => {
    return userProfile?.id ? `crewq_${userProfile.id}_${key}` : `crewq_${key}`;
  };

  // Add CSS for animations and scrollbar hide
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .scrollbar-hide::-webkit-scrollbar { display: none; }
      .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      @keyframes bounce-in {
        0% { transform: scale(0.3); opacity: 0; }
        50% { transform: scale(1.05); }
        70% { transform: scale(0.9); }
        100% { transform: scale(1); opacity: 1; }
      }
      .animate-bounce-in { animation: bounce-in 0.5s ease-out; }
      @keyframes slide-down {
        0% { transform: translate(-50%, -100%); opacity: 0; }
        100% { transform: translate(-50%, 0); opacity: 1; }
      }
      .animate-slide-down { animation: slide-down 0.3s ease-out; }
      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 0.3; }
        50% { transform: scale(1.5); opacity: 0.1; }
      }
      .mapboxgl-canvas { outline: none; }
      
      /* Neon glow effects for dark/night mode */
      @keyframes neon-pulse {
        0%, 100% { box-shadow: 0 0 5px rgba(139, 92, 246, 0.5), 0 0 20px rgba(139, 92, 246, 0.3); }
        50% { box-shadow: 0 0 10px rgba(139, 92, 246, 0.8), 0 0 40px rgba(139, 92, 246, 0.5); }
      }
      .neon-glow { animation: neon-pulse 2s ease-in-out infinite; }
      
      /* Smooth theme transition */
      * { transition: background-color 0.3s ease, border-color 0.3s ease; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Save theme preference
  useEffect(() => {
    localStorage.setItem('crewq_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Load notifications and pending join requests
  useEffect(() => {
    if (userProfile?.id) {
      loadNotifications();
      loadPendingJoinRequests();
    }
  }, [userProfile?.id]);

  // Auto-refresh data every 30 seconds for real-time updates
  // Pause when admin portal is open to prevent form data loss
  useEffect(() => {
    if (!userProfile?.id || showAdminPortal) return;
    
    const refreshInterval = setInterval(() => {
      // Refresh notifications
      loadNotifications();
      loadPendingJoinRequests();
      
      // Refresh squads data
      loadSquads(userProfile.id);
      loadAllSquads();
      
      // Refresh events - pass userId to filter out seen events
      loadEvents(userProfile.id);
      
      // Refresh badges and stats
      loadUserBadges(userProfile.id);
      loadUserStats(userProfile.id);
      loadAttendedEvents(userProfile.id);
    }, 30000); // 30 seconds
    
    return () => clearInterval(refreshInterval);
  }, [userProfile?.id, showAdminPortal]);

  const loadNotifications = async () => {
    if (!supabaseClient || !userProfile) return;
    
    // Get cleared notification IDs from localStorage
    const clearedNotifs = JSON.parse(localStorage.getItem(`crewq_${userProfile.id}_cleared_notifs`) || '[]');
    
    // Build notifications from various sources
    const notifs = [];
    
    // Check for upcoming liked events (within next 24 hours) - user specific
    const likedEventsData = JSON.parse(localStorage.getItem(`crewq_${userProfile.id}_liked`) || '[]');
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    likedEventsData.forEach(event => {
      const eventDate = new Date(event.date);
      if (eventDate >= now && eventDate <= tomorrow) {
        const notifId = `reminder-${event.id}`;
        if (!clearedNotifs.includes(notifId)) {
          notifs.push({
            id: notifId,
            type: 'event_reminder',
            title: 'Upcoming Event!',
            message: `${event.name} is happening soon`,
            event: event,
            time: 'Today',
            read: false
          });
        }
      }
    });
    
    // Check for events happening now (check-in reminder)
    likedEventsData.forEach(event => {
      const eventDate = new Date(event.date);
      const eventStart = new Date(eventDate);
      
      // Parse time if available
      if (event.time) {
        const timeMatch = event.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (timeMatch) {
          let hours = parseInt(timeMatch[1]);
          const minutes = parseInt(timeMatch[2]);
          const period = timeMatch[3].toUpperCase();
          if (period === 'PM' && hours !== 12) hours += 12;
          if (period === 'AM' && hours === 12) hours = 0;
          eventStart.setHours(hours, minutes, 0, 0);
        }
      }
      
      const checkInWindow = new Date(eventStart.getTime() - 30 * 60 * 1000);
      const eventEnd = new Date(eventStart.getTime() + 4 * 60 * 60 * 1000);
      
      if (now >= checkInWindow && now <= eventEnd && !checkedInEvents.includes(event.id)) {
        const notifId = `checkin-${event.id}`;
        if (!clearedNotifs.includes(notifId)) {
          notifs.push({
            id: notifId,
            type: 'checkin_reminder',
            title: 'Check In Now!',
            message: `${event.name} is happening - don't forget to check in!`,
            event: event,
            time: 'Now',
            read: false,
            priority: true
          });
        }
      }
    });
    
    // Patch 5 — Load persisted notifications from DB (event approvals/rejections, etc)
    try {
      const { data: dbNotifs } = await supabaseClient
        .from('notifications')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      (dbNotifs || []).forEach(n => {
        const notifId = `db-${n.id}`;
        if (clearedNotifs.includes(notifId)) return;
        const created = n.created_at ? new Date(n.created_at) : null;
        const timeLabel = created
          ? (Date.now() - created.getTime() < 24*60*60*1000 ? 'Today' : created.toLocaleDateString())
          : '';
        notifs.push({
          id: notifId,
          type: n.type || 'system',
          title: n.title || 'Notification',
          message: n.message || '',
          event_id: n.event_id,
          time: timeLabel,
          read: !!n.read
        });
      });
    } catch (err) {
      console.error('Failed to load DB notifications:', err);
    }
    
    setNotifications(notifs);
  };

  const loadPendingJoinRequests = async () => {
    if (!supabaseClient || !userProfile) return;
    
    try {
      // Get squads created by this user
      const { data: mySquads } = await supabaseClient
        .from('squads')
        .select('id')
        .eq('created_by', userProfile.id);
      
      if (!mySquads || mySquads.length === 0) {
        setPendingJoinRequests([]);
        return;
      }
      
      const squadIds = mySquads.map(s => s.id);
      
      // Get pending requests for those squads
      const { data: requests } = await supabaseClient
        .from('squad_join_requests')
        .select(`
          *,
          user:users(*),
          squad:squads(*)
        `)
        .in('squad_id', squadIds)
        .eq('status', 'pending');
      
      // Fetch accurate badge counts for each user
      const requestsWithBadges = await Promise.all(
        (requests || []).map(async (request) => {
          if (request.user?.id) {
            const { count } = await supabaseClient
              .from('user_badges')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', request.user.id);
            return {
              ...request,
              user: { ...request.user, badge_count: count || 0 }
            };
          }
          return request;
        })
      );
      
      setPendingJoinRequests(requestsWithBadges);
    } catch (error) {
      console.error('Error loading join requests:', error);
    }
  };

  const handleApproveJoinRequest = async (request) => {
    if (!supabaseClient) return;
    
    try {
      // Update request status
      await supabaseClient
        .from('squad_join_requests')
        .update({ status: 'approved', responded_at: new Date().toISOString() })
        .eq('id', request.id);
      
      // Add user to squad
      await supabaseClient
        .from('squad_members')
        .insert([{ squad_id: request.squad_id, user_id: request.user_id }]);
      
      // Update member count
      await supabaseClient
        .from('squads')
        .update({ member_count: (request.squad?.member_count || 0) + 1 })
        .eq('id', request.squad_id);
      
      // Send notification to the approved user
      try {
        await supabaseClient
          .from('notifications')
          .insert([{
            user_id: request.user_id,
            type: 'squad_request_approved',
            title: 'Squad Request Approved! 🎉',
            message: `You've been approved to join "${request.squad?.name}"!`,
            squad_id: request.squad_id,
            read: false
          }]);
      } catch (notifError) {
        console.log('Notification table may not exist:', notifError);
      }
      
      showToast('Request approved! They\'ve been added to the squad.', 'success');
      setShowJoinRequestReview(null);
      loadPendingJoinRequests();
      await loadSquads(userProfile.id);
      await loadAllSquads();
    } catch (error) {
      console.error('Error approving request:', error);
      showToast('Error approving request. Please try again.', 'error');
    }
  };

  const handleRejectJoinRequest = async (request, reason) => {
    if (!supabaseClient) return;
    
    try {
      // Update request status
      await supabaseClient
        .from('squad_join_requests')
        .update({ 
          status: 'rejected', 
          rejection_reason: reason,
          responded_at: new Date().toISOString() 
        })
        .eq('id', request.id);
      
      // Track rejection for pattern detection
      try {
        await supabaseClient
          .from('squad_rejection_stats')
          .insert([{
            squad_owner_id: userProfile.id,
            rejected_user_gender: request.user?.gender,
            rejection_reason: reason
          }]);
      } catch (statsError) {
        console.log('Rejection stats table may not exist:', statsError);
      }
      
      // Send notification to the rejected user
      const reasonLabel = REJECTION_REASONS.find(r => r.id === reason)?.label || 'No reason provided';
      try {
        await supabaseClient
          .from('notifications')
          .insert([{
            user_id: request.user_id,
            type: 'squad_request_declined',
            title: 'Squad Request Update',
            message: `Your request to join "${request.squad?.name}" wasn't approved. Reason: ${reasonLabel}`,
            squad_id: request.squad_id,
            read: false
          }]);
      } catch (notifError) {
        console.log('Notification table may not exist:', notifError);
      }
      
      showToast('Request declined.', 'info');
      setShowJoinRequestReview(null);
      loadPendingJoinRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      showToast('Error declining request. Please try again.', 'error');
    }
  };

  // Track daily app usage - user specific
  useEffect(() => {
    if (!userProfile?.id) return;
    
    const today = new Date().toDateString();
    const userKey = `crewq_${userProfile.id}`;
    const lastVisit = localStorage.getItem(`${userKey}_last_visit`);
    const daysActive = parseInt(localStorage.getItem(`${userKey}_days_active`) || '0');
    const currentStreak = parseInt(localStorage.getItem(`${userKey}_streak`) || '0');
    
    if (lastVisit !== today) {
      // New day
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const newDaysActive = daysActive + 1;
      let newStreak = currentStreak;
      
      if (lastVisit === yesterday.toDateString()) {
        newStreak = currentStreak + 1;
      } else if (lastVisit !== today) {
        newStreak = 1;
      }
      
      localStorage.setItem(`${userKey}_last_visit`, today);
      localStorage.setItem(`${userKey}_days_active`, newDaysActive.toString());
      localStorage.setItem(`${userKey}_streak`, newStreak.toString());
    }
  }, [userProfile?.id]);

  // Load liked events from localStorage - user specific
  useEffect(() => {
    if (!userProfile?.id) return;
    const loadLikedEvents = () => {
      const liked = JSON.parse(localStorage.getItem(`crewq_${userProfile.id}_liked`) || '[]');
      setLikedEvents(liked);
    };
    loadLikedEvents();
  }, [likedEventsRefresh, userProfile?.id]);

  // Load user badges and stats
  useEffect(() => {
    if (userProfile?.id) {
      loadUserBadges(userProfile.id);
      loadUserStats(userProfile.id);
      loadAttendedEvents(userProfile.id);
    }
  }, [userProfile?.id]);

  const loadUserBadges = async (userId) => {
    if (!supabaseClient) return;
    try {
      const { data } = await supabaseClient
        .from('user_badges')
        .select('badge_id')
        .eq('user_id', userId);
      setUserBadges(data?.map(b => b.badge_id) || []);
    } catch (error) {
      console.error('Error loading badges:', error);
    }
  };

  const loadAttendedEvents = async (userId) => {
    if (!supabaseClient) return;
    try {
      // First get check-in event IDs
      // Patch C2a — Removed `created_at` from select + order. Some event_checkins tables don't have
      // that column, causing a 400. We don't need ordering here (only IDs are used downstream).
      const { data: checkins, error: checkinsError } = await supabaseClient
        .from('event_checkins')
        .select('event_id')
        .eq('user_id', userId);
      
      if (checkinsError || !checkins?.length) {
        setAttendedEvents([]);
        return;
      }

      // Then get event details
      const eventIds = checkins.map(c => c.event_id);
      const { data: events } = await supabaseClient
        .from('events')
        .select('*')
        .in('id', eventIds);

      // Combine check-in data with event details
      const eventsWithDetails = checkins.map(checkin => {
        const event = events?.find(e => e.id === checkin.event_id);
        return event ? { ...event, checkedInAt: checkin.created_at } : null;
      }).filter(Boolean);
      
      setAttendedEvents(eventsWithDetails);
    } catch (error) {
      console.error('Error loading attended events:', error);
      setAttendedEvents([]);
    }
  };

  const loadUserStats = async (userId) => {
    if (!supabaseClient) return;
    try {
      // Get total check-ins
      const { count: totalCheckins } = await supabaseClient
        .from('event_checkins')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Get squads created
      const { count: squadsCreated } = await supabaseClient
        .from('squads')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', userId);

      // Get category check-ins - separate queries to avoid relationship issues
      const { data: checkinData } = await supabaseClient
        .from('event_checkins')
        .select('event_id')
        .eq('user_id', userId);

      let categoryCheckins = {};
      if (checkinData?.length) {
        const eventIds = checkinData.map(c => c.event_id);
        const { data: eventsData } = await supabaseClient
          .from('events')
          .select('id, category')
          .in('id', eventIds);
        
        eventsData?.forEach(e => {
          if (e.category) {
            categoryCheckins[e.category] = (categoryCheckins[e.category] || 0) + 1;
          }
        });
      }

      // Get local engagement stats - user specific
      const userKey = `crewq_${userId}`;
      // Use seen events count for swipes (ensures uniqueness)
      const seenEvents = JSON.parse(localStorage.getItem(`${userKey}_seen`) || '[]');
      const totalSwipes = seenEvents.length;
      const totalLikes = JSON.parse(localStorage.getItem(`${userKey}_liked`) || '[]').length;
      const daysActive = parseInt(localStorage.getItem(`${userKey}_days_active`) || '0');
      const currentStreak = parseInt(localStorage.getItem(`${userKey}_streak`) || '0');
      
      // Check if profile is complete
      const profileComplete = !!(userProfile?.bio && userProfile?.vibes?.length > 0);

      setUserStats({
        totalCheckins: totalCheckins || 0,
        squadsCreated: squadsCreated || 0,
        categoryCheckins,
        totalSwipes,
        totalLikes,
        daysActive,
        currentStreak,
        profileComplete
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const awardBadge = async (badgeId) => {
    if (!supabaseClient || !userProfile) return;
    if (userBadges.includes(badgeId)) return;

    try {
      await supabaseClient
        .from('user_badges')
        .insert([{ user_id: userProfile.id, badge_id: badgeId }]);
      
      setUserBadges(prev => [...prev, badgeId]);
      
      const badge = BADGES.find(b => b.id === badgeId);
      if (badge) {
        setShowBadgeEarned(badge);
      }
    } catch (error) {
      console.error('Error awarding badge:', error);
    }
  };

  const checkAndAwardBadges = async () => {
    if (!userProfile) return;
    
    const stats = userStats;
    
    // Check profile complete badge
    if (stats.profileComplete && !userBadges.includes('profile-complete')) {
      await awardBadge('profile-complete');
    }
    
    // Check engagement badges - days active
    if (stats.daysActive >= 3 && !userBadges.includes('daily-3')) {
      await awardBadge('daily-3');
    }
    if (stats.daysActive >= 7 && !userBadges.includes('daily-7')) {
      await awardBadge('daily-7');
    }
    if (stats.daysActive >= 30 && !userBadges.includes('daily-30')) {
      await awardBadge('daily-30');
    }
    
    // Check swipe badges
    if (stats.totalSwipes >= 25 && !userBadges.includes('swipe-25')) {
      await awardBadge('swipe-25');
    }
    if (stats.totalSwipes >= 100 && !userBadges.includes('swipe-100')) {
      await awardBadge('swipe-100');
    }
    if (stats.totalSwipes >= 500 && !userBadges.includes('swipe-500')) {
      await awardBadge('swipe-500');
    }
    
    // Check like badges
    if (stats.totalLikes >= 1 && !userBadges.includes('first-like')) {
      await awardBadge('first-like');
    }
    if (stats.totalLikes >= 10 && !userBadges.includes('likes-10')) {
      await awardBadge('likes-10');
    }
    if (stats.totalLikes >= 50 && !userBadges.includes('likes-50')) {
      await awardBadge('likes-50');
    }
    
    // Check streak badges
    if (stats.currentStreak >= 3 && !userBadges.includes('streak-3')) {
      await awardBadge('streak-3');
    }
    if (stats.currentStreak >= 7 && !userBadges.includes('streak-7')) {
      await awardBadge('streak-7');
    }
    if (stats.currentStreak >= 14 && !userBadges.includes('streak-14')) {
      await awardBadge('streak-14');
    }
    if (stats.currentStreak >= 30 && !userBadges.includes('streak-30')) {
      await awardBadge('streak-30');
    }
    
    // Check check-in milestones
    if (stats.totalCheckins >= 1 && !userBadges.includes('first-checkin')) {
      await awardBadge('first-checkin');
    }
    if (stats.totalCheckins >= 5 && !userBadges.includes('checkin-5')) {
      await awardBadge('checkin-5');
    }
    if (stats.totalCheckins >= 10 && !userBadges.includes('checkin-10')) {
      await awardBadge('checkin-10');
    }
    if (stats.totalCheckins >= 25 && !userBadges.includes('checkin-25')) {
      await awardBadge('checkin-25');
    }
    
    // Check squad badges
    if (stats.squadsCreated >= 1 && !userBadges.includes('first-squad')) {
      await awardBadge('first-squad');
    }
    if (stats.squadsCreated >= 3 && !userBadges.includes('crew-builder')) {
      await awardBadge('crew-builder');
    }
    
    // Check category badges
    const catCheckins = stats.categoryCheckins || {};
    if ((catCheckins['karaoke'] || 0) >= 3 && !userBadges.includes('karaoke-king')) {
      await awardBadge('karaoke-king');
    }
    if ((catCheckins['trivia'] || 0) >= 3 && !userBadges.includes('trivia-master')) {
      await awardBadge('trivia-master');
    }
    if ((catCheckins['live-music'] || 0) >= 5 && !userBadges.includes('live-music-lover')) {
      await awardBadge('live-music-lover');
    }
    if ((catCheckins['happy-hour'] || 0) >= 5 && !userBadges.includes('happy-hour-hero')) {
      await awardBadge('happy-hour-hero');
    }
    
    // Check Key to the City (now 25 badges)
    if (userBadges.length >= 25 && !userBadges.includes('key-to-city')) {
      await awardBadge('key-to-city');
    }
  };

  useEffect(() => {
    if (userStats.totalCheckins !== undefined) {
      checkAndAwardBadges();
    }
  }, [userStats]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = async () => {
      initSupabase();
      
      if (!supabaseClient) {
        console.error('Failed to initialize Supabase client');
        setLoading(false);
        return;
      }
      
      // Check if this is an OAuth callback (URL has hash with access_token or error)
      const hash = window.location.hash;
      if (hash && (hash.includes('access_token') || hash.includes('error'))) {
        console.log('OAuth callback detected');
        
        // Supabase should automatically process the hash
        // Give it a moment to do so
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Clear the hash from URL for cleaner UX
        if (window.history.replaceState) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
      
      // Now check auth
      await checkAuth();
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

  // Request user location (one-time)
  const requestUserLocation = async () => {
    try {
      const location = await getUserLocation();
      setUserLocation(location);
      setLocationError(null);
      showToast('Location enabled!', 'success');
    } catch (error) {
      console.error('Location error:', error);
      setLocationError(error.message);
      if (error.code === 1) {
        showToast('Location access denied. Enable in browser settings.', 'error');
      } else {
        showToast('Could not get location. Try again.', 'error');
      }
    }
  };

  const handleEventClick = async (event) => {
    setSelectedEvent(event);
    setShowEventDetail(true);
    
    // Load historical attendance count for this event
    if (supabaseClient) {
      try {
        const { count } = await supabaseClient
          .from('event_checkins')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id);
        setSelectedEventHistoricalCount(count || 0);
      } catch (error) {
        console.error('Error loading historical count:', error);
        setSelectedEventHistoricalCount(0);
      }
    }
  };

  const handleUnlikeEvent = async (event) => {
    if (!userProfile?.id) return;
    
    const userKey = `crewq_${userProfile.id}_liked`;
    
    // Remove from localStorage
    const liked = JSON.parse(localStorage.getItem(userKey) || '[]');
    const updatedLiked = liked.filter(e => e.id !== event.id);
    localStorage.setItem(userKey, JSON.stringify(updatedLiked));

    // Remove from Supabase
    if (supabaseClient && userProfile) {
      try {
        await supabaseClient
          .from('liked_events')
          .delete()
          .eq('user_id', userProfile.id)
          .eq('event_id', event.id);
      } catch (error) {
        console.error('Error unliking event:', error);
      }
    }

    // Force re-render by updating refresh counter
    setLikedEventsRefresh(prev => prev + 1);
    showToast('Event removed from your list', 'info');
  };

  const handleCheckIn = async (event) => {
    if (!supabaseClient || !userProfile) return;

    // Check if already checked in
    if (checkedInEvents.includes(event.id)) {
      showToast("You've already checked in to this event!", 'info');
      return;
    }

    // Check if event has started (time-based check)
    const now = new Date();
    const eventDate = new Date(event.date);
    
    // Parse event time (e.g., "8:00 PM - 2:00 AM")
    if (event.time) {
      const timeMatch = event.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const period = timeMatch[3].toUpperCase();
        
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        
        eventDate.setHours(hours, minutes, 0, 0);
      }
    }
    
    // Allow check-in starting 30 minutes before event and up to 6 hours after start
    const checkInStart = new Date(eventDate.getTime() - 30 * 60 * 1000);
    const checkInEnd = new Date(eventDate.getTime() + 6 * 60 * 60 * 1000);
    
    if (now < checkInStart) {
      const timeUntil = Math.ceil((checkInStart - now) / (1000 * 60));
      if (timeUntil > 60) {
        const hours = Math.floor(timeUntil / 60);
        showToast(`Check-in opens in ${hours} hour${hours > 1 ? 's' : ''}`, 'info');
      } else {
        showToast(`Check-in opens in ${timeUntil} minutes`, 'info');
      }
      return;
    }

    if (now > checkInEnd) {
      showToast('Check-in window has closed for this event', 'info');
      return;
    }

    try {
      // Check for duplicate in database
      const { data: existing } = await supabaseClient
        .from('event_checkins')
        .select('id')
        .eq('user_id', userProfile.id)
        .eq('event_id', event.id)
        .single();

      if (existing) {
        setCheckedInEvents(prev => [...new Set([...prev, event.id])]);
        showToast("You've already checked in to this event!", 'info');
        return;
      }

      await supabaseClient
        .from('event_checkins')
        .insert([{
          user_id: userProfile.id,
          event_id: event.id,
          event_category: event.category || null
        }]);

      setCheckedInEvents(prev => [...new Set([...prev, event.id])]);
      
      // Refresh stats and attended events to check for new badges
      await loadUserStats(userProfile.id);
      await loadAttendedEvents(userProfile.id);
      
      showToast("You're checked in! 🎉 Your crew will see you're here.", 'success');
    } catch (error) {
      console.error('Error checking in:', error);
      if (error.code === '23505') {
        // Duplicate key error
        setCheckedInEvents(prev => [...new Set([...prev, event.id])]);
        showToast("You've already checked in to this event!", 'info');
      } else {
        showToast('Error checking in. Please try again.', 'error');
      }
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
          votes_no: 0,
          // Restriction fields
          gender_restriction: squadData.gender_restriction || 'all',
          min_age: squadData.min_age || null,
          max_age: squadData.max_age || null,
          min_badges: squadData.min_badges || 0,
          requires_approval: squadData.requires_approval || false,
          // New fields
          max_members: squadData.max_members || null,
          meeting_spot: squadData.meeting_spot || null,
          meeting_instructions: squadData.meeting_instructions || null
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

      showToast('Squad created! Invites will be sent to your friends.', 'success');
      setShowCreateSquad(false);
      await loadSquads(userProfile.id);
      await loadAllSquads();
    } catch (error) {
      console.error('Error creating squad:', error);
      showToast('Error creating squad. Please try again.', 'error');
    }
  };

  const handleJoinSquad = async (squad, isRequest = false) => {
    if (!supabaseClient || !userProfile) return;
    
    // Patch 6 — One-time off-app meeting safety warning
    const warnKey = `crewq_${userProfile.id}_offapp_warned`;
    if (!localStorage.getItem(warnKey)) {
      const ok = window.confirm(
        "Heads up before you join:\n\n" +
        "Meeting people from any app carries some risk. A few quick guidelines:\n\n" +
        "• Meet in public places\n" +
        "• Tell a friend where you're going\n" +
        "• Trust your gut — leave if something feels off\n" +
        "• Don't share personal info like your home address\n\n" +
        "CrewQ helps coordinate plans but isn't responsible for off-app interactions.\n\n" +
        "Continue?"
      );
      if (!ok) return;
      localStorage.setItem(warnKey, '1');
    }
    
    try {
      if (isRequest && squad.requires_approval) {
        // Submit a join request instead of joining directly
        await supabaseClient
          .from('squad_join_requests')
          .insert([{
            squad_id: squad.id,
            user_id: userProfile.id,
            status: 'pending'
          }]);

        showToast('Request sent! The squad leader will review it.', 'success');
        setShowSquadDetail(false);
      } else {
        // Direct join (no approval required or approved request)
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

        showToast('You joined the squad!', 'success');
        setShowSquadDetail(false);
        await loadSquads(userProfile.id);
        await loadAllSquads();
      }
    } catch (error) {
      console.error('Error joining squad:', error);
      if (error.code === '23505') {
        showToast('You already have a pending request for this squad.', 'info');
      } else {
        showToast('Error joining squad. Please try again.', 'error');
      }
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

      showToast('You left the squad', 'info');
      setShowSquadDetail(false);
      await loadSquads(userProfile.id);
      await loadAllSquads();
    } catch (error) {
      console.error('Error leaving squad:', error);
      showToast('Error leaving squad. Please try again.', 'error');
    }
  };

  const handleDeleteSquad = async (squad) => {
    if (!supabaseClient || !userProfile) return;
    
    if (!confirm(`Are you sure you want to delete "${squad.name}"? This cannot be undone.`)) {
      return;
    }
    
    try {
      // Delete squad members first
      await supabaseClient
        .from('squad_members')
        .delete()
        .eq('squad_id', squad.id);
      
      // Delete join requests
      await supabaseClient
        .from('squad_join_requests')
        .delete()
        .eq('squad_id', squad.id);
      
      // Delete squad votes
      await supabaseClient
        .from('squad_votes')
        .delete()
        .eq('squad_id', squad.id);
      
      // Delete the squad
      await supabaseClient
        .from('squads')
        .delete()
        .eq('id', squad.id);

      showToast('Squad deleted', 'success');
      setShowSquadDetail(false);
      await loadSquads(userProfile.id);
      await loadAllSquads();
    } catch (error) {
      console.error('Error deleting squad:', error);
      showToast('Error deleting squad. Please try again.', 'error');
    }
  };

  const [showEditSquad, setShowEditSquad] = useState(null);

  const handleEditSquad = (squad) => {
    setShowSquadDetail(false);
    setShowEditSquad(squad);
  };

  const handleSaveSquadEdit = async (updatedSquad) => {
    if (!supabaseClient) return;
    
    try {
      await supabaseClient
        .from('squads')
        .update({
          name: updatedSquad.name,
          description: updatedSquad.description,
          max_members: updatedSquad.max_members,
          meeting_spot: updatedSquad.meeting_spot,
          meeting_instructions: updatedSquad.meeting_instructions,
          is_solo_friendly: updatedSquad.is_solo_friendly,
          gender_restriction: updatedSquad.gender_restriction,
          min_age: updatedSquad.min_age,
          max_age: updatedSquad.max_age,
          min_badges: updatedSquad.min_badges,
          requires_approval: updatedSquad.requires_approval
        })
        .eq('id', updatedSquad.id);

      showToast('Squad updated!', 'success');
      
      // Reload squads to get fresh data
      await loadSquads(userProfile.id);
      await loadAllSquads();
      
      // Return to squad detail with updated squad
      setShowEditSquad(null);
      setSelectedSquad(updatedSquad);
      setShowSquadDetail(true);
    } catch (error) {
      console.error('Error updating squad:', error);
      showToast('Error updating squad. Please try again.', 'error');
    }
  };

  const handleMuteSquad = async (squad) => {
    // For now, store muted squads in localStorage
    const mutedSquads = JSON.parse(localStorage.getItem(`crewq_${userProfile.id}_muted_squads`) || '[]');
    
    if (mutedSquads.includes(squad.id)) {
      // Unmute
      const updated = mutedSquads.filter(id => id !== squad.id);
      localStorage.setItem(`crewq_${userProfile.id}_muted_squads`, JSON.stringify(updated));
      showToast('Notifications enabled for this squad', 'success');
    } else {
      // Mute
      mutedSquads.push(squad.id);
      localStorage.setItem(`crewq_${userProfile.id}_muted_squads`, JSON.stringify(mutedSquads));
      showToast('Notifications muted for this squad', 'info');
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

  // Patch 7 — load RSVPs from DB into state Set, fallback to localStorage cache if DB fails
  const loadUserRsvps = async (userId) => {
    if (!supabaseClient || !userId) return;
    const userKey = `crewq_${userId}`;
    try {
      const { data, error } = await supabaseClient
        .from('event_rsvps')
        .select('event_id')
        .eq('user_id', userId);
      if (error) throw error;
      const ids = (data || []).map(r => r.event_id);
      setUserRsvpedEventIds(new Set(ids));
      // Refresh localStorage cache to match DB
      localStorage.setItem(`${userKey}_rsvped`, JSON.stringify(ids));
    } catch (error) {
      console.error('Error loading RSVPs (using local cache):', error);
      // Fallback to localStorage
      try {
        const cached = JSON.parse(localStorage.getItem(`${userKey}_rsvped`) || '[]');
        setUserRsvpedEventIds(new Set(cached));
      } catch { setUserRsvpedEventIds(new Set()); }
    }
    // Patch B — Hydrate saved events (right-swiped/liked) from localStorage
    try {
      const liked = JSON.parse(localStorage.getItem(`${userKey}_liked`) || '[]');
      setSavedEventIds(new Set(liked.map(e => e.id).filter(Boolean)));
    } catch { setSavedEventIds(new Set()); }
    // Patch B.2 — Hydrate passed events from localStorage
    try {
      const passed = JSON.parse(localStorage.getItem(`${userKey}_passed`) || '[]');
      setPassedEventIds(new Set(passed));
    } catch { setPassedEventIds(new Set()); }
  };

  const checkAuth = async () => {
    if (!supabaseClient) {
      console.log('checkAuth: No supabase client');
      setLoading(false);
      return;
    }

    try {
      // First check for Supabase auth session (Google OAuth)
      const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
      
      console.log('checkAuth: Session check', { session: !!session, error: sessionError });
      
      if (session?.user) {
        // User is logged in via Google OAuth
        const authUserId = session.user.id;
        const email = session.user.email;
        const googleName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || email?.split('@')[0];
        const avatarUrl = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture;
        
        console.log('checkAuth: Google user found', { authUserId, email, googleName });
        
        // Check if we have a profile linked to this auth user
        let { data: existingProfile, error: profileError } = await supabaseClient
          .from('users')
          .select('*')
          .eq('auth_id', authUserId)
          .maybeSingle();
        
        console.log('checkAuth: Profile by auth_id', { existingProfile, profileError });
        
        if (!existingProfile && email) {
          // Check by email as fallback
          const { data: profileByEmail, error: emailError } = await supabaseClient
            .from('users')
            .select('*')
            .eq('email', email)
            .maybeSingle();
          
          console.log('checkAuth: Profile by email', { profileByEmail, emailError });
          
          if (profileByEmail) {
            // Link existing profile to auth user
            await supabaseClient
              .from('users')
              .update({ auth_id: authUserId })
              .eq('id', profileByEmail.id);
            existingProfile = profileByEmail;
          }
        }
        
        if (existingProfile) {
          // Update profile picture from Google if not set
          if (!existingProfile.profile_picture && avatarUrl) {
            await supabaseClient
              .from('users')
              .update({ profile_picture: avatarUrl })
              .eq('id', existingProfile.id);
            existingProfile.profile_picture = avatarUrl;
          }
          
          console.log('checkAuth: Setting existing profile', existingProfile.id);
          setUserProfile(existingProfile);
          localStorage.setItem('crewq_user_id', existingProfile.id);
          
          // Check if admin
          if (existingProfile.email) {
            const adminCheck = await isAdminUser(existingProfile.email);
            setIsAdmin(adminCheck);
          }
          
          await loadEvents(existingProfile.id);
          await loadCrewMembers(existingProfile.id);
          await loadSquads(existingProfile.id);
          await loadAllSquads();
          await loadCheckedInEvents(existingProfile.id);
          await loadUserRsvps(existingProfile.id);
        } else {
          // New Google user - store their info and show onboarding
          console.log('checkAuth: New Google user, showing onboarding');
          setPendingGoogleUser({
            name: googleName,
            email: email,
            auth_id: authUserId,
            profile_picture: avatarUrl
          });
          await loadEvents(); // Load events so they're ready after onboarding
        }
        setLoading(false);
        return;
      }
      
      // Fallback to localStorage profile ID (guest users)
      const profileId = localStorage.getItem('crewq_user_id');
      console.log('checkAuth: Checking localStorage', { profileId });
      
      if (profileId) {
        const { data, error } = await supabaseClient
          .from('users')
          .select('*')
          .eq('id', profileId)
          .single();
        
        if (data && !error) {
          setUserProfile(data);
          
          // Check if admin
          if (data.email) {
            const adminCheck = await isAdminUser(data.email);
            setIsAdmin(adminCheck);
          }
          
          await loadEvents(data.id);
          await loadCrewMembers(data.id);
          await loadSquads(data.id);
          await loadAllSquads();
          await loadCheckedInEvents(data.id);
          await loadUserRsvps(data.id);
        } else {
          localStorage.removeItem('crewq_user_id');
        }
      }
    } catch (error) {
      console.error('checkAuth: Error', error);
    }
    setLoading(false);
  };

  // Handle Google OAuth sign in
  const handleGoogleAuth = async () => {
    if (!supabaseClient) {
      showToast('Database connection error. Please refresh the page.', 'error');
      return;
    }
    
    try {
      const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Google auth error:', error);
      showToast('Error signing in with Google. Please try again.', 'error');
    }
  };

  // Handle Google onboarding completion
  const handleGoogleOnboardingComplete = async (profileData) => {
    if (!supabaseClient) return;
    
    try {
      const { data: newUser, error } = await supabaseClient
        .from('users')
        .insert([{
          name: profileData.name,
          email: profileData.email,
          auth_id: profileData.auth_id,
          profile_picture: profileData.profile_picture,
          age: profileData.age,
          gender: profileData.gender,
          vibes: profileData.vibes,
          intents: profileData.intents,
          allow_squad_requests: true,
          show_age_to_squads: true
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      if (newUser) {
        setUserProfile(newUser);
        localStorage.setItem('crewq_user_id', newUser.id);
        setPendingGoogleUser(null);
        showToast('Welcome to CrewQ! 🎉', 'success');
        await loadCrewMembers(newUser.id);
        await loadSquads(newUser.id);
        await loadAllSquads();
      }
    } catch (error) {
      console.error('Error completing Google onboarding:', error);
      showToast('Error creating profile. Please try again.', 'error');
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    if (!supabaseClient) return;
    
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // User just signed in, refresh the page to load profile
        await checkAuth();
      } else if (event === 'SIGNED_OUT') {
        setUserProfile(null);
        localStorage.removeItem('crewq_user_id');
      }
    });
    
    return () => subscription?.unsubscribe();
  }, []);

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
      if (profile.gender) newUserData.gender = profile.gender;
      if (profile.phone) newUserData.phone = profile.phone;
      if (profile.vibes && profile.vibes.length > 0) newUserData.vibes = profile.vibes;
      if (profile.intents && profile.intents.length > 0) newUserData.intents = profile.intents;
      if (profile.bio) newUserData.bio = profile.bio;
      // Patch 4 — Relationship status (default prefer-not-to-say, private by default)
      if (profile.relationship_status) newUserData.relationship_status = profile.relationship_status;
      if (typeof profile.show_relationship_status === 'boolean') newUserData.show_relationship_status = profile.show_relationship_status;
      // Patch 6 — ToS acceptance
      if (profile.tos_accepted_at) newUserData.tos_accepted_at = profile.tos_accepted_at;
      if (profile.tos_version) newUserData.tos_version = profile.tos_version;

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
      await loadCheckedInEvents(newUser.id);
      await loadUserRsvps(newUser.id);
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
          bio_answers: updatedProfile.bio_answers,
          profile_picture: updatedProfile.profile_picture,
          profile_visibility: updatedProfile.profile_visibility || 'squad_only',
          // Patch 4 — Relationship status
          relationship_status: updatedProfile.relationship_status || 'prefer-not-to-say',
          show_relationship_status: typeof updatedProfile.show_relationship_status === 'boolean' ? updatedProfile.show_relationship_status : false
        })
        .eq('id', userProfile.id);

      if (error) throw error;
      setUserProfile(updatedProfile);
      showToast('Profile updated successfully!', 'success');
      
      // Refresh stats to check for profile complete badge
      await loadUserStats(userProfile.id);
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast('Error updating profile. Please try again.', 'error');
    }
  };

  const handleLogout = async () => {
    // Sign out from Supabase auth if signed in
    if (supabaseClient) {
      try {
        await supabaseClient.auth.signOut();
      } catch (error) {
        console.error('Error signing out:', error);
      }
    }
    
    localStorage.removeItem('crewq_user_id');
    setUserProfile(null);
    setCurrentTab('discover');
  };

  const loadEvents = async (userId = null) => {
    if (!supabaseClient) return;
    
    try {
      const { data, error } = await supabaseClient
        .from('events')
        .select('*')
        .order('date', { ascending: true });
      
      if (error) throw error;
      
      // Store all events for squads, map, etc.
      setAllEvents(data || []);
      
      // Filter for only live/approved events for the Discover feed
      let filteredEvents = (data || []).filter(event => 
        !event.status || event.status === 'live' || event.status === 'approved'
      );
      
      // Patch B.2 — Removed legacy "_seen" filter at fetch time.
      // The discover feed now applies a passed-events filter at render time via getVibeFilteredEvents.
      
      setEvents(filteredEvents);
      setCurrentIndex(0);
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
    if (!userProfile?.id) return;
    
    const userKey = `crewq_${userProfile.id}`;
    // Use the filtered displayEvents for proper indexing
    const vibeFilteredEvents = getVibeFilteredEvents();
    const currentEvent = vibeFilteredEvents[currentIndex];
    
    // Track this event as seen - user specific
    const seenEvents = JSON.parse(localStorage.getItem(`${userKey}_seen`) || '[]');
    const isNewSwipe = currentEvent && !seenEvents.includes(currentEvent.id);
    
    if (isNewSwipe && currentEvent) {
      seenEvents.push(currentEvent.id);
      localStorage.setItem(`${userKey}_seen`, JSON.stringify(seenEvents));
      
      // Only count UNIQUE swipes for badges
      const currentSwipes = parseInt(localStorage.getItem(`${userKey}_swipes`) || '0');
      localStorage.setItem(`${userKey}_swipes`, (currentSwipes + 1).toString());
      
      // INCREMENT VIEW COUNT in database (only for unique views)
      if (supabaseClient) {
        try {
          await supabaseClient.rpc('increment_event_views', { event_uuid: currentEvent.id });
        } catch (err) {
          // Fallback: direct update if RPC doesn't exist
          try {
            await supabaseClient
              .from('events')
              .update({ views: (currentEvent.views || 0) + 1 })
              .eq('id', currentEvent.id);
          } catch (e) {
            console.log('View tracking:', e.message);
          }
        }
      }
    }
    
    if (direction === 'right' && currentEvent) {
      const liked = JSON.parse(localStorage.getItem(`${userKey}_liked`) || '[]');
      // Prevent duplicates
      if (!liked.find(e => e.id === currentEvent.id)) {
        liked.push(currentEvent);
        localStorage.setItem(`${userKey}_liked`, JSON.stringify(liked));
        
        // Trigger refresh so Events tab updates
        setLikedEventsRefresh(prev => prev + 1);

        // Save to liked_events table (this is "interested", not RSVP)
        if (supabaseClient) {
          try {
            await supabaseClient
              .from('liked_events')
              .insert([{
                user_id: userProfile.id,
                event_id: currentEvent.id
              }]);
          } catch (error) {
            console.error('Error saving liked event:', error);
          }
        }
      }
    }
    // Always move to next card
    setCurrentIndex(prev => prev + 1);
    
    // Refresh stats to check for new badges
    if (userProfile?.id) {
      setTimeout(() => loadUserStats(userProfile.id), 100);
    }
  };

  // Patch B.2 — Fire-and-forget analytics logger. Writes to event_interactions table.
  // SQL migration required:
  //   CREATE TABLE event_interactions (id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  //     user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  //     event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  //     interaction_type text NOT NULL, view_duration_ms integer, metadata jsonb,
  //     created_at timestamptz DEFAULT now());
  // Fails silently if table is missing — UX is never blocked by analytics.
  const logInteraction = async (eventId, type, options = {}) => {
    if (!supabaseClient || !userProfile?.id || !eventId || !type) return;
    try {
      const row = {
        user_id: userProfile.id,
        event_id: eventId,
        interaction_type: type,
        view_duration_ms: options.viewDurationMs != null ? options.viewDurationMs : null,
        metadata: options.metadata || null,
      };
      await supabaseClient.from('event_interactions').insert([row]);
    } catch (err) {
      // Table may not exist yet — don't spam console
      if (err?.code !== 'PGRST205' && err?.code !== 'PGRST204') {
        console.warn('logInteraction failed:', err?.message);
      }
    }
  };

  // Patch B.2 — Card view callback. Logs view + duration. No more seen-blocking.
  // Increments view count on the event row (best-effort; falls back to direct update).
  const handleFeedCardViewed = async (event, durationMs) => {
    if (!userProfile?.id || !event?.id) return;
    // Log to analytics
    logInteraction(event.id, durationMs >= 5000 ? 'viewed_long' : 'viewed', { viewDurationMs: durationMs });
    // Increment event.views (legacy counter — keep for now for venue-facing display)
    if (supabaseClient) {
      try {
        await supabaseClient.rpc('increment_event_views', { event_uuid: event.id });
      } catch {
        try {
          await supabaseClient.from('events').update({ views: (event.views || 0) + 1 }).eq('id', event.id);
        } catch (e) { /* fail silent */ }
      }
    }
  };

  // Patch B — Save (bookmark) toggle. Backed by the existing _liked localStorage + liked_events table.
  const handleFeedCardSave = async (event) => {
    if (!userProfile?.id || !event?.id) return;
    const userKey = `crewq_${userProfile.id}`;
    const liked = JSON.parse(localStorage.getItem(`${userKey}_liked`) || '[]');
    const isCurrentlySaved = savedEventIds.has(event.id);
    
    if (isCurrentlySaved) {
      // Unsave
      const next = liked.filter(e => e.id !== event.id);
      localStorage.setItem(`${userKey}_liked`, JSON.stringify(next));
      setSavedEventIds(prev => { const s = new Set(prev); s.delete(event.id); return s; });
      if (supabaseClient) {
        try {
          await supabaseClient.from('liked_events').delete().eq('user_id', userProfile.id).eq('event_id', event.id);
        } catch (e) { /* fail silent */ }
      }
      logInteraction(event.id, 'unsaved');
      showToast('Removed from saved', 'info');
    } else {
      // Save
      if (!liked.find(e => e.id === event.id)) {
        liked.push(event);
        localStorage.setItem(`${userKey}_liked`, JSON.stringify(liked));
      }
      setSavedEventIds(prev => { const s = new Set(prev); s.add(event.id); return s; });
      setLikedEventsRefresh(prev => prev + 1);
      if (supabaseClient) {
        try {
          await supabaseClient.from('liked_events').insert([{ user_id: userProfile.id, event_id: event.id, created_at: new Date().toISOString() }]);
        } catch (e) { /* unique-constraint or table-missing, fail silent */ }
      }
      logInteraction(event.id, 'saved');
      showToast('💜 Saved to your list', 'success');
    }
  };

  // Patch B.2 — Pass = permanent dismissal (until event ends). 3-sec undo window.
  // Stored in localStorage `_passed`. Logged to event_interactions.
  const handleFeedCardPass = async (event) => {
    if (!userProfile?.id || !event?.id) return;
    
    const userKey = `crewq_${userProfile.id}`;
    const passed = JSON.parse(localStorage.getItem(`${userKey}_passed`) || '[]');
    if (!passed.includes(event.id)) {
      passed.push(event.id);
      localStorage.setItem(`${userKey}_passed`, JSON.stringify(passed));
    }
    setPassedEventIds(prev => { const s = new Set(prev); s.add(event.id); return s; });
    
    // Clear any pending undo (only one undo window at a time)
    if (recentPass?.timeoutId) clearTimeout(recentPass.timeoutId);
    
    // Set 3-sec undo window. After timeout: log pass to analytics + clear undo.
    const timeoutId = setTimeout(() => {
      logInteraction(event.id, 'passed');
      setRecentPass(null);
    }, 3000);
    
    setRecentPass({ event, timeoutId });
  };

  // Patch B.2 — Undo a recent pass (within 3-sec window). Removes from passed list.
  const handleUndoPass = () => {
    if (!recentPass?.event || !userProfile?.id) return;
    const event = recentPass.event;
    const userKey = `crewq_${userProfile.id}`;
    const passed = JSON.parse(localStorage.getItem(`${userKey}_passed`) || '[]');
    const next = passed.filter(id => id !== event.id);
    localStorage.setItem(`${userKey}_passed`, JSON.stringify(next));
    setPassedEventIds(prev => { const s = new Set(prev); s.delete(event.id); return s; });
    if (recentPass.timeoutId) clearTimeout(recentPass.timeoutId);
    setRecentPass(null);
    showToast('Pass undone — back in your feed', 'info');
  };

  // Patch B — Share opens the existing share modal pre-set to this event
  const handleFeedCardShare = (event) => {
    setSelectedEvent(event);
    setShowShareModal(true);
    // Patch B.2 — Log to analytics (share intent — actual share platform is unknown until they pick)
    logInteraction(event.id, 'shared');
  };

  // Handle RSVP - explicit user action (Patch 7: DB-backed via event_rsvps)
  const handleRSVP = async (event) => {
    if (!userProfile?.id || !supabaseClient) return;
    
    const userKey = `crewq_${userProfile.id}`;
    
    // Source of truth: in-memory Set (synced with event_rsvps table)
    if (userRsvpedEventIds.has(event.id)) {
      showToast('You\'ve already RSVPed to this event!', 'info');
      return;
    }
    
    try {
      // Insert into event_rsvps (source of truth) — let DB error propagate
      const { error: rsvpError } = await supabaseClient
        .from('event_rsvps')
        .insert([{
          user_id: userProfile.id,
          event_id: event.id,
          created_at: new Date().toISOString()
        }]);
      
      if (rsvpError) {
        // Unique-constraint violation = already RSVPed elsewhere; treat as soft-success
        if (rsvpError.code !== '23505') throw rsvpError;
      }
      
      // Increment RSVP count on event
      await supabaseClient
        .from('events')
        .update({ rsvps: (event.rsvps || 0) + 1 })
        .eq('id', event.id);
      
      // Update in-memory state
      setUserRsvpedEventIds(prev => {
        const next = new Set(prev);
        next.add(event.id);
        return next;
      });
      
      // Update localStorage cache
      const cached = JSON.parse(localStorage.getItem(`${userKey}_rsvped`) || '[]');
      if (!cached.includes(event.id)) {
        cached.push(event.id);
        localStorage.setItem(`${userKey}_rsvped`, JSON.stringify(cached));
      }
      
      showToast('🎉 RSVP confirmed! See you there!', 'success');
      
      // Patch B.2 — Log to analytics
      logInteraction(event.id, 'rsvped');
      
      // Patch C — Trigger post-RSVP follow-up (calendar export + bring-a-friend prompts in detail view)
      setPostRsvpEvent(event);
      
      // Update local events arrays
      setEvents(events.map(e => e.id === event.id ? {...e, rsvps: (e.rsvps || 0) + 1} : e));
      setAllEvents(allEvents.map(e => e.id === event.id ? {...e, rsvps: (e.rsvps || 0) + 1} : e));
      
    } catch (error) {
      console.error('RSVP error:', error);
      showToast('Failed to RSVP. Please try again.', 'error');
    }
  };

  // Undo RSVP - cancel attendance (Patch 7: DB-backed)
  const handleUndoRSVP = async (event) => {
    if (!userProfile?.id || !supabaseClient) return;
    
    const userKey = `crewq_${userProfile.id}`;
    
    if (!userRsvpedEventIds.has(event.id)) {
      return;
    }
    
    try {
      // Delete from event_rsvps (source of truth)
      const { error: deleteError } = await supabaseClient
        .from('event_rsvps')
        .delete()
        .eq('user_id', userProfile.id)
        .eq('event_id', event.id);
      
      if (deleteError) throw deleteError;
      
      // Decrement RSVP count
      const newCount = Math.max((event.rsvps || 1) - 1, 0);
      await supabaseClient
        .from('events')
        .update({ rsvps: newCount })
        .eq('id', event.id);
      
      // Update in-memory state
      setUserRsvpedEventIds(prev => {
        const next = new Set(prev);
        next.delete(event.id);
        return next;
      });
      
      // Update localStorage cache
      const cached = JSON.parse(localStorage.getItem(`${userKey}_rsvped`) || '[]');
      const updated = cached.filter(id => id !== event.id);
      localStorage.setItem(`${userKey}_rsvped`, JSON.stringify(updated));
      
      showToast('RSVP cancelled', 'info');
      
      // Patch B.2 — Log to analytics
      logInteraction(event.id, 'unrsvped');
      
      setEvents(events.map(e => e.id === event.id ? {...e, rsvps: newCount} : e));
      setAllEvents(allEvents.map(e => e.id === event.id ? {...e, rsvps: newCount} : e));
      
    } catch (error) {
      console.error('Undo RSVP error:', error);
      showToast('Failed to cancel RSVP. Please try again.', 'error');
    }
  };

  // Check if user has RSVPed (Patch 7: reads from in-memory Set, falls back to localStorage)
  const hasRSVPed = (eventId) => {
    if (!userProfile?.id) return false;
    if (userRsvpedEventIds.has(eventId)) return true;
    // Fallback to localStorage in case state hasn't loaded yet
    const userKey = `crewq_${userProfile.id}`;
    const cached = JSON.parse(localStorage.getItem(`${userKey}_rsvped`) || '[]');
    return cached.includes(eventId);
  };

  // Patch 3 — Helper: today's date as YYYY-MM-DD for daily-cap tracking
  // Patch B.2 — Removed getTodayKey, getTodaysSwipeCount, incrementTodaysSwipeCount.
  // Daily cap is gone; swipe counter is replaced by event_interactions analytics.

  // Patch 3 — Apply hard filters to an event list (date, distance, age, status)
  const applyHardFilters = (eventList, opts = {}) => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const horizonDays = opts.maxDaysAhead != null ? opts.maxDaysAhead : FEED_DAYS_AHEAD;
    const horizon = new Date(todayStart);
    horizon.setDate(horizon.getDate() + horizonDays);

    const userAge = userProfile?.age ? parseInt(userProfile.age, 10) : null;

    return eventList.filter(event => {
      // Status: only live/approved
      if (event.status && event.status !== 'live' && event.status !== 'approved') return false;

      // Date: not past, within horizon
      if (!event.date) return false;
      const evtDate = new Date(event.date);
      if (isNaN(evtDate.getTime())) return false;
      if (evtDate < todayStart) return false;
      if (opts.minDaysAhead != null) {
        const minDate = new Date(todayStart);
        minDate.setDate(minDate.getDate() + opts.minDaysAhead);
        if (evtDate < minDate) return false;
      }
      if (evtDate > horizon) return false;

      // Distance (only if userLocation + event lat/lng available)
      if (userLocation && event.latitude != null && event.longitude != null) {
        const dist = calculateDistance(userLocation.latitude, userLocation.longitude, event.latitude, event.longitude);
        const maxDist = opts.maxMiles != null ? opts.maxMiles : DEFAULT_FEED_DISTANCE_MILES;
        if (dist > maxDist) return false;
      }

      // Age-appropriate
      if (userAge != null) {
        const tag = event.age_tag || '';
        const restriction = event.age_restriction || '';
        if ((tag === '21+' || restriction === '21+') && userAge < 21) return false;
        if ((tag === '18+' || restriction === '18+') && userAge < 18) return false;
      }

      return true;
    });
  };

  // Patch 3 — Soft ranking by vibe match score (returns score 0..N)
  // Patch A.2 — Read from event.tags (schema column name), with event.vibes fallback for legacy in-memory data
  const getVibeMatchScore = (event) => {
    if (!userProfile?.vibes) return 0;
    const eventVibes = Array.isArray(event.tags) ? event.tags : (Array.isArray(event.vibes) ? event.vibes : []);
    const userVibes = Array.isArray(userProfile.vibes) ? userProfile.vibes : [];
    if (eventVibes.length === 0) return 0;
    return eventVibes.filter(v => userVibes.includes(v)).length;
  };

  // Apply vibe filter + hard filters to events for discover feed (Patch 3 — full visibility logic)
  // Patch B — Adds search, category filter, solo filter, and seen-event exclusion
  const getVibeFilteredEvents = () => {
    let filtered = events;

    // Hard filters: status, date window, distance, age
    filtered = applyHardFilters(filtered);

    // Patch B.2 — Filter out events the user explicitly passed on (X button).
    // No more "_seen" filter — every other event stays in the feed across sessions.
    if (passedEventIds.size > 0) {
      filtered = filtered.filter(e => !passedEventIds.has(e.id));
    }

    // Patch B — Free-text search
    if (discoverSearchQuery && discoverSearchQuery.trim()) {
      filtered = filtered.filter(e => matchesSearch(e, discoverSearchQuery));
    }

    // Patch B — Category filter chip
    if (discoverCategoryFilter && discoverCategoryFilter !== 'all') {
      filtered = filtered.filter(e => {
        const cat = (e.category || '').toLowerCase();
        const target = discoverCategoryFilter.toLowerCase();
        if (cat === target) return true;
        // Tag-based fuzzy match (e.g., category 'trivia' should also match events tagged 'trivia')
        const tags = Array.isArray(e.tags) ? e.tags : [];
        return tags.map(t => String(t).toLowerCase()).includes(target);
      });
    }

    // Patch B — Solo mode filter (opt-in)
    if (soloModeEnabled) {
      filtered = filtered.filter(e => resolveSoloFriendly(e) !== false);
    }

    // Optional vibe hard-filter (when toggle on AND user has vibes set)
    if (vibeFilterEnabled && userProfile?.vibes && userProfile.vibes.length > 0) {
      filtered = filtered.filter(event => {
        // Patch A.2 — Read from event.tags first (actual schema column); fall back to event.vibes for legacy in-memory data
        const eventVibes = event.tags || event.vibes || [];
        const eventCategory = event.category || '';
        if (Array.isArray(eventVibes) && eventVibes.some(v => userProfile.vibes.includes(v))) return true;
        const categoryVibeMap = {
          'live-music': ['live-music', 'concerts'], 'trivia': ['trivia', 'games'],
          'happy-hour': ['happy-hour', 'chill-drinks'], 'sports': ['sports-bars'],
          'karaoke': ['karaoke'], 'dancing': ['dancing'], 'comedy': ['comedy'],
          'networking': ['networking'], 'brunch': ['foodie'], 'food': ['foodie', 'tacos'],
          'rooftop': ['rooftop', 'sunsets'], 'outdoor': ['outdoor']
        };
        const matchedVibes = categoryVibeMap[eventCategory] || [eventCategory];
        return matchedVibes.some(v => userProfile.vibes.includes(v));
      });
    }

    // Tonight mode filter (existing behavior)
    if (tonightMode) {
      filtered = getTonightEvents(filtered);
    }

    // Soft ranking: sort by vibe match desc, then by date asc (soonest-first)
    filtered = [...filtered].sort((a, b) => {
      const scoreDiff = getVibeMatchScore(b) - getVibeMatchScore(a);
      if (scoreDiff !== 0) return scoreDiff;
      return (a.date || '').localeCompare(b.date || '');
    });

    // Patch B.2 — No more daily cap. Show every event that passes all filters.
    // Engagement is now the constraint (passed/RSVP'd events drop out), not an arbitrary count.
    return filtered;
  };

  // Patch 3 + Patch A — Coming Up lane: all events 7–30 days out.
  // Special events (tickets_url or is_special) bubble to the top.
  const getComingUpEvents = () => {
    const baseList = applyHardFilters(allEvents, {
      minDaysAhead: COMING_UP_DAYS_MIN,
      maxDaysAhead: COMING_UP_DAYS_MAX,
      maxMiles: DEFAULT_FEED_DISTANCE_MILES * 2 // a bit wider for special events
    });
    return baseList
      .sort((a, b) => {
        // Special events first
        const aSpecial = (a.tickets_url || a.is_special) ? 1 : 0;
        const bSpecial = (b.tickets_url || b.is_special) ? 1 : 0;
        if (aSpecial !== bSpecial) return bSpecial - aSpecial;
        // Then by date ascending
        return (a.date || '').localeCompare(b.date || '');
      })
      .slice(0, 12);
  };

  // Get events happening tonight (within 6 hours or starting soon)
  const getTonightEvents = (eventList = allEvents) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);
    
    return eventList.filter(event => {
      if (!event.date) return false;
      
      // Check if event is today
      if (event.date !== today) return false;
      
      // Parse event time
      if (event.time) {
        const [hours, minutes] = event.time.split(':').map(Number);
        const eventTime = new Date(now);
        eventTime.setHours(hours || 18, minutes || 0, 0, 0);
        
        // Show events that have started (up to 2 hours ago) or starting within 6 hours
        const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
        return eventTime >= twoHoursAgo && eventTime <= sixHoursFromNow;
      }
      
      return true; // Include events without time if they're today
    });
  };

  // Calculate vibe match percentage
  const getVibeMatch = (event) => {
    if (!userProfile?.vibes || userProfile.vibes.length === 0) return null;
    
    const eventVibes = event.vibes || event.tags || [];
    const eventCategory = event.category || '';
    
    // Get all vibes associated with this event
    const allEventVibes = [...eventVibes];
    
    const categoryVibeMap = {
      'live-music': ['live-music', 'concerts'],
      'trivia': ['trivia', 'games'],
      'happy-hour': ['happy-hour', 'chill-drinks'],
      'sports': ['sports-bars'],
      'karaoke': ['karaoke'],
      'dancing': ['dancing'],
      'comedy': ['comedy'],
      'networking': ['networking'],
      'brunch': ['foodie'],
      'food': ['foodie', 'tacos'],
      'rooftop': ['rooftop', 'sunsets'],
      'outdoor': ['outdoor']
    };
    
    if (categoryVibeMap[eventCategory]) {
      allEventVibes.push(...categoryVibeMap[eventCategory]);
    }
    
    if (allEventVibes.length === 0) return null;
    
    const matches = userProfile.vibes.filter(v => allEventVibes.includes(v)).length;
    return Math.round((matches / Math.min(userProfile.vibes.length, 3)) * 100);
  };

  // Check if event is trending (top 10% by engagement with capacity left)
  const isTrending = (event) => {
    if (!allEvents.length) return false;
    
    const engagement = (event.rsvps || 0) + (event.views || 0) * 0.1;
    const sortedByEngagement = [...allEvents].sort((a, b) => {
      const engA = (a.rsvps || 0) + (a.views || 0) * 0.1;
      const engB = (b.rsvps || 0) + (b.views || 0) * 0.1;
      return engB - engA;
    });
    
    const top10Percent = Math.ceil(sortedByEngagement.length * 0.1);
    const trendingIds = sortedByEngagement.slice(0, top10Percent).map(e => e.id);
    
    return trendingIds.includes(event.id) && (!event.capacity || (event.rsvps || 0) < event.capacity);
  };

  // Get countdown for event starting soon
  const getCountdown = (event) => {
    if (!event.date || !event.time) return null;
    
    const now = new Date();
    const [hours, minutes] = event.time.split(':').map(Number);
    const eventDateTime = new Date(event.date);
    eventDateTime.setHours(hours || 18, minutes || 0, 0, 0);
    
    const diff = eventDateTime.getTime() - now.getTime();
    
    if (diff < 0 || diff > 3 * 60 * 60 * 1000) return null; // Only show if within 3 hours
    
    const hoursLeft = Math.floor(diff / (60 * 60 * 1000));
    const minsLeft = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
    
    if (hoursLeft > 0) {
      return `Starts in ${hoursLeft}h ${minsLeft}m`;
    }
    return `Starts in ${minsLeft} min`;
  };

  // Load RSVP users for social proof
  const loadEventRsvpUsers = async (eventId) => {
    if (!supabaseClient || eventRsvpUsers[eventId]) return;
    
    try {
      const { data } = await supabaseClient
        .from('event_rsvps')
        .select('user_id, users(id, name, profile_picture, profile_visibility)')
        .eq('event_id', eventId)
        .limit(10);
      
      if (data) {
        const users = data
          .map(r => r.users)
          .filter(u => u && u.profile_visibility === 'public');
        setEventRsvpUsers(prev => ({ ...prev, [eventId]: users }));
      }
    } catch (err) {
      console.error('Error loading RSVP users:', err);
    }
  };

  // Track streak on app open
  useEffect(() => {
    if (userProfile?.id) {
      trackDailyStreak();
      loadUserStreaks();
    }
  }, [userProfile?.id]);

  const trackDailyStreak = () => {
    if (!userProfile?.id) return;
    
    const userKey = `crewq_${userProfile.id}`;
    const today = new Date().toISOString().split('T')[0];
    const lastOpen = localStorage.getItem(`${userKey}_last_open`);
    const currentStreak = parseInt(localStorage.getItem(`${userKey}_daily_streak`) || '0');
    
    if (lastOpen === today) return; // Already tracked today
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    let newStreak = 1;
    if (lastOpen === yesterdayStr) {
      newStreak = currentStreak + 1;
    }
    
    localStorage.setItem(`${userKey}_last_open`, today);
    localStorage.setItem(`${userKey}_daily_streak`, newStreak.toString());
    
    setUserStreaks(prev => ({ ...prev, daily: newStreak }));
  };

  const loadUserStreaks = () => {
    if (!userProfile?.id) return;
    
    const userKey = `crewq_${userProfile.id}`;
    const daily = parseInt(localStorage.getItem(`${userKey}_daily_streak`) || '0');
    const weekendStreak = parseInt(localStorage.getItem(`${userKey}_weekend_streak`) || '0');
    
    // Count monthly stats
    const thisMonth = new Date().toISOString().slice(0, 7);
    const monthlyVenues = JSON.parse(localStorage.getItem(`${userKey}_venues_${thisMonth}`) || '[]').length;
    const monthlyCheckIns = parseInt(localStorage.getItem(`${userKey}_checkins_${thisMonth}`) || '0');
    
    setUserStreaks({
      daily,
      weeklyCheckIn: weekendStreak,
      monthlyVenues,
      monthlyCheckIns
    });
  };
  
  const displayEvents = getVibeFilteredEvents();

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Show Google onboarding for new Google users
  if (pendingGoogleUser) {
    return (
      <GoogleOnboardingModal 
        pendingUser={pendingGoogleUser} 
        onComplete={handleGoogleOnboardingComplete} 
      />
    );
  }

  if (!userProfile) {
    return (
      <>
        <AuthScreen onAuth={handleAuth} onGoogleAuth={handleGoogleAuth} onOpenBusinessPortal={() => setShowBusinessPortal(true)} />
        {showBusinessPortal && (
          <BusinessPortal
            onClose={() => setShowBusinessPortal(false)}
            darkMode={true}
            supabaseClient={supabaseClient}
            DALLAS_NEIGHBORHOODS={DALLAS_NEIGHBORHOODS}
          />
        )}
      </>
    );
  }

  const currentEvent = displayEvents[currentIndex];

  // Theme-aware accent color
  const accentColor = darkMode ? 'violet' : 'orange';
  const accentGradient = darkMode ? 'from-violet-500 to-purple-600' : 'from-orange-400 to-yellow-500';

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-black text-white' : 'bg-amber-50 text-zinc-900'}`}>
      {/* Patch B.1 + Patch C + Patch C2a — Global CSS for snap + scrollbar hide */}
      <style>{`
        /* Cross-browser scrollbar hide */
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

        /* Discover feed: TikTok/Reels mandatory snap, every device.
           Scroll container has an explicit JS-set height (--feed-scroll-height) so iOS Safari
           reliably engages snap. Cards fill that container exactly. */
        .discover-feed-snap {
          scroll-snap-type: y mandatory;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-y: contain;
        }
        .discover-feed-card {
          scroll-snap-align: start;
          scroll-snap-stop: always;
          /* height set via inline style to match scroll container exactly */
        }
      `}</style>
      <div className={`w-full max-w-md mx-auto ${darkMode ? 'bg-black' : 'bg-amber-50'} min-h-screen relative flex flex-col`}>
        {/* Patch C — Top utility bar: sticky, minimal. CrewQ + Beta + Filters + Bell + Settings */}
        {/* Patch C2a fix — fully opaque so feed images don't appear to bleed through */}
        <div ref={topBarRef} className={`sticky top-0 z-40 ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-amber-100 border-amber-200'} border-b px-4 py-3`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">
                Crew<span className={darkMode ? 'text-violet-400' : 'text-orange-500'}>Q</span>
              </h1>
              {/* Patch 6 — Beta pill */}
              <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${darkMode ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40' : 'bg-orange-500/20 text-orange-700 border border-orange-500/40'}`}>
                Beta
              </span>
            </div>
            <div className="flex items-center gap-3">
              {/* Patch C — Filters button (Discover only). Opens modal with search/categories/Tonight/Vibes/Solo */}
              {currentTab === 'discover' && (
                <button
                  onClick={() => setShowDiscoverFilters(true)}
                  className="relative"
                  aria-label="Filters"
                >
                  <Filter className={`w-6 h-6 ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`} />
                  {/* Active-filter dot */}
                  {(discoverSearchQuery || discoverCategoryFilter !== 'all' || soloModeEnabled || vibeFilterEnabled || tonightMode) && (
                    <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${darkMode ? 'bg-violet-500' : 'bg-orange-500'} border-2 ${darkMode ? 'border-zinc-900' : 'border-amber-100'}`} />
                  )}
                </button>
              )}
              <button 
                onClick={() => setShowNotifications(true)}
                className="relative"
              >
                <Bell className={`w-6 h-6 ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`} />
                {(notifications.length + pendingJoinRequests.length) > 0 && (
                  <span className={`absolute -top-1 -right-1 ${darkMode ? 'bg-violet-500' : 'bg-orange-500'} text-white text-xs w-5 h-5 rounded-full flex items-center justify-center`}>
                    {notifications.length + pendingJoinRequests.length}
                  </span>
                )}
              </button>
              <button onClick={() => setShowSettings(true)}>
                <Settings className={`w-6 h-6 ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Patch C — Context bar: Crew/Solo toggle + city. Hidden on Discover (full-viewport TikTok feed). */}
        {currentTab !== 'discover' && (
          <div className={`${darkMode ? 'bg-zinc-900/95 backdrop-blur-sm border-zinc-800' : 'bg-amber-100 border-amber-200'} border-b px-4 py-3`}>
            <div className="flex flex-col items-center gap-3">
              <div className={`flex gap-2 rounded-full p-1.5 transition-all duration-300 ${
                mode === 'crew' 
                  ? (darkMode ? 'bg-zinc-800' : 'bg-amber-200') 
                  : (darkMode ? 'bg-violet-500' : 'bg-orange-500')
              }`}>
                <button
                  onClick={() => setMode('crew')}
                  className={`px-8 py-2.5 rounded-full text-base font-bold transition-all duration-300 ${
                    mode === 'crew' 
                      ? (darkMode ? 'bg-violet-500 text-white' : 'bg-orange-500 text-white')
                      : (darkMode ? 'bg-transparent text-zinc-900' : 'bg-transparent text-white')
                  }`}
                >
                  Crew
                </button>
                <button
                  onClick={() => setMode('solo')}
                  className={`px-8 py-2.5 rounded-full text-base font-bold transition-all duration-300 ${
                    mode === 'solo' 
                      ? (darkMode ? 'bg-zinc-900 text-white' : 'bg-amber-50 text-zinc-900')
                      : 'bg-transparent text-white'
                  }`}
                >
                  Solo
                </button>
              </div>
              <div className={`flex items-center justify-center ${darkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>
                <span className="text-sm">{DISPLAY_CITY}</span>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Content Area */}
        <div
          className={`overflow-y-auto overflow-x-hidden -webkit-overflow-scrolling-touch ${currentTab === 'discover' ? 'discover-feed-snap scrollbar-hide' : 'flex-1 pb-20 sm:pb-24'}`}
          style={currentTab === 'discover' && feedScrollHeight ? { height: `${feedScrollHeight}px` } : undefined}
        >
          {currentTab === 'discover' && (() => {
            const feedEvents = getVibeFilteredEvents();
            const totalAvailable = applyHardFilters(events).length;
            const hasActiveFilters = discoverSearchQuery || discoverCategoryFilter !== 'all' || soloModeEnabled || vibeFilterEnabled || tonightMode;

            // Patch C — Empty states render as a single non-snapping screen
            if (feedEvents.length === 0) {
              return (
                <div className="px-6 py-12 text-center max-w-md mx-auto">
                  <div className={`w-20 h-20 ${darkMode ? 'bg-zinc-800' : 'bg-amber-100'} rounded-full flex items-center justify-center mx-auto mb-6`}>
                    <Calendar className={`w-10 h-10 ${darkMode ? 'text-violet-400' : 'text-orange-500'}`} />
                  </div>
                  {hasActiveFilters ? (
                    <>
                      <h2 className="text-xl font-bold mb-2">No matches</h2>
                      <p className={`${darkMode ? 'text-zinc-400' : 'text-zinc-600'} mb-6 text-sm`}>
                        Try clearing some filters to see more events.
                      </p>
                      <button
                        onClick={() => {
                          setDiscoverSearchQuery('');
                          setDiscoverCategoryFilter('all');
                          setSoloModeEnabled(false);
                          setVibeFilterEnabled(false);
                          setTonightMode(false);
                        }}
                        className={`px-6 py-3 rounded-xl font-semibold ${darkMode ? 'bg-violet-500 text-white' : 'bg-orange-500 text-white'} hover:shadow-lg transition`}
                      >
                        Clear all filters
                      </button>
                    </>
                  ) : totalAvailable === 0 ? (
                    <>
                      <h2 className="text-xl font-bold mb-2">No events yet</h2>
                      <p className={`${darkMode ? 'text-zinc-400' : 'text-zinc-600'} mb-6 text-sm`}>
                        Check back soon — new events get added regularly.
                      </p>
                      <button
                        onClick={() => setShowSuggestionModal(true)}
                        className={`${darkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-amber-100 hover:bg-amber-200 text-zinc-900'} px-6 py-3 rounded-xl font-semibold transition`}
                      >
                        Suggest an Event
                      </button>
                    </>
                  ) : (
                    <>
                      <h2 className="text-xl font-bold mb-2">You've engaged with everything</h2>
                      <p className={`${darkMode ? 'text-zinc-400' : 'text-zinc-600'} mb-6 text-sm`}>
                        You've RSVP'd to or passed on every event in the next 7 days. Bring back passed events below, or check the Events tab for what's coming up later.
                      </p>
                      <div className="flex flex-col gap-3 max-w-xs mx-auto">
                        <button
                          onClick={() => {
                            if (userProfile?.id) {
                              const userKey = `crewq_${userProfile.id}`;
                              localStorage.removeItem(`${userKey}_passed`);
                              setPassedEventIds(new Set());
                              loadEvents(userProfile.id);
                              showToast('Passed events restored 🎉', 'success');
                            }
                          }}
                          className={`bg-gradient-to-r ${darkMode ? 'from-violet-500 to-purple-600' : 'from-orange-500 to-amber-500'} text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition`}
                        >
                          Bring back passed events
                        </button>
                        <button
                          onClick={() => setCurrentTab('events')}
                          className={`${darkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-amber-100 hover:bg-amber-200 text-zinc-900'} px-6 py-3 rounded-xl font-semibold transition`}
                        >
                          See what's coming up →
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            }

            // Patch C — Active feed: full-viewport TikTok-style cards
            return (
              <>
                {/* Pass-undo floating bar — overlays bottom of viewport (above nav) */}
                {recentPass && (
                  <div className="fixed bottom-20 sm:bottom-24 left-3 right-3 z-30 max-w-md mx-auto">
                    <div className={`p-3 rounded-xl flex items-center justify-between gap-3 shadow-2xl ${darkMode ? 'bg-zinc-900 border border-zinc-700' : 'bg-white border border-amber-300'}`}>
                      <span className={`text-sm ${darkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                        <span className="font-semibold">Passed</span> on "{recentPass.event?.name}"
                      </span>
                      <button
                        onClick={handleUndoPass}
                        className={`text-sm font-bold underline ${darkMode ? 'text-violet-400 hover:text-violet-300' : 'text-orange-600 hover:text-orange-700'}`}
                      >
                        Undo
                      </button>
                    </div>
                  </div>
                )}

                {/* Vertical-scroll feed — snap behavior on parent .discover-feed-snap */}
                {feedEvents.map(event => (
                  <EventFeedCard
                    key={event.id}
                    event={event}
                    isSaved={savedEventIds.has(event.id)}
                    vibeMatch={getVibeMatchScore(event)}
                    goingCount={(event.rsvps || 0) + (event.checkins || 0)}
                    darkMode={darkMode}
                    cardHeight={feedScrollHeight}
                    onCardTap={(ev) => { handleEventClick(ev); }}
                    onSave={handleFeedCardSave}
                    onPass={handleFeedCardPass}
                    onView={handleFeedCardViewed}
                  />
                ))}

                {/* End-of-feed footer — also a snapping card so it doesn't feel abrupt */}
                <div
                  className="discover-feed-card flex flex-col items-center justify-center text-center px-6"
                  style={feedScrollHeight ? { height: `${feedScrollHeight}px` } : { height: '100vh' }}
                >
                  <div className={`w-16 h-16 ${darkMode ? 'bg-zinc-800' : 'bg-amber-100'} rounded-full flex items-center justify-center mb-4`}>
                    <Sparkles className={`w-8 h-8 ${darkMode ? 'text-violet-400' : 'text-orange-500'}`} />
                  </div>
                  <p className={`text-lg font-semibold mb-1 ${darkMode ? 'text-white' : 'text-zinc-900'}`}>
                    That's everything for now
                  </p>
                  <p className={`text-sm mb-6 ${darkMode ? 'text-zinc-500' : 'text-zinc-600'}`}>
                    Check the Events tab for what's coming up later.
                  </p>
                  <button
                    onClick={() => setCurrentTab('events')}
                    className={`px-6 py-3 rounded-xl font-semibold ${darkMode ? 'bg-violet-500 text-white' : 'bg-orange-500 text-white'} hover:shadow-lg transition`}
                  >
                    See what's coming up →
                  </button>
                </div>
              </>
            );
          })()}

          {currentTab === 'search' && <AIChat userProfile={userProfile} />}
          {currentTab === 'events' && (
            <EventsTab 
              events={allEvents}
              likedEvents={likedEvents} 
              onEventClick={handleEventClick} 
              onUnlikeEvent={handleUnlikeEvent}
              userLocation={userLocation}
              onRequestLocation={requestUserLocation}
              onRSVP={handleRSVP}
              onUndoRSVP={handleUndoRSVP}
              hasRSVPed={hasRSVPed}
            />
          )}
          {currentTab === 'crew' && mode === 'crew' && (
            <CrewTab 
              squads={squads} 
              onCreateSquad={() => setShowCreateSquad(true)}
              onSquadClick={(squad) => {
                setSelectedSquad(squad);
                setShowSquadDetail(true);
              }}
            />
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
          {currentTab === 'awards' && (
            <AwardsTab 
              userProfile={userProfile}
              userBadges={userBadges}
              userStats={userStats}
              onOpenLeaderboard={() => setShowLeaderboard(true)}
            />
          )}
          {currentTab === 'profile' && (
            <ProfileTab 
              userProfile={userProfile} 
              onLogout={handleLogout}
              onUpdateProfile={handleUpdateProfile}
              userBadges={userBadges}
              attendedEvents={attendedEvents}
              onEventClick={handleEventClick}
              onNavigate={setCurrentTab}
            />
          )}
        </div>

        {/* Fixed Bottom Navigation */}
        {/* Patch C2a fix — fully opaque (no /95 transparency or backdrop blur) so feed images don't appear to bleed through it */}
        <div ref={bottomNavRef} className={`fixed bottom-0 left-0 right-0 z-50 ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-amber-200'} border-t px-4 py-2 pb-safe`}>
          <div className="flex justify-around items-center max-w-md mx-auto">
            {[
              { id: 'discover', icon: Home, label: 'Discover' },
              { id: 'events', icon: Calendar, label: 'Events' },
              { id: 'awards', icon: Trophy, label: 'Awards' },
              { id: 'crew', icon: Users, label: 'Crew' },
              { id: 'profile', icon: User, label: 'Profile' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className="flex flex-col items-center gap-0.5 py-1 px-2"
              >
                <tab.icon className={`w-5 h-5 ${currentTab === tab.id ? (darkMode ? 'text-violet-400' : 'text-orange-500') : (darkMode ? 'text-zinc-500' : 'text-zinc-400')}`} />
                <span className={`text-[10px] ${currentTab === tab.id ? (darkMode ? 'text-violet-400' : 'text-orange-500') : (darkMode ? 'text-zinc-500' : 'text-zinc-400')}`}>
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
            onClose={() => {
              setShowEventDetail(false);
              setSelectedEventHistoricalCount(0);
              setPostRsvpEvent(null);
            }}
            onCheckIn={handleCheckIn}
            isCheckedIn={checkedInEvents.includes(selectedEvent.id)}
            checkInCount={0}
            userProfile={userProfile}
            historicalCount={selectedEventHistoricalCount}
            onRSVP={handleRSVP}
            onUndoRSVP={handleUndoRSVP}
            hasRSVPed={hasRSVPed}
            showPostRsvp={postRsvpEvent?.id === selectedEvent.id}
            onClearPostRsvp={() => setPostRsvpEvent(null)}
          />
        )}

        {showCreateSquad && (
          <CreateSquadModal
            onClose={() => setShowCreateSquad(false)}
            onCreate={handleCreateSquad}
            userProfile={userProfile}
            events={allEvents}
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
            isMember={selectedSquad.members?.some(m => m.id === userProfile.id) || squads.some(s => s.id === selectedSquad.id)}
            onEventClick={(event) => {
              setShowSquadDetail(false);
              handleEventClick(event);
            }}
            onEdit={handleEditSquad}
            onDelete={handleDeleteSquad}
            onMute={handleMuteSquad}
            onOpenChat={(squad) => {
              setShowSquadDetail(false);
              setShowSquadChat(squad);
            }}
          />
        )}

        {showEditSquad && (
          <EditSquadModal
            squad={showEditSquad}
            onClose={() => setShowEditSquad(null)}
            onSave={handleSaveSquadEdit}
          />
        )}

        {showSuggestionModal && (
          <EventSuggestionModal
            onClose={() => setShowSuggestionModal(false)}
            userProfile={userProfile}
            supabaseClient={supabaseClient}
            userBadges={userBadges}
            showToast={showToast}
          />
        )}

        {/* Patch C — Discover Filters Modal: search, category, Tonight/Vibes/Solo all in one place */}
        {showDiscoverFilters && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
            <div className={`${darkMode ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'} rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[90vh] flex flex-col`}>
              <div className={`flex items-center justify-between p-5 border-b ${darkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
                <h2 className="text-xl font-bold">Filter feed</h2>
                <button onClick={() => setShowDiscoverFilters(false)} className={darkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'}>
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="overflow-y-auto p-5 space-y-5">
                {/* Search */}
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wide mb-2 ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Search</label>
                  <div className="relative">
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`} />
                    <input
                      type="text"
                      value={discoverSearchQuery}
                      onChange={(e) => setDiscoverSearchQuery(e.target.value)}
                      placeholder="Events, venues, vibes…"
                      className={`w-full pl-10 pr-10 py-3 rounded-xl text-sm outline-none ${darkMode ? 'bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 focus:border-violet-500' : 'bg-amber-50 border border-amber-200 text-zinc-900 placeholder:text-zinc-400 focus:border-orange-500'}`}
                    />
                    {discoverSearchQuery && (
                      <button onClick={() => setDiscoverSearchQuery('')} className={`absolute right-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wide mb-2 ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Category</label>
                  <div className="flex flex-wrap gap-2">
                    {BROWSE_CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setDiscoverCategoryFilter(cat.id)}
                        className={`px-3 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${
                          discoverCategoryFilter === cat.id
                            ? (darkMode ? 'bg-violet-500 text-white' : 'bg-orange-500 text-white')
                            : (darkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-amber-50 text-zinc-700 hover:bg-amber-100 border border-amber-200')
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mood toggles */}
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wide mb-2 ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Mood</label>
                  <div className="space-y-2">
                    <button
                      onClick={() => setTonightMode(!tonightMode)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition ${tonightMode ? 'bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/40' : (darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-amber-50 border-amber-200')}`}
                    >
                      <span className="text-sm font-semibold">🌙 Tonight only</span>
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs ${tonightMode ? 'bg-red-500' : (darkMode ? 'bg-zinc-700' : 'bg-amber-200')}`}>
                        {tonightMode && '✓'}
                      </span>
                    </button>
                    <button
                      onClick={() => setVibeFilterEnabled(!vibeFilterEnabled)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition ${vibeFilterEnabled ? (darkMode ? 'bg-violet-500/10 border-violet-500/40' : 'bg-orange-500/10 border-orange-500/40') : (darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-amber-50 border-amber-200')}`}
                    >
                      <span className="text-sm font-semibold">✨ My Vibes only</span>
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs ${vibeFilterEnabled ? (darkMode ? 'bg-violet-500' : 'bg-orange-500') : (darkMode ? 'bg-zinc-700' : 'bg-amber-200')}`}>
                        {vibeFilterEnabled && '✓'}
                      </span>
                    </button>
                    <button
                      onClick={() => setSoloModeEnabled(!soloModeEnabled)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition ${soloModeEnabled ? 'bg-emerald-500/10 border-emerald-500/40' : (darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-amber-50 border-amber-200')}`}
                    >
                      <span className="text-sm font-semibold">🎒 Solo-friendly</span>
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs ${soloModeEnabled ? 'bg-emerald-500' : (darkMode ? 'bg-zinc-700' : 'bg-amber-200')}`}>
                        {soloModeEnabled && '✓'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <div className={`p-4 border-t ${darkMode ? 'border-zinc-800' : 'border-zinc-200'} flex gap-2`}>
                <button
                  onClick={() => {
                    setDiscoverSearchQuery('');
                    setDiscoverCategoryFilter('all');
                    setSoloModeEnabled(false);
                    setVibeFilterEnabled(false);
                    setTonightMode(false);
                  }}
                  className={`flex-1 py-3 rounded-xl font-semibold ${darkMode ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-amber-100 text-zinc-900 hover:bg-amber-200'} transition`}
                >
                  Clear all
                </button>
                <button
                  onClick={() => setShowDiscoverFilters(false)}
                  className={`flex-1 py-3 rounded-xl font-semibold text-white ${darkMode ? 'bg-violet-500 hover:bg-violet-600' : 'bg-orange-500 hover:bg-orange-600'} transition`}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Badge Earned Popup */}
        {showBadgeEarned && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60] p-4">
            <div className="bg-zinc-900 rounded-3xl max-w-sm w-full p-8 text-center animate-bounce-in">
              <div className="text-6xl mb-4 animate-pulse">{showBadgeEarned.icon}</div>
              
              <div className="text-yellow-400 font-bold text-sm uppercase tracking-wider mb-2">
                🎉 Badge Earned! 🎉
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2">{showBadgeEarned.name}</h2>
              <p className="text-zinc-400 mb-4">{showBadgeEarned.description}</p>
              
              <div className="flex items-center justify-center gap-2 mb-6">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="text-yellow-500 font-bold text-lg">+{showBadgeEarned.points} points</span>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowBadgeEarned(null);
                    setCurrentTab('awards');
                  }}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg transition"
                >
                  <Award className="w-5 h-5" />
                  View All Awards
                </button>
                
                <button
                  onClick={async () => {
                    const shareText = `🏆 I just earned the "${showBadgeEarned.name}" badge on CrewQ!\n\n${showBadgeEarned.icon} ${showBadgeEarned.description}\n\nJoin me in exploring Dallas nightlife!`;
                    try {
                      if (navigator.share) {
                        await navigator.share({
                          title: `I earned ${showBadgeEarned.name}!`,
                          text: shareText,
                          url: 'https://crewq-app.vercel.app'
                        });
                      } else {
                        await navigator.clipboard.writeText(shareText + '\n\nhttps://crewq-app.vercel.app');
                        alert('Copied to clipboard!');
                      }
                    } catch (err) {}
                  }}
                  className="w-full bg-zinc-800 text-white py-3 rounded-xl font-semibold hover:bg-zinc-700 transition flex items-center justify-center gap-2"
                >
                  <Share2 className="w-5 h-5" />
                  Share Achievement
                </button>
                
                <button
                  onClick={() => setShowBadgeEarned(null)}
                  className="w-full text-zinc-500 hover:text-white py-2 transition"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettings && (
          <SettingsModal
            onClose={() => setShowSettings(false)}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            userProfile={userProfile}
            isAdmin={isAdmin}
            onOpenAdmin={() => { setShowSettings(false); setShowAdminPortal(true); }}
            onLogout={() => {
              handleLogout();
              setShowSettings(false);
            }}
            onLinkGoogle={handleGoogleAuth}
            onOpenNotificationPrefs={() => {
              setShowSettings(false);
              setShowNotificationPrefs(true);
            }}
            onUpdateProfile={async (updates) => {
              if (!supabaseClient || !userProfile?.id) return;
              try {
                const { data, error } = await supabaseClient
                  .from('users')
                  .update(updates)
                  .eq('id', userProfile.id)
                  .select()
                  .single();
                
                if (error) throw error;
                if (data) {
                  setUserProfile(data);
                  showToast('Settings saved!', 'success');
                }
              } catch (error) {
                console.error('Error updating profile:', error);
                showToast('Error saving settings', 'error');
              }
            }}
            onResetEvents={() => {
              const userKey = `crewq_${userProfile?.id}`;
              localStorage.removeItem(`${userKey}_passed`);
              setPassedEventIds(new Set());
              loadEvents(userProfile?.id);
              showToast('Passed events restored! Browse again 🎉', 'success');
            }}
          />
        )}

        {/* Notifications Modal */}
        {showNotifications && (
          <NotificationsModal
            onClose={() => setShowNotifications(false)}
            darkMode={darkMode}
            notifications={notifications}
            pendingJoinRequests={pendingJoinRequests}
            onReviewRequest={(request) => {
              setShowNotifications(false);
              setShowJoinRequestReview(request);
            }}
            onCheckIn={handleCheckIn}
            onEventClick={handleEventClick}
            onClearAll={() => {
              // Save cleared notification IDs to localStorage
              const clearedIds = notifications.map(n => n.id);
              const existingCleared = JSON.parse(localStorage.getItem(`crewq_${userProfile?.id}_cleared_notifs`) || '[]');
              const allCleared = [...new Set([...existingCleared, ...clearedIds])];
              localStorage.setItem(`crewq_${userProfile?.id}_cleared_notifs`, JSON.stringify(allCleared));
              setNotifications([]);
            }}
          />
        )}

        {/* Join Request Review Modal */}
        {showJoinRequestReview && (
          <ProfilePreviewModal
            user={showJoinRequestReview.user}
            onClose={() => setShowJoinRequestReview(null)}
            onApprove={() => handleApproveJoinRequest(showJoinRequestReview)}
            onReject={(user, reason) => handleRejectJoinRequest(showJoinRequestReview, reason)}
            rejectionReasons={REJECTION_REASONS}
          />
        )}

        {/* Admin Portal */}
        {showAdminPortal && (
          <AdminPortal
            onClose={() => setShowAdminPortal(false)}
            userEmail={userProfile?.email}
          />
        )}

        {/* Business Portal */}
        {showBusinessPortal && (
          <BusinessPortal
            onClose={() => setShowBusinessPortal(false)}
            darkMode={darkMode}
            supabaseClient={supabaseClient}
            DALLAS_NEIGHBORHOODS={DALLAS_NEIGHBORHOODS}
          />
        )}

        {/* Notification Preferences Modal */}
        {showNotificationPrefs && (
          <NotificationPreferencesModal
            onClose={() => setShowNotificationPrefs(false)}
            darkMode={darkMode}
            userProfile={userProfile}
            onSavePreferences={(prefs) => {
              showToast('Notification preferences saved!', 'success');
            }}
          />
        )}

        {/* Leaderboard Modal */}
        {showLeaderboard && (
          <LeaderboardModal
            onClose={() => setShowLeaderboard(false)}
            darkMode={darkMode}
            userProfile={userProfile}
            supabaseClient={supabaseClient}
          />
        )}

        {/* Squad Chat Modal */}
        {showSquadChat && (
          <SquadChat
            squad={showSquadChat}
            userProfile={userProfile}
            darkMode={darkMode}
            onClose={() => setShowSquadChat(null)}
            supabaseClient={supabaseClient}
            showToast={showToast}
          />
        )}

        {/* Toast Notification */}
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        )}
      </div>
    </div>
  );
}
