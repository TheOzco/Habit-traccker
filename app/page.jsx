import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Trash2, Check, X, Download } from 'lucide-react';

export default function HabitTracker() {
  const [habits, setHabits] = useState([]);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitType, setNewHabitType] = useState('positive');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [reminderTime, setReminderTime] = useState('09:00');

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('habits');
      if (saved) setHabits(JSON.parse(saved));
    } catch (e) {
      console.error('Error loading habits:', e);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('habits', JSON.stringify(habits));
    } catch (e) {
      console.error('Error saving habits:', e);
    }
  }, [habits]);

  const addHabit = () => {
    if (!newHabitName.trim()) return;
    const newHabit = {
      id: Date.now(),
      name: newHabitName,
      type: newHabitType,
      createdAt: new Date().toISOString(),
      logs: [],
      reminderTime: reminderTime,
    };
    setHabits([...habits, newHabit]);
    setNewHabitName('');
    setNewHabitType('positive');
    setShowAddForm(false);
  };

  const deleteHabit = (id) => {
    setHabits(habits.filter(h => h.id !== id));
    setSelectedHabit(null);
  };

  const toggleHabitToday = (id) => {
    const today = new Date().toISOString().split('T')[0];
    const updated = habits.map(h => {
      if (h.id === id) {
        const hasLog = h.logs.find(log => log.date === today);
        if (hasLog) {
          return { ...h, logs: h.logs.filter(log => log.date !== today) };
        } else {
          return { ...h, logs: [...h.logs, { date: today, completed: true }] };
        }
      }
      return h;
    });
    setHabits(updated);
  };

  const getStats = (habit) => {
    const today = new Date();
    let streak = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const hasLog = habit.logs.some(log => log.date === dateStr);
      if (hasLog) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (streak > 0) {
        break;
      } else {
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recent = habit.logs.filter(log => new Date(log.date) >= thirtyDaysAgo);
    const successRate = habit.logs.length > 0 ? Math.round((recent.length / 30) * 100) : 0;

    return { totalDays: habit.logs.length, streak, successRate, recent };
  };

  const getChartData = (habit) => {
    const data = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const hasLog = habit.logs.some(log => log.date === dateStr);
      data.push({
        date: date.toLocaleDateString('fa-IR', { month: 'numeric', day: 'numeric' }),
        completed: hasLog ? 1 : 0,
      });
    }
    return data;
  };

  const exportPDF = (habit) => {
    const stats = getStats(habit);
    const today = new Date().toLocaleDateString('fa-IR');
    const text = `
گزارش عادت: ${habit.name}
تاریخ: ${today}

کل روزهای تکمیل شده: ${stats.totalDays}
استریک فعلی: ${stats.streak} روز
درصد موفقیت (30 روز): ${stats.successRate}%
نوع عادت: ${habit.type === 'positive' ? 'مثبت' : 'منفی (ترک)'}

آخرین فعالیت‌ها:
${habit.logs.slice(-10).reverse().map(log => log.date).join('\n')}
    `;
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${habit.name}-${today}.txt`;
    link.click();
  };

  const isCompletedToday = (habit) => {
    const today = new Date().toISOString().split('T')[0];
    return habit.logs.some(log => log.date === today);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 mb-2">
            🎯 Habit Tracker
          </h1>
          <p className="text-slate-300">تکمیل عادت‌های خود را ردیابی کنید</p>
        </div>

        {/* Add Habit Button */}
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 mb-6"
          >
            <Plus size={24} />
            عادت جدید اضافه کنید
          </button>
        )}

        {/* Add Form */}
        {showAddForm && (
          <div className="bg-slate-800/50 border border-purple-500/50 rounded-lg p-6 mb-6 space-y-4">
            <input
              type="text"
              placeholder="نام عادت"
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-purple-500 outline-none"
            />

            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="positive"
                  checked={newHabitType === 'positive'}
                  onChange={(e) => setNewHabitType(e.target.value)}
                />
                <span className="text-slate-300">✅ مثبت</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="negative"
                  checked={newHabitType === 'negative'}
                  onChange={(e) => setNewHabitType(e.target.value)}
                />
                <span className="text-slate-300">🚭 ترک</span>
              </label>
            </div>

            <div className="flex gap-2">
              <button
                onClick={addHabit}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg"
              >
                اضافه کن
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 bg-slate-700 text-white py-2 rounded-lg"
              >
                لغو
              </button>
            </div>
          </div>
        )}

        {/* Habits List */}
        <div className="space-y-4">
          {habits.length === 0 ? (
            <div className="bg-slate-800/30 border-2 border-dashed border-slate-600 rounded-lg p-8 text-center text-slate-400">
              <p>هنوز عادتی اضافه نشده</p>
            </div>
          ) : (
            habits.map(habit => {
              const stats = getStats(habit);
              const completed = isCompletedToday(habit);

              return (
                <div
                  key={habit.id}
                  onClick={() => setSelectedHabit(selectedHabit?.id === habit.id ? null : habit)}
                  className={`bg-gradient-to-r ${
                    habit.type === 'positive'
                      ? 'from-emerald-900/40 to-teal-900/40'
                      : 'from-red-900/40 to-rose-900/40'
                  } border border-slate-600 rounded-lg p-5 cursor-pointer`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-white">{habit.name}</h3>
                      <div className="flex flex-wrap gap-3 text-sm mt-2">
                        <span className="text-yellow-300">🔥 {stats.streak} روز</span>
                        <span className="text-blue-300">📊 {stats.totalDays} روز</span>
                        <span className="text-purple-300">📈 {stats.successRate}%</span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleHabitToday(habit.id);
                      }}
                      className={`p-3 rounded-lg ${
                        completed ? 'bg-green-600' : 'bg-slate-700'
                      } text-white`}
                    >
                      {completed ? <Check size={24} /> : <X size={24} />}
                    </button>
                  </div>

                  {/* Expanded */}
                  {selectedHabit?.id === habit.id && (
                    <div className="mt-4 pt-4 border-t border-slate-600 space-y-4">
                      {/* Chart */}
                      <div className="bg-slate-900/50 rounded-lg p-4">
                        <p className="text-slate-300 text-sm mb-3">30 روز گذشته</p>
                        <ResponsiveContainer width="100%" height={150}>
                          <BarChart data={getChartData(habit)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                            <YAxis stroke="#9ca3af" />
                            <Tooltip />
                            <Bar dataKey="completed" fill="#8b5cf6" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            exportPDF(habit);
                          }}
                          className="bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center gap-2"
                        >
                          <Download size={18} />
                          دانلود
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteHabit(habit.id);
                          }}
                          className="bg-red-900/50 text-red-300 py-2 rounded-lg"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-slate-400 text-sm">
          <p>💪 هر روز یک گام به سمت بهتر شدن</p>
        </div>
      </div>
    </div>
  );
}
