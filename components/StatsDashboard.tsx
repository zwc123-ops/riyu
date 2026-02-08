
import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Word } from '../types';

interface StatsDashboardProps {
  words: Word[];
}

const COLORS = ['#ef4444', '#f97316', '#22c55e', '#3b82f6', '#a855f7', '#94a3b8'];

const StatsDashboard: React.FC<StatsDashboardProps> = ({ words }) => {
  const masteryData = [0, 1, 2, 3, 4, 5].map(level => ({
    name: `等级 ${level}`,
    count: words.filter(w => w.masteryLevel === level).length
  }));

  const levelCounts = words.reduce((acc: any, w) => {
    acc[w.level] = (acc[w.level] || 0) + 1;
    return acc;
  }, {});

  const levelData = Object.keys(levelCounts).map(k => ({
    name: k === 'Other' ? '其他' : k,
    value: levelCounts[k]
  })).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">学习数据统计</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-center">
          <p className="text-sm font-medium text-gray-400 mb-1">单词总量</p>
          <p className="text-4xl font-bold text-gray-800">{words.length}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-center">
          <p className="text-sm font-medium text-gray-400 mb-1">已掌握 (Lvl 5)</p>
          <p className="text-4xl font-bold text-green-500">{words.filter(w => w.masteryLevel === 5).length}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-center">
          <p className="text-sm font-medium text-gray-400 mb-1">待复习单词</p>
          <p className="text-4xl font-bold text-red-500">{words.filter(w => new Date(w.nextReviewDate) <= new Date()).length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">掌握程度分布</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={masteryData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="count" name="单词数量" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">JLPT 级别分布</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={levelData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {levelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {levelData.map((entry, index) => (
              <div key={entry.name} className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-xs font-medium text-gray-500">{entry.name}: {entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsDashboard;
