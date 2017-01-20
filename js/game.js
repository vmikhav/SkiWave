var innerWidth = window.innerWidth;
var innerHeight = window.innerHeight;
var gameRatio = innerWidth/innerHeight;
var w = Math.floor(1000*gameRatio);
var h = 1000;
var game = new Phaser.Game(w, h, Phaser.AUTO, 'phaser-example', { preload: preload, create: create, update: update, render: render });

function preload() {
	game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
	game.load.tilemap('map', './map/test.json', null, Phaser.Tilemap.TILED_JSON);
	game.load.image('kenney', './img/kenney.png');
	game.load.spritesheet('dude', './img/pilot_animation.png', 64, 64);
    game.load.image('menu', './img/buttons.png', 270, 180);

}

var player;
var facing = 'left';
var isTap = false;
var jumpTimer = 0;
var cursors;
var jumpButton;
var PI = 3.14;
var PI2 = 8*PI/18;
var PI3 = PI/3;
var PI4 = PI/4;
var oldSpeed = 0;

var onGround = false;

var map;
var layer, layer2;

var inTerrain=0;
var forceVector = 0;
var rotation = 0;

function create() {

  /*
   Code for the pause menu
   */

  // Create a label to use as a button
  pause_label = game.add.text(w - 100, 20, 'Pause', {font: '24px Arial', fill: '#fff'});
  pause_label.inputEnabled = true;
  pause_label.events.onInputUp.add(pause);

  // Add a input listener that can help us return from being paused
  game.input.onDown.add(unpause, self);
  game.input.keyboard.addKey(Phaser.Keyboard.ESC).onDown.add(escHandler, self);

  function escHandler() {
    if(game.paused) {
      destroyMenu();
    } else {
      pause();
    }
  }

  function pause(event) {
    // When the paus button is pressed, we pause the game
    game.paused = true;

    // Then add the menu
    menu = game.add.sprite(w / 2, h / 2, 'menu');
    menu.anchor.setTo(0.5, 0.5);

    // And a label to illustrate which menu item was chosen. (This is not necessary)
    choiseLabel = game.add.text(w / 2, h - 150, 'Click outside menu to continue', {font: '30px Arial', fill: '#fff'});
    choiseLabel.anchor.setTo(0.5, 0.5);
  }

  function destroyMenu() {
    // Remove the menu and the label
    menu.destroy();
    choiseLabel.destroy();

    // Unpause the game
    game.paused = false;
  }

  // unpause menu
  function unpause(event) {
    // Only act if paused
    if (game.paused) {
      // Calculate the corners of the menu
      var x1 = w / 2 - 270 / 2, x2 = w / 2 + 270 / 2,
          y1 = h / 2 - 180 / 2, y2 = h / 2 + 180 / 2;

      // Check if the click was inside the menu
      if (event.x > x1 && event.x < x2 && event.y > y1 && event.y < y2) {
        // The choicemap is an array that will help us see which item was clicked
        var choisemap = ['one', 'two', 'three', 'four', 'five', 'six'];

        // Get menu local coordinates for the click
        var x = event.x - x1,
            y = event.y - y1;

        // Calculate the choice
        var choise = Math.floor(x / 90) + 3 * Math.floor(y / 90);

        // Display the choice
        choiseLabel.text = 'You chose menu item: ' + choisemap[choise];
      }
      else {
        destroyMenu();
      }
    }
  };

	game.physics.startSystem(Phaser.Physics.P2JS);

	game.stage.backgroundColor = '#2d2d2d';

	map = game.add.tilemap('map');

	map.addTilesetImage('kenney');
	
	layer2 = map.createLayer('layer 2');
	layer = map.createLayer('layer 1');
	
	layer2.resizeWorld();
	layer.resizeWorld();

	var layerobjects_tiles = game.physics.p2.convertCollisionObjects(map,"objects1");

	game.physics.p2.restitution = 0.0;
	game.physics.p2.stiffness = 200;
	//game.physics.p2.relaxation = 0.1;
	game.physics.p2.gravity.y = 1400;
	game.physics.p2.applyGravity = true;
	//game.physics.p2.gravity.x = 200;

	game.physics.p2.world.defaultContactMaterial.friction = 0.01;
	game.physics.p2.world.setGlobalStiffness(1e5);
	

	player = game.add.sprite(100, 200, 'dude');
	player.animations.add('speedy', [8, 9, 10], 10, true);
	player.animations.add('turn', [0, 1, 2], 10, true);
	player.animations.add('right', [3, 4, 5, 6, 7], 10, true);

	game.physics.p2.enable(player);
	
	//var spriteMaterial = game.physics.p2.createMaterial('spriteMaterial', player.body);
	//var worldMaterial = game.physics.p2.createMaterial('worldMaterial');
	//var boxMaterial = game.physics.p2.createMaterial('worldMaterial');

	player.body.damping = 0.1;
	player.body.angularDamping = 0.5;
	player.body.collideWorldBounds = true;
	
	
	player.body.fixedRotation = false;
	//player.body.dynamic = true;
	//player.body.setMaterial(spriteMaterial);
	player.body.mass = 0.5;

	game.camera.follow(player);
	player.body.onBeginContact.add(blockHit, this);
	player.body.onEndContact.add(blockUnHit, this);

	//cursors = game.input.keyboard.createCursorKeys();
	//jumpButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

	game.input.onDown.add(onTap, this);
	game.input.onUp.add(onUnTap, this);

}

function update() {
	forceVector = player.body.velocity.y * player.body.velocity.x;
	rotation = player.body.rotation%PI;
	//console.log(player.body.angularForce);
	if (inTerrain){
		if (player.body.velocity.y<0.9 && player.body.velocity.y>-0.9){
			if (Math.abs(player.body.velocity.x)>10 && Math.abs(rotation)>PI4){
				//console.log("goal");
				player.body.rotation=0;
				player.body.angularForce=0;
			}
		}
		else if (forceVector > 0){
			if (rotation<-0.1 && oldSpeed*player.body.velocity.x>0){
				//console.log("goal2");
				player.body.rotation=0;
				player.body.angularForce=75;
			}
			else if (rotation>PI2){
				player.body.rotation=PI3;
			}
		}
		else if (forceVector < 0){
			if (rotation>0.1){
				//console.log("goal3", rotation);
				player.body.rotation=0;
				player.body.angularForce=-75;
			}
			else if (rotation<-PI2){
				player.body.rotation=-PI3;
			}
		}
	}
	else{
		if (rotation>PI4){player.body.rotation=PI4-0.05;}
		else if (rotation<-PI4){player.body.rotation=-PI4+0.05;}
	}
	oldSpeed = player.body.velocity.x;

	if (isTap){
		if (inTerrain){
			if (player.body.velocity.y>0){
				player.body.force.y += 500;
			}
			/*else if (player.body.velocity.y<-5){
				player.body.angularForce=-50;
			}*/
		}
		player.body.force.x += 750;
		if (facing != 'right')
		{
			player.animations.play('right');
			facing = 'right';
		}
	}
	else
	{
		//player.body.velocity.x = 800;

		if (Math.abs(player.body.velocity.x)<25 && Math.abs(player.body.rotation)<0.2 && facing != 'idle')
		{
			player.animations.stop();

			//    player.frame = 5;
			facing = 'idle';
			player.animations.play('turn');
		}
		else if (Math.abs(player.body.velocity.x)> 25 && facing != 'speedy'){
			facing = 'speedy';
			player.animations.play('speedy');
		}
		
	}
}

function onTap(pointer, doubleTap) {
	isTap = true;
}
function onUnTap(pointer, doubleTap) {
	isTap = false;
	player.body.angularForce = 0;
}

function blockHit (body, bodyB, shapeA, shapeB, equation) {
	if (body)
	{
		if (body.sprite===null){ 
			onGround = true; 
			inTerrain++;
		}
	}
	else
	{
		//console.log("wall");
	}

}
function blockUnHit (body, bodyB, shapeA, shapeB, equation) {
	if (body)
	{
		if (body.sprite===null){ 
			onGround = false;
			inTerrain--;
		}
	}
	else
	{
		//console.log("wall");
	}

}

function render() {

}