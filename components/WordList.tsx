
import React from 'react';
import { Trash2, ExternalLink, Lightbulb, Loader2 } from 'lucide-react';
import { Word } from '../types';

interface WordListProps {
  words: Word[];
  onDelete: (id: string) => void;
}

const MasteryBadge: React.FC<{ level: number }> = ({ level }) => {
  const dots = [];
  for (let i = 1; i <= 5; i++) {
    dots.push(
      <div 
        key={i} 
        className={`w-2 h-2 rounded-full ${i <= level ? 'bg-green-500' : 'bg-gray-200'}`} 
      />
    );
  }
  return <div className="flex space-x-1">{dots}</div>;
};

const WordList: React.FC<WordListProps> = ({ words, onDelete }) => {
  if (words.length === 0) {
    return (
      <div className="text-center py-20 opacity-30">
        <p>词库暂无单词</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {words.map((word) => (
        <div key={word.id} className={`group bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm transition-all relative overflow-hidden ${word.status === 'pending' ? 'animate-pulse' : ''}`}>
          
          <div className="flex justify-between items-start mb-4">
            <div>
              {word.status === 'pending' ? (
                <div className="flex items-center space-x-2 text-red-500 text-xs font-bold mb-1">
                  <Loader2 className="animate-spin" size={14} />
                  <span>AI 正在解析中...</span>
                </div>
              ) : (
                <p className="text-sm text-gray-400 font-medium mb-1">{word.reading || '等待解析'}</p>
              )}
              <h3 className="text-3xl font-bold text-gray-800 font-mincho">{word.kanji}</h3>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <span className="px-2 py-0.5 bg-gray-100 text-[10px] font-bold rounded-lg text-gray-400">
                {word.level}
              </span>
              <MasteryBadge level={word.masteryLevel} />
            </div>
          </div>

          <div className="mb-4">
            <p className={`text-xl font-medium ${word.status === 'pending' ? 'text-gray-300 italic' : 'text-gray-700'}`}>
              {word.meaning}
            </p>
          </div>

          {word.status === 'completed' && (
            <>
              {word.mnemonic && (
                <div className="bg-amber-50 p-3 rounded-2xl mb-4 text-xs text-amber-800 flex items-start space-x-2">
                  <Lightbulb size={14} className="mt-0.5 flex-shrink-0" />
                  <p>{word.mnemonic}</p>
                </div>
              )}

              {word.example && (
                <div className="border-l-4 border-red-50 pl-4 py-1 mb-4">
                  <p className="text-sm font-mincho text-gray-600 leading-relaxed italic">"{word.example}"</p>
                  <p className="text-[10px] text-gray-400 mt-1">{word.exampleTranslation}</p>
                </div>
              )}
            </>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-gray-50">
            <span className="text-[10px] text-gray-300">
              {new Date(word.createdAt).toLocaleDateString('zh-CN')}
            </span>
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => window.open(`https://jisho.org/search/${word.kanji}`, '_blank')}
                className="p-2 text-blue-400 hover:bg-blue-50 rounded-xl transition-colors"
                title="词典查询"
              >
                <ExternalLink size={16} />
              </button>
              <button 
                onClick={() => onDelete(word.id)}
                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                title="删除"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default WordList;
