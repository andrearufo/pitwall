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
    pts: [[10, 55], [10, 25], [14, 14], [24, 10], [50, 10], [56, 14], [60, 10], [85, 10], [92, 16], [90, 26], [78, 30], [74, 38], [86, 46], [88, 58], [80, 64], [62, 62], [52, 52], [42, 58], [30, 64], [16, 64]] },
  { id: 'por', name: 'Port Azure Street Circuit', country: 'Azuria', laps: 28, base: 76, power: 0.3, wear: 0.8, overtaking: 0.4, rain: 0.15,
    pts: [[10, 14], [14, 10], [30, 10], [33, 13], [36, 10], [56, 10], [60, 14], [60, 22], [64, 26], [82, 26], [86, 30], [86, 56], [82, 60], [56, 60], [52, 56], [52, 48], [48, 44], [34, 44], [30, 48], [30, 56], [26, 60], [14, 60], [10, 56]] },
  { id: 'kes', name: 'Kestrel Park', country: 'Northmark', laps: 24, base: 88, power: 0.45, wear: 1.15, overtaking: 0.9, rain: 0.35,
    pts: [[12, 58], [8, 40], [12, 26], [22, 20], [28, 12], [38, 16], [44, 10], [54, 14], [62, 8], [76, 8], [88, 14], [92, 26], [84, 34], [72, 32], [66, 40], [76, 48], [90, 52], [88, 62], [70, 64], [52, 58], [40, 62], [26, 64]] },
  { id: 'nor', name: 'Nordhavn Speedway', country: 'Skarland', laps: 26, base: 80, power: 0.85, wear: 0.9, overtaking: 1.4, rain: 0.3,
    pts: [[6, 40], [10, 22], [20, 14], [60, 14], [92, 14], [96, 20], [92, 26], [66, 30], [60, 36], [64, 44], [90, 50], [94, 58], [88, 64], [50, 64], [20, 64], [10, 58]] },
  { id: 'sie', name: 'Sierra Alta', country: 'Montevar', laps: 23, base: 92, power: 0.25, wear: 1.2, overtaking: 0.6, rain: 0.25,
    pts: [[10, 62], [8, 44], [14, 34], [24, 30], [22, 20], [16, 12], [28, 6], [42, 10], [46, 22], [56, 26], [62, 16], [72, 10], [86, 14], [92, 26], [84, 36], [72, 36], [64, 44], [74, 52], [70, 62], [54, 60], [46, 50], [34, 48], [28, 58], [20, 64]] },
  { id: 'lag', name: 'Lago Verde', country: 'Valmora', laps: 25, base: 84, power: 0.5, wear: 1.0, overtaking: 1.0, rain: 0.4,
    pts: [[10, 36], [18, 18], [30, 10], [44, 14], [52, 22], [64, 16], [80, 8], [92, 16], [94, 30], [84, 38], [70, 42], [76, 50], [90, 56], [86, 64], [62, 64], [50, 56], [40, 46], [30, 52], [24, 62], [12, 58]] },
  { id: 'des', name: 'Desert Mirage', country: 'Qasirah', laps: 26, base: 86, power: 0.7, wear: 1.3, overtaking: 1.2, rain: 0.03,
    pts: [[8, 22], [14, 14], [50, 14], [54, 18], [58, 14], [90, 14], [96, 22], [90, 32], [56, 38], [52, 44], [58, 48], [92, 52], [96, 60], [88, 66], [50, 66], [14, 66], [8, 58], [16, 46], [24, 40], [14, 32]] },
  { id: 'hig', name: 'Highland Loop', country: 'Caledor', laps: 24, base: 90, power: 0.4, wear: 1.05, overtaking: 0.8, rain: 0.5,
    pts: [[14, 66], [8, 52], [10, 40], [18, 32], [14, 22], [22, 12], [34, 16], [40, 26], [48, 18], [56, 8], [74, 6], [90, 12], [94, 24], [86, 32], [70, 30], [60, 38], [66, 46], [80, 46], [88, 54], [82, 64], [64, 62], [50, 54], [36, 58], [26, 66]] },
  { id: 'cot', name: 'Côte Dorée', country: 'Lumière', laps: 27, base: 78, power: 0.35, wear: 0.85, overtaking: 0.5, rain: 0.2,
    pts: [[10, 52], [8, 36], [12, 20], [22, 12], [34, 12], [42, 20], [44, 30], [52, 34], [62, 30], [66, 20], [72, 10], [86, 10], [94, 20], [92, 34], [84, 40], [88, 50], [82, 60], [68, 64], [56, 58], [46, 62], [34, 66], [20, 64]] },
  { id: 'thu', name: 'Thunder Valley', country: 'Redrock', laps: 25, base: 83, power: 0.75, wear: 1.1, overtaking: 1.3, rain: 0.25,
    pts: [[6, 32], [14, 16], [30, 10], [70, 10], [90, 16], [96, 28], [88, 38], [76, 40], [72, 46], [84, 52], [96, 58], [90, 66], [64, 66], [56, 58], [50, 46], [42, 46], [38, 58], [30, 66], [12, 62], [6, 50]] },
  { id: 'iso', name: 'Isola Rossa', country: 'Sardenza', laps: 24, base: 87, power: 0.5, wear: 1.15, overtaking: 0.9, rain: 0.2,
    pts: [[20, 62], [10, 52], [8, 38], [14, 24], [12, 14], [22, 8], [36, 12], [46, 22], [58, 14], [64, 6], [82, 8], [92, 16], [94, 30], [88, 40], [74, 40], [64, 48], [72, 56], [86, 60], [80, 66], [56, 66], [44, 58], [34, 62]] },
  { id: 'gra', name: 'Grand Finale Park', country: 'Aurelia', laps: 26, base: 85, power: 0.6, wear: 1.0, overtaking: 1.1, rain: 0.3,
    pts: [[10, 42], [10, 26], [18, 14], [32, 10], [46, 16], [54, 26], [60, 18], [66, 8], [84, 8], [94, 16], [92, 30], [80, 34], [66, 32], [58, 40], [62, 48], [78, 50], [90, 56], [86, 66], [60, 66], [44, 60], [30, 64], [16, 60]] },
]

export const POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1]
// Prize money ($M) per finishing position.
export const PRIZE = [6, 5, 4.4, 3.9, 3.5, 3.1, 2.8, 2.5, 2.2, 2, 1.8, 1.6, 1.4, 1.2, 1.1, 1, 0.9, 0.8, 0.7, 0.6]
