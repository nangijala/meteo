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

const request = require("request");
const mongoose = require("mongoose");
const dotconf = require("./config");

mongoose.Promise = global.Promise
mongoose.connect(dotconf.dburi);

var wetterSchema = mongoose.Schema({
    time: String,
    air : String,
    sun : String,
    rain : String,
    winds : String,
    windd : String,
    windm : String,
    humidity : String,
    airp1 : String,
    airp2 : String,
    airp3 : String,
    created : Date    
});

wetterSchema.methods.initWithArray = function(f){
    this.time = f[1]
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
    this.created = new Date()
}

var db = mongoose.connection
var WetterDaten = db.model('lei',wetterSchema)

db.once('open', () => { console.log('Connected')})


request.get(dotconf.metnet, function (r, data) {
    const lines = data.body.split('\n');
    const st = lines.filter((l) => { return l.match(/^LEI/); });
    var d = new WetterDaten
    d.initWithArray(st.pop().split('|'))
    WetterDaten.findOne({time:d.time}, 'time air')
    .then(function(obj){
        if( obj ){
           db.close()
	   return 1;
        }
        else{
            d.save().then(function(){  db.close() ; return 0})   
        }
    })  
});


