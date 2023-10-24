# Trakt Watchlist Importer

## Purpose
Import Movies or TV Shows from CSV file into your Trakt.tv Watchlist.
If you don't know the TMDB or IMDB id the application will search for you and provide options.

## Requirements
Node.js v18+

### Trakt OAuth
* Create a [Trakt.tv app](https://trakt.tv/oauth/applications) and copy your ``client_id`` and ``client_secret`` into the [config file](#trakt).

### TMDB API Key
* Create a [TMDB app](https://www.themoviedb.org/settings/api) for your TMDB account, and add the ``API Read Access Token`` into the [config file](#tmdb).

## Configuration File

### Trakt 
 * ``client_id``: To interact with Trakt API, retrieve it from https://trakt.tv/oauth/applications 
 * ``client_secret``: To interact with Trakt API, retrieve it from  https://trakt.tv/oauth/applications
 * ``access_token``: Created by app at runtime
 * ``refresh_token``: Created by app at runtime
 * ``device_code``: Created by app at runtime

### TMDB
 * ``api_read_access_token``: To interact with TMDB API, retrieve it from https://www.themoviedb.org/settings/api

### Example
```
{
    "trakt": {
        "client_id": "Add your client_id here",
        "client_secret": "Add your client_secret here",
        "access_token": "This is generated at runtime",
        "refresh_token": "This is generated at runtime",
        "device_code": "This is generated at runtime"
    },
    "tmdb": {
        "api_read_access_token": "Add your api_read_access_token here"
    }
}
```

## Import File
Header line format must be 'title,year,imdb,tmdb,type'
title: Movie or TV Title (optional)
year: Movie or TV release year (optional)
imdb: imdb ID (optional - recommended)
tmdb: tmdb ID (optional - recommended)
type: [movie|tv] (mandatory)
```
title,year,imdb,tmdb,type
Boardwalk Empire,,,,tv
Creed,2015,,,movie
,,,556694,movie
```

## Usage
```text
Usage: trakt_import.js [options]

Options:
      --version  Show version number                                   [boolean]
  -c, --config   path to config (JSON) file.                          [required]
  -i, --import   path to import (CSV) file                            [required]
  -h, --help     Show help                                             [boolean]

Examples:
  trakt_import.js -c config.json -i         imports from import.csv using
  import.csv                                credentials in config.json
```

## Support
To get support, please create new [issue](https://github.com/MalachiMcintosh/traktImporter/issues)

## Contribution
Happy to accept pull requests.

## Licence
This script is free software:  you can redistribute it and/or  modify  it under  the  terms  of the  GNU  General  Public License  as published by the Free Software Foundation.

This program is distributed in the hope  that it will be  useful, but WITHOUT ANY WARRANTY; without even the  implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

See <http://www.gnu.org/licenses/gpl.html>.
