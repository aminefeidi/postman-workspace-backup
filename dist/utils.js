"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.combineCollections = exports.mergeCollections = exports.readCollectionsFromFolder = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const cli_progress_1 = __importDefault(require("cli-progress"));
const postman_collection_1 = require("postman-collection");
// Function to read all collection files in a directory
function readCollectionsFromFolder(folderPath) {
    const collectionFiles = fs_1.default
        .readdirSync(folderPath)
        .filter((filename) => path_1.default.extname(filename) === ".json")
        .map((filename) => path_1.default.join(folderPath, filename));
    const bar1 = new cli_progress_1.default.SingleBar({}, cli_progress_1.default.Presets.shades_classic);
    bar1.start(collectionFiles.length, 0);
    const collections = collectionFiles.map((collectionFile) => {
        const collectionJson = JSON.parse(fs_1.default.readFileSync(collectionFile, "utf8").toString());
        const collection = new postman_collection_1.Collection(collectionJson.collection);
        bar1.increment();
        return collection;
    });
    bar1.stop();
    return collections;
}
exports.readCollectionsFromFolder = readCollectionsFromFolder;
// Function to merge collections
function mergeCollections(collections) {
    const mergedCollection = new postman_collection_1.Collection({
        name: "AIO Merged Collection",
        description: "A collection of all requests",
    });
    const bar2 = new cli_progress_1.default.SingleBar({}, cli_progress_1.default.Presets.shades_classic);
    bar2.start(collections.length, 0);
    collections.forEach((collection, i) => {
        var _a;
        const newItem = new postman_collection_1.ItemGroup(collection.toJSON());
        const evalIndex = (_a = newItem.events
            .find((e) => e.listen === "prerequest", null)) === null || _a === void 0 ? void 0 : _a.script.exec.findIndex((e) => e.includes("eval"));
        if (evalIndex > -1) {
            newItem.events
                .find((e) => e.listen === "prerequest", null)
                .script.exec.splice(evalIndex, 1);
        }
        mergedCollection.items.add(newItem);
        bar2.increment();
    });
    bar2.stop();
    return mergedCollection.toJSON();
}
exports.mergeCollections = mergeCollections;
function combineCollections(collectionFolder, outputCollectionFilename) {
    // Read collections from folder
    console.log(`Reading collections from folder: ${collectionFolder}`);
    const collections = readCollectionsFromFolder(collectionFolder).sort((a, b) => {
        const aNumber = parseInt(a.name.slice(1));
        const bNumber = parseInt(b.name.slice(1));
        return aNumber - bNumber;
    });
    // Merge collections
    console.log("Merging collections");
    const mergedCollection = mergeCollections(collections);
    // Write merged collection to file
    fs_1.default.writeFileSync(path_1.default.join(collectionFolder, outputCollectionFilename), JSON.stringify(mergedCollection, null, 2));
    console.log(`Merged collection written to file: ${outputCollectionFilename}`);
}
exports.combineCollections = combineCollections;
//# sourceMappingURL=utils.js.map