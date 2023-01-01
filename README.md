# aao-sdplugin-fcu
Patch for Lorby SI AAO Plugin for Elgato Stream Deck to support FCU

## Manifest

In der `manifest.json` Datei müssen die vier FCU Bildschirme hinzugefügt werden, damit sie in den StreamDeck Einstellungen den Bildschirmen zugewiesen werden können:

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

## FCU Code importieren

Damit die ganze FCU Implementierung von dem Plugin geladen wird, muss eine Zeile in der `code.html` hinzugefügt werden:

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

## AAO Plugin patchen

Damit das FCU korrekt funktioniert, müssen einige Kleinigkeiten an der `js/aaoDeck.js` Datei geändert werden:

```diff
@@ -75,17 +75,17 @@
       event === "keyDown" ||
       (event === "dialPress" && jsonPayload["pressed"] == true)
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
               longclickTimout = parseInt(settings["longclicktimeout"]);
             } else {
@@ -252,16 +252,17 @@
           canvas.height = 144;
           actions[context] = new RotaryEncoderAction(
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
               bulkInitScript = bulkInitScript + gsimvars[i] + " ";
           }
@@ -665,16 +666,17 @@
             ) {
               settings["cursimval"] = simVal;
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
       setState(connActCtx, 0);
       connState = false;
```

## FCU Implementierung

Zum Schluss muss natürlich noch die `js/fcu.js` Datei in den `js` Ordner des Plugins gelegt werden.
