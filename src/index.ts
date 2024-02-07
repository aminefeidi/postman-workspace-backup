#! /usr/bin/env node

import fs from "fs-extra";
import async from "async";
import dateformat from "dateformat";
import cliProgress from "cli-progress";
import args from "args";
import { combineCollections } from "./utils";
import { Collection } from "postman-collection";

const Client = require("node-rest-client").Client;

args.option("api-key", "The postman API key")
    .option("ws-id", "Postman workspace id")
    .option("timeout", "Delay between api requests", 300)
    .option("use-date", "Use date as subfolder", false)
    .option("output-folder", "Postman collections folder", "files/collections")
    .option("combine-collections", "Combine collections", false)
    .option(
        "merged-col-name",
        "Change this to the name you want for your output collection",
        "merged_collection.json"
    )
    .option("codify-names", "Codify collection names", false);

const flags = args.parse(process.argv);

const APIKEY = flags["apiKey"];
const TIMEOUT = flags["timeout"];
const DOWNLOAD_TIMEOUT = 3000;
const USEDATE = flags["useDate"];

const APIURL = "https://api.getpostman.com/"; //Postman API url
const WSID = flags["wsId"];

const EXPORT_COL_DIR = flags["outputFolder"];
const MERGE_COL = flags["combineCollections"];
const MASTER_COL_NAME = flags["mergedColName"];

if (!APIKEY) {
    console.error("Please provide an API key");
    process.exit(1);
}

if (!WSID) {
    console.error("Please provide a workspace id");
    process.exit(1);
}

//empty the collections folder
console.log("Emptying collections folder: " + EXPORT_COL_DIR);

fs.emptyDirSync(EXPORT_COL_DIR);

console.log("Starting collections download");

const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

const colUrl = APIURL + "collections/";
const wsColUrl = APIURL + "collections?workspace=" + WSID;
let i = 0;
let collections: Collection[] = [];

getData(wsColUrl, APIKEY, (collIdsJson: any) => {
    bar.start(collIdsJson.collections.length, 0);
    async.eachSeries<any>(
        collIdsJson.collections,
        function getCollection(el, callback) {
            let urlC = colUrl + el.uid;
            setTimeout(() => {
                getData(urlC, APIKEY, (colJson: { collection: any }) => {
                    const collection = colJson.collection;

                    if (flags["codify-names"]) {
                        codifyNames(collection, i);
                    }

                    let name = collection.info.name;
                    //console.log(name);
                    bar.increment();
                    let filename = name + ".json";
                    collections.push(new Collection(collection));
                    if (!MERGE_COL) saveJson(EXPORT_COL_DIR, filename, colJson);
                });
                callback();
            }, TIMEOUT);
        },
        function callback(err) {
            if (err) {
                console.error(err);
            } else {
                if (err) {
                    console.error(err);
                } else {
                    setTimeout(() => {
                        bar.stop();
                        console.log("\nAll collections download done\n");
                        if (MERGE_COL)
                            combineCollections(
                                collections,
                                EXPORT_COL_DIR,
                                MASTER_COL_NAME
                            );
                    }, DOWNLOAD_TIMEOUT);
                }
            }
        }
    );
});

function getData(url: string, key: string, callback: any) {
    let client = new Client();
    var args = {
        headers: {
            "X-Api-Key": key,
        },
    };
    client
        .get(url, args, function (data, response) {
            if (response.statusCode !== 200) {
                console.error(
                    `${key} - ${response.statusCode} - ${response.statusMessage} - ${url}`
                );
            } else {
                if (callback) {
                    callback(data, response);
                }
            }
        })
        .on("error", function (err) {
            console.error("Request", err.request.options);
        });

    // handling client error events
    client.on("error", function (err) {
        console.error("Client", err);
    });
}

function saveJson(path, filename, json) {
    let fullpath = path;

    if (USEDATE) {
        let date = dateformat(new Date(), "mm-dd-yyyy");
        fullpath = fullpath + "/" + date;
    }

    fs.ensureDirSync(fullpath);

    let str = JSON.stringify(json);
    fs.writeFile(fullpath + "/" + filename, str, "utf8");
}

function codifyNames(collection: any, i: number) {
    let j = 0;
    collection.info.name = `S${i + 1} ${collection.info.name}`;
    collection.item.forEach((item) => {
        item.name = `S${i + 1}.${j} ${item.name}`;
        const test = item.event.find((e) => e.listen === "test", null);
        if (test && test.script && test.script.exec.length > 0) {
            test.script.exec = test.script.exec.map((line) => {
                if (line.includes('postman.setNextRequest("')) {
                    return line.replace(
                        'postman.setNextRequest("',
                        `postman.setNextRequest(\"S${i + 1}.${j + 1} `
                    );
                }
                return line;
            });
        }
        j++;
    });
}
