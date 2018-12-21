const Path = require('path');
const Webpack = require('webpack');

const package = require('./package.json');

const development = {
    entry: Path.resolve(__dirname, 'src', 'index.js'),
    output: {
        filename: 'chromaview.js',
        path: Path.resolve(__dirname, 'build'),
    },
    mode: 'development',
    devServer: {
        contentBase: [
            Path.resolve(__dirname, 'src'),
            Path.resolve(__dirname, 'static'),
            Path.resolve(__dirname, 'build'),
        ],
        compress: false,
        port: 8080,
        inline: true,
        watchOptions: {
            aggregateTimeout: 500,
            poll: true,
            ignored: /node_modules/,
        },
    },
    devtool: 'inline-source-map',
    module: {
        rules: [
            {
                test: /\.html?$/,
                loader: 'raw-loader',
            },
            {
                test: /\.rs$/,
                use: [
                    { loader: 'wasm-loader' },
                    {
                        loader: 'rust-native-wasm-loader',
                        options: {
                            release: true,
                        }
                    },
                ]
            },
        ]
    },
    plugins: [
        new Webpack.DefinePlugin({
            '__DEV__': JSON.stringify(true),
        })
    ],
    resolve: {
        extensions: ['.js', '.json'],
        modules: [ Path.resolve(__dirname, 'src'), 'node_modules'],
    },
};

const production = {
    entry: Path.resolve(__dirname, 'src', 'index.js'),
    output: {
        filename: 'chromaview-'+package.version+'.js',
        path: Path.resolve(__dirname, 'dist'),
    },
    mode: 'production',
    module: {
        rules: [
            {
                test: /\.html?$/,
                loader: 'raw-loader',
            },
        ]
    },
    plugins: [
        new Webpack.DefinePlugin({
            '__DEV__': JSON.stringify(false),
        })
    ],
    resolve: {
        extensions: ['.js', '.json'],
        modules: [ Path.resolve(__dirname, 'src'), 'node_modules'],
    },
};

module.exports = function(env, argv) {
    console.log('Environment: ', env);
    if(env && env.production)
        return production;

    console.log('Development Build\n\n');
    return development;
}