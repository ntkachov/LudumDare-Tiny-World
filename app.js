GameEngine = (function () {

	//Small Helper method for generating random integers
	function randomInt(from, to) {
		return Math.round((Math.random() * (to - from)) + from);
	};
	var Assets = (function () {
		var assets = {}
		return {
			get:function (assetName) {
				if (assets[assetName] == undefined) {
					assets[assetName] = new Image();
					assets[assetName].src = assetName + ".png";
				}
				return assets[assetName];
			},
			isDone: function(){
				for(var i in assets){
					if(!assets[i].complete){	
						return false;
					}
				}
				return true;
			}
		}
	})();

	var drawRotatedImage = (function () {
		var TO_RADIANS = Math.PI / 180;
		return function (image, x, y, angle) {
			ctx.save();
			ctx.translate(x, y);
			ctx.rotate(angle * TO_RADIANS);
			ctx.drawImage(image, 0, 0);
			ctx.restore();
		};
	})();

	function getOffset(el) {
		var _x = 0;
		var _y = 0;
		while (el && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop)) {
			_x += el.offsetLeft - el.scrollLeft;
			_y += el.offsetTop - el.scrollTop;
			el = el.offsetParent;
		}
		return {
			top: _y,
			left: _x
		};
	}
	//Simple object equater used for colors. Don't use for anything serious	
	function objEquals(o1, o2){
		for(var o in o1){
			if(o1[o] != o2[o]){return false;}
		}
		return true;
	}
	
	function loadFile (sURL, timeout, fCallback /*, argumentToPass1, argumentToPass2, etc. */) {
		var oReq = new XMLHttpRequest();
		oReq.ontimeout = function() {
			console.log("The request timed out.");
		}
		oReq.onreadystatechange = function() {
			if (oReq.readyState === 4) { 
				if (oReq.status === 200) {
					console.log(oReq);
					fCallback(oReq.response);
				} else {
					console.log("Error", oReq.statusText);
				}
			}
		};
		oReq.open("GET", sURL, true);
		oReq.timeout = timeout;
		oReq.send(null);
	}

	//Global Declarations
	var canvas = document.getElementById("canvas");
	var ctx = canvas.getContext("2d");
	var c_width = canvas.width;
	var c_height = canvas.height;
	var c_offTop = getOffset(canvas).top;
	var c_offLeft = getOffset(canvas).left;

	var pixelStars = (function () {
		var maxState = 3;
		var minState = 0;
		var stars = [];

		function Star(x, y) {
			this.x = x;
			this.y = y;
			this.state = randomInt(1, 2);
			this.transition = randomInt(0, 1) > 0 ? -1 : 1;
		};

		Star.prototype.render = function () {
			ctx.fillStyle = "rgb(255,255,109)";
			ctx.fillRect(this.x - this.state, this.y, this.state * 2 + 1, 1);
			ctx.fillRect(this.x, this.y - this.state, 1, this.state * 2 + 1);

			//random chance we dont grow
			if (randomInt(0, 100) > 99) {
				this.state += this.transition;
				if (this.state <= minState || this.state >= maxState) {
					this.transition *= -1
				};
			}
		};

		return {
			newStars: function newStars(numberStars) {
				for (var i = 0; i < numberStars; i++) {
					stars.push(new Star(randomInt(0, c_width), randomInt(0, c_height)));
				}
			},

			update: function update() {
				for (var i = 0, len = stars.length; i < len; i++) {
					stars[i].render();
				}
			}
		};
	})();

	var animation = (function(){
		var blackSrceen = 0;
		var transition = 0;
		var textRead = 60;
		var loaded = true;
		var blackText = "";
		var next = "";
		function fadeToBlack(showstring, nextlevel, readTime){
			blackText = showstring;
			next = nextlevel;
			blackScreen = 0.01;	
			transition = 0.01;
			loaded = false;
			readTime == undefined? textRead = 60: textRead = readTime;	
		}
		function animate(){
			if(blackScreen > 0){
				blackScreen+= transition;
				if(blackScreen >= 1){
					blackScreen = 1;	
					if(levelStructure.doneLoading && Assets.isDone() && transition > 0 && textRead <= 0){
						transition *= -1;
					}
					if(!loaded){
						levelStructure.loadLevel(next);
						loaded = true;
					}
					textRead--;	
				}
				if(blackScreen >= 0){
					ctx.fillStyle="rgba(0,0,0,"+blackScreen +")"
					ctx.fillRect(0,0, c_width, c_height);
					ctx.fillStyle="rgba(255,255,255,"+blackScreen +")"
					ctx.textAlign = "center";
					ctx.fillText(blackText, c_width/2, c_height/2);	
				}
			}
		}
		return {
			fadeToBlack:fadeToBlack,
			animate: animate
		}
	})();

	var player = {
		startLocation: {
			x: undefined,
			y: undefined
		},
		endLocation: {
			x: undefined,
			y: undefined
		}
	};

	var playerRender = (function () {

		var points = [player.startLocation];
		var prePoint = {
			x: -1,
			y: -1
		};

		return {
			addPoint: function (x, y) {
				points.push({
					x: x,
					y: y
				});
			},
			setPrePoint: function (x, y) {
				prePoint.x = x;
				prePoint.y = y;
			},
			removeLastPoint: function () {
				points.splice(points.length - 1, 1);
			},
			render: function () {
				ctx.beginPath();
				ctx.lineWidth = 3;
				ctx.moveTo(player.startLocation.x, player.startLocation.y);
				for (var i = 0, len = points.length; i < len; i++) {
					ctx.lineTo(points[i].x, points[i].y);
				}
				ctx.stroke();
				ctx.lineWidth = 1;
				ctx.strokeStyle = "rgb(0, 200, 0)"
				if(prePoint.x > -1){
					ctx.lineTo(prePoint.x, prePoint.y);
					ctx.stroke();
				}
			},
			getPoint: function (i) {
				return points[i];
			},
			getLines: function(){
				return points.length -1 ;
			},
			reset: function(){
				points = [player.startLocation];	
			}


		};

	})();

	var gameLogic = (function () {
		function mouseClick(event) {
			if(checkCondition()){
				nextMove(event.clientX - c_offLeft, event.clientY - c_offTop);
			}
		};

		function mouseMove(event) {
			preRender(event.clientX - c_offLeft, event.clientY - c_offTop);
		};

		canvas.addEventListener("click", mouseClick, false);
		canvas.addEventListener("mousemove", mouseMove, false);

		function nextMove(x, y) {
			playerRender.addPoint(x, y);
		}

		function preRender(x, y) {
			playerRender.setPrePoint(x, y);
		}

		function checkPlayerCollision(collisionBox, collisionMap, collisionColors) {
			//collisionBox is the area of the canvas that requires the collision check
			var imageData = ctx.getImageData(collisionBox.x, collisionBox.y, collisionBox.width, collisionBox.height);
			//CollisionMap provides per-pixel collisions. It expects the x,ys of the pixels it should check 
			for (var point in collisionMap) {
				point = collisionMap[point];
				var Y = point.y * collisionBox.width * 4;
				Y += point.x * 4;
				var ic = {
					r: imageData.data[Y],
					g: imageData.data[Y + 1],
					b: imageData.data[Y + 2],
					a: imageData.data[Y + 3]
				};
				for (var e in collisionColors) {
					e = collisionColors[e];
					if (e.r == ic.r && e.g == ic.g & e.b == ic.b && e.a == ic.a) {
						return ic;
					}
				}
			}
			return false;
		};

		function getColor(r, g, b, a) {
			return {
				r: r,
				g: g,
				b: b,
				a: a
			};
		};

		function createArrayForObject(funct, argLength) {
			return function () {
				var r = [];
				if (Object.prototype.toString.call(arguments[0]) === '[object Array]') {
					for (var i = 0; i < arguments[0].length; i += argLength) {
						r.push(funct.apply(this, arguments[0].slice(i, i + argLength)));
					}
				} else {
					var argList = Array.prototype.slice.call(arguments, 0);
					for (var i = 0; i < arguments.length; i += argLength) {
						r.push(funct.apply(this, argList.slice(i, i + argLength)));
					}

				}
				return r;
			}
		}

		function getCollisionBox(x, y, width, height) {
			return {
				x: x,
				y: y,
				width: width,
				height: height
			};
		};
		//Get point.
		function gp(x, y) {
			return {
				x: x,
				y: y
			};
		}

		function generateCollisionBox(pointsList) {
			var b = 0,
				t = c_height,
				r = 0,
				l = c_width;
			for (var e in pointsList) {
				e = pointsList[e];
				e.y > b ? b = e.y : false;
				e.x > r ? r = e.x : false;
				e.y < t ? t = e.y : false;
				e.x < l ? l = e.x : false;
			}
			return {
				x: l,
				y: t,
				width: r - l,
				height: b - t
			};
		}

		function trimList(pointsList, collisionBox) {
			for (var e in pointsList) {
				pointsList[e].x -= collisionBox.x;
				pointsList[e].y -= collisionBox.y;
			}
			return pointsList;
		}

		function checkCondition(){	
			if(levelStructure.winCondition === "None"){ return true; }
			if(levelStructure.winCondition === "Timer"){ return true; }
			if(levelStructure.winCondition === "Lines"){ return playerRender.getLines() < levelStructure.winNumber; }
		}
		
		var won = false;
		var lost = false;
		function win(){
			if(won){return;}
			animation.fadeToBlack(levelStructure.nextLevelString, levelStructure.nextLevel);
			won = true;
		}
		
		function reset(){
			won = false;
			lost = false;
		}
	
		function checkLoseConditions(){
			if(!checkCondition()){
				if(levelStructure.winCondition === "Lines" && drawGuy.stoped){
					lose();
				}
				else if(levelStructure.winCondition === "Timer"){

				}
			}
		}
		
		function lose(){
			//fade to black,
			if(lost){return;}
			animation.fadeToBlack("Try Again", levelStructure.level);
			lost = true;
			//levelStructure.loadLevel(levelStructure.level);
		}

		function conditionString(){
			if(levelStructure.winCondition === "Lines"){ return "Moves Remaining: " + (levelStructure.winNumber-playerRender.getLines());  }
			else { return ""}	

		}

		return {
			checkPlayerCollision: checkPlayerCollision,
			getColor: createArrayForObject(getColor, 4),
			getCollisionBox: getCollisionBox,
			getPointList: createArrayForObject(gp, 2),
			generateCollisionBox: generateCollisionBox,
			trimList: trimList,
			checkCondition: checkCondition,
			win: win,
			reset: reset,
			lose: lose,
			checkLose: checkLoseConditions,
			getCondition: conditionString,
				
			//Dummy. Winning will be changed

		};

	})();


	var drawGuy = (function () {
		var x = player.startLocation.x,
			y = player.startLocation.y,
			angle = 0;
		var currentPoint = -1,
			speed = 3;
		var distCovered = 0,
			totalDist = 0;
		var addp, p1, p2, deltax, deltay, t = 0;

		function setNewPoints() {
			t = 0;
			distCovered = 0;
			totalDist = 0;
			p1 = playerRender.getPoint(currentPoint + 1);
			p2 = playerRender.getPoint(currentPoint + 2);
			if (p1 == undefined || p2 == undefined) {
				deltax = 0;
				deltay = 0;
				//p1 = {x:x, y:y};
				//p2 = {x:x, y:y};
				addp = {
					x: x,
					y: y
				};
				drawGuy.stoped = true;
				return;
			}
			drawGuy.stoped = false;
			currentPoint++;
			deltax = p2.x - p1.x;
			deltay = p2.y - p1.y;
			totalDist = Math.sqrt((deltax * deltax) + (deltay * deltay));
			deltax = (deltax / totalDist) * speed;
			deltay = (deltay / totalDist) * speed;
		}

		function nextCoord() {
			if (Math.round(distCovered) >= Math.round(totalDist)) {
				setNewPoints(currentPoint, currentPoint + 1);
			}
			var _x = (deltax * t) + p1.x;
			var _y = (deltay * t) + p1.y;
			
			return {
				x: _x,
				y: _y
			};

		}

		function moveGuy(coords) {
			x = coords.x;
			y = coords.y;
			t++;
			distCovered += Math.sqrt((deltax * deltax) + (deltay * deltay));
		}

		function resetGuy() {
			deltax = 0, deltay = 0;
			p1
			t = 0;
			distCovered = 0;
			totalDist = 0 ;
			currentPoint = -1;
			setNewPoints();
		}

		function undo() {
			playerRender.removeLastPoint();
			currentPoint--;
			setNewPoints();
			moveGuy(playerRender.getPoint(currentPoint + 1));
		}
		function draw() {
			var n = nextCoord();
			var collisionDetect = gameLogic.checkPlayerCollision(gameLogic.getCollisionBox(n.x, n.y, 15, 20 ), gameLogic.getPointList(0, 0, 14, 14, 0, 14, 14, 0), levelStructure.collisionColors);
			if (collisionDetect !== false && !objEquals(collisionDetect, levelStructure.goalColor)) {
				ctx.fillText("Colliding", 10, 10)
				undo();
			} else if(collisionDetect == false){
				moveGuy(n);
			}
			else{
				//win
				gameLogic.win();
			}
			drawRotatedImage(Assets.get("dude"), x, y, angle);
		}
		return { 
			draw: draw,
			reset: resetGuy,
			undo: undo
		}
	})();

	var levelStructure = (function(){
		function getCollisionColor(name){
			return collisionColor[name];
		};
		function loadLevel(levelname){
			loadFile(levelname + ".json", 45, parseLevel);
			levelStructure.level = levelname;
		};
		function parseLevel(data){
			var lvl = JSON.parse(data);
			player.startLocation = lvl.start;
			player.endLocation = lvl.end;
			levelStructure.collisionColors = lvl.colors;
			levelStructure.goalColor = lvl.goalColor;
			levelStructure.winCondition = lvl.winCondition;
			levelStructure.winNumber = lvl.winNumber;
			levelStructure.nextLevel = lvl.nextLevel;
			levelStructure.nextLevelString = lvl.nextString;
			playerRender.reset();
			drawGuy.reset();
			gameLogic.reset();
			levelStructure.doneLoading=true;
		};
		function resetLevel(levelname){
			loadLevel(levelname);
			playerRender.reset();
			drawGuy.reset();		
			gameLogic.reset();
		};
		return{
			loadLevel:loadLevel,
			doneLoading:false
		}		
	})();

	pixelStars.newStars(40);

	//Draw the planet 
	function drawPlanet(level) {
		var w = Assets.get(level).width / 2;
		var h = Assets.get(level).height / 2;
		ctx.drawImage(Assets.get(level), (c_width / 2) - w, (c_height / 2) - h);
	}
	
	animation.fadeToBlack("The end of existence is coming. \n Get to next planet.", "l1");

	//Update Function.
	function update() {
		if(levelStructure.doneLoading){
			ctx.fillStyle = "rgb(0,36,73)";
			ctx.fillRect(0, 0, c_width, c_height);
			pixelStars.update();
			drawPlanet(levelStructure.level);
			//Render order matters. because we use colors to figure out if we are colliding we need to render the world first THEN render the guy THEN everything else
			drawGuy.draw();
			playerRender.render();
			ctx.textAlign = "left";
			ctx.fillStyle="white";
			ctx.fillText(gameLogic.getCondition(), 10, 50);
			gameLogic.checkLose();
			
		}
		else{
			ctx.fillStyle="black";
			ctx.fillRect(0,0,c_width, c_height);
		}
		animation.animate();
	};

	setInterval("GameEngine()", 16);
	return update;
})();
