import type { ReactNode } from 'react';
import { GARAU_GREY } from '../lib/garauColour';

/** A panel filled with Garau's mid grey, for the disk, the ladder and the cover's circle. */
export default function DiskFrame({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-md p-5 ${className}`} style={{ backgroundColor: GARAU_GREY }}>
      {children}
    </div>
  );
}
