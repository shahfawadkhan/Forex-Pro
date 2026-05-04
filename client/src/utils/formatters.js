export const formatPKR = (amount) => {
  if (amount === undefined || amount === null) return '—';
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatAmount = (amount, decimals = 0) => {
  if (amount === undefined || amount === null) return '—';
  return new Intl.NumberFormat('en', { maximumFractionDigits: decimals }).format(amount);
};

export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-PK', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-PK', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

export const today = () => new Date().toISOString().split('T')[0];

export const startOfMonth = () => {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().split('T')[0];
};

export const startOfWeek = () => {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().split('T')[0];
};
