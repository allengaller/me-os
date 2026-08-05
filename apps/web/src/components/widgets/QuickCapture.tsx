import { useState } from 'react';
import { Lightbulb, CornerDownLeft } from 'lucide-react';

interface CapturedIdea {
  id: string;
  content: string;
  time: string;
}

export default function QuickCapture() {
  const [text, setText] = useState('');
  const [ideas, setIdeas] = useState<CapturedIdea[]>([]);

  const capture = () => {
    const content = text.trim();
    if (!content) return;
    const now = new Date();
    setIdeas((prev) =>
      [
        {
          id: Date.now().toString(),
          content,
          time: `${now.getHours().toString().padStart(2, '0')}:${now
            .getMinutes()
            .toString()
            .padStart(2, '0')}`,
        },
        ...prev,
      ].slice(0, 3)
    );
    setText('');
  };

  return (
    <div className="card p-5 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb size={14} style={{ color: 'var(--color-text-tertiary)' }} />
        <h3
          className="text-base font-medium"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          快速捕捉
        </h3>
      </div>

      {/* Input */}
      <div className="relative mb-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              capture();
            }
          }}
          placeholder="闪过的念头、灵感、待查..."
          rows={2}
          className="w-full text-sm rounded-lg p-3 resize-none outline-none"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border-light)',
            color: 'var(--color-text-primary)',
          }}
        />
        {text.trim() && (
          <button
            onClick={capture}
            className="absolute bottom-2 right-2 p-1 rounded transition-colors"
            style={{ color: 'var(--color-text-tertiary)' }}
            title="按 Enter 保存"
          >
            <CornerDownLeft size={14} />
          </button>
        )}
      </div>

      {/* Captured ideas */}
      <div className="flex-1 space-y-2 overflow-y-auto">
        {ideas.length === 0 ? (
          <p
            className="text-xs text-center py-4"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            随手记下的想法会出现在这里
          </p>
        ) : (
          ideas.map((idea) => (
            <div
              key={idea.id}
              className="flex items-start gap-2 py-1.5 px-2 rounded-md"
              style={{ backgroundColor: 'var(--color-bg-secondary)' }}
            >
              <span
                className="text-[10px] flex-shrink-0 mt-0.5"
                style={{
                  color: 'var(--color-text-tertiary)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {idea.time}
              </span>
              <span
                className="text-xs flex-1"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {idea.content}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
