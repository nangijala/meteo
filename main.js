
var moment = require('moment');
const fs = require('fs')
const request = require("request");
const dotconf = require("./config");
const child_process = require('child_process')
var sensor = require('node-dht-sensor');

const hasArg = process.argv.slice(2).length

var colData = []

const ramPath = '/mnt/RAMDisk/'
const smbPath = '/mnt/SMBDisk/meteo/'

const fileName = ramPath + 'data.json'
if( fs.existsSync(fileName)){
    colData = require(fileName)
}else{
    fs.writeFileSync(fileName, JSON.stringify(colData))
}

const dayFile = ramPath . moment().format('YYYY-MM-DD') + '.json'

class WetterDaten{
    constructor( f ){
        // this.time = f[1]
        this.air = f[2]
        this.sun = f[3]
        this.rain = f[4]
        this.windd = f[5]
        this.winds = f[6]
        this.windm = f[8]  
        this.humidity = f[9]
        this.airp1 = f[7]
        this.airp2 = f[10]
        this.airp3 = f[11]
        this.created = moment().format()
    }
}

var ldrObj=child_process.spawnSync('./ldr.py') 
var ldr=parseInt( ldrObj.stdout.toString() )

function saveDayFile(d){
    const smbDayFile = smbPath + dayFile;
    var dayData = []
    if( fs.existsSync(smbDayFile) ){
        dayData = require(smbDayFile)
    }
    var ts = moment(d.created)
    const hour = ts.format('H')
    const minute = ts.format('m')
    dayData[hour][minute] = d
    fs.writeFileSync(smbDayFile, JSON.stringify(dayData))
}

request.get(dotconf.metnet, function (r, data) {
    const lines = data.body.split('\n');
    const st = lines.filter((l) => { return l.match(/^LEI/); });
    var d = new WetterDaten( st.pop().split("|") )
    const sensorPath= "/sys/bus/w1/devices/w1_bus_master1/28-03168acbaeff/w1_slave"
    if( fs.existsSync( sensorPath )){
        const innen = parseFloat( fs.readFileSync(sensorPath).toString().split('\n')[1].split('=')[1]/1000 ).toFixed(1)
        d.innen = innen 
    }
    d.ldr = ldr
    var p = new Promise( (resolve, reject) => {
        sensor.read(11, 27, function(err, temperature, humidity) {
            if(err)
                resolve(0)
            resolve( humidity.toFixed(1) )
        })
    })
    .then( (va) => {
        d.hum = va
        colData.push(d)    
        fs.writeFileSync(fileName, JSON.stringify(colData))
        saveDayFile(d)
    },
    (va) => { }
    )
});


