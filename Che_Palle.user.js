// ==UserScript==
// @name         Che_Palle
// @version      0.3
// @description  Bouncing balls are so funny !!!
// @author       Giorgio Casati
// @include      *
// @grant        none
// @namespace    https://github.com/puzza/CanvasGames
// @updateURL    https://github.com/puzza/CanvasGames/raw/master/Che_Palle.user.js
// @downloadURL  https://github.com/puzza/CanvasGames/raw/master/Che_Palle.user.js
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
    var game = chePalle(ctx);

    container.addEventListener('mousemove',function(e){
        //console.log(e);
        game.mousePos = {x:e.layerX, y:e.layerY};
    });
    container.addEventListener('mousedown',function(e){
        game.startBuildNewBall(e.layerX, e.layerY);
    });
    container.addEventListener('mouseup',function(e){
        game.start();
    });

    window.addEventListener("keyup", function(e){
        var keyCode = e.keyCode;
        if(keyCode>36 && keyCode<41){
            switch(keyCode){
                case 37:
                    game.setGravity({x:-1,y:0});
                    break;
                case 38:
                    game.setGravity({x:0,y:-1});
                    break;
                case 39:
                    game.setGravity({x:1,y:0});
                    break;
                case 40:
                    game.setGravity({x:0,y:1});
                    break;
            }
        }else if(keyCode === 13 || keyCode ===  27 || keyCode === 32){
            game.stopBalls();
        }
    });

    //////////////////////////////
    function chePalle(ctx){
        var _this = {
            ctx : ctx,
            balls : [],
            g : {x:0, y:1},
            intervalId : null,
            mousePos : {x:0,y:0},
            newR : 0,
            newX : 0,
            newY : 0,
            maxNewR : 0,
            minNewR : 25,
            start : function(){
                if(_this.intervalId !== null){
                    clearInterval(_this.intervalId);
                }
                if(_this.newR >= _this.minNewR){
                    _this.addBall(_this.newX, _this.newY, _this.newR, _this.nextColor());
                }
                _this.intervalId = setInterval(_this.update, 20);
            },
            startBuildNewBall : function(xC, yC){
                if(_this.intervalId !== null){
                    clearInterval(_this.intervalId);
                }
                _this.newR = 0;
                _this.newX = xC;
                _this.newY = yC;
                var min = Math.min(xC, yC, game.ctx.getWidth()-xC, game.ctx.getHeight()-yC);
                for(var i = 0; i < _this.balls.length; i++){
                    var ball = _this.balls[i];
                    min = Math.min(min, ball.getMaxR(xC, yC));
                }
                if(min >= _this.minNewR){
                    _this.maxNewR = min;
                    _this.intervalId = setInterval(_this.updateBuildNewBall, 20);
                }else{
                    _this.start();
                }
            },
            updateBuildNewBall : function(){
                var dX = _this.newX-_this.mousePos.x;
                var dY = _this.newY-_this.mousePos.y;
                var d = Math.sqrt((dX*dX)+(dY*dY),2);
                _this.newR = Math.max(_this.minNewR, Math.min(d,_this.maxNewR));
                _this.ctx.clear();
                for(var i = 0; i < _this.balls.length; i++){
                    var ball = _this.balls[i];
                    ball.draw(_this.ctx);
                }
                _this.newBall(_this.newX, _this.newY, _this.newR, _this.g, 'black').draw(_this.ctx);
            },
            update : function(){
                _this.ctx.clear();
                for(var i = 0; i < _this.balls.length; i++){
                    var ball = _this.balls[i];
                    for(var j = i+1; j < _this.balls.length; j++){
                        ball.crash(_this.balls[j]);
                    }
                    ball.move(_this);
                    ball.draw(_this.ctx);
                }
            },
            addBall : function(cX, cY, r, color){
                _this.balls.push(_this.newBall(cX, cY, r, _this.g, color));
            },
            newBall : function(cX, cY, r, g, color){
                var ball = {
                    x : {
                        a : g.x,
                        v : 0,
                        c: cX
                    },
                    y : {
                        a : g.y,
                        v : 0,
                        c : cY
                    },
                    r : r,
                    color : color,
                    crash : function(oth){
                        if(this.isCrashing(oth)){
                            this.doCrash(oth);
                        }
                    },
                    isCrashing : function(oth){
                        if((this.x.c-oth.x.c)*(this.x.v-oth.x.v)<0 || (this.y.c-oth.y.c)*(this.y.v-oth.y.v)<0){
                            var d2 = this.getDistance2(oth.x.c, oth.y.c);
                            var r1 = this.r + oth.r;
                            var r2 = r1*r1;
                            return d2 <= r2;
                        }
                        return false;
                    },
                    doCrash : function(oth){
                        var thisSplit = this.getSplittedV(oth);
                        var othSplit = oth.getSplittedV(this);
                        this.x.v = thisSplit.thisV.x + othSplit.othV.x;
                        this.y.v = thisSplit.thisV.y + othSplit.othV.y;
                        oth.x.v = othSplit.thisV.x + thisSplit.othV.x;
                        oth.y.v = othSplit.thisV.y + thisSplit.othV.y;
                        if(this.r > oth.r){
                            oth.changeC(this);
                        }else{
                            this.changeC(oth);
                        }
                    },
                    changeC : function(oth){
                        var d = oth.r+this.r;
                        var deltaD = d - Math.sqrt(this.getDistance2(oth.x.c,oth.y.c));
                        var deltaX = 0;
                        var deltaY = deltaD;
                        var diffX = this.x.c-oth.x.c;
                        var diffY = this.y.c-oth.y.c;
                        if(diffX !== 0){
                            var a1 = Math.abs((diffY)/(diffX));
                            deltaX = Math.sqrt((deltaD*deltaD)/((a1*a1)+1));
                            deltaY = deltaX*a1;
                        }
                        if(diffX < 0){
                            deltaX = -deltaX;
                        }
                        if(diffY < 0){
                            deltaY = -deltaY;
                        }
                        this.x.c += deltaX;
                        this.y.c += deltaY;
                        //console.log('('+this.x.c+'; '+this.y.c+') con deltaD:'+deltaD+' e a1:'+a1);
                    },
                    getMaxR : function(othX, othY){
                        var d2 = this.getDistance2(othX, othY);
                        return Math.sqrt(d2) - this.r;
                    },
                    getDistance2 : function(othX, othY){
                        var deltaX = this.x.c - othX;
                        var deltaY = this.y.c - othY;
                        return (deltaX*deltaX) + (deltaY*deltaY);
                    },
                    getSplittedV : function(oth){
                        var ratioM = (2*this.r)/(this.r+oth.r);
                        if(oth.x.c !== this.x.c && oth.y.c !== this.y.c){
                            var a1 = (oth.y.c - this.y.c)/(oth.x.c - this.x.c);
                            var a2 = -1/a1;
                            var othVX = ((a2*this.x.v)-this.y.v)/(a2-a1);
                            var othVY = othVX*a1;
                            var thisVX = this.x.v - othVX;
                            var thisVY = this.y.v - othVY;
                            return {thisV:{x:thisVX,y:thisVY},othV:{x:othVX*ratioM,y:othVY*ratioM}};
                        }else if(oth.x.c === this.x.c){
                            return {thisV:{x:this.x.v,y:0},othV:{x:0,y:this.y.v*ratioM}};
                        }else{
                            return {thisV:{x:0,y:this.y.v},othV:{x:this.x.v*ratioM,y:0}};
                        }
                    },
                    move : function(game){
                        this.moveOnAxis(game, this.x, 0, game.ctx.getWidth());
                        this.moveOnAxis(game, this.y, 0, game.ctx.getHeight());
                    },
                    moveOnAxis : function(game, axis, min, max){
                        axis.v += axis.a;
                        var newC = axis.c + axis.v;
                        if(newC - this.r < min){
                            axis.v = -axis.v;
                            //newC = (2*min) + (2*this.r) - newC;
                            newC = min + this.r;
                        }else if(newC + this.r > max){
                            axis.v = -axis.v;
                            //newC = (2*max) - (2*this.r) - newC;
                            newC = max - this.r;
                        }
                        axis.c = newC;
                    },
                    draw :  function(ctx){
                        ctx.drawBall(this.x.c, this.y.c, this.r, this.color);
                    }
                };
                return ball;
            },
            colors : [function(){return pulse(255, 0, 150, 10);}, function(){return '#ff0000';}, function(){return '#ffff00';}, function(){return '#00ff00';}, function(){return '#00ffff';}, function(){return '#0000ff';}, function(){return '#ff00ff';}, function(){return pulse(255, 0, 0, 1);}],
            currentColor : 0,
            nextColor : function(){
                return _this.colors[_this.currentColor++%_this.colors.length]();
            },
            setGravity : function(g){
                _this.g = g;
                for(var i = 0; i < _this.balls.length; i++){
                    var ball = _this.balls[i];
                    ball.x.a = g.x;
                    ball.y.a = g.y;
                }
            },
            stopBalls : function(){
                _this.g = {x:0,y:0};
                for(var i = 0; i < _this.balls.length; i++){
                    var ball = _this.balls[i];
                    ball.x.a = 0;
                    ball.x.v = 0;
                    ball.y.a = 0;
                    ball.y.v = 0;
                }
            }
        };
        return _this;
    }

    function getCtx(canvas){
        var obj = {
            canvas : canvas,
            ctx: canvas.getContext("2d"),
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
            setStroke : function(color){
                this.ctx.strokeStyle = color;
            },
            setFill : function(color){
                this.ctx.fillStyle = color;
            },
            getWidth : function(){
                return this.canvas.width;
            },
            getHeight : function(){
                return this.canvas.height;
            },
            clear : function(){
                this.ctx.clearRect(0, 0, this.getWidth(), this.getHeight());
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
})();