// seed-users.mjs: writes api/users.json, the whole team (300 people by default).
// The same people every time (a seeded random generator), one person per line.
//   npm run seed            300 people
//   npm run seed -- 50      any other size
import fs from 'node:fs';

const COUNT = Number(process.argv[2]) || 300;

// Last week's three come first, unchanged.
const FIRST_THREE = [
  { id: 'alice', name: 'Alice', role: 'Frontend engineer', city: 'Pune', color: '#f5a524' },
  { id: 'bob', name: 'Bob', role: 'Product designer', city: 'Lisbon', color: '#61dafb' },
  { id: 'sam', name: 'Sam', role: 'Backend engineer', city: 'Toronto', color: '#3ecf8e' },
];

const FIRST = ['Priya', 'Arjun', 'Meera', 'Rahul', 'Ananya', 'Vikram', 'Kavya', 'Rohan', 'Divya', 'Karthik',
  'Sneha', 'Aditya', 'Lakshmi', 'Nikhil', 'Pooja', 'Siddharth', 'Emma', 'Lucas', 'Sofia', 'Noah', 'Mia', 'Liam',
  'Hannah', 'Jonas', 'Clara', 'Mateo', 'Ines', 'Tomás', 'Chloe', 'Ethan', 'Aisha', 'Omar', 'Fatima', 'Yusuf',
  'Mei', 'Kenji', 'Yuna', 'Hiro', 'Wei', 'Lin', 'Grace', 'Daniel', 'Olivia', 'James', 'Zara', 'Leo', 'Nora',
  'Felix', 'Amara', 'Kwame', 'Ama', 'Tunde', 'Sara', 'David', 'Maya', 'Elias', 'Ruth', 'Isaac', 'Anya', 'Pavel'];
const LAST = ['Nair', 'Sharma', 'Iyer', 'Rao', 'Menon', 'Reddy', 'Patel', 'Gupta', 'Kulkarni', 'Joshi', 'Das',
  'Bose', 'Silva', 'Costa', 'Santos', 'Müller', 'Schmidt', 'Weber', 'Fischer', 'Novak', 'Kowalski', 'Garcia',
  'Lopez', 'Martin', 'Bernard', 'Dubois', 'Rossi', 'Bianchi', 'Smith', 'Brown', 'Taylor', 'Wilson', 'Clarke',
  'Okafor', 'Mensah', 'Adeyemi', 'Haddad', 'Khan', 'Tanaka', 'Sato', 'Kim', 'Park', 'Chen', 'Wang', 'Li', 'Nguyen',
  'Cohen', 'Levi', 'Ivanova', 'Petrov'];
// Weighted: more engineers than managers, like a real team.
const ROLES = [['Frontend engineer', 6], ['Backend engineer', 6], ['Full-stack engineer', 4], ['Mobile engineer', 3],
  ['QA engineer', 3], ['DevOps engineer', 2], ['Data analyst', 2], ['Product designer', 3], ['Product manager', 2],
  ['Engineering manager', 1], ['Technical writer', 1]];
const CITIES = ['Pune', 'Bangalore', 'Hyderabad', 'Chennai', 'Lisbon', 'Porto', 'Berlin', 'Munich', 'Warsaw',
  'London', 'Dublin', 'Toronto', 'Austin', 'New York', 'São Paulo', 'Nairobi', 'Lagos', 'Singapore', 'Tokyo', 'Sydney'];
const COLORS = ['#f5a524', '#61dafb', '#3ecf8e', '#f87171', '#a78bfa', '#f472b6', '#facc15', '#34d399', '#60a5fa', '#fb923c'];

// mulberry32: a tiny seeded generator, so every run writes the same file.
let seed = 6;
function random() {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = (list) => list[Math.floor(random() * list.length)];
const weighted = (pairs) => {
  let r = random() * pairs.reduce((sum, [, w]) => sum + w, 0);
  for (const [value, w] of pairs) if ((r -= w) < 0) return value;
  return pairs[0][0];
};
const slug = (name) => name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]+/g, '-');

const users = FIRST_THREE.slice(0, COUNT);
const ids = new Set(users.map((u) => u.id));
while (users.length < COUNT) {
  const name = `${pick(FIRST)} ${pick(LAST)}`;
  let id = slug(name);
  for (let n = 2; ids.has(id); n++) id = `${slug(name)}-${n}`;
  ids.add(id);
  users.push({ id, name, role: weighted(ROLES), city: pick(CITIES), color: pick(COLORS) });
}

const line = (u) => Object.entries(u).map(([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(', ');
const lines = users.map((u) => `  ${JSON.stringify(u.id)}: { ${line(u)} }`);
fs.writeFileSync(new URL('../api/users.json', import.meta.url), `{\n${lines.join(',\n')}\n}\n`);
console.log(`api/users.json: ${users.length} people`);
