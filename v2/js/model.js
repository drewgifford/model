function mixColors(colors){
    var args = colors;

    var finalColor = [0, 0, 0];

    [].forEach.call(args, arg => {
        
        var weight = arg[3];

        var r = arg[0] * weight;

        var g = arg[1] * weight;
        var b = arg[2] * weight;

        finalColor[0] += r;
        finalColor[1] += g;
        finalColor[2] += b;
    });

    return rgbToHex(parseInt(finalColor[0]), parseInt(finalColor[1]), parseInt(finalColor[2]));
}

function componentToHex(c) {
    let hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}
function rgbToHex(r, g, b) {
return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function hexToRgb(hex){
    var cut = cutHex(hex);

    var r = parseInt(cut.substring(0, 2), 16);
    var g = parseInt(cut.substring(2, 4), 16);
    var b = parseInt(cut.substring(4, 6), 16);

    return [r,g,b];
}

function cutHex(h){
	return (h.charAt(0)=="#") ? h.substring(1,7):h
}

class BellCurve {
    constructor(size, centerX, centerY, stdev){
        this.size = size;
        this.centerX = centerX;
        this.centerY = centerY;
        this.stdev = stdev;

        this.max_distance = Math.sqrt(Math.pow(2 * this.size, 2) * 2);
    }

    slope(value, mean, multiplier){
        var x = value;
        if (multiplier == null) multiplier = 1;

        return multiplier * 1/(Math.sqrt(2*Math.PI)) * Math.pow(Math.E, -0.5 * Math.pow((x - mean)/this.stdev, 2));
    }

    slice(x, y, multiplier){
        if (multiplier == null) multiplier = 1;

        var x_val = this.slope(x, this.centerX, multiplier);
        var y_val = this.slope(y, this.centerY, multiplier);

        return x_val * y_val;
    }
}


function drawPixel(context, x, y, color) {


    var width = context.canvas.offsetWidth;
    var height = context.canvas.offsetHeight;

    var scaleX = width / 200;
    var scaleY = height / 200;

    x = (x + 100) * scaleX;
    y = (y + 100) * scaleY;

	var roundedX = Math.round(x);
    var roundedY = height - Math.round(y);
    context.fillStyle = color || '#000';
  	context.fillRect(roundedX, roundedY, width / 100, height / 100);
}



class Model {

    static run(state, candidates){

        var canvas = document.querySelector("#canvas");
        var context = canvas.getContext('2d');

        var curve = new BellCurve(100, state.economic, state.social, state.deviation);

        /**
         * Code adapted from Lets Run Elections Discord Bot
         * Written by Toadally
         * Last modified 12/20/2022
         */

        [].forEach.call(candidates, cand => {

            var bonusPop = ((cand.effectiveness-50) + cand.nameRec)/2;
            var bonusNameRec = ((cand.effectiveness-50) + cand.popularity)/2;

            cand.modelPopularity = cand.popularity + (bonusPop / 2);
            cand.modelNameRec = cand.nameRec + (bonusNameRec / 2);

            cand.setPoints(0);

        });

        var total = 0;

        var largestSlice = 0;

        // this is like the least efficient way to do this
        for(var x = -100; x <= 100; x++){
            for(var y = -100; y <= 100; y++){
                var slice = curve.slice(x,y);
                if (slice > largestSlice) largestSlice = slice;
            }
        }

        for(var x = -100; x <= 100; x++){

            for(var y = -100; y <= 100; y++){

                var slice = curve.slice(x, y);

                var roundTotal = 0;

                [].forEach.call(candidates, cand => {

                    var multiplier = ((cand.modelNameRec + cand.modelPopularity) / 200) * 0.4 + 0.6;

                    var candCurve = new BellCurve(100, cand.economic, cand.social, (multiplier * 0.4 + 0.6) * 60 * (cand.effectiveness / 100 * 0.5 + 0.5));

                    var points = candCurve.slice(x, y, multiplier) * slice / 100;

                    total = total + points;
                    roundTotal += points;

                    cand.addPoints(points);
                    cand.roundPoints = points;
                });

                var sliceColors = [];

                [].forEach.call(candidates, cand => {

                    var pct = cand.roundPoints / roundTotal;

                    var rgb = hexToRgb(cand.color);

                    sliceColors.push([rgb[0],rgb[1],rgb[2],pct]);

                });

                var sliceColor = mixColors(sliceColors);
                var sliceRgb = hexToRgb(sliceColor);

                var slicePercent = (slice / largestSlice) * 0.75 + 0.25;

                sliceRgb.push(slicePercent);

                sliceColor = mixColors([sliceRgb, [255, 255, 255, 1-slicePercent]]);

                drawPixel(context, x, y, sliceColor);
            }
        }

        [].forEach.call(candidates, cand => {
            cand.percent = Number(cand.getPoints() / total * 100).toFixed(2)
        });

        return candidates;
    }
}