// ==UserScript==
// @name          MyBadjature
// @version       0.13
// @description   When can I go home today ?!
// @author        Giorgio Casati
// @match         http://accessi.italrgi.it/infopoint/infopoint.exe?f=c
// @grant         none
// @namespace     http://dfmix-git01/giorgio.casati/TamperMonkeyScripts
// @updateURL     http://dfmix-git01/giorgio.casati/TamperMonkeyScripts/raw/master/MyBadjature.user.js
// @downloadURL   http://dfmix-git01/giorgio.casati/TamperMonkeyScripts/raw/master/MyBadjature.user.js
// @supportURL    http://dfmix-git01/giorgio.casati/TamperMonkeyScripts/issues
// ==/UserScript==

(function () {
    'use strict';

    //Costanti
    var TRE_ORE = 180;
    var OTTO_ORE = 480;
    var OTTO_E_UN_QUARTO = 495; // 8:15
    var NOVE = 540; // 9:00
    var LA_MEZZA = 750; // 12:30
    var DUE_E_MEZZA = 870; // 14:30
    var CINQUE = 1020; // 17:00
    //Costanti DOM
    //var ID_SEASON_CANVAS = 'seasonCanvas';

    var monteOre = 0;
    var eroso = 0;

    var container = $('#content');
    var table = $(container.find('table')[2]);
    var rows = container.find('table')[2].rows;

    var todayDate = new Date();
    var todayMonth = (todayDate.getMonth() * 1) + 1;
    var thisPageMonth = $(rows[1]).find('span')[0].textContent.split('-')[1] * 1;
    var today = (todayMonth === thisPageMonth ? todayDate.getDate() : $(rows[rows.length - 2]).find('span')[0].textContent.split('-')[0]) * 1;

    //Le righe che contano sono le pari a partire dal 2.
    for (var j = 2; j < rows.length; j = j + 2) {

        var row = $(rows[j]);
        var cell = $(row.find('td')[0]);

        var breakTime = 0;
        var lastBreak = null;
        var times = [];
        // gli orari sono negli span multipli di 3
        var arrSpan = cell.find('span');
        for(var k = 0, i = 0, b = 0; k < arrSpan.length; k = k + 3){
            // Raccolgo gli orari convertendo in minuti
            var timeCell = $(arrSpan[k]);
            var type = $(arrSpan[k+2]).text().trim();
            var oreEMin = timeCell.text().trim().split(':');
            var time = (oreEMin[0]*60) + (oreEMin[1]*1);
            if(type === 'Entrata' || type === 'Uscita'){
                times[i++] = time;
            }else if(lastBreak){
                breakTime += (time - lastBreak);
                lastBreak = null;
            }else{
                lastBreak = time;
            }
        }

        // FIXME Per ora considero solo i casi di 3 o 4 badjature, non considero i casi di in-break o di badjature dimenticate
        // 1) normalizzo
        var ritardo = 0;

        // 1.a) Normalizzo entrata mattina
        if(times[0] < OTTO_E_UN_QUARTO){
            times[0] = OTTO_E_UN_QUARTO;
        }else if(times[0] > NOVE){
            ritardo += roundUp(times[0] - NOVE);
            times[0] = NOVE;
        }

        // 1.b) Normalizzo uscita di pranzo
        if(times[1] < LA_MEZZA){
            ritardo += roundUp(LA_MEZZA - times[1]);
            times[1] = LA_MEZZA;
        }

        // 1.c1) Normalizzo i 45 minuti di pausa
        if(times[2] < (times[1] + 45)){
            times[2] = times[1] + 45;
        }

        // 1.c2) Normalizzo entrata da pranzo
        if(times[2] > DUE_E_MEZZA){
            ritardo += roundUp(times[2] - DUE_E_MEZZA);
            times[2] = DUE_E_MEZZA;
        }

        var resultCell = $('<td bgcolor="'+cell.attr('bgcolor')+'"/>');
        if(times.length == 4){
            // 1.d) Normalizzo uscita
            if(times[3] < CINQUE){
                ritardo += roundUp(CINQUE - times[3]);
                times[3] = CINQUE;
            }

            // Scrivo i totali
            var workedTime = roundDown((times[1]-times[0]) + (times[3]-times[2]) - breakTime);
            if(workedTime < OTTO_ORE){
                var diff = OTTO_ORE - workedTime;
                eroso += diff;
                resultCell.append($('<div>ORDINARIE: '+toHourAndMinString(workedTime - ritardo)+'</div>'));
                resultCell.append($('<div>IN MENO:   '+toHourAndMinString(diff)+'</div>'));
            }else{
                var extraTime = workedTime - OTTO_ORE;
                resultCell.append($('<div>ORDINARIE: '+toHourAndMinString(OTTO_ORE - ritardo)+'</div>'));
                if(extraTime > 0){
                    monteOre += extraTime;
                    resultCell.append($('<div>IN PIU\':   '+toHourAndMinString(extraTime)+'</div>'));
                }
            }

            if(breakTime > 0){
                resultCell.append($('<div>FUMATI:   '+toHourAndMinString(breakTime)+'</div>'));
            }

            if(ritardo > 0){
                eroso += ritardo;
                resultCell.append($('<div>RITARDO:   '+toHourAndMinString(ritardo)+'</div>'));
            }
        }else if(times.length == 3){
            var exitTime = OTTO_ORE - times[1] + times[0] + times[2] + breakTime;
            resultCell.append($('<div>USCITA:   '+toHourAndMinString(exitTime)+'</div>'));

            if(breakTime > 0){
                resultCell.append($('<div>FUMATI:   '+toHourAndMinString(breakTime)+'</div>'));
            }

            if(ritardo > 0){
                resultCell.append($('<div>RITARDO:   '+toHourAndMinString(ritardo)+'</div>'));
                //    if(eroso < TRE_ORE){
                //        resultCell.append($('<div>RECUPERO USCENDO:   '+toHourAndMinString(exitTime+ritardo)+'</div>'));
                //    }
            }

            var effective = (monteOre > TRE_ORE ? TRE_ORE : monteOre) - eroso;
            if(effective > 0){
                var wantedExit = exitTime + ritardo - effective;
                if(wantedExit < CINQUE){
                    wantedExit = roundUp(wantedExit);
                }
                resultCell.append($('<div>ERODENDO:'+toHourAndMinString(wantedExit)+'</div>'));
            }
        }
        row.append(resultCell);

        // Se è riga di oggi
        var dayRow = $(rows[j-1]);
        if(1 * dayRow.find('span')[0].textContent.split('-')[0] === today){
            // Scroll to row
            var body = $('body');
            body.animate({
                scrollTop: dayRow.offset().top - body.offset().top - 1
            });

            // Appendo riga dei totali
            var totalCell = $('<td/>');
            if(monteOre > TRE_ORE){
                totalCell.append($('<div>MONTE ORE:'+toHourAndMinString(TRE_ORE)+'</div>'));
                totalCell.append($('<div>STRAORDINARI:'+toHourAndMinString(monteOre-TRE_ORE)+'</div>'));
                monteOre = TRE_ORE;
            }else{
                totalCell.append($('<div>MONTE ORE:'+toHourAndMinString(monteOre)+'</div>'));
            }
            if(eroso){
                totalCell.append($('<div>EROSO:'+toHourAndMinString(eroso)+'</div>'));
            }
            if(monteOre < eroso){
                totalCell.append($('<div>FERIE CONSUMATE:'+toHourAndMinString(eroso-monteOre)+'</div>'));
            }else{
                totalCell.append($('<div>MONTE ORE RESIDUO:'+toHourAndMinString(monteOre-eroso)+'</div>'));
            }
            var totalRow = $('<tr/>').css({textAlign:'right', backgroundColor:cell.attr('bgcolor')}).append($('<td/>')).append($('<td/>')).append(totalCell).append($('<td/>'));
            row.after(totalRow);

            //Tamarrate
            if(times.length == 3){
                var fanfare = buildAudio('fanfare');
                dayRow.find('td').removeAttr('width').removeAttr('colspan');
                var tdContainer = $('<td colspan="2"/>').css({backgroundColor:cell.attr('bgcolor')});
                tdContainer.css({maxWidth:tdContainer.width()});
                dayRow.append(tdContainer);
                tdContainer.append('<canvas id="progressBar" width="'+tdContainer.width()+'" height="'+tdContainer.height()+'" style="display:block;border:0px"/>');//width:100%;height:30px;
                var canvas = document.getElementById('progressBar');
                var cW = canvas.width;
                var cH = canvas.height;
                var ctx = canvas.getContext("2d");
                ctx.textBaseline='top';
                ctx.font=(cH)+'px Helvetica';
                ctx.lineWidth = 3;
                setInterval(function(){
                    ctx.clearRect(0,0,cW,cH);

                    var now = new Date();
                    var h = now.getHours();
                    var m = now.getMinutes();
                    var s = now.getSeconds();
                    var nowTime = h*60+m;
                    var deltaTime = exitTime - nowTime;
                    var dm = s === 0 ? 0 : 1;
                    var ds = s === 0 ? 0 : 60;
                    if(deltaTime > 0){
                        var x = cW - (cW*deltaTime/OTTO_ORE);
                        ctx.fillStyle = '#22ff0f';
                        ctx.strokeStyle = '#00cc00';
                        ctx.fillRect(0,0,x,cH);
                        ctx.strokeRect(0,0,x,cH);
                        ctx.fillStyle = '#ff220f';
                        ctx.strokeStyle = '#cc0000';
                        ctx.fillRect(x+1,0,cW-x-1,cH);
                        ctx.strokeRect(x+1,0,cW-x-1,cH);

                        ctx.fillStyle='#000000';
                        ctx.fillText('Puoi uscire tra ' + toHourAndMinString(deltaTime-dm) + ':' + numberToString(ds-s,2),5,0);
                    }else{
                        if(deltaTime === 0 && s === 0){
                            fanfare.play();
                        }
                        var deltaAlQuarto = (15+((deltaTime-dm)%15))%15;
                        var xQ = cW - (cW*(deltaAlQuarto*60+ds-s)/(15*60));
                        ctx.fillStyle = '#0000ff';
                        ctx.fillRect(0,0,xQ,cH);
                        ctx.fillStyle = '#9999ff';
                        ctx.fillRect(xQ,0,cW-xQ,cH);
                        ctx.strokeStyle = '#1111aa';
                        ctx.strokeRect(0,0,cW,cH);

                        ctx.fillStyle = '#ffffff';
                        ctx.fillText('Maturi il quarto d\'ora tra ' + toHourAndMinString(deltaAlQuarto) + ':' + numberToString(ds-s,2),5,0);
                    }
                },1000);
            }
            dayRow.append($('<td>OGGI</td>').css({textAlign:'center',backgroundColor:cell.attr('bgcolor')}));
            // Esco dal loop.
            break;
        }
    }

    // Customizzazione in base alla data
    seasonCustomization();

    function seasonCustomization(){
        var today = new Date();
        var year = today.getFullYear();
        var month = (today.getMonth() * 1) + 1;
        var day = today.getDate();

        var easter = getEaster(year);
        var dayDiffToEaster = getDayDiff([day, month, year], easter);

        if(month === 2 && day > 10 && day < 15){
            //San Valentino
            valentinesDay(buildCtx());
        }else if(month === 3){
            if(day === 8){
                //festa della donna
                mimosa(buildCtx());
            }else if(day > 13 && day < 18){
                //San Patrizio
                saintPatrickDay(buildCtx());
            }
        }else if(month === 4 && day > 21 && day < 26){
            playAudio('25Aprile');
        }

        if(/*true){*/dayDiffToEaster >= 0 && dayDiffToEaster < 7){
            //Pasqua
            easterEggs(buildCtx());
        }
    }

    function easterEggs(ctx){
        var rabbit = buildRabbits();
        rabbit.setRabbit(rabbit.rabbits.WHITE);
        rabbit.setDirection(rabbit.directions.RIGHT);
        rabbit.setPosition(5,50);

        window.addEventListener("keydown", function(e){
            var keyCode = e.keyCode;
            var direction;
            switch(keyCode){
                case 37:
                case 65:
                    direction=rabbit.directions.LEFT;
                    break;
                case 38:
                case 87:
                    direction=rabbit.directions.UP;
                    break;
                case 39:
                case 68:
                    direction=rabbit.directions.RIGHT;
                    break;
                case 40:
                case 83:
                    direction=rabbit.directions.DOWN;
                    break;
                default:
                    direction = rabbit.direction;
                    break;
            }
            rabbit.setDirection(direction);
        });

        var done = false;
        var egg;
        var builder = eggBuilder(rabbit.rabbits);
        var intervalId = setInterval(function(){
            ctx.clear();
            if(done){
            }else{
                if(!egg || !egg.d){
                    egg = builder.buildEgg(rabbit.bbox(),ctx);
                }else if(rabbit.hit(egg)){
                    rabbit.v+=0.3;
                    rabbit.setRabbit(egg.rabbitColor);
                    done = !builder.hasMoreEggs();
                    egg = null;
                }else{
                    egg.draw(ctx);
                }
            }
            rabbit.update(ctx);
        },20);
    }

    function eggBuilder(rabbits){
        var index = 0;
        var colors = [rabbits.WHITE_RED,rabbits.WHITE_EVIL,rabbits.BLACK,rabbits.BLACK_EVIL,rabbits.BROWN,rabbits.BROWN_CUTE,rabbits.PINK,rabbits.WHITE,];
        var b ={
            buildEgg : function(bbox,c){
                //if(colors.length){
                var d = Math.min(bbox.w/2,bbox.h/3);
                if(d && this.hasMoreEggs()){
                    //var index = Math.floor(Math.random()*colors.length);
                    var color = colors[index++];
                    //colors.splice(index,1);
                    var x=Math.random()*c.w;
                    while(bbox.x <= x && x-bbox.x<=bbox.w){
                        x=Math.random()*c.w;
                    }
                    var y=Math.random()*c.h;
                    while(bbox.y <= y && y-bbox.y<=bbox.h){
                        y=Math.random()*c.h;
                    }
                    var egg = {
                        x:x,
                        y:y,
                        d:d,
                        rabbitColor:color,
                        draw : function(ctx){
                            ctx.drawEgg(this.x,this.y,this.d,0,this.rabbitColor.colors);
                        }
                    };
                    return egg;
                }else{
                    return null;
                }
            },
            hasMoreEggs : function(){
                return index < colors.length;
            },
        };
        return b;
    }

    function buildRabbits(ratio){
        var brown = '#C2A678';
        var brown2 = '#A17854';
        var pink = '#FDC6CE';
        var pink2 = '#F894B7';
        var t = 0;
        var r = ratio ? ratio : 3;
        var spr = buildSprite('sprite_Rabbits', 12,8);
        var obj = {
            x:0,
            y:0,
            setPosition(x,y){
                this.x=x;
                this.y=y;
            },
            d:r,
            sprite:spr,
            bbox : function(){
                var x = this.x;
                var y = this.y;
                var w = this.sprite.w*this.d;
                var h = this.sprite.h*this.d;
                return {x:x,y:y,w:w,h:h};
            },
            hit : function(egg){
                var bb = this.bbox();
                return egg.x>bb.x&&egg.x-bb.x<bb.w&&egg.y>bb.y&&egg.y-egg.d/2-bb.y<bb.h;
            },
            rabbitCol:0,
            rabbitRow:0,
            rabbits:{
                WHITE:{x:0,y:1,colors:{main:'white',rows:[{fill:'#22ff66',stroke:'blue'},{fill:'blue',stroke:'#22ff66'}]}},
                WHITE_RED:{x:0,y:0,colors:{main:'white', rows:[{fill:'#cccccc',stroke:'red'},{fill:'red',stroke:'#cccccc'},{fill:'#cccccc',stroke:'red'}]}},
                WHITE_EVIL:{x:2,y:0,colors:{main:'white',rows:[{fill:'red',stroke:'black'},{fill:'#cccccc',stroke:'red'},{fill:'red',stroke:'black'}]}},
                BLACK:{x:1,y:0,colors:{main:'black',rows:[{fill:'black',stroke:'red'},{fill:'red',stroke:'#333333'},{fill:'black',stroke:'red'},]}},
                BLACK_EVIL:{x:3,y:1,colors:{main:brown2,rows:[{fill:'black',stroke:brown},{fill:'black',stroke:'#00ffff'},{fill:'black',stroke:brown},]}},
                BROWN:{x:3,y:0,colors:{main:brown2,rows:[{fill:brown,stroke:'black'},{fill:brown,stroke:'black'},]}},
                BROWN_CUTE:{x:2,y:1,colors:{main:brown,rows:[{fill:brown2,stroke:pink2},{fill:brown,stroke:brown2},{fill:brown2,stroke:pink2},]}},
                PINK:{x:1,y:1,colors:{main:pink2,rows:[{fill:pink,stroke:'black'},{fill:pink,stroke:'black'},]}},
            },
            setRabbit:function(data){
                this.rabbitCol = data.x % 4;
                this.sprite.setColumn((this.rabbitCol*3)+(this.sprite.currColumn%3));
                this.rabbitRow = data.y % 2;
                this.sprite.setRow(this.rabbitRow*4+this.direction);
            },
            direction : 0,
            directions : {UP:3,DOWN:0,LEFT:1,RIGHT:2},
            directionsArray : [{x:0,y:1},{x:-1,y:0},{x:1,y:0},{x:0,y:-1}],
            getDirection : function(){
                return this.directionsArray[this.direction];
            },
            setDirection:function(n){
                this.direction = n % 4;
                var deltaRow = this.rabbitRow*4;
                this.sprite.setRow(deltaRow+this.direction);
                return this.getDirection();
            },
            next : function(){
                if(t++%6===0){
                    var deltaCol = this.rabbitCol*3;
                    var nextCol = (this.sprite.currColumn+1)%3;
                    this.sprite.setColumn(deltaCol+nextCol);
                }
            },
            v:1,
            move : function(){
                var d = this.getDirection();
                this.next();
                this.x += d.x*this.d*this.v;
                this.y += d.y*this.d*this.v;
            },
            draw : function(ctx){
                var imgW = this.sprite.w*this.d;
                if(this.x < 0){
                    if(this.x + imgW > 0){
                        ctx.drawSprite(this.sprite, this.x+ctx.w, this.y, this.d);
                    }else{
                        this.x += ctx.w;
                    }
                }else if(this.x + imgW > ctx.w){
                    if(this.x < ctx.w){
                        ctx.drawSprite(this.sprite, this.x-ctx.w, this.y, this.d);
                    }else{
                        this.x -= ctx.w;
                    }
                }
                var imgH = this.sprite.h*this.d;
                if(this.y < 0){
                    if(this.y + imgH > 0){
                        ctx.drawSprite(this.sprite, this.x, this.y+ctx.h, this.d);
                    }else{
                        this.y += ctx.h;
                    }
                }else if(this.y + imgH > ctx.h){
                    if(this.y < ctx.h){
                        ctx.drawSprite(this.sprite, this.x, this.y-ctx.h, this.d);
                    }else{
                        this.y -= ctx.h;
                    }
                }
                ctx.drawSprite(this.sprite, this.x, this.y, this.d);
            },
            update:function(ctx){
                this.move();
                this.draw(ctx);
            },
        };
        return obj;
    }

    function mimosa(ctx){
        var t = 0;
        var rH = 2/3;
        var mimosa = buildSprite('mimosa');
        var intervalId = setInterval(function(){
            ctx.clear();
            if(mimosa.h){
                var r = (t<100?(t*ctx.h)/(100*mimosa.h):ctx.h/mimosa.h)*rH;
                var y = ctx.h-mimosa.h*r;
                ctx.save();
                ctx.drawSprite(mimosa, 0, y, r);
                ctx.ctx.scale(-1,1);
                ctx.drawSprite(mimosa, -ctx.w, y, r);
                ctx.restore();
                t++;
            }
        },50);
    }

    function saintPatrickDay(ctx){
        //Audio
        playAudio('SaintPatrickDay');
        // Time
        var t = 0;
        // Rainbow Constant
        var rnbX = ctx.w/5;
        var rnbY = ctx.h;
        var rnbW = 0.78*ctx.w;
        var rnbH = ctx.h;
        // GoldenPot and Leprachaun
        var imgGoldenPot = buildSprite('golden_pot');
        var spriteCoin = buildSprite('sprite_Coin', 10);
        var spriteLeprachaun = buildLeprachaun();
        var box;
        var xGP = rnbX+(7*rnbW/8);
        var yGP;
        var ratioGP;
        // Clovers
        var CLOVERS_NUMBER = 7;
        var bCloversTime = true;
        var clovers = [];

        document.body.addEventListener('click',function(e){
            var x = e.clientX;
            var y = e.clientY;
            var coinNumber = 0;
            for(var i = 0; i < clovers.length; i++){
                var obj = clovers[i];
                if(obj.isCoin){
                    coinNumber++;
                }else{
                    var d = obj.d;
                    if(getDistance2(x,y,obj.x,obj.y) < d*d){
                        obj.isCoin = true;
                        obj.rotate = 0;
                        coinNumber++;
                    }
                }
            }
            if(coinNumber === CLOVERS_NUMBER){
                t = 0;
                bCloversTime = false;
            }
        });

        var intervalId = setInterval(function(){
            ctx.clear();
            if(bCloversTime){
                if(clovers.length < CLOVERS_NUMBER && t%40===0){
                    clovers.push({x:Math.random()*ctx.w, y:Math.random()*ctx.h, d:0, rotate:0, v:Math.random(), vr:1-2*Math.random(), opacity:1, isCoin : false});
                }
                for(var i = 0; i < clovers.length; i++){
                    var obj = clovers[i];
                    if(obj.isCoin){
                        if(t%2 === 0){
                            obj.rotate = (obj.rotate+1)%10;
                        }
                        spriteCoin.setColumn(obj.rotate);
                        ctx.drawSprite(spriteCoin,obj.x-obj.d,obj.y-obj.d,2*obj.d/spriteCoin.w);
                    }else{
                        ctx.save();
                        ctx.ctx.globalAlpha = obj.opacity;
                        ctx.draw4LeafClover2(obj.x,obj.y,obj.d,obj.rotate);
                        ctx.restore();
                        if(obj.opacity === 0){
                            obj.x = Math.random()*ctx.w;
                            obj.y = Math.random()*ctx.h;
                            obj.d = 0;
                            obj.rotate = 0;
                            obj.v = Math.random();
                            obj.vr = 1-2*Math.random();
                            obj.opacity = 1;
                        }else{
                            obj.rotate += obj.vr/50*Math.PI;
                            obj.d += obj.v;
                            if(obj.d > 20){
                                obj.opacity = Math.max(0,obj.opacity-obj.v/50);
                            }
                        }
                    }
                }
            }else{
                ctx.drawRainbow(rnbX,rnbY,rnbW,rnbH);
                if(t%8 === 7){
                    spriteLeprachaun.next();
                }
                if(t < 100){
                    var alpha = (1+t/100)*Math.PI;
                    ctx.clearArc(rnbX,rnbY,rnbW+rnbH,alpha,2*Math.PI);
                    for(var j = 0; j < clovers.length; j++){
                        var coin = clovers[j];
                        if(t%2 === 0){
                            coin.rotate = (coin.rotate+1)%10;
                        }
                        spriteCoin.setColumn(coin.rotate);
                        var coinD = coin.d*(100-t)/100;
                        var coinX = (coin.x-coinD)*(100-t)/100 + (rnbX+rnbW-coinD)*t/100;
                        var coinY = (coin.y-coinD)*(100-t)/100 + (rnbY-coinD)*t/100;
                        ctx.drawSprite(spriteCoin,coinX,coinY,2*coinD/spriteCoin.w);
                    }
                }else if(t > 100){
                    if(!ratioGP){
                        ratioGP = rnbW/(8*imgGoldenPot.w);
                        yGP = ctx.h-(imgGoldenPot.h*ratioGP);
                        box = {x:xGP,y:ctx.h-(3*imgGoldenPot.h*ratioGP/4),w:rnbW/8,h:imgGoldenPot.h*ratioGP*2/3};
                        spriteLeprachaun.setContainer(box).setPosition(0,ctx.h-(imgGoldenPot.h*ratioGP/3)-1);
                    }
                    spriteLeprachaun.move();
                    if(spriteLeprachaun.direction === 2){
                        spriteLeprachaun.draw(ctx);
                        ctx.drawSprite(imgGoldenPot, xGP, yGP, ratioGP);
                    }else{
                        ctx.drawSprite(imgGoldenPot, xGP, yGP, ratioGP);
                        spriteLeprachaun.draw(ctx);
                    }
                }
            }
            t++;
        },20);
    }

    function buildLeprachaun(){
        var spriteLeprachaun = buildSprite('sprite_Leprachaun',4,4).setRow(2);
        var obj = {
            x : 0,
            y : 0,
            sprite : spriteLeprachaun,
            direction : 0,
            directionsArray : [{row:2,v:{x:1,y:0}},{row:3,v:{x:0,y:-1}},{row:1,v:{x:-1,y:0}},{row:0,v:{x:0,y:1}}],
            getDirection : function(){
                return this.directionsArray[this.direction];
            },
            nextDirection : function(){
                this.direction = (this.direction+1)%this.directionsArray.length;
                this.sprite.setRow(this.getDirection().row);
                return this.direction;
            },
            next : function(){
                this.sprite.nextColumn();
            },
            setContainer(box){
                this.box = box;
                return this;
            },
            setPosition(x,y){
                this.x = x;
                this.y = y;
                return this;
            },
            isContained : function(box){
                return !box || (this.x>=box.x && this.x+this.sprite.w<=box.x+box.w && this.y>=box.y && this.y+this.sprite.h<=box.y+box.h);
            },
            move : function(){
                var bIn = this.isContained(this.box);
                var d = this.getDirection();
                this.x += d.v.x;
                this.y += d.v.y;
                if(bIn && !this.isContained(this.box)){
                    this.x -= d.v.x;
                    this.y -= d.v.y;
                    this.nextDirection();
                }
            },
            draw : function(ctx){
                ctx.drawSprite(this.sprite, this.x, this.y);
            }
        };
        return obj;
    }

    function valentinesDay(ctx){
        var w = ctx.w;
        var h = ctx.h;

        playAudio('ValentinesDay');

        var hearts=[];
        document.body.addEventListener('click',function(e){
            var x = e.clientX;
            var y = e.clientY;
            for(var i = 0; i < hearts.length; i++){
                var obj = hearts[i];
                var d = obj.d*1.5;
                if(getDistance2(x,y,obj.x,obj.y) < d*d){
                    obj.nClick++;
                }
            }
        });

        var minD = 20;
        var maxD = 50;
        var t = 0;
        var colors = ['#ff0000', '#ffbbbb', '#77ff00', '#ffff11', '#0000ff', '#44bbff', '#000000', '#a000f0', /*'#ffffff', '#aaefff'*/];
        setInterval(function(){
            ctx.clear();
            if(hearts.length < 10 && t++%90===0){
                hearts.push({x:Math.random()*w,y:h,dx:0,d:minD,dd:Math.random(),nClick:0});
            }
            for(var i = 0; i < hearts.length; i++){
                var obj = hearts[i];
                var nColor = obj.nClick*2%colors.length;
                obj.dx = Math.sin(obj.y/20)*30;
                ctx.drawHeart(obj.x+obj.dx, obj.y, obj.d, colors[nColor], colors[nColor+1]);
                obj.y -= 1;
                obj.d += obj.dd;
                if(obj.y < 0){
                    obj.y = h;
                    obj.x = Math.random()*w;
                }
                if(obj.d>maxD || obj.d<minD){
                    obj.dd *= -1;
                }
            }
        },20);
    }

    function buildCtx(){
        return getCtx(buildCanvas());
    }

    var canvasNumber = 0;
    function buildCanvas(){
        var bkgrd = document.createElement('canvas');
        bkgrd.width = window.innerWidth;
        bkgrd.height = window.innerHeight;
        bkgrd.style.position = 'fixed';
        bkgrd.style.zIndex = 5;//+canvasNumber++;
        bkgrd.style.top = 0;
        bkgrd.style.left = 0;
        bkgrd.style.pointerEvents = 'none';
        document.body.appendChild(bkgrd);
        return bkgrd;
    }

    function buildSprite(imgName,c,r){
        var column = c && c > 0 ? c : 1;
        var row = r && r > 0 ? r : 1;
        var img = {
            row : row,
            column : column,
            currRow : 0,
            currColumn : 0,
            setRow : function(newRow){
                this.currRow = newRow;
                return this;
            },
            setColumn : function(newCol){
                this.currColumn = newCol;
                return this;
            },
            nextRow : function(){
                this.currRow = (this.currRow+1)%this.row;
                return this;
            },
            nextColumn : function(){
                this.currColumn = (this.currColumn+1)%this.column;
                return this;
            },
        };
        var imgDom = new Image();
        imgDom.onload = function(){
            img.img = this;
            img.w = this.width/column;
            img.h = this.height/row;
            img.totW = this.width;
            img.totH = this.height;
        };
        imgDom.src = 'http://dfmix-git01/giorgio.casati/TamperMonkeyScripts/raw/master/Images/'+imgName+'.png';
        return img;
    }

    function buildAudio(audioName){
        var audio = document.createElement('audio');
        audio.volume = 0.17;
        document.body.appendChild(audio);

        var source = document.createElement('source');
        source.src = 'http://dfmix-git01/giorgio.casati/TamperMonkeyScripts/raw/master/Musics/'+audioName+'.mp3';
        source.type = 'audio/mpeg';
        audio.appendChild(source);
        return audio;
    }

    function playAudio(audioName){
        var audio = buildAudio(audioName);
        audio.style.width = window.innerWidth;
        audio.style.position = 'fixed';
        audio.style.bottom = 0;
        audio.style.left = 0;
        audio.autoplay = true;
        audio.controls = true;
    }

    function getCtx(canvas){
        var ctx = {
            canvas:canvas,
            ctx:canvas.getContext("2d"),
            w:canvas.width,
            h:canvas.height,
            save : function(){
                this.ctx.save();
            },
            restore : function(){
                this.ctx.restore();
            },
            clear : function(){
                this.ctx.clearRect(0,0,this.w,this.h);
            },
            fill : function(){
                this.ctx.fill();
            },
            stroke : function(){
                this.ctx.stroke();
            },
            clip : function(){
                this.ctx.clip();
            },
            transform : function(x,y,d,rotate){
                this.ctx.transform(d,0,0,d,x,y);
                this.ctx.rotate(rotate);
            },
            clearArc : function(x,y,r,from,to){
                this.save();
                this.ctx.beginPath();
                this.ctx.moveTo(x,y);
                this.ctx.arc(x, y, r, from,  to);
                this.ctx.lineTo(x,y);
                this.ctx.clip();
                this.clear();
                this.restore();
            },
            drawHeart : function(x,y,d,color,lightColor){
                var w = 16*d/7.5;
                var h = 2*d;

                this.save();
                this.transform(x-w/2, y-h/2, 1, 0);

                var grd = this.ctx.createRadialGradient(w/4,h/3,1,w/4,h/3,d/2);
                grd.addColorStop(0,lightColor);
                grd.addColorStop(1,color);
                this.ctx.fillStyle = grd;

                this.ctx.beginPath();
                this.ctx.moveTo(w/2,h/5);
                this.ctx.bezierCurveTo(5*w/14, 0, 0, h/15, w/28, 2*h/5);
                this.ctx.bezierCurveTo(w/14, 2*h/3, 3*w/7, 5*h/6, w/2, h);
                this.ctx.bezierCurveTo(4*w/ 7, 5*h/6, 13*w/14, 2*h/3, 27*w/28, 2*h/5);
                this.ctx.bezierCurveTo(w, h/15,9*w/14, 0, w/2, h/5);
                this.ctx.fill();
                this.ctx.stroke();
                this.ctx.restore();
            },
            draw4LeafClover : function(x,y,d,rotate){
                this.ctx.save();
                this.ctx.fillStyle = 'green';
                this.ctx.lineWidth = 1/d;
                this.ctx.setTransform(d, 0, 0, d, x, y);
                this.ctx.rotate(rotate);
                this.ctx.beginPath();
                this.ctx.moveTo(0,0);
                this.ctx.bezierCurveTo(-1,-1,1,-1,0,0);
                this.ctx.bezierCurveTo(-1,-1,-1,1,0,0);
                this.ctx.bezierCurveTo(1,1,1,-1,0,0);
                this.ctx.bezierCurveTo(1,1,-1,1,0,0);
                this.ctx.quadraticCurveTo(4/3,1,0,2);
                this.ctx.lineTo(0,7/4);
                this.ctx.quadraticCurveTo(4/3,1,0,0);
                this.ctx.fill();
                this.ctx.stroke();
                this.ctx.restore();
            },
            draw4LeafClover2 : function(x,y,d,rotate){
                this.ctx.save();
                this.ctx.fillStyle = '#009f00';
                this.ctx.lineWidth = 2/d;
                this.ctx.setTransform(d, 0, 0, d, x, y);
                this.ctx.rotate(rotate);

                // GAMBO
                this.ctx.beginPath();
                this.ctx.moveTo(0,0);
                this.ctx.quadraticCurveTo(4/3,1,0,2);
                this.ctx.lineTo(0,7/4);
                this.ctx.quadraticCurveTo(4/3,1,0,0);
                this.ctx.fill();
                this.ctx.stroke();

                var a = 0.45;
                var l = 0.15;
                //SU
                this.ctx.beginPath();
                this.ctx.moveTo(0,-l);
                this.ctx.bezierCurveTo(-1,-a-l,-a,-l-1,0,-l-0.8);
                this.ctx.bezierCurveTo(a,-l-1,1,-a-l,0,-l);
                this.ctx.fill();
                this.ctx.stroke();

                //GIU
                this.ctx.beginPath();
                this.ctx.moveTo(0,l);
                this.ctx.bezierCurveTo(1,a+l,a,1+l,0,l+0.8);
                this.ctx.bezierCurveTo(-a,1+l,-1,a+l,0,l);
                this.ctx.fill();
                this.ctx.stroke();

                //DX
                this.ctx.beginPath();
                this.ctx.moveTo(l,0);
                this.ctx.bezierCurveTo(a+l,-1,1+l,-a,l+0.8,0);
                this.ctx.bezierCurveTo(1+l,a,a+l,1,l,0);
                this.ctx.fill();
                this.ctx.stroke();

                //SX
                this.ctx.beginPath();
                this.ctx.moveTo(-l,0);
                this.ctx.bezierCurveTo(-a-l,1,-1-l,a,-l-0.8,0);
                this.ctx.bezierCurveTo(-1-l,-a,-a-l,-1,-l,0);
                this.ctx.fill();
                this.ctx.stroke();

                //CENTER
                this.ctx.beginPath();
                this.ctx.fillStyle = '#005500';
                this.ctx.moveTo(0,-l-0.8);
                this.ctx.quadraticCurveTo(0,0,-l-0.8,0);
                this.ctx.quadraticCurveTo(0,0,0,l+0.8);
                this.ctx.quadraticCurveTo(0,0,l+0.8,0);
                this.ctx.quadraticCurveTo(0,0,0,-l-0.8);
                this.ctx.fill();
                this.ctx.restore();
            },
            drawRainbow : function(x,y,w,h){
                this.ctx.save();
                this.ctx.setTransform(w,0,0,h,x,y);
                this.drawRainBall(0.1);
                this.ctx.restore();
            },
            drawRainBall : function(w){
                var l = w ? 1-w : 0.5;
                this.save();
                this.ctx.beginPath();
                this.ctx.arc(0,0,1,0,2*Math.PI);
                var grd = this.ctx.createRadialGradient(0,0,l,0,0,1);
                grd.addColorStop(0,'#ff0000');
                grd.addColorStop(0.23,'#ffff00');
                grd.addColorStop(0.33,'#00ff00');
                grd.addColorStop(0.45,'#00ffff');
                grd.addColorStop(0.67,'#0000ff');
                grd.addColorStop(0.80,'#ff00ff');
                grd.addColorStop(1,'#ff0000');
                this.ctx.fillStyle=grd;
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.arc(0,0,l,0,2*Math.PI);
                this.ctx.clip();
                this.ctx.clearRect(-1,-1,2,2);
                this.restore();
            },
            drawSprite : function(img, x, y, multiplier){
                var ratio = multiplier ? multiplier : 1;
                this.ctx.drawImage(img.img, img.currColumn*img.w, img.currRow*img.h, img.w, img.h, x, y, ratio*img.w, ratio*img.h);
            },
            drawEgg : function(x,y,d,rotate,c){
                this.save();

                this.ctx.lineWidth = 2/d;
                this.transform(x,y,d,rotate);
                this.ctx.fillStyle = c.main;

                this.eggPath();
                this.fill();

                this.clip();

                for(var row=0; row < c.rows.length; row++){
                    var rowDelta = -0.46*row;
                    this.ctx.beginPath();
                    this.ctx.fillStyle = c.rows[row].fill;
                    this.ctx.strokeStyle = c.rows[row].stroke;

                    this.ctx.moveTo(-1,rowDelta);
                    for(var i = 0; i < 7; i++){
                        this.ctx.lineTo(-1+i/3,-0.3*(i%2)+rowDelta+0.27);
                    }
                    this.ctx.lineTo(1,rowDelta);
                    this.ctx.lineTo(1,+0.3+rowDelta);
                    for(var j = 0; j < 7; j++){
                        this.ctx.lineTo(1-j/3,0.3*((j+1)%2)+rowDelta+0.27);
                    }
                    this.ctx.closePath();
                    this.ctx.fill();
                    this.ctx.stroke();
                }

                this.ctx.lineWidth = 4/d;
                this.ctx.strokeStyle='black';
                this.eggPath();
                this.stroke();

                this.restore();
            },
            eggPath : function(){
                this.ctx.beginPath();
                this.ctx.moveTo(0,1);
                this.ctx.bezierCurveTo(-1.7,1,-0.9,-2,0,-2);
                this.ctx.bezierCurveTo(0.9,-2,1.7,1,0,1);
                this.ctx.closePath();
            },
        };
        return ctx;
    }

    function toHourAndMinString(time){
        var min = time % 60;
        var hour = (time-min)/60;
        return hour + ':' + numberToString(min,2);
    }

    function numberToString(n,l){
        var s = n+'';
        while(l && s.length < l){
            s = '0'+s;
        }
        return s;
    }

    function roundUp(time){
        return _round(true, 15, time);
    }

    function roundDown(time){
        return _round(false, 15, time);
    }

    function _round(bUp, delta, time){
        var resto = time % delta;
        var floorRound = time - resto;
        return bUp && resto > 0 ? floorRound + delta : floorRound;
    }

    function getDistance(x1,y1,x2,y2){
        return Math.sqrt(getDistance2(x1,y1,x2,y2));
    }

    function getDistance2(x1,y1,x2,y2){
        var dX = x1-x2;
        var dY = y1-y2;
        return dX*dX + dY*dY;
    }

    function getEaster(year) {
        var f = Math.floor,
            G = year % 19,
            C = f(year / 100),
            H = (C - f(C / 4) - f((8 * C + 13)/25) + 19 * G + 15) % 30,
            I = H - f(H/28) * (1 - f(29/(H + 1)) * f((21-G)/11)),
            J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7,
            L = I - J,
            month = 3 + f((L + 40)/44),
            day = L + 28 - 31 * f(month / 4);
        return [day,month,year];
    }

    function getDayDiff(from, to){
        return (new Date(to[2],to[1]-1,to[0])-new Date(from[2],from[1]-1,from[0]))/86400000;
    }
})();