pathfinding =
  step: 0.25
  getSmoothPath: (start, end, grid) ->
    unless pathfinding.isCellWalkable(end, grid)
      end = pathfinding.findNearestWalkableCell(end, grid)
    path = pathfinding.getPath(start, end, grid)
    pathfinding.smoothPath(path, grid)

  getPath: (start, end, grid) ->
    len = grid.length
    pathGrid = new PF.Grid(len, len, grid)
    finder = new PF.AStarFinder
      allowDiagonal: true
      dontCrossCorners: true
    finder.findPath(start[0], start[1], end[0], end[1], pathGrid)

  smoothPath: (path, grid) ->
    if path.length > 2
      index = 1
      newPath = [path[1]]
      i = index + 1
      lastPath = path[1]
      while path[i]
        from = path[index]
        to = path[i]
        if pathfinding.isWalkablePath(from, to, grid)
          lastPath = path[i]
        else
          newPath.push lastPath
          index = i - 1
          lastPath = path[i]
        i++
      newPath.push lastPath
      newPath
    else
      path

  getVector: (from, to) ->
    vector = [
      to[0] - from[0]
      to[1] - from[1]
    ]
    distance = Math.sqrt(Math.pow(vector[0], 2) + Math.pow(vector[1], 2))
    if distance is 0
      [0, 0, 0]
    else
      [
        vector[0] / distance
        vector[1] / distance
        distance
      ]

  getPoints: (from, to) ->
    vector = pathfinding.getVector(from, to)
    pos = from
    points = []
    point = pathfinding.getNextPoint(pos, vector)
    moveCompleted = pathfinding.isMoveCompleted(vector, point, to)
    last = undefined
    until (moveCompleted[0] and moveCompleted[1])
      if moveCompleted[0]
        point[0] = to[0]
      if moveCompleted[1]
        point[1] = to[1]
      floorPoint = [
        Math.floor(point[0])
        Math.floor(point[1])
      ]
      if last
        points.push floorPoint  unless last[0] is floorPoint[0] and last[1] is floorPoint[1]
      else
        points.push floorPoint
      last = floorPoint
      pos = point
      point = pathfinding.getNextPoint(pos, vector)
      moveCompleted = pathfinding.isMoveCompleted(vector, point, to)
    points

  getNextPoint: (point, vector) ->
    [
      point[0] + vector[0] * pathfinding.step
      point[1] + vector[1] * pathfinding.step
    ]

  isMoveCompleted: (vector, from, to) ->
    result = [false, false]
    if (vector[0] < 0 and from[0] < to[0]) or (vector[0] > 0 and from[0] > to[0]) or vector[0] is 0
      result[0] = true
    if (vector[1] < 0 and from[1] < to[1]) or (vector[1] > 0 and from[1] > to[1]) or vector[1] is 0
      result[1] = true
    result

  isWalkablePath: (from, to, grid) ->
    solutions = [[0, 0], [1, 0], [0, 1], [1, 1], [-1, 0], [0, -1], [-1, -1]]
    for solution in solutions
      points = pathfinding.getPoints([from[0] + solution[0], from[1] + solution[1]], [to[0] + solution[0], to[1] + solution[1]])
      for point in points
        unless pathfinding.isCellWalkable(point, grid)
          return false
    return true

  isCellWalkable: (cell, grid) ->
    grid and grid[cell[1]] and grid[cell[1]][cell[0]] is 0

  findNearestWalkableCell: (cell, grid) ->
    solutions = [
      [1, 0]
      [0, 1]
      [1, 1]
      [-1, 0]
      [0, -1]
      [-1, -1]
      [1, -1]
      [-1, 1]
    ]
    for solution in solutions
      sol = [cell[0] + solution[0], cell[1] + solution[1]]
      if pathfinding.isCellWalkable(sol, grid)
        return sol
    return cell

  parseGrid: (map) ->
    grid = []
    i = 0
    while i < map.data.length
      col = map.data[i]
      grid[i] = []
      j = 0
      while j < col.length
        tile = col[j]
        unless tile.index is -1
          grid[i][j] = 1
        else
          grid[i][j] = 0
        j++
      i++
    grid

  moveToTarget: (pos, target, speed) ->
    if target
      origin = [
        pos[0] / 32
        pos[1] / 32
      ]
      vector = pathfinding.getVector(origin, target)
      animation = undefined
      if vector[2] > speed / 32
        if vector[0] > 0
          animation = Animations.RIGHT
        else if vector[0] < 0
          animation = Animations.LEFT
        else if vector[1] > 0
          animation = Animations.BOTTOM
        else
          animation = Animations.TOP
        pos[0] += speed * vector[0]
        pos[1] += speed * vector[1]
        [
          false
          pos
          animation
        ]
      else
        animation = Animations.STAND
        pos[0] = target[0] * 32
        pos[1] = target[1] * 32
        [
          true
          pos
          animation
        ]
    else
      false