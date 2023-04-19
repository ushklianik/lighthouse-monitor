export class config {
    constructor() {
        this.metricsToSave = [
            "first-contentful-paint",
            "largest-contentful-paint",
            "first-meaningful-paint",
            "speed-index",
            "total-blocking-time",
            "cumulative-layout-shift",
            "server-response-time",
            "interactive"
        ];
        this.debug      = true;
        this.headless   = false;
        this.iterations = 1;
        this.duration   = 0;
        this.build      = "RFC";
    }
    async readArgvs(argv){
        const args = argv.slice(2);
        args.forEach(arg => {
            const [key, value] = arg.split('=');
            if (key === "-debug") {
                this.debug = value.toLowerCase() === "true";
            } else if (key === "-headless") {
                this.headless = value.toLowerCase() === "true";
            } else if (key === "-iterations") {
                const intValue = parseInt(value);
                if (Number.isInteger(intValue)) {
                    this.iterations = intValue;
                }
            } else if (key === "-duration") {
                const intValue = parseInt(value);
                if (Number.isInteger(intValue)) {
                    this.duration = intValue;
                }
            } else if (key === "-build") {
                this.build = value;
            }
        });
    }
}