import React, { useState, useEffect, useRef } from 'react';
import { Heart, X, Share2, Bell, BellOff, Settings, MapPin, Users, Calendar, Search, User, Home, Check, Send, ChevronLeft, ChevronRight, Clock, UserPlus, MessageCircle, Edit2, LogOut, Mail, Phone, Camera, CheckCircle, Trash2, Eye, EyeOff, Shield, Sparkles, ExternalLink, Globe, UtensilsCrossed, Award, Trophy, Star, Flame, Music, Mic, Beer, Coffee, Utensils, Sunrise, Moon, Key, Crown, Zap, Target, Navigation, Map, Filter, Car } from 'lucide-react';

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
  
  // Varied opening phrases for new users
  const newUserOpenings = [
    `${userName} is new to the Dallas nightlife scene and ready to explore!`,
    `${userName} just landed in Dallas and is ready to discover the best spots!`,
    `${userName} is here to find their new favorite Dallas hangouts!`,
    `Fresh to the Dallas scene, ${userName} is eager to explore what the city has to offer!`
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
  
  // Varied openings based on traits
  const regularOpenings = [
    `${userName} is a Dallas nightlife regular who's always down for a good time. `,
    `${userName} knows the Dallas scene inside and out. `,
    `A true Dallas local, ${userName} is always in the know about what's happening. `
  ];
  
  const soloOpenings = [
    `${userName} isn't afraid to explore Dallas solo and loves meeting new people. `,
    `${userName} embraces solo adventures and is always up for making new connections. `,
    `Flying solo doesn't faze ${userName} – they're here to explore and connect. `
  ];
  
  const generalOpenings = [
    `${userName} loves exploring what Dallas has to offer. `,
    `${userName} is all about discovering Dallas's best kept secrets. `,
    `${userName} brings good energy wherever they go in Dallas. `,
    `Always up for something new, ${userName} is exploring the Dallas scene. `
  ];
  
  // Opening
  if (social.includes('regular')) {
    bio = regularOpenings[Math.floor(Math.random() * regularOpenings.length)];
  } else if (social.includes('solo adventurer')) {
    bio = soloOpenings[Math.floor(Math.random() * soloOpenings.length)];
  } else {
    bio = generalOpenings[Math.floor(Math.random() * generalOpenings.length)];
  }

  // Drinks preference with variety
  if (drinks.length > 0) {
    const cocktailPhrases = [
      "Craft cocktails are definitely their thing. ",
      "A well-made cocktail is their love language. ",
      "They appreciate a bar with a solid cocktail program. "
    ];
    const beerPhrases = [
      "You'll find them checking out the latest craft beer spots. ",
      "Craft beer is their go-to. ",
      "They're always on the hunt for new breweries and taprooms. "
    ];
    const hhPhrases = [
      "They know all the best happy hour deals in town. ",
      "Happy hour? They've got the inside scoop on every deal. ",
      "Never paying full price – they know every happy hour in Dallas. "
    ];
    
    if (drinks.includes('cocktail connoisseur') || drinks.includes('cocktail menu hunter')) {
      bio += cocktailPhrases[Math.floor(Math.random() * cocktailPhrases.length)];
    } else if (drinks.includes('craft beer lover')) {
      bio += beerPhrases[Math.floor(Math.random() * beerPhrases.length)];
    } else if (drinks.includes('happy hour hunter')) {
      bio += hhPhrases[Math.floor(Math.random() * hhPhrases.length)];
    }
  }

  // Venue vibes
  if (vibes.length > 0) {
    const vibeList = [];
    if (vibes.includes('rooftop lover')) vibeList.push('rooftops');
    if (vibes.includes('patio person')) vibeList.push('patios');
    if (vibes.includes('dive bar enthusiast')) vibeList.push('dive bars');
    if (vibes.includes('speakeasy seeker')) vibeList.push('speakeasies');
    if (vibes.includes('brewery hopper')) vibeList.push('breweries');
    
    if (vibeList.length > 0) {
      const vibePhrases = [
        `They're drawn to ${vibeList.slice(0, 2).join(' and ')}. `,
        `${vibeList.slice(0, 2).join(' and ').charAt(0).toUpperCase() + vibeList.slice(0, 2).join(' and ').slice(1)} are their scene. `,
        `You'll often catch them at ${vibeList.slice(0, 2).join(' or ')}. `
      ];
      bio += vibePhrases[Math.floor(Math.random() * vibePhrases.length)];
    }
  }

  // Sports with variety
  if (sports.length > 0) {
    const cowboysPhrases = [
      "Game days mean finding the perfect sports bar for Cowboys action. ",
      "Sundays are for Cowboys games at the best sports bars. ",
      "How 'bout them Cowboys? They're always watching. "
    ];
    const ufcPhrases = [
      "They never miss a big UFC fight night. ",
      "Fight nights are a must – they're always locked in for UFC. ",
      "Big fights mean big nights out for them. "
    ];
    const soccerPhrases = [
      "Early mornings for Premier League? Count them in. ",
      "Soccer fans unite – they're watching every match. ",
      "Whether it's MLS or Premier League, they're there for it. "
    ];
    
    if (sports.includes('Cowboys fan')) {
      bio += cowboysPhrases[Math.floor(Math.random() * cowboysPhrases.length)];
    } else if (sports.includes('fight night fan')) {
      bio += ufcPhrases[Math.floor(Math.random() * ufcPhrases.length)];
    } else if (sports.includes('soccer fan')) {
      bio += soccerPhrases[Math.floor(Math.random() * soccerPhrases.length)];
    }
  }

  // Food with variety
  if (food.length > 0) {
    const foodiePhrases = [
      "Always hunting for the next great restaurant to try. ",
      "Food is an adventure – they're always exploring new spots. ",
      "Their restaurant list is never-ending (in the best way). "
    ];
    const brunchPhrases = [
      "Weekend brunch is a must. ",
      "Bottomless mimosas? Say less. ",
      "Brunch is a lifestyle, not just a meal. "
    ];
    const lateNightPhrases = [
      "Late-night eats after the bars? Absolutely. ",
      "The night doesn't end until they find good late-night food. ",
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

  // Entertainment with variety
  if (entertainment.length > 0) {
    const musicPhrases = [
      "Live music and DJ nights are their jam. ",
      "If there's a good DJ or live band, they're there. ",
      "Music is the vibe – live shows are always on the agenda. "
    ];
    const triviaPhrases = [
      "Trivia nights are a weekly tradition. ",
      "They take trivia seriously (in a fun way). ",
      "Quiz night champion in the making. "
    ];
    const comedyPhrases = [
      "Comedy nights and open mics are always on the radar. ",
      "A good laugh is always on the schedule. ",
      "Comedy shows are their thing – the funnier, the better. "
    ];
    const nightOwlPhrases = [
      "The party really starts after 10 PM for them. ",
      "Night owl energy – they come alive when the sun goes down. ",
      "Early nights? Not in their vocabulary. "
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

  // Social style closing
  const groupClosings = [
    "They love bringing the crew together at spots with big tables.",
    "Squad hangs at spacious spots are their specialty.",
    "Big tables, bigger groups – that's their style."
  ];
  const loyalClosings = [
    "Once they find a spot they love, they keep coming back.",
    "Loyalty runs deep – their favorite spots know them by name.",
    "When they find a gem, they're a regular for life."
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
                  className="flex-1 bg-emerald-500 bg-opacity-20 border-2 border-emerald-500 text-emerald-400 py-4 rounded-xl font-bold text-lg hover:bg-opacity-30 transition"
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

function EventCard({ event, onSwipe, style }) {
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

          {event.age_restricted && (
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-red-500 text-white px-2 py-1 sm:px-3 rounded-full text-xs font-bold">
              21+
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
          </div>

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

function SquadDetailModal({ squad, onClose, onJoin, onLeave, onVote, userProfile, isMember, onEventClick, onEdit, onDelete, onMute }) {
  const [hasVoted, setHasVoted] = useState(false);
  const [vote, setVote] = useState(null);
  const [squadMembers, setSquadMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

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

  // Use loaded members or fallback to squad.members
  const displayMembers = squadMembers.length > 0 ? squadMembers : (squad.members || []);

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
              Members ({squad.member_count || displayMembers.length || 0})
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
                  <div
                    key={member.id}
                    className="flex items-center gap-3 bg-zinc-800 rounded-xl p-3"
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
                  </div>
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
                {(squad.member_count || 0) > 6 && (
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 text-xs font-semibold">
                    +{squad.member_count - 6}
                  </div>
                )}
              </div>
            )}
          </div>

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
              (squad.member_count || 0) >= squad.max_members
                ? 'bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30'
                : 'bg-zinc-800'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Squad Capacity</span>
                <span className={`text-sm font-semibold ${
                  (squad.member_count || 0) >= squad.max_members ? 'text-red-400' : 'text-white'
                }`}>
                  {squad.member_count || 0} / {squad.max_members}
                </span>
              </div>
              {(squad.member_count || 0) >= squad.max_members && (
                <p className="text-red-400 text-xs mt-1">🔒 Squad is full</p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {!isMember ? (
            squad.max_members && (squad.member_count || 0) >= squad.max_members ? (
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
              
              {/* Mute notifications option for all members */}
              <button
                onClick={() => onMute && onMute(squad)}
                className="w-full flex items-center justify-center gap-2 text-zinc-500 py-2 hover:text-zinc-300 transition text-sm"
              >
                <BellOff className="w-4 h-4" />
                Mute Notifications
              </button>
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
function SettingsModal({ onClose, darkMode, setDarkMode, userProfile, onLogout, onLinkGoogle }) {
  const [activeSection, setActiveSection] = useState(null);
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  
  const settingsSections = [
    { id: 'account', label: 'Account', icon: User, description: 'Manage your account details' },
    { id: 'privacy', label: 'Privacy & Social', icon: Shield, description: 'Control who sees your profile' },
    { id: 'content', label: 'Content & Display', icon: Eye, description: 'Customize your experience' },
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

  const isGoogleLinked = !!userProfile?.auth_id || !!userProfile?.email;

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

        <div className="p-4 space-y-4">
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
                    {darkMode ? 'Easy on the eyes' : 'Bright and clean'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`relative w-14 h-8 rounded-full transition ${
                  darkMode ? 'bg-orange-500' : 'bg-zinc-300'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform shadow ${
                    darkMode ? 'transform translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
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

// Notifications Modal
function NotificationsModal({ 
  onClose, 
  darkMode, 
  notifications, 
  pendingJoinRequests, 
  onReviewRequest,
  onCheckIn,
  onEventClick
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
            <button onClick={onClose} className={darkMode ? 'text-zinc-400' : 'text-zinc-600'}>
              <X className="w-6 h-6" />
            </button>
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

function EventDetailModal({ event, onClose, onCheckIn, isCheckedIn, checkInCount, userProfile, historicalCount = 0 }) {
  const [checking, setChecking] = useState(false);

  const handleCheckIn = async () => {
    setChecking(true);
    await onCheckIn(event);
    setChecking(false);
  };

  // Get ambience details if available
  const ambience = event.ambience ? AMBIENCE_OPTIONS.find(a => a.id === event.ambience) : null;

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

          {event.age_restricted && (
            <div className="absolute top-4 right-14 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
              21+
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

function EventSuggestionModal({ onClose, userProfile }) {
  const [venueName, setVenueName] = useState('');
  const [eventName, setEventName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!venueName.trim() || !eventName.trim()) {
      alert('Please fill in the venue and event name');
      return;
    }

    setSubmitting(true);
    
    try {
      if (supabaseClient) {
        await supabaseClient
          .from('event_suggestions')
          .insert([{
            user_id: userProfile?.id || null,
            venue_name: venueName.trim(),
            event_name: eventName.trim(),
            description: description.trim(),
            status: 'pending'
          }]);
      }
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting suggestion:', error);
      alert('Error submitting. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
        <div className="bg-zinc-900 rounded-3xl max-w-md w-full p-6 text-center">
          <div className="w-16 h-16 bg-emerald-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Thanks for the suggestion!</h2>
          <p className="text-zinc-400 mb-6">We'll review it and try to add it soon.</p>
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
      <div className="bg-zinc-900 rounded-3xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Suggest an Event</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-zinc-400 mb-2">
              Venue / Location *
            </label>
            <input
              type="text"
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              placeholder="e.g. The Rustic, Deep Ellum"
              className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-400 mb-2">
              Event Name *
            </label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="e.g. Live Jazz Night, Taco Tuesday"
              className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-400 mb-2">
              Tell us a little about it
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What makes this event great? When does it happen?"
              rows={3}
              className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Suggestion'}
          </button>
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

// Events Tab with Live Map and Calendar views
function EventsTab({ events, likedEvents, onEventClick, onUnlikeEvent, userLocation, onRequestLocation }) {
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

  // Get live events (happening right now)
  const liveEvents = events.filter(isEventLive);
  
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

  const filteredMapEvents = getFilteredEvents(mapEvents);

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

  const updateMarkers = (map, eventList) => {
    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    eventList.forEach(event => {
      if (!event.latitude || !event.longitude) return;

      const el = document.createElement('div');
      el.className = 'event-marker';
      el.innerHTML = `
        <div style="
          width: 36px; 
          height: 36px; 
          background: linear-gradient(135deg, #f97316, #ea580c); 
          border-radius: 50% 50% 50% 0; 
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 3px 10px rgba(249, 115, 22, 0.4);
          cursor: pointer;
        ">
          <span style="transform: rotate(45deg); font-size: 14px;">🎵</span>
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
  };

  // Update markers when events change
  useEffect(() => {
    if (mapRef.current && mapLoaded) {
      updateMarkers(mapRef.current, filteredMapEvents);
    }
  }, [filteredMapEvents, mapLoaded, showAllEvents]);

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
          <div className="flex-1 relative min-h-[300px]">
            <div ref={mapContainerRef} className="absolute inset-0" />
            
            {!mapLoaded && (
              <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-zinc-400 text-sm">Loading map...</p>
                </div>
              </div>
            )}

            {/* Map Legend */}
            <div className="absolute bottom-4 left-4 bg-zinc-900 bg-opacity-90 rounded-xl p-3 text-xs">
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
                <div key={idx} className="bg-zinc-800 rounded-2xl p-4 flex items-center gap-3">
                  <button onClick={() => onEventClick(event)} className="flex-1 text-left">
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
                  <button
                    onClick={() => onUnlikeEvent(event)}
                    className="p-2 bg-red-500 bg-opacity-20 rounded-full hover:bg-opacity-40 transition"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
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

function AwardsTab({ userProfile, userBadges, userStats }) {
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
        
        <div className="bg-white bg-opacity-20 rounded-xl p-4">
          <div className="text-3xl font-bold text-white mb-1">{totalPoints}</div>
          <div className="text-orange-100 text-sm">Total Points</div>
        </div>
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
                {userProfile.profile_visibility === 'public' 
                  ? 'Anyone can see your profile in Solo mode' 
                  : 'Only squad members and squad leaders you request to join can see your profile'}
              </p>
            </div>
            <button
              onClick={async () => {
                const currentVisibility = userProfile.profile_visibility || 'squad_only';
                const newVisibility = currentVisibility === 'public' ? 'squad_only' : 'public';
                const updatedProfile = { ...userProfile, profile_visibility: newVisibility };
                await onUpdateProfile(updatedProfile);
              }}
              className={`relative w-14 h-8 rounded-full transition-colors duration-200 cursor-pointer ${
                userProfile.profile_visibility === 'public'
                  ? 'bg-orange-500'
                  : 'bg-zinc-600'
              }`}
            >
              <div
                className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-200 ${
                  userProfile.profile_visibility === 'public'
                    ? 'left-7'
                    : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Status Indicator */}
          <div className={`flex items-center gap-3 p-4 rounded-xl ${
            userProfile.profile_visibility === 'public'
              ? 'bg-emerald-500 bg-opacity-10 border border-emerald-500 border-opacity-30'
              : 'bg-zinc-800'
          }`}>
            {userProfile.profile_visibility === 'public' ? (
              <>
                <Eye className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="text-emerald-400 font-semibold">Public Profile</p>
                  <p className="text-emerald-400 text-opacity-70 text-xs">Solo users can see you're attending events</p>
                </div>
              </>
            ) : (
              <>
                <EyeOff className="w-5 h-5 text-zinc-500" />
                <div>
                  <p className="text-zinc-300 font-semibold">Squad Only</p>
                  <p className="text-zinc-500 text-xs">Only squad members and leaders you request to join can see your profile</p>
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

function AuthScreen({ onAuth, onGoogleAuth }) {
  const [step, setStep] = useState(0); // 0 = welcome/login choice, 1 = basic info, 2 = vibes
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');
  const [vibes, setVibes] = useState([]);
  const [intents, setIntents] = useState([]);
  const [bio, setBio] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

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
      show_age_to_squads: true
    });
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-3xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h1 className="text-3xl font-bold text-white mb-2">
          Crew<span className="text-orange-500">Q</span>
        </h1>
        <p className="text-zinc-400 mb-6">Dallas Nightlife, Solved</p>

        {step === 0 && (
          <div className="space-y-4">
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                <Users className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Welcome to CrewQ</h2>
              <p className="text-zinc-400 text-sm">
                Discover events, build your crew, and experience Dallas nightlife like never before.
              </p>
            </div>

            {/* Google Sign In Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full bg-white text-zinc-800 py-4 rounded-xl font-bold text-lg hover:bg-zinc-100 transition disabled:opacity-50 flex items-center justify-center gap-3"
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
                <div className="w-full border-t border-zinc-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-zinc-900 text-zinc-500">or</span>
              </div>
            </div>

            {/* Continue without account */}
            <button
              onClick={() => setStep(1)}
              className="w-full bg-zinc-800 text-white py-4 rounded-xl font-bold text-lg hover:bg-zinc-700 transition"
            >
              Continue as Guest
            </button>

            <p className="text-xs text-zinc-500 text-center mt-4">
              Sign in with Google to sync your profile across devices
            </p>
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
                    step >= s ? 'bg-orange-500' : 'bg-zinc-800'
                  }`}
                />
              ))}
            </div>
          </>
        )}

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
              <p className="text-xs text-zinc-500 mt-1">For squad invites from friends</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(0)}
                className="flex-1 bg-zinc-800 text-white py-4 rounded-xl font-bold hover:bg-zinc-700 transition"
              >
                Back
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!name}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition disabled:opacity-50"
              >
                Next
              </button>
            </div>
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

// Google OAuth Onboarding Modal - for new Google users to complete their profile
function GoogleOnboardingModal({ pendingUser, onComplete }) {
  const [step, setStep] = useState(1);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [vibes, setVibes] = useState([]);
  const [intents, setIntents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

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
    setIsLoading(true);
    await onComplete({
      ...pendingUser,
      age: age ? parseInt(age) : null,
      gender: gender || null,
      vibes,
      intents,
      allow_squad_requests: true,
      show_age_to_squads: true
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
                {isLoading ? 'Setting up...' : 'Let\'s Go! 🎉'}
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
  const [showBadgeEarned, setShowBadgeEarned] = useState(null);
  const [attendedEvents, setAttendedEvents] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [pendingGoogleUser, setPendingGoogleUser] = useState(null); // For Google OAuth onboarding
  
  // Settings & Notifications
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('crewq_theme') !== 'light';
  });
  const [notifications, setNotifications] = useState([]);
  const [pendingJoinRequests, setPendingJoinRequests] = useState([]);
  const [showJoinRequestReview, setShowJoinRequestReview] = useState(null);
  const [toast, setToast] = useState(null);

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
  useEffect(() => {
    if (!userProfile?.id) return;
    
    const refreshInterval = setInterval(() => {
      // Refresh notifications
      loadNotifications();
      loadPendingJoinRequests();
      
      // Refresh squads data
      loadSquads(userProfile.id);
      loadAllSquads();
      
      // Refresh events
      loadEvents();
      
      // Refresh badges and stats
      loadUserBadges(userProfile.id);
      loadUserStats(userProfile.id);
      loadAttendedEvents(userProfile.id);
    }, 30000); // 30 seconds
    
    return () => clearInterval(refreshInterval);
  }, [userProfile?.id]);

  const loadNotifications = async () => {
    if (!supabaseClient || !userProfile) return;
    
    // Build notifications from various sources
    const notifs = [];
    
    // Check for upcoming liked events (within next 24 hours) - user specific
    const likedEventsData = JSON.parse(localStorage.getItem(`crewq_${userProfile.id}_liked`) || '[]');
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    likedEventsData.forEach(event => {
      const eventDate = new Date(event.date);
      if (eventDate >= now && eventDate <= tomorrow) {
        notifs.push({
          id: `reminder-${event.id}`,
          type: 'event_reminder',
          title: 'Upcoming Event!',
          message: `${event.name} is happening soon`,
          event: event,
          time: 'Today',
          read: false
        });
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
        notifs.push({
          id: `checkin-${event.id}`,
          type: 'checkin_reminder',
          title: 'Check In Now!',
          message: `${event.name} is happening - don't forget to check in!`,
          event: event,
          time: 'Now',
          read: false,
          priority: true
        });
      }
    });
    
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
      const { data: checkins, error: checkinsError } = await supabaseClient
        .from('event_checkins')
        .select('event_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
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
      const totalSwipes = parseInt(localStorage.getItem(`${userKey}_swipes`) || '0');
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
      setShowEditSquad(null);
      await loadSquads(userProfile.id);
      await loadAllSquads();
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
          await loadEvents();
          await loadCrewMembers(existingProfile.id);
          await loadSquads(existingProfile.id);
          await loadAllSquads();
          await loadCheckedInEvents(existingProfile.id);
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
          await loadEvents();
          await loadCrewMembers(data.id);
          await loadSquads(data.id);
          await loadAllSquads();
          await loadCheckedInEvents(data.id);
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
          bio_answers: updatedProfile.bio_answers,
          profile_picture: updatedProfile.profile_picture,
          profile_visibility: updatedProfile.profile_visibility || 'squad_only'
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
    if (!userProfile?.id) return;
    
    const userKey = `crewq_${userProfile.id}`;
    
    // Track swipes for badges - user specific
    const currentSwipes = parseInt(localStorage.getItem(`${userKey}_swipes`) || '0');
    localStorage.setItem(`${userKey}_swipes`, (currentSwipes + 1).toString());
    
    if (direction === 'right') {
      const liked = JSON.parse(localStorage.getItem(`${userKey}_liked`) || '[]');
      // Prevent duplicates
      if (!liked.find(e => e.id === events[currentIndex].id)) {
        liked.push(events[currentIndex]);
        localStorage.setItem(`${userKey}_liked`, JSON.stringify(liked));
        
        // Trigger refresh so Events tab updates
        setLikedEventsRefresh(prev => prev + 1);

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
    }
    // Always move to next card
    setCurrentIndex(prev => prev + 1);
    
    // Refresh stats to check for new badges
    if (userProfile?.id) {
      setTimeout(() => loadUserStats(userProfile.id), 100);
    }
  };

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
    return <AuthScreen onAuth={handleAuth} onGoogleAuth={handleGoogleAuth} />;
  }

  const currentEvent = events[currentIndex];

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-zinc-950 text-white' : 'bg-amber-50 text-zinc-900'}`}>
      <div className={`w-full max-w-md mx-auto ${darkMode ? 'bg-zinc-950' : 'bg-amber-50'} min-h-screen relative flex flex-col`}>
        {/* Fixed Header */}
        <div className={`sticky top-0 z-40 ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-amber-100 border-amber-200'} border-b px-4 py-4`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">
                Crew<span className="text-orange-500">Q</span>
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowNotifications(true)}
                className="relative"
              >
                <Bell className={`w-6 h-6 ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`} />
                {(notifications.length + pendingJoinRequests.length) > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {notifications.length + pendingJoinRequests.length}
                  </span>
                )}
              </button>
              <button onClick={() => setShowSettings(true)}>
                <Settings className={`w-6 h-6 ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`} />
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className={`flex gap-2 rounded-full p-1.5 transition-all duration-300 ${
              mode === 'crew' 
                ? (darkMode ? 'bg-zinc-800' : 'bg-amber-200') 
                : 'bg-orange-500'
            }`}>
              <button
                onClick={() => setMode('crew')}
                className={`px-8 py-2.5 rounded-full text-base font-bold transition-all duration-300 ${
                  mode === 'crew' 
                    ? 'bg-orange-500 text-white' 
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
            
            <div className={`flex items-center gap-2 ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
              <MapPin className="w-4 h-4" />
              <span className="text-sm">Dallas, Texas</span>
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden pb-20 sm:pb-24 -webkit-overflow-scrolling-touch">
          {currentTab === 'discover' && (
            <div className="px-3 py-3 sm:px-4 sm:py-6">
              {currentIndex >= events.length || events.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Calendar className="w-10 h-10 text-orange-500" />
                  </div>
                  <h2 className="text-2xl font-bold mb-3">More Events Coming Soon!</h2>
                  <p className="text-zinc-400 mb-8 px-4">
                    We're constantly adding new events in Dallas. Check back soon or let us know what you're looking for!
                  </p>
                  
                  <button
                    onClick={() => setShowSuggestionModal(true)}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-xl font-bold hover:shadow-lg transition flex items-center justify-center gap-2 mx-auto"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Can't find an event? Let us know!
                  </button>

                  {likedEvents.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-zinc-800">
                      <p className="text-zinc-500 text-sm mb-3">Meanwhile, check out your liked events:</p>
                      <button
                        onClick={() => setCurrentTab('events')}
                        className="text-orange-500 font-semibold hover:text-orange-400 transition"
                      >
                        View {likedEvents.length} Liked Event{likedEvents.length !== 1 ? 's' : ''} →
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative h-[420px] sm:h-[480px] md:h-[560px]" style={{ touchAction: 'pan-y' }}>
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

                  <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-3 sm:gap-4 z-20">
                    <button
                      onClick={() => handleSwipe('left')}
                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-zinc-800 bg-opacity-90 backdrop-blur-sm border border-zinc-700 flex items-center justify-center hover:bg-red-500 hover:border-red-500 transition shadow-lg"
                    >
                      <X className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                    </button>

                    <button
                      onClick={() => setShowShareModal(true)}
                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-zinc-800 bg-opacity-90 backdrop-blur-sm border border-zinc-700 flex items-center justify-center hover:bg-orange-500 hover:border-orange-500 transition shadow-lg"
                    >
                      <Share2 className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                    </button>

                    <button
                      onClick={() => handleSwipe('right')}
                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-zinc-800 bg-opacity-90 backdrop-blur-sm border border-zinc-700 flex items-center justify-center hover:bg-emerald-500 hover:border-emerald-500 transition shadow-lg"
                    >
                      <Heart className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentTab === 'search' && <AIChat userProfile={userProfile} />}
          {currentTab === 'events' && (
            <EventsTab 
              events={events}
              likedEvents={likedEvents} 
              onEventClick={handleEventClick} 
              onUnlikeEvent={handleUnlikeEvent}
              userLocation={userLocation}
              onRequestLocation={requestUserLocation}
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
        <div className={`fixed bottom-0 left-0 right-0 z-50 ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-amber-200'} border-t px-4 py-2 pb-safe`}>
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
                <tab.icon className={`w-5 h-5 ${currentTab === tab.id ? 'text-orange-500' : (darkMode ? 'text-zinc-500' : 'text-zinc-400')}`} />
                <span className={`text-[10px] ${currentTab === tab.id ? 'text-orange-500' : (darkMode ? 'text-zinc-500' : 'text-zinc-400')}`}>
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
            }}
            onCheckIn={handleCheckIn}
            isCheckedIn={checkedInEvents.includes(selectedEvent.id)}
            checkInCount={0}
            userProfile={userProfile}
            historicalCount={selectedEventHistoricalCount}
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
            isMember={selectedSquad.members?.some(m => m.id === userProfile.id) || squads.some(s => s.id === selectedSquad.id)}
            onEventClick={(event) => {
              setShowSquadDetail(false);
              handleEventClick(event);
            }}
            onEdit={handleEditSquad}
            onDelete={handleDeleteSquad}
            onMute={handleMuteSquad}
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
          />
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
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg transition"
                >
                  <Share2 className="w-5 h-5" />
                  Share Achievement
                </button>
                
                <button
                  onClick={() => setShowBadgeEarned(null)}
                  className="w-full bg-zinc-800 text-white py-3 rounded-xl font-semibold hover:bg-zinc-700 transition"
                >
                  Awesome!
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
            onLogout={() => {
              handleLogout();
              setShowSettings(false);
            }}
            onLinkGoogle={handleGoogleAuth}
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
