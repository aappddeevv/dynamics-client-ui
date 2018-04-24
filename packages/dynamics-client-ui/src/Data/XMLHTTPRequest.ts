/**
 * Fetcher based on ye old XMLHttpRequest.
 */
import { Config, Request, Fetcher, URI, Id } from "./CRMWebAPI"

export function fetch(config: Config, request: Request,
                              callback: (error: boolean, ctx: any) => void) {
    var self = this
    var req = new XMLHttpRequest()
    //req.open(method, encodeURI(url), true);
    req.open(request.method, request.url, true)
    if (config.AccessToken)
        req.setRequestHeader("Authorization", "Bearer " + config.AccessToken())
    req.setRequestHeader("Accept", "application/json")
    req.setRequestHeader("OData-MaxVersion", "4.0")
    req.setRequestHeader("OData-Version", "4.0")
    //req.setRequestHeader("Access-Control-Allow-Origin", "*")
    if (config.callerId) req.setRequestHeader("MSCRMCallerID", config.callerId)
    if (config.CallerID) req.setRequestHeader("MSCRMCallerID", config.CallerID)
    if (['POST', 'PUT', 'PATCH'].indexOf(request.method) >= 0) {
        // GL: Browser should set this itself.
	//req.setRequestHeader("Content-Length", payload.data.length);
	req.setRequestHeader("Content-Type", "application/json");
    }
    if (typeof request.headers !== 'undefined') {
	for (var name in request.headers) {
            req.setRequestHeader(name, request.headers[name]);
	}
    }
    req.onreadystatechange = function () {
	if (this.readyState == 4 /* complete */ ) {
            req.onreadystatechange = () => {}
            if ((this.status >= 200) && (this.status < 300)) {
		callback(false, {
                    'response': this.response,
                    'headers': self.parseResponseHeaders(this.getAllResponseHeaders())
		});
            } else {
		callback(true, this)
            }
	}
    };
    if (['POST', 'PUT', 'PATCH'].indexOf(request.method) >= 0) {
	req.send(request.data)
    } else {
	req.send()
    }
}
