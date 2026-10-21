import records from './data/districts.json';

export type District = typeof records[number];
export type Metric = 'mortgageHolders' | 'workingPopulation' | 'opportunities';
export const districts: District[] = records;
export const metricLabels: Record<Metric, string> = {
  mortgageHolders: 'Mortgage holders',
  workingPopulation: 'Working population',
  opportunities: 'New opportunities',
};
export const number = (n: number) => new Intl.NumberFormat('en-US').format(n);
export const compact = (n: number) => new Intl.NumberFormat('en-US', {
  notation: 'compact', maximumFractionDigits: 1,
}).format(n);
export const money = (n: number) => `₫${(n / 1e12).toFixed(1)}T`;
export const percent = (n: number) => `${(n * 100).toFixed(1)}%`;
export function summarize(rows: District[]) {
  return rows.reduce((total, row) => ({
    mortgageHolders: total.mortgageHolders + row.mortgageHolders,
    workingPopulation: total.workingPopulation + row.workingPopulation,
    opportunities: total.opportunities + row.opportunities,
    portfolioVnd: total.portfolioVnd + row.portfolioVnd,
    bankCustomers: total.bankCustomers + row.bankCustomers,
  }), { mortgageHolders: 0, workingPopulation: 0, opportunities: 0, portfolioVnd: 0, bankCustomers: 0 });
}
export function rankDistricts(rows: District[], metric: Metric) {
  return [...rows].sort((a, b) => b[metric] - a[metric]);
}
export function filterDistricts(query: string) {
  return districts.filter(d => d.name.toLowerCase().includes(query.trim().toLowerCase()));
}
