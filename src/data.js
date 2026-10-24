/**
 * Demo dataset for the ATS Smart Factory platform.
 * All figures are simulated for demonstration; they are not actual TMMIN data.
 */

export const MUTABLE_KEYS = [
  'users', 'permissions', 'masterData', 'alertConfig', 'workInstructions', 'simSettings',
  'alerts', 'workOrders', 'capa', 'changeRequests', 'engChanges', 'inspections', 'defects',
  'aiRecs', 'materialFlow', 'knowledge', 'kaizen', 'audit'
];

// Intl.DateTimeFormat construction is the expensive part (~1 ms each on Workers).
// Cache one formatter per locale/zone/options instead of rebuilding it per call.
const dtfCache = new Map();
function dtf(locale, tz, opts) {
  const key = locale + '|' + tz + '|' + JSON.stringify(opts || {});
  let f = dtfCache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, Object.assign({ timeZone: tz }, opts));
    dtfCache.set(key, f);
  }
  return f;
}
function fmtDate(d, tz, opts) {
  return dtf('en-GB', tz, opts).format(d);
}
const ISO_OPTS = { year: 'numeric', month: '2-digit', day: '2-digit' };
function isoDate(d, tz) {
  return dtf('en-CA', tz, ISO_OPTS).format(d);
}
export function ago_(minutes) {
  return new Date(Date.now() - minutes * 60000).toISOString();
}

export function getDefaultData(tz) {
  tz = tz || 'Asia/Jakarta';
  const d_ = offsetDays => isoDate(new Date(Date.now() + offsetDays * 86400000), tz);
  const labels = [];
  for (let i = 6; i >= 0; i--) labels.push(fmtDate(new Date(Date.now() - i * 86400000), tz, { day: 'numeric', month: 'short' }));

  return {
    plant: {
      name: 'Karawang Vehicle Plant (demo)',
      shift: 'Shift 1, 07:00–15:00',
      date: fmtDate(new Date(), tz, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    },

    kpis: {
      oee: 82.4, oeePrev: 81.9, fpy: 96.2, fpyPrev: 96.0,
      downtime: 3.8, downtimePrev: 4.5, availability: 92.5,
      defectRate: 2.1, scrapRate: 0.6, reworkRate: 0.8
    },

    trend: {
      labels: labels,
      oee: [80.1, 81.4, 79.8, 82.0, 83.1, 81.9, 82.4],
      attainment: [93.2, 94.1, 92.5, 95.0, 95.6, 94.2, 94.8],
      fpy: [95.4, 95.9, 95.1, 96.0, 96.5, 96.0, 96.2],
      defectRate: [2.6, 2.4, 2.7, 2.2, 2.0, 2.3, 2.1]
    },

    hourly: {
      labels: ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00'],
      target: [187, 187, 187, 188, 187, 187, 188, 187],
      actual: [176, 182, 170, 185, 168, 179, 181, 179]
    },

    lines: [
      { id: 'L01', name: 'Body Weld 1', status: 'Running', target: 470, actual: 455, cycle: 57, takt: 58, oee: 85.1 },
      { id: 'L02', name: 'Body Weld 2', status: 'Running', target: 470, actual: 440, cycle: 61, takt: 58, oee: 79.4 },
      { id: 'L03', name: 'Paint Shop', status: 'Running', target: 470, actual: 450, cycle: 56, takt: 58, oee: 83.0 },
      { id: 'L04', name: 'Assembly 1', status: 'Running', target: 470, actual: 447, cycle: 57, takt: 58, oee: 82.7 },
      { id: 'L05', name: 'Assembly 2', status: 'Down', target: 470, actual: 320, cycle: 63, takt: 58, oee: 64.2, note: 'Conveyor drive fault' },
      { id: 'L06', name: 'Engine Sub-Assy', status: 'Running', target: 470, actual: 462, cycle: 55, takt: 58, oee: 86.4 },
      { id: 'L07', name: 'Battery Pack', status: 'Running', target: 240, actual: 230, cycle: 112, takt: 115, oee: 81.6 },
      { id: 'L08', name: 'Trim & Chassis', status: 'Running', target: 470, actual: 442, cycle: 59, takt: 58, oee: 80.9 },
      { id: 'L09', name: 'Final Inspection', status: 'Running', target: 470, actual: 452, cycle: 56, takt: 58, oee: 87.2 },
      { id: 'L10', name: 'Hybrid Sub-Assy', status: 'Changeover', target: 235, actual: 152, cycle: 118, takt: 115, oee: 72.5, note: 'Planned model changeover' }
    ],

    aiOps: [
      { line: 'Assembly 2', type: 'Abnormality', signal: 'Conveyor motor current rose 24% above baseline before the stop.', confidence: 92, suggestion: 'Follow the line stop response and call Maintenance.', wi: 'WI-P02' },
      { line: 'Body Weld 2', type: 'Bottleneck', signal: 'Cycle time 61 s vs. takt 58 s for 6 consecutive cycles.', confidence: 88, suggestion: 'Check weld robot #3 tip wear and material presentation.', wi: 'WI-P03' },
      { line: 'Paint Shop', type: 'Visual', signal: 'Camera C-07 sees a paint-run pattern on door panels.', confidence: 81, suggestion: 'Notify Quality and check spray pressure.', wi: '' },
      { line: 'Assembly 1', type: 'Abnormality', signal: 'Torque values drifting toward the lower limit at station 4.', confidence: 74, suggestion: 'Run the torque tool verification.', wi: 'WI-P04' }
    ],

    equipment: [
      { id: 'M-101', name: 'Welding Robot #3', line: 'Body Weld 2', status: 'Running', availability: 91.0, utilization: 88, downtime: 1.2, failures: 3, risk: 78, temp: 71, vibration: 6.8, lastFailure: 'Weld tip wear', rec: 'Replace weld tip and check servo vibration in the next break.' },
      { id: 'M-102', name: 'Conveyor Drive A2', line: 'Assembly 2', status: 'Down', availability: 84.5, utilization: 72, downtime: 1.6, failures: 4, risk: 86, temp: 82, vibration: 9.1, lastFailure: 'Gearbox overheating', rec: 'Inspect gearbox bearing and lubrication before restart.' },
      { id: 'M-103', name: 'Paint Robot P1', line: 'Paint Shop', status: 'Running', availability: 95.8, utilization: 90, downtime: 0.3, failures: 1, risk: 34, temp: 45, vibration: 2.1, lastFailure: 'Nozzle clog', rec: 'Continue weekly PM.' },
      { id: 'M-104', name: 'Nutrunner Station 4', line: 'Assembly 1', status: 'Running', availability: 94.2, utilization: 85, downtime: 0.2, failures: 1, risk: 41, temp: 39, vibration: 1.8, lastFailure: 'Torque drift', rec: 'Calibrate nutrunner; values drifting low.' },
      { id: 'M-105', name: 'Spot Welder SW-12', line: 'Body Weld 1', status: 'Running', availability: 96.1, utilization: 92, downtime: 0.1, failures: 0, risk: 22, temp: 52, vibration: 2.4, lastFailure: '—', rec: 'No action needed.' },
      { id: 'M-106', name: 'Battery Module Tester', line: 'Battery Pack', status: 'Running', availability: 93.0, utilization: 80, downtime: 0.4, failures: 2, risk: 58, temp: 48, vibration: 1.2, lastFailure: 'Contact pin wear', rec: 'Clean and inspect contact pins this week.' },
      { id: 'M-107', name: 'Engine Leak Tester', line: 'Engine Sub-Assy', status: 'Running', availability: 97.4, utilization: 83, downtime: 0, failures: 0, risk: 18, temp: 36, vibration: 0.9, lastFailure: '—', rec: 'No action needed.' },
      { id: 'M-108', name: 'AGV Fleet Zone B', line: 'Trim & Chassis', status: 'Running', availability: 92.0, utilization: 76, downtime: 0, failures: 0, risk: 29, temp: 33, vibration: 1.1, lastFailure: 'Battery low', rec: 'Continue scheduled battery PM.' }
    ],

    failureHistory: [
      { date: d_(0), machine: 'M-102', event: 'Gearbox overheating, line stop', duration: 1.6 },
      { date: d_(0), machine: 'M-101', event: 'Weld tip wear, cycle loss', duration: 0.5 },
      { date: d_(-1), machine: 'M-101', event: 'Servo alarm, reset', duration: 0.4 },
      { date: d_(-2), machine: 'M-102', event: 'Belt slip', duration: 0.9 },
      { date: d_(-3), machine: 'M-106', event: 'Contact pin wear, false fail', duration: 0.4 },
      { date: d_(-5), machine: 'M-102', event: 'Drive sensor fault', duration: 0.4 },
      { date: d_(-6), machine: 'M-103', event: 'Nozzle clog', duration: 0.3 },
      { date: d_(-9), machine: 'M-101', event: 'Weld tip wear', duration: 0.3 }
    ],

    rca: {
      'M-102': {
        causes: [['Gearbox overheating', 2.1], ['Belt slip', 0.9], ['Drive sensor fault', 0.4]],
        params: [['Motor current', '+24% vs. baseline'], ['Gearbox temperature', '82 °C (limit 75 °C)'], ['Load per cycle', '+6% since new model']],
        finding: 'Overheating follows the load increase from the new model. Bearing wear is the most likely cause; lubrication interval is also overdue.'
      },
      'M-101': {
        causes: [['Weld tip wear', 0.8], ['Servo alarm', 0.4]],
        params: [['Vibration', '6.8 mm/s, rising'], ['Weld current', 'Stable'], ['Tip change interval', '1,450 welds (standard 1,200)']],
        finding: 'Tip changes are running late. Worn tips raise cycle time and correlate with panel-gap defects downstream.'
      },
      'M-106': {
        causes: [['Contact pin wear', 0.4]],
        params: [['False-fail rate', '1.8% (normal 0.5%)'], ['Pin cycles', '48k (limit 50k)']],
        finding: 'Pins are close to end of life. False fails rise as pins wear.'
      }
    },

    workOrders: [
      { id: 'WO-2410', equipment: 'M-102', task: 'Replace conveyor gearbox bearing', priority: 'Critical', assignee: 'Andi Saputra', due: d_(0), status: 'In Progress' },
      { id: 'WO-2411', equipment: 'M-101', task: 'Replace weld tip and recalibrate', priority: 'High', assignee: 'Budi Prakoso', due: d_(0), status: 'Open' },
      { id: 'WO-2412', equipment: 'M-106', task: 'Inspect tester contact pins', priority: 'Medium', assignee: 'Rina Kusuma', due: d_(2), status: 'Open' },
      { id: 'WO-2413', equipment: 'M-104', task: 'Torque calibration check', priority: 'Medium', assignee: 'Dewi Anggraini', due: d_(1), status: 'Open' },
      { id: 'WO-2414', equipment: 'M-108', task: 'AGV battery preventive maintenance', priority: 'Low', assignee: 'Fajar Hidayat', due: d_(4), status: 'Open' },
      { id: 'WO-2415', equipment: 'M-103', task: 'Paint nozzle cleaning PM', priority: 'Low', assignee: 'Rina Kusuma', due: d_(3), status: 'Waiting Parts' },
      { id: 'WO-2405', equipment: 'M-105', task: 'Electrode holder replacement', priority: 'Medium', assignee: 'Budi Prakoso', due: d_(-2), status: 'Completed' }
    ],

    alerts: [
      { id: 'AL-1031', time: '10:42', line: 'Assembly 2', type: 'Maintenance', severity: 'Critical', title: 'Line stopped, conveyor drive fault (M-102)', status: 'Open', owner: 'Maintenance Engineer', escalation: 1 },
      { id: 'AL-1030', time: '10:15', line: 'Paint Shop', type: 'Quality', severity: 'Critical', title: 'Paint-run defects above threshold (3.2% vs. 2.0%)', status: 'In Progress', owner: 'Quality Engineer', escalation: 0 },
      { id: 'AL-1029', time: '09:58', line: 'Body Weld 2', type: 'Production', severity: 'High', title: 'Cycle time 61 s exceeds takt 58 s', status: 'Open', owner: 'Team Leader', escalation: 0 },
      { id: 'AL-1028', time: '09:30', line: 'Battery Pack', type: 'Material', severity: 'Critical', title: 'Battery cell modules below 1.5 days of stock', status: 'Open', owner: 'Production Planner', escalation: 1 },
      { id: 'AL-1027', time: '08:47', line: 'Assembly 1', type: 'Quality', severity: 'Medium', title: 'Torque deviation trend at station 4', status: 'In Progress', owner: 'Quality Engineer', escalation: 0 },
      { id: 'AL-1026', time: '08:05', line: 'Body Weld 2', type: 'Maintenance', severity: 'High', title: 'Weld robot #3 vibration rising', status: 'In Progress', owner: 'Maintenance Engineer', escalation: 0 },
      { id: 'AL-1025', time: '07:32', line: 'Trim & Chassis', type: 'Production', severity: 'Low', title: 'Minor stoppages more frequent', status: 'Resolved', owner: 'Team Leader', escalation: 0 }
    ],

    workInstructions: [
      { id: 'WI-P01', title: 'Shift start checklist', category: 'Checklist', audience: 'production', steps: ['Confirm PPE and safety briefing are done', 'Test andon, emergency stop and light curtains', 'Check torque tools have valid calibration tags', 'Confirm line-side material for the first 2 hours', 'Review open alerts and the previous shift handover'] },
      { id: 'WI-P02', title: 'Line stop response', category: 'Abnormality', audience: 'production', steps: ['Pull the andon and keep the area safe', 'Team Leader confirms the stop reason within 3 minutes', 'If equipment-related, report an alert to Maintenance', 'Record stop start time and affected station', 'Restart only with Team Leader approval; record end time'] },
      { id: 'WI-P03', title: 'Cycle time deviation check', category: 'Abnormality', audience: 'production', steps: ['Compare station cycle time with takt on the monitor', 'Observe 5 cycles; note waiting or extra motion', 'Check tool, jig and material presentation', 'Report an alert if over takt for more than 10 cycles'] },
      { id: 'WI-P04', title: 'Torque tool verification', category: 'Inspection', audience: 'production', steps: ['Select the torque checker for the tool size', 'Run 3 test fastenings and record values', 'Values must be within ±5% of specification', 'If out of tolerance, tag the tool NG and replace it'] },
      { id: 'WI-E01', title: 'Conveyor drive troubleshooting', category: 'Troubleshooting', audience: 'engineering', steps: ['Apply lockout/tagout before inspection', 'Check motor current log and gearbox temperature', 'Inspect bearing noise, oil level and belt tension', 'Replace worn bearing or belt; record parts used', 'Run 10 dry cycles and confirm current is normal'] },
      { id: 'WI-E02', title: 'Weld robot tip change and calibration', category: 'Troubleshooting', audience: 'engineering', steps: ['Move robot to service position and lock out', 'Replace electrode tips and dress to profile', 'Run the TCP calibration routine', 'Make a test weld and peel test on a coupon'] },
      { id: 'WI-E03', title: 'Weekly PM: paint robot', category: 'Preventive Maintenance', audience: 'engineering', steps: ['Clean spray nozzles and bell cup', 'Check paint pressure and flow rate', 'Inspect hoses for leaks or wear', 'Record readings in the PM log'] },
      { id: 'WI-E04', title: 'Vibration inspection', category: 'Inspection', audience: 'engineering', steps: ['Attach the sensor to the bearing housing', 'Record velocity (mm/s) on 3 axes', 'Above 7.1 mm/s, create a High priority work order', 'Compare with the last reading and update notes'] }
    ],

    inspections: [
      { id: 'IN-5528', time: '11:12', line: 'Final Inspection', station: 'FI-02', unit: 'SIM-0881', result: 'Pass', defect: '', inspector: 'QC-01' },
      { id: 'IN-5527', time: '11:05', line: 'Paint Shop', station: 'P-Top Coat', unit: 'SIM-0879', result: 'Fail', defect: 'Paint Run', inspector: 'QC-03' },
      { id: 'IN-5526', time: '10:58', line: 'Final Inspection', station: 'FI-01', unit: 'SIM-0877', result: 'Pass', defect: '', inspector: 'QC-01' },
      { id: 'IN-5525', time: '10:44', line: 'Body Weld 2', station: 'BW2-07', unit: 'SIM-0874', result: 'Fail', defect: 'Panel Gap', inspector: 'QC-02' },
      { id: 'IN-5524', time: '10:31', line: 'Assembly 1', station: 'A1-04', unit: 'SIM-0870', result: 'Pass', defect: '', inspector: 'QC-02' },
      { id: 'IN-5523', time: '10:20', line: 'Final Inspection', station: 'FI-02', unit: 'SIM-0866', result: 'Pass', defect: '', inspector: 'QC-01' }
    ],

    defects: [
      { id: 'DF-892', time: d_(0) + ' 11:05', line: 'Paint Shop', station: 'P-Top Coat', batch: 'B-03', unit: 'SIM-0879', category: 'Paint Run', source: 'AI Vision', confidence: 91, status: 'Confirmed' },
      { id: 'DF-891', time: d_(0) + ' 10:52', line: 'Paint Shop', station: 'P-Top Coat', batch: 'B-03', unit: 'SIM-0875', category: 'Paint Run', source: 'AI Vision', confidence: 84, status: 'Pending Review' },
      { id: 'DF-890', time: d_(0) + ' 10:44', line: 'Body Weld 2', station: 'BW2-07', batch: 'B-03', unit: 'SIM-0874', category: 'Panel Gap', source: 'Manual', confidence: 0, status: 'Confirmed' },
      { id: 'DF-889', time: d_(0) + ' 10:12', line: 'Trim & Chassis', station: 'TC-03', batch: 'B-02', unit: 'SIM-0861', category: 'Scratch', source: 'AI Vision', confidence: 77, status: 'Pending Review' },
      { id: 'DF-888', time: d_(0) + ' 09:40', line: 'Assembly 1', station: 'A1-04', batch: 'B-02', unit: 'SIM-0852', category: 'Torque Out of Spec', source: 'Manual', confidence: 0, status: 'Confirmed' },
      { id: 'DF-887', time: d_(0) + ' 09:05', line: 'Paint Shop', station: 'P-Top Coat', batch: 'B-02', unit: 'SIM-0846', category: 'Paint Run', source: 'AI Vision', confidence: 88, status: 'Confirmed' },
      { id: 'DF-886', time: d_(0) + ' 08:31', line: 'Assembly 2', station: 'A2-06', batch: 'B-01', unit: 'SIM-0838', category: 'Loose Connector', source: 'Manual', confidence: 0, status: 'Confirmed' },
      { id: 'DF-885', time: d_(0) + ' 07:55', line: 'Body Weld 2', station: 'BW2-07', batch: 'B-01', unit: 'SIM-0829', category: 'Panel Gap', source: 'AI Vision', confidence: 80, status: 'Confirmed' }
    ],

    pareto: [
      { category: 'Paint Run', count: 34 }, { category: 'Panel Gap', count: 22 }, { category: 'Scratch', count: 15 },
      { category: 'Loose Connector', count: 9 }, { category: 'Torque Out of Spec', count: 6 }, { category: 'Others', count: 4 }
    ],

    qualityByLine: [
      { line: 'Body Weld 2', inspected: 440, fpy: 95.1, defects: 12, scrap: 0.9, rework: 1.2 },
      { line: 'Paint Shop', inspected: 450, fpy: 93.8, defects: 21, scrap: 0.8, rework: 1.6 },
      { line: 'Assembly 1', inspected: 447, fpy: 97.3, defects: 6, scrap: 0.3, rework: 0.6 },
      { line: 'Assembly 2', inspected: 320, fpy: 96.6, defects: 5, scrap: 0.4, rework: 0.7 },
      { line: 'Final Inspection', inspected: 452, fpy: 98.2, defects: 4, scrap: 0.2, rework: 0.4 }
    ],

    qRca: [
      { defect: 'Paint Run', factor: 'Spray booth humidity above 70%', strength: 0.72, confidence: 'High', evidence: '18 of 25 paint-run defects happened during high-humidity periods.' },
      { defect: 'Panel Gap', factor: 'Weld robot #3 cycle time deviation and tip wear', strength: 0.58, confidence: 'Medium', evidence: 'Panel-gap rate doubles when robot #3 cycle time is above 60 s.' },
      { defect: 'Torque Out of Spec', factor: 'Nutrunner calibration older than 30 days', strength: 0.51, confidence: 'Medium', evidence: 'All 6 cases came from tools past the calibration interval.' },
      { defect: 'Loose Connector', factor: 'New operator at station A2-06', strength: 0.36, confidence: 'Low', evidence: 'Defects cluster in the first 2 weeks after operator rotation.' }
    ],

    capa: [
      { id: 'CA-301', issue: 'Paint run above threshold', action: 'Tighten booth humidity setpoint; add hourly check', owner: 'Sari Wulandari', deadline: d_(4), status: 'In Progress', verification: 'Pending' },
      { id: 'CA-302', issue: 'Panel gap at Body Weld 2', action: 'Recalibrate weld fixture JIG-04', owner: 'Andi Saputra', deadline: d_(2), status: 'Open', verification: 'Pending' },
      { id: 'CA-303', issue: 'Torque deviation at station 4', action: 'Calibrate nutrunner; shorten interval to 14 days', owner: 'Dewi Anggraini', deadline: d_(-1), status: 'Verification', verification: 'Monitoring 3 shifts' },
      { id: 'CA-304', issue: 'Loose connector at A2-06', action: 'Add click-check step to the work instruction', owner: 'Siti Rahma', deadline: d_(6), status: 'Open', verification: 'Pending' },
      { id: 'CA-305', issue: 'Scratches on door trim', action: 'Replace handling gloves; pad the fixture', owner: 'Sari Wulandari', deadline: d_(3), status: 'In Progress', verification: 'Pending' },
      { id: 'CA-298', issue: 'Leak test false rejects', action: 'Replace test seals; update PM interval', owner: 'Rina Kusuma', deadline: d_(-8), status: 'Closed', verification: 'Effective' }
    ],

    materials: [
      { code: 'MAT-BC01', name: 'Battery cell module', category: 'Electrified', unit: 'pcs', stock: 1150, daily: 820, area: 'Battery Pack' },
      { code: 'MAT-IV02', name: 'Inverter unit', category: 'Electrified', unit: 'pcs', stock: 640, daily: 390, area: 'Hybrid Sub-Assy' },
      { code: 'MAT-WH03', name: 'EV wire harness', category: 'Electrified', unit: 'pcs', stock: 300, daily: 160, area: 'Assembly 2' },
      { code: 'MAT-SC04', name: 'Steel coil 0.8 mm', category: 'Body & Steel', unit: 'coil', stock: 85, daily: 22, area: 'Body Weld 1' },
      { code: 'MAT-ST05', name: 'Seat assembly', category: 'Interior', unit: 'set', stock: 1500, daily: 545, area: 'Trim & Chassis' },
      { code: 'MAT-DP06', name: 'Front door panel', category: 'Body & Steel', unit: 'pcs', stock: 2400, daily: 545, area: 'Body Weld 2' },
      { code: 'MAT-PT07', name: 'Top coat paint, pearl', category: 'Paint & Chemicals', unit: 'L', stock: 3200, daily: 600, area: 'Paint Shop' },
      { code: 'MAT-EN08', name: 'Engine 1.5 L', category: 'Powertrain', unit: 'pcs', stock: 1900, daily: 360, area: 'Engine Sub-Assy' },
      { code: 'MAT-TR09', name: 'Tire set', category: 'Interior', unit: 'set', stock: 4100, daily: 545, area: 'Trim & Chassis' },
      { code: 'MAT-CP10', name: 'Charging port assembly', category: 'Electrified', unit: 'pcs', stock: 600, daily: 45, area: 'Assembly 2' }
    ],

    materialFlow: [
      { id: 'MF-7706', material: 'Battery cell module', qty: 600, from: 'Warehouse A', to: 'Battery Pack', status: 'In Transit', eta: '11:30' },
      { id: 'MF-7705', material: 'Inverter unit', qty: 300, from: 'Supplier dock', to: 'Hybrid Sub-Assy', status: 'Delayed', eta: '14:00' },
      { id: 'MF-7704', material: 'Seat assembly', qty: 400, from: 'Warehouse B', to: 'Trim & Chassis', status: 'In Transit', eta: '11:15' },
      { id: 'MF-7703', material: 'Front door panel', qty: 500, from: 'Warehouse B', to: 'Body Weld 2', status: 'Delivered', eta: '09:40' },
      { id: 'MF-7702', material: 'Top coat paint, pearl', qty: 800, from: 'Chemical store', to: 'Paint Shop', status: 'Delivered', eta: '08:50' },
      { id: 'MF-7701', material: 'Tire set', qty: 600, from: 'Warehouse C', to: 'Trim & Chassis', status: 'Delivered', eta: '08:10' }
    ],

    orders: [11400, 9800, 7600, 5200, 3100, 1500],

    simSettings: {
      baseDemand: { ICE: 6000, HEV: 3000, PHEV: 1800, BEV: 1200 },
      growth: { ICE: -2, HEV: 3, PHEV: 5, BEV: 10 },
      monthlyCapacity: 13800,
      plannedVolume: 12000,
      maxShare: { PHEV: 20, BEV: 15 },
      batteryModulesPerUnit: { ICE: 0, HEV: 1, PHEV: 4, BEV: 8 },
      batterySupplyPerMonth: 19000,
      shiftHours: 8,
      currentMix: { ICE: 55, HEV: 25, PHEV: 12, BEV: 8 },
      recommendedMix: { ICE: 50, HEV: 25, PHEV: 15, BEV: 10 }
    },

    changeRequests: [
      { id: 'PSR-015', title: 'BEV ramp-up scenario', mix: { ICE: 45, HEV: 25, PHEV: 15, BEV: 15 }, submittedBy: 'Production Planner', date: d_(-2), status: 'Engineering Review', notes: 'Prepare for BEV demand growth next quarter.', engineeringNote: '', comment: '' },
      { id: 'PSR-014', title: 'Rebalance toward electrified', mix: { ICE: 50, HEV: 25, PHEV: 15, BEV: 10 }, submittedBy: 'Production Planner', date: d_(-4), status: 'Awaiting Approval', notes: 'Follows the AI recommendation.', engineeringNote: 'Feasible. Battery line at 86% load; needs +800 modules/month.', comment: '' },
      { id: 'PSR-012', title: 'Year-end HEV boost', mix: { ICE: 55, HEV: 25, PHEV: 12, BEV: 8 }, submittedBy: 'Production Planner', date: d_(-21), status: 'Approved', notes: '', engineeringNote: 'Feasible.', comment: 'Approved for current quarter.' }
    ],

    engChanges: [
      { id: 'ECR-209', type: 'Line configuration', line: 'Battery Pack', description: 'Add a second module tester to raise BEV capacity', requester: 'Process Engineer', date: d_(-3), status: 'Proposed' },
      { id: 'ECR-208', type: 'Tooling', line: 'Body Weld 2', description: 'Replace locating pins on weld fixture JIG-04', requester: 'Process Engineer', date: d_(-5), status: 'Under Review' },
      { id: 'ECR-205', type: 'Equipment', line: 'Paint Shop', description: 'Upgrade spray booth humidity control', requester: 'Maintenance Engineer', date: d_(-12), status: 'Approved' }
    ],

    aiRecs: [
      { id: 'AR-1', priority: 'High', area: 'Maintenance', title: 'Replace the Assembly 2 conveyor gearbox bearing before restart', evidence: 'Motor current +24%, gearbox at 82 °C, 4 failures in 7 days.', impact: 'Recover about 150 units per shift; avoid repeat downtime.', status: 'New' },
      { id: 'AR-2', priority: 'High', area: 'Quality', title: 'Keep spray booth humidity below 65%', evidence: '72% of paint-run defects occurred in high-humidity periods.', impact: 'Defect rate −0.6 pt, FPY +0.5 pt.', status: 'New' },
      { id: 'AR-3', priority: 'High', area: 'Planning', title: 'Shift the product mix to 50/25/15/10 (ICE/HEV/PHEV/BEV)', evidence: 'PHEV and BEV demand growing 5–10% per month; current mix under-serves them.', impact: 'Demand coverage +5 pt; needs +800 battery modules per month.', status: 'New' },
      { id: 'AR-4', priority: 'Medium', area: 'Maintenance', title: 'Change weld robot #3 tips in the next break', evidence: 'Vibration 6.8 mm/s and rising; tip change overdue by 250 welds.', impact: 'Prevent about 1 h of unplanned downtime.', status: 'New' },
      { id: 'AR-5', priority: 'Medium', area: 'Production', title: 'Rebalance work content at station A2-06', evidence: 'Station wait time 14% above line average.', impact: 'Cycle time −2 s on Assembly 2.', status: 'New' }
    ],

    crossInsights: [
      { title: 'Weld robot #3 wear is driving panel-gap defects', links: ['Maintenance', 'Quality', 'Production'], evidence: 'Panel-gap defects rose 40% as robot #3 vibration increased; Body Weld 2 cycle time is 3 s over takt.', action: 'Handle WO-2411 and CA-302 together in the next break.' },
      { title: 'Battery module stock limits the electrified mix change', links: ['Logistics', 'Planning', 'Management'], evidence: 'Stock covers 1.4 days; the recommended mix needs 4% more modules than monthly supply.', action: 'Secure extra supply before approving PSR-014.' },
      { title: 'Humidity peaks match paint-run defects and rework load', links: ['Quality', 'Engineering', 'Production'], evidence: 'Rework at Paint Shop doubles on days with humidity above 70%.', action: 'Fast-track ECR-205 humidity control upgrade.' },
      { title: 'Assembly 2 stop leaves Final Inspection idle', links: ['Production', 'Maintenance'], evidence: 'Each hour of Assembly 2 downtime idles Final Inspection for about 25 minutes.', action: 'Prioritise WO-2410 and add a buffer plan.' }
    ],

    ciItems: [
      { id: 'CI-01', initiative: 'Reduce Body Weld 2 cycle time', kpi: 'Cycle time (s)', baseline: 63, target: 58, actual: 61, owner: 'Process Engineer', status: 'On Track' },
      { id: 'CI-02', initiative: 'Cut paint-run defects', kpi: 'Paint-run rate (%)', baseline: 3.5, target: 1.5, actual: 3.2, owner: 'Quality Engineer', status: 'At Risk' },
      { id: 'CI-03', initiative: 'Raise Assembly 2 OEE', kpi: 'OEE (%)', baseline: 74, target: 85, actual: 76, owner: 'Production Supervisor', status: 'At Risk' },
      { id: 'CI-04', initiative: 'Battery line availability', kpi: 'Availability (%)', baseline: 89, target: 95, actual: 93, owner: 'Maintenance Engineer', status: 'On Track' },
      { id: 'CI-05', initiative: 'Faster changeover, Hybrid Sub-Assy', kpi: 'Changeover (min)', baseline: 45, target: 25, actual: 30, owner: 'Process Engineer', status: 'On Track' }
    ],

    users: [
      { id: 'U01', name: 'Admin Demo', email: 'admin@demo.local', position: 'System Administrator', role: 'admin', status: 'Active' },
      { id: 'U02', name: 'Rizky Pratama', email: 'rizky@demo.local', position: 'Line Operator', role: 'production', status: 'Active' },
      { id: 'U03', name: 'Siti Rahma', email: 'siti@demo.local', position: 'Team Leader', role: 'production', status: 'Active' },
      { id: 'U04', name: 'Andi Saputra', email: 'andi@demo.local', position: 'Maintenance Engineer', role: 'engineering', status: 'Active' },
      { id: 'U05', name: 'Sari Wulandari', email: 'sari@demo.local', position: 'Quality Engineer', role: 'quality', status: 'Active' },
      { id: 'U06', name: 'Dimas Hidayat', email: 'dimas@demo.local', position: 'Production Planner', role: 'logistics', status: 'Active' },
      { id: 'U07', name: 'Hendra Wijaya', email: 'hendra@demo.local', position: 'Plant Manager', role: 'plant', status: 'Active' },
      { id: 'U08', name: 'Maya Lestari', email: 'maya@demo.local', position: 'Warehouse Staff', role: 'logistics', status: 'Inactive' }
    ],

    permissions: {},

    masterData: {
      lines: ['Body Weld 1', 'Body Weld 2', 'Paint Shop', 'Assembly 1', 'Assembly 2', 'Engine Sub-Assy', 'Battery Pack', 'Trim & Chassis', 'Final Inspection', 'Hybrid Sub-Assy'],
      machines: ['M-101 Welding Robot #3', 'M-102 Conveyor Drive A2', 'M-103 Paint Robot P1', 'M-104 Nutrunner Station 4', 'M-105 Spot Welder SW-12', 'M-106 Battery Module Tester', 'M-107 Engine Leak Tester', 'M-108 AGV Fleet Zone B'],
      models: ['MPV 1.5 ICE', 'MPV 2.0 HEV', 'SUV 2.5 HEV', 'SUV 2.5 PHEV', 'Compact BEV'],
      defectCategories: ['Paint Run', 'Panel Gap', 'Scratch', 'Loose Connector', 'Torque Out of Spec', 'Others'],
      materialCategories: ['Body & Steel', 'Powertrain', 'Electrified', 'Interior', 'Paint & Chemicals']
    },

    alertConfig: [
      { id: 'AC1', type: 'Production', metric: 'Cycle time vs. takt', threshold: '> 105% of takt', severity: 'High', owner: 'Team Leader', escalateMin: 30, escalateTo: 'Production Supervisor' },
      { id: 'AC2', type: 'Production', metric: 'Line stop', threshold: '> 5 min', severity: 'Critical', owner: 'Team Leader', escalateMin: 15, escalateTo: 'Plant Manager' },
      { id: 'AC3', type: 'Quality', metric: 'Defect rate', threshold: '> 2.0%', severity: 'High', owner: 'Quality Engineer', escalateMin: 60, escalateTo: 'Plant Manager' },
      { id: 'AC4', type: 'Quality', metric: 'Repeat defect, same category', threshold: '≥ 3 in 1 hour', severity: 'High', owner: 'Quality Inspector', escalateMin: 30, escalateTo: 'Quality Engineer' },
      { id: 'AC5', type: 'Maintenance', metric: 'Equipment risk score', threshold: '≥ 70', severity: 'High', owner: 'Maintenance Engineer', escalateMin: 120, escalateTo: 'Plant Manager' },
      { id: 'AC6', type: 'Material', metric: 'Stock coverage', threshold: '< 2 days', severity: 'Critical', owner: 'Production Planner', escalateMin: 60, escalateTo: 'Operations Manager' }
    ],

    audit: [
      { time: ago_(35), user: 'Demo user (Quality Control & Assurance)', role: 'Quality Control & Assurance', action: 'Record inspection', detail: 'IN-5527 SIM-0879 Fail (Paint Run)' },
      { time: ago_(80), user: 'Demo user (Production & Operations)', role: 'Production & Operations', action: 'Report alert', detail: 'AL-1031 Line stopped, conveyor drive fault' },
      { time: ago_(1440), user: 'Demo user (Logistics & Production Planning)', role: 'Logistics & Production Planning', action: 'Submit plan for approval', detail: 'PSR-015 BEV ramp-up scenario' },
      { time: ago_(2880), user: 'Demo user (System Administrator)', role: 'System Administrator', action: 'Update alert configuration', detail: 'AC3 defect rate threshold > 2.0%' }
    ],

    // Takumi Copilot knowledge base (Solution 2): validated cases with owner and source
    knowledge: [
      { id: 'KB-014', title: 'Conveyor gearbox overheating after load increase', line: 'Assembly 2', equipment: 'M-102', symptom: 'Motor current +20% and gearbox above 75 °C', rootCause: 'Bearing wear accelerated by higher load per cycle; lubrication overdue', countermeasure: 'Replace bearing, shorten lubrication interval to 2 weeks, check load after model change', result: 'No repeat for 6 months on Assembly 1', owner: 'Pak Hartono (Senior Maintenance)', status: 'Approved', source: 'A3-2025-031, WO-2188' },
      { id: 'KB-021', title: 'Panel gap from worn weld tips', line: 'Body Weld 2', equipment: 'M-101', symptom: 'Panel gap defects rise when cycle time exceeds 60 s', rootCause: 'Tip change interval exceeded (1,450 vs 1,200 welds)', countermeasure: 'Enforce tip change at 1,200 welds; add vibration check', result: 'Panel gap −45% in pilot', owner: 'Pak Hartono (Senior Maintenance)', status: 'Approved', source: '5-Why-2025-112' },
      { id: 'KB-033', title: 'Paint run during high humidity', line: 'Paint Shop', equipment: 'M-103', symptom: 'Paint run on door panels, top coat', rootCause: 'Booth humidity above 70% changes paint viscosity', countermeasure: 'Keep humidity below 65%; hourly check; adjust spray pressure', result: 'Paint-run rate 3.4% → 1.6% in 2024 trial', owner: 'Bu Sari (Quality Engineer)', status: 'Approved', source: 'A3-2024-077' },
      { id: 'KB-040', title: 'Battery tester false fails from pin wear', line: 'Battery Pack', equipment: 'M-106', symptom: 'False-fail rate above 1.5%', rootCause: 'Contact pins near 50k-cycle life', countermeasure: 'Replace pins at 45k cycles; clean weekly', result: 'False fails back to 0.5%', owner: 'Rina Kusuma (Maintenance)', status: 'Approved', source: 'WO-2290' },
      { id: 'KB-052', title: 'Missed sealer found at final inspection', line: 'Body Weld 1', equipment: '', symptom: 'Sealer missing on rear wheel house, found late', rootCause: 'Manual application; no upstream feedback from inspection', countermeasure: 'AI camera check after sealer station (shadow mode first); feedback to team leader', result: 'Draft – awaiting validation', owner: 'Bu Sari (Quality Engineer)', status: 'Draft', source: 'Genba interview 2026-09' }
    ],

    // Kaizen ideas pipeline (protected kaizen time, Solution 2 Elevate)
    kaizen: [
      { id: 'KZ-118', title: 'Kitting cart for battery modules to cut walking', submitter: 'Rizky Pratama (Operator)', area: 'Battery Pack', status: 'Implemented', saving: 'NVA −1.2 pt at station', date: d_(-20) },
      { id: 'KZ-121', title: 'Alert threshold tuning for paint camera C-07', submitter: 'Siti Rahma (Team Leader)', area: 'Paint Shop', status: 'Trial', saving: 'False alarms −30% (target)', date: d_(-6) },
      { id: 'KZ-124', title: 'Simulate second module tester before ECR-209', submitter: 'Andi Saputra (Engineer)', area: 'Battery Pack', status: 'Review', saving: 'Avoid rework on line change', date: d_(-2) }
    ]
  };
}
