import puppeteer from 'puppeteer';
import lighthouse from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/lr-desktop-config.js';
import mobileConfig from 'lighthouse/core/config/lr-mobile-config.js';
import { InfluxDB, Point } from '@influxdata/influxdb-client';

import { url, token, org, bucket } from '../config/infludb_conf.js';
import { config } from '../config/config.js';

import { userFeeder } from './feeder.js';

export class clientSideTest {

    constructor() {
        this.browser;
        this.page;
        this.lighthouseOptions;
        this.feeder;
        this.domain;
        this.startTime;
        this.config = new config();
     }

    //The init method initializes the lighthouseOptions object, feeder object, and startTime variable.
    async init(csv=null, argv=null) {
        desktopConfig.settings.onlyAudits = this.config.metricsToSave;
        mobileConfig.settings.onlyAudits = this.config.metricsToSave;

        this.lighthouseOptions = {
            output: 'json',
            disableDeviceEmulation: true,
            chromeFlags: ['--start-maximized', '--clear-storage']
        }
        this.feeder = new userFeeder();
        this.startTime = Math.round(Date.now() / 1000);

        if (csv) {
            await this.feeder.loadUsers(csv);
        }

        if (argv) {
            await this.config.readArgvs(argv);
        }
    }

    // The createPage method creates a new browser page, sets cache disabled and updates the lighthouseOptions object.
    async createPage() {
        try {
            this.browser = await puppeteer.launch({
                headless: this.config.headless,
                defaultViewport: {width: 1920, height: 1080}, 
                args: ['--start-maximized'] 
            });
            this.page = await this.browser.newPage();  

            await this.page.setCacheEnabled(false);

            this.lighthouseOptions = {
                output: 'json',
                disableDeviceEmulation: true,
                chromeFlags: ['--start-maximized', '--clear-storage']
            }
        } catch (error) {
            console.error(`Error occurred while creating page: ${error}`);
        }
    }

    // The login method logs in to a website by navigating to the login page, entering the user credentials and clicking the login button.
    async login(url) {
        try {
            const { username, password } = this.feeder.getNextUser();
            await this.page.goto(url);
            // add your code
        } catch (error) {
            console.error(`Error occurred while logging in: ${error}`);
        }
    }
    
    // The runTestDesktop method runs the Lighthouse audit and the Navigation Timing API 
    // to gather metrics and calls the processLighthouseReport, processNavigationTimingApi and checkDuration methods.
    async runTestDesktop(url, userType) {  
        try {
            const report = await lighthouse(
                url, 
                this.lighthouseOptions,
                desktopConfig,
                this.page
            );
        
            const metrics = await this.page.evaluate(() => {
                return JSON.stringify(performance.getEntriesByType('navigation'));
            });
            
            await this.processLighthouseReport(report, url, userType, "desktop");
            await this.processNavigationTimingApi(JSON.parse(metrics), url, userType, "desktop");
            await this.checkDuration();
        } catch (error) {
            console.error("Error while running desktop test:", error);
        }
    }

    // The runTestMobile method runs the Lighthouse audit and the Navigation Timing API 
    // to gather metrics and calls the processLighthouseReport, processNavigationTimingApi and checkDuration methods.
    async runTestMobile(url, userType) {  
        try {
            const report = await lighthouse(
                url, 
                this.lighthouseOptions,
                mobileConfig,
                this.page
            );
        
            const metrics = await this.page.evaluate(() => {
                return JSON.stringify(performance.getEntriesByType('navigation'));
            });
            
            await this.processLighthouseReport(report, url, userType, "mobile");
            await this.processNavigationTimingApi(JSON.parse(metrics), url, userType, "mobile");
            await this.checkDuration();
        } catch (error) {
            console.error("Error while running mobile test:", error);
        }
    }
    
    // The iterateUrls method is used to iterate through a CSV file containing the URLs to test, and for each URL, it runs the runTestDesktop method.
    async iterateUrls(urlsPath, userType) {  
        try {
            const urls = await this.feeder.loadCSV(urlsPath);
            for (const item of urls) {
                await this.runTestDesktop(item["url"], userType);
                await this.sleep(5000);
            }
        } catch (error) {
            console.error("Error while iterating through URLs:", error);
        }
    }
    
    // The checkDuration method checks the test duration and exits the process if it has exceeded the set duration.
    async checkDuration() {  
        if (this.config.duration != 0){
            const testDuration = Math.round(Date.now() / 1000) - this.startTime;
                if (testDuration > this.config.duration){
                    process.exit(0);
                }
        }
    }

    // The processLighthouseReport method processes the Lighthouse audit report and saves the selected metrics to the InfluxDB database.
    async processLighthouseReport(report, url, userType, device){
        if(!this.config.debug){
            for (var [key, value] of Object.entries(report.lhr.audits)) {
                if (this.config.metricsToSave.includes(value.id)){
                    const intValue = Math.round(value.numericValue);
                    if (Number.isInteger(intValue)) {
                        this.sendToInfluxDB("lighthouse", value.id, intValue, url, userType, device);
                    }
                }
            }
          }
    }

    // The processNavigationTimingApi method processes the Navigation Timing API metrics and saves them to the InfluxDB database.
    async processNavigationTimingApi(metrics, url, userType, device){
        const serverConnectionTime  = Math.round(metrics[0].connectEnd - metrics[0].connectStart);
        const backEndTime           = Math.round(metrics[0].responseStart - metrics[0].fetchStart);
        const frontEndTime          = Math.round(metrics[0].loadEventStart - metrics[0].responseEnd);
        if(!this.config.debug){
            if (Number.isInteger(serverConnectionTime)) {
                this.sendToInfluxDB("timingapi", "server-connection-time", serverConnectionTime, url, userType, device);
            }
            if (Number.isInteger(backEndTime)) {
                this.sendToInfluxDB("timingapi", "back-end-time"         , backEndTime, url, userType, device);
            }
            if (Number.isInteger(frontEndTime)) {
                this.sendToInfluxDB("timingapi", "front-end-time"        , frontEndTime, url, userType, device);
            }
        }
    }

    // The sendToInfluxDB method sends the metrics to the InfluxDB database.
    async sendToInfluxDB(measurement, key, value, testUrl, userType, device){
        try {
            const { hostname, path } = await this.splitUrl(testUrl);
            const writeApi = new InfluxDB({url, token}).getWriteApi(org, bucket, 'ns')
            const point = new Point(measurement)
                .intField(key, value)
                .tag('path'    , path)
                .tag('userType', userType)
                .tag('device'  , device)
                .tag('build'   , this.config.build);

            await writeApi.writePoint(point);
            await writeApi.close()
        }catch(error){
            console.error("Influxdb ERROR: "+ error);
        }  
    }

    // The close method closes the browser.
    async close() {
        await this.browser.close();
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async splitUrl(url) {
        const splitIndex = url.indexOf("/", 8);
        const hostname = url.slice(0, splitIndex);
        const path = url.slice(splitIndex);
        return { hostname, path };
    }
}