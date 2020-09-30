# Things to Note with Browserify
Edit the naval\_letter.js file to keep a small file (the bundled file gets
really large). If you want one of the functions to be accessible from the HTML,
you will need to place it in the JS object under module.exports. The first name
is the name that you will use in the HTML and the second is the name of the
function in the JS file. For example, if I created a function in the JS file
called "viaBackgroundColorChange" and wanted it to be called "viaColorChange" in
the HTML file, it would look like:

```javascript
function viaColorChange() {
  // my code here
}

module.exports = {..., viaColorChange: viaBackgroundColorChange};
```

Then, to call this function in the HTML, you first have to refer to the bundle
that is exported by browserify. If you use the command below it will be called
the generatorBundle. Continuing with the example from above, to call
viaColorChange, you would do something:

```html
<button type="button" onclick="generatorBundle.viaColorChange()">Click here!</button>
```

## Bundling and Running
After editing the naval\_letter.js file to add in any functionality, you then
need to bundle this prior to running/serving it on the webserver. To bundle
this, use the command:

```bash
browserify naval_letter.js -t brfs --standalone generatorBundle > ./bundle.js
```

Make sure you run this in the assets/js directory. Additionally, you will have
to ensure that you have installed browserify and any npm modules that are used
by the bundler. Currently, that is 'brfs' and 'docx'.

Then, to run the server locally, you will use: 

```bash
bundle exec jekyll serve
```

For this, you can also append `--livereload` to have the page automatically
reload when a file changes.

Once merged into master, this will be served! And live! Be careful! Also,
remember to run the `browserify` command above prior to commiting your code.
This has to be done to make sure the bundle.js file is correct.
