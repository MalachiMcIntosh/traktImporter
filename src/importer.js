const fs = require('fs')
var request = require('axios')
var papa = require('papaparse')
const { log, error } = require('console')


function main() {
  var argv = require('yargs/yargs')(process.argv.slice(2))
    .usage('Usage: $0 [options]')
    .example('$0 -c config.json -i import.csv', 'imports from import.csv using credentials in config.json')
    .alias('c', 'config')
    .nargs('c', 1)
    .alias('i', 'import')
    .nargs('i', 1)
    .describe('c', 'path to config (JSON) file.')
    .describe('i', 'path to import (CSV) file')
    .demandOption(['c', 'i'])
    .help('h')
    .alias('h', 'help')
    .argv
  // read config file, validate
  // var filePathConfig = 'config.json' // FOR DEV
  var filePathConfig = argv.config
  // importConfig(filePathConfig)

  // read csv file, validate
  // var filePathCSV = 'test/test.csv' // FOR DEV
  var filePathCSV = argv.import
  // var items = extractItemsFromCSVFile(filePathCSV)
  // auth to trakt
  // authenticateTrakt()

  // construct the payload
  // buildImportJSON(items)

  // import to watchlist
  // addToTraktWatchlist()
  // exit
}

// Build JSON object from CSV

// 2. iterate over JSON:
//        for each item 
//          check that it has IMDB or TMDB
//          if it does: add it to json object 
//          if it doesn't: searchTmdb(title, year)
function buildImportJSON(items) {
  for (let item of items) {
    // check has ID (imdb or tmdb)
    if (item.imdb != "" || item.tmdb != "") {
      log(item.imdb)
      log(item.tmdb)
    } else {
      log(searchTMDB(item.title, item.year, item.type))
    }
  }
}

// https://stackoverflow.com/a/74250003
function prompt(msg) {
  fs.writeSync(1, String(msg))
  let s = '', buf = Buffer.alloc(1)
  while (buf[0] - 10 && buf[0] - 13)
    s += buf, fs.readSync(0, buf, 0, 1, 0)
  return s.slice(1)
}

var trakt = {
  client_id: "",
  client_secret: "",
  access_token: "",
  refresh_token: "",
  device_code: ""
}

var tmdb = {
  api_read_access_token: ""
}

// CSV must have the following header. Empty lines will be stripped.
// title,year,imdb,tmdb,type
// type must be defined
function extractItemsFromCSVFile(filePath) {
  var config = {
    delimiter: ",",
    header: true
  }

  // read it
  var file = fs.readFileSync(filePath, 'utf8')

  // validate header
  const header = 'title,year,imdb,tmdb,type'
  if (!file.startsWith(header)) {
    error(`Error: Incorrect header for CSV import. Should be ${header}`)
    return 0
  }

  // strip empty lines. https://quickref.me/remove-empty-lines-of-a-text-document.html
  file = file.split(/\r?\n/).filter(line => line.trim() !== '').join('\n')

  // strip lines with no title,year,imdb,tmdb values.
  var regex = new RegExp('^,,,,\\w*$')
  file = file.split(/\r?\n/).filter(line => !line.match(regex)).join('\n')

  // strip lines with incorrect types.
  file = file.split(/\r?\n/).filter(line => (line.endsWith(',tv') || line.endsWith(',movie'))).join('\n')

  // strip lines with incorrect number of commas (4).
  file = file.split(/\r?\n/).filter(line => ((line.split(",").length - 1) == 4)).join('\n')

  // parse to JSON
  var objects = papa.parse(file, config)

  // validate size
  const recordCount = Object.keys(objects.data).length
  if (recordCount == 0) {
    error(`Error: CSV contains no records`)
    return 0
  } else {
    log(`recordCount ${recordCount}`)
  }

  log(objects.data)
  return objects.data
}

function importConfig(filePath) {
  //read it
  const file = fs.readFileSync(filePath, 'utf8')
  // parse to JSON
  var config = JSON.parse(file)
  trakt = config.trakt
  tmdb = config.tmdb
  // check for missing credentials
  if (trakt.client_id == "") {
    error('trakt client_id empty')
    return 0
  }
  if (trakt.client_secret == "") {
    error('trakt client_secret empty')
    return 0
  }
  if (tmdb.api_read_access_token == "") {
    error('tmdb api_read_access_token empty')
    return 0
  }
  return 1
}

async function authenticateTrakt(refresh = false) {
  // Flow: 
  // 1. Send Code
  // 2. Input Pin
  // 3. Get Token
  if (refresh) {
    log('refreshing') // TODO: refresh token flow
  } else {
    // Send Device Code
    trakt.device_code = await sendTraktDeviceCode()
    trakt.access_token = await getTraktAccessToken(device_code)
    log(`access_token ${access_token}`)
  }
}

async function sendTraktDeviceCode() {
  const device_code = await request({
    method: 'POST',
    url: 'https://api.trakt.tv/oauth/device/code',
    headers: {
      'Content-Type': 'application/json'
    },
    data: {
      client_id: trakt.client_id
    }
  }).then(function (response) {
    // log('Status:', response.status)
    // log('Headers:', response.headers)
    // log('Response:', response.data)
    const code = response.data.device_code
    const user_code = response.data.user_code
    if (user_code == null || user_code == "") {
      error('https://api.trakt.tv/oauth/device/code failed to return user code.')
      return 0
    }
    if (code == null || code == "") {
      error('https://api.trakt.tv/oauth/device/code failed to return device code.')
      return 0
    }
    log(`Navigate to https://trakt.tv/activate and input ${user_code}`)
    prompt("Click Enter when done.")

    return code
  })

  return device_code
}

// use device code to get token
async function getTraktAccessToken(device_code) {
  const access_token = await request({
    method: 'POST',
    url: 'https://api.trakt.tv/oauth/device/token',
    headers: {
      'Content-Type': 'application/json'
    },
    data: {
      code: device_code,
      client_id: trakt.client_id,
      client_secret: trakt.client_secret
    }
  }).then(function (response) {
    // log('Status:', response.status)
    // log('Headers:', response.headers)
    log('Response:', response.data)
    return response.data.access_token
  })
  return access_token
}

async function addToTraktWatchlist(object) {
  const token = await authenticateTrakt(false)
  await request({
    method: 'POST',
    url: 'https://api.trakt.tv/sync/watchlist',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'trakt-api-version': '2',
      'trakt-api-key': `${trakt.client_id}`
    },
    data: { movies: [{ ids: { tmdb: '556694' } }], tv: [] }
  }).then(function (response) {
    log('Status:', response.status)
    // log('Headers:', response.headers)
    // log('Response:', response.data)
    // return response.data.access_token
  })
  // return access_token
}


async function searchTMDB(title, year, type) {
  const options = {
    method: 'GET',
    url: `https://api.themoviedb.org/3/search/${type}`,
    params: { query: `${title}`, include_adult: 'false', language: 'en-US', page: '1', year: `${year}` },
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${tmdb.api_read_access_token}`
    }
  }

  const results = await request(options)
    .then(function (response) {
      log(response.data)
      return response.data
    })
    .catch(function (error) {
      error(error)
    })

  return results
}

module.exports = {
  extractItemsFromCSVFile,
  importConfig,
  main
}