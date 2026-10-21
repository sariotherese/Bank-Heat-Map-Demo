import { mkdirSync, writeFileSync } from 'node:fs';

// Reproducible, deliberately synthetic district-level assumptions, not census data.
const seeds = [
  ['District 1', 142000, .17, 4.2], ['District 3', 163000, .14, 3.1],
  ['District 4', 155000, .10, 2.3], ['District 5', 166000, .12, 2.8],
  ['District 6', 233000, .095, 2.1], ['District 7', 360000, .19, 3.8],
  ['District 8', 422000, .08, 1.9], ['District 10', 237000, .13, 2.7],
  ['District 11', 209000, .10, 2.2], ['District 12', 640000, .075, 1.8],
  ['Go Vap', 690000, .09, 2.2], ['Phu Nhuan', 165000, .15, 3.2],
  ['Tan Binh', 475000, .12, 2.7], ['Tan Phu', 505000, .09, 2.0],
  ['Binh Thanh', 500000, .14, 3.1], ['Binh Tan', 790000, .065, 1.6],
  ['Thu Duc City', 1210000, .145, 3.3], ['Hoc Mon', 545000, .055, 1.5],
  ['Cu Chi', 465000, .04, 1.3], ['Binh Chanh', 740000, .06, 1.7],
  ['Nha Be', 212000, .105, 2.4], ['Can Gio', 74000, .025, 1.1],
];
const districts = seeds.map(([name, population, rate, ticket], index) => {
  const workingPopulation = Math.round(population * (.59 + (index % 5) * .012));
  const mortgageHolders = Math.round(workingPopulation * rate);
  const bankCustomers = Math.round(mortgageHolders * (.12 + (index % 4) * .015));
  const eligibleNonBorrowers = Math.round((workingPopulation - mortgageHolders) * (.065 + (index % 6) * .008));
  const propensity = .14 + (index % 5) * .025;
  const opportunities = Math.round(eligibleNonBorrowers * propensity);
  const portfolioVnd = Math.round(bankCustomers * ticket * 1e9);
  const potentialVnd = Math.round(opportunities * ticket * 1e9);
  return {
    id: index + 1, name, population, workingPopulation, mortgageHolders, bankCustomers,
    eligibleNonBorrowers, propensity, opportunities, portfolioVnd, potentialVnd,
    averageLoanVnd: ticket * 1e9,
    salariedShare: 52 + index % 7 * 3,
    affluentShare: 12 + index % 5 * 3,
    snapshot: '2026-09-30', synthetic: true,
  };
});
mkdirSync('src/data', { recursive: true });
writeFileSync('src/data/districts.json', JSON.stringify(districts, null, 2) + '\n');
mkdirSync('public/data', { recursive: true });
writeFileSync('public/data/districts.json', JSON.stringify(districts, null, 2) + '\n');
writeFileSync('public/data/districts.csv',
  Object.keys(districts[0]).join(',') + '\n' +
  districts.map(row => Object.values(row).join(',')).join('\n') + '\n');
console.log(`Generated ${districts.length} synthetic district records.`);
