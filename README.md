# aao-sdplugin-fcu
Patch for Lorby SI AAO Plugin for Elgato Stream Deck to support FCU

## Manifest

In der `manifest.json` Datei müssen die vier FCU Bildschirme hinzugefügt werden, damit sie in den StreamDeck Einstellungen den Bildschirmen zugewiesen werden können:

```json
{
    "Icon": "images/Lorby_Standard_rotate_trans",
    "Name": "FCU 1",
    "Controllers": ["Encoder"],
    "Encoder": {
        "layout": "$A0"
    },
    "States": [
        {
            "Image": "images/blank"
        }
    ],
    "UUID": "de.codehardt.fcu1",
    "VisibleInActionsList": true,
    "UserTitleEnabled" : true,
    "SupportedInMultiActions": true
},
{
    "Icon": "images/Lorby_Standard_rotate_trans",
    "Name": "FCU 2",
    "Controllers": ["Encoder"],
    "Encoder": {
        "layout": "$A0"
    },
    "States": [
        {
            "Image": "images/blank"
        }
    ],
    "UUID": "de.codehardt.fcu2",
    "VisibleInActionsList": true,
    "UserTitleEnabled" : true,
    "SupportedInMultiActions": true
},
{
    "Icon": "images/Lorby_Standard_rotate_trans",
    "Name": "FCU 3",
    "Controllers": ["Encoder"],
    "Encoder": {
        "layout": "$A0"
    },
    "States": [
        {
            "Image": "images/blank"
        }
    ],
    "UUID": "de.codehardt.fcu3",
    "VisibleInActionsList": true,
    "UserTitleEnabled" : true,
    "SupportedInMultiActions": true
},
{
    "Icon": "images/Lorby_Standard_rotate_trans",
    "Name": "FCU 4",
    "Controllers": ["Encoder"],
    "Encoder": {
        "layout": "$A0"
    },
    "States": [
        {
            "Image": "images/blank"
        }
    ],
    "UUID": "de.codehardt.fcu4",
    "VisibleInActionsList": true,
    "UserTitleEnabled" : true,
    "SupportedInMultiActions": true
}
```

Dieser Code muss nach z.B. dem `Rotary Encoder` Eintrag hinzugefügt werden, das sieht dann in etwa so aus:

```json
// ...
{
    "Icon": "images/Lorby_Standard_rotate_trans",
    "Name": "Rotary Encoder",
    "Controllers": ["Encoder"],
    "Encoder": {
        "layout": "$B1"
    },
    "States": [
        {
            "Image": "images/blank"
        }
    ],
    "UUID": "com.lorby-si.aao.rotary",
    "VisibleInActionsList": true,
    "UserTitleEnabled" : true,
    "SupportedInMultiActions": true
},
{
    "Icon": "images/Lorby_Standard_rotate_trans",
    "Name": "FCU 1",
    "Controllers": ["Encoder"],
    "Encoder": {
        "layout": "$A0"
    },
    "States": [
        {
            "Image": "images/blank"
        }
    ],
    "UUID": "de.codehardt.fcu1",
    "VisibleInActionsList": true,
    "UserTitleEnabled" : true,
    "SupportedInMultiActions": true
},
// ... hier folgen FCU 2, FCU 3 und FCU 4
```

## FCU Code importieren

Damit die ganze FCU Implementierung von dem Plugin geladen wird, muss eine Zeile in der `code.html` hinzugefügt werden:

```html
<script src="js/fcu.js"></script>
```

Wichtig ist, dass diese Zeile auf jeden Fall irgendwo vor der Zeile

```html
<script src="js/aaoDeck.js"></script>
```

hinzugefügt wird, ansonsten kommt es zu Fehlern.

Insgesamt könnte das dann in etwa so aussehen _(nicht alles kopieren, da es nach einem Update anders aussehen könnte)_:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>com.lorby-si.aao</title>
    <meta charset="UTF-8" />
    <link rel="stylesheet" href="lorbyaoopluginstyles.css" />
    <script src="settings.js"></script>
    <script src="js/timer.js"></script>
    <script src="js/connectionAction.js"></script>
    <script src="js/toggleAction.js"></script>
    <script src="js/onOffAction.js"></script>
    <script src="js/buttonAction.js"></script>
    <script src="js/eventAction.js"></script>
    <script src="js/dualEventAction.js"></script>
    <script src="js/textGaugeAction.js"></script>
    <script src="js/steamGaugeAction.js"></script>
    <script src="js/sliderGaugeAction.js"></script>
    <script src="js/multiGaugeAction.js"></script>
    <script src="js/multiTileGaugeAction.js"></script>
    <script src="js/rotaryEncoderAction.js"></script>
    <script src="js/fcu.js"></script>
    <script src="js/aaoDeck.js"></script>
    <script src="js/main.js"></script>
  </head>
</html>
```

## AAO Plugin patchen

Damit das FCU korrekt funktioniert, müssen einige Kleinigkeiten an der `js/aaoDeck.js` Datei geändert werden:

```diff
ao.sdPlugin_20221231/com.lorbysi.aao.sdPlugin/js/aaoDeck.js
--- com.lorbysi.aao.sdPlugin/js/aaoDeck.js      2023-01-01 17:54:43.176156100 +0100
+++ com.lorbysi.aao.sdPlugin_20221231/com.lorbysi.aao.sdPlugin/js/aaoDeck.js    2023-01-01 17:54:43.276678600 +0100
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
