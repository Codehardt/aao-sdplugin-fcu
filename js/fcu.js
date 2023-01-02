// fcuContext contains the four contexts that are used
// to identify the four slots of the StreamDeck+ feedback display
// and their corresponding buttons
let fcuActions = null;
let fcuWebsocket = null;
let fcuWebsocketPrev = null;
const fcuContext = [null, null, null, null];

// fcuCache contains all values that are relevant for the fcu, e.g.
// selected SPD, hold SPD, whether dot for SPD should be visible and
// much more.
const fcuCache = new Map();

// FCUVAR is an enum that contains all variable names that will
// be requested from AAO and stored in above fcuCache
const FCUVAR = {
  // fcu values
  SPD: "(A:AUTOPILOT AIRSPEED HOLD VAR, Knots)",
  SPDSELECTED: "(L:A32NX_AUTOPILOT_SPEED_SELECTED, Number)",
  HDG: "(A:AUTOPILOT HEADING LOCK DIR, Degrees)",
  HDGSELECTED: "(L:A32NX_AUTOPILOT_HEADING_SELECTED, Degrees)",
  ALT: "(A:AUTOPILOT ALTITUDE LOCK VAR:3, feet)",
  VS: "(L:A32NX_AUTOPILOT_VS_SELECTED, feet per minute)",
  FPA: "(L:A32NX_AUTOPILOT_FPA_SELECTED, degrees)",
  MACH: "(A:AUTOPILOT MACH HOLD VAR:1, Number)",
  // show dashes instead of values
  SPDDASH: "(L:A32NX_FCU_SPD_MANAGED_DASHES, Bool)",
  HDGDASH: "(L:A32NX_FCU_HDG_MANAGED_DASHES, Bool)",
  VSDASH: "(L:A32NX_FCU_VS_MANAGED, Bool)",
  // show dot behind value
  SPDDOT: "(L:A32NX_FCU_SPD_MANAGED_DOT, Bool)",
  HDGDOT: "(L:A32NX_FCU_HDG_MANAGED_DOT, Bool)",
  ALTDOT: "(L:A32NX_FCU_ALT_MANAGED, Bool)",
  // switch between value modes
  MACHMODE: "(A:AUTOPILOT MANAGED SPEED IN MACH, Bool)",
  TRKMODE: "(L:A32NX_TRK_FPA_MODE_ACTIVE, Bool)",
};

// lastFCUImages contains the four images that have been rendered
// on the StreamDeck+ feedback display in the previous iteration.
// This cache can be used to check whether the image has been changed and
// should be rerendered (sent to StreamDeck+)
const lastFCUImages = [null, null, null, null];

function resetImages() {
  lastFCUImages.forEach((_, i) => (lastFCUImages[i] = null));
}

// RenderFCU converts the simvars from AAO to 4 200x100 png images to be rendered
// by the StreamDeck+ feedback display.
function RenderFCU(simvars, websocket) {
  if (websocket) {
    fcuWebsocket = websocket;
  }
  if (fcuWebsocket !== fcuWebsocketPrev) {
    fcuWebsocketPrev = fcuWebsocket;
    resetImages();
  }
  // apply all new sim vars to current fcu cache
  Object.values(FCUVAR).forEach((fcuvar) => {
    const newValue = simvars?.[fcuvar];
    if (newValue != null) fcuCache.set(fcuvar, newValue);
  });
  // check if we have access to all four StreamDeck+ feedback displays
  if (!streamDeckReadyForFCU()) {
    resetImages();
    return;
  }
  // build all 4 fcu image slots based on the fcu variables in fcu cache
  const images = buildFCUImages({
    spd: fcuCache.get(FCUVAR.SPDDASH)
      ? null
      : fcuCache.get(FCUVAR.SPDSELECTED) === -1
      ? fcuCache.get(FCUVAR.SPD) ?? 0
      : fcuCache.get(FCUVAR.SPDSELECTED) ?? 0,
    spdDot: fcuCache.get(FCUVAR.SPDDOT) ?? false,
    mach: fcuCache.get(FCUVAR.SPDDASH) ? null : fcuCache.get(FCUVAR.MACH) ?? 0,
    hdg: fcuCache.get(FCUVAR.HDGDASH)
      ? null
      : fcuCache.get(FCUVAR.HDGSELECTED) === -1
      ? fcuCache.get(FCUVAR.HDG) ?? 0
      : fcuCache.get(FCUVAR.HDGSELECTED) ?? 0,
    hdgDot: fcuCache.get(FCUVAR.HDGDOT) ?? false,
    alt: fcuCache.get(FCUVAR.ALT) ?? 0,
    altDot: fcuCache.get(FCUVAR.ALTDOT) ?? false,
    vs: fcuCache.get(FCUVAR.VSDASH) ? null : fcuCache.get(FCUVAR.VS) ?? 0,
    fpa: fcuCache.get(FCUVAR.VSDASH) ? null : fcuCache.get(FCUVAR.FPA) ?? 0,
    showTrkFpa: fcuCache.get(FCUVAR.TRKMODE) ?? false,
    showMach: fcuCache.get(FCUVAR.MACHMODE) ?? false,
  });
  // send the 4 fcu image slots to StreamDeck+ feedback display
  images.forEach((image, i) => {
    if (image === lastFCUImages[i]) {
      // image has not changed since last iteration, skip to improve performance
      return;
    }
    setFullFeedback(fcuContext[i], image);
    lastFCUImages[i] = image;
  });
}

function streamDeckReadyForFCU() {
  // check if there is at least one unavailable or outdated context
  if (
    fcuContext.find(
      (context) =>
        !fcuActions || !context || !fcuActions.hasOwnProperty(context)
    )
  ) {
    return false;
  }
  return true;
}

const orange = "#ff6600";
const titleFont = "20px Arial";
const titleY = 26;
const subTitleFont = "20px Arial";
const subTitlePadding = 10;
const subTitleY = 70;
const valueFont = "45px Digital";
const valueY = 80;
const valuePadding = 12;
const dotRadius = 12;
const dotY = 63;

function buildFCUImages({
  spd,
  spdDot,
  mach,
  hdg,
  //trk,
  hdgDot,
  alt,
  altDot,
  vs,
  fpa,
  showTrkFpa,
  showMach,
}) {
  const zeroPadding = (val, count) => {
    let res = val.toString();
    for (let i = res.length; i < count; i++) {
      res = "0" + res;
    }
    return res;
  };
  const canvas = [
    document.createElement("canvas"),
    document.createElement("canvas"),
    document.createElement("canvas"),
    document.createElement("canvas"),
  ];
  canvas.forEach((canvas) => {
    canvas.height = 100;
    canvas.width = 200;
  });
  const ctx = canvas.map((canvas) => canvas.getContext("2d"));
  const [c1, c2, c3, c4] = ctx;
  c1.font = titleFont;
  c1.fillStyle = orange;
  if (showMach) {
    c1.fillText("MACH", 65, titleY);
  } else {
    c1.fillText("SPD", 10, titleY);
  }
  c1.font = valueFont;
  const spdText = showMach
    ? mach == null
      ? "---"
      : parseFloat(mach).toFixed(2).toString().replace(".", "")
    : spd == null
    ? "---"
    : zeroPadding(Math.round(spd), 3);
  c1.fillText(addLetterSpacing(spdText), valuePadding, valueY);
  if (showMach && mach != null) {
    // add floating dot for mach value
    c1.fillText(".", valuePadding + 14, valueY);
  }
  if (spdDot) {
    c1.beginPath();
    c1.arc(110, dotY, dotRadius, 0, 2 * Math.PI, false);
    c1.fill();
  }
  c2.font = titleFont;
  c2.fillStyle = orange;
  if (showTrkFpa) {
    c2.fillText("TRK", 45, titleY);
  } else {
    c2.fillText("HDG", 10, titleY);
  }
  c2.fillText("LAT", 95, titleY);
  c2.font = valueFont;
  const hdgText = hdg == null ? "---" : zeroPadding(Math.round(hdg), 3);
  c2.fillText(addLetterSpacing(hdgText), valuePadding, valueY);
  if (hdgDot) {
    c2.beginPath();
    c2.arc(110, dotY, dotRadius, 0, 2 * Math.PI, false);
    c2.fill();
  }
  c2.font = subTitleFont;
  c2.fillText(
    showTrkFpa ? "TRK" : "HDG",
    200 - c2.measureText(showTrkFpa ? "TRK" : "HDG").width - subTitlePadding,
    showTrkFpa ? 80 : 60
  );
  c3.font = subTitleFont;
  c3.fillStyle = orange;
  c3.fillText(
    showTrkFpa ? "FPA" : "V/S",
    subTitlePadding,
    showTrkFpa ? 80 : 60
  );
  c3.font = titleFont;
  c3.fillText("ALT", 110, titleY);
  c3.beginPath();
  c3.moveTo(155, titleY);
  c3.lineTo(155, titleY - 10);
  c3.lineTo(190, titleY - 10);
  c3.lineWidth = 4;
  c3.strokeStyle = orange;
  c3.stroke();
  c3.font = valueFont;
  const altText = alt == null ? "-----" : zeroPadding(Math.round(alt), 5);
  c3.fillText(
    addLetterSpacing(altText),
    200 - c3.measureText(addLetterSpacing(altText)).width - valuePadding,
    valueY
  );
  c4.fillStyle = orange;
  c4.font = titleFont;
  c4.fillText("LVL/CH", 0, titleY);
  c4.beginPath();
  c4.moveTo(80, titleY - 10);
  c4.lineTo(115, titleY - 10);
  c4.lineTo(115, titleY);
  c4.lineWidth = 4;
  c4.strokeStyle = orange;
  c4.stroke();
  if (showTrkFpa) {
    c4.fillText("FPA", 150, titleY);
  } else {
    c4.fillText("V/S", 125, titleY);
  }
  if (altDot) {
    c4.beginPath();
    c4.arc(13, dotY, dotRadius, 0, 2 * Math.PI, false);
    c4.fill();
  }
  c4.font = valueFont;
  const vsText = showTrkFpa
    ? fpa == null
      ? "-----"
      : `${fpa < 0 ? "-" : "+"}${Math.abs(parseFloat(fpa))
          .toFixed(1)
          .toString()
          .replace(".", "")}`
    : vs == null
    ? "-----"
    : `${vs < 0 ? "-" : "+"}${zeroPadding(
        Math.abs(Math.round(vs)),
        4
      )}`.replace(/00$/, "oo");
  if (showTrkFpa && fpa != null) {
    // render floating dot for fpa
    c4.fillText(
      ".",
      200 - c4.measureText(addLetterSpacing(vsText)).width - valuePadding + 43,
      valueY
    );
  }
  c4.fillText(
    addLetterSpacing(vsText),
    200 - c4.measureText(addLetterSpacing(vsText)).width - valuePadding,
    valueY
  );
  return canvas.map((canvas) => canvas.toDataURL());
}

function runFCUAction(reqObj) {
  const xhttp = new XMLHttpRequest();
  xhttp.open(
    "GET",
    AAO_URL + "?json=" + encodeURIComponent(JSON.stringify(reqObj))
  );
  xhttp.send();
}

// FCUAction handles rotation and key events and converts
// them to AAO triggers
function FCUAction(inContext, inSettings, coordinates, action) {
  const coords = "" + coordinates.column + "_" + coordinates.row;
  const context = inContext;
  const settings = inSettings;
  this.onKeyDown = function () {
    const triggers = [];
    if (action === "de.codehardt.fcu1") {
      triggers.push({
        evt: `(>K:0 - A320 AP-SPD push)`,
        value: "1",
      });
    } else if (action === "de.codehardt.fcu2") {
      triggers.push({
        evt: `(>K:0 - A320 AP-HDG push)`,
        value: "1",
      });
    } else if (action === "de.codehardt.fcu3") {
      triggers.push({
        evt: `(>K:0 - A320 AP-ALT push)`,
        value: "1",
      });
    } else if (action === "de.codehardt.fcu4") {
      triggers.push({
        evt: `(>K:0 - A320 AP-VS push)`,
        value: "1",
      });
    }
    runFCUAction({ triggers });
  };
  this.onKeyUp = function () {};
  this.onDialRotate = function (inContext, inSettings, ticks) {
    const triggers = [];
    if (action === "de.codehardt.fcu1") {
      triggers.push({
        evt: `(>K:AP_SPD_VAR_${ticks > 0 ? "INC" : "DEC"})`,
        value: "0",
      });
    } else if (action === "de.codehardt.fcu2") {
      triggers.push({
        evt: `(>K:HEADING_BUG_${ticks > 0 ? "INC" : "DEC"})`,
        value: "0",
      });
    } else if (action === "de.codehardt.fcu3") {
      triggers.push({
        evt: `(>K:AP_ALT_VAR_${ticks > 0 ? "INC" : "DEC"})`,
        value: "0",
      });
    } else if (action === "de.codehardt.fcu4") {
      triggers.push({
        evt: `(>K:AP_VS_VAR_${ticks > 0 ? "INC" : "DEC"})`,
        value: "0",
      });
    }
    runFCUAction({ triggers });
  };
  this.onTouchTap = function () {
    const setvars = [];
    if (action === "de.codehardt.fcu1") {
      setvars.push({
        var: `(>H:A320_Neo_FCU_SPEED_TOGGLE_SPEED_MACH, Number)`,
        value: "1",
      });
    } else if (action === "de.codehardt.fcu2") {
      setvars.push({
        var: `(>L:A32NX_TRK_FPA_MODE_ACTIVE, Number)`,
        value: fcuCache.get(FCUVAR.TRKMODE) ? "0" : "1",
      });
    } else if (action === "de.codehardt.fcu3") {
      setvars.push({
        var: `(>L:A32NX_TRK_FPA_MODE_ACTIVE, Number)`,
        value: fcuCache.get(FCUVAR.TRKMODE) ? "0" : "1",
      });
    } else if (action === "de.codehardt.fcu4") {
      setvars.push({
        var: `(>L:A32NX_TRK_FPA_MODE_ACTIVE, Number)`,
        value: fcuCache.get(FCUVAR.TRKMODE) ? "0" : "1",
      });
    }
    runFCUAction({ setvars });
  };
  this.onLongClick = function () {
    const triggers = [];
    if (action === "de.codehardt.fcu1") {
      triggers.push({
        evt: `(>K:0 - A320 AP-SPD pull)`,
        value: "1",
      });
    } else if (action === "de.codehardt.fcu2") {
      triggers.push({
        evt: `(>K:0 - A320 AP-HDG pull)`,
        value: "1",
      });
    } else if (action === "de.codehardt.fcu3") {
      triggers.push({
        evt: `(>K:0 - A320 AP-ALT pull)`,
        value: "1",
      });
    }
    runFCUAction({ triggers });
  };
  this.getSimVars = function () {
    return Object.values(FCUVAR);
  };
  this.hasLongSimEvt = function () {
    return true;
  };
  this.setTitle = function () {};
  this.getCoords = function () {
    return coords;
  };
  this.getContext = function () {
    return context;
  };
  this.getSettings = function () {
    return settings;
  };
  this.setSettings = function (inSettings) {
    settings = inSettings;
  };
}

function addLetterSpacing(str) {
  return str.split("").join(String.fromCharCode(8201));
}

// setFullFeedback sends an 200x100 image to one of the 4 slots of the StreamDeck+ feedback display
function setFullFeedback(inContext, img) {
  const json = {
    event: "setFeedback",
    context: inContext,
    payload: {
      "full-canvas": img,
      title: "",
    },
  };
  fcuWebsocket?.send(JSON.stringify(json));
}

function fcuWillAppear(actions, action, context, settings, coordinates) {
  fcuActions = actions;
  if (action === "de.codehardt.fcu1") {
    fcuContext[0] = context;
    actions[context] = new FCUAction(context, settings, coordinates, action);
  } else if (action === "de.codehardt.fcu2") {
    fcuContext[1] = context;
    actions[context] = new FCUAction(context, settings, coordinates, action);
  } else if (action === "de.codehardt.fcu3") {
    fcuContext[2] = context;
    actions[context] = new FCUAction(context, settings, coordinates, action);
  } else if (action === "de.codehardt.fcu4") {
    fcuContext[3] = context;
    actions[context] = new FCUAction(context, settings, coordinates, action);
  }
  RenderFCU();
}
