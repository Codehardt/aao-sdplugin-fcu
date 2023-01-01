# aao-sdplugin-fcu
Patch for Lorby SI AAO Plugin for Elgato Stream Deck to support FCU

## Manifest

The `manifest.json` has to be patched as follows to be able to map the FCU to the four displays of the Stream Deck:

```diff
@@ -172,12 +172,80 @@
                        }
                ],
                "UUID": "com.lorby-si.aao.rotary",
                "VisibleInActionsList": true,
                "UserTitleEnabled" : true,
                "SupportedInMultiActions": true
+       },
+       {
+               "Icon": "images/Lorby_Standard_rotate_trans",
+               "Name": "FCU 1",
+               "Controllers": ["Encoder"],
+               "Encoder": {
+                       "layout": "$A0"
+               },
+               "States": [
+                       {
+                               "Image": "images/blank"
+                       }
+               ],
+               "UUID": "de.codehardt.fcu1",
+               "VisibleInActionsList": true,
+               "UserTitleEnabled" : true,
+               "SupportedInMultiActions": true
+       },
+       {
+               "Icon": "images/Lorby_Standard_rotate_trans",
+               "Name": "FCU 2",
+               "Controllers": ["Encoder"],
+               "Encoder": {
+                       "layout": "$A0"
+               },
+               "States": [
+                       {
+                               "Image": "images/blank"
+                       }
+               ],
+               "UUID": "de.codehardt.fcu2",
+               "VisibleInActionsList": true,
+               "UserTitleEnabled" : true,
+               "SupportedInMultiActions": true
+       },
+       {
+               "Icon": "images/Lorby_Standard_rotate_trans",
+               "Name": "FCU 3",
+               "Controllers": ["Encoder"],
+               "Encoder": {
+                       "layout": "$A0"
+               },
+               "States": [
+                       {
+                               "Image": "images/blank"
+                       }
+               ],
+               "UUID": "de.codehardt.fcu3",
+               "VisibleInActionsList": true,
+               "UserTitleEnabled" : true,
+               "SupportedInMultiActions": true
+       },
+       {
+               "Icon": "images/Lorby_Standard_rotate_trans",
+               "Name": "FCU 4",
+               "Controllers": ["Encoder"],
+               "Encoder": {
+                       "layout": "$A0"
+               },
+               "States": [
+                       {
+                               "Image": "images/blank"
+                       }
+               ],
+               "UUID": "de.codehardt.fcu4",
+               "VisibleInActionsList": true,
+               "UserTitleEnabled" : true,
+               "SupportedInMultiActions": true
        }
   ],
   "ApplicationsToMonitor": {
     "windows": [
         "LorbyAxisAndOhs.exe",
         "LorbyAxisAndOhs_MSFS.exe",
```

## Entry Point

The entry point `code.html` has to be patched as follows to import our custom code to the plugin:

```diff
@@ -15,10 +15,11 @@
         <script src="js/textGaugeAction.js"></script>
         <script src="js/steamGaugeAction.js"></script>
         <script src="js/sliderGaugeAction.js"></script>
         <script src="js/multiGaugeAction.js"></script>
         <script src="js/multiTileGaugeAction.js"></script>
         <script src="js/rotaryEncoderAction.js"></script>
+        <script src="js/fcu.js"></script>
         <script src="js/aaoDeck.js"></script>
         <script src="js/main.js"></script>
     </head>
 </html>
```

## AAO Deck

The `js/aaoDeck.js` file has to be patched as follows to initialize and call our custom fcu stuff:

```diff
@@ -77,13 +77,13 @@
     ) {
       // console.info("keyDown");

       // Send onKeyDown event to actions
       if (context in actions) {
         if (actions[context].onKeyDown) {
-          if (settings["longsimevt"]) {
+          if (settings["longsimevt"] || actions[context].hasLongSimEvt?.()) {
             longclickarmed = true;
             lccontext = context;
             if (
               settings["longclicktimeout"] &&
               settings["longclicktimeout"] !== "0"
             ) {
@@ -254,12 +254,13 @@
             context,
             settings,
             coordinates,
             canvas
           );
         }
+        fcuWillAppear(actions, action, context, settings, coordinates);
         if (actions[context]) {
           var gsimvars = actions[context].getSimVars();
           for (let i = 0; i < gsimvars.length; i++) {
             var getvar = { var: gsimvars[i], value: 0.0 };
             AddVar(getvar);
             if (!bulkInitScript.includes(gsimvars[i]))
@@ -667,12 +668,13 @@
               requestSettings(ctx);
             }
           }
         }
       }
     }
+    RenderFCU(simvars, websocket);
   }

   function dataRequestError() {
     // writeToLog("DataLoop error, loop terminated");
     // console.log("DataLoop error, loop terminated");
     if (connActCtx) {
```

## FCU Implementation

You have to put the `js/fcu.js` file in this project to the `js` directory of the AAO plugin
