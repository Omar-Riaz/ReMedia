/**
 * THIS IS AN EVENT PAGE. PRETTY MUCH A GENERAL EVENT HANDLER.
 * GOOD FOR PAGE INITIALIZATION STUFF
 */
"use strict";


let tabId = 0;          //dummy value

function createContextMenus(){
  let annotationText;
  let contextMenuProps = {
    type: 'normal',
    id: '1',
    contexts: ['selection'],
    title: 'ReMedia: annotate selection'
  };
  let contextMenuProps2 = {
    type: 'normal',
    id: '2',
    contexts: ['page'],
    title: 'ReMedia: show mini annotater'
  };

  // let contextMenuProps2 = {
  //     type: 'normal',
  //     id: '2',
  //     contexts: ['selection'],
  //     title: 'ReMedia: view annotations'
  // };
  // let contextMenuProps3 = {
  //     type: 'normal',
  //     id: '3',
  //     contexts: ['selection'],
  //     title: 'ReMedia: view others annotations'
  // };
  chrome.contextMenus.create(contextMenuProps);
  chrome.contextMenus.create(contextMenuProps2);
  //chrome.contextMenus.create(contextMenuProps2);
  //chrome.contextMenus.create(contextMenuProps3);
}

function generateTooltip() {

};

chrome.runtime.onInstalled.addListener(details =>{
  createContextMenus();
  //	alert(changeInfo.status);
  //if (changeInfo.status === 'complete') {
  registerEvents();
  //}
});


// chrome.webNavigation.onCompleted.addListener((details) =>{
//     registerEvents();           //get events registered
// });

function triggerMiniModal(){
  let tabIdPromise = new Promise((resolve, reject) => {
    chrome.tabs.query({active: true, currentWindow: true}, tabs => {            //get tab, to refer to tab ID.      WILL BREAK IF NOT KEEPING TAB IN THE SELECTED STATE
      resolve(tabs[0].id);
    });
  });
  tabIdPromise.then(tabId => {
    getCurrentTabUrl().then(url=>{
      chrome.tabs.sendMessage(tabId, {contentType: "triggerMiniModal", url: url}, response => {
        if (response) {
          console.log(response);//indication that content script is rendering
        }
      });
    });
  });
}

function registerEvents() {
  //this logic needs to run after every page load
  chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {       //NOTE: I think this runs multiple times. would be nice to only run once
                                                                              //setup the modal window in content Script
    let tabIdPromise = new Promise((resolve, reject) => {
      chrome.tabs.query({active: true, currentWindow: true}, tabs => {            //get tab, to refer to tab ID.      WILL BREAK IF NOT KEEPING TAB IN THE SELECTED STATE
        resolve(tabs[0].id);
      });
    });
    tabIdPromise.then(tabId => {
      tabId = tabId;
      chrome.tabs.sendMessage(tabId, {contentType: "create"}, response => {
        if (response) {
          console.log(response);//indication that content script is rendering
        }
      });
    });

    // //note: will replace the tooltip on medium articles???
    // let script =
    //   "document.onselectionchange = function(){" +
    //   "var editor = new MediumEditor('.editable', {\n" +
    //   "    toolbar: {\n" +
    //   "        /* These are the default options for the toolbar,\n" +
    //   "           if nothing is passed this is what is used */\n" +
    //   "        allowMultiParagraphSelection: true,\n" +
    //   "        buttons: ['bold', 'italic', 'underline', 'anchor', 'h2', 'h3', 'quote'],\n" +
    //   "        diffLeft: 0,\n" +
    //   "        diffTop: -10,\n" +
    //   "        firstButtonClass: 'medium-editor-button-first',\n" +
    //   "        lastButtonClass: 'medium-editor-button-last',\n" +
    //   "        relativeContainer: null,\n" +
    //   "        standardizeSelectionStart: false,\n" +
    //   "        static: false,\n" +
    //   "        /* options which only apply when static is true */\n" +
    //   "        align: 'center',\n" +
    //   "        sticky: false,\n" +
    //   "        updateOnEmptySelection: false\n" +
    //   "    }\n" +
    //   "});" +
    //   "}";
    //
    // let executeScriptPromise = new Promise((resolve, reject) => {
    //   chrome.tabs.executeScript({
    //     code: script
    //   }, function (response) {                  //promise won't return anything
    //     console.log("medium toolbar registered:" + response);
    //     resolve(response);
    //   });
    // });
  });

  function clickEvent(option) {                                      //need response and url in the event registration. must therefore register for each page
    //annotationText = performAnnotate();
    //saveAnnotation(response, annotationText);
    let menuId = option.menuItemId;
    if(menuId == 1)	preSaveAnnotation();
    else if(menuId == 2)	triggerMiniModal();
  }
  chrome.contextMenus.onClicked.addListener(clickEvent);
}


/**
 * Get the current URL.
 *
 * @param {function(string)} callback called when the URL of the current tab
 *   is found
 */
function getCurrentTabUrl() {
  // Query filter to be passed to chrome.tabs.query - see
  // https://developer.chrome.com/extensions/tabs#method-query
  let queryInfo = {
    active: true,
    currentWindow: true
  };
  return new Promise((resolve, reject) =>{
    chrome.tabs.query(queryInfo, (tabs) => {
      // chrome.tabs.query invokes the callback with a list of tabs that match the
      // query. When the popup is opened, there is certainly a window and at least
      // one tab, so we can safely assume that |tabs| is a non-empty array.
      // A window can only have one active tab at a time, so the array consists of
      // exactly one tab.
      let tab = tabs[0];
      // A tab is a plain object that provides information about the tab.
      // See https://developer.chrome.com/extensions/tabs#type-Tab
      let url = tab.url;
      // tab.url is only available if the "activeTab" permission is declared.
      // If you want to see the URL of other tabs (e.g. after removing active:true
      // from |queryInfo|), then the "tabs" permission is required to see their
      // "url" properties.
      console.assert(typeof url == 'string', 'tab.url should be a string');
      resolve(url);
      //callback();
      //annotationsList(url);
    });
  });
  // return aPromise.then(response =>{
  //    return response;
  // });
}


/**
 * Question: can/should this go in a contentScript
 * Loads the single selected quote in UI
 */
function loadQuote() {
  //update the extension text
  return new Promise((resolve, reject) => {
    let script = 'document.getSelection().toString()';
    let annotation;
    // See https://developer.chrome.com/extensions/tabs#method-executeScript.
    // chrome.tabs.executeScript allows us to programmatically inject JavaScript
    // into a page. Since we omit the optional first argument "tabId", the script
    // is inserted into the active tab of the current window, which serves as the
    // default.
    let executeScriptPromise = chrome.tabs.executeScript({
      code: script
    }, function (response) {
      //document.getElementById("quoteText").innerHTML = response[0];
      console.log(response[0]);
      resolve(response[0]);
    });
  });
}


/**
 * perform annotations on a single selected quote
 */
function performAnnotate() {

  // //update the extension text
  //  let script = 'document.getSelection().toString()';
  //  let annotation;
  //  // See https://developer.chrome.com/extensions/tabs#method-executeScript.
  //  // chrome.tabs.executeScript allows us to programmatically inject JavaScript
  //  // into a page. Since we omit the optional first argument "tabId", the script
  //  // is inserted into the active tab of the current window, which serves as the
  //  // default.
  //  let executeScriptPromise = chrome.tabs.executeScript({
  //    code: script
  //  }, function (response){
  //     document.getElementById("quoteText").innerHTML=response[0];
  //     annotation = prompt("enter your annotation");
  //     document.getElementById("annotationText").innerHTML=annotation;
  //     return annotation;
  //  });

  let annotation = prompt("enter your annotation");
  //document.getElementById("annotationText").innerHTML = annotation;
  return annotation;

}


/**
 * Gets the saved annotation for url.
 *
 * @param {string} url URL whose annotations are to be retrieved.
 * @param {function(string)} callback called with the saved annotations for
 *     the given url on success, or a falsy value if no annotations are retrieved.
 */
function getSavedAnnotations(url) {
  // See https://developer.chrome.com/apps/storage#type-StorageArea. We check
  // for chrome.runtime.lastError to ensure correctness even when the API call
  // fails.
  // chrome.storage.sync.get(url, (items) => {
  //   callback(chrome.runtime.lastError ? null : items[url]);
  // });
  return new Promise((resolve, reject) =>{
    console.log(url);
    chrome.storage.sync.get(url, (urlObject) => {
      //console.log(urlObject.annotations);
      /*ANNOTATION STRUCTURE:
        "url":{
          "quote1": {//annotation + other data}
          "quote2": {//annotation + other data}
        }
      */
      resolve(chrome.runtime.lastError ? null : urlObject[url]);
    });
  });
}

/**
 * Sets the annotations for url of current page.
 *
 * @param {string} url URL for page of which contains the annotations that are to be saved.
 * @param {string} quoteText The quote to be saved.
 * @param {string} annotationText The annotation to be saved
 */
function saveAnnotation(url, quoteText, annotationText) {
  if(!quoteText || !annotationText)   return;                 //don't do anything if annotation invalid
  /*chrome.storage.sync.get(url, result => {
      let items = result;

      let annotationObject = {                                //new Object representing annotation metadata to add to annotations
          quoteText: quoteText,
          annotationText: annotationText
      };
    let annotationsArray = [];
    annotationsArray.push(annotationObject);
      if(Object.values(items)[0])               //include previous annotations if they exist. the 0 property comes from chrome API--> adds an integer key to all thing u save
annotationsArray = annotationsArray.concat(Object.values(items)[]);
    //annotationsArray.push(annotationObject);                //include the new annotation
      items = {["" + url]: {                                  //"recreate" the key-value object to store in chrome storage (key is the url)
          annotations: annotationsArray
      }};

      // console.log(items);
      chrome.storage.sync.set(items, ()=>{

      });                         //save onto chrome storage
});*/
  let items = {};
  items[url] = [];
  items[url][quoteText] = {};
  items[url][quoteText].annotation = annotationText;
  chrome.storage.sync.set(items[url][quoteText], ()=>{
    annotationsList(url);
  });
}

/*
function saveAnnotations(annotations) {
annotationsArray = annotationsArray.concat(Object.values(items)[0].annotations);
//annotationsArray.push(annotationObject);                //include the new annotation
let items =
items = {["" + url]: {                                  //"recreate" the key-value object to store in chrome storage (key is the url)
annotations: annotationsArray
}};
//console.log(items);
chrome.storage.sync.set(items, ()=>{

});                         //save onto chrome storage
}*/



// This extension loads the saved annotations for the current tab if one
// exists. The chrome.storage API is used for this purpose. This is different
// from the window.localStorage API, which is synchronous and stores data bound
// to a document's origin. Also, using chrome.storage.sync instead of
// chrome.storage.local allows the extension data to be synced across multiple
// user devices.

function preSaveAnnotation() {
  // let quoteText = loadQuote();
  // let annotationText;
  // let annotations = [];
  // let url = getCurrentTabUrl();
  // if(!previousAnnotation) quotePromise = loadQuote();
  let theQuote = "";
  let annotationText;
  let annotations = [];
  let urlPromise = getCurrentTabUrl();
  let theUrl;

  urlPromise.then(url => {            //get Url of current selected tab
    theUrl = url;
    let quotePromise = loadQuote();
    quotePromise.then(quote =>{
      theQuote = quote;
    });
    getSavedAnnotations(theUrl);
  }).then(savedAnnotations => {               //ask for user input, save it as annotation and display the modal
    // annotationText = performAnnotate();
    //saveAnnotation(theUrl, theQuote, annotationText);
    console.log("about to render modal");
    let tabIdPromise = new Promise((resolve, reject) => {                           //Promise wrapper needed to force synch. behaviour
      chrome.tabs.query({active: true, currentWindow: true}, tabs => {            //get tab, to refer to tab ID.      WILL BREAK IF NOT KEEPING TAB IN THE SELECTED STATE
        resolve(tabs[0].id);
      });
    });
    tabIdPromise.then(tabId =>{
      chrome.tabs.sendMessage(tabId, {contentType: "url", quoteText: theQuote, url: theUrl}, response => {
        if (response) {
          console.log(response);      //indication that content script is rendering
        }
      });
    });
  });
}

//Find an annotation by its quote, from the currently saved annotations
function findAnnotation(quoteText){
  let annotations = annotationFunctions.getSavedAnnotations();
  let theNewAnnotations = annotations.filter(annotation =>{
    if(annotation.quoteText === quoteText) return annotation;
  });
  return theNewAnnotations[0];
}

