// Common content for ActivitiesView webpack
let webpack = require("webpack"),
    merge = require("webpack-merge"),
    UglifyJsPlugin = require("uglifyjs-webpack-plugin"),
    path = require("path"),
    srcdir = path.join(__dirname, "src")

const finalStyleLoaders = [
    { loader: "style-loader" },
    // may want to replace with types-for-css-modules-loader
    { loader: "css-loader", options: { modules: true, importLoaders: 1 } },
    {
        loader: "postcss-loader",
        options: {
            ident: 'postcss',
            plugins: (loader) => [
                require("postcss-import")({ root: loader.resourcePath }),
                require("postcss-mixins")(),
                require("postcss-cssnext")(),
                require("postcss-reporter")({ clearMessages: true }),
            ]
        }
    }
]

const baseDevServer = {
    contentBase: [path.join(__dirname, "/dist/"), __dirname],
    compress: true,
    hot: true,
    https: true,
    headers: {
        'Access-Control-Allow-Origin': '*'
    }
}

// devtool removed, must put in your final config object
const config = {
    target: "web",
    resolve: {
        extensions: [".ts", ".tsx", ".js", ".jsx", ".json", "*"],
        alias: {
            // always use "my" version of react...
            react: path.join(__dirname, "./node_modules/react"),
            "react-dom": path.join(__dirname, "./node_modules/react-dom"),
            "prop-types": path.join(__dirname, "./node_modules/prop-types"),
            glamor: path.join(__dirname, "./node_modules/glamor")
        }
    },
    module: {
        rules: [
            {
                // Load css, convert to js object, also load via stylesheet.
                test: /\.css(\.js)?$/,
                use: finalStyleLoaders
            },
            {
                // Order is important for this loader, run after babel but before other css loaders. Why not postcss-js?
                test: /\.css\.js?$/,
                use: [{ loader: "css-js-loader" }]
            },
            {
                test: /\.jsx?$/, // picks up .js and .jsx
                exclude: /(node_modules)/,
                include: /src/,
                use: ["babel-loader"]
            },
            {
                test: /\.tsx$|\.ts$/,
                include: path.resolve(__dirname, './src'),
                exclude: [/node_modules/, /__tests__/],
                use: [
                    { loader: "babel-loader" },
                    { loader: 'ts-loader' }
                ]
            },
            {
                test: /\.(png|jpg|gif)$/,
                use: ['url-loader']
            },
            {
                test: /\.js$/,
                use: ["source-map-loader"],
                enforce: "pre",
                exclude: [/node_modules/],
            }
        ]
    },
    devServer: baseDevServer
}

// Do we have an dev and test differences ?
module.exports = function (env) {
    const appConfigFile = (env && env.appConfigFile) ? env.appConfigFile :
        (env && env.prod ? "prod.config.ts" : "dev.config.ts")
    const resolve = { alias: { BuildSettings: path.join(__dirname, "configs", appConfigFile) } }

    // Anything else different between prod and non-prod?
    if (env && env.prod) return merge(config, {
        resolve,
        plugins: [
            // this is auto added by webpack -p, but we skip that and define them ourselves
            new webpack.DefinePlugin({
                "process.env": {
                    "NODE_ENV": '"production"'
                }
            }),
            new UglifyJsPlugin({
                cache: true,
                parallel: 4,
                sourceMap: true,
            })
        ]
    })
    else return merge(config, { resolve })
}
