import fs from "fs";
import path from "path";
import cliProgress from "cli-progress";
import { Collection, Item, ItemGroup } from "postman-collection";

// Function to read all collection files in a directory
export function readCollectionsFromFolder(folderPath: string) {
    const collectionFiles = fs
        .readdirSync(folderPath)
        .filter((filename) => path.extname(filename) === ".json")
        .map((filename) => path.join(folderPath, filename));

    const bar1 = new cliProgress.SingleBar(
        {},
        cliProgress.Presets.shades_classic
    );
    bar1.start(collectionFiles.length, 0);

    const collections: Collection[] = collectionFiles.map((collectionFile) => {
        const collectionJson = JSON.parse(
            fs.readFileSync(collectionFile, "utf8").toString()
        );
        const collection = new Collection(collectionJson.collection);
        bar1.increment();
        return collection;
    });
    bar1.stop();
    return collections;
}

// Function to merge collections
export function mergeCollections(collections: Collection[]) {
    const mergedCollection = new Collection({
        name: "AIO Merged Collection",
        description: "A collection of all requests",
    });

    const bar2 = new cliProgress.SingleBar(
        {},
        cliProgress.Presets.shades_classic
    );
    bar2.start(collections.length, 0);
    collections.forEach((collection, i) => {
        const newItem = new ItemGroup<Item>(collection.toJSON());
        const evalIndex = newItem.events
            .find((e) => e.listen === "prerequest", null)
            ?.script.exec.findIndex((e) => e.includes("eval"));
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

export function combineCollections(
    collections: Collection[],
    collectionFolder: string,
    outputCollectionFilename: string
) {
    collections = collections.sort((a, b) => {
        const aNumber = parseInt(a.name.slice(1));
        const bNumber = parseInt(b.name.slice(1));
        return aNumber - bNumber;
    });

    // Merge collections
    console.log("Merging collections");
    const mergedCollection = mergeCollections(collections);

    // Write merged collection to file
    fs.writeFileSync(
        path.join(collectionFolder, outputCollectionFilename),
        JSON.stringify(mergedCollection, null, 2)
    );

    console.log(
        `Merged collection written to file: ${outputCollectionFilename}`
    );
}
