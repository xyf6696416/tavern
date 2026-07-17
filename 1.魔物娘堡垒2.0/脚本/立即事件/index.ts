import { getAllVariables } from 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/stl.js';

$(async () => {
  // ──────────────────────────────────────────────
  // 边界条件：恶堕值 == 0 → "最后的圣洁"
  // ──────────────────────────────────────────────
  injectPrompts([
    {
      id: 'evil-corruption-zero',
      position: 'none',
      depth: 0,
      role: 'system',
      content: '【【最后的圣洁】】',
      filter: () => _.get(getAllVariables(), 'stat_data.主角.恶堕值') === 0,
      should_scan: true,
    },
  ]);

  // ──────────────────────────────────────────────
  // 边界条件：恶堕值 == 100 → "深渊回响"
  // ──────────────────────────────────────────────
  injectPrompts([
    {
      id: 'evil-corruption-full',
      position: 'none',
      depth: 0,
      role: 'system',
      content: '【【深渊回响】】',
      filter: () => _.get(getAllVariables(), 'stat_data.主角.恶堕值') === 100,
      should_scan: true,
    },
  ]);

  // ──────────────────────────────────────────────
  // 边界条件：侵蚀度 == 0 → "黎明破晓"
  // ──────────────────────────────────────────────
  injectPrompts([
    {
      id: 'erosion-zero',
      position: 'none',
      depth: 0,
      role: 'system',
      content: '【【黎明破晓】】',
      filter: () => _.get(getAllVariables(), 'stat_data.世界.侵蚀度') === 0,
      should_scan: true,
    },
  ]);

  // ──────────────────────────────────────────────
  // 边界条件：侵蚀度 == 100 → "永夜降临"
  // ──────────────────────────────────────────────
  injectPrompts([
    {
      id: 'erosion-full',
      position: 'none',
      depth: 0,
      role: 'system',
      content: '【【永夜降临】】',
      filter: () => _.get(getAllVariables(), 'stat_data.世界.侵蚀度') === 100,
      should_scan: true,
    },
  ]);

  // ──────────────────────────────────────────────
  // 边界条件：雌堕值 == 100 → "完全转化"
  // ──────────────────────────────────────────────
  injectPrompts([
    {
      id: 'fem-corruption-full',
      position: 'none',
      depth: 0,
      role: 'system',
      content: '【【完全转化】】',
      filter: () => _.get(getAllVariables(), 'stat_data.主角.雌堕值') === 100,
      should_scan: true,
    },
  ]);

  // ──────────────────────────────────────────────
  // 边界条件：生命值 == 0 → "濒死体验"
  // ──────────────────────────────────────────────
  injectPrompts([
    {
      id: 'hp-zero',
      position: 'none',
      depth: 0,
      role: 'system',
      content: '【【濒死体验】】',
      filter: () => _.get(getAllVariables(), 'stat_data.主角.生命值') === 0,
      should_scan: true,
    },
  ]);
});