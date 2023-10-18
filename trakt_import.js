const fs = require('fs');
var request = require('axios');
var papa = require('papaparse');
const { log, error } = require('console');

// main function
function main(){
// parse args
  
  // read csv file, validate 
  // var filePathCSV = prompt('Input CSV import file path (or filename if in current directory) here: ');
  // var items = extractItemsFromCSVFile(filePath); // DONE

  // read config file, validate
  // var filePathConfig = prompt('Input config file path (or filename if in current directory) here: ');
  // importConfig(filePathConfig);  DONE

  // auth to trakt
  // authenticateTrakt() // DONE

  // construct the payload
  buildImportJSON(items);

  // import to watchlist
  // addToTraktWatchlist()
  // exit
}
main();

 // Build JSON object from CSV

  // 2. iterate over JSON:
  //        for each item 
  //          check that it has IMDB or TMDB
  //          if it does: add it to json object 
  //          if it doesn't: searchTmdb(title, year)
function buildImportJSON(items){
  for(let item of items){
    // check has ID (imdb or tmdb)
    if(item.imdb!="" || item.tmdb!=""){
      log(item.imdb);
      log(item.tmdb);
    } else {
      log(searchTMDB(item.title, item.year, item.type));
    }
  }


}

// https://stackoverflow.com/a/74250003
function prompt(msg) {
  fs.writeSync(1, String(msg));
  let s = '', buf = Buffer.alloc(1);
  while (buf[0] - 10 && buf[0] - 13)
    s += buf, fs.readSync(0, buf, 0, 1, 0);
  return s.slice(1);
};


var trakt = {
  client_id: "",
  client_secret: "",
  access_token: "",
  refresh_token: ""
};

var tmdb = {
  api_key: "",
  api_read_access_token: "",
  access_token: "",
  refresh_token: ""
};

// CSV must have the following header. Empty lines will be stripped.
// title,year,imdb,tmdb,type
// type must be defined
function extractItemsFromCSVFile(filePath) {
  var config = {
    delimiter: ",",
    header: true
  };

  //read it
  var file = fs.readFileSync(filePath, 'utf8');

  // validate header
  const header = 'title,year,imdb,tmdb,type';
  if (!file.startsWith(header)) {
    error(`Error: Incorrect header for CSV import. Should be ${header}`);
    return 0;
  }

  // strip empty lines. https://quickref.me/remove-empty-lines-of-a-text-document.html
  file = file.split(/\r?\n/).filter(line => line.trim() !== '').join('\n');

  // strip lines with no values.
  var regex = new RegExp('^,,,,\\w*$');
  file = file.split(/\r?\n/).filter(line => !line.match(regex)).join('\n');

  // strip lines with incorrect types.
  file = file.split(/\r?\n/).filter(line => (line.endsWith(',tv') || line.endsWith(',movie')) ).join('\n');
  
  // strip lines with incorrect number of commas (4).
  file = file.split(/\r?\n/).filter(line => ((line.split(",").length - 1)==4) ).join('\n');

  // parse to JSON
  var objects = papa.parse(file, config);

  // validate size
  if (Object.keys(objects.data).length == 0) {
    error(`Error: CSV contains no records`);
    return 0;
  }

  // log(objects.data);
  return objects.data;
}



function importConfig(filePath) {
  //read it
  const file = fs.readFileSync(filePath, 'utf8');
  // parse to JSON
  var config = JSON.parse(file);
  trakt = config.trakt;
  tmdb = config.tmdb;
  // check for missing credentials
  if (trakt.client_id == "") {
    error('trakt client_id empty');
    return 0;
  }
  if (trakt.client_secret == "") {
    error('trakt client_secret empty');
    return 0;
  }
  if (tmdb.api_key == "") {
    error('trakt api_key empty');
    return 0;
  }
  if (tmdb.api_read_access_token == "") {
    error('trakt api_read_access_token empty');
    return 0;
  }
  return 1;
}



var device_code = null;
var user_code = null;


async function authenticateTrakt(refresh = false) {
  // Flow: 
  // 1. Send Code
  // 2. Input Pin
  // 3. Get Token
  if (refresh) {
    log('refreshing'); // TODO: refresh token flow
  } else {
    // Send Device Code
    device_code = await sendTraktDeviceCode();
    trakt.access_token = await getTraktAccessToken(device_code);
    log(`access_token ${access_token}`);
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
    // log('Status:', response.status);
    // log('Headers:', response.headers);
    // log('Response:', response.data);
    code = response.data.device_code;
    user_code = response.data.user_code;
    // log(`user_code ${user_code}`);
    log(`Navigate to https://trakt.tv/activate and input ${user_code}`);
    prompt("Click Enter when done.");

    return code;
  })
  // log('user_code:', user_code);
  return device_code;
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
    // log('Status:', response.status);
    // log('Headers:', response.headers);
    log('Response:', response.data);
    return response.data.access_token;
  })
  return access_token;
}

async function addToTraktWatchlist(object) {
  const token = await authenticateTrakt(false);
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
    log('Status:', response.status);
    // log('Headers:', response.headers);
    // log('Response:', response.data);
    // return response.data.access_token;
  })
  // return access_token;
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
  };

  const results = await request(options)
    .then(function (response) {
      log(response.data);
      return response.data;
    })
    .catch(function (error) {
      error(error);
    });

    return results;
}


module.exports = { extractItemsFromCSVFile, importConfig, searchTMDB, addToTraktWatchlist, getTraktAccessToken};