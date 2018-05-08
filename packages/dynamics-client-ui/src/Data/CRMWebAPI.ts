/**
 *
 * Hacked CRMWebAPI from: https://github.com/davidyack/Xrm.Tools.CRMWebAPI.
 */
import { DEBUG } from "BuildSettings"
export type Id = string
export type URI = string
import { fetch } from "./XMLHTTPRequest"

export interface Request {
    /** POST, PUT, etc. */
    method: string
    /** Full url. */
    url: URI
    /** Extra headers in addition to what fetch may do. */
    headers?: Record<string, string>
    /** Payload. */
    data: any
}

export interface Config {
    APIUrl: URI
    AccessToken?: () => string
    callerId?: Id
    CallerID?: Id
    Log?: any
}

export type Fetcher = (config: Config, request: Request,
    callback: (error: boolean, ctx: any) => void) => void

/** Provide a fetcher strategy. */
export interface FetchProvider {
    fetch?: Fetcher
}

/*
type Resolve<T> = (v?: T|Promise<T>) => void
type Reject = (e?: any) => void
type PromiseArg<T> = (thunks: (res: Resolve<T>, rej: Reject) => void) => void

export interface PromiseMaker {
    mkPromise?: <T>(cb: PromiseArg<T>) => Promise<T>
}

export function defaultMkPromise<T>(cb: PromiseArg<T>) {
    return new Promise<T>(cb)
}
*/

/** Provide a logger. */
export interface Logger {
    shouldLog?: (category: string) => boolean
    log?: (category: string, message: string, ctx: any) => void
}

export interface GetListResponse<T> {
    List: T[]
    Count?: number
    fetchXmlPagingCookie?: string
}

export interface UpdateResponse {
    EntityID: Id
}

export interface Attribute {
    Property: string
    Type?: string
}

export interface QueryOptionBase {
    /** If true, bring back all annotations possible. See `Prefer`. */
    FormattedValues?: boolean
    Select?: string[]
    Filter?: string
    /** List of strings "attributename desc/asc" */
    OrderBy?: string[]
    Top?: number
    Path?: Array<Attribute | string>
    /**
     * Direct override regardless of FormattedValues
     *
     */
    Prefer?: string
}

export interface ExpandQueryOptions extends QueryOptionBase {
    Property: string
    Select?: Array<string>
    Filter?: string
}

export interface QueryOptions extends QueryOptionBase {
    Expand?: Array<ExpandQueryOptions>
    FetchXml?: string
    IncludeCount?: boolean
    Skip?: number
    SystemQuery?: string
    UserQuery?: string

    RecordAction?: (record: any) => void
    PageAction?: (list: any[]) => void
    BatchHeaders?: Record<string, string>

    /** Debug tag. */
    tag?: string
}

export interface Option {
    Value: number
    Label: string
}

/** General purpose dynamics web api client. */
export interface _Client_IN_PROGRESS_ {
    GetList<T>(uri: URI, QueryOptions?: QueryOptions): Promise<GetListResponse<T>>
    Get<T>(entityCollection: string, entityID: Id | null, QueryOptions?: QueryOptions): Promise<T>
    GetCount(uri: URI, QueryOptions?: QueryOptions)
    Create(entityCollection: string, data: any): Promise<Id>
    Update(entityCollection: string, key: string, data: any, Upsert: boolean): Promise<void>
    Delete(entityCollection: string, entityID: Id): Promise<boolean>
    Associate(fromEntityCollection: string, fromEntityID: Id, navProperty: String,
        toEntityCollection: string, toEntityID: Id): Promise<boolean>
    DeleteAssociation(fromEntityCollection: string, fromEntityID: Id, navProperty: string,
        toEntityCollection: string, toEntityID: Id): Promise<boolean>
    ExecuteFunction(functionName: string, parameters: any,
        entityCollection: string | null,
        entityID: Id | null): Promise<boolean>
    ExecuteAction(actionName: string, data: any, entityCollection: string | null,
        entityID: Id | null): Promise<boolean>
    batch<T>(entity: string, fetchXml: string, QueryOptions?: QueryOptions): Promise<GetListResponse<T>>
}

/**
 * Access dynamics data. Defaults to XMLHTTPRequest for the underlying transport. Automatically revives dates
 * and turns them to date objects.
 *
 * @todo Add the ability to issue pure http query so we can fetch full links provided
 * in some odata responses.
 * @todo Allow per-request date reviving.
 */
export class CRMWebAPI {

    constructor(config: Config & FetchProvider & Logger) {
        this.config = config
        this.fp = config.fetch || fetch
        this.shouldLog = config.shouldLog
        this.log = config.log
        //this.mkPromise = config.mkPromise || defaultMkPromise
    }

    protected fp: Fetcher
    private config: Config
    protected shouldLog?: (category: string) => boolean
    protected log?: (category: string, message: string, ctx: any) => void
    //protected mkPromise: <T>(cb: PromiseArg<T>) => Promise<T>

    /** For now, pass in extra headers in payload.headers and data in payload.data. */
    protected fetch(config: Config, method: string, url: URI, payload: any,
        callback: (error: boolean, ctx: any) => void) {
        if (this.fp) {
            const req = {
                method,
                url,
                data: payload.data,
                headers: payload.headers
            }
            return this.fp(config, req, callback)
        }
    }

    private _log(category: string, message: string, data: any = null) {
        if (this.shouldLog && this.log && this.shouldLog(category)) {
            this.log(category, message, data)
        }
    }

    private _restParam(func: Function, startIndex: number | null = null) {
        startIndex = startIndex == null ? func.length - 1 : +startIndex;
        return function () {
            var length = Math.max(arguments.length - startIndex!, 0);
            var rest = Array(length);
            for (var index = 0; index < length; index++) {
                rest[index] = arguments[index + startIndex!]
            }
            switch (startIndex) {
                case 0:
                    return func.call(this, rest);
                case 1:
                    return func.call(this, arguments[0], rest);
            }
        };
    }

    private whilst(test, iterator, callback) {
        if (test()) {
            var next = this._restParam(function (err, args) {
                if (err) {
                    callback(err)
                } else if (test.apply(this, args)) {
                    iterator(next)
                } else {
                    callback.apply(null, [null].concat(args))
                }
            })
            iterator(next)
        } else {
            callback(null)
        }
    }

    public GetList = async <T>(uri: URI, QueryOptions?: QueryOptions): Promise<GetListResponse<T>> => {
        var self = this;
        return new Promise<GetListResponse<T>>(function (resolve, reject) {
            var url = self._BuildQueryURL(uri, QueryOptions ? QueryOptions : null, self.config)
            self.fetch(self.config, "GET", url, {
                'headers': self._BuildQueryHeaders(QueryOptions ? QueryOptions : null, self.config)
            }, function (err, res) {
                if (err != false) {
                    self._log('Errors', 'GetList Error:', res);
                    reject(res)
                } else {
                    var data = JSON.parse(res.response, CRMWebAPI.prototype._DateReviver);
                    var nextLink = data['@odata.nextLink']
                    var recordCount = data['@odata.count']
                    var response: GetListResponse<any> = {
                        List: data.value,
                        Count: recordCount
                    };
                    if (QueryOptions && QueryOptions.RecordAction) {
                        response.List.forEach(record => QueryOptions.RecordAction!(record))
                        response.List = []
                    }
                    if (QueryOptions && QueryOptions.PageAction) {
                        QueryOptions.PageAction!(response.List)
                        response.List = []
                    }
                    // was 'undefined' a string !?!?
                    if (nextLink === undefined) {
                        resolve(response);
                    } else {
                        self.whilst(function () {
                            return (nextLink !== undefined)
                        }, function (callback) {
                            self.fetch(self.config, "GET", nextLink, {
                                'headers': self._BuildQueryHeaders(QueryOptions ? QueryOptions : null, self.config)
                            }, function (err, res) {
                                if (err == false) {
                                    data = JSON.parse(res.response, CRMWebAPI.prototype._DateReviver)
                                    nextLink = data['@odata.nextLink']
                                    response.List = response.List.concat(data.value)
                                    if (QueryOptions && QueryOptions.RecordAction) {
                                        response.List.forEach(function (record) {
                                            QueryOptions.RecordAction!(record)
                                        });
                                        response.List = []
                                    }
                                    if (QueryOptions && QueryOptions.PageAction) {
                                        QueryOptions.PageAction!(response.List)
                                        response.List = []
                                    }
                                    callback(null, response.List.length)
                                } else {
                                    self._log('Errors', 'GetList Error2', res)
                                    callback('err', 0)
                                }
                            });
                        }, function (err, n) {
                            resolve(response)
                        })
                    }
                }
            })
        })
    }

    /** Issue a http fetch directly. The response is JSON parsed but not restructured. No paging. */
    public Fetch = async <T=any>(url: string, QueryOptions?: QueryOptions, method?: string): Promise<T> => {
        const self = this
        return new Promise<T>((resolve, reject) => {
            self.fetch(self.config, method ? method : "GET", url, {
                'headers': self._BuildQueryHeaders(QueryOptions ? QueryOptions : null, self.config)
            }, (err, res) => {
                if (err != false) {
                    self._log('Errors', 'Get Error', res)
                    reject(res)
                } else {
                    var data = JSON.parse(res.response, CRMWebAPI.prototype._DateReviver)
                    resolve(data)
                }
            })
        })
    }

    /// <summary>
    /// Get a collection or an instance of given entity type
    /// </summary>
    /// <param name="entityCollection" type="type">Entity logical name to retrieve including plural suffix</param>
    /// <param name="entityID" type="type">ID of requested record, or null for collection based on QueryOptions.Filter</param>
    /// <param name="QueryOptions" type="type"></param>
    public Get = async <T>(entityCollection: string, entityID: Id | null, QueryOptions?: QueryOptions): Promise<T> => {
        const self = this;
        return new Promise<T>(function (resolve, reject) {
            const url = entityID == null ?
                self._BuildQueryURL(entityCollection, QueryOptions ? QueryOptions : null, self.config) :
                self._BuildQueryURL(entityCollection + "(" +
                    entityID.toString().replace(/[{}]/g, "") + ")",
                    QueryOptions ? QueryOptions : null, self.config)
            self.fetch(self.config, "GET", url, {
                'headers': self._BuildQueryHeaders(QueryOptions ? QueryOptions : null, self.config)
            }, function (err, res) {
                if (err != false) {
                    self._log('Errors', 'Get Error', res)
                    reject(res)
                } else {
                    var data = JSON.parse(res.response, CRMWebAPI.prototype._DateReviver)
                    resolve(data)
                }
            })
        })
    }

    /**
     * This does not iterate through server paging so this can tell you zero or non-zero.
     * THIS DOES NOT WORK! DO NOT USE!
     */
    public GetCount = async (uri: URI, QueryOptions?: QueryOptions) => {
        var self = this
        return new Promise<number>(function (resolve, reject) {
            var url = self._BuildQueryURL(uri + "/$count", QueryOptions ? QueryOptions : null, self.config)
            self.fetch(self.config, "GET", url, {
                'headers': self._BuildQueryHeaders(QueryOptions ? QueryOptions : null, self.config)
            }, function (err, res) {
                if (err != false) {
                    self._log('Errors', 'GetCount Error', res)
                    reject(res)
                } else {
                    var data = parseInt(res.response);
                    resolve(data)
                }
            });
        });
    }

    /// <summary>
    /// Create a record
    /// </summary>
    /// <param name="entityCollection" type="type">Plural name of entity to create</param>
    /// <param name="data" type="type">JSON object with attributes for the record to create</param>
    public Create = async (entityCollection: string, data: any): Promise<Id> => {
        var self = this;
        return new Promise<Id>(function (resolve, reject) {
            var url = self.config.APIUrl + entityCollection;
            self._log('ODataUrl', url);
            self.fetch(self.config, "POST", url, {
                'data': JSON.stringify(data)
            }, function (err, res) {
                if (err != false) {
                    self._log('Errors', 'Create Error', res);
                    reject(res);
                } else {
                    const r = /\(([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\)/g
                    resolve(r.exec(res.headers["odata-entityid"])![1])
                }
            });
        });
    }

    /// <summary>
    /// Update an existing record or create a new if record does not exist (Upsert)
    /// </summary>
    /// <param name="entityCollection" type="type">Plural name of entity to update</param>
    /// <param name="key" type="type">Key to locate existing record</param>
    /// <param name="data" type="type">JSON object with attributes for the record to upddate</param>
    /// <param name="Upsert" type="type">Set to true to enable upsert functionality, which creates a new record if key is not found</param>
    public Update = async (entityCollection: string, key: string, data: any, Upsert: boolean = false) => {
        var self = this
        return new Promise<any>(function (resolve, reject) {
            var url = self.config.APIUrl + entityCollection + '(' + key.replace(/[{}]/g, "") + ')'
            self._log('ODataUrl', url)
            var payload = {
                "data": JSON.stringify(data),
                "headers": {}
            };
            if (Upsert == false) payload["headers"]["If-Match"] = "*"
            self.fetch(self.config, "PATCH", url, payload, function (err, res) {
                if (err != false) {
                    self._log('Errors', 'Update Error', res)
                    reject(res)
                } else {
                    var response: any = {}
                    var parseEntityID = /\(([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\)/g.exec(res.headers["odata-entityid"]);

                    if (parseEntityID != null)
                        response.EntityID = parseEntityID[1]

                    resolve(response);
                }
            });
        });
    };

    /// <summary>
    /// Delete an existing record
    /// </summary>
    /// <param name="entityCollection" type="type">Plural name of entity to delete</param>
    /// <param name="entityID" type="type">ID of record to delete</param>
    public Delete = async (entityCollection: string, entityID: Id): Promise<boolean> => {
        var self = this
        return new Promise<boolean>(function (resolve, reject) {
            var url = self.config.APIUrl + entityCollection + '(' + entityID.replace(/[{}]/g, "") + ')'
            self._log('ODataUrl', url)
            self.fetch(self.config, "DELETE", url, {}, function (err, res) {
                if (err != false) {
                    self._log('Errors', 'Delete Error', res)
                    reject(res)
                } else {
                    resolve(true)
                }
            });
        });
    }

    public Associate = async (fromEntityCollection: string, fromEntityID: Id, navProperty: String,
        toEntityCollection: string, toEntityID: Id): Promise<boolean> => {
        var self = this;
        return new Promise<boolean>(function (resolve, reject) {
            var url = self.config.APIUrl + fromEntityCollection + '(' + fromEntityID.replace(/[{}]/g, "")
                + ')/' + navProperty + '/$ref'
            self._log('ODataUrl', url)
            var payload = {
                'data': JSON.stringify({
                    '@odata.id': self.config.APIUrl + toEntityCollection + '(' +
                        toEntityID.replace(/[{}]/g, "") + ')'
                })
            };
            self.fetch(self.config, 'POST', url, payload, function (err, res) {
                if (err != false) {
                    self._log('Errors', 'Associate Error', res)
                    reject(res)
                } else {
                    resolve(true)
                }
            });
        });
    }

    public DeleteAssociation = async (fromEntityCollection: string, fromEntityID: Id, navProperty: string,
        toEntityCollection: string, toEntityID: Id): Promise<boolean> => {
        var self = this;
        return new Promise<boolean>(function (resolve, reject) {
            var url = self.config.APIUrl + fromEntityCollection + '(' +
                fromEntityID.replace(/[{}]/g, "") + ')/' + navProperty + '/$ref'

            if (toEntityCollection != null && toEntityID != null)
                url += '?$id=' + self.config.APIUrl + toEntityCollection + '(' +
                    toEntityID.replace(/[{}]/g, "") + ')'

            self._log('ODataUrl', url)
            self.fetch(self.config, 'DELETE', url, {}, function (err, res) {
                if (err != false) {
                    self._log('Errors', 'DeleteAssociation Error', res)
                    reject(res)
                } else {
                    resolve(true)
                }
            });
        });
    }

    protected cleanId = (id: string): string => id.replace(/[{}]/g, "")


    public ExecuteFunction = async (functionName: string, parameters: any,
        entityCollection: string | null = null,
        entityID: Id | null = null) => {
        var self = this;
        return new Promise<any>(function (resolve, reject) {
            const parmvars: string[] = []
            const parmvalues: string[] = []
            let parmcount: number = 1
            if (parameters != null) {
                Object.keys(parameters).forEach(key => {
                    const val = parameters[key]
                    parmvars.push(key + "=" + "@p" + parmcount.toString())
                    if (typeof val === 'string' || val instanceof String)
                        parmvalues.push("@p" + parmcount.toString() + "='" + val + "'")
                    else parmvalues.push("@p" + parmcount.toString() + "=" + val)
                    parmcount++
                });
            }
            var url = ""
            if (parameters != null) {
                url = self.config.APIUrl + functionName + "(" + parmvars.join(",") + ")?" +
                    parmvalues.join("&");
                if (entityCollection != null) url = self.config.APIUrl + entityCollection + "(" +
                    self.cleanId(entityID!.toString()) + ")/" +
                    functionName +
                    "(" + parmvars.join(",") + ")?" + parmvalues.join("&")
            } else {
                url = self.config.APIUrl + functionName + "()";
                if (entityCollection != null) url = self.config.APIUrl + entityCollection + "(" +
                    self.cleanId(entityID!.toString()) + ")/" +
                    functionName + "()"
            }
            self._log('ODataUrl', url)
            self.fetch(self.config, "GET", url, {}, function (err, res) {
                if (err != false) {
                    self._log('Errors', 'ExecuteFunction Error', res);
                    reject(res)
                } else {
                    var data = JSON.parse(res.response, CRMWebAPI.prototype._DateReviver)
                    resolve(data)
                }
            });
        });
    }

    public ExecuteAction = async (actionName: string, data: any, entityCollection: string | null = null,
        entityID: Id | null = null) => {
        var self = this
        return new Promise<any>(function (resolve, reject) {
            var url = self.config.APIUrl + actionName
            if (entityCollection != null) url = self.config.APIUrl + entityCollection + "(" +
                entityID!.toString().replace(/[{}]/g, "") + ")/" + actionName
            self._log('ODataUrl', url)
            self.fetch(self.config, "POST", url, {
                "data": JSON.stringify(data)
            }, function (err, res) {
                if (err != false) {
                    self._log('Errors', 'ExecuteAction Error', res);
                    reject(res)
                } else {
                    if (res.response == "") {
                        resolve(undefined) //changed from null
                    } else {
                        var data = JSON.parse(res.response, CRMWebAPI.prototype._DateReviver)
                        resolve(data)
                    }
                }
            })
        })
    }

    private _BuildQueryURL(uri: URI, queryOptions: QueryOptions | null, config: Config) {
        const path = (queryOptions && queryOptions.Path) ?
            queryOptions.Path.map(part =>
                typeof part === 'string' ?
                    `/${part}` :
                    `/${part.Property}` + (part.Type ? `/${part.Type}` : "")
            ) : []
        let fullurl = config.APIUrl + uri + (path.length > 0 ? path.join("/") : "")

        const qs: string[] = []
        if (queryOptions != null) {
            if (queryOptions.Select != null) qs.push("$select=" + encodeURI(queryOptions.Select.join(",")))
            if (queryOptions.OrderBy != null) qs.push("$orderby=" + encodeURI(queryOptions.OrderBy.join(",")))
            if (queryOptions.Filter != null) qs.push("$filter=" + encodeURI(queryOptions.Filter))
            if (queryOptions.Expand != null) {
                let expands: string[] = []
                queryOptions.Expand.forEach(function (ex: ExpandQueryOptions) {
                    if (ex.Select || ex.Filter || ex.OrderBy || ex.Top) {
                        var qsExpand: string[] = []
                        if (ex.Select) qsExpand.push("$select=" + ex.Select.join(","))
                        if (ex.OrderBy) qsExpand.push("$orderby=" + ex.OrderBy.join(","))
                        if (ex.Filter) qsExpand.push("$filter=" + ex.Filter)
                        if (ex.Top && ex.Top > 0) qsExpand.push("$top=" + ex.Top)
                        expands.push(ex.Property + "(" + qsExpand.join(";") + ")")
                    }
                    else
                        expands.push(ex.Property)
                })
                qs.push("$expand=" + encodeURI(expands.join(",")))
            }
            if (queryOptions.IncludeCount) qs.push("$count=true")
            if (queryOptions.Skip && queryOptions.Skip > 0)
                qs.push("skip=" + encodeURI(queryOptions.Skip ? queryOptions.Skip.toString() : ""))
            if (queryOptions.Top && queryOptions.Top > 0)
                qs.push("$top=" + encodeURI(queryOptions.Top ? queryOptions.Top.toString() : ""))
            if (queryOptions.SystemQuery != null) qs.push("savedQuery=" + encodeURI(queryOptions.SystemQuery))
            if (queryOptions.UserQuery != null) qs.push("userQuery=" + encodeURI(queryOptions.UserQuery))
            if (queryOptions.FetchXml != null) qs.push("fetchXml=" + encodeURI(queryOptions.FetchXml))
        }
        if (qs.length > 0) fullurl += "?" + qs.join("&")
        this._log('ODataUrl', fullurl)
        return fullurl
    }

    private _BuildQueryHeaders(queryOptions: QueryOptions | null, config: Config) {
        var headers = {}
        if (queryOptions) {
            if (queryOptions.FormattedValues == true)
                //headers['Prefer'] = 'odata.include-annotations="OData.Community.Display.V1.FormattedValue"'
                // FV indicates bring all extra annotations back...
                headers['Prefer'] = 'odata.include-annotations="*"'
            if (queryOptions.Prefer)
                headers["Prefer"] = queryOptions.Prefer
        }
        return headers
    };
    private parseResponseHeaders(headerStr: string) {
        var headers = {}
        if (!headerStr) {
            return headers
        }
        var headerPairs = headerStr.split('\u000d\u000a')
        for (var i = 0; i < headerPairs.length; i++) {
            var headerPair = headerPairs[i]
            // Can't use split() here because it does the wrong thing
            // if the header value has the string ": " in it.
            var index = headerPair.indexOf('\u003a\u0020')
            if (index > 0) {
                var key = headerPair.substring(0, index)
                var val = headerPair.substring(index + 2)
                headers[key.toLowerCase()] = val
            }
        }
        return headers
    }

    public _DateReviver(key: string, value: any) {
        var a
        if (typeof value === 'string') {
            a = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value)
            if (a) {
                return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4], +a[5], +a[6]))
            }
        }
        return value
    }

    public GetOptionSetByName = async (optionSetName: string): Promise<any> => {
        var self = this
        return new Promise<any>(function (resolve, reject) {
            self.GetList('GlobalOptionSetDefinitions', { Select: ['Name'] }).
                then((r: GetListResponse<any>) => {
                    r.List.forEach(set => {
                        if (set.Name == optionSetName) {
                            self.Get('GlobalOptionSetDefinitions', set.MetadataId).
                                then(res => resolve(res), err => console.log(err))
                        }
                    })
                },
                    (e: Error) => {
                        console.log(e)
                        reject(e)
                    })
        })
    }

    public GetOptionSetUserLabels = async (optionSetName: string): Promise<Array<Option>> => {
        var self = this;
        return new Promise<Array<Option>>(function (resolve, reject) {
            self.GetOptionSetByName(optionSetName).
                then((result: { Options: Array<any> }) => {
                    const displayList = result.Options.map((option: any) => {
                        return {
                            Value: option.Value,
                            Label: option.Label.UserLocalizedLabel.Label
                        }
                    })
                    resolve(displayList)
                },
                    err => {
                        console.log(err)
                        reject(err)
                    }
                )
        })
    }

    public GetEntityDisplayNameList(LCID: string) {
        var self = this;
        return new Promise(function (resolve, reject) {
            self.GetList('EntityDefinitions',
                {
                    Filter: 'IsPrivate eq false', Select: ['MetadataId', 'EntitySetName', 'DisplayName',
                        'DisplayCollectionName', 'LogicalName', 'LogicalCollectionName',
                        'PrimaryIdAttribute']
                }).
                then(
                    function (r: any) {
                        var list = new Array();
                        r.List.forEach(function (entity: any) {
                            var edm: any = new Object();
                            edm.MetadataId = entity.MetadataId;
                            edm.EntitySetName = entity.EntitySetName;
                            edm.LogicalName = entity.LogicalName;
                            edm.LogicalCollectionName = entity.LogicalCollectionName;
                            edm.PrimaryIdAttribute = entity.PrimaryIdAttribute;
                            if ((entity.DisplayName.LocalizedLabels != null) && (entity.DisplayName.LocalizedLabels.length > 0)) {
                                edm.DisplayName = entity.DisplayName.LocalizedLabels[0].Label;
                                if (LCID != null)
                                    entity.DisplayName.LocalizedLabels.forEach(function (label) {
                                        if (label.LanguageCode == LCID) edm.DisplayName = label.Label
                                    })
                            }
                            else
                                edm.DisplayName = edm.LogicalName;
                            if ((entity.DisplayCollectionName.LocalizedLabels != null) &&
                                (entity.DisplayCollectionName.LocalizedLabels.length > 0)) {
                                edm.DisplayCollectionName = entity.DisplayCollectionName.LocalizedLabels[0].Label;
                                if (LCID != null)
                                    entity.DisplayCollectionName.LocalizedLabels.forEach(function (label) {
                                        if (label.LanguageCode == LCID) edm.DisplayCollectionName = label.Label
                                    })
                            }
                            else
                                edm.DisplayCollectionName = entity.LogicalCollectionName;
                            edm.LogicalDisplayName = edm.DisplayName + '(' + edm.LogicalName + ')'
                            edm.LogicalDisplayCollectionName = edm.DisplayCollectionName + '(' + edm.LogicalCollectionName + ')'
                            list.push(edm)
                        }
                        )
                        resolve(list)
                    },
                    function (e) {
                        console.log(e)
                        reject(e)
                    })
        })
    }

    public GetAttributeDisplayNameList(entityID: string, LCID: string) {
        var self = this;
        return new Promise(function (resolve, reject) {
            self.GetList('EntityDefinitions(' + entityID.toString() + ')/Attributes',
                { Filter: '((IsValidForRead eq true) and (AttributeOf eq null))', Select: ['MetadataId', 'DisplayName', 'LogicalName', 'SchemaName', 'AttributeType', 'IsPrimaryId'] }).then(
                    function (r: any) {
                        var list = new Array()
                        r.List.forEach(function (attrib) {
                            var edm: any = new Object();
                            edm.MetadataId = attrib.MetadataId;
                            edm.LogicalName = attrib.LogicalName;
                            edm.SchemaName = attrib.SchemaName;
                            edm.IsPrimaryId = attrib.IsPrimaryId;
                            edm.AttributeType = attrib.AttributeType;
                            if (attrib.AttributeType === "Lookup" ||
                                attrib.AttributeType === "Customer" ||
                                attrib.AttributeType === "Owner")
                                edm.ODataLogicalName = "_" + attrib.LogicalName + "_value";
                            else
                                edm.ODataLogicalName = attrib.LogicalName;

                            if ((attrib.DisplayName.LocalizedLabels != null) &&
                                (attrib.DisplayName.LocalizedLabels.length > 0)) {
                                edm.DisplayName = attrib.DisplayName.LocalizedLabels[0].Label;
                                if (LCID != null)
                                    attrib.DisplayName.LocalizedLabels.forEach(function (label) {
                                        if (label.LanguageCode == LCID) edm.DisplayName = label.Label
                                    });
                            }
                            else
                                edm.DisplayName = edm.LogicalName;
                            edm.LogicalDisplayName = edm.DisplayName +
                                '(' + edm.LogicalName + ')'
                            list.push(edm)
                        }
                        )
                        resolve(list)
                    },
                    function (e) {
                        console.log(e)
                        reject(e)
                    })
        })
    }

    //
    // monkey patch
    //
    public batch<T>(entity: string, fetchXml: string, QueryOptions?: QueryOptions): Promise<GetListResponse<T>> {
        const self = this

        // build the body
        var body = '--batch_contactfetch\n'
        body += 'Content-Type: application/http\n'
        body += 'Content-Transfer-Encoding: binary\n'
        body += '\n'
        body += 'GET ' + self.config.APIUrl + `${entity}?fetchXml=${encodeURIComponent(fetchXml)} HTTP/1.1\n`
        body += 'Content-Type: application/json\n'
        body += 'OData-Version: 4.0\n'
        body += 'OData-MaxVersion: 4.0\n'
        //if(QueryOptions && QueryOptions.BatchHeaders) {
        //    console.log("BATCHE EXTRA HEADERS", QueryOptions.BatchHeaders)
        //    const keys = Object.keys(QueryOptions!.BatchHeaders!)
        //    if(keys && keys.length > 0)
        //        body += keys.map(k => `${k}: ${QueryOptions!.BatchHeaders![k]}`).join("\n")
        // odata annotation: Microsoft.Dynamics.CRM.fetchxmlpagingcookie
        body += 'Prefer: odata.include-annotations="OData.Community.Display.V1.FormattedValue,Microsoft.Dynamics.CRM.*"\n'
        //}
        body += '\n'
        body += '--batch_contactfetch--'

        return new Promise(function (resolve, reject) {
            const url = self._BuildQueryURL("$batch", QueryOptions ? QueryOptions : null, self.config)
            self._log('ODataUrl', url)
            //self.fetch(self.config, "POST", url, { // won't work, additive headers
            self._hack(self.config, "POST", url, {
                'data': body,
                headers: {
                    "Content-Type": "multipart/mixed;boundary=batch_contactfetch"
                }
            }, function (err, res) { // callback
                if (err != false) {
                    self._log('Errors', 'batch error', res)
                    reject(res)
                } else {
                    //if(DEBUG) console.log("raw r", res)
                    var data = JSON.parse(self._sliceBatchResponse(res.response), self._DateReviver)
                    if (data.error) {
                        // its really an error
                        self._log('Errors', 'batch error', res)
                        reject(data.error)
                        return
                    }
                    //if(DEBUG) console.log("batch.raw json", data)
                    var nextLink = data['@odata.nextLink']
                    var recordCount = data['@odata.count']
                    var fetchXmlPagingCookie = data["@Microsoft.Dynamics.CRM.fetchxmlpagingcookie"]
                    var response: GetListResponse<any> = {
                        List: data.value,
                        Count: recordCount,
                        fetchXmlPagingCookie: fetchXmlPagingCookie
                    }
                    if (QueryOptions && QueryOptions.RecordAction) {
                        response!.List!.forEach(record => QueryOptions.RecordAction!(record))
                        response.List = [];
                    }
                    if (QueryOptions && QueryOptions.PageAction) {
                        QueryOptions.PageAction!(response.List)
                        response.List = []
                    }
                    if (!nextLink) {
                        resolve(response)
                    } else {
                        if (DEBUG) console.log("NEXT LINK BUT NEED TO IMPLEMENT WHILST!!!")
                        if (DEBUG) console.log("response", data)
                        resolve(response)
                        // the lib has page processing code here...copy and paste it!
                    }
                }
            })
        })
    }

    private _hack(config: Config, method: string, url: URI, payload: any,
        callback: (succes: boolean, ctx: any) => void) {
        var self = this
        var req = new XMLHttpRequest()
        //req.open(method, encodeURI(url), true);
        req.open(method, url, true)
        if (config.AccessToken)
            req.setRequestHeader("Authorization", "Bearer " + config.AccessToken())
        req.setRequestHeader("Accept", "application/json")
        req.setRequestHeader("OData-MaxVersion", "4.0")
        req.setRequestHeader("OData-Version", "4.0")
        if (config.callerId) req.setRequestHeader("MSCRMCallerID", config.callerId)
        if (config.CallerID) req.setRequestHeader("MSCRMCallerID", config.CallerID)
        if (['POST', 'PUT', 'PATCH'].indexOf(method) >= 0) {
            // GL: Browser should set this itself
            //req.setRequestHeader("Content-Length", payload.data.length);
            //req.setRequestHeader("Content-Type", "application/json");
        }
        if (payload.headers !== 'undefined') {
            for (var name in payload.headers) {
                req.setRequestHeader(name, payload.headers[name])
            }
        }
        req.onreadystatechange = function () {
            if (this.readyState == 4 /* complete */) {
                req.onreadystatechange = () => { }
                if ((this.status >= 200) && (this.status < 300)) {
                    callback(false, {
                        'response': this.response,
                        'headers': self.parseResponseHeaders(this.getAllResponseHeaders())
                    });
                } else {
                    callback(true, this)
                }
            }
        }
        if (['POST', 'PUT', 'PATCH'].indexOf(method) >= 0) {
            req.send(payload.data);
        } else {
            req.send()
        }
    }

    private _sliceBatchResponse(response: string) {
        const start = response.indexOf("{")
        const end = response.lastIndexOf("}") + 1
        //console.log("stats", start, end, response[start], response[end-1])
        //console.log("parsing", response.substring(start, end))
        return response.substring(start, end)
    }
}

export default CRMWebAPI
