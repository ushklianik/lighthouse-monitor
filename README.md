# Description
Node.js application that uses Puppeteer and Lighthouse to run performance tests on a given website. The application is capable of logging into a website, iterating through a list of URLs, and running Lighthouse audits on the pages, then sends the results to an InfluxDB database.

# Getting Started
## Prerequisites
 - Node.js
 - An InfluxDB instance to send data to

## Installation
- Clone the repository
git clone https://github.com/example/clientSideTest.git

- Install the necessary dependencies
npm install @influxdata/influxdb-client
npm install csv-parser
npm install lighthouse
npm install puppeteer


# Configuration

## package.json
Lighthouse 10^ is an ES6 module that requires all packages to be imported using the ES6 method. As a result, it is necessary to include the following line in the package.json file.
This declaration is essential to ensure that the package manager understands that the module uses the ES6 syntax for importing packages.
"type": "module"

## config.js 
Configure default values for the following parameters in the config.js file in the config directory:
- metricsToSave: An array of Lighthouse audits to save to the database.
- debug: A boolean indicating whether to save data to InfluxDB.
- headless: A boolean indicating whether to run the tests headless.
- duration: The number of seconds to run the tests.

## infludb_conf.js 
Configure InfluxDB config file:
- url: The URL of your InfluxDB instance.
- token: The access token for your InfluxDB instance.
- org: The name of your organization in InfluxDB.
- bucket: The name of the bucket to write data to.

# Scripting

Modify main.js file. (main.js is an example, it doesn't matter how you name this file)

Create an instance of the clientSideTest class by calling the constructor as shown below:
const test = new clientSideTest();

Define the path to the CSV file containing the test users by assigning the file path to the users variable:
const users = "./testdata/users.csv";

If you need to test a list of URLs defined in a CSV file, define the path to the file as well by assigning it to the urlsPath variable:
const urlsPath = "./testdata/urls.csv";

Call the init method to collect all configurations and create a feeder for test users by passing in the users variable defined in step 2:
await test.init(users);

Call the readArgvs method to get command-line interface (CLI) parameters and update the test configuration by passing in the process.argv object:
await test.config.readArgvs(process.argv);

Create a new browser and page by calling the createPage method:
await test.createPage();t

Run Lighthouse measurements for each URL in the specified CSV file by calling the iterateUrls method, passing in the path to the CSV file defined in step 3 and an additional tag, USER_TYPE, to be sent to InfluxDB. The additional tag can be used to differentiate between logged-in and anonymous users:
await test.iterateUrls(urlsPath, "USER_TYPE");

If necessary, log in to the application by calling the login method. Note that this method should be preconfigured by adjusting the login method in the /code/clientSideTest.js file to match the login requirements of your application:
await test.login("https://www.candidate.pmi.org");

Close the browser and all pages by calling the close method:
await test.close();
Add pauses to the test using the sleep method:
await test.sleep(2000);

# Usage
To run the application, use the following command
npm run start -- --url=<URL> --csv=<CSV_PATH> --userType=<USER_TYPE>