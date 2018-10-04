# e-qis-web

A JavaScript front end for administrating e-qis users and reviewing / visualizing e-qis participant data.

## Dependencies

This project has dependencies on Less for CSS, backbone.js, Bootstrap and [ohmage.js](https://github.com/ohmage/ohmage.js). One of the development goals is to minimize the number of external dependencies.

## Installation and Setup

For a clean install you must first issue the command `npm install`.

This project uses [grunt](http://gruntjs.com/) for handling build and deployment tasks. To ensure matching dependencies, Grunt and Grund-CLI are installed locally, and using the locally-installed Grunt is recommended.

### Commands

`npm install` - required before running other commands.

## Development Build

### Commands

`npm run init-lib` - Run this before starting development. This fetches Bower dependencies, creates initial generated directories, and re-compiles `vendors.js`. **Be sure to run this again if any dependencies or the contents of the `/client/vendor` folder change.**

`npm run build-dev` - This generates a `/build` folder containing the app, compiles all Javascript, CSS, and dynamic HTML templates.

`npm run watch-dev` - Runs watchers that automatically re-generate when the relevant files are modified, and runs a local development server (with proxies). The path to the server should appear in the command line watcher output.

`npm run bwdev` - Use this (shorthand for build watch dev) if you'd like to build before running the watcher.


## Production Build

### Commands

`npm run build-prod` - generates a `dist/` folder that contains the complete site with minified/uglified assets.

This also generates a simple tarball in the `dist/` folder that can be extracted and served by a web server.

## Deploy

After running `npm run build-prod`, collect up the generated tarball from the `dist/` folder. Put it on the system and untar it into the proper ohmage directory (currently `/var/www/e-qis-web`).  This will put the needed files into the directory ./dist which must be moved into the proper directory for use.

## App File Structure

### The `/client` folder

This is the heart of your development workflow. Make changes to the files here, and they should all propagate to the right places if your watcher is running.

- `/img` - App images.
- `/src` - The local app source code. Also includes the `index.pug` template in the root. All source files are modularized using Browserify NPM-style syntax.
- '/styles' - of particular importance is the `/client/styles/less/all.less`. Include all of your other LESS and CSS files in this one, since it's the target for the LESS transpile.
- `/templates` - JST templates that your app source files can use. Accessed in your app with `JST['templates/path/to/template.html']`
- `/vendor` - These are local vendor libraries that don't have a handy Bower or NPM install. These are concatenated with the other vendor libs so their variables can be accessed in the global scope.

### Generated folders (ignored by Git)

- `/build` - local development server runs here. Other "interim" assets are kept here such as the `vendor.js`.
- `/dist` - contains minified/compress build for distribution, git.txt, and tarball.
- `/bower_components` - Raw Bower installation assets
- `/requires` - Key Bower files that are extracted from bower_components and put into an easily-accessed structure. Vendor libs included here into `vendor.js` are placed into the global scope.
