import axios from "axios";
import {sgfutils} from "./utils";

const postEngineCmd = function(cmd, currentSGF, handleResponse) {
  const prevLength = [0];
  axios
    .post("/api/engine", {
      cmd:cmd,
      currentSGF:currentSGF
    },{
      onDownloadProgress: progressEvent => {
        //console.log('POST chunk ',progressEvent.currentTarget.response.length, progressEvent);
        console.log('POST chunk ',progressEvent && progressEvent.currentTarget && progressEvent.currentTarget.response && progressEvent.currentTarget.response.length);
        //const dataChunk = progressEvent.currentTarget.response;
        // dataChunk contains the data that have been obtained so far (the whole data so far)..
        // So here we do whatever we want with this partial data..
        // In my case I'm storing that on a redux store that is used to
        // render a table, so now, table rows are rendered as soon as
        // they are obtained from the endpoint.
        progressEvent && progressEvent.currentTarget && progressEvent.currentTarget.response && handleResponse && handleResponse(progressEvent.currentTarget.response.substr(prevLength[0]));
        prevLength[0] = progressEvent && progressEvent.currentTarget && progressEvent.currentTarget.response && progressEvent.currentTarget.response.length;
        if(prevLength > 20000) {
          postEngineCmd("\n"); // interrupts kata analyze
        }
      }
    })
    //--- read chunck
    .then(function (response) {
      console.log('POST response',response && typeof response.data);
      //response && response.data && handleResponse && handleResponse(response.data);
      //controls.getLatestSGF();
      response && response.data && response.data.length && handleResponse && handleResponse(response.data);
      //prevLength[0] = progressEvent && progressEvent.currentTarget && progressEvent.currentTarget.response && progressEvent.currentTarget.response.length;

    })
    .catch(function (error) {
      console.log('POST error',error);
    });
}

const renderSuggestions = function(response) {
  if(response && typeof response === "string" && response.indexOf('info move') >= 0) {
    //controls.overlayControls.clearCanvas();
    var lastResponse = response.split('info move ');
    lastResponse.splice(0,1);

    //console.log('response[0]' , response[0]);
    // console.log('lastResponse[0]' , lastResponse[0]);
    //console.log('lastResponse[1]' , lastResponse[1]);
    var bestMoveScore = -1000;
    //var maxMoveSuggestions = 20;
    var maxMoveSuggestions = 40;

    //var kataMoveSet = firstResponse[firstResponse.length-1];
    for(var moveIdx = 0; moveIdx < lastResponse.length && maxMoveSuggestions >0; moveIdx++){
      var moveSetInfo = lastResponse[moveIdx].split(' ');
      var kataMove = moveSetInfo[0];
      var scoreIdx = moveSetInfo.indexOf('scoreMean');
      if(scoreIdx > 0) {
        var scoreMean = Math.round(parseFloat(moveSetInfo[scoreIdx+1]));
        //console.log('move ',moveIdx, ' score at ',scoreIdx );
        if(bestMoveScore < scoreMean) {
          bestMoveScore = scoreMean;
        }

        if(scoreMean > bestMoveScore-4) {
          maxMoveSuggestions--;
          var color = "#6666FF"; // blue
          if(scoreMean == -1 && moveIdx > 0) {
            color = "#11FF11";// green
          } else if(scoreMean == -2) {
            color = "#AA6622";// orange
          } else if(scoreMean <= -3) {
            color = "#FF3333";// red
          }
          var kataPoint = sgfutils.humanToPoint(kataMove);

          //controls.overlayControls.drawCircle(kataPoint.x, kataPoint.y, color, scoreMean);
        }
      }
    }
  } else {
    console.log('not renderable ', response);
  }
}


// SGF: current state or last 2 moves
// playmove: callback that plays the engine move to the board/SGF
export function getNextMove(cmd, SGF, playMove) {
  //postEngineCmd('time_settings 0 5 1\nkomi 7.5\nboardsize 19\nclear_board\nkata-analyze B 50\n');
  //postEngineCmd('quit\n');
  //postEngineCmd('time_settings 0 5 1\nkomi 7.5\nboardsize 19\nclear_board\ngenmove B\n');
  //postEngineCmd('time_settings 0 5 1\nkomi 7.5\nboardsize 19\nclear_board\ngenmove B\n', playMove);
  console.log("SGF ",SGF);
  postEngineCmd(cmd, SGF, playMove);
}

export function getUtils() {
  return sgfutils;
}
