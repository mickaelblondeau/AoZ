(function() {
  var Animations, Kodo, KodoFactory, PF, Player, PlayerFactory, io, kodoFactory, metaGrid, pathfinding, playerFactory, sendPositions;

  Animations = {
    STAND: 0,
    TOP: 1,
    BOTTOM: 2,
    LEFT: 3,
    RIGHT: 4
  };

  pathfinding = {
    step: 0.25,
    getSmoothPath: function(start, end, grid) {
      var path;
      if (!pathfinding.isCellWalkable(end, grid)) {
        end = pathfinding.findNearestWalkableCell(end, grid);
      }
      path = pathfinding.getPath(start, end, grid);
      return pathfinding.smoothPath(path, grid);
    },
    getPath: function(start, end, grid) {
      var finder, len, pathGrid;
      len = grid.length;
      pathGrid = new PF.Grid(len, len, grid);
      finder = new PF.AStarFinder({
        allowDiagonal: true,
        dontCrossCorners: true
      });
      return finder.findPath(start[0], start[1], end[0], end[1], pathGrid);
    },
    smoothPath: function(path, grid) {
      var from, i, index, lastPath, newPath, to;
      if (path.length > 2) {
        index = 1;
        newPath = [path[1]];
        i = index + 1;
        lastPath = path[1];
        while (path[i]) {
          from = path[index];
          to = path[i];
          if (pathfinding.isWalkablePath(from, to, grid)) {
            lastPath = path[i];
          } else {
            newPath.push(lastPath);
            index = i - 1;
            lastPath = path[i];
          }
          i++;
        }
        newPath.push(lastPath);
        return newPath;
      } else {
        return path;
      }
    },
    getVector: function(from, to) {
      var distance, vector;
      vector = [to[0] - from[0], to[1] - from[1]];
      distance = Math.sqrt(Math.pow(vector[0], 2) + Math.pow(vector[1], 2));
      if (distance === 0) {
        return [0, 0, 0];
      } else {
        return [vector[0] / distance, vector[1] / distance, distance];
      }
    },
    getPoints: function(from, to) {
      var floorPoint, last, moveCompleted, point, points, pos, vector;
      vector = pathfinding.getVector(from, to);
      pos = from;
      points = [];
      point = pathfinding.getNextPoint(pos, vector);
      moveCompleted = pathfinding.isMoveCompleted(vector, point, to);
      last = void 0;
      while (!(moveCompleted[0] && moveCompleted[1])) {
        if (moveCompleted[0]) {
          point[0] = to[0];
        }
        if (moveCompleted[1]) {
          point[1] = to[1];
        }
        floorPoint = [Math.floor(point[0]), Math.floor(point[1])];
        if (last) {
          if (!(last[0] === floorPoint[0] && last[1] === floorPoint[1])) {
            points.push(floorPoint);
          }
        } else {
          points.push(floorPoint);
        }
        last = floorPoint;
        pos = point;
        point = pathfinding.getNextPoint(pos, vector);
        moveCompleted = pathfinding.isMoveCompleted(vector, point, to);
      }
      return points;
    },
    getNextPoint: function(point, vector) {
      return [point[0] + vector[0] * pathfinding.step, point[1] + vector[1] * pathfinding.step];
    },
    isMoveCompleted: function(vector, from, to) {
      var result;
      result = [false, false];
      if ((vector[0] < 0 && from[0] < to[0]) || (vector[0] > 0 && from[0] > to[0]) || vector[0] === 0) {
        result[0] = true;
      }
      if ((vector[1] < 0 && from[1] < to[1]) || (vector[1] > 0 && from[1] > to[1]) || vector[1] === 0) {
        result[1] = true;
      }
      return result;
    },
    isWalkablePath: function(from, to, grid) {
      var point, points, solution, solutions, _i, _j, _len, _len1;
      solutions = [[0, 0], [1, 0], [0, 1], [1, 1], [-1, 0], [0, -1], [-1, -1]];
      for (_i = 0, _len = solutions.length; _i < _len; _i++) {
        solution = solutions[_i];
        points = pathfinding.getPoints([from[0] + solution[0], from[1] + solution[1]], [to[0] + solution[0], to[1] + solution[1]]);
        for (_j = 0, _len1 = points.length; _j < _len1; _j++) {
          point = points[_j];
          if (!pathfinding.isCellWalkable(point, grid)) {
            return false;
          }
        }
      }
      return true;
    },
    isCellWalkable: function(cell, grid) {
      return grid && grid[cell[1]] && grid[cell[1]][cell[0]] === 0;
    },
    findNearestWalkableCell: function(cell, grid) {
      var sol, solution, solutions, _i, _len;
      solutions = [[1, 0], [0, 1], [1, 1], [-1, 0], [0, -1], [-1, -1], [1, -1], [-1, 1]];
      for (_i = 0, _len = solutions.length; _i < _len; _i++) {
        solution = solutions[_i];
        sol = [cell[0] + solution[0], cell[1] + solution[1]];
        if (pathfinding.isCellWalkable(sol, grid)) {
          return sol;
        }
      }
      return cell;
    },
    parseGrid: function(map) {
      var col, grid, i, j, tile;
      grid = [];
      i = 0;
      while (i < map.data.length) {
        col = map.data[i];
        grid[i] = [];
        j = 0;
        while (j < col.length) {
          tile = col[j];
          if (tile.index !== -1) {
            grid[i][j] = 1;
          } else {
            grid[i][j] = 0;
          }
          j++;
        }
        i++;
      }
      return grid;
    },
    moveToTarget: function(pos, target, speed) {
      var animation, origin, vector;
      if (target) {
        origin = [pos[0] / 32, pos[1] / 32];
        vector = pathfinding.getVector(origin, target);
        animation = void 0;
        if (vector[2] > speed / 32) {
          if (vector[0] > 0) {
            animation = Animations.RIGHT;
          } else if (vector[0] < 0) {
            animation = Animations.LEFT;
          } else if (vector[1] > 0) {
            animation = Animations.BOTTOM;
          } else {
            animation = Animations.TOP;
          }
          pos[0] += speed * vector[0];
          pos[1] += speed * vector[1];
          return [false, pos, animation];
        } else {
          animation = Animations.STAND;
          pos[0] = target[0] * 32;
          pos[1] = target[1] * 32;
          return [true, pos, animation];
        }
      } else {
        return false;
      }
    }
  };

  Kodo = (function() {
    function Kodo(x, y, id) {
      this.id = id;
      this.x = x;
      this.y = y;
      this.animation = 0;
      this.speed = 1;
    }

    Kodo.prototype.getInfo = function() {
      return [this.id, [Math.floor(this.x), Math.floor(this.y), this.animation]];
    };

    return Kodo;

  })();

  KodoFactory = (function() {
    function KodoFactory() {
      this.id = 1;
      this.kodos = [];
    }

    KodoFactory.prototype.createKodo = function(x, y) {
      var kodo;
      kodo = new Kodo(x, y, this.id);
      this.kodos.push(kodo);
      io.sockets.emit("createKodo", kodo.getInfo());
      return this.id++;
    };

    KodoFactory.prototype.updatePath = function() {
      var kodo, player, _i, _len, _ref, _results;
      if (playerFactory.players.length > 0) {
        _ref = kodoFactory.kodos;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          kodo = _ref[_i];
          player = kodoFactory.getNearestPlayer(kodo);
          kodo.path = pathfinding.getSmoothPath([Math.floor(kodo.x / 32), Math.floor(kodo.y / 32)], [Math.floor(player.x / 32), Math.floor(player.y / 32)], metaGrid);
          _results.push(kodo.pathIndex = 1);
        }
        return _results;
      }
    };

    KodoFactory.prototype.getPositions = function() {
      var arr, kodo, _i, _len, _ref;
      arr = [];
      _ref = this.kodos;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        kodo = _ref[_i];
        this.moveKodo(kodo);
        arr.push(kodo.getInfo());
      }
      return arr;
    };

    KodoFactory.prototype.moveKodo = function(kodo) {
      var move;
      if (kodo.path) {
        move = pathfinding.moveToTarget([kodo.x, kodo.y], kodo.path[kodo.pathIndex], kodo.speed);
        if (move) {
          kodo.x = move[1][0];
          kodo.y = move[1][1];
          kodo.animation = move[2];
          if (move[0] === true) {
            return kodo.pathIndex++;
          }
        }
      }
    };

    KodoFactory.prototype.getNearestPlayer = function(kodo) {
      var dist1, dist2, nearest, player, _i, _len, _ref;
      nearest = void 0;
      _ref = playerFactory.players;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        player = _ref[_i];
        if (!nearest) {
          nearest = player;
        } else {
          dist1 = this.getDistance([nearest.x, nearest.y], [kodo.x, kodo.y]);
          dist2 = this.getDistance([player.x, player.y], [kodo.x, kodo.y]);
          if (dist2 < dist1) {
            nearest = player;
          }
        }
      }
      return nearest;
    };

    KodoFactory.prototype.getDistance = function(a, b) {
      var vector;
      vector = [b[0] - a[0], b[1] - a[1]];
      return Math.pow(vector[0], 2) + Math.pow(vector[1], 2);
    };

    return KodoFactory;

  })();

  Player = (function() {
    function Player(id) {
      this.id = id;
      this.x = 0;
      this.y = 0;
      this.animation = 0;
    }

    Player.prototype.getInfo = function() {
      return [this.id, [Math.floor(this.x), Math.floor(this.y), this.animation]];
    };

    Player.prototype.setPosition = function(position) {
      this.x = position[0];
      this.y = position[1];
      return this.animation = position[2];
    };

    return Player;

  })();

  PlayerFactory = (function() {
    function PlayerFactory() {
      this.id = 1;
      this.players = [];
    }

    PlayerFactory.prototype.createPlayer = function() {
      var player;
      player = new Player(this.id);
      this.players.push(player);
      this.id++;
      return player;
    };

    PlayerFactory.prototype.deletePlayer = function(p) {
      var i, player, _i, _len, _ref, _results;
      _ref = this.players;
      _results = [];
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        player = _ref[i];
        if (player.id === p.id) {
          this.players.splice(i, 1);
          break;
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    PlayerFactory.prototype.getPositions = function() {
      var arr, player, _i, _len, _ref;
      arr = [];
      _ref = this.players;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        player = _ref[_i];
        arr.push(player.getInfo());
      }
      return arr;
    };

    return PlayerFactory;

  })();

  io = require('socket.io').listen(8080);

  PF = require('pathfinding');

  metaGrid = require('../app/assets/meta.json').data;

  playerFactory = new PlayerFactory();

  kodoFactory = new KodoFactory();

  io.on('connection', function(socket) {
    var kodo, otherPlayer, player, _i, _j, _len, _len1, _ref, _ref1;
    player = playerFactory.createPlayer();
    socket.emit('setId', player.id);
    socket.broadcast.emit('createPlayer', player.getInfo());
    _ref = playerFactory.players;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      otherPlayer = _ref[_i];
      if (otherPlayer.id !== player.id) {
        socket.emit('createPlayer', otherPlayer.getInfo());
      }
    }
    _ref1 = kodoFactory.kodos;
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      kodo = _ref1[_j];
      socket.emit('createKodo', kodo.getInfo());
    }
    socket.on('position', function(position) {
      return player.setPosition(position);
    });
    return socket.on('disconnect', function() {
      socket.broadcast.emit('deletePlayer', player.id);
      return playerFactory.deletePlayer(player);
    });
  });

  sendPositions = function() {
    io.sockets.emit("kodosPositions", kodoFactory.getPositions());
    return io.sockets.emit("positions", playerFactory.getPositions());
  };

  setInterval(kodoFactory.updatePath, 500);

  setInterval(sendPositions, 1000 / 60);

  kodoFactory.createKodo(96, 64);

  kodoFactory.createKodo(64, 96);

  kodoFactory.createKodo(128, 96);

  kodoFactory.createKodo(96, 128);

}).call(this);
