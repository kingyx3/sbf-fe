/**
 * Shared UI primitives.
 * Import what you need: import { Button, Card, Badge } from '../components/ui';
 */

import React from 'react';

// ─── Button ────────────────────────────────────────────────────────────────

const buttonVariants = {
  primary:   'bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white shadow-sm',
  secondary: 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm',
  ghost:     'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100',
  danger:    'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-sm',
  success:   'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm',
};

const buttonSizes = {
  xs: 'h-7 px-2.5 text-xs gap-1.5',
  sm: 'h-8 px-3 text-sm gap-2',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-base gap-2.5',
};

export const Button = React.forwardRef(({
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  icon,
  children,
  className = '',
  ...props
}, ref) => (
  <button
    ref={ref}
    disabled={disabled || loading}
    className={[
      'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
      'disabled:opacity-50 disabled:pointer-events-none',
      buttonVariants[variant],
      buttonSizes[size],
      className,
    ].join(' ')}
    {...props}
  >
    {loading ? (
      <svg className="animate-spin h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    ) : icon ? (
      <span className="shrink-0">{icon}</span>
    ) : null}
    {children}
  </button>
));
Button.displayName = 'Button';

// ─── Card ──────────────────────────────────────────────────────────────────

export const Card = ({ children, className = '', padding = true, hover = false }) => (
  <div className={[
    'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl',
    'shadow-card',
    padding && 'p-5',
    hover && 'transition-shadow duration-150 hover:shadow-card-md cursor-pointer',
    className,
  ].filter(Boolean).join(' ')}>
    {children}
  </div>
);

// ─── SectionCard ──────────────────────────────────────────────────────────

export const SectionCard = ({ title, subtitle, icon, action, children, className = '' }) => (
  <Card padding={false} className={className}>
    {(title || icon || action) && (
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0">
              {icon}
            </div>
          )}
          <div>
            {title && <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>}
            {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {action && <div className="ml-4 shrink-0">{action}</div>}
      </div>
    )}
    <div className="p-5">{children}</div>
  </Card>
);

// ─── Badge ─────────────────────────────────────────────────────────────────

const badgeVariants = {
  default:  'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300',
  blue:     'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400',
  green:    'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  amber:    'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  red:      'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  purple:   'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
};

export const Badge = ({ variant = 'default', children, dot, className = '' }) => (
  <span className={[
    'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium',
    badgeVariants[variant],
    className,
  ].join(' ')}>
    {dot && (
      <span className={`w-1.5 h-1.5 rounded-full ${
        variant === 'green' ? 'bg-emerald-500' :
        variant === 'amber' ? 'bg-amber-500' :
        variant === 'red'   ? 'bg-red-500' :
        variant === 'blue'  ? 'bg-brand-500' :
        variant === 'purple'? 'bg-purple-500' :
        'bg-gray-400'
      }`} />
    )}
    {children}
  </span>
);

// ─── Input ─────────────────────────────────────────────────────────────────

export const Input = React.forwardRef(({
  label,
  error,
  helper,
  icon,
  className = '',
  containerClassName = '',
  ...props
}, ref) => (
  <div className={containerClassName}>
    {label && (
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        {label}
      </label>
    )}
    <div className="relative">
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          {icon}
        </div>
      )}
      <input
        ref={ref}
        className={[
          'w-full rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
          'placeholder:text-gray-400 dark:placeholder:text-gray-500',
          'transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
          error
            ? 'border-red-400 dark:border-red-600'
            : 'border-gray-300 dark:border-gray-600',
          icon ? 'pl-10 pr-3 py-2.5' : 'px-3 py-2.5',
          'text-sm',
          className,
        ].join(' ')}
        {...props}
      />
    </div>
    {error  && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>}
    {helper && !error && <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">{helper}</p>}
  </div>
));
Input.displayName = 'Input';

// ─── Spinner ───────────────────────────────────────────────────────────────

export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'w-4 h-4 border-2', md: 'w-6 h-6 border-2', lg: 'w-10 h-10 border-3', xl: 'w-14 h-14 border-4' };
  return (
    <div className={[
      'rounded-full border-gray-200 dark:border-gray-700 border-t-brand-500 animate-spin',
      sizes[size],
      className,
    ].join(' ')} />
  );
};

// ─── EmptyState ────────────────────────────────────────────────────────────

export const EmptyState = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
    {icon && (
      <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 text-gray-400 dark:text-gray-500">
        {icon}
      </div>
    )}
    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">{title}</h3>
    {description && <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mb-6">{description}</p>}
    {action}
  </div>
);

// ─── Divider ───────────────────────────────────────────────────────────────

export const Divider = ({ label, className = '' }) => (
  <div className={`relative ${className}`}>
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-gray-200 dark:border-gray-700" />
    </div>
    {label && (
      <div className="relative flex justify-center">
        <span className="bg-white dark:bg-gray-800 px-3 text-xs text-gray-400 dark:text-gray-500 font-medium">
          {label}
        </span>
      </div>
    )}
  </div>
);

// ─── StatusDot ─────────────────────────────────────────────────────────────

const dotColors = {
  online:  'bg-emerald-500',
  offline: 'bg-red-500',
  slow:    'bg-amber-500',
  loading: 'bg-brand-500 animate-pulse',
};

export const StatusDot = ({ status = 'online', label }) => (
  <div className="flex items-center gap-1.5">
    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[status]}`} />
    {label && <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>}
  </div>
);
