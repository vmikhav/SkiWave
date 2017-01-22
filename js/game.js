var innerWidth = window.innerWidth;
var innerHeight = window.innerHeight;
var gameRatio = innerWidth/innerHeight;
var w = Math.floor(910*gameRatio);
var h = 910;
var game = new Phaser.Game(w, h, Phaser.AUTO, 'ShiWave', { preload: startPreload, create: startCreate, update: startUpdate, render: render });

function preload() {
	game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
	game.load.tilemap('map', './map/test.json', null, Phaser.Tilemap.TILED_JSON);
	game.load.image('kenney', './img/kenney.png');
	game.load.image('background', './img/background.png');
	game.load.image('filter', './img/filter.png');
	game.load.spritesheet('dude', './img/pilot_animation.png', 100, 100);
	game.load.spritesheet('wave', './img/wave.png', 1100, 1000);
	game.load.image('menu', './img/buttons.png', 270, 180);
	game.load.spritesheet('bonus', './img/bonus.png', 70, 70);
	game.load.spritesheet('nothlights', './img/nothlights.png', 500, 300);
	game.load.image('filter', './img/filter.png');
}

var player, background, filter;
var nothlights = [];
var bonus = [];
var facing = 'left';
var isTap = false;
var jumpTimer = 0;
var cursors;
var jumpButton;
var PI = 3.14;
var PI2 = 8*PI/18;
var PI3 = PI/3;
var PI4 = PI/4;
var PI5 = PI/30;
var oldSpeed = 0;
var waveSpeed;

var onGround = false;

var map;
var layer, layer2;

var inTerrain=0;
var forceVector = 0;
var rotation = 0;

var startTime, jumpTime, score = 0;
var scoreLabel, restartLabel;

var endType = "";

var mainState = {preload: preload, create: create, update: update};
game.state.add('main', mainState); 

function create() {
	//init
	inTerrain=0;
	forceVector = 0;
	rotation = 0;
	
	onGround = false;	
	facing = 'left';
	isTap = false;
	jumpTimer = 0;
	jumpTime=0;
	startTime=0; 

	/*
	background = game.add.sprite(0, 0, 'background');
	background.fixedToCamera = true;
	background.x = 0;
	background.y = 0;
	background.height = game.height;
	background.width = game.width;
	*/

	if (endType == 'die' || endType == ''){
		score = 0;
		oldSpeed = 0;
		waveSpeed = 115;
	}

	nothlights.length = 0;
	for (var i=0; i<13; i++){
		nothlights.push(game.add.sprite(10000*i+Math.ceil(Math.random()*1000), Math.ceil(Math.random()*50), 'nothlights'));
		nothlights[i].animations.add('nothlights', [0, 1, 2, 3, 4], 10, true);
		nothlights[i].animations.play('nothlights');
	}


	scoreLabel = game.add.text(w / 2, 80, score, {font: '128px super_mario_256regular', fill: '#fff800'});
	scoreLabel.fixedToCamera = true;
	scoreLabel.anchor.setTo(0.5, 0);


	/*
	 Code for the pause menu
	 */

	// Create a label to use as a button
	pause_label = game.add.text(w - w * 0.1, 80, "", {font: '32px super_mario_256regular', fill: '#fff800'});
	pause_label.inputEnabled = true;
	pause_label.fixedToCamera = true;
	pause_label.events.onInputUp.add(pause);
	pause_label.anchor.setTo(0.5, 0);
	

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

		var backgrundXPos = (player.position.x > w / 2) ? player.position.x - w / 2 : 0;
		background = game.add.sprite(backgrundXPos, 0, 'background');
		background.height = game.height;
		background.width = game.width;

		filter = game.add.sprite(backgrundXPos, 0, 'filter');
		filter.fixedToCamera = true;
		filter.height = game.height;
		filter.width = game.width;

		// background = game.add.sprite(0, 0, 'background');
		// background.fixedToCamera = true;

		// backgroundmenu = game.add.sprite(0, 0, 800, 600, 'backgroundmenu', 'backgroundmenu');
		// Then add the menu
				//console.log(player.position.x);
		var centerXPos = (player.position.x > w / 2) ? player.position.x : w / 2;
		//menu = game.add.sprite(centerXPos, h / 2, 'menu');
		//menu.anchor.setTo(0.5, 0.5);

		// And a label to illustrate which menu item was chosen. (This is not necessary)
		choiseLabel = game.add.text(centerXPos, h / 2 - 50, 'Pause', {font: '156px super_mario_256regular', fill: '#fff800'});
		choiseLabel.anchor.setTo(0.5, 0.5);

		restartLabel = game.add.text(centerXPos, h / 2 + 250, "restart", {font: '54px super_mario_256regular', fill: '#fff800'});
		//restartLabel.inputEnabled = true;
		//restartLabel.events.onInputDown.add(function(){ endType = 'lose'; game.state.start('menu');});
		restartLabel.anchor.setTo(0.5, 0.5);
	}

	function destroyMenu() {
		// Remove the menu and the label
		//menu.destroy();
				// backgroundmenu.destroy();
		choiseLabel.destroy();
		background.destroy();
		filter.destroy();
		restartLabel.destroy();
		// Unpause the game
		game.paused = false;
	}

	// unpause menu
	function unpause(event) {
		// Only act if paused
		if (game.paused) {
			// Calculate the corners of the menu
			var x1 = w / 2 - 270 / 2, x2 = w / 2 + 270 / 2,
					y1 = h / 2 + 250  - 60 / 2, y2 = h / 2 + 250 + 60 / 2;

			// Check if the click was inside the menu
			if (event.x > x1 && event.x < x2 && event.y > y1 && event.y < y2) {
				// The choicemap is an array that will help us see which item was clicked
				destroyMenu();
				endType = 'die';
				game.state.start('main');
			}
			else {
				destroyMenu();
			}
		}
	};

	game.physics.startSystem(Phaser.Physics.P2JS);

	game.stage.backgroundColor = '#2d2d2d';

	wave = game.add.sprite(-1000, 600, 'wave');
	wave.animations.add('waving', [0, 1, 2, 3, 4], 10, true);
	game.physics.p2.enable(wave);
	wave.body.data.gravityScale = 0;
	wave.body.data.shapes[0].sensor = true;
	wave.animations.play('waving');

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
	

	player = game.add.sprite(150, 200, 'dude');
	player.animations.add('speedy', [8, 9, 10], 10, true);
	player.animations.add('turn', [0, 1, 2], 10, true);
	player.animations.add('right', [7, 3, 4, 5, 6], 10, true);

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

	if (endType == 'win'){
		player.body.velocity.x = oldSpeed;
		waveSpeed+=10;
	}
	else{
		player.body.velocity.x = 30;
	}

	game.camera.follow(player);
	player.body.onBeginContact.add(blockHit, this);
	player.body.onEndContact.add(blockUnHit, this);

	//cursors = game.input.keyboard.createCursorKeys();
	//jumpButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

	game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR).onDown.add(onTap, this);
	game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR).onUp.add(onUnTap, this);

	game.input.onDown.add(onTap, this);
	game.input.onUp.add(onUnTap, this);

	bonus.length = 0;
	for(var i=0; i<5; i++){
		bonus.push(game.add.sprite(1000+Math.ceil(Math.random()*130000), 20, 'bonus'));
		game.physics.p2.enable(bonus[i]);
		bonus[i].body.collideWorldBounds = true;
		bonus[i].body.fixedRotation = false;
		bonus[i].body.mass = 0.1;
	}

	//startTime = game.time.now;
	startTime = player.body.x;

	pause_label.setText("Pause");

}

function update() {

	if (player.body.velocity.x > 1500){player.body.velocity.x = 1500;}

	if (Math.abs(player.body.velocity.x)>20){
		score += (player.body.x - startTime)/500; scoreLabel.setText(Math.ceil(score)); 
		if (score<10){
			pause_label.setText("Pause");
		}
	}
	startTime = player.body.x;
	wave.body.force.x = waveSpeed;

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
			if (rotation<-0.1 && (player.body.velocity.y<0 && player.body.velocity.y>-5) && isTap==false){
				//console.log("goal2", rotation, player.body.velocity.x, player.body.velocity.y);
				player.body.rotation=0;
				player.body.angularForce=75;
			}
			else if (rotation>PI2){
				player.body.rotation=PI3;
			}
		}
		else if (forceVector < 0){
			if (rotation>0.1){
				//console.log("goal3", rotation, player.body.velocity.x, player.body.velocity.y);
				if (rotation>0.5){player.body.rotation=0;}
				else{player.body.rotation=-PI4/3;}
				player.body.angularForce=-75;
			}
			else if (rotation<-PI2){
				player.body.rotation=-PI3;
			}
		}
	}
	else{
		if (rotation<-PI4){player.body.rotation=-PI4+0.05;}
		else if (rotation>PI5 && jumpTimer > 0 && (game.time.now - jumpTimer) > 50){player.body.rotation=PI5; player.body.angularForce=-30;}
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
		player.body.force.x = 900;
		if (facing != 'right' && inTerrain)
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
			if (jumpTime!=0){
				score += (player.body.x - jumpTime)/25;
				jumpTime = 0;
				scoreLabel.setText(Math.ceil(score));
				jumpTimer = 0;
			}
		}
		else{
			if (body.sprite.key == 'wave'){
				//lose
				
				endType = 'die';
				game.state.start('lose');
			}
			else if (body.sprite.key == 'bonus'){
				body.sprite.destroy();
				score += 300; 
				inTerrain++;
			}
		}
	}
	else
	{
		//win;
		//console.log("win");
		endType = 'win';
		oldSpeed = player.body.velocity.x;
		game.state.start('main');
	}

}
function blockUnHit (body, bodyB, shapeA, shapeB, equation) {
	if (body)
	{
		if (body.sprite===null){ 
			onGround = false;
			inTerrain--;
			if (inTerrain<1){
				jumpTime = player.position.x || 0;
				if (facing == 'right'){
					facing = 'speedy';
					player.animations.play('speedy');
				}
				jumpTimer = game.time.now;
			}
		}
	}
	else
	{
		//console.log("wall");
	}

}

function render() {

}

var timerEvt;
var menuState = {preload: menuPreload, create: menuCreate, update: menuUpdate};
game.state.add('menu', menuState); 
var loseState = {preload: losePreload, create: loseCreate, update: loseUpdate};
game.state.add('lose', loseState); 

function startPreload() {
	game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;

	game.load.tilemap('map', './map/test.json', null, Phaser.Tilemap.TILED_JSON);
	game.load.image('kenney', './img/kenney.png');
	game.load.image('background', './img/background.png');
	game.load.image('filter', './img/filter.png');
	game.load.spritesheet('dude', './img/pilot_animation.png', 100, 100);
	game.load.spritesheet('wave', './img/wave.png', 1100, 1000);
	game.load.image('menu', './img/buttons.png', 270, 180);
	game.load.spritesheet('bonus', './img/bonus.png', 70, 70);
	game.load.spritesheet('nothlights', './img/nothlights.png', 500, 300);
	game.load.spritesheet('tv', './img/tv.png', 400, 400);

	var loadingText = game.add.text(w/2, h/2, 'loading... 0%', { font: '64px super_mario_256regular', fill: '#fff800' });
	loadingText.anchor.setTo(0.5, 0.5);

	var progressDisplay = 0;

	timerEvt = game.time.events.loop(100, function (){
		if(progressDisplay < 100){
			if(progressDisplay < game.load.progress){
				loadingText.text = 'loading... '+(game.load.progress)+'%';
			}
		}else{
			loadingText.text = 'Ready, Go!';
			game.time.events.remove(timerEvt);
		}
	}, this);
	
}

function startCreate() {
	game.time.events.remove(timerEvt);
	game.state.start('menu');
}

function startUpdate() {}

function menuPreload() {
	game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;

	game.load.image('background', './img/background.png');
	game.load.image('filter', './img/filter.png');
}

function menuCreate() {
	background = game.add.sprite(0, 0, 'background');
	background.fixedToCamera = true;
	background.x = 0;
	background.y = 0;
	background.height = game.height;
	background.width = game.width;

	filter = game.add.sprite(0, 0, 'filter');
	filter.fixedToCamera = true;
	filter.x = 0;
	filter.y = 0;
	filter.height = game.height;
	filter.width = game.width;

	var gameLabel = game.add.text(w / 2, 200, 'SkiWave', {font: '164px super_mario_256regular', fill: '#fff800'});
	gameLabel.anchor.setTo(0.5, 0.5);

	var playLabel = game.add.text(w / 2, h / 2 , "click here or press\nspaceBar to start", {font: '54px super_mario_256regular', fill: '#FFB200'});
	playLabel.inputEnabled = true;
	playLabel.events.onInputDown.add(function(){game.state.start('main');});
	playLabel.anchor.setTo(0.5, 0.5);

	var aboutLabel = game.add.text(w / 2, h / 2 + 250, "aBout", {font: '54px super_mario_256regular', fill: '#fff800'});
	aboutLabel.inputEnabled = true;
	aboutLabel.events.onInputDown.add(function(){game.state.start('main');});
	aboutLabel.anchor.setTo(0.5, 0.5);

	jumpButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
}

function menuUpdate() {
	if (jumpButton.isDown){
		game.state.start('main');
	}
}

function losePreload() {
	game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;

	game.load.image('background', './img/background.png');
	game.load.spritesheet('tv', './img/tv.png', 400, 400);
	game.load.image('background', './img/background.png');
	game.load.image('filter', './img/filter.png');


	score = Math.ceil(score);
}

function loseCreate() {
	background = game.add.sprite(0, 0, 'background');
	background.fixedToCamera = true;
	background.x = 0;
	background.y = 0;
	background.height = game.height;
	background.width = game.width;

	filter = game.add.sprite(0, 0, 'filter');
	filter.fixedToCamera = true;
	filter.x = 0;
	filter.y = 0;
	filter.height = game.height;
	filter.width = game.width;

	var tv = game.add.sprite(w / 2, h / 2, 'tv');
	tv.anchor.setTo(0.5, 0.5);
	tv.animations.add('tv', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 10, true);
	tv.animations.play('tv');

	var loseScoreLabel = game.add.text(w / 2, 150, "your score : "+score, {font: '54px super_mario_256regular', fill: '#fff800'});
	loseScoreLabel.anchor.setTo(0.5, 0.5);

	var playLabel = game.add.text(w / 2, h - 150, "click here or press spaceBar", {font: '54px super_mario_256regular', fill: '#fff800'});
	playLabel.inputEnabled = true;
	playLabel.events.onInputDown.add(loseNavigate);
	playLabel.anchor.setTo(0.5, 0.5);

	jumpButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
}

function loseUpdate() {
	if (jumpButton.isDown){
		loseNavigate();
	}
}

function loseNavigate() { game.state.start('main');}