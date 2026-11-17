import type { Equipment } from './types';

// Equipment for «Мой зал» (stage 4). `art` — Everkinetic picture of a typical exercise on it.
// Order = order on the «Оборудование» screen: free weights → benches and racks → cables → machines → accessories.
export const EQUIPMENT: Equipment[] = [
  { id: 'barbell', name: 'Штанга', class: 'barbell', art: '0099' },
  { id: 'ez_bar', name: 'EZ-гриф', class: 'barbell', art: '0226' },
  { id: 'dumbbells', name: 'Гантели', class: 'dumbbell', art: '0224' },
  { id: 'kettlebell', name: 'Гиря', class: 'kettlebell' },
  { id: 'plates', name: 'Блины', class: 'accessory', art: '0241' },
  { id: 'bench_flat', name: 'Горизонтальная скамья', class: 'bench', art: '0055' },
  { id: 'bench_adj', name: 'Регулируемая скамья', class: 'bench', art: '0061' },
  { id: 'preacher_bench', name: 'Скамья Скотта', class: 'bench', art: '0239' },
  { id: 'hyperextension', name: 'Скамья для гиперэкстензии', class: 'bench', art: '0103' },
  { id: 'rack', name: 'Силовая рама со страховкой', class: 'rack', art: '0122' },
  { id: 'smith', name: 'Машина Смита', class: 'smith', art: '0124' },
  { id: 'pullup_bar', name: 'Турник', class: 'bodyweight', art: '0087' },
  { id: 'dip_bars', name: 'Брусья', class: 'bodyweight', art: '0054' },
  { id: 'cable_tower', name: 'Блочная рама (кроссовер)', class: 'cable', art: '0048' },
  { id: 'lat_pulldown', name: 'Верхний блок', class: 'cable', art: '0096' },
  { id: 'cable_row', name: 'Нижний блок', class: 'cable', art: '0025' },
  { id: 'assisted_pullup', name: 'Гравитрон', class: 'machine_stack' },
  { id: 't_bar', name: 'Т-гриф с упором', class: 'machine_plate', art: '0029' },
  { id: 'row_machine', name: 'Тренажёр для тяги', class: 'machine_stack' },
  { id: 'chest_press', name: 'Жим от груди в тренажёре', class: 'machine_stack', art: '0066' },
  { id: 'shoulder_press', name: 'Жим вверх в тренажёре', class: 'machine_stack' },
  { id: 'pec_deck', name: 'Бабочка', class: 'machine_stack' },
  { id: 'lateral_machine', name: 'Тренажёр для махов', class: 'machine_stack' },
  { id: 'leg_press', name: 'Жим ногами', class: 'machine_plate', art: '0127' },
  { id: 'hack_squat', name: 'Гакк-машина', class: 'machine_plate', art: '0123' },
  { id: 'leg_extension', name: 'Разгибание ног', class: 'machine_stack', art: '0142' },
  { id: 'leg_curl_lying', name: 'Сгибание ног лёжа', class: 'machine_stack', art: '0117' },
  { id: 'leg_curl_seated', name: 'Сгибание ног сидя', class: 'machine_stack', art: '0119' },
  { id: 'hip_abductor', name: 'Разведение ног', class: 'machine_stack', art: '0156' },
  { id: 'hip_adductor', name: 'Сведение ног', class: 'machine_stack', art: '0157' },
  { id: 'hip_thrust_machine', name: 'Тренажёр для ягодичного моста', class: 'machine_plate' },
  { id: 'calf_standing', name: 'Икры стоя', class: 'machine_stack', art: '0282' },
  { id: 'calf_seated', name: 'Икры сидя', class: 'machine_plate', art: '0279' },
  { id: 'bands', name: 'Резиновые петли', class: 'band', art: '0155' },
  { id: 'box', name: 'Платформа', class: 'accessory', art: '0137' },
  { id: 'mat', name: 'Коврик', class: 'accessory', art: '0291' },
];

export const EQUIP: Record<string, Equipment> = Object.fromEntries(EQUIPMENT.map((e) => [e.id, e]));
