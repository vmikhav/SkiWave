var innerWidth = window.innerWidth;
var innerHeight = window.innerHeight;
var gameRatio = innerWidth/innerHeight;	
var game = new Phaser.Game(Math.floor(1000*gameRatio), 1000, Phaser.AUTO, 'phaser-example', { preload: preload, create: create, update: update, render: render });

function preload() {
	game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
	game.load.tilemap('map', './map/test.json', null, Phaser.Tilemap.TILED_JSON);
	game.load.image('kenney', './img/kenney.png');
	game.load.spritesheet('dude', './img/pilot_animation.png', 64, 64);

}

var player;
var facing = 'left';
var jumpTimer = 0;
var cursors;
var jumpButton;
var PI = 3.14;
var PI2 = PI/3;
var oldSpeed = 0;

var onGround = false;

var map;
var layer, layer2;

function create() {

	game.physics.startSystem(Phaser.Physics.P2JS);

	game.stage.backgroundColor = '#2d2d2d';

	map = game.add.tilemap('map');

	map.addTilesetImage('kenney');
	
	layer2 = map.createLayer('layer 2');
	layer = map.createLayer('layer 1');
	
	layer2.resizeWorld();
	layer.resizeWorld();
	

	//  Set the tiles for collision.
	//  Do this BEFORE generating the p2 bodies below.
	//map.setCollisionBetween(11, 220);

	//  Convert the tilemap layer into bodies. Only tiles that collide (see above) are created.
	//  This call returns an array of body objects which you can perform addition actions on if
	//  required. There is also a parameter to control optimising the map build.
	//game.physics.p2.convertTilemap(map, layer);

	var layerobjects_tiles = game.physics.p2.convertCollisionObjects(map,"objects1");

	game.physics.p2.restitution = 0.0;
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
	player.body.collideWorldBounds = true;
	
	
	player.body.fixedRotation = false;
	//player.body.dynamic = true;
	//player.body.setMaterial(spriteMaterial);
	player.body.mass = 0.5;

	game.camera.follow(player);
	player.body.onBeginContact.add(blockHit, this);
	player.body.onEndContact.add(blockUnHit, this);

	cursors = game.input.keyboard.createCursorKeys();
	jumpButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

}

function update() {
	//console.log(player.body.velocity.y);
	if (player.body.velocity.y<0.9 && player.body.velocity.y>-0.9){
		if (Math.abs(player.body.velocity.x)>10 && Math.abs(player.body.rotation)>0.2){
			//console.log("goal");
			player.body.rotation=0;
			player.body.angularForce=0;
		}
	}
	else if (player.body.velocity.y * player.body.velocity.x > 0){
		if (player.body.rotation<-0.1 && oldSpeed*player.body.velocity.x>0){
			//console.log("goal2");
			player.body.rotation=0;
			player.body.angularForce=100;
		}		
	}
	else if (player.body.velocity.y * player.body.velocity.x < 0){
		if (player.body.rotation>0.1){
			//console.log("goal3");
			player.body.rotation-=0.2;
			player.body.angularForce=-100;
		}
	}
	oldSpeed = player.body.velocity.x;
	
	
	if (cursors.left.isDown)
	{
		player.body.force.x = -1200;
		//player.body.data.force[0] = 100;//moveLeft(200);

		if (facing != 'left')
		{
			player.animations.play('right');
			facing = 'left';
		}
	}
	else if (cursors.right.isDown)
	{
		player.body.force.x = 1200;//.moveRight(200);
		if (player.body.velocity.y>0){player.body.force.y += 5000;}

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
	
	if (jumpButton.isDown && game.time.now > jumpTimer && checkIfCanJump())
	{
		player.body.force.y = -50000;
		jumpTimer = game.time.now + 750;
	}

}

function blockHit (body, bodyB, shapeA, shapeB, equation) {
	if (body)
	{
		if (body.sprite===null){ onGround = true; }//console.log(onGround);}
	}
	else
	{
		console.log("wall");
	}

}
function blockUnHit (body, bodyB, shapeA, shapeB, equation) {
	if (body)
	{
		if (body.sprite===null){ onGround = false; }
	}
	else
	{
		console.log("wall");
	}

}


function checkIfCanJump() {

	var yAxis = p2.vec2.fromValues(0, 1);
	var result = false;

	for (var i = 0; i < game.physics.p2.world.narrowphase.contactEquations.length; i++)
	{
		var c = game.physics.p2.world.narrowphase.contactEquations[i];

		if (c.bodyA === player.body.data || c.bodyB === player.body.data)
		{
			var d = p2.vec2.dot(c.normalA, yAxis); // Normal dot Y-axis
			if (c.bodyA === player.body.data) d *= -1;
			if (d > 0.5) result = true;
		}
	}
	
	return result;

}

function render() {

}