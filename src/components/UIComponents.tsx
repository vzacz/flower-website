'use client';

interface CardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  trend?: number;
}

export const StatCard = ({ title, value, icon, subtitle, trend }: CardProps) => {
  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-emerald-600 transition-all">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-slate-400 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-white mt-2">{value}</p>
          {subtitle && <p className="text-slate-500 text-xs mt-1">{subtitle}</p>}
        </div>
        <div className="text-emerald-500">{icon}</div>
      </div>
      {trend !== undefined && (
        <div className={`text-sm mt-3 ${trend > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% from last week
        </div>
      )}
    </div>
  );
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  fullWidth?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

export const Button = ({
  variant = 'primary',
  fullWidth = false,
  loading = false,
  children,
  disabled,
  ...props
}: ButtonProps) => {
  const baseClasses =
    'px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2';
  
  const variantClasses = {
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-slate-600',
    secondary: 'bg-slate-700 text-white hover:bg-slate-600 disabled:bg-slate-700',
    danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-800',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${
        fullWidth ? 'w-full' : ''
      } disabled:opacity-50 disabled:cursor-not-allowed`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className="animate-spin">⌛</span> : null}
      {children}
    </button>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = ({ label, error, className, ...props }: InputProps) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>}
      <input
        className={`w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-600 transition-colors ${className}`}
        {...props}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export const Select = ({ label, error, options, className, ...props }: SelectProps) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>}
      <select
        className={`w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-600 transition-colors ${className}`}
        {...props}
      >
        {options.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = ({ label, error, className, ...props }: TextareaProps) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>}
      <textarea
        className={`w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-600 transition-colors resize-none ${className}`}
        {...props}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

interface TableProps {
  headers: string[];
  rows: (string | number | React.ReactNode)[][];
  actions?: React.ReactNode;
}

export const Table = ({ headers, rows, actions }: TableProps) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-700">
            {headers.map((header) => (
              <th key={header} className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                {header}
              </th>
            ))}
            {actions && <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
              {row.map((cell, cellIdx) => (
                <td key={cellIdx} className="px-4 py-3 text-slate-300">
                  {cell}
                </td>
              ))}
              {actions && <td className="px-4 py-3">{actions}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
