
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  BarChart3, 
  BrainCircuit, 
  Search, 
  BookOpen,
  Settings,
  X,
  Key
} from 'lucide-react';
import { Word, AppMode } from './types';
import WordList from './components/WordList';
import ReviewSession from './components/ReviewSession';
import StatsDashboard from './components/StatsDashboard';
import { getWordSuggestion } from './services/ai_service';

const STORAGE_KEY = 'kotoba_log_words';

const App: React.FC = () => {
  const [words, setWords] = useState<Word[]>([]);
  const [mode, setMode] = useState<AppMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [quickInput, setQuickInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [deepSeekKey, setDeepSeekKey] = useState(localStorage.getItem('deepseek_api_key') || '');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) try { setWords(JSON.parse(saved)); } catch (e) {}
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
  }, [words]);

  // 自动解析 pending 单词
  useEffect(() => {
    const pendingWord = words.find(w => w.status === 'pending');
    if (pendingWord) {
      const enrich = async () => {
        const suggestion = await getWordSuggestion(pendingWord.kanji);
        if (suggestion) {
          setWords(prev => prev.map(w => 
            w.id === pendingWord.id ? { ...w, ...suggestion, status: 'completed' as const } : w
          ));
        } else {
          setWords(prev => prev.map(w => w.id === pendingWord.id ? { ...w, status: 'failed' as const } : w));
        }
      };
      enrich();
    }
  }, [words]);

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    const newWord: Word = {
      id: crypto.randomUUID(),
      kanji: quickInput.trim(),
      reading: '',
      meaning: '正在解析...',
      category: '通用',
      level: 'N3',
      masteryLevel: 0,
      nextReviewDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    setWords(prev => [newWord, ...prev]);
    setQuickInput('');
  };

  const saveSettings = () => {
    localStorage.setItem('deepseek_api_key', deepSeekKey);
    setShowSettings(false);
    alert('设置已保存');
  };

  const wordsToReview = words.filter(w => new Date(w.nextReviewDate) <= new Date());

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfaf2] pb-20">
      {/* 顶部状态栏 */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-20 px-4 py-3 flex justify-between items-center border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <div className="bg-red-600 p-1 rounded-lg text-white">
            <BookOpen size={20} />
          </div>
          <span className="font-bold text-gray-800">言葉ログ</span>
        </div>
        <button onClick={() => setShowSettings(true)} className="p-2 text-gray-400">
          <Settings size={20} />
        </button>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full p-4">
        {mode === 'list' && (
          <div className="space-y-6">
            <form onSubmit={handleQuickAdd} className="relative">
              <input 
                type="text" 
                placeholder="输入单词按回车..." 
                className="w-full bg-white px-6 py-4 rounded-2xl shadow-sm border-none focus:ring-2 focus:ring-red-500 text-lg font-mincho"
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
              />
              <button type="submit" className="absolute right-2 top-2 bottom-2 bg-red-600 text-white px-4 rounded-xl font-bold">
                添加
              </button>
            </form>

            <div className="flex items-center bg-white/50 px-4 py-2 rounded-xl border border-gray-100">
              <Search size={16} className="text-gray-400 mr-2" />
              <input 
                type="text" 
                placeholder="搜索词库" 
                className="bg-transparent border-none focus:ring-0 text-sm w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <WordList 
              words={words.filter(w => w.kanji.includes(searchQuery) || w.meaning.includes(searchQuery))} 
              onDelete={(id) => setWords(prev => prev.filter(w => w.id !== id))} 
            />
          </div>
        )}

        {mode === 'review' && (
          <ReviewSession 
            words={wordsToReview} 
            onFinishReview={(id, correct) => {
              setWords(prev => prev.map(w => {
                if (w.id !== id) return w;
                const newMastery = correct ? Math.min(5, w.masteryLevel + 1) : Math.max(0, w.masteryLevel - 1);
                const next = new Date();
                next.setDate(next.getDate() + Math.pow(2, newMastery));
                return { ...w, masteryLevel: newMastery, nextReviewDate: next.toISOString() };
              }));
            }} 
            onExit={() => setMode('list')} 
          />
        )}

        {mode === 'stats' && <StatsDashboard words={words} />}
      </main>

      {/* 底部导航栏 - 针对手机优化 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-2 flex justify-around items-center z-30 pb-safe">
        <button 
          onClick={() => setMode('list')}
          className={`flex flex-col items-center p-2 ${mode === 'list' ? 'text-red-600' : 'text-gray-400'}`}
        >
          <BookOpen size={24} />
          <span className="text-[10px] mt-1 font-bold">词库</span>
        </button>
        <button 
          onClick={() => setMode('review')}
          className={`flex flex-col items-center p-2 relative ${mode === 'review' ? 'text-red-600' : 'text-gray-400'}`}
        >
          <BrainCircuit size={24} />
          <span className="text-[10px] mt-1 font-bold">复习</span>
          {wordsToReview.length > 0 && (
            <span className="absolute top-1 right-1 bg-red-600 text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full">
              {wordsToReview.length}
            </span>
          )}
        </button>
        <button 
          onClick={() => setMode('stats')}
          className={`flex flex-col items-center p-2 ${mode === 'stats' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <BarChart3 size={24} />
          <span className="text-[10px] mt-1 font-bold">统计</span>
        </button>
      </nav>

      {/* 设置面板弹窗 */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-8 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">接口设置</h2>
              <button onClick={() => setShowSettings(false)} className="p-2 bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-500 mb-2 block flex items-center">
                  <Key size={14} className="mr-1" /> DeepSeek API Key
                </label>
                <input 
                  type="password"
                  placeholder="sk-..."
                  className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500"
                  value={deepSeekKey}
                  onChange={(e) => setDeepSeekKey(e.target.value)}
                />
                <p className="text-[10px] text-gray-400 mt-2">
                  * 如果为空，系统将自动使用默认的 Gemini 接口。
                </p>
              </div>
              <button 
                onClick={saveSettings}
                className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl active:scale-95 transition-all"
              >
                保存配置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
