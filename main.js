
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
/*
Parameters:
-----------
                                          Unit                                      Description
2:tre200s0                                  °C                                        Air temperature 2 m above ground; current value
3:rre150z0                                  mm                                        Precipitation; ten minutes total
4:sre000z0                                  min                                       Sunshine duration; ten minutes total
gre000z0                                  W/m²                                      Global radiation; ten minutes mean
ure200s0                                  %                                         Relative air humidity 2 m above ground; current value
tde200s0                                  °C                                        Dew point 2 m above ground; current value
dkl010z0                                  °                                         Wind direction; ten minutes mean
9:fu3010z0                                  km/h                                      Wind speed; ten minutes mean
10:fu3010z1                                  km/h                                      Gust peak (one second); maximum
prestas0                                  hPa                                       Pressure at station level (QFE); current value
pp0qffs0                                  hPa                                       Pressure reduced to sea level (QFF); current value
pp0qnhs0                                  hPa                                       Pressure reduced to sea level according to standard atmosphere (QNH); current value
ppz850s0                                  gpm                                       geopotential height of the 850 hPa-surface; current value
ppz700s0                                  gpm                                       geopotential height of the 700 hPa-surface; current value
dv1towz0                                  °                                         Wind direction vectoriel; ten minutes interval; tool 1 
fu3towz0                                  km/h                                      Wind speed tower; ten minutes mean
fu3towz1                                  km/h                                      Gust peak (one second) tower; maximum
ta1tows0                                  °C                                        Air temperature tool 1
uretows0                                  %                                         Relative air humidity tower; current value
tdetows0                                  °C                                        Dew point tower

LEI;202002132040;4.3;0.3;0;4;97;3.8;161;1.4;3.2;969.0;1010.4;1009.3;-;-;-;-;-;-;-;-

*/
class WetterDaten{
    constructor( f ){
        // this.time = f[1]
        this.air = f[2]
        this.sun = f[4]
        this.rain = f[3]
        this.windd = f[5]
        this.winds = f[9]
        this.windm = f[10]  
        this.humidity = f[6]
        this.airp1 = f[11]
        this.airp2 = f[12]
        this.airp3 = f[13]
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
    var d = new WetterDaten( st.pop().split(";") )
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

        var url = `${dotconf.vz.url}${dotconf.vz.druck}.json?operation=add&value=${d.airp2}`
        request.post( {url},  function (error, response, body){ /* console.log( body ) */ })

        var url = `${dotconf.vz.url}${dotconf.vz.winds}.json?operation=add&value=${d.winds}`
        request.post( {url},  function (error, response, body){ /* console.log( body ) */ })

        var url = `${dotconf.vz.url}${dotconf.vz.windm}.json?operation=add&value=${d.windm}`
        request.post( {url},  function (error, response, body){  /* console.log( body ) */ })

        var url = `${dotconf.vz.url}${dotconf.vz.sun}.json?operation=add&value=${d.sun}`
        request.post( {url},  function (error, response, body){  /* console.log( body ) */ })

//	console.log(d)

    },
    (va) => { }
    )
});


