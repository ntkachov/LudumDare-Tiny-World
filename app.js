FlowerPlanet = (function(){

	//Small Helper method for generating random integers
	function randomInt(from, to){
		return Math.round((Math.random()*(to-from))+from);
	};

	var getAsset = (function(){
		var assets = {}

		return function(assetName){
			if(assets[assetName] == undefined){
				assets[assetName] = new Image();
				assets[assetName].src = assetName+".png";
			}
			return assets[assetName];
		};
	})();

	var TO_RADIANS = Math.PI/180;
	function drawRotatedImage(image, x, y, angle) {
		ctx.save();
		ctx.translate(x, y);
		ctx.rotate(angle * TO_RADIANS);
		ctx.drawImage(image, -(image.width/2), -(image.height/2));
		ctx.restore();
	}

//Global Declarations

	var canvas = document.getElementById("canvas");	
	var ctx = canvas.getContext("2d");	
	var c_width = canvas.width;
	var c_height = canvas.height;	

	var pixelStars = (function(){
		var maxState = 3;
		var minState = 0;
		var stars = [];
		
		function Star(x,y){
			this.x = x;
			this.y = y;
			this.state = randomInt(1,2);
			this.transition = randomInt(0,1) > 0? -1 : 1;
		};
		
		Star.prototype.render = function(){
			ctx.fillStyle="rgb(255,255,109)";
			ctx.fillRect(this.x-this.state, this.y, this.state * 2 + 1 , 1);
			ctx.fillRect(this.x, this.y-this.state, 1, this.state * 2 + 1);
			
			//random chance we dont grow
			if(randomInt(0,100) > 99){
				this.state += this.transition;
				if(this.state <= minState || this.state >= maxState){ this.transition *= -1 };
			}
		};
		
		return {	
			newStars: function newStars( numberStars ){
				for(var i = 0; i < numberStars; i++){
					stars.push(new Star(randomInt(0,c_width), randomInt(0,c_height)));
				}	
			},

			update: function update(){
				for(var i = 0, len=stars.length; i < len; i++){
					stars[i].render();
				}
			}
		};
	})();

	var player = {
		startLocation:{x:200,y:300},
	};
	
	var playerRender = (function(){
		
		var points = [];
		var prePoint = {x:-1, y:-1};
		//debug testing	
		for(var i =0 ;i < 200; i++){
			//points.push({x:randomInt(0,c_width), y:randomInt(0, c_height)});
		}
		
		return {
			addPoint: function(x,y){
				points.push({x:x,y:y});
			},
			setPrePoint: function(x, y){
				prePoint.x = x; 
				prePoint.y = y;
			},
			render: function(){
				ctx.beginPath();
				ctx.lineWidth = 3;
				ctx.moveTo(player.startLocation.x, player.startLocation.y);
				for(var i = 0, len = points.length; i < len; i++){
					ctx.lineTo(points[i].x, points[i].y);
				}
				ctx.stroke();
				ctx.lineWidth = 1;
				ctx.strokeStyle="rgb(0, 200, 0)"
				ctx.lineTo(prePoint.x, prePoint.y);
				ctx.stroke();
				
			}
			
			
		};

	})();

	var gameLogic = (function(){
		function mouseClick(event){
			nextMove(event.offsetX, event.offsetY);	
		};	
		function mouseMove(event){
			preRender(event.offsetX, event.offsetY);	
		};
	
		canvas.addEventListener("click", mouseClick, false);
		canvas.addEventListener("mousemove", mouseMove, false);

		function nextMove(x, y){
			playerRender.addPoint(x,y);
		}
		function preRender(x,y){
			playerRender.setPrePoint(x,y);	
		}

		function checkPlayerCollision(collisionBox, collisionMap, collisionColors){
			//collisionBox is the area of the canvas that requires the collision check
			var imageData = ctx.getImageData(collisionBox.x, collisionBox.y, collisionBox.width, collisionBox.height);
			//CollisionMap provides per-pixel collisions. It expects the x,ys of the pixels it should check 
			for(var point in collisionMap){	
				point = collisionMap[point];
				var Y = point.y * collisionBox.width * 4;
				Y += point.x * 4;
				var ic = {r: imageData.data[Y], g: imageData.data[Y+1], b: imageData.data[Y+2], a: imageData.data[Y+3]};
				for(var e in collisionColors){
					e = collisionColors[e];
					if(e.r == ic.r && e.g == ic.g & e.b == ic.b && e.a == ic.a){
						return true;	
					}
				}
			}
			return false;
		};

		function getColor(r,g,b,a){
			return {r:r, g:g, b:b, a:a};
		};
		
		function createArrayForObject(funct, argLength){
			return function(){
				var r = [];
				if(Object.prototype.toString.call( arguments[0] )=== '[object Array]'){ 
					for(var i = 0; i < arguments[0].length; i+=argLength){
						r.push(funct.apply(this, arguments[0].slice(i,i+argLength)));
					}
				}
				else{
					var argList = Array.prototype.slice.call(arguments, 0);
					for(var i = 0; i < arguments.length; i+=argLength){
						r.push(funct.apply(this, argList.slice(i, i+argLength)));
					}

				}
				return r;
			}
		}
		
		function getCollisionBox(x, y, width, height){
			return {x:x, y:y, width:width, height:height};
		};
		//Get point.
		function gp(x,y){
			return {x:x, y:y};
		}

		function generateCollisionBox(pointsList){
			var b = 0, t = c_height, r = 0, l = c_width;
			for(var e in pointsList){
				e = pointsList[e];
				if(e.y > b) { b = e.y };
				if(e.x > r) { r = e.x };
				if(e.y < t) { t = e.y };
				if(e.x < l) { l = e.x };
			}
			return {x:l, y:t, width: r - l, height: b - t};
		}

		function trimList(pointsList, collisionBox){
			for(var e in pointsList){
				pointsList[e].x -= collisionBox.x;
				pointsList[e].y -= collisionBox.y;
			}
			return pointsList;	
		}

	//	var pointList = [];
	//	for(var i = 0; i < 20; i++){ pointList.push(randomInt(0,1000)); pointList.push(randomInt(0,100));};
	//	var p = getPointList(pointList);
	//	var b = generateCollisionBox(p);
	//	console.log(pointList);;
	//	console.log(checkPlayerCollision(b, trimList(p,b),[ getColor(0,0,0,0)]));

		return { checkPlayerCollision: checkPlayerCollision, getColor:createArrayForObject(getColor,4), getCollisionBox: getCollisionBox, getPointList:createArrayForObject(gp,2), generateCollisionBox:generateCollisionBox, trimList:trimList};
				
	})();

	pixelStars.newStars(40);

	//Draw the planet 
	function drawPlanet(){
		var w = getAsset("planet").width/2;
		var h = getAsset("planet").height/2;
		//ctx.drawImage(getAsset("planet"), (c_width/2)-w, (c_height/2)-h);	
		ctx.fillStyle="rgba(255,0,0,255)";
		ctx.fillRect( (c_width/2)-w, (c_height/2)-h, 4, 200);
	}

	var drawGuy = (function(){
		var x = player.startLocation.x, y = player.startLocation.y ,angle = 0;
	
		return function(){
			x++;
			console.log(gameLogic.checkPlayerCollision(gameLogic.getCollisionBox(x,y,20,20), gameLogic.getPointList(0,0,19,19,0,19,0,19), gameLogic.getColor(255,0,0,255)));
			drawRotatedImage(getAsset("dude"), x,y,angle);	
		}
	})();
	//Update Function.
	function update(){
		ctx.fillStyle="rgb(0,36,73)";
		ctx.fillRect(0,0,c_width,c_height);
		pixelStars.update();
		drawPlanet();
		playerRender.render();
		drawGuy();
	};

	setInterval("FlowerPlanet()",16);
	return update;
})();
