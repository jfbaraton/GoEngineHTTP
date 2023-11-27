var sgf = require('smartgame');

// how many points can you lose in one move and still consider it "joseki"?
//const JOSEKI_MARGIN = 2.3;
const JOSEKI_MARGIN = 4;

module.exports = {
    getEmptySGF: function() {
        return sgf.parse('(;GM[1]FF[4]CA[UTF-8]KM[7.5]SZ[19])');
    },

    yCoordinateFor: function yCoordinateFor(y) {
        return 19 - y;
    },

    xCoordinateFor: function xCoordinateFor(x) {
        var letters = ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T"];

        return letters[x];
    },

    // x, y to human
    coordinatesFor: function coordinatesFor(y, x) {
        return this.xCoordinateFor(x) + this.yCoordinateFor(y);
    },

    // human to sgfCoord
    humanToSgfCoord: function coordinatesFor(moveHumanString) {
        //console.log("humanToSgfCoord ", moveHumanString);
        if(!moveHumanString || typeof moveHumanString !== "string" || moveHumanString === "root") return null;
        if(moveHumanString === "pass" || moveHumanString === "PASS") return "";
        let x = moveHumanString.toUpperCase().substring(0,1).charCodeAt(0)-'A'.charCodeAt(0);
        if(x>=8) x--; // letter 'i' is skipped
        const y = 19-parseInt(moveHumanString.substring(1));
        return this.pointToSgfCoord({y: y, x:x});
    },
    // human to point
    humanToPoint: function coordinatesFor(moveHumanString) {
        //console.log("humanToSgfCoord ", moveHumanString);
        if(!moveHumanString || typeof moveHumanString !== "string" || moveHumanString === "root") return null;
        if(moveHumanString === "pass" || moveHumanString === "PASS") return "";
        let x = moveHumanString.toUpperCase().substring(0,1).charCodeAt(0)-'A'.charCodeAt(0);
        if(x>=8) x--; // letter 'i' is skipped
        const y = 19-parseInt(moveHumanString.substring(1));
        return {y: y, x:x};
    },

    sgfCoordToPoint:function(_18a){
        if(!_18a||_18a==="tt"){
            return {x:null,y:null,pass:true};
        }
        let _18b={a:0,b:1,c:2,d:3,e:4,f:5,g:6,h:7,i:8,j:9,k:10,l:11,m:12,n:13,o:14,p:15,q:16,r:17,s:18};
        return {x:_18b[_18a.charAt(0)],y:_18b[_18a.charAt(1)]};
    },

    // B."pd" -> "B Q16"
    SGFToHuman: function (sgfNode) {
        if(!sgfNode || (typeof sgfNode.B === "undefined" && typeof sgfNode.W === "undefined" )) return "";
        let result = "play "+ (typeof sgfNode.B === "undefined" ? "W " : "B ");
        const SGFmoveString = typeof sgfNode.B === "undefined" ? sgfNode.W : sgfNode.B;
        const movePoint = this.sgfCoordToPoint(SGFmoveString);

        result += this.pointToHuman(movePoint);
        return result+"\n";
    },

    pointToHuman:function(pt){
        if(!pt || pt.pass){
            return "PASS";
        }
        const pts={0:"A",1:"B",2:"C",3:"D",4:"E",5:"F",6:"G",7:"H",8:"J",9:"K",10:"L",11:"M",12:"N",13:"O",14:"P",15:"Q",16:"R",17:"S",18:"T"};
        return pts[pt.x]+(19-pt.y);
    },

    pointToSgfCoord:function(pt){
        console.log("pointToSgfCoord ", pt);
        if(!pt || pt.x === null || pt.y === null || pt.x <0 || pt.y <0){
            return "";
        }
        let pts={0:"a",1:"b",2:"c",3:"d",4:"e",5:"f",6:"g",7:"h",8:"i",9:"j",10:"k",11:"l",12:"m",13:"n",14:"o",15:"p",16:"q",17:"r",18:"s"};
        return pts[pt.x]+pts[pt.y];
    },

    getAllPossibleTransform:function(){
        // diagonal means symmetry along bot-left to top-right diagonal
        // horizontal means symmetry that transforms left to right
        // vertical means symmetry that transforms top to bottom
        const ALL_POSSIBLE_TRANSFORMS = [
            {diagonal:false, horizontal:false, vertical: false }, // identity, does not change anything
            {diagonal:false, horizontal:false, vertical: true  }, // R16 -> R4
            {diagonal:false, horizontal:true , vertical: false }, // R16 -> C16
            {diagonal:false, horizontal:true , vertical: true  }, // R16 -> C4
            {diagonal:true , horizontal:false, vertical: false }, // R16 -> Q17
            {diagonal:true , horizontal:false, vertical: true  }, // R16 -> Q3
            {diagonal:true , horizontal:true , vertical: false }, // R16 -> D17
            {diagonal:true , horizontal:true , vertical: true  }  // R16 -> D3
        ];

        return ALL_POSSIBLE_TRANSFORMS;
    },

    getTopRightTransform:function(){
        // diagonal means symmetry along bot-left to top-right diagonal
        // horizontal means symmetry that transforms left to right
        // vertical means symmetry that transforms top to bottom
        const ALL_POSSIBLE_TRANSFORMS = [
            {diagonal:false, horizontal:false, vertical: false }, // identity, does not change anything
            {diagonal:true , horizontal:false, vertical: false } // R16 -> Q17
        ];

        return ALL_POSSIBLE_TRANSFORMS;
    },

    getIdentityTransform:function(){
        // diagonal means symmetry along bot-left to top-right diagonal
        // horizontal means symmetry that transforms left to right
        // vertical means symmetry that transforms top to bottom
        const ALL_POSSIBLE_TRANSFORMS = [
            {diagonal:false, horizontal:false, vertical: false }
        ];

        return ALL_POSSIBLE_TRANSFORMS;
    },

    // if any availableTransform transforms sourcePoint into targetPoint, return them. otherwise return null
    getPossibleTransforms:function(sourcePoint, targetPoint, availableTransform){
        if(sourcePoint.pass && targetPoint.pass) {return availableTransform;}
        if(sourcePoint.pass || targetPoint.pass) {return null;}
        let result = [];
        availableTransform.forEach(oneTransform => {
            let target = this.transformMove(sourcePoint, oneTransform);
            //console.log('IS one possible transform ',targetPoint,' =?= ', sourcePoint, ' -- ',oneTransform,' -> ',target);
            if(target.y === targetPoint.y && target.x === targetPoint.x) {
                //console.log('found one possible transform ',targetPoint,' =?= ',oneTransform,' -> ',target);
                //console.log('YESS !');
                result.push(oneTransform);
            }
        });
        //console.log('return ', result);
        return result.length?result:null;
    },

    // if any availableTransform transforms sourcePoint into targetPoint, return them. otherwise return null
    transformMove:function(sourcePoint, oneTransform){
        if(sourcePoint.pass) {return sourcePoint;}
        let target = {y:sourcePoint.y, x:sourcePoint.x};
        if(oneTransform.diagonal) {
            target.y = 18-sourcePoint.x;
            target.x = 18-sourcePoint.y;
        }
        if(oneTransform.horizontal) {
            target.x = 18 - target.x;
        }
        if(oneTransform.vertical) {
            target.y = 18 - target.y;
        }
        return target;
    },

    // if any availableTransform transforms sourcePoint into targetPoint, return them. otherwise return null
    revertMove:function(sourcePoint, oneTransform){
        if(sourcePoint.pass) {return sourcePoint;}
        let target = {y:sourcePoint.y, x:sourcePoint.x};

        if( oneTransform.diagonal) {
            //console.log('swap diag ', target.y, target.x);
             target.y = 18-sourcePoint.x;
             target.x = 18-sourcePoint.y;
        }
        if( oneTransform.diagonal && oneTransform.vertical || !oneTransform.diagonal && oneTransform.horizontal) {
            //console.log('swap x ', target.x);
            target.x = 18 - target.x;
        }
        if(oneTransform.diagonal && oneTransform.horizontal || !oneTransform.diagonal && oneTransform.vertical) {
            //console.log('swap y ',target.y);
            target.y = 18 - target.y;
        }

        return target;
    },

    isAcceptableMove: function(node, previousNode, minimumScore) {
        if(!node || node.BM || node.UC) return false;
        if(node.DM || typeof node.B === "string" && node.B === '' || typeof node.W === "string" && node.W === '' ) return true; // joseki or pass always accepted

        if(previousNode) {
            // if same move color as the previous move, we don't accept
            if(this.areMovesSameColor(node,previousNode)) return false;
            const margin = typeof node.B === "string" ? JOSEKI_MARGIN : -JOSEKI_MARGIN;
            let scoreThreshold = typeof minimumScore !== "undefined" ? minimumScore : typeof previousNode.V !== "undefined" ? (parseFloat(previousNode.V)-margin) : null;
            if(typeof node.V !== "undefined" && scoreThreshold != null && node.W === "pc") {
                console.log("is acceptable based on V?", node);
                console.log("?", previousNode);
                console.log("B<?", typeof node.B === "string", parseFloat(node.V), scoreThreshold);
                console.log("W>?", typeof node.W === "string");
                if(typeof node.B === "string" && parseFloat(node.V)<scoreThreshold) { // black move
                    return false;
                } else if(typeof node.W === "string" && parseFloat(node.V)>scoreThreshold) { // white move
                    return false;
                }
            }

        }
        return true;
    },

    // returns {node:node, nodeIdx:nodeIdx} or null
    getPreviousMove: function(nodeAndNodeIdx) {
        if(!nodeAndNodeIdx ||!nodeAndNodeIdx.node || !nodeAndNodeIdx.node.nodes || !nodeAndNodeIdx.node.nodes.length || nodeAndNodeIdx.nodeIdx>=nodeAndNodeIdx.node.nodes.length){
            console.log('sth wrong with ', nodeAndNodeIdx.node, nodeAndNodeIdx.nodeIdx);
            return null;
        }
        if(nodeAndNodeIdx.nodeIdx <= 0 ) {
            if(nodeAndNodeIdx.node.parent && nodeAndNodeIdx.node.parent.nodes && nodeAndNodeIdx.node.parent.nodes.length) {
                return {node:nodeAndNodeIdx.node.parent, nodeIdx:nodeAndNodeIdx.node.parent.nodes.length-1};
            } else {
                //console.log('NO PARENT ', nodeAndNodeIdx.node, nodeAndNodeIdx.nodeIdx);
                return null;
            }
        }
        return {node:nodeAndNodeIdx.node, nodeIdx:nodeAndNodeIdx.nodeIdx-1};
    },

    // returns {node:node, nodeIdx:nodeIdx} or null. goes to the end of all first sequences
    getlastNodeAndIdx: function(p_nodeAndNodeIdx) {
        let nodeAndNodeIdx = p_nodeAndNodeIdx
        if(!nodeAndNodeIdx ||!nodeAndNodeIdx.node || !nodeAndNodeIdx.node.nodes || !nodeAndNodeIdx.node.nodes.length || nodeAndNodeIdx.nodeIdx>=nodeAndNodeIdx.node.nodes.length){
            console.log('sth wrong with ', nodeAndNodeIdx.node, nodeAndNodeIdx.nodeIdx);
            return null;
        }
        while(nodeAndNodeIdx.sequences && nodeAndNodeIdx.sequences.length && nodeAndNodeIdx.sequences[0].nodes && nodeAndNodeIdx.sequences[0].nodes.length) {
            nodeAndNodeIdx = {node:nodeAndNodeIdx.sequences[0], nodeIdx:0}
        }

        return {node:nodeAndNodeIdx.node, nodeIdx:nodeAndNodeIdx.node.nodes.length-1};
    },

    isAcceptableMoveIdxOLD: function(node, nodeIdx) {
        let previousNode = this.getPreviousMove({node:node, nodeIdx:nodeIdx});
        let previousMove = previousNode ? previousNode.node.nodes[previousNode.nodeIdx]: null;
        return this.isAcceptableMove(node.nodes[nodeIdx],previousMove);
    },

    isAcceptableMoveIdx: function(node, nodeIdx) {
        let move = node.nodes[nodeIdx];
        if(!move || move.BM || move.UC) return false;
        if(move.DM || typeof move.B === "string" && move.B === '' || typeof move.W === "string" && move.W === '' ) return true; // joseki or pass always accepted
        let previousNode = this.getPreviousMove({node:node, nodeIdx:nodeIdx});
        if(previousNode) {
            //console.log('found prev move');            // if same move color as the previous move, we don t accept
            if(this.areMovesSameColor(move,previousNode.node.nodes[previousNode.nodeIdx])) return false;
            const margin = typeof move.B === "string" ? JOSEKI_MARGIN : -JOSEKI_MARGIN;
            if(typeof move.V !== "undefined") {
                let lastScoreNode = previousNode;
                while(lastScoreNode && typeof lastScoreNode.node.nodes[lastScoreNode.nodeIdx].V === "undefined") {
                    lastScoreNode = this.getPreviousMove(lastScoreNode);
                }
                if(lastScoreNode) {
                    let scoreThreshold = typeof lastScoreNode.node.nodes[lastScoreNode.nodeIdx].V !== "undefined" ? (parseFloat(lastScoreNode.node.nodes[lastScoreNode.nodeIdx].V) - margin) : null;
                    //console.log("is acceptable based on V?", move);
                    //console.log("?", lastScoreNode.node.nodes[lastScoreNode.nodeIdx].V);
                    //console.log("B<?", typeof move.B === "string", parseFloat(move.V), scoreThreshold);
                    //console.log("W>?", typeof move.W === "string");
                    if (typeof move.B === "string" && parseFloat(move.V) < scoreThreshold) { // black move
                        return false;
                    } else if (typeof move.W === "string" && parseFloat(move.V) > scoreThreshold) { // white move
                        return false;
                    }
                }
            }

        }
        return true;
    },

    areMovesSameColor: function(node, previousNode) {
        if(!node || !previousNode) return false;
        return typeof node.B === typeof previousNode.B &&
                               typeof node.W === typeof previousNode.W;
    },

    copyMetadata: function(target, source) {
        //console.log("copyMetadata ", target, source);
        if(!source || !target) return;
        if(typeof source.BM !== "undefined") {target.BM = source.BM;}
        if(typeof source.UC !== "undefined") {target.UC = source.UC;}
        if(typeof source.GW !== "undefined") {target.GW = source.GW;}
        if(typeof source.GB !== "undefined") {target.GB = source.GB;}
        if(typeof source.DM !== "undefined") {target.DM = source.DM;}
    },

    isSameMove: function(node1, node2) {
        //console.log('isSameMove ? ', node1, node2);
        if (node1 === node2) return true;
        if (!node1 || !node2) return false;
        if (node1.pass && node2.pass) return true;
        if (node1.pass || node2.pass) return false;
        if (typeof node1.B !== "undefined" && node1.B === node2.B) return true;
        if (typeof node1.W !== "undefined"  && node1.W === node2.W) return true;

        return false;
    },

    getNodeSeparatedSGF: function(currentNode) {
        let currentSGFVariation = [];
        this.getVariationSGF(currentNode.node, currentNode.nodeIdx, currentSGFVariation, true);
        const emptySGF = this.getEmptySGF();
        currentSGFVariation.filter(node => !!node).forEach(node => emptySGF.gameTrees[0].nodes.push(node));
        return sgf.generate(emptySGF);
    },


    getVariationSGF: function(node, nodeIdx, result, isKeepOnlyMove, isRemoveComment) {
        if(!node.parent) return;
        if(node.parent && node.parent.gameTrees) {
            for (let nodesIdx = 1 ; node.nodes && nodesIdx < node.nodes.length && nodesIdx <= nodeIdx ; nodesIdx++) {
                result.push(this.copyNode(node.nodes[nodesIdx], isKeepOnlyMove, isRemoveComment));
            }
            return;
        }
        this.getVariationSGF(node.parent, 10000, result, isKeepOnlyMove, isRemoveComment);
        for (let nodesIdx = 0 ; node.nodes && nodesIdx < node.nodes.length && nodesIdx <= nodeIdx ; nodesIdx++) {
            result.push(this.copyNode(node.nodes[nodesIdx], isKeepOnlyMove, isRemoveComment));
        }
    },

    copyNode: function(nodeToCopy, isKeepOnlyMove, isRemoveComment) {
        let copiedNode;
        if(typeof nodeToCopy.B === "undefined" && typeof nodeToCopy.W === "undefined") return null;
        if (isKeepOnlyMove) {
            if(typeof nodeToCopy.B !== "undefined") {
                return {B:nodeToCopy.B};
            } else if(typeof nodeToCopy.W !== "undefined") {
                return {W:nodeToCopy.W};
            }
        } else {
            copiedNode = JSON.parse(JSON.stringify(nodeToCopy));
            /*if (isRemoveComment) {
                delete copiedNode.C;
            }*/
        }
        return copiedNode;
    },

    getCurrentTransform: function(collection, game) {
        let sgfPosition = collection.gameTrees[0];
        let availableTransforms = this.getAllPossibleTransform();
        let currentSelectedTransform = availableTransforms[0];
        let nodeIdx=0;
        for (let moveIdx = 0 ; moveIdx < 4 && moveIdx < game._moves.length && availableTransforms && availableTransforms.length ; moveIdx++) {
            let oneMove =  game._moves[moveIdx];
            let newsgfPosition = this.isInSequence(game, oneMove, nodeIdx+1, sgfPosition, availableTransforms);
            if(newsgfPosition) {
                if(newsgfPosition === sgfPosition) {
                    nodeIdx ++; // sgfPosition.nodes[] is the one way street that we have to follow before reaching the sequences
                } else {
                    nodeIdx = 0; // sgfPosition.nodes[] was completed, so we continue with the sgfPosition.sequences (that iss newsgfPosition)
                    sgfPosition = newsgfPosition;
                }
                currentSelectedTransform = availableTransforms && availableTransforms.length ? availableTransforms[0] : currentSelectedTransform;
            }
            //console.log('getVariationSGF currentSelectedTransform : ', currentSelectedTransform);
            //console.log('getVariationSGF transforms : ', availableTransforms && availableTransforms.length);
        }

        return currentSelectedTransform;
    },

        // is oneMove one of the allowed children of gameTreeSequenceNode
        // if so, returns the matching sequences.X object
    isInSequence : function(game, oneMove, nodeIdx, gameTreeSequenceNode, availableTransforms, isIgnoreErrors) {
        if(nodeIdx< gameTreeSequenceNode.nodes.length) {
            const oneChildMoves = gameTreeSequenceNode.nodes.
                filter( (childNode, sequenceIdx) => sequenceIdx === nodeIdx). // we only consider the "nodeIdx" move of the nodes
                filter(childNode => typeof (oneMove.color === "black" ? childNode.B : childNode.W) !== "undefined").
                filter(childNode => !oneMove.pass || (oneMove.color === "black" ? childNode.B : childNode.W) === "").
                filter(childNode => oneMove.pass || this.getPossibleTransforms(
                    this.sgfCoordToPoint(oneMove.color === "black" ? childNode.B : childNode.W) ,
                    {y:oneMove.playedPoint.y, x:oneMove.playedPoint.x},
                    availableTransforms));

            if(oneChildMoves && oneChildMoves.length && (isIgnoreErrors || this.isAcceptableMoveIdx(gameTreeSequenceNode, nodeIdx))) {
                if(!oneMove.pass) {
                    let childNode = oneChildMoves[0];
                    let newAvailableTransforms = this.getPossibleTransforms(
                         this.sgfCoordToPoint(oneMove.color === "black" ? childNode.B : childNode.W) ,
                         {y:oneMove.playedPoint.y, x:oneMove.playedPoint.x},
                         availableTransforms);
                    let idx = availableTransforms.length;
                    while (idx--) {
                        if (newAvailableTransforms.indexOf(availableTransforms[idx]) <0) {
                            availableTransforms.splice(idx, 1);
                        }
                    }
                }
                return gameTreeSequenceNode; // in sequence according to gameTreeSequenceNode.nodes
            } else {
                return false; // not in sequence
            }
        }

        for (let sequencesIdx = 0 ; gameTreeSequenceNode.sequences && sequencesIdx < gameTreeSequenceNode.sequences.length ; sequencesIdx++) {
            let oneChild = gameTreeSequenceNode.sequences[sequencesIdx];
            const oneChildMoves = oneChild.nodes && oneChild.nodes.
                filter( (childNode, sequenceIdx) => sequenceIdx === 0). // we only consider the first move of the sequence
                filter(childNode => typeof (oneMove.color === "black" ? childNode.B : childNode.W) !== "undefined").
                filter(childNode => !oneMove.pass || (oneMove.color === "black" ? childNode.B : childNode.W) === "").
                filter(childNode => oneMove.pass || this.getPossibleTransforms(
                     this.sgfCoordToPoint(oneMove.color === "black" ? childNode.B : childNode.W) ,
                     {y:oneMove.playedPoint.y, x:oneMove.playedPoint.x},
                     availableTransforms));

            if(oneChildMoves && oneChildMoves.length && (isIgnoreErrors || this.isAcceptableMoveIdx(oneChild, 0))) {
                if(!oneMove.pass) {
                    let childNode = oneChildMoves [0];
                    let newAvailableTransforms = this.getPossibleTransforms(
                         this.sgfCoordToPoint(oneMove.color === "black" ? childNode.B : childNode.W) ,
                         {y:oneMove.playedPoint.y, x:oneMove.playedPoint.x},
                         availableTransforms);
                    let idx = availableTransforms.length;
                    while (idx--) {
                        if (newAvailableTransforms.indexOf(availableTransforms[idx]) <0) {
                            availableTransforms.splice(idx, 1);
                        }
                    }
                }
                return oneChild;// in sequence according to sequences.
            }
        }
        return false;
    },

    string2Bin: function(str) {
      var result = [];
      for (var i = 0; i < str.length; i++) {
        result.push(str.charCodeAt(i));
      }
      return result;
    },

    bin2String: function(array) {
        var result = "";
        for (var arrayIdx = 0; arrayIdx < array.length; arrayIdx++) {
            result += String.fromCharCode(array[arrayIdx]);
        }
        return result;
    },

    replacer: function(key, value) {
        if(value instanceof Map) {
            return {
                dataType: 'Map',
                value: Array.from(value.entries()), // or with spread: value: [...value]
            };
        } else {
            return value;
        }
    },

    reviver: function(key, value) {
        if(typeof value === 'object' && value !== null) {
            if (value.dataType === 'Map') {
                return new Map(value.value);
            }
        }
        return value;
    },

    deepStringify: function(object) {
        return JSON.stringify(object, this.replacer);
    },

    deepParse: function(str) {
        return JSON.parse(str, this.reviver);
    },

    cleanPassForShow: function(node) {
        let allNodeIdx = 0;
        while(node.nodes.length >1 && allNodeIdx <node.nodes.length) {
                // move is PASS
            if(node.nodes[allNodeIdx].C && node.nodes[allNodeIdx].C.indexOf('PASS to show continuation') >=0) {
                const lengthBefore = node.nodes.length
                node.nodes.splice(allNodeIdx, 1);
                //console.log('cleanPassForShow removed! '+lengthBefore +'->'+ node.nodes.length);
            } else {
                allNodeIdx++;
            }
        }

        if(node.nodes.length === 1 && node.nodes[0].C && node.nodes[0].C.indexOf('PASS to show continuation') >=0) {
            console.log('cleanPassForShow could not remove !', this.getNodeSeparatedSGF({node:node, nodeIdx:0}));
        }
        for(let seqIdx = 0 ; node.sequences && seqIdx < node.sequences.length;seqIdx++) {
            this.cleanPassForShow(node.sequences[seqIdx]);
        }
    },

    // check for several moves in a row by the same player
    // adds opponent PASS between them (when it is not a handicap move)
    // returns a gameTree
    cleanSGF: function(originalSGFOrgameTree) {
        // make a copy of the original gametree
        const originalSGFString = typeof originalSGFOrgameTree === "string" ? originalSGFOrgameTree : sgf.generate(originalSGFOrgameTree);
        let resultTree = sgf.parse(originalSGFString);
        this.cleanKatrainNode(resultTree.gameTrees[0].nodes[0]);
        this.cleanSGFBranch(resultTree.gameTrees[0], 1, resultTree.gameTrees[0].nodes[0], 1, 1)
        return resultTree;
    },

    cleanSGFBranch: function(node, pNodeIdx, lastMoveNode, moveNumberIfHandicap, moveNumber) {
        let nodeIdx = pNodeIdx;

        //look for pass+pass+move
        let allNodeIdx = 0;
        while(nodeIdx < node.nodes.length && node.nodes.length >1 && allNodeIdx <node.nodes.length) {
            if(!node.nodes[allNodeIdx].B && !node.nodes[allNodeIdx].W) {
                // move is PASS
                if(node.nodes[allNodeIdx].C === 'PASS to show continuation') {
                    node.nodes.splice(allNodeIdx, 1);
                    if(allNodeIdx <nodeIdx) {
                        nodeIdx--;
                    }
                } else {
                    allNodeIdx++;
                }
            } else {
                allNodeIdx++;
            }
        }

        let isHandicap = moveNumberIfHandicap;
        if(nodeIdx < node.nodes.length) {

            // next move is in nodes
            //this.isTenukiAsD4({node:node, nodeIdx:nodeIdx}, moveNumber);
            //this.is17N16({node:node, nodeIdx:nodeIdx}, moveNumber);
            if(node.nodes[nodeIdx].AW || node.nodes[nodeIdx].AB) {
                this.deleteVariation(node,nodeIdx);
                return;
            }
            if(this.areMovesSameColor(node.nodes[nodeIdx],lastMoveNode)) {
                if(isHandicap) {
                    isHandicap ++;
                } else {
                    // add a PASS from the opponent
                    this.addPASSBefore(node, nodeIdx, lastMoveNode);
                    // nodeIdx++;
                }
            } else {
                isHandicap = 0;
            }
            this.cleanKatrainNode(node.nodes[nodeIdx]);
            this.cleanSGFBranch(node, nodeIdx+1, node.nodes[nodeIdx], isHandicap, moveNumber+1);
            return;
        }
        const originalIsHandicap = isHandicap;
        // next move is in sequences
        // keep track on same color move indexes
        const sameColorSequences = [];
        let passSequenceIdx = -1;
        for (let sequencesIdx = 0 ; node.sequences && sequencesIdx < node.sequences.length ; sequencesIdx++) {
            isHandicap = originalIsHandicap;
            let oneChild = node.sequences[sequencesIdx];
            //this.is14O16({node:oneChild, nodeIdx:0}, moveNumber);
            //this.isTenukiAsD4({node:oneChild, nodeIdx:0}, moveNumber);
            //this.is17N16({node:oneChild, nodeIdx:0}, moveNumber);
            if(oneChild.nodes[0].AW || oneChild.nodes[0].AB) {
                this.deleteVariation(oneChild,0);
                sequencesIdx--;
                continue;
            } else if(this.areMovesSameColor(oneChild.nodes[0],lastMoveNode)) {
                if(isHandicap) {
                    isHandicap ++;
                } else {
                    // add a PASS from the opponent as first move of the sequence
                    //this.addPASSBefore(oneChild, 0, lastMoveNode);
                    // add a PASS from the opponent as last .nodes
                    //this.addPASSBefore(node, nodeIdx, lastMoveNode);
                    sameColorSequences.push(sequencesIdx);
                    continue;
                }
            } else {
                if(!oneChild.nodes[0].B && !oneChild.nodes[0].W && sequencesIdx <0) { // is pass
                    passSequenceIdx = sequencesIdx;
                }
                isHandicap = 0;
            }
            this.cleanKatrainNode(oneChild.nodes[0]);
            this.cleanSGFBranch(oneChild, 1, oneChild.nodes[0], isHandicap, moveNumber+1);
            if(passSequenceIdx>=0 && passSequenceIdx < node.sequences.length && (node.sequences[passSequenceIdx].nodes[0].B || node.sequences[passSequenceIdx].nodes[0].W)) {
                passSequenceIdx = -1;
            }
        }

        if(sameColorSequences.length) {
            if (passSequenceIdx < 0) {
                // create a pass sequence
                let addedMove = {
                    nodes: [typeof lastMoveNode.W !== "undefined" ? {
                            B: '',
                            C: 'PASS to show continuationz',
                            UC: 1
                        } : {W: '', C: 'PASS to show continuation', UC: 1}
                    ],
                    parent :node,
                    sequences:[]
                };
                node.sequences.push(addedMove);
                passSequenceIdx = node.sequences.length - 1;
            } else {
                // there was already a pass sequence
                // make it one move long, and move the main variation (after pass) from nodes to sequences
                node.sequences[passSequenceIdx].sequences.push(
                    {
                        nodes:node.sequences[passSequenceIdx].nodes.splice(1, node.sequences[passSequenceIdx].nodes.length-1),
                        parent:node.sequences[passSequenceIdx],
                        sequences:node.sequences[passSequenceIdx].sequences
                    });
            }
            if (!node.sequences[passSequenceIdx].sequences) {
                node.sequences[passSequenceIdx].sequences = [];
            }
            // move all sameColorSequences to passSequenceIdx.sequences
            for (let sequencesIdx2 = sameColorSequences.length - 1; sequencesIdx2 >= 0; sequencesIdx2--) {
                if(sameColorSequences.length>1 || node.sequences[passSequenceIdx].sequences.length) {
                    node.sequences[passSequenceIdx].sequences.push(node.sequences[sameColorSequences[sequencesIdx2]]);
                } else {
                    // add the sequence straight after the pass, in nodes
                    node.sequences[passSequenceIdx].nodes.splice(1,0,...node.sequences[sameColorSequences[sequencesIdx2]].nodes.splice(1, node.sequences[sameColorSequences[sequencesIdx2]].nodes.length-1));
                }
                node.sequences.splice(sameColorSequences[sequencesIdx2],1);
                if(sameColorSequences[sequencesIdx2] < passSequenceIdx) {
                    passSequenceIdx--;
                }
            }
            let oneChild = node.sequences[passSequenceIdx];
            this.cleanSGFBranch(oneChild, 1, oneChild.nodes[0], isHandicap, moveNumber+1);
        }
    },

    addPASSBefore: function(node, nodeIdx, lastMoveNode) {
        //console.log('addPASSBefore '+nodeIdx, lastMoveNode);
        // make a PASS that is a UC (unclear) move, so that the branch is not explored as a continuation
        // the reasons is that those double moves can have different purpose, like to show later continuations (not supposed to happen NOW)
        // we could find a different way/metadata to differentiate those variations
        let addedMove = typeof lastMoveNode.W !== "undefined" ? {B:'', C:'PASS to show continuations', UC:1} : {W:'', C:'PASS to show continuation', UC:1};

        node.nodes.splice(nodeIdx, 0, addedMove); // add move at index nodeIdx, deleting 0 nodes
    },

    deleteVariation: function(node, nodeIdx) {
        console.log('deleteVariation '+nodeIdx);
        if(nodeIdx > 0){
            // delete this node and the following ones from .nodes
            node.nodes.splice(nodeIdx, node.nodes.length-nodeIdx);
            // delete .sequences
            delete node.sequences;
        } else {
            // delete sequence from parent
            let seqIdx = node.parent.sequences.findIndex(oneSeq => oneSeq === node);
            node.parent.sequences.splice(seqIdx,1);
        }
    },

    cleanKatrainNode: function(node) {
        /*if (node.KT)
            delete node.KT;*/

        if (node.C) {
            const katrainCommentStart = "Move";
            const katrainScoreStart = "Score: ";
            const katrainCommentEnd = "​";
            const katrainCommentEnd2 = "";
            //const katrainCommentEnd3 = "¤";
            const katrainCommentEnd3 = "¤";

            const katrainCommentStartIdx = node.C.indexOf(katrainCommentStart);
            const katrainScoreStartIdx = node.C.indexOf(katrainScoreStart);
            let katrainCommentEndIdx = node.C.lastIndexOf(katrainCommentEnd);
            let katrainCommentEnd2Idx = node.C.lastIndexOf(katrainCommentEnd2);
            let katrainCommentEnd3Idx = node.C.lastIndexOf(katrainCommentEnd3);
            //console.log('node has a comment ',katrainCommentStartIdx,katrainScoreStartIdx,katrainCommentEndIdx);
            //console.log('node has a comment ',(katrainCommentStartIdx >=0));
            //console.log('node has a comment ',(katrainScoreStartIdx >katrainCommentStartIdx));
            //console.log('node has a comment ',(katrainCommentEndIdx >katrainScoreStartIdx));
            //console.log('endings ', katrainCommentEndIdx, katrainCommentEnd2Idx, katrainCommentEnd3Idx);
            if (katrainCommentStartIdx >= 0 &&
                (katrainCommentEndIdx > katrainCommentStartIdx ||katrainCommentEnd2Idx > katrainCommentStartIdx ||katrainCommentEnd3Idx > katrainCommentStartIdx)) {
                // "Score: W+1.2\n"
                let endMaxIdx = Math.max(katrainCommentEndIdx,katrainCommentEnd2Idx,katrainCommentEnd3Idx);
                if(katrainScoreStartIdx > katrainCommentStartIdx && endMaxIdx > katrainScoreStartIdx) {
                    let scoreString = node.C.slice(katrainScoreStartIdx + katrainScoreStart.length, endMaxIdx);
                    scoreString = scoreString.slice(0, scoreString.indexOf("\n"));
                    //('scoreString #'+scoreString+'#');
                    let multiplier = 1;
                    if (0 === scoreString.indexOf("W")) multiplier = -1;
                    node.V = multiplier * parseFloat(scoreString.slice(1));
                }
                let newlineIdx = node.C.slice(endMaxIdx).indexOf("\n");
                if (newlineIdx >= 0 && newlineIdx < 4) {
                    endMaxIdx += newlineIdx;
                }

                node.C = node.C.slice(0, katrainCommentStartIdx) + node.C.slice(endMaxIdx + 1);
                //console.log('node.C #'+node.C+'#');
            }/* else if (katrainCommentStartIdx >= 0) {
                console.log('couldn t parse #'+node.C+'#', node);
            }*/

        }
        //console.log('cleanKatrainNode FINISHED');

    },

    download: function(filename, text) {
      var element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
      element.setAttribute('download', filename);

      element.style.display = 'none';
      document.body.appendChild(element);

      element.click();

      document.body.removeChild(element);
    },

    // Start file download.
    //download("hello.txt","This is the content of my file :)");


    // everything from addedTree that is not already defined in masterTree will be added to masterTree
    merge: function(masterTree, addedTree, masterTreeNodeNextMoveIdx, addedTreeNodeNextMoveIdx) {
        //console.log('START merge ',masterTree, addedTree, masterTreeNodeNextMoveIdx, addedTreeNodeNextMoveIdx);

        const isMasterNextMoveInMasterNodes = masterTree && masterTree.nodes && masterTree.nodes.length && masterTree.nodes.length > masterTreeNodeNextMoveIdx;

        if(!addedTree || !addedTree.nodes || !addedTree.nodes.length) return;
        //console.log('the next node from addedTree is in nodes?  ', (addedTree && addedTree.nodes),')');

        // if the next node from addedTree is in nodes
        if(addedTree.nodes.length> addedTreeNodeNextMoveIdx) {
            //console.log('debug merge 10'); //OK
            //console.log('the next node from addedTree is in nodes (',addedTreeNodeNextMoveIdx,'/',addedTree.nodes.length-1,')');
            // look for this addedTree node in the masterTree next node
            if(isMasterNextMoveInMasterNodes) {
                //console.log('debug merge 100'); // OK
                //console.log('look for this addedTree node in the masterTree next node');
                if(this.isSameMove(masterTree.nodes[masterTreeNodeNextMoveIdx], addedTree.nodes[addedTreeNodeNextMoveIdx])) {
                    //console.log('debug merge 1000 ',addedTree); // OK
                    // SGF1
                    // if master has this addedTree node as the next node
                    //console.log('isSameMove(masterTree.nodes[masterTreeNodeNextMoveIdx], addedTree.nodes[addedTreeNodeNextMoveIdx]', masterTree.nodes[masterTreeNodeNextMoveIdx], addedTree.nodes[addedTreeNodeNextMoveIdx]);
                    this.copyMetadata(masterTree.nodes[masterTreeNodeNextMoveIdx], addedTree.nodes[addedTreeNodeNextMoveIdx]);
                    this.merge(masterTree, addedTree, masterTreeNodeNextMoveIdx+1, addedTreeNodeNextMoveIdx+1);
                    return;
                } else {
                    //console.log('debug merge 1001'); // OK
                    // SGF1
                    //console.log('nodes moves differ ', masterTree.nodes[masterTreeNodeNextMoveIdx], addedTree.nodes[addedTreeNodeNextMoveIdx]);
                    // nodes moves differ
                    // both addedTree node and master node become master sequences two options
                    // save master.sequences to tmp
                    let seqTMP = masterTree.sequences;
                    masterTree.sequences = [];
                    // master remaining nodes -> master.sequences[0]
                    // seqTMP -> master.sequences[0].sequences
                    masterTree.sequences.push({
                        nodes:masterTree.nodes.slice(masterTreeNodeNextMoveIdx),
                        parent:masterTree,
                        sequences:seqTMP
                    });

                    // addedTree remaining nodes -> master.sequences[1]
                    // addedTree.sequences -> master.sequences[1].sequences
                    masterTree.sequences.push({
                        nodes:addedTree.nodes.slice(addedTreeNodeNextMoveIdx),
                        parent:masterTree,
                        sequences:addedTree.sequences
                    });

                    masterTree.nodes = masterTree.nodes.slice(0,masterTreeNodeNextMoveIdx);
                    // TODO check all parents
                    return;
                }
            } else if (masterTree.sequences && masterTree.sequences.length) {
                //console.log('debug merge 101 ', masterTree.sequences, addedTree.nodes[addedTreeNodeNextMoveIdx]); // OK
                // next master move is in master.sequences

                // look in master.sequences if one corresponds
                const matchingMasterSeq =  masterTree.sequences.find( masterSeq => this.isSameMove(masterSeq.nodes[0], addedTree.nodes[addedTreeNodeNextMoveIdx]));
                //console.log('debug merge 101 found? ', matchingMasterSeq);

                if(matchingMasterSeq) {
                    //console.log('debug merge 1010'); // OK
                    // SGF6
                    // if one corresponds, merge from index 0 if this master.sequences[matchingMoveIdx]
                    this.copyMetadata(matchingMasterSeq.nodes[0], addedTree.nodes[addedTreeNodeNextMoveIdx]);
                    this.merge(matchingMasterSeq, addedTree, 1, addedTreeNodeNextMoveIdx+1);
                    return;
                } else {
                    //console.log('debug merge 1011'); // OK
                    // SGF2
                    // if no move corresponds, this addedTree.nodes[addedTreeNodeNextMoveIdx] is a new sequence for master.sequences
                    masterTree.sequences.push({
                        nodes:addedTree.nodes.slice(addedTreeNodeNextMoveIdx ),
                        parent:masterTree.sequences[0].parent,
                        sequences:addedTree.sequences
                    });
                    // TODO check all parents
                }
                return;
            } else {
                //console.log('debug merge 102'); // OK
                // SGF5
                // no move in master
                // add all remaining addedTree.nodes at the end of master.nodes
                 masterTree.nodes.push(...addedTree.nodes.slice(addedTreeNodeNextMoveIdx ));
                // addedTree.sequences -> master.sequences
                 masterTree.sequences = addedTree.sequences;
                // TODO check all parents
                return;
            }

        } else if(addedTree.sequences && addedTree.sequences.length){
            //console.log('debug merge 11'); // OK
            // if the next node from addedTree is in sequences
            if(isMasterNextMoveInMasterNodes) {
                //console.log('debug merge 110'); //OK
                // SGF3
                const matchingAddedTreeSeqIdx = addedTree.sequences.findIndex(
                    oneAddedTreeSeq => this.isSameMove(masterTree.nodes[masterTreeNodeNextMoveIdx], oneAddedTreeSeq.nodes[0]));
                let seqTMP = masterTree.sequences;
                addedTree.sequences.push({
                    nodes:masterTree.nodes.slice(masterTreeNodeNextMoveIdx),
                    parent:masterTree.nodes[masterTreeNodeNextMoveIdx].parent,
                    sequences:seqTMP
                });

                masterTree.sequences = addedTree.sequences;
                masterTree.nodes = masterTree.nodes.slice(0,masterTreeNodeNextMoveIdx);

                if (matchingAddedTreeSeqIdx>=0) {
                    // console.log('debug merge 1100'); // OK
                    // SGF4
                    // if addedTree.sequences contains next master move
                    masterTree.sequences.splice(matchingAddedTreeSeqIdx,1);
                    // -> call recursively merge on those identical sequence nodes
                    this.copyMetadata(masterTree.sequences[addedTree.sequences.length-1].nodes[0],masterTree.sequences[matchingMasterSeqIdx].nodes[0]);
                    this.merge(masterTree.sequences[addedTree.sequences.length-1],masterTree.sequences[matchingMasterSeqIdx], 1, 1);
                }
                // TODO check all parents
                // and that's it, no need to merge the rest of this addedTree !!
                return;
            }
            //console.log('debug merge 111'); // Ok
            // both master and addedTree have their next move in .sequences
            for(let addedTreeSeqIdx = 0; addedTreeSeqIdx < addedTree.sequences.length ; addedTreeSeqIdx ++ ) {
                const oneAddedTreeSeq = addedTree.sequences[addedTreeSeqIdx];
                const matchingMasterSeq = masterTree.sequences && masterTree.sequences.length && masterTree.sequences.find(
                        oneMasterSeq => this.isSameMove(oneMasterSeq.nodes[0], oneAddedTreeSeq.nodes[0]));
                if (matchingMasterSeq) {
                    // if master has this sequence in its sequences
                    // -> call recursively merge on those identical sequence nodes
                    //console.log('debug merge 1110 ',matchingMasterSeq); //OK
                    // SGF7
                    this.copyMetadata(matchingMasterSeq.nodes[0],oneAddedTreeSeq.nodes[0]);
                    this.merge(matchingMasterSeq, oneAddedTreeSeq, 1, 1);
                } else {
                    //console.log('debug merge 1111'); // OK
                    // SGF7
                    if( !masterTree.sequences || !masterTree.sequences.length) {
                        masterTree.sequences = [];
                    }
                    masterTree.sequences.push(oneAddedTreeSeq);
                    // TODO check all parents
                    oneAddedTreeSeq.parent = masterTree;
                }
            }
        }
    },

    getDeltaCMD: function (previousSGF, targetSGF ) {
        const previousSGFgame = previousSGF ? sgf.parse(previousSGF) : null;
        const targetSGFgame = targetSGF ? sgf.parse(targetSGF) : this.getEmptySGF();

        let differencefound = !previousSGFgame;
        let differenceFromBeginning = !previousSGFgame;
        let resultCMD = differenceFromBeginning ? "clear_board\n" : "";
        let moveNumber = 0;

        let previousnodeIdx= 0;
        let previousnodeParent = previousSGFgame && previousSGFgame.gameTrees[0]
        let previousnodes = previousnodeParent && previousnodeParent.nodes;
        let previouslastNode = null;

        let targetnodeIdx= 0;
        let targetnodeParent = targetSGFgame.gameTrees[0]
        let targetnodes = targetnodeParent.nodes;
        let targetlastNode = null;

        while (!differenceFromBeginning && previousnodeIdx < previousnodes.length && targetnodeIdx < targetnodes.length) {
            //console.log("nodes.length ",nodes.length, nodes)
            previouslastNode = previousnodes[previousnodeIdx];
            targetlastNode = targetnodes[targetnodeIdx];
            if( !differencefound && this.SGFToHuman(previouslastNode) === this.SGFToHuman(targetlastNode)){
                //console.log(this.SGFToHuman(previouslastNode)," == ",this.SGFToHuman(targetlastNode))
                // nothing to do
            } else {
                differencefound = true;
                if(moveNumber <= 1) {
                    //console.log("difference from beginning1")
                    differenceFromBeginning = true;
                    resultCMD = "clear_board\n";
                } else {
                    //console.log("difference from move ",moveNumber)
                }
                if(!differenceFromBeginning) {
                    //console.log("undo")
                    resultCMD = "undo\n"+resultCMD;
                } else {
                    break;
                }

                resultCMD += this.SGFToHuman(targetlastNode);
            }
            moveNumber++;
            previousnodeIdx++;
            targetnodeIdx++;
            if(previousnodeIdx >= previousnodes.length && previousnodeParent.sequences && previousnodeParent.sequences.length && previousnodeParent.sequences[0].nodes) {
                previousnodeIdx = 0;
                previousnodeParent = previousnodeParent.sequences[0]
                previousnodes = previousnodeParent.nodes;
            }
            if(targetnodeIdx >= targetnodes.length && targetnodeParent.sequences && targetnodeParent.sequences.length && targetnodeParent.sequences[0].nodes) {
                targetnodeIdx = 0;
                targetnodeParent = targetnodeParent.sequences[0]
                targetnodes = targetnodeParent.nodes;
            }

        }

        while (previousnodes && previousnodeIdx < previousnodes.length && !differenceFromBeginning) {
            //console.log("nodes.length ",nodes.length, nodes)
            //console.log("loop2")
            previouslastNode = previousnodes[previousnodeIdx];

            resultCMD = "undo\n"+resultCMD;

            moveNumber++;
            previousnodeIdx++;
            if(previousnodeIdx >= previousnodes.length && previousnodeParent.sequences && previousnodeParent.sequences.length && previousnodeParent.sequences[0].nodes) {
                previousnodeIdx = 0;
                previousnodeParent = previousnodeParent.sequences[0]
                previousnodes = previousnodeParent.nodes;
            }

        }

        while (targetnodeIdx < targetnodes.length) {
            //console.log("nodes.length ",nodes.length, nodes)
            //console.log("loop3")
            targetlastNode = targetnodes[targetnodeIdx];

            resultCMD += this.SGFToHuman(targetlastNode);

            moveNumber++;
            targetnodeIdx++;
            if(targetnodeIdx >= targetnodes.length && targetnodeParent.sequences && targetnodeParent.sequences.length && targetnodeParent.sequences[0].nodes) {
                targetnodeIdx = 0;
                targetnodeParent = targetnodeParent.sequences[0]
                targetnodes = targetnodeParent.nodes;
            }

        }
        return resultCMD;
    },

    getGTPCommand: function(SGFString, currentMove) {
        let currentMoveNumber = 10000;
        if(currentMove) {
            try{
                currentMoveNumber = parseInt(currentMove.split(" ")[1]);
                //console.log("will limit to currentMoveNumber");
            } catch(e) {
                //console.log("could not parse move currentMoveNumber")
            }
        }
        const SGFgame = sgf.parse(SGFString);
        //let initCMD = "time_settings 0 5 1\nkomi 7.5\nboardsize 19\nclear_board\n";
        let initCMD = "";
        let nodeIdx= 0;
        let nodeParent = SGFgame.gameTrees[0]
        let nodes = nodeParent.nodes;
        let lastNode = null;
        let cursorMoveNumber = 0;
        //console.log("game tree ",SGFgame.gameTrees[0])
        while (nodeIdx < nodes.length && cursorMoveNumber <= currentMoveNumber) {
            cursorMoveNumber++;
            //console.log("nodes.length ",nodes.length, nodes)
            lastNode = nodes[nodeIdx];
            initCMD += this.SGFToHuman(lastNode);
            nodeIdx++;
            if(nodeIdx >= nodes.length && nodeParent.sequences && nodeParent.sequences.length && nodeParent.sequences[0].nodes) {
                nodeIdx = 0;
                nodeParent = nodeParent.sequences[0]
                nodes = nodeParent.nodes;
            }

        }
        //console.log("genmove after ",cursorMoveNumber, typeof lastNode.W !== "undefined", lastNode)
        console.log("genmove after ",(initCMD+"kata-analyze "+((cursorMoveNumber<=1 || typeof lastNode.W !== "undefined")? "B" : "W" )))
        return initCMD+"kata-analyze "+((cursorMoveNumber<=1 || typeof lastNode.W !== "undefined")? "B" : "W" )+" 50\n";
    },


    addCMDtoSGF : function(SGF, gtpCMD) {
        let lastNodeAndIdx = this.getlastNodeAndIdx({node:SGF.gameTrees[0], nodeIdx:0})

    },

    isKeima : function(move, grid) {
        return this.isShape(move,this.keimaShapes, grid)

    },
    //"daidaigeima","ogeima", "keima", "sangenbiraki" (3-space jump), "nikentobi", "tobi", "hane", "cut", "crosscut", "nobi", "kosumi"
    // top left is the move
    // 3 = any stone color, even empty
    // 4 = any stone color, but NOT empty
    daidaigeimaShapes : [
        [
            [4,0,0,0,3],
            [3,0,0,0,4]
        ],
        [
            [4,3],
            [0,0],
            [0,0],
            [0,0],
            [3,4]
        ]
    ],
    ogeimaShapes : [
        [
            [4,0,0,3],
            [3,0,0,4]
        ],
        [
            [4,3],
            [0,0],
            [0,0],
            [3,4]
        ]
    ],
    keimaShapes : [
        [
            [4,0,3],
            [3,0,4]
        ],
        [
            [4,3],
            [0,0],
            [3,4]
        ]
    ],
    sangenbirakiShapes : [ //"sangenbiraki" (3-space jump)
        [
            [4,0,0,0,4]
        ],
        [
            [4],
            [0],
            [0],
            [0],
            [4]
        ]
    ],
    nikentobiShapes : [ // (2-space jump)
        [
            [4,0,0,4]
        ],
        [
            [4],
            [0],
            [0],
            [4]
        ]
    ],
    tobiShapes : [ // (1-space jump)
        [
            [4,0,4]
        ],
        [
            [4],
            [0],
            [4]
        ]
    ],
    /*nobiShapes : [ // (extension) // TODO color check
        [
            [4,4]
        ],
        [
            [4],
            [4]
        ]
    ],*/
    kosumiShapes : [ // diagonal
        [
            [4,0,3],
            [0,4,0],
            [3,0,3]
        ]
    ],

    isShape : function(move, shapes, grid) {

        for (let shapeIdx = 0; shapeIdx<shapes.length;shapeIdx++) {
            //console.log("shapeIdx:",shapeIdx);
            for (let invertI = 1; invertI>=-1;invertI = invertI-2) {
                for (let invertJ = 1; invertJ>=-1;invertJ = invertJ-2) {
                    let canBe = true;
                    for (let i = 0; i < shapes[shapeIdx].length && canBe; i++) {
                        for (let j = 0; j < shapes[shapeIdx][i].length && canBe; j++) {
                            if (i === 0 && j === 0) continue;
                            let testx = move.x + i*invertI;
                            let testy = move.y + j*invertJ;
                            //console.log("i,j:", i, j, shapes[shapeIdx][i][j], " =?= ", testx >= 0 && testx < 19 && testy >= 0 && testy < 19 && grid[testx][testy]);
                            canBe = canBe && testx >= 0 && testx < 19 && testy >= 0 && testy < 19 && (
                                shapes[shapeIdx][i][j] === grid[testx][testy] ||
                                shapes[shapeIdx][i][j] === 4 && grid[testx][testy] > 0 ||
                                shapes[shapeIdx][i][j] === 3
                            )
                        }
                    }
                    if (canBe) return true;
                }
            }
        }

    },

    getGrid : function(SGF) {
        let grid = [ // 0 = no stone, 1= black, 2= white. we don't care about captures and liberties
            [0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0],

            [0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0]
        ];

        let nodeIdx= 0;
        let nodeParent = SGF.gameTrees[0]
        let nodes = nodeParent.nodes;
        let lastNode = null;
        let cursorMoveNumber = 0;
        //console.log("game tree ",SGFgame.gameTrees[0])
        while (nodeIdx < nodes.length) {
            cursorMoveNumber++;
            //console.log("nodes.length ",nodes.length, nodes)
            lastNode = nodes[nodeIdx];
            const coords = this.sgfCoordToPoint(typeof lastNode.B === "undefined" ? lastNode.W : lastNode.B);
            if(coords && !coords.pass){
                grid[coords.x][coords.y] = typeof lastNode.B === "undefined" ? 2 : 1;
            }

            nodeIdx++;
            if(nodeIdx >= nodes.length && nodeParent.sequences && nodeParent.sequences.length && nodeParent.sequences[0].nodes) {
                nodeIdx = 0;
                nodeParent = nodeParent.sequences[0]
                nodes = nodeParent.nodes;
            }

        }
        return grid;
    },

    addMovetoSGF : function(p_nodeAndNodeIdx, move) {
        console.log("addMovetoSGF ", move)
        let SGFmove = this.humanToSgfCoord(move.split(" ").slice(-1)[0])
        p_nodeAndNodeIdx.node.nodes.push(
            move.toUpperCase().indexOf(" B ")>0 ? {
                B: SGFmove
            } : {W: SGFmove}
        )
    },

    addPasstoSGF : function(p_nodeAndNodeIdx, move) {
        //let lastMoveNode = p_nodeAndNodeIdx.node.nodes[p_nodeAndNodeIdx.nodeIdx]
        /*let addedMove = {
            nodes: [typeof lastMoveNode.W !== "undefined" ? {
                B: ''
            } : {W: ''}
            ],
            parent :node,
            sequences:[]
        };
        node.sequences.push(addedMove);*/
        p_nodeAndNodeIdx.node.nodes.push(
            move.toUpperCase().indexOf(" B ")>0 ? {
                B: ''
            } : {W: ''}
        )
    },

    savePositionsAndContinue : function(OGSPositions, joseki_id, emptySGF, current_node, req, res, isLast) {

        if(OGSPositions) {
            const OGSNode = OGSPositions.filter(oneOGSmove => oneOGSmove.placement !== "root" && oneOGSmove.category && (oneOGSmove.category === "IDEAL" || oneOGSmove.category === "GOOD" ));
            if(OGSNode.length>1) {
                if(!current_node.sequences) {
                    current_node.sequences = [];
                }
                OGSNode.forEach(oneOGSmove => {
                    var newNode = { nodes : [], parent:current_node, sequences:[]};
                    if(isLast) newNode.nodes.push(sgfutils.makeNodeFromOGS(oneOGSmove));
                    else this.suck(oneOGSmove.node_id, emptySGF, newNode, req, res);
                });
            } else if(OGSNode.length === 1){
                const oneOGSmove = OGSNode[0];
                var newNode = current_node;
                if(isLast) newNode.nodes.push(sgfutils.makeNodeFromOGS(oneOGSmove));
                else this.suck(oneOGSmove.node_id, emptySGF, newNode, req, res);
            }
        }
        if(isLast) {
            res.send(sgf.generate(emptySGF));
            return;
        }
    }

};
