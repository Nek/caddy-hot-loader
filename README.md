# Caddy jspm-hot-reloader
For use with Caddy HTTP/2 Web Server

Requires [caddy-hot-watcher](https://github.com/jhkennedy4/caddy-hot-watcher)

Reload your ES6 modules as you change them. Similar to browserify hot module replacement, but running in your browser.

## About
This project is a fork of [Jiri Spac](https://github.com/capaj)'s [jspm-hot-reloader](https://github.com/capaj/jspm-hot-reloader) rewritten without a Socket.io dependency.
Instead, it relies on Caddy's websocket middleware and `caddy-hot-watcher` to alert System.js to filesystem changes.

#### Changes
Only tested with ES6 modules, no test suite in place (yet), temporarily removed support for CommonJS modules.

## Install
```
jspm i github:jhkennedy4/jspm-hot-reloader
```
And if $GOPATH/bin is in your $PATH
```
go get github.com/jhkennedy/caddy-hot-watcher
```

## Usage
Put this in your index.html(or anywhere really)
```javascript
if (location.origin.match(/localhost/)) {
  // enable debug
  System.import('jhkennedy4/caddy-hot-loader').then(function (HotReloader) {
    // caddy websocket endpoint
    let reloadPath = location.host + '/hot-watcher'
    new HotReloader.default(reloadPath)
  })
}
```

And add the following line to your Caddyfile:
```
websocket /hot-watcher caddy-hot-watcher
```

You can drop the if statement, but it is nice and convenient to load reloader only for when on localhost. That way you can go into production without changing anything.

## Examples

Boilerplate projects set up for hot reloading modules:
- [React](https://github.com/jhkennedy4/jspm-pages)

TODO:
Should soon be able to be deployed straight to GithubPages

## Why
System.js and HTTP/2 are the future. Caddy supports HTTP/2 out of the box, allowing you to take advantage of all the benefits of using a browser based module loader, skip a bundle step, and live in the future.

Using Caddy and JSPM, going from development to production no longer requires a build step for your static assets.

## Preserving state
If you want some state to persist through hot reload, just put it in a module separate from the component. You are free to use any kind of value store, as long as it sits in separate module from your reloaded component.

## How
When a change event is emitted by `caddy-hot-watcher`, we match a module in System._loader.moduleRecords.
If a match is found, we then aggressively delete the changed module and recursively all modules which import it directly or indirectly via other modules. This ensures we always have the latest version of code running, but we don't force the browser into unnecessary work.
Last step is to import again all modules we deleted, by calling import on the one that changed-module hierarchy will make sure all get loaded again.

## Unload hook
Any module, which leaves side effects in the browser and you want to hot-reload properly should export
```javascript
export function __unload(){
	// cleanup here
}
```
This is needed for example for [Angular](https://github.com/capaj/NG6-starter/blob/eb988ef00685390618b5dad57635ce80c6d52680/client/app/app.js#L42), which needs clean DOM every time it bootstraps.

## Credit
We're a few layers deep here. This would not be possible without [Jiri Spac](https://github.com/capaj)'s excellent [jspm-hot-reloader](https://github.com/capaj/jspm-hot-reloader). If you are not interested in using Caddy, that's the place to go.

He credits [Guy Bedford](https://github.com/guybedford), who I can only assume is a wonderful fellow who I owe dearly secondhand.

## Contributing
Code is written in [![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

1. fork it
2. write your code
3. open PR
4. lay back and if you want to speed it up, hit me up on [twitter](https://twitter.com/jhkennedy)
