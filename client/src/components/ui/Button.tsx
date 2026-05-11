import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { audio } from '../../services/audio';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  children: ReactNode;
}

export function Button({ variant = 'secondary', className = '', children, onClick, ...rest }: Props) {
  const variantClass =
    variant === 'primary' ? 'btn btn-primary' : variant === 'ghost' ? 'btn btn-ghost' : 'btn';

  return (
    <button
      {...rest}
      className={`${variantClass} ${className} disabled:opacity-40 disabled:cursor-not-allowed`}
      onClick={(e) => {
        if (!rest.disabled) audio.play('click');
        onClick?.(e);
      }}
    >
      {children}
    </button>
  );
}
