
import React, { useState } from 'react';
import { X, Check, RotateCcw, PartyPopper, Volume2, Loader2 } from 'lucide-react';
import { Word } from '../types';
import { speakJapanese } from '../services/ai_service';

interface ReviewSessionProps {
  words: Word[];
  onFinishReview: (id: string, correct: boolean) => void;
  onExit: () => void;
}

const ReviewSession: React.FC<ReviewSessionProps> = ({ words, onFinishReview, onExit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const currentWord = words[currentIndex];

  const handleAnswer = (correct: boolean) => {
    onFinishReview(currentWord.id, correct);
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      setCompleted(true);
    }
  };

  const handleSpeak = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSpeaking) return;
    setIsSpeaking(true);
    // 如果还没翻面，读汉字；如果翻面了，读句子或单词
    const textToRead = isFlipped ? (currentWord.example || currentWord.kanji) : currentWord.kanji;
    await speakJapanese(textToRead);
    setIsSpeaking(false);
  };

  if (words.length === 0 || completed) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <PartyPopper size={60} className="text-yellow-500" />
        <h2 className="text-2xl font-bold">今日复习完成！</h2>
        <button onClick={onExit} className="bg-red-600 text-white px-8 py-3 rounded-full font-bold">返回词库</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-180px)]">
      <div className="flex justify-between items-center mb-4 px-2">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
          卡片 {currentIndex + 1} / {words.length}
        </span>
        <div className="h-1 flex-1 mx-4 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-red-500 transition-all" style={{ width: `${(currentIndex / words.length) * 100}%` }} />
        </div>
      </div>

      <div 
        className={`flex-1 bg-white rounded-[40px] shadow-xl border border-gray-100 p-8 flex flex-col items-center justify-center relative transition-all duration-500 cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* 发音按钮 */}
        <button 
          onClick={handleSpeak}
          className={`absolute top-6 right-6 p-4 bg-gray-50 rounded-full text-red-500 hover:bg-red-50 active:scale-90 transition-all z-10 ${isSpeaking ? 'animate-pulse' : ''}`}
        >
          {isSpeaking ? <Loader2 size={24} className="animate-spin" /> : <Volume2 size={24} />}
        </button>

        {!isFlipped ? (
          <h3 className="text-6xl font-bold font-mincho text-gray-800 text-center">{currentWord.kanji}</h3>
        ) : (
          <div className="text-center space-y-6 rotate-y-180 w-full max-w-sm">
            <div>
              <p className="text-sm font-bold text-red-500 mb-1">{currentWord.reading}</p>
              <h3 className="text-4xl font-bold text-gray-800">{currentWord.meaning}</h3>
            </div>
            {currentWord.example && (
              <div className="space-y-2 bg-gray-50 p-4 rounded-2xl">
                <p className="text-sm text-gray-600 font-mincho leading-relaxed">
                  {currentWord.example}
                </p>
                {currentWord.exampleTranslation && (
                  <p className="text-[12px] text-gray-400 font-medium">
                    {currentWord.exampleTranslation}
                  </p>
                )}
              </div>
            )}
            {currentWord.mnemonic && (
              <p className="text-[10px] text-orange-400 font-bold bg-orange-50 px-3 py-1 rounded-full inline-block">
                💡 {currentWord.mnemonic}
              </p>
            )}
          </div>
        )}
        <div className="absolute bottom-10 text-gray-300 text-[10px] font-bold uppercase tracking-widest">点击翻转卡片</div>
      </div>

      <div className="flex justify-center items-center space-x-10 mt-8">
        <button 
          onClick={() => handleAnswer(false)}
          className="w-16 h-16 rounded-full border-2 border-red-500 text-red-500 flex items-center justify-center active:bg-red-500 active:text-white transition-all shadow-lg shadow-red-100"
        >
          <X size={32} />
        </button>
        <button 
          onClick={() => setIsFlipped(!isFlipped)}
          className="w-14 h-14 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center active:scale-90 transition-all"
        >
          <RotateCcw size={24} />
        </button>
        <button 
          onClick={() => handleAnswer(true)}
          className="w-16 h-16 rounded-full border-2 border-green-500 text-green-500 flex items-center justify-center active:bg-green-500 active:text-white transition-all shadow-lg shadow-green-100"
        >
          <Check size={32} />
        </button>
      </div>

      <style>{`
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
};

export default ReviewSession;
