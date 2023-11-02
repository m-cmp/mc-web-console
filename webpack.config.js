const Webpack = require("webpack");
const Glob = require("glob");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { WebpackManifestPlugin } = require("webpack-manifest-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const LiveReloadPlugin = require("webpack-livereload-plugin");

const configurator = {
  entries: function(){
    var entries = {
      application: [
        './assets/css/application.scss',
      ],
      webtool: [
        './assets/css/webtool.scss',
      ],
    }

    Glob.sync("./assets/*/*/*.*").forEach((entry) => {
      if (entry === './assets/css/application.scss') {
        return
      }
      if (entry === './assets/css/webtool.scss') {
        return
      }

      let key = entry.replace(/(\.\/assets\/(src|js|css|go)\/)|\.(ts|js|s[ac]ss|go)/g, '')
      if(key.startsWith("_") || (/(ts|js|s[ac]ss|go)$/i).test(entry) == false) {
        return
      }

      if( entries[key] == null) {
        entries[key] = [entry]
        console.log("key :",key)
        return
      }

      entries[key].push(entry)
    })
    return entries
  },

  plugins() {
    var plugins = [
      new Webpack.ProvidePlugin({
        $: "jquery",
        jQuery: "jquery",
        "window.jQuery": "jquery",
        jquery: "jquery",
        FormSerializer: "form-serializer",
        Popper: ['popper.js', 'default'],
        Modal: 'exports-loader?Modal!bootstrap/js/dist/modal',
        bootstrap:'bootstrap',
        Popover: 'exports-loader?Popover!bootstrap/js/dist/popover',
        Alert: "exports-loader?Alert!bootstrap/js/dist/alert",
        Tooltip: "exports-loader?Tooltip!bootstrap/js/dist/tooltip",
       
      }),
      new MiniCssExtractPlugin({filename: "[name].[contenthash].css"}),
      //new MiniCssExtractPlugin({filename: "[name].css"}),
      new CopyWebpackPlugin({
        patterns: [{
          from: "./assets",
          globOptions: {
            ignore: [
              "**/assets/css/**",
              "**/assets/js/**",
              "**/assets/src/**",
            ]
          }
        }],
      }),
      new Webpack.LoaderOptionsPlugin({minimize: true,debug: false}),
      new WebpackManifestPlugin({fileName: "manifest.json",publicPath: ""})
    ];

    return plugins
  },

  moduleOptions: function() {
    return {
      rules: [
        {
          test:/\.(scss|css)$/,
          use: [
            MiniCssExtractPlugin.loader,
            { loader: "css-loader", options: {sourceMap: true,}},
            { loader: "postcss-loader",options: {sourceMap: true,}},
            { loader: "sass-loader", options: {sourceMap: true}}
          ]
        },
        { test: /\.tsx?$/, use: "ts-loader", exclude: /node_modules/},
        { test: /\.jsx?$/,loader: "babel-loader",exclude: /node_modules/ },
        { test: /\.(woff|woff2|ttf|svg)(\?v=\d+\.\d+\.\d+)?$/,use: "url-loader"},
        { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,use: "file-loader" },
        { test: /\.go$/, use: "gopherjs-loader"},
        {
          test: /\.(ico|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
          use: [
            {
              options: {
                name: "[name].[ext]",
                outputPath: "images/",

              },
              loader: "file-loader"
            }
          ]
        }
      ]
    }
  },

  buildConfig: function(){
    // NOTE: If you are having issues with this not being set "properly", make
    // sure your GO_ENV is set properly as `buffalo build` overrides NODE_ENV
    // with whatever GO_ENV is set to or "development".
    const env = process.env.NODE_ENV || "development";
    //console.log("Entries : ",configurator.entries())

    var config = {
      mode: env,
      entry: configurator.entries(),
      output: {
        filename: "[name].js",
        //filename: "[name].js",
        path: `${__dirname}/public/assets`,
        clean: true,
        // library: {
        //   name: "mcpjs",
        //   type: "global",
        // },
        library:[
          'mcpjs', "[name]"
        ]
      },
      // optimization: {
      //   splitChunks: {
      //     chunks: 'all',
      //   },
      // },
      // optimization:{

      //   splitChunks: {
      //     cacheGroups: {
      //       vendor: {
      //         test: /[\\/]node_modules[\\/]jquery[\\/]/,
      //         name: 'vendor',
      //         chunks: 'all',
      //       },
      //     },
      //   },
      // },
      plugins: configurator.plugins(),
      module: configurator.moduleOptions(),
      resolve: {
        extensions: ['.ts', '.js', '.json']
      }
    }

    if( env === "development" ){
      config.plugins.push(new LiveReloadPlugin({appendScriptTag: true}))
      return config
    }

    const terser = new TerserPlugin({
      terserOptions: {
        compress: {},
        mangle: {
          keep_fnames: true
        },
        output: {
          comments: false,
        },
      },
      extractComments: false,
    })

    config.optimization = {
      minimizer: [terser]
    }

    return config
  }
}

module.exports = configurator.buildConfig()