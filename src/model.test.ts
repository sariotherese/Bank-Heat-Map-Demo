import { describe, it, expect } from 'vitest';
import { districts, filterDistricts, rankDistricts, summarize } from './model';

describe('synthetic mortgage dataset', () => {
  it('covers exactly 22 historical districts with unique identifiers', () => {
    expect(districts).toHaveLength(22);
    expect(new Set(districts.map(d => d.id)).size).toBe(22);
    expect(districts.find(d => d.name === 'Thu Duc City')).toBeDefined();
  });
  it('maintains population, mortgage and opportunity invariants', () => {
    for (const d of districts) {
      expect(d.synthetic).toBe(true);
      expect(d.workingPopulation).toBeLessThan(d.population);
      expect(d.mortgageHolders).toBeLessThan(d.workingPopulation);
      expect(d.bankCustomers).toBeLessThan(d.mortgageHolders);
      expect(d.opportunities).toBe(Math.round(d.eligibleNonBorrowers * d.propensity));
      expect(d.opportunities + d.mortgageHolders).toBeLessThan(d.workingPopulation);
      expect(d.portfolioVnd).toBe(Math.round(d.bankCustomers * d.averageLoanVnd));
    }
  });
  it('aggregates exactly and supports empty scopes', () => {
    expect(summarize(districts).mortgageHolders).toBe(districts.reduce((n, d) => n + d.mortgageHolders, 0));
    expect(summarize([]).opportunities).toBe(0);
  });
  it('filters and ranks without mutating the source', () => {
    expect(filterDistricts('  THU DUC ')).toHaveLength(1);
    expect(filterDistricts('unknown')).toHaveLength(0);
    expect(rankDistricts(districts, 'opportunities')[0].name).toBe('Thu Duc City');
    expect(districts[0].id).toBe(1);
  });
});
