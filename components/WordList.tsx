
import React from 'react';
import { Trash2, ExternalLink, Volume2, Loader2 } from 'lucide-react';
import { Word } from '../types';
import { speakJapanese } from '../services/ai_service';

interface WordListProps {
  words: Word[];
  onDelete: (id: string) => void;
}

const WordList: React.FC<WordListProps> = ({ words, onDelete }) => {
  if (words.length === 0) {
    return <div className="text-center py-20 text-gray-300 text-sm">还没有单词，快去添加吧</div>;
  }

  return (
    <div className="space-y-3">
      {words.map((word) => (
        <div 
          key={word.id} 
          className={`bg-white p-5 rounded-2xl border border-gray-50 shadow-sm active:scale-[0.99] transition-all relative ${word.status === 'pending' ? 'opacity-70' : ''}`}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                {word.status === 'pending' ? (
                  <Loader2 size={12} className="animate-spin text-red-500" />
                ) : (
                  <div className="flex items-center space-x-1">
                    <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">{word.reading}</span>
                    <button 
                      onClick={() => speakJapanese(word.kanji)}
                      className="p-1 text-gray-300 hover:text-red-500"
                    >
                      <Volume2 size={12} />
                    </button>
                  </div>
                )}
                <span className="text-[8px] px-1.5 py-0.5 bg-gray-100 rounded text-gray-400 font-bold">{word.level}</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 font-mincho">{word.kanji}</h3>
            </div>
            
            <div className="flex space-x-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < word.masteryLevel ? 'bg-green-500' : 'bg-gray-100'}`} />
              ))}
            </div>
          </div>

          <p className="mt-2 text-gray-600 font-medium">{word.meaning}</p>

          {word.status === 'completed' && (
             <div className="mt-3 pt-3 border-t border-gray-50">
                {word.example && (
                  <div className="mb-2">
                    <p className="text-xs text-gray-500 font-mincho italic mb-1 leading-snug">{word.example}</p>
                    {word.exampleTranslation && (
                      <p className="text-[10px] text-gray-300">{word.exampleTranslation}</p>
                    )}
                  </div>
                )}
                <div className="flex justify-end items-center space-x-2">
                  <button onClick={() => window.open(`https://jisho.org/search/${word.kanji}`, '_blank')} className="p-2 text-blue-300 hover:text-blue-500 transition-colors">
                    <ExternalLink size={14} />
                  </button>
                  <button onClick={() => onDelete(word.id)} className="p-2 text-gray-200 hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
             </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default WordList;
