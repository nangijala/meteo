/**
 * Parameter:
----------
                         Einheit                  Beschreibung
2 tre200s0                 °C                       Lufttemperatur 2 m über Boden; Momentanwert
3 sre000z0                 min                      Sonnenscheindauer; Zehnminutensumme
4 rre150z0                 mm                       Niederschlag; Zehnminutensumme
5 dkl010z0                 °                        Windrichtung; Zehnminutenmittel
6 fu3010z0                 km/h                     Windgeschwindigkeit; Zehnminutenmittel
7 pp0qnhs0                 hPa                      Luftdruck reduziert auf Meeresniveau mit Standardatmosphäre (QNH); Momentanwert
8 fu3010z1                 km/h                     Böenspitze (Sekundenböe); Maximum
9 ure200s0                 %                        Relative Luftfeuchtigkeit 2 m über Boden; Momentanwert
10 prestas0                 hPa                      Luftdruck auf Stationshöhe (QFE); Momentanwert
11 pp0qffs0                 hPa                      Luftdruck reduziert auf Meeresniveau (QFF); Momentanwert

 
 'stn|time|tre200s0|sre000z0|rre150z0|dkl010z0|fu3010z0|pp0qnhs0|fu3010z1|ure200s0|prestas0|pp0qffs0'

[ 'LEI',
  '201705191550',
  '9.3',
  '0',
  '0.0',
  '249',
  '9.4',
  '1019.2',
  '16.9',
  '89',
  '978.5',
  '1019.6' ]

 */

var moment = require('moment');
const fs = require('fs')
const request = require("request");
const dotconf = require("./config");
const child_process = require('child_process')

var colData = []
const fileName = '/mnt/RAMDisk/data.json'
if( fs.existsSync(fileName)){
    colData = require(fileName)
}else{
    fs.writeFileSync(fileName, JSON.stringify(colData))
}

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
    colData.push(d)    
    fs.writeFileSync(fileName, JSON.stringify(colData))
});


