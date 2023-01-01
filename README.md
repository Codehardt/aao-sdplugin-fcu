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

Damit das FCU korrekt funktioniert, müssen einige Kleinigkeiten an der `js/aaoDeck.js` Datei geändert werden.

### FCU Generator initialisieren

An der Stelle, wo im Plugin die ganzen Aktionen initialisiert werden, muss auch die FCU initialisiert werden.

Dazu muss folgende Zeile in den Code hinzugefügt werden:

```js
fcuWillAppear(actions, action, context, settings, coordinates);
```

Diese Zeile müsste hinzugefügt werden vor dem folgenden bereits existierenden Code-Block:

```js
if (actions[context]) {
  var gsimvars = actions[context].getSimVars();
  for (let i = 0; i < gsimvars.length; i++) {
    var getvar = { var: gsimvars[i], value: 0.0 };
    AddVar(getvar);
    if (!bulkInitScript.includes(gsimvars[i]))
      bulkInitScript = bulkInitScript + gsimvars[i] + " ";
  }
}
```

Es kann natürlich sein, dass dieser durch ein Update ein klein bisschen anders aussieht.

Insgesamt müsste der Abschnitt dann in etwa so aussehen:

```js
else if (action === ('com.lorby-si.aao.multitilegauge')) {
    var canvas = document.createElement('canvas');
    canvas.width = 144;
    canvas.height = 144;
    actions[context] = new MultiTileGaugeAction(context, settings, coordinates, canvas);
}
else if (action === ('com.lorby-si.aao.rotary')) {
    var canvas = document.createElement('canvas');
    canvas.width = 144;
    canvas.height = 144;
    actions[context] = new RotaryEncoderAction(context, settings, coordinates, canvas);
}
fcuWillAppear(actions, action, context, settings, coordinates);
if (actions[context]){
    var gsimvars = actions[context].getSimVars();
    for (let i = 0; i < gsimvars.length; i++){
        var getvar = {"var":gsimvars[i],"value":0.0};
        AddVar(getvar);
    if (!bulkInitScript.includes(gsimvars[i]))
        bulkInitScript = bulkInitScript + gsimvars[i] + ' ';
    }
}
settings["statectr"] =0;
saveSettings(action, context, settings);
```

### FCU Zeichner ausführen

Folgende Zeile muss hinzugefügt werden, damit die FCU Bilder generiert und an den StreamDeck geschickt werden:

```js
RenderFCU(simvars, websocket);
```

Diese Zeile muss ganz an das Ende von der `dataRequestListener` Funktion hinzugefügt werden, insgesamt sieht das dann in etwa so aus:

```js
  function dataRequestListener() {
    // ...
        if (act.drawButton) {
          if (act.drawButton()) {
            setPicture(ctx, act.getImageData(), act.getCoords());
          }
        } else {
          if (act.drawIcon) {
            let iconOut = act.drawIcon(simvars, simstringvars);
            let valueOut = act.getStripValue();
            let indicatorOut = act.getIndicator();
            if (iconOut || valueOut || indicatorOut) {
              setFeedback(
                ctx,
                iconOut,
                act.getImageData(),
                valueOut,
                act.getStripValueString(),
                indicatorOut,
                act.getIndicatorValue()
              );
            }
          } else {
            if (
              lastVal != simVal ||
              altlastVal != altsimVal ||
              altTwolastVal != altTwosimVal ||
              onlastVal != onsimVal
            ) {
              settings["cursimval"] = simVal;
              requestSettings(ctx);
            }
          }
        }
      }
    }
    RenderFCU(simvars, websocket);
  }

  function dataRequestError() {
    // ...
  }
```

### FCU Langer Knopfdruck reparieren

Folgende Änderung ist notwendig, damit das lange Drücken eines Knopfes in der FCU funktioniert:

**Vorher:**

```js
      // Send onKeyDown event to actions
      if (context in actions) {
        if (actions[context].onKeyDown) {
          if (settings["longsimevt"]) {
            longclickarmed = true;
            lccontext = context;
            // ...
```

**Nachher:**

```js
      // Send onKeyDown event to actions
      if (context in actions) {
        if (actions[context].onKeyDown) {
          if (settings["longsimevt"] || actions[context].hasLongSimEvt?.()) {
            longclickarmed = true;
            lccontext = context;
            // ...
```

## FCU Implementierung

Zum Schluss muss natürlich noch die `js/fcu.js` Datei in den `js` Ordner des Plugins gelegt werden.
