
////////////////////////
//obstacle build count//
////////////////////////

listObstaclesWithFewerThanTenBuilds = () => {
// show agility obstacles that have been built less than 10 times
    agilityObstacleBuildCount.map((_, i) => i)
        .filter(i => agilityObstacleBuildCount[i] < 10)
        .map(i => agilityObstacles[i])
        .map(x => [x.category + 1, x.name]);
}
