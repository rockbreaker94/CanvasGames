// ==UserScript==
// @name         Break_Brick
// @version      0.2
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
        if(!game.ball.y && game.player.life > 0){
            game.ball = game.buildBall(game.ballR);
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
            startUpgradeMenu : function(){
                if(!_this.intervalId){
                    _this.upgradeMenu = _this.newUpgradeMenu(_this.ctx.getWidth(),_this.ctx.getHeight(),_this.player);
                    _this.intervalId = setInterval(_this.dropUpgradeMenu, 17);
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
                        _this.stop();
                        _this.startUpgradeMenu();
                    }
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
                    var bEndLevel = true;
                    for(var i = 0; i < _this.bricks.length; i++){
                        var brick = _this.bricks[i];
                        bEndLevel &= !brick.canBeBroken();
                        if(brick.isSolid() && _this.ball.hit(brick)){
                            _this.player.points += brick.getPoints();
                            brick.getHit();
                        }
                        brick.draw(_this.ctx);
                    }
                    _this.ball.draw(ctx);
                    _this.cursor.draw(ctx);
                    _this.player.draw(_this.ctx, _this.ballR);
                    if(bEndLevel){
                        _this.stop();
                        _this.startUpgradeMenu();
                    }
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
                    canBeBroken : function(){
                        return this.level > 0;
                    },
                    getHit : function(){
                        this.level--;
                    },
                    getPoints : function(){
                        return this.level;
                    },
                    draw : function(ctx){
                        if(this.level > 0){
                            ctx.drawBrick(brick.x,brick.y,brick.w,brick.h,brick.color);
                        }
                    },
                };
                return brick;
            },
            buildCursor : function(w,h){
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
                        var t;
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
                                    t = this.y.v;
                                    this.y.v = -this.x.v;
                                    this.x.v = -t;
                                }
                            }else{
                                hit = (this.x.v > 0 || this.y.v < 0) && getDistance(this.x.c,this.y.c,brick.x,brick.y+brick.h) <= this.r;
                                if(hit){
                                    t = this.y.v;
                                    this.y.v = this.x.v;
                                    this.x.v = t;
                                }
                            }
                        }else{
                            //this.x.c > brick.x+brick.w (= true)
                            if(this.y.c < brick.y){
                                hit = (this.x.v < 0 || this.y.v > 0) && getDistance(this.x.c,this.y.c,brick.x+brick.w,brick.y) <= this.r;
                                if(hit){
                                    t = this.y.v;
                                    this.y.v = this.x.v;
                                    this.x.v = t;
                                }
                            }else{
                                hit = (this.x.v < 0 || this.y.v < 0) && getDistance(this.x.c,this.y.c,brick.x+brick.w,brick.y+brick.h) <= this.r;
                                if(hit){
                                    t = this.y.v;
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
                var p = {
                    points : 0,
                    totalPoints : 0,
                    life : 3,
                    lifeMax : 3,
                    draw : function(ctx, ballR){
                        //console.log(ballR);
                        p.drawLife(ctx, ballR);
                        p.drawPoints(ctx, ballR);
                    },
                    drawPoints : function(ctx, px){
                        var data = {
                            x : 4*px,
                            y : ctx.getHeight() - px,
                            px : 2*px,
                            text : ''+p.points
                        };
                        ctx.write(data);
                        ctx.drawCoin(px*2, ctx.getHeight() - 2*px, px);
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
            },
            upgradeMenu : {
            },
            newUpgradeMenu : function(w,h,p){
                function newBtn(x,y,w,h,txt,color,txtColor,onclick){
                    var btn = {
                        x:x,
                        y:y,
                        w:w,
                        h:h,
                        txt:txt,
                        color:color,
                        txtColor : txtColor,
                        onclick : onclick,
                        moveByDelta : function(dX,dY){
                            btn.moveTo(btn.x+dX,btn.y+dY);
                        },
                        moveTo : function(newX,newY){
                            btn.x = newX;
                            btn.y = newY;
                        },
                        draw : function(ctx){
                            ctx.drawBrick(btn.x, btn.y, btn.w, btn.h, btn.color);
                            ctx.write({x:btn.x+btn.h*1/8,y:btn.y+btn.h*3/4,text:btn.txt,color:btn.txtColor,px:btn.h*3/4});
                        },
                        initListener : function(){
                            container.addEventListener('click',function(e){
                                if(btn.x < e.layerX && btn.x + btn.w > e.layerX &&  btn.y < e.layerY && btn.y + btn.h > e.layerY){
                                    btn.onclick();
                                }
                            });
                        }
                    };
                    return btn;
                }

                var START_X = 0;
                var START_Y = -h;
                var menu = {
                    backgroundColor : '#3fff3f',
                    x : START_X,
                    y : START_Y,
                    w : w,
                    h : h,
                    vY : h/100,
                    dX : w/100,
                    dY : h/20,
                    txtX : function(){return menu.x + menu.dX;},
                    txtY : function(){return menu.y + menu.dY;},
                    upgBox : function(){
                        return {
                            x:menu.txtX(),
                            y:menu.txtY() + menu.dY/2,
                            w:menu.w-menu.dX*2,
                            h:menu.h-menu.dY*2,
                            color:menu.backgroundColor
                        };
                    },
                    buttons : [
                        newBtn(START_X + 19*w/40, START_Y + 37*h/40 - w/80, w/20, w/40, 'Start', 'red', 'black', _this.init),
                    ],
                    move : function(ctx){
                        var lastY =  (ctx.getHeight() - menu.h)/2;
                        if(menu.y < lastY){
                            for(var i = 0; i < menu.buttons.length; i++){
                                menu.buttons[i].moveByDelta(0,menu.vY);
                            }
                            menu.y += menu.vY;
                            return true;
                        }else{
                            var deltaY = lastY - menu.y;
                            for(var j = 0; j < menu.buttons.length; j++){
                                menu.buttons[j].moveByDelta(0,deltaY);
                            }
                            menu.y = lastY;
                            return false;
                        }
                    },
                    draw : function(ctx){
                        //Background
                        ctx.drawBrick(menu.x,menu.y,menu.w,menu.h,menu.backgroundColor);
                        //Title
                        ctx.write({x:menu.txtX(),y:menu.txtY(),color:'#ffff00',colorStroke:'black',text:'Upgrade',px:menu.dY});
                        ctx.drawCoin(menu.x+menu.w-menu.dX-menu.dY/2, menu.y+menu.dY*2/3, menu.dY/2);
                        var pointString = '' + p.points;
                        ctx.write({x:menu.x+menu.w-menu.dX-menu.dY/2-(pointString.length*menu.dY),y:menu.txtY(),color:'black',text:pointString,px:menu.dY});
                        //Upgrade Box
                        var upgBox = menu.upgBox();
                        ctx.drawBrick(upgBox.x,upgBox.y,upgBox.w,upgBox.h,upgBox.color);
                        for(var i = 0; i < menu.buttons.length; i++){
                            menu.buttons[i].draw(ctx);
                        }
                        //Bottone Start
                        // var btnW = menu.w/20;
                        // var btnH = btnW/2;
                        // var btnX = menu.x+(menu.w-btnW)/2;
                        // var btnY = upgBox.y + upgBox.h -menu.dY - btnH/2;
                        // ctx.drawBrick(btnX, btnY, btnW, btnH, 'red');
                        // ctx.write({x:btnX+btnH*1/8,y:btnY+btnH*3/4,text:'Start',color:'black',px:btnH*3/4});
                        //ctx.drawLine(upgBox.x,upgBox.y+upgBox.h/2,upgBox.x+upgBox.w,upgBox.y+upgBox.h/2,'#ffff00');
                    },
                    initBtnListeners : function(){
                        for(var i = 0; i < menu.buttons.length; i++){
                            menu.buttons[i].initListener();
                        }
                    }
                };
                return menu;
            },
            dropUpgradeMenu : function(){
                //console.log(_this.upgradeMenu);
                if(!_this.upgradeMenu.move(_this.ctx)){
                    _this.stop();
                    _this.upgradeMenu.initBtnListeners();
                }
                _this.upgradeMenu.draw(_this.ctx);
            },
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
            drawCoin : function(xC, yC, r){
                var light = '#ffff66';
                var color = '#ffaa00';
                var shadow = '#aa6600';

                var grdStrokeOut = this.ctx.createLinearGradient(xC-r,yC-r,xC+r,yC+r);
                grdStrokeOut.addColorStop(0, light);
                grdStrokeOut.addColorStop(0.5, color);
                grdStrokeOut.addColorStop(1, shadow);
                this.setStroke(grdStrokeOut);
                this.setFill(grdStrokeOut);
                this.drawCircle(xC, yC, r);

                var rIn = 4*r/5;
                var grdStrokeIn = this.ctx.createLinearGradient(xC-rIn,yC-rIn,xC+rIn,yC+rIn);
                grdStrokeIn.addColorStop(0, shadow);
                grdStrokeIn.addColorStop(0.5, color);
                grdStrokeIn.addColorStop(1, light);
                this.setStroke(grdStrokeIn);
                this.setFill(grdStrokeOut);
                this.drawCircle(xC, yC, rIn);

                var txtFill = this.ctx.createLinearGradient(xC-r/2,yC-r/2,xC+r,yC+r);
                txtFill.addColorStop(0, light);
                txtFill.addColorStop(0.5, color);
                txtFill.addColorStop(1, shadow);

                this.write({text : 'B', x : xC-r/3, y : yC+r/3, px : r, color : r > 15 ? txtFill:'black', colorStroke: r > 15 ? 'black' : grdStrokeOut});
            },
            drawLine : function(x1,y1,x2,y2,color){
                this.setStroke(color);
                this.ctx.beginPath();
                this.ctx.moveTo(x1,y1);
                this.ctx.lineTo(x2,y2);
                this.ctx.stroke();
                this.ctx.endPath();
            },
            write : function(data){
                //console.log(data);
                if(data && data.text && data.text.length){
                    this.setFill(data.color ? data.color : 'black');
                    this.setStroke(data.colorStroke ? data.colorStroke : 'white');
                    this.setFontDim(data.px);
                    var x = data.x/* > 0 ? data.x : 0*/;
                    var y = data.y/* > 0 ? data.y : this.getHeight()*/;
                    var maxWidth = this.getWidth()- x;
                    this.ctx.strokeText(data.text, x, y, maxWidth);
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