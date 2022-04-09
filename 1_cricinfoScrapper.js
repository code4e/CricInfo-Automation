//require the neccessary packages
let minimist = require("minimist");
let fs = require("fs");
let axios = require("axios");
let excel = require("excel4node");
const {
    PDFDocument
} = require('pdf-lib');
let path = require("path");
let jsdom = require("jsdom");
const {
    match
} = require("assert");
const {
    clear
} = require("console");
const {
    createPDFAcroFields
} = require("pdf-lib");

let args = minimist(process.argv);
// node 1_cricinfoScrapper.js --source=https://www.icc-cricket.com/cricket-world-cup/fixtures --excel=Worldcup.xlsx --worldCupFolder=WorldCup --template=Template.pdf
//downlaod the data from cricinfo site

let matches = [];

let promiseToDownlaod = axios.get(args.source);
promiseToDownlaod
    .then(function (response) {
        // handle success
        const {
            JSDOM
        } = jsdom;
        let html = response.data;

        let teams = [];

        const dom = new JSDOM(html);
        let fixtures = dom.window.document.querySelectorAll('div.match-block__team-container');

        for (let i = 0; i < fixtures.length; i++) {
            let match = {};
            match.result = fixtures[i].querySelectorAll('div.match-block__result')[0].textContent;


            match.t1 = fixtures[i].querySelectorAll('div.match-block__team > div.match-block__team-content > div.match-block__team-name')[0].textContent;
            match.t1s = fixtures[i].querySelectorAll('div.match-block__team-content > div.match-block__score')[0].textContent.replace(/[\n\r]+|[\s]{2,}/g, "");


            match.t2 = fixtures[i].querySelectorAll('div.match-block__team > div.match-block__team-content > div.match-block__team-name')[1].textContent;
            match.t2s = fixtures[i].querySelectorAll('div.match-block__team-content > div.match-block__score')[1].textContent.replace(/[\n\r]+|[\s]{2,}/g, "");

            matches.push(match);
        }

        for (let i = 0; i < matches.length; i++) {
            createTeams(teams, matches[i]);
        }

        for (let i = 0; i < matches.length; i++) {
            putMatchesInAppropriateTeams(teams, matches[i]);
        }

        //write teams to .json file
        fs.writeFileSync("teams.json", JSON.stringify(teams), "utf-8");


        createExcelFile(teams);
        createFolders(teams);
    })
    .catch(function (error) {
        // handle error
        console.log("Failed to download");
    });




function createTeams(teams, match) {
    if (teams.findIndex(team => team.name == match.t1) == -1) {
        teams.push({
            name: match.t1,
            matches: []
        });
    }
    if (teams.findIndex(team => team.name == match.t2) == -1) {
        teams.push({
            name: match.t2,
            matches: []
        });
    }

}

function putMatchesInAppropriateTeams(teams, match) {

    //team 1's matches
    teams[teams.findIndex(team => team.name == match.t1)].matches.push({
        result: match.result,
        selfScore: match.t1s,
        vs: match.t2,
        oppScore: match.t2s
    });

    //team 2's matches
    teams[teams.findIndex(team => team.name == match.t2)].matches.push({
        result: match.result,
        selfScore: match.t2s,
        vs: match.t1,
        oppScore: match.t1s
    });
}

function createExcelFile(teams) {

    let wb = new excel.Workbook();
    var style = wb.createStyle({
        font: {
            color: '#FF0800',
            size: 12,
        },
        numberFormat: '$#,##0.00; ($#,##0.00); -',
    });
    for (let i = 0; i < teams.length; i++) {
        let ws = wb.addWorksheet(teams[i].name);

        ws.cell(1, 1)
            .string("VS");
        // .style(style);

        ws.cell(1, 2)
            .string("Self Score");

        ws.cell(1, 3)
            .string("Opponent Score");

        ws.cell(1, 4)
            .string("Result");

        for (let j = 0; j < teams[i].matches.length; j++) {
            ws.cell(j + 2, 1)
                .string(teams[i].matches[j].vs);
            // .style(style);

            ws.cell(j + 2, 2)
                .string(teams[i].matches[j].selfScore);

            ws.cell(j + 2, 3)
                .string(teams[i].matches[j].oppScore);

            ws.cell(j + 2, 4)
                .string(teams[i].matches[j].result);
        }

    }
    wb.write(args.excel);
}

function createFolders(teams) {
    if (!fs.existsSync(args.worldCupFolder)) {
        fs.mkdirSync(args.worldCupFolder);
    }

    for (let i = 0; i < teams.length; i++) {
        let teamFolderPath = path.join(args.worldCupFolder, teams[i].name);
        if (!fs.existsSync(teamFolderPath)) {
            fs.mkdirSync(teamFolderPath, {
                recursive: true
            });
        }

        for (let j = 0; j < teams[i].matches.length; j++) {
            let teamPDFpath = path.join(args.worldCupFolder, teams[i].name, `vs_${teams[i].matches[j].vs}.pdf`);

            createScoreCard(teams[i].name, teams[i].matches[j], teamPDFpath);

        }


    }
}

function createScoreCard(team1name, team1match, teamPDFpath) {
    // console.log(`${team1name} ----> ${teamPDFpath}`);

    fs.readFile(args.template, (err, existingPdfBytes) => {
        if (err) {
            console.log(err);
        } else {
            const pdfDocLoadingPromise = PDFDocument.load(existingPdfBytes);
            pdfDocLoadingPromise.then(pdfDoc => {
                const pages = pdfDoc.getPages();
                const firstPage = pages[0];
                firstPage.drawText(team1name, {
                    x: 323,
                    y: 702,
                    size: 13
                });

                firstPage.drawText(team1match.vs, {
                    x: 323,
                    y: 677,
                    size: 13
                });

                firstPage.drawText(team1match.selfScore, {
                    x: 323,
                    y: 650,
                    size: 13
                });

                firstPage.drawText(team1match.oppScore, {
                    x: 323,
                    y: 625,
                    size: 13
                });

                firstPage.drawText(team1match.result, {
                    x: 323,
                    y: 598.5,
                    size: 13
                });

                const pdfBytesSavingPromise = pdfDoc.save();
                pdfBytesSavingPromise.then(function(pdfBytes) {
                    fs.writeFileSync(teamPDFpath, pdfBytes, "utf-8");
                });

            }).catch(err => console.log(err));
        }
    });




}