
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  BarChart3, 
  BrainCircuit, 
  Search, 
  BookOpen,
  Loader2,
  Sparkles
} from 'lucide-react';
import { Word, AppMode } from './types';
import WordList from './components/WordList';
import ReviewSession from './components/ReviewSession';
import StatsDashboard from './components/StatsDashboard';
import { getWordSuggestion } from './services/gemini';

const STORAGE_KEY = 'kotoba_log_words';

const App: React.FC = () => {
  const [words, setWords] = useState<Word[]>([]);
  const [mode, setMode] = useState<AppMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [quickInput, setQuickInput] = useState('');

  // 初始化加载
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setWords(JSON.parse(saved));
      } catch (e) {
        console.error("加载失败", e);
      }
    }
  }, []);

  // 持久化保存
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
  }, [words]);

  // 自动解析逻辑：寻找状态为 pending 的单词进行 AI 填充
  useEffect(() => {
    const pendingWord = words.find(w => w.status === 'pending');
    if (pendingWord) {
      const enrich = async () => {
        const suggestion = await getWordSuggestion(pendingWord.kanji);
        if (suggestion) {
          setWords(prev => prev.map(w => 
            w.id === pendingWord.id 
              ? { ...w, ...suggestion, status: 'completed' as const }
              : w
          ));
        } else {
          setWords(prev => prev.map(w => 
            w.id === pendingWord.id ? { ...w, status: 'failed' as const } : w
          ));
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

  const deleteWord = (id: string) => {
    if (window.confirm('确定要删除吗？')) {
      setWords(prev => prev.filter(w => w.id !== id));
    }
  };

  const updateMastery = (id: string, correct: boolean) => {
    setWords(prev => prev.map(w => {
      if (w.id === id) {
        const newMastery = correct ? Math.min(5, w.masteryLevel + 1) : Math.max(0, w.masteryLevel - 1);
        const daysToAdd = Math.pow(2, newMastery); 
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + daysToAdd);
        return { ...w, masteryLevel: newMastery, nextReviewDate: nextDate.toISOString() };
      }
      return w;
    }));
  };

  const filteredWords = words.filter(w => 
    w.kanji.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.reading.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.meaning.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const wordsToReview = words.filter(w => new Date(w.nextReviewDate) <= new Date());

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfaf2]">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setMode('list')}>
            <div className="bg-red-600 p-1.5 rounded-lg text-white">
              <BookOpen size={24} />
            </div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">单词笔记</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setMode('review')} 
              className={`flex items-center space-x-1 px-4 py-2 rounded-full text-sm font-bold transition-all ${mode === 'review' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <BrainCircuit size={18} />
              <span className="hidden sm:inline">复习</span>
              {wordsToReview.length > 0 && (
                <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${mode === 'review' ? 'bg-white text-red-600' : 'bg-red-600 text-white'}`}>
                  {wordsToReview.length}
                </span>
              )}
            </button>
            <button 
              onClick={() => setMode('stats')}
              className={`flex items-center space-x-1 px-4 py-2 rounded-full text-sm font-bold transition-all ${mode === 'stats' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <BarChart3 size={18} />
              <span className="hidden sm:inline">统计</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 pb-24">
        {mode === 'list' && (
          <div className="space-y-6">
            {/* 极简添加栏 */}
            <form onSubmit={handleQuickAdd} className="relative group">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                <Plus className="text-red-400 group-focus-within:text-red-600 transition-colors" size={24} />
              </div>
              <input 
                type="text" 
                placeholder="直接输入单词，按回车添加..." 
                className="w-full bg-white pl-14 pr-32 py-5 rounded-[28px] shadow-sm border-2 border-transparent focus:border-red-100 focus:ring-0 text-xl font-mincho transition-all placeholder:text-gray-300 placeholder:font-sans"
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
              />
              <div className="absolute right-3 top-3 flex items-center space-x-2">
                {quickInput && (
                   <button type="submit" className="bg-red-600 text-white px-5 py-2.5 rounded-2xl font-bold text-sm shadow-lg shadow-red-100 active:scale-95 transition-all">
                     添加
                   </button>
                )}
                {!quickInput && (
                  <div className="bg-gray-50 text-gray-300 px-3 py-2 rounded-xl text-[10px] font-bold uppercase flex items-center">
                    <Sparkles size={12} className="mr-1" />
                    AI 自动补全
                  </div>
                )}
              </div>
            </form>

            {/* 搜索栏 */}
            <div className="flex items-center space-x-2 bg-white/50 p-2 rounded-2xl border border-gray-100">
              <Search className="text-gray-400 ml-2" size={20} />
              <input 
                type="text" 
                placeholder="搜索词库..." 
                className="w-full bg-transparent border-none focus:ring-0 py-2 text-sm text-gray-700"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <WordList words={filteredWords} onDelete={deleteWord} />
          </div>
        )}

        {mode === 'review' && (
          <ReviewSession words={wordsToReview} onFinishReview={updateMastery} onExit={() => setMode('list')} />
        )}

        {mode === 'stats' && (
          <StatsDashboard words={words} />
        )}
      </main>
    </div>
  );
};

export default App;
