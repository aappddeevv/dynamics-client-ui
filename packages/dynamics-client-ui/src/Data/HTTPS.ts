/** Create a https, urllib FetchProvider. */

import { Config, Fetcher, Request, URI, Id } from "./CRMWebAPI"
const https = require("https")
const urllib = require("urllib")

export function fetch(config: Config, request: Request,
    callback: (error: boolean, ctx: any) => void) {
    var parsed_url = urllib.parse(request.url)
    var options = {
        hostname: parsed_url.hostname,
        port: 443,
        path: parsed_url.path,
        method: request.method,
        headers: {
            "Accept": "application/json",
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0",
        }
    }
    if (['POST', 'PUT', 'PATCH'].indexOf(request.method) >= 0) {
        // GL browser should set this itself
        //options.headers['Content-Length'] = payload.data.length;
        options.headers['Content-Type'] = 'application/json'
    }
    if (config.callerId) options.headers["MSCRMCallerID"] = config.callerId
    if (config.AccessToken)
        options.headers["Authorization"] = "Bearer " + config.AccessToken()
    if (request.headers != undefined) {
        for (var name in request.headers) {
            options.headers[name] = request.headers[name]
        }
    }
    var req = https.request(options, function (res) {
        var body = ''
        res.setEncoding('utf8')
        res.on('data', function (chunk) {
            body += chunk
        })
        res.on('end', function () {
            if ((res.statusCode >= 200) && (res.statusCode < 300)) {
                callback(false, {
                    'response': body,
                    'headers': res.headers
                })
            } else {
                callback(true, {
                    'response': body,
                    'headers': res.headers
                })
            }
        })
    })
    req.on('error', function (err) {
        callback(true, err)
    })
    if (['POST', 'PUT', 'PATCH'].indexOf(request.method) >= 0) {
        req.write(request.data)
    }
    req.end()
}
