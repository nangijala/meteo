const dotconf = require("./config")
var moment = require('moment')
const fs = require('fs')
const os = require('os')

const readline = require('readline');
const {google} = require('googleapis');
const OAuth2Client = google.auth.OAuth2;
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_PATH = 'credentials.json';

var arguments = process.argv.slice(2)

var processDate =  arguments.length ? moment(arguments[0]) : moment().subtract(1, 'days')
if( processDate.isValid() === false){   
    process.exit(1)
}

// console.log( processDate, " ROWNR=", processDate.format("DDD") - 125 )
const processingDay = processDate.format("DDD") - 123
const smbPath =  os.platform() === "darwin" ? dotconf.testPath  : dotconf.livePath
const dayFile = smbPath + processDate.format('YYYY-MM-DD') + '.json'

// console.log( os.platform(), dayFile, getData(dayFile))


function getData( dayFile ){

    if( !fs.existsSync(dayFile))
        return false

    var dayData = require(dayFile)

    var totalRain = 0.0
    var totalSunMinutes = 0
    var totalTempAvg = 0.0
    var allDayTemps = []
    for( var i = 0; i<= 23; i++){

        var hourData = dayData[i]
        if( typeof hourData === "undefined" )
            continue

        var hourAir = hourData.map( (v) => { return Number( v['air']) }).filter((v) => !isNaN(v))
        var hourAirAgv = hourAir.reduce( (sum, current) =>  {return sum+current} ) / hourAir.length
        if( !isNaN( hourAirAgv)){
            allDayTemps.push( hourAirAgv)
            totalTempAvg = allDayTemps.reduce( (sum,current) => sum+current) / (allDayTemps.length == 0 ? 1 : allDayTemps.length)
        }

        // console.log( `Temperaturen: ${hourAir} Durchschnitt/h: ${hourAirAgv.toFixed(1)} Durchschnitt/tag: ${totalTempAvg.toFixed(1)}`)

        var hourRain = hourData.map( (v) =>   isNaN( Number( v['rain'])) ? 0.0 :Number( v['rain'])  )
        var hourRainSum = hourRain.reduce( (rainAcc, current) => { return rainAcc + (isNaN(current) ? 0 :current) }).toFixed(1)
        totalRain += parseFloat( hourRainSum)
    //    console.log( `Regenmenge: ${hourRain} Total/h: ${hourRainSum} Total/Day: ${totalRain.toFixed(1)}`)


        var hourSun = hourData.map( (v) =>  isNaN( Number( v['sun'])) ? 0 :Number( v['sun'])  )
        var hourSunSum = hourSun.reduce( (sunAcc, current) => { return sunAcc + (isNaN(current) ? 0 :current) }).toFixed(1)
        totalSunMinutes +=  Number(hourSunSum)
    //    console.log( `Sonne: ${hourSun} Total/h: ${hourSunSum}  ${totalSunMinutes}`)

    }
    return [[Number(totalTempAvg.toFixed(1)) , Number(totalRain.toFixed(1)), totalSunMinutes]]
}




// Load client secrets from a local file.
fs.readFile('client_secret.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Sheets API.
    authorize(JSON.parse(content), updateSheet);
  });
  
  /**
   * Create an OAuth2 client with the given credentials, and then execute the
   * given callback function.
   * @param {Object} credentials The authorization client credentials.
   * @param {function} callback The callback to call with the authorized client.
   */
  function authorize(credentials, callback) {
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new OAuth2Client(client_id, client_secret, redirect_uris[0]);
  
    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
      if (err) return getNewToken(oAuth2Client, callback);
      oAuth2Client.setCredentials(JSON.parse(token));
      callback(oAuth2Client);
    });
  }
  
  /**
   * Get and store new token after prompting for user authorization, and then
   * execute the given callback with the authorized OAuth2 client.
   * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
   * @param {getEventsCallback} callback The callback for the authorized client.
   */
  function getNewToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) return callback(err);
        oAuth2Client.setCredentials(token);
        // Store the token to disk for later program executions
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
          if (err) console.error(err);
          console.log('Token stored to', TOKEN_PATH);
        });
        callback(oAuth2Client);
      });
    });
  }
  
  /**
   * @param {OAuth2Client} auth The authenticated Google OAuth client.
   */
  function updateSheet(auth) {
    const sheets = google.sheets({version: 'v4', auth});
    
    var body = {
      values: getData(dayFile)
    };
    sheets.spreadsheets.values.update({
      spreadsheetId: dotconf.sheetId,
      range: `${processDate.format('YYYY')}!J${processingDay}`,
      valueInputOption: 'USER_ENTERED',
      includeValuesInResponse: false,
      resource: body
    }, function(err, result) {
      if(err) {
        // Handle error
        console.log(err);
      } 
    });
  
  }