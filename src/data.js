// All names are fictional.
// Car stats 0-100: engine, aero, rel (reliability), tyre (tyre management).
export const TEAMS = [
  { id: 'val', name: 'Valkyrie Racing', color: '#e8352b', engine: 88, aero: 88, rel: 85, tyre: 84, budget: 18 },
  { id: 'aur', name: 'Aurora GP', color: '#14b8a6', engine: 90, aero: 86, rel: 87, tyre: 82, budget: 18 },
  { id: 'iro', name: 'Ironclad Motorsport', color: '#3b82f6', engine: 86, aero: 87, rel: 84, tyre: 86, budget: 16 },
  { id: 'sol', name: 'Solaris F1', color: '#ff8a00', engine: 84, aero: 85, rel: 82, tyre: 83, budget: 15 },
  { id: 'ver', name: 'Verdant Racing', color: '#22c55e', engine: 82, aero: 80, rel: 83, tyre: 80, budget: 13 },
  { id: 'neb', name: 'Nebula Autosport', color: '#a855f7', engine: 80, aero: 81, rel: 78, tyre: 79, budget: 12 },
  { id: 'cri', name: 'Crimson Arrow', color: '#ec4899', engine: 78, aero: 77, rel: 80, tyre: 77, budget: 11 },
  { id: 'pol', name: 'Polar Dynamics', color: '#e2e8f0', engine: 76, aero: 78, rel: 76, tyre: 76, budget: 10 },
  { id: 'gol', name: 'Goldrush Racing', color: '#facc15', engine: 74, aero: 73, rel: 75, tyre: 75, budget: 9 },
  { id: 'tun', name: 'Tundra Works', color: '#94a3b8', engine: 71, aero: 72, rel: 72, tyre: 73, budget: 8 },
]

// pace: raw speed, cons: consistency (fewer mistakes, less lap-time noise).
export const DRIVERS = [
  { id: 'd1', name: 'Marco Velani', code: 'VEL', team: 'val', pace: 92, cons: 88 },
  { id: 'd2', name: 'Jonas Kerrigan', code: 'KER', team: 'val', pace: 88, cons: 85 },
  { id: 'd3', name: 'Theo Marchand', code: 'MAR', team: 'aur', pace: 93, cons: 90 },
  { id: 'd4', name: 'Luis Ortega', code: 'ORT', team: 'aur', pace: 87, cons: 84 },
  { id: 'd5', name: 'Erik Halvorsen', code: 'HAL', team: 'iro', pace: 91, cons: 86 },
  { id: 'd6', name: 'Kenji Morita', code: 'MOR', team: 'iro', pace: 86, cons: 89 },
  { id: 'd7', name: 'Oscar Brandt', code: 'BRA', team: 'sol', pace: 89, cons: 82 },
  { id: 'd8', name: 'Rafael Duarte', code: 'DUA', team: 'sol', pace: 85, cons: 83 },
  { id: 'd9', name: 'Liam Ashford', code: 'ASH', team: 'ver', pace: 87, cons: 80 },
  { id: 'd10', name: 'Pavel Novak', code: 'NOV', team: 'ver', pace: 83, cons: 86 },
  { id: 'd11', name: 'Hugo Lefèvre', code: 'LEF', team: 'neb', pace: 86, cons: 78 },
  { id: 'd12', name: 'Arjun Mehta', code: 'MEH', team: 'neb', pace: 82, cons: 84 },
  { id: 'd13', name: 'Sven Lindqvist', code: 'LIN', team: 'cri', pace: 84, cons: 81 },
  { id: 'd14', name: 'Diego Ferraz', code: 'FER', team: 'cri', pace: 81, cons: 79 },
  { id: 'd15', name: 'Nico Albers', code: 'ALB', team: 'pol', pace: 83, cons: 83 },
  { id: 'd16', name: 'Tomás Rivera', code: 'RIV', team: 'pol', pace: 80, cons: 80 },
  { id: 'd17', name: 'Felix Grant', code: 'GRA', team: 'gol', pace: 82, cons: 77 },
  { id: 'd18', name: 'Yuki Tanabe', code: 'TAN', team: 'gol', pace: 79, cons: 82 },
  { id: 'd19', name: 'Matteo Serra', code: 'SER', team: 'tun', pace: 80, cons: 78 },
  { id: 'd20', name: 'Ben Okafor', code: 'OKA', team: 'tun', pace: 78, cons: 81 },
]

// pts: control points (x 0-100, y 0-70) of a closed loop, smoothed at runtime.
// power: 0 = aero track, 1 = engine track. wear: tyre wear multiplier.
// overtaking: ease of passing. rain: chance of rain during the race.
export const TRACKS = [
  { id: 'bel', name: 'Bellavista Ring', country: 'Valmora', laps: 25, base: 82, power: 0.55, wear: 1.0, overtaking: 1.0, rain: 0.2,
    pts: [[10, 50], [10, 20], [25, 10], [70, 10], [90, 20], [90, 45], [75, 55], [55, 50], [40, 60], [20, 60]] },
  { id: 'por', name: 'Port Azure Street Circuit', country: 'Azuria', laps: 28, base: 76, power: 0.3, wear: 0.8, overtaking: 0.4, rain: 0.15,
    pts: [[10, 10], [60, 10], [60, 25], [85, 25], [85, 60], [50, 60], [50, 45], [30, 45], [30, 60], [10, 60]] },
  { id: 'kes', name: 'Kestrel Park', country: 'Northmark', laps: 24, base: 88, power: 0.45, wear: 1.15, overtaking: 0.9, rain: 0.35,
    pts: [[15, 55], [10, 30], [25, 12], [45, 20], [55, 10], [80, 12], [90, 30], [75, 40], [85, 58], [60, 62], [40, 50]] },
  { id: 'nor', name: 'Nordhavn Speedway', country: 'Skarland', laps: 26, base: 80, power: 0.85, wear: 0.9, overtaking: 1.4, rain: 0.3,
    pts: [[5, 40], [20, 15], [95, 15], [95, 30], [60, 35], [60, 50], [90, 55], [85, 65], [15, 65]] },
  { id: 'sie', name: 'Sierra Alta', country: 'Montevar', laps: 23, base: 92, power: 0.25, wear: 1.2, overtaking: 0.6, rain: 0.25,
    pts: [[10, 60], [10, 35], [25, 25], [20, 10], [45, 8], [50, 25], [70, 15], [90, 25], [80, 45], [60, 40], [50, 55], [30, 50]] },
  { id: 'lag', name: 'Lago Verde', country: 'Valmora', laps: 25, base: 84, power: 0.5, wear: 1.0, overtaking: 1.0, rain: 0.4,
    pts: [[10, 35], [30, 10], [55, 20], [80, 8], [92, 30], [70, 45], [88, 62], [50, 62], [35, 48], [15, 62]] },
  { id: 'des', name: 'Desert Mirage', country: 'Qasirah', laps: 26, base: 86, power: 0.7, wear: 1.3, overtaking: 1.2, rain: 0.03,
    pts: [[10, 20], [90, 20], [90, 35], [50, 40], [90, 50], [90, 65], [10, 65], [25, 42]] },
  { id: 'hig', name: 'Highland Loop', country: 'Caledor', laps: 24, base: 90, power: 0.4, wear: 1.05, overtaking: 0.8, rain: 0.5,
    pts: [[15, 65], [8, 40], [20, 20], [40, 30], [50, 10], [75, 8], [92, 20], [85, 40], [65, 45], [75, 65]] },
  { id: 'cot', name: 'Côte Dorée', country: 'Lumière', laps: 27, base: 78, power: 0.35, wear: 0.85, overtaking: 0.5, rain: 0.2,
    pts: [[10, 50], [15, 15], [40, 10], [45, 30], [65, 30], [70, 10], [92, 15], [90, 45], [70, 62], [40, 55], [25, 65]] },
  { id: 'thu', name: 'Thunder Valley', country: 'Redrock', laps: 25, base: 83, power: 0.75, wear: 1.1, overtaking: 1.3, rain: 0.25,
    pts: [[5, 30], [30, 10], [70, 10], [95, 30], [80, 45], [95, 62], [60, 65], [50, 45], [40, 65], [10, 60]] },
  { id: 'iso', name: 'Isola Rossa', country: 'Sardenza', laps: 24, base: 87, power: 0.5, wear: 1.15, overtaking: 0.9, rain: 0.2,
    pts: [[20, 60], [8, 40], [15, 15], [40, 20], [60, 8], [88, 15], [92, 40], [70, 40], [60, 55], [85, 62], [50, 66]] },
  { id: 'gra', name: 'Grand Finale Park', country: 'Aurelia', laps: 26, base: 85, power: 0.6, wear: 1.0, overtaking: 1.1, rain: 0.3,
    pts: [[10, 40], [20, 12], [50, 18], [60, 8], [90, 12], [88, 35], [65, 32], [58, 48], [85, 52], [80, 66], [30, 66]] },
]

export const POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1]
// Prize money ($M) per finishing position.
export const PRIZE = [6, 5, 4.4, 3.9, 3.5, 3.1, 2.8, 2.5, 2.2, 2, 1.8, 1.6, 1.4, 1.2, 1.1, 1, 0.9, 0.8, 0.7, 0.6]
