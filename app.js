FlowerPlanet = (function( ){

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

	var drawRotatedImage= (function(){
		var TO_RADIANS = Math.PI/180;
		return function(image, x, y, angle) {
			ctx.save();
			ctx.translate(x, y);
			ctx.rotate(angle * TO_RADIANS);
			ctx.drawImage(image, 0, 0);
			ctx.restore();
		};
	})();

	function getOffset( el ) {
		var _x = 0;
		var _y = 0;
		while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
		_x += el.offsetLeft - el.scrollLeft;
		_y += el.offsetTop - el.scrollTop;
		el = el.offsetParent;
		}
		return { top: _y, left: _x };
	}

//Global Declarations

	var canvas = document.getElementById("canvas");	
	var ctx = canvas.getContext("2d");	
	var c_width = canvas.width;
	var c_height = canvas.height;	
	var c_offTop = getOffset(canvas).top;
	var c_offLeft = getOffset(canvas).left;

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
		
		var points = [player.startLocation];
		var prePoint = {x:-1, y:-1};
		
		return {
			addPoint: function(x,y){
				points.push({x:x,y:y});
			},
			setPrePoint: function(x, y){
				prePoint.x = x; 
				prePoint.y = y;
			},
			removeLastPoint: function(){
				points.splice(points.length-1, 1);
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
				
			},
			getPoint: function(i){
				return points[i];
			}
			
			
		};

	})();

	var gameLogic = (function(){
		function mouseClick(event){
			nextMove(event.clientX - c_offLeft, event.clientY - c_offTop);	
		};	
		function mouseMove(event){
			preRender(event.clientX - c_offLeft, event.clientY - c_offTop);	
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

		return { checkPlayerCollision: checkPlayerCollision, getColor:createArrayForObject(getColor,4), getCollisionBox: getCollisionBox, getPointList:createArrayForObject(gp,2), generateCollisionBox:generateCollisionBox, trimList:trimList};
				
	})();


	var drawGuy = (function(){
		var x = player.startLocation.x, y = player.startLocation.y ,angle = 0;
		var currentPoint = -1, speed = 3;
		var distCovered = 0, totalDist = 0;
		var addp, p1,p2,deltax, deltay, t = 0;
		function setNewPoints(){
				t = 0;
				distCovered = 0;
				totalDist = 0;
				p1 = playerRender.getPoint(currentPoint + 1);
				p2 = playerRender.getPoint(currentPoint + 2);
				if(p1 == undefined || p2 == undefined){
					deltax = 0;
					deltay = 0;
					//p1 = {x:x, y:y};
					//p2 = {x:x, y:y};
					addp = {x:x, y:y};
					return;	
				}
				currentPoint++;
				deltax = p2.x - p1.x;
				deltay = p2.y - p1.y;
				totalDist = Math.sqrt((deltax*deltax)+(deltay*deltay));
				deltax = (deltax/totalDist) * speed;
				deltay = (deltay/totalDist) * speed;
		}		

		function nextCoord(){
			if(Math.round(distCovered) >= Math.round(totalDist)){
				setNewPoints(currentPoint, currentPoint+1);
			}
			
			t++;
			distCovered += Math.sqrt((deltax*deltax)+(deltay*deltay));
			var _x = (deltax * t) + p1.x;
			var _y = (deltay * t) + p1.y;
			return {x:_x,y:_y};	
			
		}
		function moveGuy(coords){
			x = coords.x;
			y = coords.y;
		}
		function resetGuy(){
			currentPoint = -1;
			setNewPoints();	
		}
		function undo(){
			playerRender.removeLastPoint();
			currentPoint--;
			setNewPoints();
			moveGuy(playerRender.getPoint(currentPoint+1));
		}
		resetGuy();
		return function(){
			var n = nextCoord();
			var t = gameLogic.checkPlayerCollision(gameLogic.getCollisionBox(n.x,n.y,20,20), gameLogic.getPointList(0,0,19,19,0,19,19,0), gameLogic.getColor(255,0,0,255));
			if(t){
				ctx.fillText("Colliding", 10, 10)
				undo();
			}	
			else{
				moveGuy(n);
			}
			drawRotatedImage(getAsset("dude"), x,y,angle);	
		}
	})();

	pixelStars.newStars(40);

	//Draw the planet 
	function drawPlanet(level){
		var w = getAsset(level).width/2;
		var h = getAsset(level).height/2;
		ctx.drawImage(getAsset(level), (c_width/2)-w, (c_height/2)-h);	
		//ctx.fillStyle="rgba(255,0,0,255)";
		//ctx.fillRect( (c_width/2)-w, (c_height/2)-h, 4, 200);
	}
	//Update Function.
	function update(level){
		ctx.fillStyle="rgb(0,36,73)";
		ctx.fillRect(0,0,c_width,c_height);
		pixelStars.update(level);
		drawPlanet("planet");
		//Render order matters. because we use colors to figure out if we are colliding we need to render the world first THEN render the guy THEN everything else
		drawGuy();
		playerRender.render();
	};

	setInterval("FlowerPlanet()",16);
	return update;
})();
