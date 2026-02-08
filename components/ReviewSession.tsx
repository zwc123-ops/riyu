
import React, { useState } from 'react';
import { X, Check, Eye, RotateCcw, PartyPopper, Award } from 'lucide-react';
import { Word } from '../types';

interface ReviewSessionProps {
  words: Word[];
  onFinishReview: (id: string, correct: boolean) => void;
  onExit: () => void;
}

const ReviewSession: React.FC<ReviewSessionProps> = ({ words, onFinishReview, onExit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [sessionResults, setSessionResults] = useState<{ id: string; correct: boolean }[]>([]);

  const currentWord = words[currentIndex];

  const handleAnswer = (correct: boolean) => {
    if (!currentWord) return;
    
    setSessionResults(prev => [...prev, { id: currentWord.id, correct }]);
    onFinishReview(currentWord.id, correct);

    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      setCompleted(true);
    }
  };

  if (words.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-10 text-center shadow-lg border border-gray-100 max-w-lg mx-auto mt-10">
        <PartyPopper size={64} className="mx-auto text-green-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">任务完成！</h2>
        <p className="text-gray-500 mb-6">现在没有需要复习的单词了。请稍后再来！</p>
        <button onClick={onExit} className="bg-gray-100 text-gray-600 px-6 py-2 rounded-full font-bold hover:bg-gray-200 transition-colors">
          返回主页
        </button>
      </div>
    );
  }

  if (completed) {
    const score = sessionResults.filter(r => r.correct).length;
    return (
      <div className="bg-white rounded-3xl p-10 text-center shadow-lg border border-gray-100 max-w-lg mx-auto mt-10">
        <Award size={64} className="mx-auto text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">复习结束！</h2>
        <p className="text-gray-500 mb-6">本次复习共回答正确 {score} / {words.length} 个单词。</p>
        <button onClick={onExit} className="bg-red-600 text-white px-8 py-3 rounded-full font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100">
          完成本次练习
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 mt-4">
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-red-500 transition-all duration-300"
          style={{ width: `${((currentIndex) / words.length) * 100}%` }}
        />
      </div>

      <div className="flex justify-between items-center text-sm font-medium text-gray-400 px-2">
        <button onClick={onExit} className="flex items-center space-x-1 hover:text-gray-600 transition-colors">
          <X size={16} />
          <span>退出复习</span>
        </button>
        <span>第 {currentIndex + 1} 个，共 {words.length} 个</span>
      </div>

      <div className="relative perspective-1000 group">
        <div 
          className={`relative min-h-[450px] w-full transition-all duration-500 preserve-3d cursor-pointer rounded-[40px] shadow-2xl ${isFlipped ? 'rotate-y-180' : ''}`}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div className={`absolute inset-0 backface-hidden bg-white p-12 flex flex-col items-center justify-center rounded-[40px] border border-gray-100 ${isFlipped ? 'invisible' : 'visible'}`}>
             <span className="text-xs font-bold text-red-500 uppercase tracking-widest mb-4">读音测试</span>
             <h3 className="text-7xl sm:text-8xl font-bold font-mincho text-gray-800 text-center mb-8">{currentWord.kanji}</h3>
             <p className="text-gray-300 flex items-center space-x-2 animate-pulse">
               <Eye size={16} />
               <span>点击翻转卡片</span>
             </p>
          </div>

          <div className={`absolute inset-0 backface-hidden bg-white p-8 sm:p-12 flex flex-col items-center justify-center rounded-[40px] border border-gray-100 rotate-y-180 ${isFlipped ? 'visible' : 'invisible'}`}>
            <span className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">{currentWord.reading}</span>
            <h3 className="text-4xl sm:text-5xl font-bold text-gray-800 text-center mb-6">{currentWord.meaning}</h3>
            
            {currentWord.example && (
              <div className="text-center space-y-2 max-w-sm mb-6 bg-gray-50 p-4 rounded-2xl">
                <p className="text-gray-600 font-mincho italic text-lg leading-snug">"{currentWord.example}"</p>
                <p className="text-gray-400 text-xs">{currentWord.exampleTranslation}</p>
              </div>
            )}
            
            {currentWord.mnemonic && (
              <div className="bg-indigo-50 text-indigo-700 p-4 rounded-2xl text-sm italic max-w-sm text-center">
                <span className="font-bold block mb-1 uppercase text-[10px]">记忆点</span>
                {currentWord.mnemonic}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-center items-center space-x-8 pt-4">
        <button 
          disabled={!isFlipped}
          onClick={(e) => { e.stopPropagation(); handleAnswer(false); }}
          className="w-20 h-20 rounded-full bg-white text-red-500 border-2 border-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-xl active:scale-95"
          title="我不记得了"
        >
          <X size={40} />
        </button>
        
        <button 
           onClick={() => setIsFlipped(!isFlipped)}
           className="px-10 py-4 rounded-full bg-gray-800 text-white font-bold hover:bg-gray-900 transition-all flex items-center space-x-2 shadow-lg active:scale-95"
        >
          <RotateCcw size={20} />
          <span>翻转</span>
        </button>

        <button 
          disabled={!isFlipped}
          onClick={(e) => { e.stopPropagation(); handleAnswer(true); }}
          className="w-20 h-20 rounded-full bg-white text-green-500 border-2 border-green-500 flex items-center justify-center hover:bg-green-500 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-xl active:scale-95"
          title="记住了！"
        >
          <Check size={40} />
        </button>
      </div>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
};

export default ReviewSession;
