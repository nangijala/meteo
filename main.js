
var moment = require('moment');
const fs = require('fs')
const request = require("request");
const dotconf = require("./config");
const sensor = require('node-dht-sensor');

const hasArg = process.argv.slice(2).length

var colData = []

const ramPath = '/mnt/RAMDisk/'
const smbPath = '/mnt/SMBDisk/meteo/'

const fileName = ramPath + 'data.json'
const smbFileName = smbPath + 'data.json'

if( fs.existsSync(fileName)){
    colData = require(fileName)
}else{
    if( fs.existsSync(smbFileName)){
        fs.copyFileSync( smbFileName, fileName)
    }
    colData = require(fileName)    
    fs.writeFileSync(fileName, JSON.stringify(colData))
}

const dayFile = smbPath + moment().format('YYYY-MM-DD') + '.json'

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


function saveDayFile(d){
    var dayData = {}
    if( fs.existsSync(dayFile) ){
        dayData = require(dayFile)
    }
    var ts = moment(d.created)
    const hour = ts.format('H')
    const minute = ts.format('m')
	//console.log( hour, minute, ts)
	if( !dayData.hasOwnProperty( hour ) )
		dayData[hour] = []
    	dayData[hour].push( d )
    fs.writeFileSync(dayFile, JSON.stringify(dayData))
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
    d.ldr = null
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
        if( colData.length > 600)
            colData.shift(1)
        fs.writeFileSync(fileName, JSON.stringify(colData))
        fs.writeFileSync(smbFileName, JSON.stringify(colData))        
        saveDayFile(d)
        var url = `${dotconf.vz.url}${dotconf.vz.temp}.json?operation=add&value=${d.air}`
        request.post( {url},  function (error, response, body){ /* console.log( body ) */ })

    },
    (va) => { }
    )
});


