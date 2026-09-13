// mock 徽标：标记 seed 演示数据。带 onClick 时可点击认领（去除 mock 标记）。
import type { CSSProperties } from 'react';

interface MockBadgeProps {
  onClick?: () => void;
  className?: string;
}

const CHIP_STYLE: CSSProperties = {
  fontSize: 10,
  lineHeight: '14px',
  padding: '0 5px',
  borderRadius: 4,
  border: '1px dashed var(--color-border, #cbd5e1)',
  color: 'var(--color-text-tertiary, #94a3b8)',
  backgroundColor: 'transparent',
};

const TITLE = '演示数据（mock）：seed 写入；认领后重跑 seed 不再覆盖';

export default function MockBadge({ onClick, className = '' }: MockBadgeProps) {
  if (onClick) {
    return (
      <button
        type="button"
        title={`${TITLE}——点击认领`}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className={className}
        style={{ ...CHIP_STYLE, cursor: 'pointer' }}
      >
        mock
      </button>
    );
  }
  return (
    <span title={TITLE} className={className} style={CHIP_STYLE}>
      mock
    </span>
  );
}

// 编辑表单里的认领开关：仅当记录仍为 mock 时显示，取消勾选即认领。
export function MockClaimField({ isMock, onChange }: { isMock: boolean; onChange: (v: boolean) => void }) {
  if (!isMock) return null;
  return (
    <label
      className="flex items-center gap-2 text-xs cursor-pointer"
      style={{ color: 'var(--color-text-tertiary)' }}
    >
      <input type="checkbox" checked onChange={(e) => onChange(e.target.checked)} />
      演示数据（mock）——取消勾选并保存即认领，重跑 seed 不再覆盖这条
    </label>
  );
}
