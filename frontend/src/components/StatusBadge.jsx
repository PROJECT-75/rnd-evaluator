import React from 'react';
import { STATUS } from '../lib/verdict.js';
import { CheckIcon, AlertIcon, XIcon, MinusIcon } from './Icons.jsx';

const ICONS = { check: CheckIcon, alert: AlertIcon, x: XIcon, minus: MinusIcon };

export default function StatusBadge({ status = 'neutral', icon = 'minus', children, size = 'sm' }) {
  const s = STATUS[status] || STATUS.neutral;
  const I = ICONS[icon] || MinusIcon;
  const pad = size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs';
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border font-semibold ${pad} ${s.soft} ${s.text}`}>
      <span className={`flex h-4 w-4 items-center justify-center rounded-full ${s.dot} text-white`}>
        <I className="h-2.5 w-2.5" strokeWidth="3.5" />
      </span>
      {children}
    </span>
  );
}
