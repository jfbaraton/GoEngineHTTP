// server.js
let express = require('express');
let bodyParser = require('body-parser');
let cors = require('cors');
let app = express();
let router = express.Router();
let sgf = require('smartgame');
let sgfutils  = require('./utils');

let exec = require('child_process').exec;
let isEngineOn = false;
let isEngineStarting = false;
let currentRes = null;
let result = '';
let child = null;
let currentSGF = null;
// C:\Users\yamak\.katrain\katago-v1.7.0-gpu-opencl-windows-x64.exe gtp -model C:\Users\yamak\.katrain\g170-b40c256x2-s5095420928-d1229425124.bin.gz -config C:\Users\yamak\.katrain\fast_analysis_config.cfg
//const engineStartCmd = 'C:\\Users\\yamak\\.katrain\\katago-v1.7.0-gpu-opencl-windows-x64.exe gtp -model C:\\Users\\yamak\\.katrain\\g170-b40c256x2-s5095420928-d1229425124.bin.gz -config C:\\Users\\yamak\\.katrain\\fast_analysis_config.cfg';
const engineStartCmd = '/Users/jeff/Documents/homebrew/bin/katago gtp -model /Users/jeff/Documents/go/kata1-b40c256-s11840935168-d2898845681.bin.gz -config /Users/jeff/Documents/homebrew/Cellar/katago/1.11.0/share/katago/configs/gtp_example.cfg';
const engineClearBoard = "time_settings 0 5 1\nkomi 7.5\nboardsize 19\nclear_board\n";
const kata_analyze_sample = "info move C3 visits 6 utility 1.04291 winrate 0.992245 scoreMean 14.4587 scoreStdev 16.1808 scoreLead 14.4587 scoreSelfplay 17.096 prior 0.0183468 lcb 0.97559 utilityLcb 0.996279 order 0 pv C3 Q4 R16 info move C17 visits 6 utility 1.04291 winrate 0.992245 scoreMean 14.4587 scoreStdev 16.1808 scoreLead 14.4587 scoreSelfplay 17.096 prior 0.0183468 lcb 0.97559 utilityLcb 0.996279 isSymmetryOf C3 order 1 pv C17 Q16 R4 info move R3 visits 6 utility 1.04291 winrate 0.992245 scoreMean 14.4587 scoreStdev 16.1808 scoreLead 14.4587 scoreSelfplay 17.096 prior 0.0183468 lcb 0.97559 utilityLcb 0.996279 isSymmetryOf C3 order 2 pv R3 D4 C16 info move R17 visits 6 utility 1.04291 winrate 0.992245 scoreMean 14.4587 scoreStdev 16.1808 scoreLead 14.4587 scoreSelfplay 17.096 prior 0.0183468 lcb 0.97559 utilityLcb 0.996279 isSymmetryOf C3 order 3 pv R17 D16 C4 info move D4 visits 6 utility 1.03122 winrate 0.992694 scoreMean 13.1039 scoreStdev 15.4155 scoreLead 13.1039 scoreSelfplay 15.9613 prior 0.0365862 lcb 0.965865 utilityLcb 0.956097 order 4 pv D4 Q16 Q4 info move D16 visits 6 utility 1.03122 winrate 0.992694 scoreMean 13.1039 scoreStdev 15.4155 scoreLead 13.1039 scoreSelfplay 15.9613 prior 0.0365862 lcb 0.965865 utilityLcb 0.956097 isSymmetryOf D4 order 5 pv D16 Q4 Q16 info move Q4 visits 6 utility 1.03122 winrate 0.992694 scoreMean 13.1039 scoreStdev 15.4155 scoreLead 13.1039 scoreSelfplay 15.9613 prior 0.0365862 lcb 0.965865 utilityLcb 0.956097 isSymmetryOf D4 order 6 pv Q4 D16 D4 info move Q16 visits 6 utility 1.03122 winrate 0.992694 scoreMean 13.1039 scoreStdev 15.4155 scoreLead 13.1039 scoreSelfplay 15.9613 prior 0.0365862 lcb 0.965865 utilityLcb 0.956097 isSymmetryOf D4 order 7 pv Q16 D4 D16 info move C4 visits 6 utility 1.03876 winrate 0.992369 scoreMean 13.9992 scoreStdev 16.0093 scoreLead 13.9992 scoreSelfplay 16.7473 prior 0.0403575 lcb 0.962421 utilityLcb 0.954908 order 8 pv C4 Q4 R16 info move C16 visits 6 utility 1.03876 winrate 0.992369 scoreMean 13.9992 scoreStdev 16.0093 scoreLead 13.9992 scoreSelfplay 16.7473 prior 0.0403575 lcb 0.962421 utilityLcb 0.954908 isSymmetryOf C4 order 9 pv C16 Q16 R4 info move R4 visits 6 utility 1.03876 winrate 0.992369 scoreMean 13.9992 scoreStdev 16.0093 scoreLead 13.9992 scoreSelfplay 16.7473 prior 0.0403575 lcb 0.962421 utilityLcb 0.954908 isSymmetryOf C4 order 10 pv R4 D4 C16 info move R16 visits 6 utility 1.03876 winrate 0.992369 scoreMean 13.9992 scoreStdev 16.0093 scoreLead 13.9992 scoreSelfplay 16.7473 prior 0.0403575 lcb 0.962421 utilityLcb 0.954908 isSymmetryOf C4 order 11 pv R16 D16 C4 info move Q17 visits 6 utility 1.03876 winrate 0.992369 scoreMean 13.9992 scoreStdev 16.0093 scoreLead 13.9992 scoreSelfplay 16.7473 prior 0.0403575 lcb 0.962421 utilityLcb 0.954908 isSymmetryOf C4 order 12 pv Q17 Q4 D3 info move D17 visits 6 utility 1.03876 winrate 0.992369 scoreMean 13.9992 scoreStdev 16.0093 scoreLead 13.9992 scoreSelfplay 16.7473 prior 0.0403575 lcb 0.962421 utilityLcb 0.954908 isSymmetryOf C4 order 13 pv D17 D4 Q3 info move Q3 visits 6 utility 1.03876 winrate 0.992369 scoreMean 13.9992 scoreStdev 16.0093 scoreLead 13.9992 scoreSelfplay 16.7473 prior 0.0403575 lcb 0.962421 utilityLcb 0.954908 isSymmetryOf C4 order 14 pv Q3 Q16 D17 info move D3 visits 6 utility 1.03876 winrate 0.992369 scoreMean 13.9992 scoreStdev 16.0093 scoreLead 13.9992 scoreSelfplay 16.7473 prior 0.0403575 lcb 0.962421 utilityLcb 0.954908 isSymmetryOf C4 order 15 pv D3 D16 Q17 info move D5 visits 6 utility 1.0397 winrate 0.992557 scoreMean 13.6523 scoreStdev 16.244 scoreLead 13.6523 scoreSelfplay 16.5357 prior 0.0145553 lcb 0.966084 utilityLcb 0.965578 order 16 pv D5 C3 E3 info move D15 visits 6 utility 1.0397 winrate 0.992557 scoreMean 13.6523 scoreStdev 16.244 scoreLead 13.6523 scoreSelfplay 16.5357 prior 0.0145553 lcb 0.966084 utilityLcb 0.965578 isSymmetryOf D5 order 17 pv D15 C17 E17 info move Q5 visits 6 utility 1.0397 winrate 0.992557 scoreMean 13.6523 scoreStdev 16.244 scoreLead 13.6523 scoreSelfplay 16.5357 prior 0.0145553 lcb 0.966084 utilityLcb 0.965578 isSymmetryOf D5 order 18 pv Q5 R3 P3 info move Q15 visits 6 utility 1.0397 winrate 0.992557 scoreMean 13.6523 scoreStdev 16.244 scoreLead 13.6523 scoreSelfplay 16.5357 prior 0.0145553 lcb 0.966084 utilityLcb 0.965578 isSymmetryOf D5 order 19 pv Q15 R17 P17 info move P16 visits 6 utility 1.0397 winrate 0.992557 scoreMean 13.6523 scoreStdev 16.244 scoreLead 13.6523 scoreSelfplay 16.5357 prior 0.0145553 lcb 0.966084 utilityLcb 0.965578 isSymmetryOf D5 order 20 pv P16 R17 R15 info move E16 visits 6 utility 1.0397 winrate 0.992557 scoreMean 13.6523 scoreStdev 16.244 scoreLead 13.6523 scoreSelfplay 16.5357 prior 0.0145553 lcb 0.966084 utilityLcb 0.965578 isSymmetryOf D5 order 21 pv E16 C17 C15 info move P4 visits 6 utility 1.0397 winrate 0.992557 scoreMean 13.6523 scoreStdev 16.244 scoreLead 13.6523 scoreSelfplay 16.5357 prior 0.0145553 lcb 0.966084 utilityLcb 0.965578 isSymmetryOf D5 order 22 pv P4 R3 R5 info move E4 visits 6 utility 1.0397 winrate 0.992557 scoreMean 13.6523 scoreStdev 16.244 scoreLead 13.6523 scoreSelfplay 16.5357 prior 0.0145553 lcb 0.966084 utilityLcb 0.965578 isSymmetryOf D5 order 23 pv E4 C3 C5 info move C5 visits 5 utility 1.03658 winrate 0.991834 scoreMean 14.022 scoreStdev 16.028 scoreLead 14.022 scoreSelfplay 16.5416 prior 0.0108768 lcb 0.950179 utilityLcb 0.919942 order 24 pv C5 Q4 Q16 info move C15 visits 5 utility 1.03658 winrate 0.991834 scoreMean 14.022 scoreStdev 16.028 scoreLead 14.022 scoreSelfplay 16.5416 prior 0.0108768 lcb 0.950179 utilityLcb 0.919942 isSymmetryOf C5 order 25 pv C15 Q16 Q4 info move R5 visits 5 utility 1.03658 winrate 0.991834 scoreMean 14.022 scoreStdev 16.028 scoreLead 14.022 scoreSelfplay 16.5416 prior 0.0108768 lcb 0.950179 utilityLcb 0.919942 isSymmetryOf C5 order 26 pv R5 D4 D16 info move R15 visits 5 utility 1.03658 winrate 0.991834 scoreMean 14.022 scoreStdev 16.028 scoreLead 14.022 scoreSelfplay 16.5416 prior 0.0108768 lcb 0.950179 utilityLcb 0.919942 isSymmetryOf C5 order 27 pv R15 D16 D4 info move P17 visits 5 utility 1.03658 winrate 0.991834 scoreMean 14.022 scoreStdev 16.028 scoreLead 14.022 scoreSelfplay 16.5416 prior 0.0108768 lcb 0.950179 utilityLcb 0.919942 isSymmetryOf C5 order 28 pv P17 Q4 D4 info move E17 visits 5 utility 1.03658 winrate 0.991834 scoreMean 14.022 scoreStdev 16.028 scoreLead 14.022 scoreSelfplay 16.5416 prior 0.0108768 lcb 0.950179 utilityLcb 0.919942 isSymmetryOf C5 order 29 pv E17 D4 Q4 info move P3 visits 5 utility 1.03658 winrate 0.991834 scoreMean 14.022 scoreStdev 16.028 scoreLead 14.022 scoreSelfplay 16.5416 prior 0.0108768 lcb 0.950179 utilityLcb 0.919942 isSymmetryOf C5 order 30 pv P3 Q16 D16 info move E3 visits 5 utility 1.03658 winrate 0.991834 scoreMean 14.022 scoreStdev 16.028 scoreLead 14.022 scoreSelfplay 16.5416 prior 0.0108768 lcb 0.950179 utilityLcb 0.919942 isSymmetryOf C5 order 31 pv E3 D16 Q16 info move C6 visits 5 utility 1.01588 winrate 0.987974 scoreMean 12.5585 scoreStdev 16.9021 scoreLead 12.5585 scoreSelfplay 15.3843 prior 0.00368594 lcb 0.919743 utilityLcb 0.824837 order 32 pv C6 C4 D4 D3 info move C14 visits 5 utility 1.01588 winrate 0.987974 scoreMean 12.5585 scoreStdev 16.9021 scoreLead 12.5585 scoreSelfplay 15.3843 prior 0.00368594 lcb 0.919743 utilityLcb 0.824837 isSymmetryOf C6 order 33 pv C14 C16 D16 D17 info move R6 visits 5 utility 1.01588 winrate 0.987974 scoreMean 12.5585 scoreStdev 16.9021 scoreLead 12.5585 scoreSelfplay 15.3843 prior 0.00368594 lcb 0.919743 utilityLcb 0.824837 isSymmetryOf C6 order 34 pv R6 R4 Q4 Q3 info move R14 visits 5 utility 1.01588 winrate 0.987974 scoreMean 12.5585 scoreStdev 16.9021 scoreLead 12.5585 scoreSelfplay 15.3843 prior 0.00368594 lcb 0.919743 utilityLcb 0.824837 isSymmetryOf C6 order 35 pv R14 R16 Q16 Q17 info move O17 visits 5 utility 1.01588 winrate 0.987974 scoreMean 12.5585 scoreStdev 16.9021 scoreLead 12.5585 scoreSelfplay 15.3843 prior 0.00368594 lcb 0.919743 utilityLcb 0.824837 isSymmetryOf C6 order 36 pv O17 Q17 Q16 R16 info move F17 visits 5 utility 1.01588 winrate 0.987974 scoreMean 12.5585 scoreStdev 16.9021 scoreLead 12.5585 scoreSelfplay 15.3843 prior 0.00368594 lcb 0.919743 utilityLcb 0.82483";

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
const unknownCommandTag = "unknown command";

const myEngineSettings = { // priority in this order
    isChooseWorstMove : "yes", // worst move above threshold
    isChooseBestMove : "yes",
    isChooseRandomMove : "yes",

    loss_limit : 2, // "accepted" loss threshold

    preferShape : null, //"keima", "tobi", "hane", "cut", "crosscut", "nobi", "kosumi"

    isTenuki : "yes", // favors playing as far as possible from last move

    isInfluencial: "yes", // prefers line 4 and above
    isTerritorial: "yes", // prefers line 3 and below

    isDistantMove: "yes", // prefers distant moves
    isContactMove: "no" // prefers contact moves
};
const myEngineSettingNames = [ // priority in this order
    "isChooseRandomMove",
    "isChooseBestMove",
    "isChooseWorstMove", // worst move above threshold

    "loss_limit",

    // move preferences
    "preferShape", //"keima", "tobi", "hane", "cut", "crosscut", "nobi", "kosumi"

    "isTenuki", // favors playing as far as possible from last move

    "isInfluencial", // prefers line 4 and above
    "isTerritorial", // prefers line 3 and below

    "isDistantMove", // prefers distant moves
    "isContactMove" // prefers contact moves
];

const chooseKataMove = (kataMoves) => {
    let kata_filtered_moves = kataMoves.filter(oneMove => kataMoves[0][1]-myEngineSettings.loss_limit < oneMove[1]).sort((moveA, moveB)=>(moveB[1]-moveA[1]))

    console.log("chooseKataMove: before ("+kata_filtered_moves.length+")", kata_filtered_moves);
    let currentChoice = null;
    let settingIdx = 4;
    while(kata_filtered_moves.length >1 && settingIdx<myEngineSettingNames.length) {
        currentChoice = pickKataMoveByIdx(kata_filtered_moves)
        const settingName = myEngineSettingNames[settingIdx];
        if(myEngineSettings[settingName] && myEngineSettings[settingName] !== "no") {
            //console.log("chooseKataMove: "+settingName+"("+kata_filtered_moves.length+")", currentChoice[0])
            switch (settingName) {
                case "preferShape": //"keima", "tobi", "hane", "cut", "crosscut", "nobi", "kosumi"}
                    break;
                case "isTenuki": // favors playing as far as possible from last move

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
                    break;
                case "isContactMove": // prefers contact moves
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


const copyGenMoveOrAnalyze = (engineResp)=>{
    if(engineResp && engineResp.length && engineResp.indexOf(unknownCommandTag)>=0) {
        currentRes.status(400).send(null);
    } else if(engineResp && engineResp.length && engineResp.replaceAll('=','').replaceAll('\n','').trim().length){
        let returnedValue = engineResp.indexOf(visitsTag)>0 ? parseKataAnalyze(engineResp): [[engineResp.replaceAll('=','').replaceAll('\n','').trim(),1,100]];
        returnedValue = chooseKataMove(returnedValue);
        //console.log('final response1 #'+JSON.stringify(returnedValue)+'#')
        currentRes.status(200).send(returnedValue[0][0]);
        child && child.stdin && child.stdin.write("\n");
        currentRes = null;
    } else if (engineResp && engineResp.length && engineResp === "= \n\n"){
        currentRes.status(200).send(engineResp);
    } else {
        console.log('temporary response &'+engineResp+"&")
    }

}

const currentBehaviour = copyGenMoveOrAnalyze;

const resetEngine = () => {
    console.log('resetEngine');
    result = '';
    isEngineOn = true;
    isEngineStarting = true;
    child = exec(engineStartCmd);
    child.stdout.on('data', function(data) {
        //result += data;
        //console.log('stdout: (',""+!!currentRes,')',data && data.length /*&& (data.length > 50 ? data.length : data)*/);
        if(currentRes && !isEngineStarting) {
            //currentRes.write(data);
            currentBehaviour(data)
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
        if(data && data.indexOf('GTP ready, beginning main protocol loop')>=0) {
            console.log('Engine is READY Err')

            currentSGF = null;
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
  console.log('middlewarez');
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
            }
        } else {
            let currentGame = currentSGF ? sgf.parse(currentSGF) : sgfutils.getEmptySGF();

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
        currentRes = res;
        child.stdin.write(cmd);
    } else {
        console.log('but engine was dead ', isEngineOn, !!child );
        res.status(400).send('DEAD');
    }


})

router.route('/parseKata').post((req, res) => {
    res.status(200).send(parseKataAnalyze(kata_analyze_sample));
});
router.route('/testDelta').post((req, res) => {
    const body = { ...req.body};
    //currentSGF   = null; // start with clear
    //currentSGF   = "(;GM[1]FF[4]CA[UTF-8]KM[7.5]SZ[19])";  // start with target first move
    //currentSGF = "(;GM[1]FF[4]CA[UTF-8]KM[7.5]SZ[19];B[pd];W[qc];B[qd];W[pc];B[oc];W[ob])";
    currentSGF = "(;GM[1]FF[4]CA[UTF-8]KM[7.5]SZ[19];B[pd];W[qc];B[qd];W[pc];B[oc];W[ob];B[nc])";

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