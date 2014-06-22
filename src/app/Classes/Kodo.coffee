class Kodo
  constructor: (x, y) ->
    @kodo = theGame.kodos.create(x, y, 'snake')
    @kodo.animations.add(Animations.STAND, [7], 5, true)
    @kodo.animations.add(Animations.TOP, [0, 1, 2], 5, true)
    @kodo.animations.add(Animations.LEFT, [3, 4, 5], 5, true)
    @kodo.animations.add(Animations.BOTTOM, [6, 7, 8], 5, true)
    @kodo.animations.add(Animations.RIGHT, [9, 10, 11], 5, true)