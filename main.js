import {clientSideTest} from './code/clientSideTest.js'

(async () => {
    const test       = new clientSideTest();

    const users      = "./testdata/users.csv";
    const urlsPath   = "./testdata/urls.csv";
    
    await test.init(users);
    await test.config.readArgvs(process.argv);

    for (let i = 0; i < test.config.iterations; i++) {
        await test.createPage();
        
        await test.iterateUrls(urlsPath, "anonymous")
        
        await test.login("https://blazedemo.com/");
        await test.iterateUrls(urlsPath, "logged")

        await test.close();

        await test.sleep(20000);
    }
})();
