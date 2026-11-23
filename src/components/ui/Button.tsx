import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cx } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'tint' | 'outline';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-ink shadow-sm hover:brightness-110',
  tint: 'bg-tint text-tint-ink shadow-sm hover:brightness-110',
  secondary: 'bg-surface-2 text-ink hover:bg-ink/[0.07]',
  outline: 'border border-line bg-surface text-ink hover:bg-surface-2',
  ghost: 'text-ink-2 hover:bg-ink/[0.06] hover:text-ink',
  danger: 'bg-danger/10 text-danger hover:bg-danger/15',
};

const sizes: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-xs gap-1 rounded-lg',
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-5 text-[15px] gap-2 rounded-2xl',
  icon: 'size-10 rounded-xl',
  'icon-sm': 'size-8 rounded-lg',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', className, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx(
        'inline-flex shrink-0 select-none items-center justify-center font-medium whitespace-nowrap transition-[background-color,color,filter,transform,box-shadow] duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-[1.1em] [&_svg]:shrink-0',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
});

export interface IconButtonProps extends ButtonProps {
  label: string;
}

/** Bouton icône : `label` sert d'info-bulle et d'intitulé pour les lecteurs d'écran. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, variant = 'ghost', size = 'icon', className, ...props },
  ref,
) {
  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      aria-label={label}
      title={label}
      className={cx('[&_svg]:size-[18px]', className)}
      {...props}
    />
  );
});
