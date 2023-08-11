# pm-download-combine

This project is designed to download Postman collections from a workspace using the Postman API and save them as JSON files. It provides a convenient way to manage and organize collections for further use. The collections can be merged into a single file for easier import into Postman or for use with CI/CD pipelines using newman.

## Getting Started

To use this project, you need to have Node.js installed on your system. You can download and install Node.js from the [official website](https://nodejs.org/) or use a package manager.

### Installation

Open your terminal and run the following command:

```
npm i -g pm-download-combine
```

### Usage

You can run the project using the following command:

```
pm-download-combine --api-key YOUR_API_KEY --ws-id WORKSPACE_ID -c
```

Available options:

    -a, --api-key                  The postman API key
    -C, --codify-names             Codify collection names (disabled by default)
    -c, --combine-collections      Combine collections (disabled by default)
    -h, --help                     Output usage information
    -m, --merged-col-name [value]  Change this to the name you want for your output collection (defaults to "merged_collection.json")
    -o, --output-folder [value]    Postman collections folder (defaults to "files/collections")
    -t, --timeout <n>              Delay between api requests (defaults to 300)
    -u, --use-date                 Use date as subfolder (disabled by default)
    -v, --version                  Output the version number
    -w, --ws-id                    Postman workspace id

For example:

```
pm-download-combine --api-key YOUR_API_KEY --ws-id WORKSPACE_ID --timeout 300 --use-date --output-folder collections --merged-col-name merged_collection.json --codify-names
```

## License

This project is licensed under the MIT License.
