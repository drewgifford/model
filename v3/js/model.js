function mixColors(colors){

  let final = [0,0,0];
  let length = colors.length;

  for(var color of colors){
      final[0] += color[0] * (1 / length);
      final[1] += color[1] * (1 / length);
      final[2] += color[2] * (1 / length);
  }

  final[0] = parseInt(final[0]);
  final[1] = parseInt(final[1]);
  final[2] = parseInt(final[2]);

  return final;
}
/*function mixColors(colors){
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
}*/

function lerpColor(colorFrom, colorTo, alpha){

  for(var i = 0; i < 3; i++){
    colorFrom[i] = parseInt(colorFrom[i] + (colorTo[i] - colorFrom[i]) * alpha);
  }

  return colorFrom;
}

function componentToHex(c) {
  let hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}
function rgbToHex(color) {
return "#" + componentToHex(color[0]) + componentToHex(color[1]) + componentToHex(color[2]);
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
function lerp( a, b, alpha ) {
  return a + alpha * ( b - a )
}



const AMOUNT = 100;
const STEP = 5;

class Voter {
  constructor(x,y,z){
      this.x = x;
      this.y = y;
      this.z = z;
  }

  getDistance(candidate){
      return Math.sqrt(Math.pow(this.x - candidate.x, 2) + Math.pow(this.y - candidate.y, 2) + Math.pow(this.z - candidate.z, 2));
  }


  getVote(cands, MAX_DISTANCE){

      let processedCands = [];

      // Loop through each candidate and do the math
      for(var candidate of cands){
  
          let cand = Object.assign({}, candidate);

          cand.popularity *= (cand.effectiveness/300 + 0.833);
          cand.nameRec *= (cand.effectiveness/300 + 0.833);
        
          // If a user has less than 50 popularity, give them a debuff. Otherwise, give them a buff
          let popularityFactor = (cand.popularity / 100) * 2 - 1
          
          // The "buff" is just artificially moving them closer to the voter. Simulates voter appeal
          cand.x = lerp(cand.x, this.x, popularityFactor / 2);
          cand.y = lerp(cand.y, this.y, popularityFactor / 2);
          cand.z = lerp(cand.z, this.z, popularityFactor / 2);
          
          // Gets the distance to the newly assigned coordinates
          let distance = this.getDistance(cand);
          
          // If the voter knows the candidate, then they have the option to vote for them.
          let rand = Math.random();          
          let knowsCandidate = rand < ((cand.popularity / 200 + 0.5) * (cand.nameRec / 100)*0.75 + 0.25);
          
          // Add a modifier to the distance so when we check who the voter votes for, we are skewed to those closer to the voter.
          cand.distance = Math.max(MAX_DISTANCE - distance, 0);
          
          if(knowsCandidate) processedCands.push(cand);
      }
      
      let totalDistance = processedCands.reduce((sum, a) => sum + a.distance, 0);

      if(totalDistance == 0) return null;

     
      let rand = Math.random();
      let currChance = 0;
      
      for(var cand of processedCands){

          currChance += cand.distance / totalDistance;

          //console.log("I have a", Math.round(currChance*100 * 100)/100 + "% chance to vote for", cand.candName);

          if(rand <= currChance){
              return cands.find(c => c.candName == cand.candName);
          }
      }
      return null;
  }
}

function clamp(n, min, max){

  return Math.min(Math.max(min, n), max);

}

onmessage = function(ev){


    let state = ev.data[0];
    let candidates = Object.values(ev.data[1]);
    let step = ev.data[2];

    

    // Map our values to x,y,z
    for(var cand of candidates){
        cand.x = cand.economic;
        cand.y = cand.freedom;
        cand.z = cand.social;
        cand.votes = 0;
    }
    state.x = state.economic;
    state.y = state.freedom;
    state.z = state.social;

    
    step = clamp(step, 1, 200);

    const MAX_DISTANCE = clamp(state.tolerance, 50, 1000);

    for(var x = -AMOUNT; x <= AMOUNT; x+= step){
        for(var y = -AMOUNT; y <= AMOUNT; y+= step){

            let sliceColors = [];
            let totalEffect = 0;

            for(var z = -AMOUNT; z <= AMOUNT; z+= step){

                let voter = new Voter(x,y,z);
                let distance = voter.getDistance(state);

                let voteEffect = Math.pow((-distance + MAX_DISTANCE) / MAX_DISTANCE, 3);

                let votedFor = voter.getVote(candidates, MAX_DISTANCE);

                if(!votedFor) continue;

                votedFor.votes += voteEffect;
                votedFor.votes = Math.max(votedFor.votes, 0);

                var rgb = hexToRgb(votedFor.color);
                sliceColors.push([rgb[0],rgb[1],rgb[2]]);

                totalEffect += Math.max(voteEffect, 0);

            }

            let weight = (1 - Math.min(totalEffect / (0.75*AMOUNT/step), 1));

            let finalColor = lerpColor(mixColors(sliceColors), [255, 255, 255], weight);

            let sliceRgb = rgbToHex(finalColor);

            this.postMessage(["drawPixel", x, y, sliceRgb, step]);

        }
    }

    this.postMessage(["return", candidates]);
}