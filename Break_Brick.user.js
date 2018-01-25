// ==UserScript==
// @name         Break_Brick
// @version      0.1
// @description  Breaking bricks are so funny !!!
// @author       Giorgio Casati
// @include      *
// @grant        none
// @namespace    https://github.com/puzza/CanvasGames
// @updateURL    https://github.com/puzza/CanvasGames/raw/master/Break_Brick.user.js
// @downloadURL  https://github.com/puzza/CanvasGames/raw/master/Break_Brick.user.js
// @supportURL   https://github.com/puzza/CanvasGames/issues
// ==/UserScript==

(function() {
    'use strict';
    var html = document.getElementsByTagName('html')[0];
    while (html.firstChild) {
        html.removeChild(html.firstChild);
    }
    var body = document.createElement('body');
    body.style.backgroundColor = 'black';
    html.appendChild(body);

    var w = Math.min(window.innerWidth,2*window.innerHeight);
    var h = Math.min(window.innerWidth/2,window.innerHeight);
    var container = document.createElement('canvas');
    container.style.backgroundColor = 'white';
    container.style.border = '0px';
    container.style.position = 'fixed';
    container.style.left = ((window.innerWidth-w)/2)+'px';
    container.style.top = ((window.innerHeight-h)/2)+'px';
    container.width = w;
    container.height = h;
    container.id='mioCanvas';
    body.appendChild(container);

    var ctx = getCtx(container);
    var game = breakBricks(ctx);
    game.init();
    container.addEventListener('mousemove',function(e){
        //console.log(e);
        game.mousePos = {x:e.layerX, y:e.layerY};
    });
    container.addEventListener('click',function(e){
        //console.log(e);
		if(game.player.life > 0){
			if(!game.ball.y){
				game.ball = game.buildBall(game.ballR);
			}
		}else{
			game.init();
		}
    });

    //////////////////////////////
    function breakBricks(ctx){
        var _this = {
            ctx : ctx,
            intervalId : null,
            mousePos : {x:0,y:0},
			ballR : 0,
            bricks : [],
            init : function(){
				var nCol = 20;
				var nRow = 10;
				_this.cleanGame();
				_this.buildBricksAndCursor(nRow,nCol);
				_this.player = _this.newPlayer();
				_this.start();
			},
			cleanGame : function(){
				_this.bricks = [];
				_this.cursor = {};
				_this.player = {};
				_this.ballR = 0;
				_this.ball = {
						move : function(ctx){
					},
						hit : function(brick){
					},
						draw : function(ctx){
					}
				};
			},
			start : function(){
				if(!_this.intervalId){
					_this.intervalId = setInterval(_this.update, 17);
				}
            },
			stop : function(){
				if(_this.intervalId){
					clearInterval(_this.intervalId);
					_this.intervalId = null;
				}
			},
			buildBricksAndCursor : function(nRow, nCol){
				var deltaW = _this.ctx.getWidth() % nCol;
				var deltaH = (_this.ctx.getHeight()/2) % nRow;
				var marginLeft = deltaW/2;
                var brW = (_this.ctx.getWidth()-deltaW)/nCol;
                var brH = ((_this.ctx.getHeight()/2)-deltaH)/nRow;
                for(var riga = 0; riga < nRow; riga++){
                    for(var col = 0; col < nCol; col++){
                        _this.addBrick(marginLeft+(col*brW), deltaH+(riga*brH), brW, brH, 'red');
                    }
                }
				_this.cursor = _this.buildCursor(brW*1.5,brH/2);
				_this.ballR = brH/4;
			},
            update : function(){
				if(_this.ball.y && _this.ball.y.c > _this.ctx.getHeight()+_this.ball.r){
					if(_this.player.life <= 0){
						alert('GAME OVER');
					}
					//_this.stop();
					_this.ball = {
						move : function(ctx){
						},
						hit : function(brick){
						},
						draw : function(ctx){
						}
					};
				}else{
					_this.ctx.clear();
					_this.cursor.move(_this.ctx);
					_this.ball.move(_this.ctx);
					_this.cursor.hit(_this.ball);
					for(var i = 0; i < _this.bricks.length; i++){
						var brick = _this.bricks[i];
						if(brick.isSolid() && _this.ball.hit(brick)){
							_this.player.points += brick.getPoints();
							brick.getHit();
						}
						brick.draw(_this.ctx);
					}
					_this.ball.draw(ctx);
					_this.cursor.draw(ctx);
					_this.player.draw(_this.ctx, _this.ballR);
				}
			},
            ball : {
                move : function(ctx){
                },
                hit : function(brick){
                },
                draw : function(ctx){
                }
            },
            cursor : {},
            addBrick : function(x,y,w,h,color){
                _this.bricks.push(_this.newBrick(x,y,w,h,color));
            },
            newBrick : function(x,y,w,h,color){
                var brick = {
                    x:x,
                    y:y,
                    w:w,
                    h:h,
					level:1,
                    color:color,
					isSolid : function(){
						return this.level > 0;
					},
					getHit : function(){
						this.level--;
					},
					getPoints : function(){
						return this.level;
					},
                    draw : function(ctx){
						if(this.isSolid()){
							ctx.drawBrick(brick.x,brick.y,brick.w,brick.h,brick.color);
						}
					},
                };
                return brick;
            },
            buildCursor : function(w,h){
                //var w = _this.ctx.getWidth()/24;
                //var h = _this.ctx.getHeight()/40;
                var cursor = _this.newBrick((_this.ctx.getWidth()-w)/2, (_this.ctx.getHeight()-h*3), w, h, 'red');
                cursor.move = function(_ctx){
                    cursor.x = Math.min(Math.max(_this.mousePos.x - (cursor.w/2), 0), _ctx.getWidth()-cursor.w);
                };
				cursor.hit = function(ball){
					if(ball.hit(cursor)){
						//ball.y.v -= 1;
						var x = Math.max(cursor.x, Math.min(cursor.x+cursor.w, ball.x.c));
						ball.x.v = (x - cursor.x - (cursor.w/2))/(cursor.w/2)*(ball.r/2);
					}
				};
                return cursor;
            },
            buildBall : function(r){
				_this.player.life--;
                var ball = {
                    r : r,
                    x : {
                        c : _this.mousePos.x,
                        v : r/2
                    },
                    y : {
                        c : (_this.cursor.y - r),
                        v : -r/2
                    },
                    move : function(ctx){
                        this.moveOnAxis(this.x, 0, ctx.getWidth());
                        this.moveOnAxis(this.y, 0, ctx.getHeight()+(this.r*3));
                    },
                    moveOnAxis : function(axis, min, max){
                        var newC = axis.c + axis.v;
                        if(newC - this.r < min){
                            axis.v = -axis.v;
                            newC = (2*min) + (2*this.r) - newC;
                        }else if(newC + this.r > max){
                            axis.v = -axis.v;
                            newC = (2*max) - (2*this.r) - newC;
                        }
                        axis.c = newC;
                    },
                    hit : function(brick){
						var hit = false;
						if(this.x.c >= brick.x && this.x.c <= brick.x+brick.w){
							if(this.y.v < 0 && this.y.c >= brick.y+brick.h){
								hit = this.r >= this.y.c - brick.y - brick.h;
							}else if(this.y.v > 0 && this.y.c <= brick.y){
								hit = this.r >= brick.y - this.y.c;
							}
							
							if(hit){
								this.y.v = -this.y.v;
							}
						}else if(this.y.c >= brick.y && this.y.c <= brick.y+brick.h){
							if(this.x.v < 0 && this.x.c >= brick.x+brick.w){
								hit = this.r >= this.x.c - brick.x - brick.w;
							}else if(this.x.v > 0 && this.x.c <= brick.x){
								hit = this.r >= brick.x - this.x.c;
							}
							
							if(hit){
								this.x.v = -this.x.v;
							}
						}else if(this.x.c < brick.x){
							if(this.y.c < brick.y){
							hit = (this.x.v > 0 || this.y.v > 0) && getDistance(this.x.c,this.y.c,brick.x,brick.y) <= this.r;
								if(hit){
									var t = this.y.v;
									this.y.v = -this.x.v;
									this.x.v = -t;
								}
							}else{
							hit = (this.x.v > 0 || this.y.v < 0) && getDistance(this.x.c,this.y.c,brick.x,brick.y+brick.h) <= this.r;
								if(hit){
									var t = this.y.v;
									this.y.v = this.x.v;
									this.x.v = t;
								}
							}
						}else{
							//this.x.c > brick.x+brick.w (= true)
							if(this.y.c < brick.y){
							hit = (this.x.v < 0 || this.y.v > 0) && getDistance(this.x.c,this.y.c,brick.x+brick.w,brick.y) <= this.r;
								if(hit){
									var t = this.y.v;
									this.y.v = this.x.v;
									this.x.v = t;
								}
							}else{
							hit = (this.x.v < 0 || this.y.v < 0) && getDistance(this.x.c,this.y.c,brick.x+brick.w,brick.y+brick.h) <= this.r;
								if(hit){
									var t = this.y.v;
									this.y.v = -this.x.v;
									this.x.v = -t;
								}
							}
						}
						return hit;
                    },
                    draw : function(ctx){
                        //console.log(this);
                        ctx.drawBall(this.x.c, this.y.c, this.r, 'black');
                    }
                };
                return ball;
            },
			player : {},
			newPlayer : function(){
				var drawMargin = 5;
				var p = {
					points : 0,
					life : 3,
					draw : function(ctx, ballR){
						//console.log(ballR);
						drawMargin = ballR;
						p.drawLife(ctx, ballR);
						p.drawPoints(ctx, ballR);
					},
					drawPoints : function(ctx, px){
						var data = {
							x : px,
							y : ctx.getHeight() - px,
							px : 2*px,
							text : ''+p.points
						};
						ctx.write(data);
					},
					drawLife : function(ctx, ballR){
						var margin = 2 * ballR;
						var deltaX = 3 * ballR;
						var xC = ctx.getWidth() - margin;
						var yC = ctx.getHeight() - margin;
						for(var i = 0; i < p.life; i++){	
							ctx.drawBall(xC - (i * deltaX), yC, ballR, 'black');
						}
					}
				};
				return p;
			}
        };
        return _this;
    }

    function getCtx(canvas){
        var obj = {
            canvas : canvas,
            ctx: canvas.getContext("2d"),
            drawRect : function(x,y,w,h){
                this.ctx.fillRect(x,y,w,h);
                this.ctx.strokeRect(x,y,w,h);
            },
            drawBrick : function(x,y,w,h,color){
				var delta = (2*h*w)/((w*w)+(h*h));
				var deltaX = delta*h;
				var deltaY = delta*w;

				var grd = this.ctx.createLinearGradient(x, y, x+deltaX, y+deltaY);
				grd.addColorStop(0, "white");
				grd.addColorStop(0.5, color);
				grd.addColorStop(1, "black");

				this.ctx.fillStyle = grd;
				this.ctx.fillRect(x,y,w,h);
    
				var margin = 3;
				this.ctx.fillStyle = color;
				this.ctx.fillRect(x+margin,y+margin,w-2*margin,h-2*margin);
            },
            drawCircle : function(xC, yC, r){
                this.ctx.beginPath();
                this.ctx.arc(xC,yC,r,0,2*Math.PI);
                this.ctx.fill();
                this.ctx.stroke();
            },
            drawBall : function(xC, yC, r, color){
                var grdFill = this.ctx.createRadialGradient(xC-(r/2), yC-(r/2), 1, xC, yC, r);
                grdFill.addColorStop(0, 'white');
                grdFill.addColorStop(1, color);
                this.setFill(grdFill);

                var grdStroke = this.ctx.createRadialGradient(xC-r, yC-r, 1.5*r, xC-r, yC-r, 3*r);
                grdStroke.addColorStop(0, color);
                grdStroke.addColorStop(1, 'black');
                this.setStroke(grdStroke);

                this.drawCircle(xC, yC, r);
            },
			write : function(data){
				//console.log(data);
				if(data && data.text && data.text.length){
					this.setFill(data.color ? data.color : 'black');
					this.setFontDim(data.px);
					var x = data.x > 0 ? data.x : 0;
					var y = data.y > 0 ? data.y : this.getHeight();
					var maxWidth = this.getWidth()- x;
					this.ctx.fillText(data.text, x, y, maxWidth);
				}
			},
            setStroke : function(color){
                this.ctx.strokeStyle = color;
            },
            setFill : function(color){
                this.ctx.fillStyle = color;
            },
			setFontDim : function(px){
				this.ctx.font = (px > 0 ? px : 10)+'px Georgia';
			},
            getWidth : function(){
                return this.canvas.width;
            },
            getHeight : function(){
                return this.canvas.height;
            },
            clear : function(){
				var w = this.getWidth();
				var h = this.getHeight();
				this.ctx.clearRect(0, 0, w, h);
                //var d = 200;
				//var l = 40;
				//for(var i = 0; i < w + h; i+=d){
				//	this.ctx.beginPath();
				//	this.ctx.moveTo(i,0);
				//	this.ctx.lineTo(i+l,0);
				//	this.ctx.lineTo(0,i+l);
				//	this.ctx.lineTo(0,i);
				//	this.ctx.closePath();
				//	this.setFill('lime');
				//	this.setStroke('black');
				//	this.ctx.fill();
				//	this.ctx.stroke();
				//	
				//	
				//	this.ctx.beginPath();
				//	this.ctx.moveTo(i,h);
				//	this.ctx.lineTo(i+l,h);
				//	this.ctx.lineTo(0,h-i-l);
				//	this.ctx.lineTo(0,h-i);
				//	this.ctx.closePath();
				//	this.setFill('blue');
				//	this.setStroke('red');
				//	this.ctx.fill();
				//	this.ctx.stroke();
				//}
            }
        };
        return obj;
    }

    function pulse(r,g,b,delta){
        var c = {
            r:r,
            g:g,
            b:b,
            delta:delta,
            next : function(){
                if(c.r === 255 && c.g !== 255){
                    if(c.b === 0){
                        c.g+=c.delta;
                    }else{
                        c.b-=c.delta;
                    }
                }else if(c.g === 255 && c.b !== 255){
                    if(c.r === 0){
                        c.b+=c.delta;
                    }else{
                        c.r-=c.delta;
                    }
                }else if(c.b === 255 && c.r !== 255){
                    if(c.g === 0){
                        c.r+=c.delta;
                    }else{
                        c.g-=c.delta;
                    }
                }else{
                    alert('colore impossibile');
                }
                c.r=normalize(0, c.r, 255);
                c.g=normalize(0, c.g, 255);
                c.b=normalize(0, c.b, 255);
                return c;
            },
            toString : function(){
                var s = '#'+getHex(c.r)+getHex(c.g)+getHex(c.b);
                c.next();
                return s;
            },
        };
        return c;
    }
    function getHex(decimal){
        var hex = decimal.toString(16);
        if(hex.length === 1){
            hex = '0'+hex;
        }
        return hex;
    }
    function normalize(min, n, max){
        if(n < min){
            return min;
        }else if(n > max){
            return max;
        }else{
            return n;
        }
    }
	
	function getDistance(x1,y1,x2,y2){
		return Math.sqrt(getDistance2(x1,y1,x2,y2),2);
	}
	
	function getDistance2(x1,y1,x2,y2){
		var dX = x1-x2;
		var dY = y1-y2;
		var dX2 = dX*dX;
		var dY2 = dY*dY;
		return dX2+dY2;
	}
})();