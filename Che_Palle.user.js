// ==UserScript==
// @name         Che_Palle
// @version      0.1
// @description  Bouncing balls are so funny !!!
// @author       Giorgio Casati
// @include      *
// @grant        none
// @namespace    http://dfmix-git01/giorgio.casati/TamperMonkeyScripts
// @updateURL    http://dfmix-git01/giorgio.casati/TamperMonkeyScripts/raw/master/Che_Palle.user.js
// @downloadURL  http://dfmix-git01/giorgio.casati/TamperMonkeyScripts/raw/master/Che_Palle.user.js
// @supportURL   http://dfmix-git01/giorgio.casati/TamperMonkeyScripts/issues
// ==/UserScript==

(function() {
    'use strict';
    var body = document.getElementsByTagName('body')[0];
    while (body.firstChild) {
        body.removeChild(body.firstChild);
    }
    var w = 1200;
    var h = 600;
    var container = document.createElement('canvas');
    //container.style.backgroundColor = '#ff0000';
    //container.style.padding = '5px';
    //container.style.borderRadius = '5px';
    container.style.border = '2px solid black';
    container.style.position = 'fixed';
    container.style.left = ((screen.width-w)/2)+'px';
    container.width = w;
    container.height = h;
    container.id='mioCanvas';

    var ctx = getCtx(container);
    var game = chePalle(ctx);

    window.addEventListener('mousedown',function(e){
        game.startBuildNewBall(e.layerX, e.layerY);
    });
    window.addEventListener('mouseup',function(e){
        game.start();
    });

    body.appendChild(container);

    //////////////////////////////
    function chePalle(ctx){
        var _this = {
            ctx : ctx,
            balls : [],
            intervalId : null,
            newR : 0,
            newX : 0,
            newY : 0,
            maxNewR : 0,
            start : function(){
                if(_this.intervalId !== null){
                    clearInterval(_this.intervalId);
                }
                if(_this.newR > 0){
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
                var min = Math.min(125, xC, yC, game.ctx.getWidth()-xC, game.ctx.getHeight()-yC);
                for(var i = 0; i < _this.balls.length; i++){
                    var ball = _this.balls[i];
                    min = Math.min(min, ball.getMaxR(xC, yC));
                }
                _this.maxNewR = min;
                _this.intervalId = setInterval(_this.updateBuildNewBall, 20);
            },
            updateBuildNewBall : function(){
                if(_this.newR > _this.maxNewR){
                    _this.newR = 0;
                }
                _this.ctx.clear();
                for(var i = 0; i < _this.balls.length; i++){
                    var ball = _this.balls[i];
                    ball.draw(_this.ctx);
                }
                _this.newBall(_this.newX, _this.newY, _this.newR++, 'black').draw(_this.ctx);
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
                _this.balls.push(_this.newBall(cX, cY, r, color));
            },
            newBall : function(cX, cY, r, color){
                var ball = {
                    x : {
                        a : 0,
                        v : 0,
                        c: cX
                    },
                    y : {
                        a : 1,
                        v : 0,
                        c : cY
                    },
                    r : r,
                    color : color,
                    crash : function(oth){
                        if(this.isCrashing(oth.x.c, oth.y.c, oth.r) && ((this.x.c-oth.x.c)*(this.x.v-oth.x.v)<0 || (this.y.c-oth.y.c)*(this.y.v-oth.y.v)<0)){
                            var thisSplit = this.getSplittedV(oth.x.c, oth.y.c);
                            var othSplit = oth.getSplittedV(this.x.c, this.y.c);
                            this.x.v = thisSplit.thisV.x + othSplit.othV.x;
                            this.y.v = thisSplit.thisV.y + othSplit.othV.y;
                            oth.x.v = othSplit.thisV.x + thisSplit.othV.x;
                            oth.y.v = othSplit.thisV.y + thisSplit.othV.y;
                        }
                    },
                    isCrashing : function(othX, othY, othR){
                        var d2 = this.getDistance2(othX, othY);
                        var r1 = this.r + othR;
                        var r2 = r1*r1;
                        return d2 <= r2;
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
                    getSplittedV : function(othX, othY){
                        if(othX !== this.x.c && othY !== this.y.c){
                            var a1 = (othY - this.y.c)/(othX - this.x.c);
                            var a2 = -1/a1;
                            var othVX = ((a2*this.x.v)-this.y.v)/(a2-a1);
                            var othVY = othVX*a1;
                            var thisVX = this.x.v - othVX;//((a1*this.x.v)-this.y.v)/(a1-a2);
                            var thisVY = this.y.v - othVY;//thisVX*a2;
                            //console.log(a1 + '; '+ a2);
                            //console.log('('+this.x.v+'; '+this.y.v+') = ('+thisVX+'; '+thisVY+') + ('+othVX+'; '+othVY+')');
                            return {thisV:{x:thisVX,y:thisVY},othV:{x:othVX,y:othVY}};
                        }else if(othX === this.x.c){
                            return {thisV:{x:this.x.v,y:0},othV:{x:0,y:this.y.v}};
                        }else{
                            return {thisV:{x:0,y:this.y.v},othV:{x:this.x.v,y:0}};
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
            colors : ['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff'],
            currentColor : 0,
            nextColor : function(){
                return _this.colors[_this.currentColor++%_this.colors.length];
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
})();