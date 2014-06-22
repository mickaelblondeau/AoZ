(function() {
  var Animations, Game, Kodo, Network, Player, network, pathfinding, theGame;

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

  Game = (function() {
    function Game(w, h) {
      this.game = new Phaser.Game(w, h, Phaser.AUTO, '', {
        preload: this.preload,
        create: this.create,
        update: this.update,
        render: this.render
      });
      this.cameraMoveSpeed = 16;
    }

    Game.prototype.preload = function() {
      theGame.game.load.tilemap('map', 'assets/tilemap.json', null, Phaser.Tilemap.TILED_JSON);
      theGame.game.load.image('terrain', 'assets/terrain_atlas.png');
      theGame.game.load.image('cursor', 'assets/cursor.png');
      theGame.game.load.spritesheet('player', 'assets/soldier.png', 64, 64);
      return theGame.game.load.spritesheet('snake', 'assets/snake.png', 32, 32);
    };

    Game.prototype.create = function() {
      var layer, map;
      theGame.game.world.setBounds(0, 0, 3200, 3200);
      map = theGame.game.add.tilemap('map');
      map.addTilesetImage('terrain_atlas', 'terrain');
      layer = map.createLayer('terrain');
      layer.resizeWorld();
      layer = map.createLayer('object');
      layer.resizeWorld();
      theGame.grid = pathfinding.parseGrid(map.layers[2]);
      theGame.game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
      theGame.game.input.keyboard.createCursorKeys();
      theGame.players = theGame.game.add.group();
      theGame.kodos = theGame.game.add.group();
      theGame.player = new Player(32, 32);
      theGame.cursor = theGame.game.add.sprite(0, 0, 'cursor');
      theGame.cursor.fixedToCamera = true;
      theGame.game.time.advancedTiming = true;
      theGame.game.input.onDown.add(theGame.setFullScreen);
      theGame.game.input.onDown.add(theGame.player.setTarget);
      try {
        return network.startNetwork();
      } catch (_error) {
        return alert('The server is down, you are alone.');
      }
    };

    Game.prototype.update = function() {
      theGame.updateCamera();
      return theGame.player.update();
    };

    Game.prototype.render = function() {
      return theGame.game.debug.text("FPS: " + theGame.game.time.fps, 32, 32);
    };

    Game.prototype.updateCamera = function() {
      theGame.cursor.cameraOffset.x += theGame.game.input.activePointer.movementX;
      theGame.cursor.cameraOffset.y += theGame.game.input.activePointer.movementY;
      theGame.game.input.activePointer.resetMovement();
      if (theGame.cursor.cameraOffset.y < 0) {
        theGame.cursor.cameraOffset.y = 0;
      }
      if (theGame.cursor.cameraOffset.y > 600 - 16) {
        theGame.cursor.cameraOffset.y = 600 - 16;
      }
      if (theGame.cursor.cameraOffset.x < 0) {
        theGame.cursor.cameraOffset.x = 0;
      }
      if (theGame.cursor.cameraOffset.x > 800 - 16) {
        theGame.cursor.cameraOffset.x = 800 - 16;
      }
      if (theGame.cursor.cameraOffset.y <= 32) {
        theGame.game.camera.y -= theGame.cameraMoveSpeed;
      } else if (theGame.cursor.cameraOffset.y >= 600 - 32) {
        theGame.game.camera.y += theGame.cameraMoveSpeed;
      }
      if (theGame.cursor.cameraOffset.x <= 32) {
        return theGame.game.camera.x -= theGame.cameraMoveSpeed;
      } else if (theGame.cursor.cameraOffset.x >= 800 - 32) {
        return theGame.game.camera.x += theGame.cameraMoveSpeed;
      }
    };

    Game.prototype.setFullScreen = function() {
      theGame.game.scale.startFullScreen();
      return theGame.game.input.mouse.requestPointerLock();
    };

    return Game;

  })();

  Kodo = (function() {
    function Kodo(x, y) {
      this.kodo = theGame.kodos.create(x, y, 'snake');
      this.kodo.animations.add(Animations.STAND, [7], 5, true);
      this.kodo.animations.add(Animations.TOP, [0, 1, 2], 5, true);
      this.kodo.animations.add(Animations.LEFT, [3, 4, 5], 5, true);
      this.kodo.animations.add(Animations.BOTTOM, [6, 7, 8], 5, true);
      this.kodo.animations.add(Animations.RIGHT, [9, 10, 11], 5, true);
    }

    return Kodo;

  })();

  Network = (function() {
    function Network() {}

    Network.prototype.startNetwork = function() {
      this.socket = io.connect("http://" + window.location.hostname + ":8080");
      this.socket.on("setId", function(id) {
        return theGame.player.player.playerId = id;
      });
      this.socket.on("createPlayer", function(data) {
        var p, position;
        position = data[1];
        p = new Player(position[0], position[1]);
        return p.player.playerId = data[0];
      });
      this.socket.on("positions", function(data) {
        var id, p, position, _i, _len, _results;
        _results = [];
        for (_i = 0, _len = data.length; _i < _len; _i++) {
          p = data[_i];
          id = p[0];
          position = p[1];
          if (id !== theGame.player.player.playerId) {
            _results.push(theGame.players.forEach(function(item) {
              if (item.playerId === id) {
                item.x = position[0];
                item.y = position[1];
                if ((position[2] != null) && ((item.animations.currentAnim == null) || item.animations.currentAnim.name !== position[2])) {
                  return item.animations.play(position[2]);
                }
              }
            }));
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      });
      this.socket.on("createKodo", function(data) {
        var kodo, position;
        position = data[1];
        kodo = new Kodo(position[0], position[1]);
        return kodo.kodo.entityId = data[0];
      });
      this.socket.on("kodosPositions", function(data) {
        var id, kodo, position, _i, _len, _results;
        _results = [];
        for (_i = 0, _len = data.length; _i < _len; _i++) {
          kodo = data[_i];
          id = kodo[0];
          position = kodo[1];
          _results.push(theGame.kodos.forEach(function(item) {
            if (item.entityId === id) {
              item.x = position[0];
              item.y = position[1];
              if ((position[2] != null) && ((item.animations.currentAnim == null) || item.animations.currentAnim.name !== position[2])) {
                return item.animations.play(position[2]);
              }
            }
          }));
        }
        return _results;
      });
      return this.socket.on("deletePlayer", function(id) {
        return theGame.players.forEach(function(item) {
          if (item && item.playerId === id) {
            item.destroy();
          }
        });
      });
    };

    return Network;

  })();

  Player = (function() {
    function Player(x, y) {
      this.player = theGame.players.create(x, y, 'player');
      this.player.width = 32;
      this.player.height = 32;
      this.player.animations.add(Animations.STAND, [18], 10, true);
      this.player.animations.add(Animations.TOP, [0, 1, 2, 3, 4, 5, 6, 7, 8], 10, true);
      this.player.animations.add(Animations.LEFT, [9, 10, 11, 12, 13, 14, 15, 16, 17], 10, true);
      this.player.animations.add(Animations.BOTTOM, [18, 19, 20, 21, 22, 23, 24, 25, 26], 10, true);
      this.player.animations.add(Animations.RIGHT, [27, 28, 29, 30, 31, 32, 33, 34, 35], 10, true);
      this.speed = 2;
    }

    Player.prototype.setTarget = function() {
      theGame.player.path = theGame.player.getPathFromPlayer([Math.floor(theGame.cursor.x / 32), Math.floor(theGame.cursor.y / 32)]);
      theGame.player.pathIndex = 1;
      return theGame.player.target = theGame.player.path[theGame.player.pathIndex];
    };

    Player.prototype.move = function() {
      var move;
      move = pathfinding.moveToTarget([this.player.x, this.player.y], this.target, this.speed);
      if (move) {
        this.player.x = move[1][0];
        this.player.y = move[1][1];
        this.player.animations.play(move[2]);
        if (move[0] === true) {
          this.pathIndex++;
          return this.target = this.path[this.pathIndex];
        }
      }
    };

    Player.prototype.getPathFromPlayer = function(pos) {
      return pathfinding.getSmoothPath([Math.floor(this.player.x / 32), Math.floor(this.player.y / 32)], pos, theGame.grid);
    };

    Player.prototype.sendPosition = function() {
      if (network.socket) {
        return network.socket.emit('position', [Math.floor(this.player.x), Math.floor(this.player.y), this.player.animations.currentAnim.name]);
      }
    };

    Player.prototype.update = function() {
      this.move();
      return this.sendPosition();
    };

    return Player;

  })();

  document.oncontextmenu = function(e) {
    return e.preventDefault();
  };

  network = new Network();

  theGame = new Game(800, 600);

}).call(this);
