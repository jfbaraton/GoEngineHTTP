// server.js
let express = require('express');
let bodyParser = require('body-parser');
let cors = require('cors');
let app = express();
let router = express.Router();
let sgf = require('smartgame');
let sgfutils  = require('./utils');
const {getGrid} = require("./utils");

let exec = require('child_process').exec;
let isEngineOn = false;
let isEngineStarting = false;
let currentRes = null;
const engineFullResponseHolder = [''];
let currentResTime = Date.now();
let child = null;
let currentSGF = null;
let currentGame = currentSGF ? sgf.parse(currentSGF) : sgfutils.getEmptySGF();
// C:\Users\yamak\.katrain\katago-v1.7.0-gpu-opencl-windows-x64.exe gtp -model C:\Users\yamak\.katrain\g170-b40c256x2-s5095420928-d1229425124.bin.gz -config C:\Users\yamak\.katrain\fast_analysis_config.cfg
//const engineStartCmd = 'C:\\Users\\yamak\\.katrain\\katago-v1.7.0-gpu-opencl-windows-x64.exe gtp -model C:\\Users\\yamak\\.katrain\\g170-b40c256x2-s5095420928-d1229425124.bin.gz -config C:\\Users\\yamak\\.katrain\\fast_analysis_config.cfg';
//const engineStartCmd = 'katago gtp -model /home/pi/katago/Katago/cpp/kata1-b18c384nbt-s8040575488-d3801933292.bin.gz -config /home/pi/katago/Katago/cpp/default_gtp.cfg';
//const engineStartCmd = '/home/pi/leelap0/leela-zero/build/leelaz --gtp --noponder -p 1 -t 1 -w /home/pi/leelap0/15b.gz';
const engineStartCmd = '/home/pi/leelap0/leela-zero/build/leelaz --gtp --noponder -t 1 -w /home/pi/leelap0/15b.gz';

const engineClearBoard = "time_settings 0 5 1\nkomi 7.5\nboardsize 19\nclear_board\n";
const kata_analyze_sample = "info move C3 visits 6 utility 1.04291 winrate 0.992245 scoreMean 14.4587 scoreStdev 16.1808 scoreLead 14.4587 scoreSelfplay 17.096 prior 0.0183468 lcb 0.97559 utilityLcb 0.996279 order 0 pv C3 Q4 R16 info move C17 visits 6 utility 1.04291 winrate 0.992245 scoreMean 14.4587 scoreStdev 16.1808 scoreLead 14.4587 scoreSelfplay 17.096 prior 0.0183468 lcb 0.97559 utilityLcb 0.996279 isSymmetryOf C3 order 1 pv C17 Q16 R4 info move R3 visits 6 utility 1.04291 winrate 0.992245 scoreMean 14.4587 scoreStdev 16.1808 scoreLead 14.4587 scoreSelfplay 17.096 prior 0.0183468 lcb 0.97559 utilityLcb 0.996279 isSymmetryOf C3 order 2 pv R3 D4 C16 info move R17 visits 6 utility 1.04291 winrate 0.992245 scoreMean 14.4587 scoreStdev 16.1808 scoreLead 14.4587 scoreSelfplay 17.096 prior 0.0183468 lcb 0.97559 utilityLcb 0.996279 isSymmetryOf C3 order 3 pv R17 D16 C4 info move D4 visits 6 utility 1.03122 winrate 0.992694 scoreMean 13.1039 scoreStdev 15.4155 scoreLead 13.1039 scoreSelfplay 15.9613 prior 0.0365862 lcb 0.965865 utilityLcb 0.956097 order 4 pv D4 Q16 Q4 info move D16 visits 6 utility 1.03122 winrate 0.992694 scoreMean 13.1039 scoreStdev 15.4155 scoreLead 13.1039 scoreSelfplay 15.9613 prior 0.0365862 lcb 0.965865 utilityLcb 0.956097 isSymmetryOf D4 order 5 pv D16 Q4 Q16 info move Q4 visits 6 utility 1.03122 winrate 0.992694 scoreMean 13.1039 scoreStdev 15.4155 scoreLead 13.1039 scoreSelfplay 15.9613 prior 0.0365862 lcb 0.965865 utilityLcb 0.956097 isSymmetryOf D4 order 6 pv Q4 D16 D4 info move Q16 visits 6 utility 1.03122 winrate 0.992694 scoreMean 13.1039 scoreStdev 15.4155 scoreLead 13.1039 scoreSelfplay 15.9613 prior 0.0365862 lcb 0.965865 utilityLcb 0.956097 isSymmetryOf D4 order 7 pv Q16 D4 D16 info move C4 visits 6 utility 1.03876 winrate 0.992369 scoreMean 13.9992 scoreStdev 16.0093 scoreLead 13.9992 scoreSelfplay 16.7473 prior 0.0403575 lcb 0.962421 utilityLcb 0.954908 order 8 pv C4 Q4 R16 info move C16 visits 6 utility 1.03876 winrate 0.992369 scoreMean 13.9992 scoreStdev 16.0093 scoreLead 13.9992 scoreSelfplay 16.7473 prior 0.0403575 lcb 0.962421 utilityLcb 0.954908 isSymmetryOf C4 order 9 pv C16 Q16 R4 info move R4 visits 6 utility 1.03876 winrate 0.992369 scoreMean 13.9992 scoreStdev 16.0093 scoreLead 13.9992 scoreSelfplay 16.7473 prior 0.0403575 lcb 0.962421 utilityLcb 0.954908 isSymmetryOf C4 order 10 pv R4 D4 C16 info move R16 visits 6 utility 1.03876 winrate 0.992369 scoreMean 13.9992 scoreStdev 16.0093 scoreLead 13.9992 scoreSelfplay 16.7473 prior 0.0403575 lcb 0.962421 utilityLcb 0.954908 isSymmetryOf C4 order 11 pv R16 D16 C4 info move Q17 visits 6 utility 1.03876 winrate 0.992369 scoreMean 13.9992 scoreStdev 16.0093 scoreLead 13.9992 scoreSelfplay 16.7473 prior 0.0403575 lcb 0.962421 utilityLcb 0.954908 isSymmetryOf C4 order 12 pv Q17 Q4 D3 info move D17 visits 6 utility 1.03876 winrate 0.992369 scoreMean 13.9992 scoreStdev 16.0093 scoreLead 13.9992 scoreSelfplay 16.7473 prior 0.0403575 lcb 0.962421 utilityLcb 0.954908 isSymmetryOf C4 order 13 pv D17 D4 Q3 info move Q3 visits 6 utility 1.03876 winrate 0.992369 scoreMean 13.9992 scoreStdev 16.0093 scoreLead 13.9992 scoreSelfplay 16.7473 prior 0.0403575 lcb 0.962421 utilityLcb 0.954908 isSymmetryOf C4 order 14 pv Q3 Q16 D17 info move D3 visits 6 utility 1.03876 winrate 0.992369 scoreMean 13.9992 scoreStdev 16.0093 scoreLead 13.9992 scoreSelfplay 16.7473 prior 0.0403575 lcb 0.962421 utilityLcb 0.954908 isSymmetryOf C4 order 15 pv D3 D16 Q17 info move D5 visits 6 utility 1.0397 winrate 0.992557 scoreMean 13.6523 scoreStdev 16.244 scoreLead 13.6523 scoreSelfplay 16.5357 prior 0.0145553 lcb 0.966084 utilityLcb 0.965578 order 16 pv D5 C3 E3 info move D15 visits 6 utility 1.0397 winrate 0.992557 scoreMean 13.6523 scoreStdev 16.244 scoreLead 13.6523 scoreSelfplay 16.5357 prior 0.0145553 lcb 0.966084 utilityLcb 0.965578 isSymmetryOf D5 order 17 pv D15 C17 E17 info move Q5 visits 6 utility 1.0397 winrate 0.992557 scoreMean 13.6523 scoreStdev 16.244 scoreLead 13.6523 scoreSelfplay 16.5357 prior 0.0145553 lcb 0.966084 utilityLcb 0.965578 isSymmetryOf D5 order 18 pv Q5 R3 P3 info move Q15 visits 6 utility 1.0397 winrate 0.992557 scoreMean 13.6523 scoreStdev 16.244 scoreLead 13.6523 scoreSelfplay 16.5357 prior 0.0145553 lcb 0.966084 utilityLcb 0.965578 isSymmetryOf D5 order 19 pv Q15 R17 P17 info move P16 visits 6 utility 1.0397 winrate 0.992557 scoreMean 13.6523 scoreStdev 16.244 scoreLead 13.6523 scoreSelfplay 16.5357 prior 0.0145553 lcb 0.966084 utilityLcb 0.965578 isSymmetryOf D5 order 20 pv P16 R17 R15 info move E16 visits 6 utility 1.0397 winrate 0.992557 scoreMean 13.6523 scoreStdev 16.244 scoreLead 13.6523 scoreSelfplay 16.5357 prior 0.0145553 lcb 0.966084 utilityLcb 0.965578 isSymmetryOf D5 order 21 pv E16 C17 C15 info move P4 visits 6 utility 1.0397 winrate 0.992557 scoreMean 13.6523 scoreStdev 16.244 scoreLead 13.6523 scoreSelfplay 16.5357 prior 0.0145553 lcb 0.966084 utilityLcb 0.965578 isSymmetryOf D5 order 22 pv P4 R3 R5 info move E4 visits 6 utility 1.0397 winrate 0.992557 scoreMean 13.6523 scoreStdev 16.244 scoreLead 13.6523 scoreSelfplay 16.5357 prior 0.0145553 lcb 0.966084 utilityLcb 0.965578 isSymmetryOf D5 order 23 pv E4 C3 C5 info move C5 visits 5 utility 1.03658 winrate 0.991834 scoreMean 14.022 scoreStdev 16.028 scoreLead 14.022 scoreSelfplay 16.5416 prior 0.0108768 lcb 0.950179 utilityLcb 0.919942 order 24 pv C5 Q4 Q16 info move C15 visits 5 utility 1.03658 winrate 0.991834 scoreMean 14.022 scoreStdev 16.028 scoreLead 14.022 scoreSelfplay 16.5416 prior 0.0108768 lcb 0.950179 utilityLcb 0.919942 isSymmetryOf C5 order 25 pv C15 Q16 Q4 info move R5 visits 5 utility 1.03658 winrate 0.991834 scoreMean 14.022 scoreStdev 16.028 scoreLead 14.022 scoreSelfplay 16.5416 prior 0.0108768 lcb 0.950179 utilityLcb 0.919942 isSymmetryOf C5 order 26 pv R5 D4 D16 info move R15 visits 5 utility 1.03658 winrate 0.991834 scoreMean 14.022 scoreStdev 16.028 scoreLead 14.022 scoreSelfplay 16.5416 prior 0.0108768 lcb 0.950179 utilityLcb 0.919942 isSymmetryOf C5 order 27 pv R15 D16 D4 info move P17 visits 5 utility 1.03658 winrate 0.991834 scoreMean 14.022 scoreStdev 16.028 scoreLead 14.022 scoreSelfplay 16.5416 prior 0.0108768 lcb 0.950179 utilityLcb 0.919942 isSymmetryOf C5 order 28 pv P17 Q4 D4 info move E17 visits 5 utility 1.03658 winrate 0.991834 scoreMean 14.022 scoreStdev 16.028 scoreLead 14.022 scoreSelfplay 16.5416 prior 0.0108768 lcb 0.950179 utilityLcb 0.919942 isSymmetryOf C5 order 29 pv E17 D4 Q4 info move P3 visits 5 utility 1.03658 winrate 0.991834 scoreMean 14.022 scoreStdev 16.028 scoreLead 14.022 scoreSelfplay 16.5416 prior 0.0108768 lcb 0.950179 utilityLcb 0.919942 isSymmetryOf C5 order 30 pv P3 Q16 D16 info move E3 visits 5 utility 1.03658 winrate 0.991834 scoreMean 14.022 scoreStdev 16.028 scoreLead 14.022 scoreSelfplay 16.5416 prior 0.0108768 lcb 0.950179 utilityLcb 0.919942 isSymmetryOf C5 order 31 pv E3 D16 Q16 info move C6 visits 5 utility 1.01588 winrate 0.987974 scoreMean 12.5585 scoreStdev 16.9021 scoreLead 12.5585 scoreSelfplay 15.3843 prior 0.00368594 lcb 0.919743 utilityLcb 0.824837 order 32 pv C6 C4 D4 D3 info move C14 visits 5 utility 1.01588 winrate 0.987974 scoreMean 12.5585 scoreStdev 16.9021 scoreLead 12.5585 scoreSelfplay 15.3843 prior 0.00368594 lcb 0.919743 utilityLcb 0.824837 isSymmetryOf C6 order 33 pv C14 C16 D16 D17 info move R6 visits 5 utility 1.01588 winrate 0.987974 scoreMean 12.5585 scoreStdev 16.9021 scoreLead 12.5585 scoreSelfplay 15.3843 prior 0.00368594 lcb 0.919743 utilityLcb 0.824837 isSymmetryOf C6 order 34 pv R6 R4 Q4 Q3 info move R14 visits 5 utility 1.01588 winrate 0.987974 scoreMean 12.5585 scoreStdev 16.9021 scoreLead 12.5585 scoreSelfplay 15.3843 prior 0.00368594 lcb 0.919743 utilityLcb 0.824837 isSymmetryOf C6 order 35 pv R14 R16 Q16 Q17 info move O17 visits 5 utility 1.01588 winrate 0.987974 scoreMean 12.5585 scoreStdev 16.9021 scoreLead 12.5585 scoreSelfplay 15.3843 prior 0.00368594 lcb 0.919743 utilityLcb 0.824837 isSymmetryOf C6 order 36 pv O17 Q17 Q16 R16 info move F17 visits 5 utility 1.01588 winrate 0.987974 scoreMean 12.5585 scoreStdev 16.9021 scoreLead 12.5585 scoreSelfplay 15.3843 prior 0.00368594 lcb 0.919743 utilityLcb 0.82483";

const sai_analyze_sample = "info move Q17 visits 1 winrate 5153 prior 4182 lcb 0 areas 5071 order 0 pv Q17\n"+
"info move Q17 visits 1 winrate 5153 prior 4182 lcb 0 areas 5071 order 0 pv Q17\n"+
"info move Q17 visits 1 winrate 5153 prior 4182 lcb 0 areas 5071 order 0 pv Q17\n"+
"info move Q17 visits 1 winrate 5153 prior 4182 lcb 0 areas 5071 order 0 pv Q17 info move Q16 visits 1 winrate 5146 prior 2277 lcb 0 areas 4862 order 1 pv Q16\n"+
"info move Q17 visits 1 winrate 5153 prior 4182 lcb 0 areas 5071 order 0 pv Q17 info move Q16 visits 1 winrate 5146 prior 2277 lcb 0 areas 4862 order 1 pv Q16\n"+
"info move Q17 visits 1 winrate 5153 prior 4182 lcb 0 areas 5071 order 0 pv Q17 info move Q16 visits 1 winrate 5146 prior 2277 lcb 0 areas 4862 order 1 pv Q16\n"+
"info move Q17 visits 2 winrate 5087 prior 4182 lcb 0 areas 4408 order 0 pv Q17 D4 info move Q16 visits 1 winrate 5146 prior 2277 lcb 0 areas 4862 order 1 pv Q16\n"+
"info move Q17 visits 2 winrate 5087 prior 4182 lcb 0 areas 4408 order 0 pv Q17 D4 info move Q16 visits 1 winrate 5146 prior 2277 lcb 0 areas 4862 order 1 pv Q16\n"+
"info move Q17 visits 2 winrate 5087 prior 4182 lcb 0 areas 4408 order 0 pv Q17 D4 info move Q16 visits 1 winrate 5146 prior 2277 lcb 0 areas 4862 order 1 pv Q16\n"+
"info move Q17 visits 2 winrate 5087 prior 4182 lcb 0 areas 4408 order 0 pv Q17 D4 info move Q16 visits 1 winrate 5146 prior 2277 lcb 0 areas 4862 order 1 pv Q16\n"+
"info move Q17 visits 3 winrate 5058 prior 4182 lcb 0 areas 3659 order 0 pv Q17 D3 info move Q16 visits 1 winrate 5146 prior 2277 lcb 0 areas 4862 order 1 pv Q16\n"+
"info move Q17 visits 3 winrate 5058 prior 4182 lcb 0 areas 3659 order 0 pv Q17 D3 info move Q16 visits 1 winrate 5146 prior 2277 lcb 0 areas 4862 order 1 pv Q16\n"+
"info move Q17 visits 3 winrate 5058 prior 4182 lcb 0 areas 3659 order 0 pv Q17 D3 info move Q16 visits 1 winrate 5146 prior 2277 lcb 0 areas 4862 order 1 pv Q16\n"+
"info move Q17 visits 3 winrate 5058 prior 4182 lcb 0 areas 3659 order 0 pv Q17 D3 info move Q16 visits 2 winrate 5087 prior 2277 lcb 0 areas 4268 order 1 pv Q16 C4\n"+
"info move Q17 visits 3 winrate 5058 prior 4182 lcb 0 areas 3659 order 0 pv Q17 D3 info move Q16 visits 2 winrate 5087 prior 2277 lcb 0 areas 4268 order 1 pv Q16 C4\n"+
"info move Q17 visits 3 winrate 5058 prior 4182 lcb 0 areas 3659 order 0 pv Q17 D3 info move Q16 visits 2 winrate 5087 prior 2277 lcb 0 areas 4268 order 1 pv Q16 C4\n"+
"info move Q17 visits 4 winrate 5047 prior 4182 lcb 2854 areas 3026 order 0 pv Q17 D3 info move Q16 visits 2 winrate 5087 prior 2277 lcb 0 areas 4268 order 1 pv Q16 C4\n"+
"info move Q17 visits 4 winrate 5047 prior 4182 lcb 2854 areas 3026 order 0 pv Q17 D3 info move Q16 visits 2 winrate 5087 prior 2277 lcb 0 areas 4268 order 1 pv Q16 C4\n"+
"info move Q17 visits 4 winrate 5047 prior 4182 lcb 2854 areas 3026 order 0 pv Q17 D3 info move Q16 visits 2 winrate 5087 prior 2277 lcb 0 areas 4268 order 1 pv Q16 C4\n"+
"info move Q17 visits 4 winrate 5047 prior 4182 lcb 2854 areas 3026 order 0 pv Q17 D3 info move Q16 visits 2 winrate 5087 prior 2277 lcb 0 areas 4268 order 1 pv Q16 C4\n"+
"info move Q17 visits 5 winrate 5044 prior 4182 lcb 4213 areas 2553 order 0 pv Q17 D3 info move Q16 visits 2 winrate 5087 prior 2277 lcb 0 areas 4268 order 1 pv Q16 C4\n"+
"info move Q17 visits 5 winrate 5044 prior 4182 lcb 4213 areas 2553 order 0 pv Q17 D3 info move Q16 visits 2 winrate 5087 prior 2277 lcb 0 areas 4268 order 1 pv Q16 C4\n"+
"info move Q17 visits 5 winrate 5044 prior 4182 lcb 4213 areas 2553 order 0 pv Q17 D3 info move Q16 visits 2 winrate 5087 prior 2277 lcb 0 areas 4268 order 1 pv Q16 C4\n"+
"\n"+
"move  visits reuse ppv winrate  agent   LCB   stdev policy fvisit alpkt w1st PV\n"+
"\n"+
" Q17       6     0   3  50.21% 50.21% 44.40%  0.91% 41.82% 54.55%   0.2  17% Q17 Q3\n"+
" Q16       3     0   6  50.36% 50.36% -99.9%  1.28% 22.77% 27.27%   0.3  33% Q16 D17\n"+
" P16       0     0  35   0.00%  0.00% -99.9%  0.00%  2.39%  0.00%  -0.0   0% P16 \n"+
" P17       0     0  42   0.00%  0.00% -99.9%  0.00%  1.99%  0.00%  -0.0   0% P17 \n"+
"\n"+
"      visits reuse  de winrate  agent parent  stdev p_loss  ineff alpkt beta\n"+
"Root      11     0   3  45.64% 50.26% 45.64% 10.30%  1.07   0.00%   0.1 0.12\n"+
"\n"+
"Final agent lambda=0.00, mu=0.00, interval [0.0, 0.0].\n"+
"2.8 average depth, 3 max depth\n"+
"3 non leaf nodes, 3.00 average children\n"+
"\n"+
"11 visits, 3117 nodes";


const leela_analyze_sample_2 = "NN eval=0.463478\n"+
"info move D4 visits 2 winrate 4671 prior 2198 lcb 0 order 0 pv D4 D16 info move D16 visits 0 winrate 0 prior 2173 lcb 0 order 1 pv D16 info move Q4 visits 0 winrate 0 prior 2172 lcb 0 order 2 pv Q4 info move Q16 visits 0 winrate 0 prior 2147 lcb 0 order 3 pv Q16 info move R4 visits 0 winrate 0 prior 74 lcb 0 order 4 pv R4 info move D3 visits 0 winrate 0 prior 74 lcb 0 order 5 pv D3 info move D17 visits 0 winrate 0 prior 73 lcb 0 order 6 pv D17 info move Q3 visits 0 winrate 0 prior 72 lcb 0 order 7 pv Q3 info move C16 visits 0 winrate 0 prior 71 lcb 0 order 8 pv C16 info move C4 visits 0 winrate 0 prior 71 lcb 0 order 9 pv C4\n"+
"info move D4 visits 2 winrate 4671 prior 2198 lcb 0 order 0 pv D4 D16 info move D16 visits 0 winrate 0 prior 2173 lcb 0 order 1 pv D16 info move Q4 visits 0 winrate 0 prior 2172 lcb 0 order 2 pv Q4 info move Q16 visits 0 winrate 0 prior 2147 lcb 0 order 3 pv Q16 info move R4 visits 0 winrate 0 prior 74 lcb 0 order 4 pv R4 info move D3 visits 0 winrate 0 prior 74 lcb 0 order 5 pv D3 info move D17 visits 0 winrate 0 prior 73 lcb 0 order 6 pv D17 info move Q3 visits 0 winrate 0 prior 72 lcb 0 order 7 pv Q3 info move C16 visits 0 winrate 0 prior 71 lcb 0 order 8 pv C16 info move C4 visits 0 winrate 0 prior 71 lcb 0 order 9 pv C4\n"+
"\n"+
"  D4 ->       4 (V: 46.64%) (LCB: 31.68%) (N: 21.99%) PV: D4 D16 Q4 R16\n"+
" D16 ->       0 (V:  0.00%) (LCB:  0.00%) (N: 21.73%) PV: D16 \n"+
"3.0 average depth, 5 max depth\n"+
"4 non leaf nodes, 1.00 average children\n"+
"\n"+
"5 visits, 1795 nodes";
const leela_analyze_sample = "NN eval=0.463478\n"+
"info move Q4 visits 8 winrate 5333 prior 4047 lcb 5185 order 0 pv Q4 D16 C4 E3 D3 E4 C6 O3\n"+
"info move D16 visits 8 winrate 5333 prior 3932 lcb 5185 order 1 pv D16 Q4 D3 C5 C4 D5 F3 C14 info move D4 visits 0 winrate 0 prior 1677 lcb 0 order 2 pv D4 info move D17 visits 0 winrate 0 prior 9 lcb 0 order 3 pv D17 info move D3 visits 0 winrate 0 prior 8 lcb 0 order 4 pv D3 info move R4 visits 0 winrate 0 prior 8 lcb 0 order 5 pv R4 info move C4 visits 0 winrate 0 prior 8 lcb 0 order 6 pv C4 info move Q3 visits 0 winrate 0 prior 5 lcb 0 order 7 pv Q3 info move C16 visits 0 winrate 0 prior 5 lcb 0 order 8 pv C16 info move C17 visits 0 winrate 0 prior 5 lcb 0 order 9 pv C17 info move R3 visits 0 winrate 0 prior 5 lcb 0 order 10 pv R3 info move C3 visits 0 winrate 0 prior 4 lcb 0 order 11 pv C3 info move C15 visits 0 winrate 0 prior 2 lcb 0 order 12 pv C15 info move O17 visits 0 winrate 0 prior 2 lcb 0 order 13 pv O17 info move R5 visits 0 winrate 0 prior 2 lcb 0 order 14 pv R5 info move P3 visits 0 winrate 0 prior 2 lcb 0 order 15 pv P3 info move E3 visits 0 winrate 0 prior 2 lcb 0 order 16 pv E3 info move R17 visits 0 winrate 0 prior 2 lcb 0 order 17 pv R17 info move D5 visits 0 winrate 0 prior 2 lcb 0 order 18 pv D5 info move E17 visits 0 winrate 0 prior 2 lcb 0 order 19 pv E17 info move E16 visits 0 winrate 0 prior 2 lcb 0 order 20 pv E16 info move D15 visits 0 winrate 0 prior 2 lcb 0 order 21 pv D15 info move E4 visits 0 winrate 0 prior 2 lcb 0 order 22 pv E4 info move Q5 visits 0 winrate 0 prior 2 lcb 0 order 23 pv Q5 info move C5 visits 0 winrate 0 prior 2 lcb 0 order 24 pv C5 info move P4 visits 0 winrate 0 prior 1 lcb 0 order 25 pv P4 info move R14 visits 0 winrate 0 prior 1 lcb 0 order 26 pv R14\n"+
"info move C14 visits 0 winrate 0 prior 1 lcb 0 order 27 pv C14 info move N17 visits 0 winrate 0 prior 1 lcb 0 order 28 pv N17 info move Q17 visits 0 winrate 0 prior 1 lcb 0 order 29 pv Q17 info move C6 visits 0 winrate 0 prior 1 lcb 0 order 30 pv C6 info move F3 visits 0 winrate 0 prior 1 lcb 0 order 31 pv F3 info move F17 visits 0 winrate 0 prior 1 lcb 0 order 32 pv F17 info move D14 visits 0 winrate 0 prior 1 lcb 0 order 33 pv D14 info move R6 visits 0 winrate 0 prior 1 lcb 0 order 34 pv R6 info move O3 visits 0 winrate 0 prior 1 lcb 0 order 35 pv O3 info move D6 visits 0 winrate 0 prior 1 lcb 0 order 36 pv D6 info move F16 visits 0 winrate 0 prior 1 lcb 0 order 37 pv F16 info move D13 visits 0 winrate 0 prior 1 lcb 0 order 38 pv D13 info move P16 visits 0 winrate 0 prior 1 lcb 0 order 39 pv P16 info move C13 visits 0 winrate 0 prior 1 lcb 0 order 40 pv C13 info move R16 visits 0 winrate 0 prior 1 lcb 0 order 41 pv R16 info move R13 visits 0 winrate 0 prior 1 lcb 0 order 42 pv R13 info move E15 visits 0 winrate 0 prior 1 lcb 0 order 43 pv E15 info move F4 visits 0 winrate 0 prior 1 lcb 0 order 44 pv F4 info move O16 visits 0 winrate 0 prior 1 lcb 0 order 45 pv O16 info move R7 visits 0 winrate 0 prior 1 lcb 0 order 46 pv R7 info move D7 visits 0 winrate 0 prior 1 lcb 0 order 47 pv D7 info move N3 visits 0 winrate 0 prior 1 lcb 0 order 48 pv N3 info move Q6 visits 0 winrate 0 prior 1 lcb 0 order 49 pv Q6";


/*const kata_analyze_sample = "
 info move C3 visits 6 utility 1.04291 winrate 0.992245 scoreMean 14.4587 scoreStdev 16.1808 scoreLead 14.4587 scoreSelfplay 17.096 prior 0.0183468 lcb 0.97559 utilityLcb 0.996279 order 0 pv C3 Q4 R16
 info move C17 visits 6 utility 1.04291 winrate 0.992245 scoreMean 14.4587 scoreStdev 16.1808 scoreLead 14.4587 scoreSelfplay 17.096 prior 0.0183468 lcb 0.97559 utilityLcb 0.996279 isSymmetryOf C3 order 1 pv C17 Q16 R4
 info move R3 visits 6 utility 1.04291 winrate 0.992245 scoreMean 14.4587 scoreStdev 16.1808 scoreLead 14.4587 scoreSelfplay 17.096 prior 0.0183468 lcb 0.97559 utilityLcb 0.996279 isSymmetryOf C3 order 2 pv R3 D4 C16
 info move R17 visits 6 utility 1.04291 winrate 0.992245 scoreMean 14.4587 scoreStdev 16.1808 scoreLead 14.4587 scoreSelfplay 17.096 prior 0.0183468 lcb 0.97559 utilityLcb 0.996279 isSymmetryOf C3 order 3 pv R17 D16 C4
 info move D4 visits 6 utility 1.03122 winrate 0.992694 scoreMean 13.1039 scoreStdev 15.4155 scoreLead 13.1039 scoreSelfplay 15.9613 prior 0.0365862 lcb 0.965865 utilityLcb 0.956097 order 4 pv D4 Q16 Q4
 info move D16 visits 6 utility 1.03122 winrate 0.992694 scoreMean 13.1039 scoreStdev 15.4155 scoreLead 13.1039 scoreSelfplay 15.9613 prior 0.0365862 lcb 0.965865 utilityLcb 0.956097 isSymmetryOf D4 order 5 pv D16 Q4 Q16
 info move Q4 visits 6 utility 1.03122 winrate 0.992694 scoreMean 13.1039 scoreStdev 15.4155 scoreLead 13.1039 scoreSelfplay 15.9613 prior 0.0365862 lcb 0.965865 utilityLcb 0.956097 isSymmetryOf D4 order 6 pv Q4 D16 D4
 info move Q16 visits 6 utility 1.03122 winrate 0.992694 scoreMean 13.1039 scoreStdev 15.4155 scoreLead 13.1039 scoreSelfplay 15.9613 prior 0.0365862 lcb 0.965865 utilityLcb 0.956097 isSymmetryOf D4 order 7 pv Q16 D4 D16
 info move C4 visits 6 utility 1.03876 winrate 0.992369 scoreMean 13.9992 scoreStdev 16.0093 scoreLead 13.9992 scoreSelfplay 16.7473 prior 0.0403575 lcb 0.962421 utilityLcb 0.954908 order 8 pv C4 Q4 R16
 info move C16 visits 6 utility 1.03876 winrate 0.992369 scoreMean 13.9992 scoreStdev 16.0093 scoreLead 13.9992 scoreSelfplay 16.7473 prior 0.0403575 lcb 0.962421 utilityLcb 0.954908 isSymmetryOf C4 order 9 pv C16 Q16 R4
 info move R4 visits 6 utility 1.03876 winrate 0.992369 scoreMean 13.9992 scoreStdev 16.0093 scoreLead 13.9992 scoreSelfplay 16.7473 prior 0.0403575 lcb 0.962421 utilityLcb 0.954908 isSymmetryOf C4 order 10 pv R4 D4 C16
 info move R16 visits 6 utility 1.03876 winrate 0.992369 scoreMean 13.9992 scoreStdev 16.0093 scoreLead 13.9992 scoreSelfplay 16.7473 prior 0.0403575 lcb 0.962421 utilityLcb 0.954908 isSymmetryOf C4 order 11 pv R16 D16 C4
 info move Q17 visits 6 utility 1.03876 winrate 0.992369 scoreMean 13.9992 scoreStdev 16.0093 scoreLead 13.9992 scoreSelfplay 16.7473 prior 0.0403575 lcb 0.962421 utilityLcb 0.954908 isSymmetryOf C4 order 12 pv Q17 Q4 D3
 info move D17 visits 6 utility 1.03876 winrate 0.992369 scoreMean 13.9992 scoreStdev 16.0093 scoreLead 13.9992 scoreSelfplay 16.7473 prior 0.0403575 lcb 0.962421 utilityLcb 0.954908 isSymmetryOf C4 order 13 pv D17 D4 Q3
 info move Q3 visits 6 utility 1.03876 winrate 0.992369 scoreMean 13.9992 scoreStdev 16.0093 scoreLead 13.9992 scoreSelfplay 16.7473 prior 0.0403575 lcb 0.962421 utilityLcb 0.954908 isSymmetryOf C4 order 14 pv Q3 Q16 D17
 info move D3 visits 6 utility 1.03876 winrate 0.992369 scoreMean 13.9992 scoreStdev 16.0093 scoreLead 13.9992 scoreSelfplay 16.7473 prior 0.0403575 lcb 0.962421 utilityLcb 0.954908 isSymmetryOf C4 order 15 pv D3 D16 Q17
 info move D5 visits 6 utility 1.0397 winrate 0.992557 scoreMean 13.6523 scoreStdev 16.244 scoreLead 13.6523 scoreSelfplay 16.5357 prior 0.0145553 lcb 0.966084 utilityLcb 0.965578 order 16 pv D5 C3 E3
 info move D15 visits 6 utility 1.0397 winrate 0.992557 scoreMean 13.6523 scoreStdev 16.244 scoreLead 13.6523 scoreSelfplay 16.5357 prior 0.0145553 lcb 0.966084 utilityLcb 0.965578 isSymmetryOf D5 order 17 pv D15 C17 E17
 info move Q5 visits 6 utility 1.0397 winrate 0.992557 scoreMean 13.6523 scoreStdev 16.244 scoreLead 13.6523 scoreSelfplay 16.5357 prior 0.0145553 lcb 0.966084 utilityLcb 0.965578 isSymmetryOf D5 order 18 pv Q5 R3 P3
 info move Q15 visits 6 utility 1.0397 winrate 0.992557 scoreMean 13.6523 scoreStdev 16.244 scoreLead 13.6523 scoreSelfplay 16.5357 prior 0.0145553 lcb 0.966084 utilityLcb 0.965578 isSymmetryOf D5 order 19 pv Q15 R17 P17
 info move P16 visits 6 utility 1.0397 winrate 0.992557 scoreMean 13.6523 scoreStdev 16.244 scoreLead 13.6523 scoreSelfplay 16.5357 prior 0.0145553 lcb 0.966084 utilityLcb 0.965578 isSymmetryOf D5 order 20 pv P16 R17 R15
 info move E16 visits 6 utility 1.0397 winrate 0.992557 scoreMean 13.6523 scoreStdev 16.244 scoreLead 13.6523 scoreSelfplay 16.5357 prior 0.0145553 lcb 0.966084 utilityLcb 0.965578 isSymmetryOf D5 order 21 pv E16 C17 C15
 info move P4 visits 6 utility 1.0397 winrate 0.992557 scoreMean 13.6523 scoreStdev 16.244 scoreLead 13.6523 scoreSelfplay 16.5357 prior 0.0145553 lcb 0.966084 utilityLcb 0.965578 isSymmetryOf D5 order 22 pv P4 R3 R5
 info move E4 visits 6 utility 1.0397 winrate 0.992557 scoreMean 13.6523 scoreStdev 16.244 scoreLead 13.6523 scoreSelfplay 16.5357 prior 0.0145553 lcb 0.966084 utilityLcb 0.965578 isSymmetryOf D5 order 23 pv E4 C3 C5
 info move C5 visits 5 utility 1.03658 winrate 0.991834 scoreMean 14.022 scoreStdev 16.028 scoreLead 14.022 scoreSelfplay 16.5416 prior 0.0108768 lcb 0.950179 utilityLcb 0.919942 order 24 pv C5 Q4 Q16
 info move C15 visits 5 utility 1.03658 winrate 0.991834 scoreMean 14.022 scoreStdev 16.028 scoreLead 14.022 scoreSelfplay 16.5416 prior 0.0108768 lcb 0.950179 utilityLcb 0.919942 isSymmetryOf C5 order 25 pv C15 Q16 Q4
 info move R5 visits 5 utility 1.03658 winrate 0.991834 scoreMean 14.022 scoreStdev 16.028 scoreLead 14.022 scoreSelfplay 16.5416 prior 0.0108768 lcb 0.950179 utilityLcb 0.919942 isSymmetryOf C5 order 26 pv R5 D4 D16
 info move R15 visits 5 utility 1.03658 winrate 0.991834 scoreMean 14.022 scoreStdev 16.028 scoreLead 14.022 scoreSelfplay 16.5416 prior 0.0108768 lcb 0.950179 utilityLcb 0.919942 isSymmetryOf C5 order 27 pv R15 D16 D4
 info move P17 visits 5 utility 1.03658 winrate 0.991834 scoreMean 14.022 scoreStdev 16.028 scoreLead 14.022 scoreSelfplay 16.5416 prior 0.0108768 lcb 0.950179 utilityLcb 0.919942 isSymmetryOf C5 order 28 pv P17 Q4 D4
 info move E17 visits 5 utility 1.03658 winrate 0.991834 scoreMean 14.022 scoreStdev 16.028 scoreLead 14.022 scoreSelfplay 16.5416 prior 0.0108768 lcb 0.950179 utilityLcb 0.919942 isSymmetryOf C5 order 29 pv E17 D4 Q4
 info move P3 visits 5 utility 1.03658 winrate 0.991834 scoreMean 14.022 scoreStdev 16.028 scoreLead 14.022 scoreSelfplay 16.5416 prior 0.0108768 lcb 0.950179 utilityLcb 0.919942 isSymmetryOf C5 order 30 pv P3 Q16 D16
 info move E3 visits 5 utility 1.03658 winrate 0.991834 scoreMean 14.022 scoreStdev 16.028 scoreLead 14.022 scoreSelfplay 16.5416 prior 0.0108768 lcb 0.950179 utilityLcb 0.919942 isSymmetryOf C5 order 31 pv E3 D16 Q16
 info move C6 visits 5 utility 1.01588 winrate 0.987974 scoreMean 12.5585 scoreStdev 16.9021 scoreLead 12.5585 scoreSelfplay 15.3843 prior 0.00368594 lcb 0.919743 utilityLcb 0.824837 order 32 pv C6 C4 D4 D3
 info move C14 visits 5 utility 1.01588 winrate 0.987974 scoreMean 12.5585 scoreStdev 16.9021 scoreLead 12.5585 scoreSelfplay 15.3843 prior 0.00368594 lcb 0.919743 utilityLcb 0.824837 isSymmetryOf C6 order 33 pv C14 C16 D16 D17
 info move R6 visits 5 utility 1.01588 winrate 0.987974 scoreMean 12.5585 scoreStdev 16.9021 scoreLead 12.5585 scoreSelfplay 15.3843 prior 0.00368594 lcb 0.919743 utilityLcb 0.824837 isSymmetryOf C6 order 34 pv R6 R4 Q4 Q3
 info move R14 visits 5 utility 1.01588 winrate 0.987974 scoreMean 12.5585 scoreStdev 16.9021 scoreLead 12.5585 scoreSelfplay 15.3843 prior 0.00368594 lcb 0.919743 utilityLcb 0.824837 isSymmetryOf C6 order 35 pv R14 R16 Q16 Q17
 info move O17 visits 5 utility 1.01588 winrate 0.987974 scoreMean 12.5585 scoreStdev 16.9021 scoreLead 12.5585 scoreSelfplay 15.3843 prior 0.00368594 lcb 0.919743 utilityLcb 0.824837 isSymmetryOf C6 order 36 pv O17 Q17 Q16 R16
 info move F17 visits 5 utility 1.01588 winrate 0.987974 scoreMean 12.5585 scoreStdev 16.9021 scoreLead 12.5585 scoreSelfplay 15.3843 prior 0.00368594 lcb 0.919743 utilityLcb 0.82483";
*/

const moveTag = " move ";
const visitsTag = " visits ";
const utilityTag = " utility ";
const scoreMeanTag = " scoreMean ";
const scoreStdevTag = " scoreStdev ";
const winrateTag = " winrate ";
const priorTag = " prior ";
const unknownCommandTag = "unknown command";

const myEngineSettings = { // priority in this order
    isChooseWorstMove : "yes", // worst move above threshold
    isChooseBestMove : "yes",
    isChooseRandomMove : "yes",

    loss_limit : 4, // "accepted" loss threshold

    //"daidaigeima","ogeima", "keima", "sangenbiraki" (3-space jump), "nikentobi", "tobi", "hane", "cut", "crosscut", "nobi", "kosumi"
    // TODO not working for now: requires to consider all directions simultaneusly, maybe place stone at center of pattern, or in 1,1/2,2
    preferShape : null ,// [/*"empty",*/ "daidaigeima","ogeima", "keima", "sangenbiraki", "nikentobi", "tobi", "kosumi"],

    isTenuki : "yes", // favors playing as far as possible from last move

    isInfluencial: "yes", // prefers line 4 and above
    isTerritorial: "no", // prefers line 3 and below

    isDistantMove: "yes", // prefers distant moves
    isContactMove: "no" // prefers contact moves
};
const myEngineSettingNames = [ // priority in this order
    "isChooseRandomMove",
    "isChooseBestMove",
    "isChooseWorstMove", // worst move above threshold

    "loss_limit",

    // move preferences
    "preferShape", //"daidaigeima","ogeima", "keima", "sangenbiraki" (3-space jump), "nikentobi", "tobi", "hane", "cut", "crosscut", "nobi", "kosumi"

    "isTenuki", // favors playing as far as possible from last move

    "isInfluencial", // prefers line 4 and above
    "isTerritorial", // prefers line 3 and below

    "isDistantMove", // prefers distant moves
    "isContactMove" // prefers contact moves
];

const chooseKataMove = (kataMoves) => {
    //console.log("chooseKataMove SGF: \n",currentSGF);
    const currentGame = sgf.parse(currentSGF)
    //console.log("chooseKataMove game: \n",currentGame);
    let kata_filtered_moves = kataMoves.sort((moveA, moveB)=>(moveB[1]-moveA[1]))
    kata_filtered_moves = kata_filtered_moves.filter(oneMove => !oneMove[1] || (kataMoves[0][1]-myEngineSettings.loss_limit < oneMove[1]))
    let grid = null;
    //console.log("chooseKataMove: before ("+kata_filtered_moves.length+")", kata_filtered_moves);
    let currentChoice = null;
    let settingIdx = 4;
    while(kata_filtered_moves.length >1 && settingIdx<myEngineSettingNames.length) {
        currentChoice = pickKataMoveByIdx(kata_filtered_moves)
        const settingName = myEngineSettingNames[settingIdx];
        if(myEngineSettings[settingName] && myEngineSettings[settingName] !== "no") {
            console.log("chooseKataMove: "+settingName+"("+kata_filtered_moves.length+")", currentChoice[0])
            switch (settingName) {
                case "preferShape":  //"daidaigeima","ogeima", "keima", "sangenbiraki" (3-space jump), "nikentobi", "tobi", "hane", "cut", "crosscut", "nobi", "kosumi"
                    //console.log("preferShape: "+"("+myEngineSettings[settingName]+")")
                    grid = grid === null ? sgfutils.getGrid(currentGame) : grid;
                    kata_filtered_moves = kata_filtered_moves.filter(oneMove => {
                        let moveAsPoint = sgfutils.humanToPoint(oneMove[0]);
                        return myEngineSettings[settingName].some((oneShape) => {
                                const isShape = sgfutils.isShape(moveAsPoint, sgfutils[oneShape + 'Shapes'], grid);
                                if(isShape) {
                                    console.log(oneMove[0]+" is "+oneShape);
                                }
                                return isShape;
                            }
                        )
                    })
                    break;
                case "isTenuki": // favors playing as far as possible from last move
                    const distanceFromLastMoveGrid = sgfutils.getDistanceFromLastMoveGrid(currentGame);
                    kata_filtered_moves = kata_filtered_moves.filter(oneMove => isInfluencialMove(oneMove[0]))
                    console.log("isInfluencial: "+"("+kata_filtered_moves.length+")")
                    break;
                case "isInfluencial": // prefers line 4 and above
                    kata_filtered_moves = kata_filtered_moves.filter(oneMove => isInfluencialMove(oneMove[0]))
                    console.log("isInfluencial: "+"("+kata_filtered_moves.length+")")
                    break;
                case "isTerritorial": // prefers line 3 and below
                    kata_filtered_moves = kata_filtered_moves.filter(oneMove => !isInfluencialMove(oneMove[0]))
                    console.log("isTerritorial: "+"("+kata_filtered_moves.length+")")
                    break;
                case "isDistantMove": // prefers distant moves
                    grid = grid === null ? sgfutils.getGrid(currentGame) : grid;
                    break;
                case "isContactMove": // prefers contact moves
                    grid = grid === null ? sgfutils.getGrid(currentGame) : grid;
                    break;

            }
            console.log("chooseKataMove: after "+settingName+"("+kata_filtered_moves.length+")", kata_filtered_moves)
        }
        settingIdx++;
    }
    //console.log(JSON.stringify(kata_filtered_moves))

    return kata_filtered_moves.length ? pickKataMoveByIdx(kata_filtered_moves) : currentChoice;
}

const isInfluencialMove = (oneMove) => { // "A1" to "T19"
    if(oneMove[0] < "D") return false;
    if(oneMove[0] > "Q") return false;
    const line = parseInt(oneMove.substring(1))
    if(line < 4) return false;
    if(line > 16 ) return false;
    return true;
}

const pickKataMoveByIdx = (kataMoves) => {
    if(myEngineSettings.isChooseRandomMove === "yes") {
        return [kataMoves[getRandomInt(kataMoves.length)]];
    } else if(myEngineSettings.isChooseBestMove === "yes") {
        return [kataMoves[0]];
    } else if(myEngineSettings.isChooseWorstMove === "yes") {
        return [kataMoves[kataMoves.length-1]];
    } else {
        return [kataMoves[0]];
    }
}
function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

const parseKataAnalyze = (kataAnalyze) => {
    const kata_lines = kataAnalyze.split(" info");
    //kata_lines.shift();
    return kata_lines.map(line => {
        return [line.substring(line.indexOf(moveTag)+moveTag.length, line.indexOf(visitsTag)),
            parseFloat(line.substring(line.indexOf(scoreMeanTag)+scoreMeanTag.length, line.indexOf(scoreStdevTag))),
            parseFloat(line.substring(line.indexOf(visitsTag)+visitsTag.length, line.indexOf(utilityTag)))
        ]
    })
}

// "info move D4 visits 2 winrate 4671 prior 2198 lcb 0 order 0 pv D4 D16 info move D16 visits 0 winrate 0 prior 2173 lcb 0 order 1 pv D16 info move Q4 visits 0 winrate 0 prior 2172 lcb 0 order 2 pv Q4 info move Q16 visits 0 winrate 0 prior 2147 lcb 0 order 3 pv Q16 info move R4 visits 0 winrate 0 prior 74 lcb 0 order 4 pv R4 info move D3 visits 0 winrate 0 prior 74 lcb 0 order 5 pv D3 info move D17 visits 0 winrate 0 prior 73 lcb 0 order 6 pv D17 info move Q3 visits 0 winrate 0 prior 72 lcb 0 order 7 pv Q3 info move C16 visits 0 winrate 0 prior 71 lcb 0 order 8 pv C16 info move C4 visits 0 winrate 0 prior 71 lcb 0 order 9 pv C4\n"+
// info move D4 visits 2 winrate 4671 prior 2198 lcb 0 order 0 pv D4 D16 
// info move D16 visits 0 winrate 0 prior 2173 lcb 0 order 1 pv D16 
// info move Q4 visits 0 winrate 0 prior 2172 lcb 0 order 2 pv Q4 
// info move Q16 visits 0 winrate 0 prior 2147 lcb 0 order 3 pv Q16 info move R4 visits 0 winrate 0 prior 74 lcb 0 order 4 pv R4 info move D3 visits 0 winrate 0 prior 74 lcb 0 order 5 pv D3 info move D17 visits 0 winrate 0 prior 73 lcb 0 order 6 pv D17 info move Q3 visits 0 winrate 0 prior 72 lcb 0 order 7 pv Q3 info move C16 visits 0 winrate 0 prior 71 lcb 0 order 8 pv C16 info move C4 visits 0 winrate 0 prior 71 lcb 0 order 9 pv C4\n"+
const parseLeelaAnalyze = (kataAnalyze) => {
    const kata_lines = kataAnalyze.split(" info");
    //kata_lines.shift();
    return kata_lines.map(line => {
        return [line.substring(line.indexOf(moveTag)+moveTag.length, line.indexOf(visitsTag)),
            parseFloat(line.substring(line.indexOf(winrateTag)+winrateTag.length, line.indexOf(priorTag))),
            parseFloat(line.substring(line.indexOf(visitsTag)+visitsTag.length, line.indexOf(winrateTag)))
        ]
    })
}

const parseSaiAnalyze = (kataAnalyze) => {
    const kata_lines = kataAnalyze.split(" info");
    //kata_lines.shift();
    return kata_lines.map(line => {
        return [line.substring(line.indexOf(moveTag)+moveTag.length, line.indexOf(visitsTag)),
            parseFloat(line.substring(line.indexOf(winrateTag)+winrateTag.length, line.indexOf(priorTag))),
            parseFloat(line.substring(line.indexOf(visitsTag)+visitsTag.length, line.indexOf(winrateTag)))
        ]
    })
}

const filterOutDoublonMove = (moveList) => {
	let result = [];
	
	moveList.forEach((oneMove) => {
		const sameMove = result.find((resultMove) => resultMove[0] === oneMove[0]);
		if(sameMove) {
			if(oneMove[1]) {
				const resIdx = result.indexOf(sameMove)
				result.splice(resIdx,resIdx);
				result.push(oneMove);
			}
		} else {
			result.push(oneMove);
		}
	});
	
	return result;
}

const copyGenMoveOrAnalyze = (p_engineResp)=>{
	engineResp = p_engineResp[0];
	console.log("copyGenMoveOrAnalyze ",currentResTime ,engineResp && engineResp.length);
    if(currentRes && engineResp && engineResp.length && engineResp.indexOf(unknownCommandTag)>=0) {
        currentRes.status(400).send(null);
		currentRes = null;
    } else if(currentRes && engineResp && engineResp.length && engineResp.replaceAll('=','').replaceAll('\n','').trim().length){
		console.log("engineResp ",engineResp);
        let returnedValue = engineResp.indexOf(visitsTag)>0 ? parseLeelaAnalyze(engineResp): [[engineResp.replaceAll('=','').replaceAll('\n','').trim(),1,100]];
        returnedValue = filterOutDoublonMove(returnedValue);
        returnedValue = chooseKataMove(returnedValue);
        //console.log('final response1 #'+JSON.stringify(returnedValue)+'#')
        currentRes.status(200).send(returnedValue[0][0]);
        child && child.stdin && child.stdin.write("\n");
        currentRes = null;
    }/* else if (engineResp && engineResp.length && engineResp === "= \n\n"){ // TODO: needed for real GTP, but messes up with kata-analyze cmd
        currentRes.status(200).send(engineResp);
    } else {
        console.log('temporary response &'+engineResp+"&")
    }*/

}

const currentBehaviour = copyGenMoveOrAnalyze;

const resetEngine = () => {
    console.log('resetEngine');
    engineFullResponseHolder[0] = ''; // TODO: reset on request, remember the current request time
    isEngineOn = true;
    isEngineStarting = true;
    child = exec(engineStartCmd);
	let currentEngineTime = currentResTime;
	setTimeout(currentBehaviour, 10000, engineFullResponseHolder)
    child.stdout.on('data', function(data) {
        console.log('stdout: (',""+!!currentRes,')',data && data.length /*&& (data.length > 50 ? data.length : data)*/);
		if(currentEngineTime !== currentResTime) {
			currentEngineTime = currentResTime;
			engineFullResponseHolder[0] = '';
		}
        if(currentRes && !isEngineStarting) {
            //currentRes.write(data);
			engineFullResponseHolder[0] += data;
            //currentBehaviour(data)
        }
        if(data && data.indexOf('GTP ready, beginning main protocol loop')>=0) {
            console.log('Engine is READY')
            isEngineStarting = false;
            if(currentRes){
                console.log('closed calling POST')
                //currentRes.end();
                currentRes.status(200).send('OKAI1');
                currentRes = null;
            }
        }
    });
    child.stderr.on('data', function(data) {
        //result += data;
        console.log('stderr: ',data && data.length)
        if(data && (data.indexOf('GTP ready, beginning main protocol loop')>=0 ||
                    data.indexOf('Setting max tree size to')>=0) ) {
            console.log('Engine is READY Err')

            currentSGF = null;
            currentGame = currentSGF ? sgf.parse(currentSGF) : sgfutils.getEmptySGF();
            isEngineStarting = false;
            if(currentRes) {
                console.log('closed calling POST')
                //currentRes.end();
                currentRes.status(200).send('OKAI2');
                currentRes = null;
            }
        }
    });

    child.on('close', function(data) {
        console.log('Engine died ', JSON.stringify(data));
        //console.log(result);
        isEngineOn = false;
        if(currentRes) {
            //currentRes.status(201).json({msg:'Engine died'});
            currentRes = null;
        }
    });
}




app.use(bodyParser.urlencoded({ extended:  true }));
app.use(bodyParser.json());
app.use(cors());
app.use('/api', router);


router.use((request, response, next) => {
  //console.log('middlewarez');
  next();
});
 

router.route('/engine').post((req, res) => {
  const body = { ...req.body};

    if(!isEngineOn) {
        console.log('Need to start engine, go');
        resetEngine();
        res.status(200).send('OKAI');
    } else if (isEngineOn && child && child.stdin) {
        let cmd = body.cmd;
        if(body.currentSGF) {
            if(body.currentSGF === currentSGF) {
                //console.log("client and engine are in sync, we just pass the cmd")
                cmd = body.cmd;
            } else {
                //console.log("NOT IN SYNC, we must figure the delta ", currentSGF)
                let deltaCMD = sgfutils.getDeltaCMD(currentSGF , body.currentSGF );
                //console.log("delta OLD   : "+currentSGF)
                //console.log("delta TARGET: "+body.currentSGF)
                //console.log("delta CMD   : "+deltaCMD)
                cmd = deltaCMD+body.cmd;
                currentSGF = body.currentSGF;
                currentGame = currentSGF ? sgf.parse(currentSGF) : sgfutils.getEmptySGF();
                console.log("updated SGF from body: \n",currentSGF);
            }
        } else {
            currentGame = currentSGF ? sgf.parse(currentSGF) : sgfutils.getEmptySGF();

            cmd.split("\n").forEach((oneCMD) => {
                // we need to keep some incremental record of SGF, used by engine
                if(oneCMD.indexOf("play ") === 0) {
                    let lastNodeAndIdx = sgfutils.getlastNodeAndIdx({node:currentGame.gameTrees[0], nodeIdx:0})
                    sgfutils.addMovetoSGF(lastNodeAndIdx,oneCMD)
                } else if (oneCMD.indexOf("undo") === 0) {
                    let lastNodeAndIdx = sgfutils.getlastNodeAndIdx({node:currentGame.gameTrees[0], nodeIdx:0})
                    sgfutils.deleteVariation(lastNodeAndIdx.node, lastNodeAndIdx.nodeIdx);
                } else if (oneCMD.indexOf("clear_board") === 0) {
                    currentGame = sgfutils.getEmptySGF();
                }
                // TODO genmove: to be GTP compliant, we need to add the move to currentSGF after choosing it...
                // for now, the caller MUST give all the playMove cmds when they don't specify the full currentSGF in the post body
        });
            currentSGF = sgf.generate(currentGame);
            console.log("updated SGF from CMD: \n",currentSGF);
        }
        console.log('send cmd to engine: #', cmd, "#");
        child.stdin.write("\n");
        currentRes = res;
		currentResTime = Date.now();
		
		engineFullResponseHolder[0] = '';
        child.stdin.write(cmd);
    } else {
        console.log('but engine was dead ', isEngineOn, !!child );
        res.status(400).send('DEAD');
    }


})

router.route('/parseKata').post((req, res) => {
	const oneLine = kata_analyze_sample.split("\n")[0];
	console.log("parseKata ",oneLine);
	res.status(200).send(parseKataAnalyze(oneLine));
});
router.route('/parseSai').post((req, res) => {
	const oneLine = sai_analyze_sample.split("\n")[20];
	console.log("parseSai ",oneLine);
    res.status(200).send(parseSaiAnalyze(oneLine));
});
router.route('/parseLeela').post((req, res) => {
	const oneLine = leela_analyze_sample.split("\n")[2];
	console.log("parseLeela ",oneLine);
    res.status(200).send(parseLeelaAnalyze(oneLine));
});
router.route('/parseSai').post((req, res) => {
    res.status(200).send(parseKataAnalyze(sai_analyze_sample));
});
router.route('/parseLeela').post((req, res) => {
    res.status(200).send(parseKataAnalyze(leela_analyze_sample));
});
router.route('/testGrid').post((req, res) => {

    currentSGF = "(;GM[1]FF[4]CA[UTF-8]KM[7.5]SZ[19];B[pd];W[qc];B[qd];W[pc];B[oc];W[ob];B[nc];W[dp];B[dd];W[pp])";
    let currentGame = sgf.parse(currentSGF);
    let grid = sgfutils.getGrid(currentGame);
    let resultGrid = JSON.parse(JSON.stringify(grid))
    for(let i=0; i<19;i++) {
        for(let j=0; j<19;j++) {
            if(sgfutils.isKeima({x:i,y:j},grid)) {
                resultGrid[i][j] = 3;
                console.log("keima--------------------------------------------")
            }
        }
    }
    /*let i=1;
    let j=2;
    if(sgfutils.isKeima({x:i,y:j},grid)) {
        resultGrid[i][j] = 3;
        console.log("keima--------------------------------------------")
    }
    i=2;
    j=1;
    if(sgfutils.isKeima({x:i,y:j},grid)) {
        resultGrid[i][j] = 3;
        console.log("keima--------------------------------------------")
    }*/

    console.log(JSON.stringify(resultGrid).replaceAll("],[","],\n[" ));
    console.log(JSON.stringify(sgfutils.getDistanceFromAllMoveGrid(currentGame,grid)).replaceAll("],[","],\n[" ));
    console.log(JSON.stringify(sgfutils.getDistanceFromLastMoveGrid(currentGame)).replaceAll("],[","],\n[" ));

    res.status(200).send("OK");
});
router.route('/testDelta').post((req, res) => {
    const body = { ...req.body};
    //currentSGF   = null; // start with clear
    //currentSGF   = "(;GM[1]FF[4]CA[UTF-8]KM[7.5]SZ[19])";  // start with target first move
    //currentSGF = "(;GM[1]FF[4]CA[UTF-8]KM[7.5]SZ[19];B[pd];W[qc];B[qd];W[pc];B[oc];W[ob])";
    currentSGF = "(;GM[1]FF[4]CA[UTF-8]KM[7.5]SZ[19];B[pd];W[qc];B[qd];W[pc];B[oc];W[ob];B[nc])";
    currentGame = currentSGF ? sgf.parse(currentSGF) : sgfutils.getEmptySGF();
    let cmd = body.cmd;
    if(body.currentSGF) {
        if(body.currentSGF === currentSGF) {
            console.log("client and engine are in sync, we just pass the cmd")
            cmd = body.cmd;
        } else {
            console.log("NOT IN SYNC, we must figure the delta ",currentSGF)
            let deltaCMD = sgfutils.getDeltaCMD(currentSGF , body.currentSGF );
            console.log("delta OLD   : "+currentSGF)
            console.log("delta TARGET: "+body.currentSGF)
            console.log("delta CMD   : "+deltaCMD)
            cmd = deltaCMD+body.cmd;
            currentSGF = body.currentSGF;
            currentGame = currentSGF ? sgf.parse(currentSGF) : sgfutils.getEmptySGF();
        }
    }
    console.log('send cmd to engine: #', cmd, "#");
    res.status(200).send(cmd);
});

router.route('/engineRandom').post((req, res) => {
    const body = { ...req.body};

    if(!isEngineOn) {
        console.log('Need to start engine');
        resetEngine();
        res.status(200).send('OKAI');
    } else if (isEngineOn && child && child.stdin) {
        console.log('send cmd to engine: #', body.cmd, "#");
        currentRes = res;
        child.stdin.write(body.cmd);
    } else {
        console.log('but engine was dead ', isEngineOn, !!child );
        res.status(400).send('DEAD');
    }


})

  
let  port = process.env.PORT || 8090;
app.listen(port);
console.log('Order API is runnning at ' + port);
