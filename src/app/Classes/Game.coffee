class Game
  constructor: (w, h) ->
    @game = new Phaser.Game(w, h, Phaser.AUTO, '', { preload: @preload, create: @create, update: @update, render: @render })
    @cameraMoveSpeed = 16

  preload: ->
    theGame.game.load.tilemap('map', 'assets/tilemap.json', null, Phaser.Tilemap.TILED_JSON)
    theGame.game.load.image('terrain', 'assets/terrain_atlas.png')
    theGame.game.load.image('cursor', 'assets/cursor.png')
    theGame.game.load.spritesheet('player', 'assets/soldier.png', 64, 64)
    theGame.game.load.spritesheet('snake', 'assets/snake.png', 32, 32)

  create: ->
    theGame.game.world.setBounds(0, 0, 3200, 3200)

    map = theGame.game.add.tilemap('map')
    map.addTilesetImage('terrain_atlas', 'terrain')

    layer = map.createLayer('terrain')
    layer.resizeWorld()

    layer = map.createLayer('object')
    layer.resizeWorld()

    theGame.grid = pathfinding.parseGrid(map.layers[2])

    theGame.game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL

    theGame.game.input.keyboard.createCursorKeys()

    theGame.players = theGame.game.add.group()
    theGame.kodos = theGame.game.add.group()

    theGame.player = new Player(32, 32)

    theGame.cursor = theGame.game.add.sprite(0, 0, 'cursor')
    theGame.cursor.fixedToCamera = true

    theGame.game.time.advancedTiming = true

    theGame.game.input.onDown.add(theGame.setFullScreen)
    theGame.game.input.onDown.add(theGame.player.setTarget)

    try
      network.startNetwork()
    catch
      alert 'The server is down, you are alone.'

  update: ->
    theGame.updateCamera()
    theGame.player.update()

  render: ->
    theGame.game.debug.text( "FPS: " + theGame.game.time.fps, 32, 32 )

  updateCamera: ->
    theGame.cursor.cameraOffset.x += theGame.game.input.activePointer.movementX
    theGame.cursor.cameraOffset.y += theGame.game.input.activePointer.movementY
    theGame.game.input.activePointer.resetMovement()

    if theGame.cursor.cameraOffset.y < 0
      theGame.cursor.cameraOffset.y = 0
    if theGame.cursor.cameraOffset.y > 600 - 16
      theGame.cursor.cameraOffset.y = 600 - 16
    if theGame.cursor.cameraOffset.x < 0
      theGame.cursor.cameraOffset.x = 0
    if theGame.cursor.cameraOffset.x > 800 - 16
      theGame.cursor.cameraOffset.x = 800 - 16

    if theGame.cursor.cameraOffset.y <= 32
      theGame.game.camera.y -= theGame.cameraMoveSpeed
    else if theGame.cursor.cameraOffset.y >= 600 - 32
      theGame.game.camera.y += theGame.cameraMoveSpeed

    if theGame.cursor.cameraOffset.x <= 32
      theGame.game.camera.x -= theGame.cameraMoveSpeed
    else if theGame.cursor.cameraOffset.x >= 800 - 32
      theGame.game.camera.x += theGame.cameraMoveSpeed

  setFullScreen: ->
    theGame.game.scale.startFullScreen()
    theGame.game.input.mouse.requestPointerLock()