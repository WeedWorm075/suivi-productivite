import React, { useState, useEffect } from 'react';
import { Clock, Play, Pause, Plus, Target, BarChart3, Calendar, Zap, Tag, Star, X, Check } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const TimeTracker = () => {
  const [sessions, setSessions] = useState([]);
  const [activeTimer, setActiveTimer] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [goals, setGoals] = useState({ work: 480, rest: 420 });
  const [manualEntry, setManualEntry] = useState({ category: 'work', hours: 0, minutes: 0, tag: '' });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [view, setView] = useState('tracker');
  const [editingGoals, setEditingGoals] = useState(false);
  const [tempGoals, setTempGoals] = useState({ work: 480, rest: 420 });
  
  // Focus Mode (Pomodoro)
  const [focusMode, setFocusMode] = useState(false);
  const [focusDuration, setFocusDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [isBreak, setIsBreak] = useState(false);
  
  // Tags
  const [tags, setTags] = useState({
    work: ['Coding', 'Meetings', 'Email', 'Planning'],
    rest: ['Exercise', 'Sleep', 'Entertainment', 'Social']
  });
  const [newTag, setNewTag] = useState({ category: 'work', name: '' });
  const [showTagManager, setShowTagManager] = useState(false);
  
  // Productivity Rating
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [sessionToRate, setSessionToRate] = useState(null);
  const [rating, setRating] = useState(0);
  
  // Idle Detection & Reminders
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [showIdleModal, setShowIdleModal] = useState(false);
  const [idleStartTime, setIdleStartTime] = useState(null);
  const [continuousWorkTime, setContinuousWorkTime] = useState(0);
  const [notificationPermission, setNotificationPermission] = useState('default');

  useEffect(() => {
    const stored = localStorage.getItem('timeSessions');
    if (stored) setSessions(JSON.parse(stored));
    
    const storedGoals = localStorage.getItem('timeGoals');
    if (storedGoals) {
      setGoals(JSON.parse(storedGoals));
      setTempGoals(JSON.parse(storedGoals));
    }
    
    const storedTags = localStorage.getItem('customTags');
    if (storedTags) setTags(JSON.parse(storedTags));
  }, []);

  useEffect(() => {
    localStorage.setItem('timeSessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('timeGoals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('customTags', JSON.stringify(tags));
  }, [tags]);

  useEffect(() => {
    let interval;
    if (activeTimer) {
      interval = setInterval(() => {
        setTimerSeconds(prev => {
          const newSeconds = prev + 1;
          
          // Focus Mode: Check if timer completed
          if (focusMode) {
            const targetMinutes = isBreak ? breakDuration : focusDuration;
            if (newSeconds >= targetMinutes * 60) {
              handleFocusComplete();
              return 0;
            }
          }
          
          return newSeconds;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTimer, focusMode, isBreak, focusDuration, breakDuration]);

  const handleFocusComplete = () => {
    // Play notification sound (optional)
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWm98OScTgwOUKvo87RiGwU7k9r0yHgrBSh+zPLaizsKE2S56+mmVRQJSKXh8bllHgU2jdXzzn0vBSh+zPDajzsKEl+36Oi');
    audio.play().catch(() => {});
    
    if (!isBreak) {
      // Work session completed, save and prompt for rating
      stopTimer();
      setIsBreak(true);
      setActiveTimer('rest');
      setTimerSeconds(0);
    } else {
      // Break completed
      stopTimer();
      setIsBreak(false);
    }
  };

  const startTimer = (category) => {
    if (activeTimer) stopTimer();
    setActiveTimer(category);
    setTimerSeconds(0);
    if (focusMode && category === 'work') {
      setIsBreak(false);
    }
  };

  const stopTimer = () => {
    if (activeTimer && timerSeconds > 0) {
      const newSession = {
        id: Date.now(),
        category: activeTimer,
        duration: timerSeconds / 60,
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString(),
        tag: '',
        rating: null
      };
      
      // If work session, prompt for rating
      if (activeTimer === 'work') {
        setSessionToRate(newSession);
        setShowRatingModal(true);
      } else {
        setSessions(prev => [...prev, newSession]);
      }
    }
    setActiveTimer(null);
    setTimerSeconds(0);
    if (focusMode) {
      setIsBreak(false);
    }
  };

  const saveRatedSession = () => {
    if (sessionToRate) {
      setSessions(prev => [...prev, { ...sessionToRate, rating }]);
      setShowRatingModal(false);
      setSessionToRate(null);
      setRating(0);
    }
  };

  const skipRating = () => {
    if (sessionToRate) {
      setSessions(prev => [...prev, sessionToRate]);
      setShowRatingModal(false);
      setSessionToRate(null);
      setRating(0);
    }
  };

  const addManualEntry = () => {
    const totalMinutes = parseInt(manualEntry.hours) * 60 + parseInt(manualEntry.minutes);
    if (totalMinutes > 0) {
      const newSession = {
        id: Date.now(),
        category: manualEntry.category,
        duration: totalMinutes,
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString(),
        tag: manualEntry.tag,
        rating: null
      };
      setSessions(prev => [...prev, newSession]);
      setManualEntry({ category: 'work', hours: 0, minutes: 0, tag: '' });
    }
  };

  const addTag = () => {
    if (newTag.name.trim()) {
      setTags(prev => ({
        ...prev,
        [newTag.category]: [...prev[newTag.category], newTag.name.trim()]
      }));
      setNewTag({ category: 'work', name: '' });
    }
  };

  const removeTag = (category, tagName) => {
    setTags(prev => ({
      ...prev,
      [category]: prev[category].filter(t => t !== tagName)
    }));
  };

  const updateGoals = () => {
    setGoals(tempGoals);
    setEditingGoals(false);
  };

  const resetGoals = () => {
    const defaultGoals = { work: 480, rest: 420 };
    setGoals(defaultGoals);
    setTempGoals(defaultGoals);
    setEditingGoals(false);
  };

  const cancelEditGoals = () => {
    setTempGoals(goals);
    setEditingGoals(false);
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatMinutes = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = Math.floor(minutes % 60);
    const s = Math.round((minutes % 1) * 60);
    if (h > 0) {
      return `${h}h ${m}min ${s}s`;
    } else if (m > 0) {
      return `${m}min ${s}s`;
    } else {
      return `${s}s`;
    }
  };

  const getTodayTotal = (category) => {
    const today = new Date().toISOString().split('T')[0];
    const todaySessions = sessions.filter(s => s.date === today && s.category === category);
    const total = todaySessions.reduce((sum, s) => sum + s.duration, 0);
    if (activeTimer === category) {
      return total + (timerSeconds / 60);
    }
    return total;
  };

  const getDateTotal = (date, category) => {
    return sessions
      .filter(s => s.date === date && s.category === category)
      .reduce((sum, s) => sum + s.duration, 0);
  };

  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      days.push({
        date: dateStr,
        day: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
        work: getDateTotal(dateStr, 'work'),
        rest: getDateTotal(dateStr, 'rest')
      });
    }
    return days;
  };

  const getProductivityScore = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayWorkSessions = sessions.filter(s => s.date === today && s.category === 'work' && s.rating);
    
    if (todayWorkSessions.length === 0) return null;
    
    const totalScore = todayWorkSessions.reduce((sum, s) => {
      const weightedScore = (s.rating / 5) * s.duration;
      return sum + weightedScore;
    }, 0);
    
    const totalDuration = todayWorkSessions.reduce((sum, s) => sum + s.duration, 0);
    const score = (totalScore / totalDuration) * 100;
    
    return Math.round(score);
  };

  const getTagBreakdown = () => {
    const today = new Date().toISOString().split('T')[0];
    const todaySessions = sessions.filter(s => s.date === today);
    
    const breakdown = {};
    todaySessions.forEach(s => {
      const key = s.tag || 'Non catégorisé';
      if (!breakdown[key]) {
        breakdown[key] = { value: 0, category: s.category };
      }
      breakdown[key].value += s.duration;
    });
    
    return Object.entries(breakdown).map(([name, data]) => ({
      name,
      value: data.value,
      category: data.category
    }));
  };

  const workToday = getTodayTotal('work');
  const restToday = getTodayTotal('rest');
  const workProgress = (workToday / goals.work) * 100;
  const restProgress = (restToday / goals.rest) * 100;
  const productivityScore = getProductivityScore();

  const pieData = [
    { name: 'Travail', value: workToday, color: '#3b82f6' },
    { name: 'Repos', value: restToday, color: '#10b981' }
  ];

  const tagBreakdown = getTagBreakdown();
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

  const dailySessions = sessions.filter(s => s.date === selectedDate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-800">Tracker de Temps Pro</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setView('tracker')}
                className={`px-4 py-2 rounded-lg font-medium transition ${view === 'tracker' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                Suivi
              </button>
              <button
                onClick={() => setView('stats')}
                className={`px-4 py-2 rounded-lg font-medium transition ${view === 'stats' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                Statistiques
              </button>
              <button
                onClick={() => setView('history')}
                className={`px-4 py-2 rounded-lg font-medium transition ${view === 'history' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                Historique
              </button>
            </div>
          </div>

          {view === 'tracker' && (
            <>
              {/* Focus Mode Toggle */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 mb-6 border-2 border-orange-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap className="w-6 h-6 text-orange-600" />
                    <div>
                      <h3 className="font-bold text-gray-800">Mode Focus (Pomodoro)</h3>
                      <p className="text-sm text-gray-600">
                        {focusMode ? `${focusDuration} min travail → ${breakDuration} min pause` : 'Désactivé'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {focusMode && (
                      <div className="flex gap-2 items-center text-sm">
                        <input
                          type="number"
                          min="1"
                          max="60"
                          value={focusDuration}
                          onChange={(e) => setFocusDuration(parseInt(e.target.value) || 25)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded"
                          disabled={activeTimer !== null}
                        />
                        <span>min /</span>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={breakDuration}
                          onChange={(e) => setBreakDuration(parseInt(e.target.value) || 5)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded"
                          disabled={activeTimer !== null}
                        />
                        <span>min</span>
                      </div>
                    )}
                    <button
                      onClick={() => setFocusMode(!focusMode)}
                      className={`px-4 py-2 rounded-lg font-semibold transition ${
                        focusMode 
                          ? 'bg-orange-600 text-white hover:bg-orange-700' 
                          : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                      }`}
                      disabled={activeTimer !== null}
                    >
                      {focusMode ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>
                {focusMode && isBreak && activeTimer === 'rest' && (
                  <div className="mt-4 p-3 bg-green-100 rounded-lg text-center">
                    <p className="text-green-800 font-semibold">🎯 Temps de pause ! Reposez-vous bien.</p>
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
                  <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
                    💼 Travail
                  </h3>
                  <div className="mb-2 text-sm text-gray-600">
                    Total aujourd'hui: {formatMinutes(workToday)}
                  </div>
                  <div className="text-4xl font-mono font-bold text-blue-600 mb-4">
                    {activeTimer === 'work' ? formatTime(timerSeconds) : '00:00:00'}
                  </div>
                  {focusMode && activeTimer === 'work' && (
                    <div className="mb-3 text-sm text-center text-blue-700">
                      Objectif: {focusDuration} minutes
                    </div>
                  )}
                  <button
                    onClick={() => activeTimer === 'work' ? stopTimer() : startTimer('work')}
                    className={`w-full py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                      activeTimer === 'work' 
                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                    disabled={isBreak}
                  >
                    {activeTimer === 'work' ? <><Pause className="w-5 h-5" /> Arrêter</> : <><Play className="w-5 h-5" /> Démarrer</>}
                  </button>
                </div>

                <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200">
                  <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2">
                    😴 Repos
                  </h3>
                  <div className="mb-2 text-sm text-gray-600">
                    Total aujourd'hui: {formatMinutes(restToday)}
                  </div>
                  <div className="text-4xl font-mono font-bold text-green-600 mb-4">
                    {activeTimer === 'rest' ? formatTime(timerSeconds) : '00:00:00'}
                  </div>
                  {focusMode && isBreak && activeTimer === 'rest' && (
                    <div className="mb-3 text-sm text-center text-green-700">
                      Pause: {breakDuration} minutes
                    </div>
                  )}
                  <button
                    onClick={() => activeTimer === 'rest' ? stopTimer() : startTimer('rest')}
                    className={`w-full py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                      activeTimer === 'rest' 
                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {activeTimer === 'rest' ? <><Pause className="w-5 h-5" /> Arrêter</> : <><Play className="w-5 h-5" /> Démarrer</>}
                  </button>
                </div>
              </div>

              {/* Tag Manager */}
              <div className="bg-gray-50 rounded-xl p-6 mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Tag className="w-5 h-5" />
                    Gérer les tags
                  </h3>
                  <button
                    onClick={() => setShowTagManager(!showTagManager)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    {showTagManager ? 'Masquer' : 'Afficher'}
                  </button>
                </div>
                
                {showTagManager && (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <select
                        value={newTag.category}
                        onChange={(e) => setNewTag({...newTag, category: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="work">Travail</option>
                        <option value="rest">Repos</option>
                      </select>
                      <input
                        type="text"
                        value={newTag.name}
                        onChange={(e) => setNewTag({...newTag, name: e.target.value})}
                        placeholder="Nouveau tag..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                        onKeyPress={(e) => e.key === 'Enter' && addTag()}
                      />
                      <button
                        onClick={addTag}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-sm text-gray-700 mb-2">Tags Travail</h4>
                        <div className="flex flex-wrap gap-2">
                          {tags.work.map(tag => (
                            <span key={tag} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-1">
                              {tag}
                              <button onClick={() => removeTag('work', tag)} className="hover:text-blue-900">
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-gray-700 mb-2">Tags Repos</h4>
                        <div className="flex flex-wrap gap-2">
                          {tags.rest.map(tag => (
                            <span key={tag} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm flex items-center gap-1">
                              {tag}
                              <button onClick={() => removeTag('rest', tag)} className="hover:text-green-900">
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 rounded-xl p-6 mb-8">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Ajouter manuellement
                </h3>
                <div className="flex flex-wrap gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
                    <select
                      value={manualEntry.category}
                      onChange={(e) => setManualEntry({...manualEntry, category: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="work">Travail</option>
                      <option value="rest">Repos</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tag</label>
                    <select
                      value={manualEntry.tag}
                      onChange={(e) => setManualEntry({...manualEntry, tag: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Aucun</option>
                      {tags[manualEntry.category].map(tag => (
                        <option key={tag} value={tag}>{tag}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Heures</label>
                    <input
                      type="number"
                      min="0"
                      value={manualEntry.hours}
                      onChange={(e) => setManualEntry({...manualEntry, hours: e.target.value})}
                      className="w-20 px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Minutes</label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={manualEntry.minutes}
                      onChange={(e) => setManualEntry({...manualEntry, minutes: e.target.value})}
                      className="w-20 px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <button
                    onClick={addManualEntry}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition"
                  >
                    Ajouter
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Objectifs quotidiens
                  </h3>
                  <div className="flex gap-2">
                    {!editingGoals ? (
                      <>
                        <button
                          onClick={() => setEditingGoals(true)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition text-sm"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={resetGoals}
                          className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition text-sm"
                        >
                          Réinitialiser
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={updateGoals}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition text-sm"
                        >
                          Enregistrer
                        </button>
                        <button
                          onClick={cancelEditGoals}
                          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition text-sm"
                        >
                          Annuler
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-blue-900">💼 Travail</span>
                    <span className="text-sm text-gray-600">
                      {Math.floor(workToday / 60)}h {Math.round(workToday % 60)}min / {Math.floor(goals.work / 60)}h {goals.work % 60}min
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                      style={{ width: `${Math.min(workProgress, 100)}%` }}
                    />
                  </div>
                  {editingGoals && (
                    <div className="mt-3 flex gap-2 items-center">
                      <span className="text-sm text-gray-700">Objectif:</span>
                      <input
                        type="number"
                        min="0"
                        value={Math.floor(tempGoals.work / 60)}
                        onChange={(e) => setTempGoals({...tempGoals, work: parseInt(e.target.value || 0) * 60 + (tempGoals.work % 60)})}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="h"
                      />
                      <span className="text-sm">h</span>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={tempGoals.work % 60}
                        onChange={(e) => setTempGoals({...tempGoals, work: Math.floor(tempGoals.work / 60) * 60 + parseInt(e.target.value || 0)})}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="min"
                      />
                      <span className="text-sm">min</span>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-green-900">😴 Repos</span>
                    <span className="text-sm text-gray-600">
                      {Math.floor(restToday / 60)}h {Math.round(restToday % 60)}min / {Math.floor(goals.rest / 60)}h {goals.rest % 60}min
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
                      style={{ width: `${Math.min(restProgress, 100)}%` }}
                    />
                  </div>
                  {editingGoals && (
                    <div className="mt-3 flex gap-2 items-center">
                      <span className="text-sm text-gray-700">Objectif:</span>
                      <input
                        type="number"
                        min="0"
                        value={Math.floor(tempGoals.rest / 60)}
                        onChange={(e) => setTempGoals({...tempGoals, rest: parseInt(e.target.value || 0) * 60 + (tempGoals.rest % 60)})}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="h"
                      />
                      <span className="text-sm">h</span>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={tempGoals.rest % 60}
                        onChange={(e) => setTempGoals({...tempGoals, rest: Math.floor(tempGoals.rest / 60) * 60 + parseInt(e.target.value || 0)})}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="min"
                      />
                      <span className="text-sm">min</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {view === 'stats' && (
            <div className="space-y-6">
              {/* Productivity Score */}
              {productivityScore !== null && (
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-6 border-2 border-amber-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-600" />
                    Score de Productivité Quotidien
                  </h3>
                  <div className="flex items-center gap-6">
                    <div className="text-6xl font-bold text-amber-600">
                      {productivityScore}%
                    </div>
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-500"
                          style={{ width: `${productivityScore}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Basé sur vos évaluations de focus pendant les sessions de travail
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  7 derniers jours
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getLast7Days()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="work" fill="#3b82f6" name="Travail" />
                    <Bar dataKey="rest" fill="#10b981" name="Repos" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Répartition Globale</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Répartition par Tags</h3>
                  {tagBreakdown.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={tagBreakdown}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {tagBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-gray-500">
                      Aucune donnée avec tags aujourd'hui
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {view === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <Calendar className="w-5 h-5 text-gray-600" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                />
                <div className="ml-auto text-sm text-gray-600">
                  Total: {dailySessions.length} session(s)
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {dailySessions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Aucune session pour cette date
                  </div>
                ) : (
                  dailySessions.map((session) => (
                    <div
                      key={session.id}
                      className={`p-4 rounded-lg border-l-4 ${
                        session.category === 'work' 
                          ? 'bg-blue-50 border-blue-500' 
                          : 'bg-green-50 border-green-500'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{session.category === 'work' ? '💼' : '😴'}</span>
                          <div>
                            <div className="font-semibold text-gray-800 flex items-center gap-2">
                              {session.category === 'work' ? 'Travail' : 'Repos'}
                              {session.tag && (
                                <span className={`px-2 py-0.5 rounded-full text-xs ${
                                  session.category === 'work' ? 'bg-blue-200 text-blue-800' : 'bg-green-200 text-green-800'
                                }`}>
                                  {session.tag}
                                </span>
                              )}
                              {session.rating && (
                                <span className="flex items-center gap-1 text-amber-600">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-3 h-3 ${i < session.rating ? 'fill-current' : ''}`} />
                                  ))}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600">
                              {new Date(session.timestamp).toLocaleTimeString('fr-FR')}
                            </div>
                          </div>
                        </div>
                        <div className="text-lg font-bold text-gray-800">
                          {formatMinutes(session.duration)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Évaluez votre session</h3>
              <button onClick={skipRating} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <p className="text-gray-600 mb-6">
              Comment évaluez-vous votre niveau de concentration pendant cette session de travail ?
            </p>
            
            <div className="flex justify-center gap-2 mb-8">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-12 h-12 ${
                      star <= rating 
                        ? 'fill-amber-400 text-amber-400' 
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={skipRating}
                className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition"
              >
                Passer
              </button>
              <button
                onClick={saveRatedSession}
                disabled={rating === 0}
                className={`flex-1 px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                  rating > 0
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Check className="w-5 h-5" />
                Valider
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeTracker;