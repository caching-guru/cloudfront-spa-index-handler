const AWS = require('aws-sdk');
const https = require('https');
const zlib = require('zlib');

const downloadContent = (url) => {
  const promise = new Promise(function (resolve, reject) {
    https.get(url, (res) => {
      let response;
      let body = '';

      if (res.headers['content-encoding'] === 'gzip') {
        response = res.pipe(zlib.createGunzip());
      } else {
        response = res;
      }

      response.on('data', (chunk) => {
        body += chunk;
      });

      response.on('end', () => {
        resolve(body);
      });
    }).on('error', (e) => reject(e));
  });
  return promise
};

exports.handler = async function (event, context) {
  let request = event.Records[0].cf.request;
  let headers = request.headers;
  let newuri = request.uri;
  let domain = "";
  for (var i = 0; i < headers.host.length; i++) {
    if (headers.host[i].key == "Host") {
      domain = headers.host[i].value;
    }
  }
  if (domain == "") {
    const newResponse = {
      status: '502',
      statusDescription: 'Bad Request',
      headers: {},
      body: "no domain",
      bodyEncoding: 'text',
    };
    return newResponse;
  }
  let k = Object.keys(headers);
  let useCache = true;
  let debug = false;
  for (var i = 0; i < k.length; i++) {
    if (k[i].toLowerCase() == "x-cg-cache") {
      useCache = false;
    }
    if (k[i].toLowerCase() == "x-cg-debug") {
      debug = true;
    }
  }
  var isStaticFile = false;
  if (newuri.indexOf('index.html') < 0 && newuri.indexOf('.png') < 0 && newuri.indexOf('.xml') < 0 && newuri.indexOf('.txt') < 0 && newuri.indexOf('.jpg') < 0 && newuri.indexOf('.jpeg') < 0 && newuri.indexOf('.css') < 0 &&
    newuri.indexOf('.js') < 0 && newuri.indexOf('.ico') < 0 && newuri.indexOf('.ttf') < 0 && newuri.indexOf('.woff') < 0 && newuri.indexOf('.woff2') < 0 && newuri.indexOf('fonts') < 0 && newuri.indexOf('svg') < 0 && newuri.indexOf('gif') < 0) {

  }
  else {
    useCache = false;
    isStaticFile = true;
  }

  let lang = "";

  if (request.uri.substring(0, 4) == "/de/") {
    lang = "de/";
  }
  if (useCache == false) {
    if (isStaticFile == false) {
      request.uri = '/' + lang + 'index.html';
    }
    else {
      //console.log('static file, returning as is')
    }
    if (debug) {
      const newResponse = {
        status: '200',
        headers: {},
        body: JSON.stringify(request),
        bodyEncoding: 'text',
      };
      return newResponse;
    }
    return request;
  }
  let finalUrl = "https://" + domain + request.uri;


  let url3 = "https://api.caching.guru/v1/cacheFast?returnBlank=true&url=" + finalUrl;

  let ret = await downloadContent(url3);
  let retJson = JSON.parse(ret);
  if (retJson.body == "") {
    request.uri = '/' + lang + 'index.html';
    if (debug) {
      const newResponse = {
        status: '200',
        headers: {},
        body: JSON.stringify({ "request1": request, "ret": ret, "url": url3 }),
        bodyEncoding: 'text',
      };
      return newResponse;
    }
    return request;
  }
  else {
    if (debug) {
      const newResponse = {
        status: '200',
        headers: {},
        body: JSON.stringify({ "request": request, "ret": ret, "url": url3 }),
        bodyEncoding: 'text',
      };
      return newResponse;
    }
    return retJson;
  }

};
