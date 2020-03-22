const prompt = require('prompt');
const lighthouse = require('lighthouse');
const launchChrome = require('chrome-launcher');
const argv = require('yargs').argv;
const url = require('url');
const fs = require('fs');

const chromeAndLighthouse = url => {
    // launchChrome is basically returning 'promise'
    return launchChrome.launch().then(chrome => {
        const options = {
            port: chrome.port,
        };
        return lighthouse(url, options).then(results => {
            return chrome.kill().then(() => {
                return {
                    js: results.lhr,
                    json: results.report,
                };
            });
        });
    });
};

prompt.start();

prompt.get('url', function(err, result) {
    argv.url = result.url;
    if (argv.url) {
        const urlObj = new URL(argv.url);
        let dirName = urlObj.host.replace('www.', '');
        // 디렉토리 만들 시에 / 를 _로 변환
        if (urlObj.pathname !== '/') {
            dirName = dirName + urlObj.pathname.replace(/\//g, '_');
        }

        // 파일시스템에서 이미 폴더가 있는지 체크
        if (!fs.existsSync(dirName)) {
            fs.mkdirSync(dirName);
        }

        chromeAndLighthouse(argv.url).then(results => {
            // file system에 저장하기
            fs.writeFile(
                `${dirName}/${results.js['fetchTime'].replace(/:/g, '_')}.json`,
                results.json,
                err => {
                    if (err) throw err;
                },
            );
        });
    } else {
        throw 'URL을 입력하세요';
    }
});
