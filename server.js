// server.js
var  express = require('express');
var  bodyParser = require('body-parser');
var  cors = require('cors');
var  app = express();
var  router = express.Router();
var sgf = require('smartgame');
var sgfutils  = require('./utils');

var exec = require('child_process').exec;
var isEngineOn = false;
var currentRes = null;
var result = '';
var child = null;
// C:\Users\yamak\.katrain\katago-v1.7.0-gpu-opencl-windows-x64.exe gtp -model C:\Users\yamak\.katrain\g170-b40c256x2-s5095420928-d1229425124.bin.gz -config C:\Users\yamak\.katrain\fast_analysis_config.cfg
//const engineStartCmd = 'C:\\Users\\yamak\\.katrain\\katago-v1.7.0-gpu-opencl-windows-x64.exe gtp -model C:\\Users\\yamak\\.katrain\\g170-b40c256x2-s5095420928-d1229425124.bin.gz -config C:\\Users\\yamak\\.katrain\\fast_analysis_config.cfg';
const engineStartCmd = '/Users/jeff/Documents/homebrew/bin/katago gtp -model /Users/jeff/Documents/go/kata1-b40c256-s11840935168-d2898845681.bin.gz -config /Users/jeff/Documents/homebrew/Cellar/katago/1.11.0/share/katago/configs/gtp_example.cfg';

const resetEngine = () => {
    console.log('resetEngine');
    result = '';
    isEngineOn = true;
    isEngineStarting = true;
    child = exec(engineStartCmd);
    child.stdout.on('data', function(data) {
        //result += data;
        console.log('stdout: ',data && data.length);
        if(currentRes)
            currentRes.write(data);
        if(data && data.indexOf('GTP ready, beginning main protocol loop')>=0) {
            console.log('Engine is READY')
            isEngineStarting = false;
        }
    });
    child.stderr.on('data', function(data) {
        //result += data;
        console.log('stderr: ',data && data.length)
        if(data && data.indexOf('GTP ready, beginning main protocol loop')>=0) {
            console.log('Engine is READY Err')
            isEngineStarting = false;
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
    } else if (isEngineOn && child && child.stdin) {
        console.log('send cmd to engine: #', body.cmd, "#");
        currentRes = res;
        child.stdin.write(body.cmd);
    } else {
        console.log('but engine was dead ', isEngineOn, !!child );
    }


})

  
var  port = process.env.PORT || 8090;
app.listen(port);
console.log('Order API is runnning at ' + port);