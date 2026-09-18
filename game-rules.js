const GETAWAY_RULES = (() => {
  function graph(data, layout) {
    const blocked = new Set(layout.blocked.map(edge => data.edgeKey(...edge)));
    const result = new Map(data.nodes.map(node => [node.id, []]));
    data.edges.forEach(([a, b]) => {
      if (blocked.has(data.edgeKey(a, b))) return;
      result.get(a).push(b);
      result.get(b).push(a);
    });
    result.forEach(list => list.sort());
    return result;
  }

  function shortestStep(network, from, target) {
    if (from === target) return from;
    const queue = [from], previous = new Map([[from, null]]);
    while (queue.length) {
      const at = queue.shift();
      for (const next of network.get(at) || []) {
        if (previous.has(next)) continue;
        previous.set(next, at);
        if (next === target) {
          let step = target;
          while (previous.get(step) !== from) step = previous.get(step);
          return step;
        }
        queue.push(next);
      }
    }
    return from;
  }

  function shortestDistance(network, from, target) {
    const queue = [[from, 0]], seen = new Set([from]);
    while (queue.length) {
      const [at, distance] = queue.shift();
      if (at === target) return distance;
      for (const next of network.get(at) || []) {
        if (!seen.has(next)) { seen.add(next); queue.push([next, distance + 1]); }
      }
    }
    return Infinity;
  }

  function trailAwareDecision(network, from, target, trail, random = Math.random) {
    const directDistance = shortestDistance(network, from, target);
    const shortestOptions = (network.get(from) || []).filter(next =>
      1 + shortestDistance(network, next, target) === directDistance);
    const alternatives = shortestOptions.filter(next => next !== trail);
    if (shortestOptions.includes(trail) && alternatives.length) {
      const roll = Math.floor(random() * 6) + 1;
      const next = roll <= 4 ? trail : alternatives[Math.floor(random() * alternatives.length)];
      return { next, roll, mode: roll <= 4 ? 'FOLLOW_TRAIL' : 'PARALLEL_ROUTE', shortestOptions };
    }
    return { next: shortestOptions[0] || from, roll: null,
      mode: shortestOptions.includes(trail) ? 'TRAIL_ONLY' : 'SHORTEST_ONLY', shortestOptions };
  }

  function trailAwareStep(network, from, target, trail, random = Math.random) {
    return trailAwareDecision(network, from, target, trail, random).next;
  }

  function restrictedGraph(network, territory) {
    const allowed = new Set(territory);
    const result = new Map();
    territory.forEach(node => result.set(node, (network.get(node) || []).filter(next => allowed.has(next))));
    return result;
  }

  function patrolStep(config, network, patrol, random = Math.random) {
    const pattern = config.patterns.find(candidate => candidate.id === patrol.patternId);
    const waypoints = pattern.waypoints;
    const localNetwork = restrictedGraph(network, config.territory);
    let waypointIndex = patrol.waypointIndex;
    let previousWaypoint = patrol.previousWaypoint;
    if (patrol.current === waypoints[waypointIndex]) {
      const candidates = waypoints.map((_, index) => index).filter(index =>
        waypoints[index] !== patrol.current && waypoints[index] !== previousWaypoint);
      waypointIndex = candidates[Math.floor(random() * candidates.length)];
      previousWaypoint = patrol.current;
      const current = shortestStep(localNetwork, patrol.current, waypoints[waypointIndex]);
      return { patternId: patrol.patternId, current, waypointIndex, previousWaypoint,
        lastDestinationChoice: { from: previousWaypoint, target: waypoints[waypointIndex], candidates: candidates.map(index => waypoints[index]) } };
    }
    const current = shortestStep(localNetwork, patrol.current, waypoints[waypointIndex]);
    return { patternId: patrol.patternId, current, waypointIndex, previousWaypoint,
      lastDestinationChoice: null };
  }

  function newPatrol(config, random = Math.random) {
    const pattern = config.patterns[Math.floor(random() * config.patterns.length)];
    const count = pattern.waypoints.length;
    const startIndex = Math.floor(random() * count);
    const candidates = pattern.waypoints.map((_, index) => index).filter(index => index !== startIndex);
    const waypointIndex = candidates[Math.floor(random() * candidates.length)];
    return { patternId: pattern.id, current: pattern.waypoints[startIndex], waypointIndex,
      previousWaypoint: pattern.waypoints[startIndex], lastDestinationChoice: null };
  }

  function reachable(network, from, target) {
    const queue = [from], seen = new Set([from]);
    while (queue.length) {
      const at = queue.shift();
      if (at === target) return true;
      for (const next of network.get(at) || []) {
        if (!seen.has(next)) { seen.add(next); queue.push(next); }
      }
    }
    return false;
  }

  return { graph, restrictedGraph, shortestStep, shortestDistance, trailAwareDecision, trailAwareStep, patrolStep, newPatrol, reachable };
})();

if (typeof module !== 'undefined') module.exports = GETAWAY_RULES;
