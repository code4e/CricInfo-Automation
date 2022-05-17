// this project extracts info from worldcup 2019 from cricinfo that in the form of excel and psf scorecards
// node cricinfoextractor.js --excel=WordCup.csv --dataFolder=data --source=https://www.espncricinfo.com/series/icc-cricket-world-cup-2019-1144415/match-results 

let minimist = require('minimist');
let axios = require('axios');
let jsdom = require('jsdom');
const { JSDOM } = jsdom;
let excel4node = require('excel4node');
let psf = require('pdf-lib');
const res = require('express/lib/response');

let args = minimist(process.argv);


//download data from the site using axios in json
let responsePromise = axios.get(args.source);
responsePromise.then(function(response) {
    let html = response.data;
    const { document } = (new JSDOM(html)).window;
    // console.log(document.title);
    let matchInfo = document.querySelectorAll('div.ds-px-4');
    console.log(matchInfo);
}).catch(err => console.log(err));

//read json

console.log(args.source);
console.log(args.excel);
console.log(args.dataFolder);
