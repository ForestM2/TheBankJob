const MAP_DATA = (() => {
  const nodes = [];
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      nodes.push({ id: `n${row}${col}`, row, col });
    }
  }
  nodes.push({ id: 'bank', outside: true, row: -1, col: 0 });
  nodes.push({ id: 'hideout', outside: true, row: 5, col: 4 });

  const omitted = new Set(['n03|n04', 'n04|n14']);
  const edgeKey = (a, b) => [a, b].sort().join('|');
  const edges = [];
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      const here = `n${row}${col}`;
      if (col < 4) {
        const right = `n${row}${col + 1}`;
        if (!omitted.has(edgeKey(here, right))) edges.push([here, right]);
      }
      if (row < 4) {
        const down = `n${row + 1}${col}`;
        if (!omitted.has(edgeKey(here, down))) edges.push([here, down]);
      }
    }
  }
  edges.push(['n03', 'n14'], ['bank', 'n00'], ['n44', 'hideout']);

  const roadblockLayouts = [
    { name: 'Bypass test 1 — block 15–20', blocked: [['n24','n34']] },
    { name: 'Bypass map — no roadblocks', blocked: [] }
  ];

  const levelOnePatrols = [
    {
      id: 'P1',
      territory: nodes.filter(node => !node.outside && node.row >= 1 && node.row <= 3).map(node => node.id),
      patterns: [{ id: 'P1-A-SHIFTED', waypoints: ['n14', 'n22', 'n30', 'n32'] }]
    },
    {
      id: 'P2',
      territory: nodes.filter(node => !node.outside && node.row >= 3).map(node => node.id),
      patterns: [
        { id: 'P2-A-PERIMETER', waypoints: ['n30', 'n34', 'n44', 'n40'] },
        { id: 'P2-B-CROSSING', waypoints: ['n30', 'n42', 'n34', 'n41', 'n44'] },
        { id: 'P2-C-ZIGZAG', waypoints: ['n32', 'n40', 'n43', 'n30', 'n44'] }
      ]
    }
  ];

  return { nodes, edges, roadblockLayouts, levelOnePatrols, edgeKey };
})();

if (typeof module !== 'undefined') module.exports = MAP_DATA;
