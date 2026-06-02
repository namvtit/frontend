// Utility types and helpers

export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

export const formatNumber = (num: number): string => {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(2) + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(2) + 'K';
  }
  return num.toFixed(2);
};

export const formatCurrency = (num: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

export const formatPercent = (num: number, decimals: number = 2): string => {
  return num.toFixed(decimals) + '%';
};

export const getChangeColor = (
  change: number
): 'text-emerald-600 dark:text-emerald-400' | 'text-red-600 dark:text-red-400' => {
  return change >= 0
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-red-600 dark:text-red-400';
};

export const getChangeBgColor = (
  change: number
): 'bg-emerald-500/10' | 'bg-red-500/10' => {
  return change >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10';
};
