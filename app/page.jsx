import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Plus, Trash2, Check, X, Download, Bell, Settings } from 'lucide-react';

const HabitTracker = () => {
  const [habits, setHabits] = useState([]);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitType, setNewHabitType] = useState('positive');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [reminderTime, setReminderTime] = useState('09:00');

  // Load habits from localStorage on mount
  useEffect(() => {
    const savedHabits = localStorage.getItem('habits');
    if (savedHabits) {
      setHabits(JSON.parse(savedHabits));
    }
  }, []);

  // Save habits to localStorage
  useEffect(() => {
    localStorage.setItem('habits', JSON.stringify(habits));
  }, [habits]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const addHabit = () => {
    if (!newHabitName.trim()) return;

    const newHabit = {
      id: Date.now(),
      name: newHabitName,
      type: newHabitType,
      createdAt: new Date().toISOString(),
      logs: [],
      reminderTime: reminderTime,
      streak: 0,
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
    const updatedHabits = habits.map(h => {
      if (h.id === id) {
        const existingLog = h.logs.find(log => log.date === today);
        if (existingLog) {
          return {
            ...h,
            logs: h.logs.filter(log => log.date !== today)
          };
        } else {
          return {
            ...h,
            logs: [...h.logs, { date: today, completed: true }]
          };
        }
      }
      return h;
    });
    setHabits(updatedHabits);
  };

  const getHabitStats = (habit) => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentLogs = habit.logs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= thirtyDaysAgo && logDate <= today;
    });

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

    const successRate = habit.logs.length > 0 
      ? Math.round((recentLogs.length / 30) * 100) 
      : 0;

    return {
      totalDays: habit.logs.length,
      streak,
      successRate,
      recentLogs
    };
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
        dateStr
      });
    }
    return data;
  };

  const exportToPDF = (habit) => {
    const stats = getHabitStats(habit);
    const today = new Date().toLocaleDateString('fa-IR');

    let pdfContent = `
%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >>
endobj
5 0 obj
<< /Length 800 >>
stream
BT
/F1 16 Tf
50 750 Td
(گزارش عادت: ${habit.name}) Tj
0 -30 Td
/F1 12 Tf
(تاریخ: ${today}) Tj
0 -20 Td
(کل روزهای تکمیل شده: ${stats.totalDays}) Tj
0 -20 Td
(استریک فعلی: ${stats.streak} روز) Tj
0 -20 Td
(درصد موفقیت (30 روز): ${stats.successRate}%) Tj
0 -20 Td
(نوع عادت: ${habit.type === 'positive' ? 'مثبت' : 'منفی (ترک)'}) Tj
0 -30 Td
/F1 14 Tf
(آخرین فعالیت‌ها:) Tj
0 -15 Td
/F1 10 Tf
${habit.logs.slice(-10).reverse().map(log => `(${log.date}) Tj\n0 -15 Td`).join('')}
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000203 00000 n 
0000000281 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
1130
%%EOF
    `;

    const link = document.createElement('a');
    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    link.href = URL.createObjectURL(blob);
    link.download = `${habit.name}-${today}.pdf`;
    link.click();
  };

  const isCompletedToday = (habit) => {
    const today = new Date().toISOString().split('T')[0];
    return habit.logs.some(log => log.date === today);
  };

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 mb-2">
            🎯 Habit Tracker
          </h1>
          <p className="text-slate-300 text-lg">تکمیل عادت‌های خود را ردیابی کنید و پیشرفت مشاهده کنید</p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Habits List */}
          <div className="lg:col-span-2 space-y-4">
            {/* Add Habit Button */}
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all transform hover:scale-105"
              >
                <Plus size={24} />
                عادت جدید اضافه کنید
              </button>
            )}

            {/* Add Habit Form */}
            {showAddForm && (
              <div className="bg-slate-800/50 backdrop-blur border border-purple-500/50 rounded-lg p-6 space-y-4">
                <input
                  type="text"
                  placeholder="نام عادت (مثال: ورزش، مطالعه، آب خوردن)"
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-purple-500 outline-none transition-colors"
                />

                <div className="space-y-2">
                  <label className="text-slate-300 text-sm font-medium">نوع عادت:</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="positive"
                        checked={newHabitType === 'positive'}
                        onChange={(e) => setNewHabitType(e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="text-slate-300">✅ عادت مثبت (انجام دادن)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="negative"
                        checked={newHabitType === 'negative'}
                        onChange={(e) => setNewHabitType(e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="text-slate-300">🚭 ترک عادت (ترک کردن)</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-slate-300 text-sm font-medium">زمان یادآوری:</label>
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-purple-500 outline-none"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={addHabit}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                  >
                    اضافه کن
                  </button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                  >
                    لغو
                  </button>
                </div>
              </div>
            )}

            {/* Habits Grid */}
            <div className="space-y-3">
              {habits.length === 0 ? (
                <div className="bg-slate-800/30 border-2 border-dashed border-slate-600 rounded-lg p-8 text-center text-slate-400">
                  <p className="text-lg mb-2">هنوز عادتی اضافه نشده</p>
                  <p className="text-sm">شروع کنید و اولین عادت خود را اضافه کنید!</p>
                </div>
              ) : (
                habits.map(habit => {
                  const stats = getHabitStats(habit);
                  const completedToday = isCompletedToday(habit);

                  return (
                    <div
                      key={habit.id}
                      onClick={() => setSelectedHabit(selectedHabit?.id === habit.id ? null : habit)}
                      className={`bg-gradient-to-r ${
                        habit.type === 'positive'
                          ? 'from-emerald-900/40 to-teal-900/40 border-emerald-500/50'
                          : 'from-red-900/40 to-rose-900/40 border-red-500/50'
                      } backdrop-blur border rounded-lg p-5 cursor-pointer transition-all transform hover:scale-102 ${
                        selectedHabit?.id === habit.id ? 'ring-2 ring-purple-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-white">{habit.name}</h3>
                            <span className="text-2xl">
                              {habit.type === 'positive' ? '✅' : '🚭'}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm">
                            <span className="text-yellow-300">
                              🔥 {stats.streak} روز
                            </span>
                            <span className="text-blue-300">
                              📊 {stats.totalDays} روز کل
                            </span>
                            <span className="text-purple-300">
                              📈 {stats.successRate}%
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleHabitToday(habit.id);
                          }}
                          className={`flex-shrink-0 p-3 rounded-lg font-bold text-lg transition-all transform hover:scale-110 ${
                            completedToday
                              ? 'bg-green-600 text-white'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          {completedToday ? <Check size={24} /> : <X size={24} />}
                        </button>
                      </div>

                      {/* Expanded Details */}
                      {selectedHabit?.id === habit.id && (
                        <div className="mt-4 pt-4 border-t border-slate-600 space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowStats(habit.id === showStats ? null : habit.id);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                            >
                              📊 آمار
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                exportToPDF(habit);
                              }}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                            >
                              <Download size={18} />
                              PDF
                            </button>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteHabit(habit.id);
                            }}
                            className="w-full bg-red-900/50 hover:bg-red-800/50 text-red-300 font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                          >
                            <Trash2 size={18} />
                            حذف
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column - Stats */}
          {selectedHabit && showStats === selectedHabit.id && (
            <div className="lg:col-span-1 bg-slate-800/40 backdrop-blur border border-slate-700/50 rounded-lg p-6 space-y-4 max-h-fit sticky top-4">
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                📈 آمار و آنالیز
              </h2>

              {(() => {
                const stats = getHabitStats(selectedHabit);
                const chartData = getChartData(selectedHabit);

                return (
                  <div className="space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-lg p-4 border border-yellow-500/30">
                        <p className="text-yellow-300 text-sm">استریک</p>
                        <p className="text-3xl font-bold text-yellow-400">{stats.streak}</p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-lg p-4 border border-blue-500/30">
                        <p className="text-blue-300 text-sm">کل روزها</p>
                        <p className="text-3xl font-bold text-blue-400">{stats.totalDays}</p>
                      </div>
                      <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-lg p-4 border border-green-500/30">
                        <p className="text-green-300 text-sm">درصد موفقیت</p>
                        <p className="text-3xl font-bold text-green-400">{stats.successRate}%</p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-lg p-4 border border-purple-500/30">
                        <p className="text-purple-300 text-sm">30 روز اخیر</p>
                        <p className="text-3xl font-bold text-purple-400">{stats.recentLogs.length}</p>
                      </div>
                    </div>

                    {/* Chart */}
                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <p className="text-slate-300 text-sm font-medium mb-3">30 روز گذشته</p>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} angle={-45} height={60} stroke="#9ca3af" />
                          <YAxis stroke="#9ca3af" />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                            formatter={(value) => value ? '✓' : '✗'}
                          />
                          <Bar dataKey="completed" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-slate-400 text-sm">
          <p>💪 هر روز یک گام به سمت بهتر شدن | تمام داده‌ها در مرورگر شما ذخیره می‌شوند</p>
        </div>
      </div>
    </div>
  );
};

export default HabitTracker;
