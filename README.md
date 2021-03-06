### Twirlip7 Programmable Notebook

Try it here: http://rawgit.com/pdfernhout/Twirlip7/master/src/ui/twirlip7.html

Right now, this is just a simple IDE for playing with JavaScript and Mithril.js which stores snippets of code or text in a local journal.

As an experiment, questions include how could these snippets be stored, retrieved, visualized, referenced, annotated, shared, versioned, or discussed?

The goal of the experiment is to explore such ideas as another step towards a social semantic desktop.

The journal is stored in local storage by default.
You can click on the "Journal" dropdown to switch from using local storage to memory storage or server storage for new items.

And entire journal of snippets can be exported or imported as JSON.
You can also copy and paste individual items (including their history) between Twirlip7 journals via data URLs using the clipboard.

However, all that may change as the experiment progresses in new directions.
For example, as one possibility, these snippets and content they generate might someday be distributed through the decentralized Matrix.org.

The IDE supports some functionality inspired by the Smalltalk "Workspace". You can select a section of code in the editor and then "do it" to evaluate the code, "print it" to insert the evaluation result in the editor, or "inspect it" to see the evaluation result (in the JavaScript console in this case). If you don't select anything specific, all the code in the editor is evaluated.

To test this, click "Show example log" which will put some JSON text in the editor window, and then click "Load log" to start using the log of snippets. Then use Previous and Next buttons to scroll through snippets. Click "Do it" to evaluate a snippet. Select text and then Do, Print, or Inspect just that text (e.g. "1 + 1"). Supports Import and Export of editor content to a file. You can edit snippets and click "Save" to add them to the log of snippets.

The UI uses Mithril.js, Tachyons.js, RequireJS, and the ACE editor in plain JavaScript. The UI currently expects ES6 in a modern browser.

The Server uses Node.js with Express to serve the UI files and to store and retrieve items shared by all users.
Using the server requires running "npm install" to load the supporting npm modules and then "npm start" to run the server. 
If you want to allow the server to proxy requests to avoid CORS issues when retrieving data from different sites,
you need to add a proxyKey.txt file with a proxyKey passphrase which must be supplied in proxy requests.

You don't need to install and run the server to do some simple tests.
You can just load the UI files directly into your browser (like with the rawgit example).
If you run without the server, however, you can only store data in memory or local storage;
the server journal option will be greyed out in the UI.
Also, proxy support is not available without the server, so the proxying examples won't work.

No required build step (yet).

### Controlling editor startup to edit or run examples

You can edit a simple example canvas app here: https://rawgit.com/pdfernhout/Twirlip7/master/src/ui/twirlip7.html#edit=examples/canvas-example.js

You can run the simple example canvas application here: http://rawgit.com/pdfernhout/Twirlip7/master/src/ui/twirlip7.html#eval=examples/canvas-example.js

You can edit a complex example IBIS app -- written using Twirlip7 -- here: https://rawgit.com/pdfernhout/Twirlip7/master/src/ui/twirlip7.html#edit=examples/ibis_application.js

You can run the complex example IBIS application: http://rawgit.com/pdfernhout/Twirlip7/master/src/ui/twirlip7.html#eval=examples/ibis_icons.js;examples/ibis_application.js

### Using the editor to edit and run any JavaScript on GitHub

This edit and run functionality is mostly for demo purposes, but you can also edit or run any JavaScript on GitHub with relative path navigation on rawgit.
For example: https://rawgit.com/pdfernhout/Twirlip7/master/src/ui/twirlip7.html#edit=../../../../../MithrilJS/mithril.js/next/examples/todomvc/todomvc.js

You can even get that code to run (sort-of) by adding these extra three line of code just before the m.route line to create a needed div the app's HTML file otherwise supplies.
```
var div = document.createElement("div")  
div.id = "todoapp"  
document.body.appendChild(div)  
```

Click "Do it" to get that Mithril todomvc demo to sort-of work under Twirlip7.
The app will not have CSS styling so it will look odd. You could add Tachyons inline CSS to fix that.
Using the Mithril router in an app is also problematical if other apps you run in the same editor use routing too.

### License: MIT

### Screenshots

Note: The IDE screenshot here is significantly out-of-date as more features have been added since it was made.

Screenshot of Twirlip7 editor showing a code snippet with a simple temperature convertor in Mithril (after having pressed "Do it"):

![Twirlip7 Screenshot showing F-to-C snippet in editor](screenshots/Twirlip7_Screenshot_showing_F-to-C_snippet_2017-05-19.png?raw=true "Twirlip7 Screenshot showing F-to-C snippet in editor after pressing Do it")

Screenshot showing the same code snippet opened in a new tab as a stand-alone-looking app (after having pressed "Open it"):

![Twirlip7 Screenshot showing F-to-C snippet opened in a new tab](screenshots/Twirlip7_Screenshot_showing_F-to-C_opened_2017-05-19.png?raw=true "Twirlip7 Screenshot showing F-to-C snippet opened as an app running in a new tab after pressing Open it")
