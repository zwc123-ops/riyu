
import React from 'react';
import { Trash2, ExternalLink, Lightbulb, Loader2, ChevronRight } from 'lucide-react';
import { Word } from '../types';

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
          className={`bg-white p-5 rounded-2xl border border-gray-50 shadow-sm active:scale-[0.98] transition-all relative ${word.status === 'pending' ? 'opacity-70' : ''}`}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                {word.status === 'pending' ? (
                  <Loader2 size={12} className="animate-spin text-red-500" />
                ) : (
                  <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">{word.reading}</span>
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

          {word.status === 'completed' && word.example && (
             <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between group">
                <p className="text-xs text-gray-400 italic line-clamp-1 flex-1">
                  {word.example}
                </p>
                <div className="flex space-x-2 ml-2">
                  <button onClick={() => window.open(`https://jisho.org/search/${word.kanji}`, '_blank')} className="p-2 text-blue-400">
                    <ExternalLink size={14} />
                  </button>
                  <button onClick={() => onDelete(word.id)} className="p-2 text-gray-300">
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
