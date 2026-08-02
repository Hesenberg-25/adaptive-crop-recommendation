const XLSX = require('xlsx');
const path = require('path');

const crops = [
  { crop:'Rice',         category:'Cereal',     nMin:60,  nMax:99,  nAvg:80,  pMin:35, pMax:60,  pAvg:48,  kMin:35, kMax:45,  kAvg:40,  tMin:20,  tMax:27,  tAvg:24,  hMin:80, hMax:85,  hAvg:82,  phMin:5.0, phMax:7.9, phAvg:6.4, rMin:183, rMax:299, rAvg:236 },
  { crop:'Wheat',        category:'Cereal',     nMin:60,  nMax:120, nAvg:88,  pMin:40, pMax:60,  pAvg:49,  kMin:41, kMax:60,  kAvg:50,  tMin:15,  tMax:25,  tAvg:20,  hMin:41, hMax:60,  hAvg:49,  phMin:6.0, phMax:7.5, phAvg:6.8, rMin:50,  rMax:100, rAvg:77  },
  { crop:'Maize',        category:'Cereal',     nMin:60,  nMax:100, nAvg:78,  pMin:35, pMax:60,  pAvg:48,  kMin:15, kMax:25,  kAvg:20,  tMin:18,  tMax:27,  tAvg:22,  hMin:55, hMax:75,  hAvg:65,  phMin:5.5, phMax:7.0, phAvg:6.2, rMin:61,  rMax:110, rAvg:85  },
  { crop:'Sorghum',      category:'Cereal',     nMin:60,  nMax:80,  nAvg:70,  pMin:30, pMax:50,  pAvg:39,  kMin:30, kMax:50,  kAvg:39,  tMin:25,  tMax:32,  tAvg:29,  hMin:40, hMax:60,  hAvg:50,  phMin:6.0, phMax:7.5, phAvg:6.8, rMin:40,  rMax:75,  rAvg:57  },
  { crop:'Pearl Millet', category:'Cereal',     nMin:40,  nMax:59,  nAvg:49,  pMin:20, pMax:40,  pAvg:31,  kMin:20, kMax:40,  kAvg:29,  tMin:25,  tMax:35,  tAvg:30,  hMin:40, hMax:60,  hAvg:50,  phMin:6.1, phMax:8.0, phAvg:7.0, rMin:30,  rMax:60,  rAvg:46  },
  { crop:'Chickpea',     category:'Pulse',      nMin:20,  nMax:60,  nAvg:40,  pMin:55, pMax:80,  pAvg:68,  kMin:75, kMax:85,  kAvg:80,  tMin:17,  tMax:21,  tAvg:19,  hMin:14, hMax:20,  hAvg:17,  phMin:6.0, phMax:8.9, phAvg:7.3, rMin:65,  rMax:95,  rAvg:80  },
  { crop:'Kidneybeans',  category:'Pulse',      nMin:0,   nMax:40,  nAvg:21,  pMin:55, pMax:80,  pAvg:68,  kMin:15, kMax:25,  kAvg:20,  tMin:15,  tMax:25,  tAvg:20,  hMin:18, hMax:25,  hAvg:22,  phMin:5.5, phMax:6.0, phAvg:5.7, rMin:60,  rMax:150, rAvg:106 },
  { crop:'Pigeonpeas',   category:'Pulse',      nMin:0,   nMax:40,  nAvg:21,  pMin:55, pMax:80,  pAvg:68,  kMin:15, kMax:25,  kAvg:20,  tMin:18,  tMax:37,  tAvg:28,  hMin:30, hMax:70,  hAvg:48,  phMin:4.5, phMax:7.4, phAvg:5.8, rMin:90,  rMax:199, rAvg:149 },
  { crop:'Mothbeans',    category:'Pulse',      nMin:0,   nMax:40,  nAvg:21,  pMin:35, pMax:60,  pAvg:48,  kMin:15, kMax:25,  kAvg:20,  tMin:24,  tMax:32,  tAvg:28,  hMin:40, hMax:65,  hAvg:53,  phMin:3.5, phMax:9.9, phAvg:6.8, rMin:31,  rMax:74,  rAvg:51  },
  { crop:'Mungbean',     category:'Pulse',      nMin:0,   nMax:40,  nAvg:21,  pMin:35, pMax:60,  pAvg:47,  kMin:15, kMax:25,  kAvg:20,  tMin:27,  tMax:30,  tAvg:29,  hMin:80, hMax:90,  hAvg:85,  phMin:6.2, phMax:7.2, phAvg:6.7, rMin:36,  rMax:60,  rAvg:48  },
  { crop:'Blackgram',    category:'Pulse',      nMin:20,  nMax:60,  nAvg:40,  pMin:55, pMax:80,  pAvg:67,  kMin:15, kMax:25,  kAvg:19,  tMin:25,  tMax:35,  tAvg:30,  hMin:60, hMax:70,  hAvg:65,  phMin:6.5, phMax:7.8, phAvg:7.1, rMin:60,  rMax:75,  rAvg:68  },
  { crop:'Lentil',       category:'Pulse',      nMin:0,   nMax:40,  nAvg:19,  pMin:55, pMax:80,  pAvg:68,  kMin:15, kMax:25,  kAvg:19,  tMin:18,  tMax:30,  tAvg:25,  hMin:60, hMax:70,  hAvg:65,  phMin:5.9, phMax:7.8, phAvg:6.9, rMin:35,  rMax:55,  rAvg:46  },
  { crop:'Peas',         category:'Pulse',      nMin:20,  nMax:40,  nAvg:29,  pMin:41, pMax:60,  pAvg:51,  kMin:30, kMax:50,  kAvg:40,  tMin:15,  tMax:25,  tAvg:20,  hMin:50, hMax:70,  hAvg:61,  phMin:6.0, phMax:7.4, phAvg:6.7, rMin:40,  rMax:60,  rAvg:50  },
  { crop:'Soybean',      category:'Pulse',      nMin:20,  nMax:40,  nAvg:29,  pMin:41, pMax:60,  pAvg:50,  kMin:30, kMax:50,  kAvg:40,  tMin:20,  tMax:30,  tAvg:25,  hMin:50, hMax:70,  hAvg:60,  phMin:6.0, phMax:7.0, phAvg:6.5, rMin:61,  rMax:100, rAvg:79  },
  { crop:'Cabbage',      category:'Vegetable',  nMin:81,  nMax:120, nAvg:101, pMin:40, pMax:60,  pAvg:50,  kMin:60, kMax:80,  kAvg:70,  tMin:15,  tMax:25,  tAvg:20,  hMin:60, hMax:80,  hAvg:70,  phMin:6.0, phMax:7.5, phAvg:6.8, rMin:50,  rMax:80,  rAvg:65  },
  { crop:'Cauliflower',  category:'Vegetable',  nMin:80,  nMax:119, nAvg:100, pMin:40, pMax:60,  pAvg:49,  kMin:60, kMax:80,  kAvg:70,  tMin:15,  tMax:25,  tAvg:20,  hMin:60, hMax:80,  hAvg:70,  phMin:6.0, phMax:7.5, phAvg:6.7, rMin:50,  rMax:80,  rAvg:66  },
  { crop:'Carrot',       category:'Vegetable',  nMin:41,  nMax:80,  nAvg:61,  pMin:40, pMax:60,  pAvg:50,  kMin:61, kMax:100, kAvg:81,  tMin:15,  tMax:25,  tAvg:20,  hMin:50, hMax:70,  hAvg:60,  phMin:5.5, phMax:7.0, phAvg:6.2, rMin:50,  rMax:75,  rAvg:63  },
  { crop:'Radish',       category:'Vegetable',  nMin:40,  nMax:60,  nAvg:50,  pMin:30, pMax:50,  pAvg:40,  kMin:40, kMax:60,  kAvg:50,  tMin:10,  tMax:25,  tAvg:18,  hMin:50, hMax:70,  hAvg:59,  phMin:5.5, phMax:7.0, phAvg:6.3, rMin:41,  rMax:60,  rAvg:50  },
  { crop:'Onion',        category:'Vegetable',  nMin:60,  nMax:100, nAvg:80,  pMin:40, pMax:60,  pAvg:51,  kMin:60, kMax:80,  kAvg:71,  tMin:15,  tMax:25,  tAvg:21,  hMin:50, hMax:70,  hAvg:59,  phMin:6.0, phMax:7.4, phAvg:6.7, rMin:51,  rMax:79,  rAvg:65  },
  { crop:'Garlic',       category:'Vegetable',  nMin:61,  nMax:99,  nAvg:79,  pMin:40, pMax:60,  pAvg:51,  kMin:60, kMax:80,  kAvg:69,  tMin:15,  tMax:25,  tAvg:20,  hMin:50, hMax:70,  hAvg:61,  phMin:6.0, phMax:7.5, phAvg:6.8, rMin:40,  rMax:60,  rAvg:50  },
  { crop:'Spinach',      category:'Vegetable',  nMin:61,  nMax:100, nAvg:81,  pMin:30, pMax:50,  pAvg:40,  kMin:40, kMax:60,  kAvg:50,  tMin:10,  tMax:20,  tAvg:15,  hMin:60, hMax:80,  hAvg:70,  phMin:6.0, phMax:7.5, phAvg:6.7, rMin:40,  rMax:60,  rAvg:50  },
  { crop:'Tomato',       category:'Vegetable',  nMin:50,  nMax:80,  nAvg:65,  pMin:40, pMax:60,  pAvg:49,  kMin:50, kMax:70,  kAvg:60,  tMin:20,  tMax:30,  tAvg:25,  hMin:60, hMax:80,  hAvg:70,  phMin:6.0, phMax:7.0, phAvg:6.5, rMin:60,  rMax:99,  rAvg:78  },
  { crop:'Potato',       category:'Vegetable',  nMin:80,  nMax:120, nAvg:100, pMin:41, pMax:60,  pAvg:50,  kMin:80, kMax:120, kAvg:99,  tMin:15,  tMax:20,  tAvg:17,  hMin:61, hMax:80,  hAvg:71,  phMin:5.5, phMax:6.5, phAvg:6.0, rMin:50,  rMax:80,  rAvg:64  },
  { crop:'Fenugreek',    category:'Vegetable',  nMin:20,  nMax:40,  nAvg:30,  pMin:30, pMax:50,  pAvg:40,  kMin:20, kMax:40,  kAvg:30,  tMin:15,  tMax:25,  tAvg:20,  hMin:50, hMax:70,  hAvg:60,  phMin:6.0, phMax:7.5, phAvg:6.7, rMin:40,  rMax:60,  rAvg:51  },
  { crop:'Apple',        category:'Fruit',      nMin:0,   nMax:40,  nAvg:21,  pMin:120,pMax:145, pAvg:134, kMin:195,kMax:205, kAvg:200, tMin:21,  tMax:24,  tAvg:23,  hMin:90, hMax:95,  hAvg:92,  phMin:5.5, phMax:6.5, phAvg:5.9, rMin:100, rMax:125, rAvg:113 },
  { crop:'Banana',       category:'Fruit',      nMin:80,  nMax:120, nAvg:100, pMin:70, pMax:95,  pAvg:82,  kMin:45, kMax:55,  kAvg:50,  tMin:25,  tMax:30,  tAvg:27,  hMin:75, hMax:85,  hAvg:80,  phMin:5.5, phMax:6.5, phAvg:6.0, rMin:90,  rMax:120, rAvg:105 },
  { crop:'Mango',        category:'Fruit',      nMin:0,   nMax:40,  nAvg:20,  pMin:15, pMax:40,  pAvg:27,  kMin:25, kMax:35,  kAvg:30,  tMin:27,  tMax:36,  tAvg:31,  hMin:45, hMax:55,  hAvg:50,  phMin:4.5, phMax:7.0, phAvg:5.8, rMin:89,  rMax:101, rAvg:95  },
  { crop:'Grapes',       category:'Fruit',      nMin:0,   nMax:40,  nAvg:23,  pMin:120,pMax:145, pAvg:133, kMin:195,kMax:205, kAvg:200, tMin:9,   tMax:42,  tAvg:24,  hMin:80, hMax:84,  hAvg:82,  phMin:5.5, phMax:6.5, phAvg:6.0, rMin:65,  rMax:75,  rAvg:70  },
  { crop:'Watermelon',   category:'Fruit',      nMin:80,  nMax:120, nAvg:99,  pMin:5,  pMax:30,  pAvg:17,  kMin:45, kMax:55,  kAvg:50,  tMin:24,  tMax:27,  tAvg:26,  hMin:80, hMax:90,  hAvg:85,  phMin:6.0, phMax:7.0, phAvg:6.5, rMin:40,  rMax:60,  rAvg:51  },
  { crop:'Muskmelon',    category:'Fruit',      nMin:80,  nMax:120, nAvg:100, pMin:5,  pMax:30,  pAvg:18,  kMin:45, kMax:55,  kAvg:50,  tMin:27,  tMax:30,  tAvg:29,  hMin:90, hMax:95,  hAvg:92,  phMin:6.0, phMax:6.8, phAvg:6.4, rMin:20,  rMax:30,  rAvg:25  },
  { crop:'Orange',       category:'Fruit',      nMin:0,   nMax:40,  nAvg:20,  pMin:5,  pMax:30,  pAvg:17,  kMin:5,  kMax:15,  kAvg:10,  tMin:10,  tMax:35,  tAvg:23,  hMin:90, hMax:95,  hAvg:92,  phMin:6.0, phMax:8.0, phAvg:7.0, rMin:100, rMax:120, rAvg:110 },
  { crop:'Papaya',       category:'Fruit',      nMin:31,  nMax:70,  nAvg:50,  pMin:46, pMax:70,  pAvg:59,  kMin:45, kMax:55,  kAvg:50,  tMin:23,  tMax:44,  tAvg:34,  hMin:90, hMax:95,  hAvg:92,  phMin:6.5, phMax:7.0, phAvg:6.7, rMin:40,  rMax:249, rAvg:143 },
  { crop:'Coconut',      category:'Fruit',      nMin:0,   nMax:40,  nAvg:22,  pMin:5,  pMax:30,  pAvg:17,  kMin:25, kMax:35,  kAvg:31,  tMin:25,  tMax:30,  tAvg:27,  hMin:90, hMax:100, hAvg:95,  phMin:5.5, phMax:6.5, phAvg:6.0, rMin:131, rMax:226, rAvg:176 },
  { crop:'Pomegranate',  category:'Fruit',      nMin:0,   nMax:40,  nAvg:19,  pMin:5,  pMax:30,  pAvg:19,  kMin:35, kMax:45,  kAvg:40,  tMin:18,  tMax:25,  tAvg:22,  hMin:85, hMax:95,  hAvg:90,  phMin:5.6, phMax:7.2, phAvg:6.4, rMin:103, rMax:112, rAvg:108 },
  { crop:'Cotton',       category:'Cash Crop',  nMin:100, nMax:140, nAvg:118, pMin:35, pMax:60,  pAvg:46,  kMin:15, kMax:25,  kAvg:20,  tMin:22,  tMax:26,  tAvg:24,  hMin:75, hMax:85,  hAvg:80,  phMin:5.8, phMax:8.0, phAvg:6.9, rMin:61,  rMax:100, rAvg:80  },
  { crop:'Jute',         category:'Cash Crop',  nMin:60,  nMax:100, nAvg:78,  pMin:35, pMax:60,  pAvg:47,  kMin:35, kMax:45,  kAvg:40,  tMin:23,  tMax:27,  tAvg:25,  hMin:71, hMax:90,  hAvg:80,  phMin:6.0, phMax:7.5, phAvg:6.7, rMin:150, rMax:200, rAvg:175 },
  { crop:'Coffee',       category:'Cash Crop',  nMin:80,  nMax:120, nAvg:101, pMin:15, pMax:40,  pAvg:29,  kMin:25, kMax:35,  kAvg:30,  tMin:23,  tMax:28,  tAvg:26,  hMin:50, hMax:70,  hAvg:59,  phMin:6.0, phMax:7.5, phAvg:6.8, rMin:115, rMax:199, rAvg:158 },
  { crop:'Tea',          category:'Cash Crop',  nMin:100, nMax:140, nAvg:121, pMin:20, pMax:40,  pAvg:31,  kMin:40, kMax:60,  kAvg:50,  tMin:20,  tMax:30,  tAvg:25,  hMin:70, hMax:90,  hAvg:79,  phMin:4.5, phMax:5.5, phAvg:5.0, rMin:152, rMax:299, rAvg:227 },
  { crop:'Sugarcane',    category:'Cash Crop',  nMin:101, nMax:150, nAvg:126, pMin:40, pMax:60,  pAvg:49,  kMin:40, kMax:60,  kAvg:51,  tMin:25,  tMax:35,  tAvg:30,  hMin:60, hMax:80,  hAvg:70,  phMin:6.5, phMax:7.5, phAvg:7.0, rMin:150, rMax:248, rAvg:197 },
  { crop:'Groundnut',    category:'Cash Crop',  nMin:20,  nMax:40,  nAvg:30,  pMin:40, pMax:59,  pAvg:50,  kMin:30, kMax:50,  kAvg:41,  tMin:25,  tMax:30,  tAvg:27,  hMin:51, hMax:70,  hAvg:60,  phMin:6.0, phMax:7.5, phAvg:6.8, rMin:51,  rMax:100, rAvg:74  },
  { crop:'Mustard',      category:'Cash Crop',  nMin:40,  nMax:60,  nAvg:50,  pMin:20, pMax:40,  pAvg:31,  kMin:20, kMax:40,  kAvg:29,  tMin:15,  tMax:25,  tAvg:20,  hMin:50, hMax:70,  hAvg:60,  phMin:6.0, phMax:7.5, phAvg:6.7, rMin:40,  rMax:80,  rAvg:59  },
  { crop:'Sunflower',    category:'Cash Crop',  nMin:40,  nMax:60,  nAvg:49,  pMin:40, pMax:60,  pAvg:49,  kMin:30, kMax:50,  kAvg:40,  tMin:20,  tMax:30,  tAvg:25,  hMin:50, hMax:69,  hAvg:60,  phMin:6.5, phMax:8.0, phAvg:7.3, rMin:50,  rMax:70,  rAvg:60  },
  { crop:'Safflower',    category:'Cash Crop',  nMin:30,  nMax:50,  nAvg:40,  pMin:31, pMax:50,  pAvg:40,  kMin:20, kMax:40,  kAvg:29,  tMin:15,  tMax:25,  tAvg:20,  hMin:40, hMax:59,  hAvg:49,  phMin:6.5, phMax:7.5, phAvg:7.0, rMin:30,  rMax:50,  rAvg:40  },
  { crop:'Sesame',       category:'Cash Crop',  nMin:20,  nMax:40,  nAvg:30,  pMin:20, pMax:40,  pAvg:30,  kMin:20, kMax:39,  kAvg:30,  tMin:25,  tMax:35,  tAvg:30,  hMin:50, hMax:70,  hAvg:59,  phMin:5.5, phMax:7.0, phAvg:6.3, rMin:40,  rMax:60,  rAvg:48  },
  { crop:'Linseed',      category:'Cash Crop',  nMin:30,  nMax:50,  nAvg:40,  pMin:31, pMax:50,  pAvg:40,  kMin:20, kMax:40,  kAvg:30,  tMin:10,  tMax:25,  tAvg:17,  hMin:50, hMax:69,  hAvg:60,  phMin:6.0, phMax:7.5, phAvg:6.7, rMin:40,  rMax:70,  rAvg:56  },
  { crop:'Castor',       category:'Cash Crop',  nMin:41,  nMax:60,  nAvg:50,  pMin:41, pMax:60,  pAvg:51,  kMin:20, kMax:40,  kAvg:30,  tMin:20,  tMax:30,  tAvg:25,  hMin:40, hMax:60,  hAvg:50,  phMin:5.5, phMax:6.5, phAvg:6.0, rMin:50,  rMax:70,  rAvg:60  },
  { crop:'Turmeric',     category:'Cash Crop',  nMin:82,  nMax:120, nAvg:101, pMin:40, pMax:60,  pAvg:50,  kMin:80, kMax:119, kAvg:100, tMin:20,  tMax:30,  tAvg:26,  hMin:70, hMax:90,  hAvg:80,  phMin:5.5, phMax:7.5, phAvg:6.4, rMin:150, rMax:247, rAvg:193 },
];

// Category header fill colors (ARGB hex without #)
const catBg = {
  'Cereal':    'FEF3C7',
  'Pulse':     'DCFCE7',
  'Vegetable': 'CCFBF1',
  'Fruit':     'FFE4E6',
  'Cash Crop': 'F3E8FF',
};
const catFg = {
  'Cereal':    '78350F',
  'Pulse':     '14532D',
  'Vegetable': '134E4A',
  'Fruit':     '881337',
  'Cash Crop': '581C87',
};

// Build rows
const headers = [
  'Crop', 'Category',
  'N Min', 'N Avg ★', 'N Max',
  'P Min', 'P Avg ★', 'P Max',
  'K Min', 'K Avg ★', 'K Max',
  'Temp Min °C', 'Temp Avg ★', 'Temp Max °C',
  'Humidity Min %', 'Humidity Avg ★', 'Humidity Max %',
  'pH Min', 'pH Avg ★', 'pH Max',
  'Rainfall Min mm', 'Rainfall Avg ★', 'Rainfall Max mm',
];

const dataRows = crops.map(c => [
  c.crop, c.category,
  c.nMin, c.nAvg, c.nMax,
  c.pMin, c.pAvg, c.pMax,
  c.kMin, c.kAvg, c.kMax,
  c.tMin, c.tAvg, c.tMax,
  c.hMin, c.hAvg, c.hMax,
  c.phMin, c.phAvg, c.phMax,
  c.rMin, c.rAvg, c.rMax,
]);

const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);

// Column widths
ws['!cols'] = [
  {wch:16},{wch:12},
  {wch:7},{wch:9},{wch:7},
  {wch:7},{wch:9},{wch:7},
  {wch:7},{wch:9},{wch:7},
  {wch:13},{wch:11},{wch:13},
  {wch:15},{wch:13},{wch:15},
  {wch:8},{wch:9},{wch:8},
  {wch:17},{wch:14},{wch:17},
];

// Row height
ws['!rows'] = [{ hpt: 20 }];

// Style cells
const avgCols = new Set([3,6,9,12,15,18,21]); // 0-indexed avg columns
const range = XLSX.utils.decode_range(ws['!ref']);

for (let R = range.s.r; R <= range.e.r; R++) {
  for (let C = range.s.c; C <= range.e.c; C++) {
    const addr = XLSX.utils.encode_cell({r:R, c:C});
    if (!ws[addr]) ws[addr] = {v:'', t:'s'};

    const isHeader = R === 0;
    const cat = R > 0 ? crops[R-1].category : null;
    const isAvg = avgCols.has(C);

    let bgColor = 'FFFFFF';
    let fgColor = '1E293B';

    if (isHeader) {
      bgColor = '047857'; fgColor = 'FFFFFF';
    } else if (isAvg) {
      bgColor = 'D1FAE5'; fgColor = '065F46';
    } else if (cat) {
      bgColor = catBg[cat]; fgColor = catFg[cat];
    }

    ws[addr].s = {
      font: { bold: isHeader || isAvg, color: {rgb: fgColor}, sz: isHeader ? 11 : 10, name: 'Calibri' },
      fill: { patternType: 'solid', fgColor: {rgb: bgColor} },
      alignment: { horizontal: C < 2 ? 'left' : 'center', vertical: 'center' },
      border: {
        top:    {style:'thin', color:{rgb:'CBD5E1'}},
        bottom: {style:'thin', color:{rgb:'CBD5E1'}},
        left:   {style:'thin', color:{rgb:'CBD5E1'}},
        right:  {style:'thin', color:{rgb:'CBD5E1'}},
      },
    };
  }
}

// Freeze top row + first 2 columns
ws['!freeze'] = { xSplit: 2, ySplit: 1 };

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Crop Input Reference');

const out = path.join(__dirname, '..', 'CROP_INPUT_REFERENCE.xlsx');
XLSX.writeFile(wb, out, { bookType: 'xlsx', cellStyles: true });
console.log('Excel saved to:', out);
