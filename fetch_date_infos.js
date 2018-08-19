const dotconf = require("./config")
var moment = require("moment")
var request = require("request")
const fs = require('fs')
const os = require('os')

/*
{ results:
   { sunrise: '2018-05-17T03:46:43+00:00',
     sunset: '2018-05-17T19:00:41+00:00',
     solar_noon: '2018-05-17T11:23:42+00:00',
     day_length: 54838,
     civil_twilight_begin: '2018-05-17T03:09:44+00:00',
     civil_twilight_end: '2018-05-17T19:37:40+00:00',
     nautical_twilight_begin: '2018-05-17T02:21:19+00:00',
     nautical_twilight_end: '2018-05-17T20:26:05+00:00',
     astronomical_twilight_begin: '2018-05-17T01:20:15+00:00',
     astronomical_twilight_end: '2018-05-17T21:27:09+00:00' },
  status: 'OK' }
}
*/

var arguments = process.argv.slice(2)

var processDate =  arguments.length ? moment(arguments[0]) : moment()
if( processDate.isValid() === false){   
    process.exit(1)
}

const processingDay = processDate.format("DDD") - 123
const smbPath =  os.platform() === "darwin" ? dotconf.testPath  : dotconf.livePath
const dayFile = smbPath + processDate.format('YYYY-MM-DD') + '.json'
var url = `https://api.sunrise-sunset.org/json?lat=${dotconf.lat}&lng=${dotconf.lng}&date=${processDate.format("YYYY-MM-DD")}&formatted=0`

request({
    url: url,
    json: false
}, function (error, response, body) {

    if (!error && response.statusCode === 200) {
         var j = JSON.parse( body  )
         var srise = moment( j.results.sunrise)
         var sset = moment( j.results.sunset)
         var dayLength = j.results.day_length
         var duration = moment.duration(dayLength, "seconds")
//         console.log( srise.format("HH:mm:ss") , sset.format("HH:mm:ss"), duration.hours(), duration.minutes(), dayFile )

         var dayData = require(dayFile)
         dayData.day = {    sunrise: srise.format("HH:mm:ss"), 
                            sunset: sset.format("HH:mm:ss"), 
                            hours: duration.hours(), 
                            minutes:duration.minutes() 
                        }
         fs.writeFileSync(dayFile, JSON.stringify(dayData))

    }
})