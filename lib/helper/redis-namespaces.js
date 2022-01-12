const targets = 'targets'
const route = 'route'

module.exports = {
  targets: {
    base: targets,
    // to store current sequence count of target
    seqCount: `${targets}:seq_count`,

    // to store list of ids of targets
    list: `${targets}:list`,

    // to store target details
    id: (id) => `${targets}:${id}`,

    // to store list of sorted sets associated with target
    sortedSets: (id) => `${targets}:${id}:sortedSets`,

    // to store target count by date
    byDateCount: (id, date) => `${targets}:${id}:date:${date}:counts`
  },
  route: {
    base: 'route',
    // to store state and hours sorted sets, it helps to quickly find the next target
    stateAndHourSortedSets: (state, hour) => `${route}:geoState:${state}:hour:${hour}`
  }
}
