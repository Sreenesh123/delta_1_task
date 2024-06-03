export {
  adjustBulletDirection2,
  adjustBulletDirection,
  player,
  movehistory,
  playertoggle,
  clicking,
  bulletshoot,
  audio,
  bounce,
  blast,
  playaudio,
  resultdeclaration,
  handleClick,
  pieces,
  toactualswap,
  gamereplay,
  implementmove,
  canonshooting,
  timeinterval,
  timerupdate,
  displayMoveHistory,
  getPieceImage,
  createMoveElement,
};
import { botMove } from "./bot.js";

const playboard = document.querySelector(".playboard");
const boxes = 64;
let direction2,
  undotimer,
  pieceid,
  randompiece,
  pic,
  passthroughacitve = false,
  subreplay = false,
  firstdirection,
  altreqboxes = [],
  num = 1,
  gamestarted = false,
  player = "blue",
  obstacle = false,
  reqboxes = [],
  reqboxes2 = [],
  reqbox,
  bulletshot = false,
  clickedpieces = [];
const turn = document.getElementById("turn");
let result;
let pieces = [];
let timeinterval;
let removedsemiid, previousmove;
const initialtime = 1;
let time = initialtime * 60;
const movehistory = [];
const undomove = [];
let storedHistory;
let redomove = [];
let reversemove = [];
let rotatedpieces = [];
let newreqboxes = [];
let replayinterval;
let startingtimestamp;
let piece;
const rotationangles = {};
let firstmoveswap = false;

let sidebox = document.getElementById("sidebox");
const timer = document.getElementById("timer");
const pause = document.getElementById("pause");
const undo = document.getElementById("undo");
const redo = document.getElementById("redo");
const Reset = document.getElementById("reset");
const replay = document.getElementById("replay");
const redmoves = document.getElementById("redmoves");
const bluemoves = document.getElementById("bluemoves");
const movedisplay = document.getElementById("movediplay");
const Pass_Through = document.getElementById("Pass-Through");
const swap = document.getElementById("swap");
const audio = new Audio("media/gunshoot3.mp3");
const bounce = new Audio("media/bounce.mp3");
const blast = new Audio("media/blast.mp3");

audio.preload = "auto";
bounce.preload = "auto";
blast.preload = "auto";

audio.load();
bounce.load();
blast.load();
let replaying = false;
let paused = false;

let playWithBot = false;
if (result) {
  result.remove();
  Gameon = document.createElement("div");
  Gameon.classList.add("gameon");
  Gameon.innerHTML = "Game on!!!";
  sidebox.insertBefore(Gameon, timer);
}

document.getElementById("playwithbot").addEventListener("click", () => {
  undo.removeEventListener("click", undomovement);
  redo.removeEventListener("click", redomovement);
  playWithBot = true;
  reset();
});

document.getElementById("multiplayer").addEventListener("click", () => {
  playWithBot = false;
  reset();
});

Reset.addEventListener("click", reset);

pause.addEventListener("click", function () {
  paused = !paused;
  pause.innerHTML = pause.innerHTML === "Pause" ? "Resume" : "Pause";
});

const button = document.querySelector("button");
function createbox() {
  for (let i = 0; i < boxes; i++) {
    const square = document.createElement("div");
    square.classList.add("box");
    square.setAttribute("id", i);
    playboard.append(square);
  }
}
createbox();

let Gameon = document.createElement("div");
Gameon.classList.add("gameon");
Gameon.innerHTML = "Game on!!!";
sidebox.insertBefore(Gameon, timer);

// randomisation of initial position of pieces......................................................................................

const pieceslocation = [
  {
    type: "canon",
    positionRange: [0, 7],
    player: "red",
    image: '<img class="image" src="media/redcannon.png" alt="">',
  },
  {
    type: "canon",
    positionRange: [56, 63],
    player: "blue",
    image: '<img class="image" src="media/bluecannon.png" alt="">',
  },
  { type: "titan", positionRange: [0, 23], player: "red", image: "titan" },
  { type: "titan", positionRange: [40, 63], player: "blue", image: "titan" },
  { type: "tank", positionRange: [0, 23], player: "red", image: "tank" },
  { type: "tank", positionRange: [40, 63], player: "blue", image: "tank" },
  {
    type: "Ricochet",
    positionRange: [0, 23],
    player: "red",
    image:
      '<img class="image" src="media/ricochet_red_transparent.png" alt="">',
  },
  {
    type: "Ricochet",
    positionRange: [40, 63],
    player: "blue",
    image:
      '<img class="image" src="media/ricochet_blue_transparent.png" alt="">',
  },
  {
    type: "SemiRicochet",
    positionRange: [0, 23],
    player: "red",
    image: '<img class="image" src="media/semi_ricochet_red.png" alt="">',
  },
  {
    type: "SemiRicochet",
    positionRange: [40, 63],
    player: "blue",
    image: '<img class="image" src="media/semi_ricochet_blue.png" alt="">',
  },
];

function randomlocation() {
  function checkForImmediateWin() {
    const blueCanon = document.querySelector(".canon.blue");
    const redTitan = document.querySelector(".titan.red");
    if (!blueCanon || !redTitan) return false;

    let startRow = Number(blueCanon.getAttribute("rownumberid"));
    let startCol = Number(blueCanon.getAttribute("columnnumberid"));
    checkbulletdirection(startRow, startCol);

    return false;
  }

  function checkbulletdirection(startRow, startCol) {
    let bulletDirections = [
      [-1, 0],
      [0, -1],
      [0, 1],
      [1, 0],
    ];
    for (let direction of bulletDirections) {
      if (simulateBulletPath(direction, startRow, startCol)) {
        return true;
      }
    }
    return false;
  }

  function checkfirstmovewin() {
    const blueCanon = document.querySelector(".canon.blue");
    if (!blueCanon) return false;
    let startRow = Number(blueCanon.getAttribute("rownumberid"));

    let leftstartCol = Number(blueCanon.getAttribute("columnnumberid")) - 1;
    let rightstartCol = Number(blueCanon.getAttribute("columnnumberid")) + 1;

    return (
      checkbulletdirection(startRow, leftstartCol) ||
      checkbulletdirection(startRow, rightstartCol)
    );
  }

  function simulateBulletPath(direction, startRow, startCol) {
    let [dx, dy] = direction;
    let x = startRow + dx;
    let y = startCol + dy;
    while (x >= 1 && x < 9 && y >= 1 && y < 9) {
      let targetBox = document.querySelector(
        `[rownumberid='${x}'][columnnumberid='${y}']`
      );
      if (!targetBox) break;

      if (
        targetBox.classList.contains("titan") &&
        (targetBox.classList.contains("red") ||
          targetBox.classList.contains("blue"))
      ) {
        return true;
      }

      if (
        targetBox.classList.contains("Ricochet") ||
        targetBox.classList.contains("SemiRicochet")
      ) {
        [dx, dy] = [0, -1];
      }

      x += dx;
      y += dy;
    }
    return false;
  }

  function checkCanonAndTitanColumn() {
    const blueCanon = document.querySelector(".canon.blue");
    const redTitan = document.querySelector(".titan.red");
    if (!blueCanon || !redTitan) return false;

    let blueCanonCol = Number(blueCanon.getAttribute("columnnumberid"));
    let redTitanCol = Number(redTitan.getAttribute("columnnumberid"));

    return blueCanonCol === redTitanCol;
  }

  function RedTitanInFrontOfRedCanon() {
    const redCanon = document.querySelector(".canon.red");
    const redTitan = document.querySelector(".titan.red");
    if (!redCanon) return false;

    let canonRow = Number(redCanon.getAttribute("rownumberid"));
    let canonCol = Number(redCanon.getAttribute("columnnumberid"));
    let redTitanCol = Number(redTitan.getAttribute("columnnumberid"));

    if (canonCol === redTitanCol) {
      return true;
    }

    return false;
  }

  let validPlacement = false;

  while (!validPlacement) {
    document.querySelectorAll(".box").forEach((box) => {
      box.innerHTML = "";
      box.className = "box";
    });

    pieceslocation.forEach((config) => {
      let placed = false;
      while (!placed) {
        const location =
          Math.floor(
            Math.random() *
              (config.positionRange[1] - config.positionRange[0] + 1)
          ) + config.positionRange[0];
        const box = document.getElementById(location);
        if (box.innerHTML === "") {
          box.innerHTML = config.image;
          box.classList.add(config.type, config.player, "piece");
          placed = true;
        }
      }
    });

    if (
      !checkForImmediateWin() &&
      !checkfirstmovewin() &&
      !checkCanonAndTitanColumn() &&
      !RedTitanInFrontOfRedCanon()
    ) {
      validPlacement = true;
    }
  }
  const piecePositions = [];
  document.querySelectorAll(".piece").forEach((piece) => {
    const pieceInfo = {
      type: Array.from(piece.classList).find((cls) =>
        ["canon", "titan", "tank", "Ricochet", "SemiRicochet"].includes(cls)
      ),
      player: Array.from(piece.classList).find((cls) =>
        ["red", "blue"].includes(cls)
      ),
      position: piece.getAttribute("id"),
    };
    piecePositions.push(pieceInfo);
  });
  localStorage.setItem("piecePositions", JSON.stringify(piecePositions));

  gamestarted = true;
}

// resetting................................................................................................................................

function reset() {
  startingtimestamp = Date.now();
  if (replaying == true) {
  } else {
    movehistory.length = 0;
    redmoves.innerHTML = "";
    bluemoves.innerHTML = "";
  }

  if (reqboxes.length > 0) {
    cleanUpAfterMove(reqboxes, clickedpieces[clickedpieces.length - 1]);
  }

  pieces.forEach((piece) => {
    piece.removeEventListener("click", handleClick);
  });
  const allboxes2 = document.querySelectorAll(".box");
  allboxes2.forEach((box) => {
    box.innerHTML = "";
    box.className = "box";
    box.removeAttribute("rownumberid");
    box.removeAttribute("columnnumberid");
    box.removeAttribute("customid");
  });

  player = "blue";

  time = 60;

  if (result) {
    result.remove();
    Gameon = document.createElement("div");
    Gameon.classList.add("gameon");
    Gameon.innerHTML = "Game on!!!";
    sidebox.insertBefore(Gameon, timer);
  }

  const allboxes = document.querySelectorAll(".box");
  allboxes.forEach((box) => {
    box.innerHTML = "";
    box.removeAttribute("rownumberid", "columnnumberid", "customid");
  });

  allboxes.forEach((box) => {
    let index = Number(box.id);
    const rownumber = Math.floor(index / 8) + 1;
    const columnnumber = (index % 8) + 1;
    const columnletter = String.fromCharCode((index % 8) + 65);
    const customid = `${columnletter}${rownumber}`;
    box.setAttribute("customid", customid);
    box.setAttribute("rownumberid", rownumber);
    box.setAttribute("columnnumberid", columnnumber);
  });

  let storedlocation = JSON.parse(localStorage.getItem("piecePositions"));

  function loadPositions() {
    const piecePositions = JSON.parse(localStorage.getItem("piecePositions"));
    if (!piecePositions) return;

    document.querySelectorAll(".box").forEach((box) => {
      box.innerHTML = "";
      box.className = "box";
    });

    piecePositions.forEach((config) => {
      const box = document.getElementById(config.position);
      if (box) {
        const pieceImage = pieceslocation.find(
          (piece) =>
            piece.type === config.type && piece.player === config.player
        ).image;
        box.innerHTML = pieceImage;
        box.classList.add(config.type, config.player, "piece");
      }
    });

    gamestarted = true;
  }

  if (
    storedlocation !== null &&
    storedlocation.length > 0 &&
    replaying == true
  ) {
    loadPositions();
  } else {
    randomlocation();
  }

  pieces = Array.from(document.getElementsByClassName("piece"));
  Removeeventlistener();
  clicking();

  if (!(playWithBot && !replaying)) {
    undo.addEventListener("click", undomovement);
    redo.addEventListener("click", redomovement);
  }
  let removedsemiid;
  let redom = false;
}

// displaying movement history..............................................................................................................

function getPieceImage(piecetype, color) {
  const pieceImages = {
    SemiRicochet: {
      red: "media/semi_ricochet_red.png",
      blue: "media/semi_ricochet_blue.png",
    },
    Ricochet: {
      red: "media/ricochet_red_transparent.png",
      blue: "media/ricochet_blue_transparent.png",
    },
    titan: {
      red: "media/bullet_copy.png",
      blue: "media/bullet_copy.png",
    },
    tank: {
      red: "media/bullet_copy.png",
      blue: "media/bullet_copy.png",
    },

    canon: {
      red: "media/redcannon.png",
      blue: "media/bluecannon.png",
    },
  };
  return pieceImages[piecetype][color] || "media/bullet_copy.png";
}

function createMoveElement(move) {
  const moveelement = document.createElement("div");
  moveelement.classList.add("move");
  let pieceimage;
  let swappingpiece;
  let swappedpiece;
  if (move.movementtype !== "swap") {
    pieceimage = document.createElement("img");
    pieceimage.src = getPieceImage(move.piecetype, move.player);
    pieceimage.alt = move.piecetype;
    pieceimage.classList.add("piece-image");
  } else {
    const swappingpiecetype = move.pieces[0].classes.find((cls) =>
      ["canon", "titan", "tank", "Ricochet", "SemiRicochet"].includes(cls)
    );
    swappedpiece = document.createElement("img");
    const swappedpiecetype = move.pieces[1].classes.find((cls) =>
      ["canon", "titan", "tank", "Ricochet", "SemiRicochet"].includes(cls)
    );
    if (swappingpiecetype !== "tank") {
      swappingpiece = document.createElement("img");

      swappingpiece.src = getPieceImage(
        swappingpiecetype,
        move.pieces[0].piece.classList.contains("blue") ? "blue" : "red"
      );
      swappingpiece.alt = swappingpiecetype;
      swappingpiece.classList.add("piece-image");

      swappedpiece.src = getPieceImage(
        swappedpiecetype,
        move.pieces[1].piece.classList.contains("blue") ? "blue" : "red"
      );
      swappedpiece.alt = swappedpiecetype;
      swappedpiece.classList.add("piece-image");
    } else {
      swappingpiece = document.createElement("div");
      swappingpiece.textContent = swappingpiecetype;
      swappingpiece.classList.add("text");
      swappedpiece = document.createElement("img");
      const swappedpiecetype = move.pieces[1].classes.find((cls) =>
        ["canon", "titan", "tank", "Ricochet", "SemiRicochet"].includes(cls)
      );
      swappedpiece.src = getPieceImage(
        swappedpiecetype,
        move.pieces[1].piece.classList.contains("blue") ? "blue" : "red"
      );
      swappedpiece.alt = swappedpiecetype;
      swappedpiece.classList.add("piece-image");
    }
  }

  const moveDetails = document.createElement("div");
  moveDetails.classList.add("move-details");

  if (move.movementtype === "linear") {
    moveDetails.textContent = `${move.piecetype} moved to ${move.endposition}`;
  } else if (move.movementtype === "rotation") {
    moveDetails.textContent = `${move.piecetype} rotated to ${move.currentrotationangle}°`;
  } else if (move.movementtype === "swap") {
    const swappedPieces = move.pieces.map((p) => p.classes[1]).join(" and ");
    moveDetails.textContent = `swapped with`;
  }

  if (move.movementtype !== "swap") {
    moveelement.appendChild(pieceimage);
    moveelement.appendChild(moveDetails);
  } else {
    moveelement.appendChild(swappedpiece);
    moveelement.appendChild(moveDetails);
    moveelement.appendChild(swappingpiece);
  }

  return moveelement;
}

function displayMoveHistory() {
  let move = movehistory[movehistory.length - 1];
  const moveelement = createMoveElement(move);
  if (move.player === "red") {
    redmoves.appendChild(moveelement);
    moveelement.classList.add("moveelementred");
  } else if (move.player === "blue") {
    bluemoves.appendChild(moveelement);
    moveelement.classList.add("moveelementblue");
  }
}

// setting timer......................................................................................................................

function timerupdate() {
  if (!paused) {
    const minutes = Math.floor(time / 60);
    let seconds = time % 60;
    seconds = seconds < 10 ? "0" + seconds : seconds;
    timer.innerHTML = `${minutes}:${seconds}`;
    if (time === 0) {
      result = document.createElement("div");
      result.classList.add("result");
      result.innerHTML = player === "blue" ? "Red Won!!!" : "Blue Won!!!";
      sidebox.insertBefore(result, timer);
      player === "blue"
        ? (result.style.color = "red")
        : (result.style.color = "blue");
      Gameon.remove();

      clearInterval(timeinterval);
    }
    time = time < 0 ? 0 : time - 1;
  }
}

function clicking() {
  if (movehistory.length > 0 && !replaying) {
    displayMoveHistory();
  }
  if (playWithBot && player === "red" && !replaying) {
    setTimeout(botMove, 1000);
  }

  if (undotimer !== true) {
    if (timeinterval) {
      clearInterval(timeinterval);
    }
    timer.innerHTML = "1.00";
    time = 60;
    timeinterval = setInterval(timerupdate, 1000);
    timerupdate();
  }

  if (turn) {
    turn.innerHTML = `<b>Turn: <span style="color: ${player}; text-transform: uppercase;">${player}</span></b>`;
  } else {
    console.error("Turn element not found");
  }

  result = document.querySelector(".result");

  pieces = Array.from(document.getElementsByClassName("piece"));

  pieces.forEach((piece) => {
    if (Array.from(piece.classList).includes(player)) {
      piece.addEventListener("click", handleClick);
    } else {
      piece.removeEventListener("click", handleClick);
    }
  });
}

function handleClick(event) {
  if (clickedpieces.length > 0) {
    reqboxes.forEach((box) => {
      box.classList.remove("highlighted");
      const circle = box.querySelector(".circle");
      if (circle) {
        box.removeChild(circle);
      }
      box.removeEventListener("click", removehighlightedboxes);
    });
  }

  if (clickedpieces.length > 0) {
    clickedpieces.forEach((pieces) => {
      pieces.removeAttribute("style");
      pieces.removeEventListener("click", handleClick);
    });
  }

  if (event.target.tagName === "IMG") {
    piece = event.target.parentElement;
  } else {
    piece = event.target;
  }
  clickedpieces.push(piece);
  const rownumber = Number(piece.getAttribute("rownumberid"));
  const columnnumber = Number(piece.getAttribute("columnnumberid"));
  piece.style.backgroundColor = "rgba(66,66,66,.55)";
  if (
    Array.from(piece.classList).includes("Ricochet") ||
    Array.from(piece.classList).includes("SemiRicochet")
  ) {
    if (Array.from(piece.classList).includes("Ricochet")) {
      swap.addEventListener("click", swapping);
    }
    button.addEventListener("click", rotateImage);
  }
  highlightPossibleMoves(rownumber, columnnumber, piece);
}

function highlightPossibleMoves(x, y, piece) {
  let moves = possiblemoves(x, y);
  if (piece.classList.contains("canon")) {
    moves = Array.from(moves).filter(([dx, dy]) => {
      return dx == 0;
    });
  }
  moves.forEach((move) => {
    let newX = x + move[0];
    let newY = y + move[1];
    if (newX >= 1 && newX < 9 && newY >= 1 && newY < 9) {
      reqbox = document.querySelector(
        `[rownumberid='${newX}'][columnnumberid='${newY}']`
      );
      reqbox.classList.add("highlighted");
      let circle = document.createElement("div");
      circle.classList.add("circle");
      reqbox.appendChild(circle);
      reqbox.addEventListener("click", removehighlightedboxes);
      reqboxes.push(reqbox);
    }
  });
}
function removehighlightedboxes(event) {
  piece = clickedpieces[clickedpieces.length - 1];
  reqbox = event.currentTarget;
  piecemovement(piece, reqbox);
  cleanUpAfterMove(reqboxes, piece);
  const cannon = document.querySelector(".canon." + player);
  let startRow = Number(cannon.getAttribute("rownumberid"));
  let startCol = Number(cannon.getAttribute("columnnumberid"));

  player === "blue"
    ? bulletshoot([-1, 0], startRow, startCol)
    : bulletshoot([1, 0], startRow, startCol);
}

function Removeeventlistener() {
  pieces.forEach((piece) => {
    piece.removeEventListener("click", handleClick);
  });
}

function piecemovement(originalBox, targetBox) {
  Removeeventlistener();

  const initialposition = originalBox.getAttribute("customid");
  const endposition = targetBox.getAttribute("customid");
  const piecetype = Array.from(originalBox.classList).find((cls) =>
    ["canon", "titan", "tank", "Ricochet", "SemiRicochet"].includes(cls)
  );
  const move = {
    piecetype,
    initialposition,
    endposition,
    player,
    movementtype: "linear",
    timestamp: Date.now(),
  };
  movehistory.push(move);
  localStorage.setItem("movementhistory", JSON.stringify(movehistory));
  storedHistory = JSON.parse(localStorage.getItem("movementhistory"));
  targetBox.innerHTML = originalBox.innerHTML;
  originalBox.innerHTML = "";
  let targetBoxclasses = Array.from(originalBox.classList).filter(
    (cls) => cls !== "box"
  );
  targetBoxclasses.forEach((cls) => {
    targetBox.classList.add(cls);
    originalBox.classList.remove(cls);
  });
  originalBox.removeAttribute("style");

  playaudio(audio);
  firstmoveswap = true;
}

function cleanUpAfterMove(reqboxes, originalbox) {
  reqboxes.forEach((box) => {
    box.classList.remove("highlighted");
    const circle = box.querySelector(".circle");
    if (circle) {
      box.removeChild(circle);
    }
    box.removeEventListener("click", removehighlightedboxes);
  });
  originalbox.removeEventListener("click", handleClick);
  originalbox.removeAttribute("style");
}

function possiblemoves(x, y) {
  const moves = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ].filter(([dx, dy]) => {
    const newX = x + dx;
    const newY = y + dy;
    const targetBox = document.querySelector(
      `[rownumberid='${newX}'][columnnumberid='${newY}']`
    );

    return (
      newX >= 1 &&
      newX < 9 &&
      newY >= 1 &&
      newY < 9 &&
      targetBox.innerHTML === ""
    );
  });
  return moves;
}

function adjustBulletDirection(element, player, rotationAngle, color) {
  switch (rotationAngle % 360) {
    case 0:
      return player === "blue"
        ? element === "Ricochet"
          ? color === "blue"
            ? [0, -1]
            : [0, -1]
          : color === "blue"
          ? [0, -1]
          : [0, -1]
        : element === "Ricochet"
        ? color === "blue"
          ? [0, 1]
          : [0, 1]
        : color === "blue"
        ? [0, 0]
        : [0, 0];
    case 90:
      return player === "blue"
        ? element === "Ricochet"
          ? color === "blue"
            ? [0, 1]
            : [0, 1]
          : color === "blue"
          ? [0, 0]
          : [0, 0]
        : element === "Ricochet"
        ? color === "blue"
          ? [0, -1]
          : [0, -1]
        : color === "blue"
        ? [0, -1]
        : [0, -1];
    case 180:
      return player === "blue"
        ? element === "Ricochet"
          ? color === "blue"
            ? [0, -1]
            : [0, -1]
          : color === "blue"
          ? [0, 0]
          : [0, 0]
        : element === "Ricochet"
        ? color === "blue"
          ? [0, 1]
          : [0, 1]
        : color === "blue"
        ? [0, 1]
        : [0, 1];
    case 270:
      return player === "blue"
        ? element === "Ricochet"
          ? color === "blue"
            ? [0, 1]
            : [0, 1]
          : color === "blue"
          ? [0, 1]
          : [0, 1]
        : element === "Ricochet"
        ? color === "blue"
          ? [0, -1]
          : [0, -1]
        : color === "blue"
        ? [0, 0]
        : [0, 0];
    default:
      return [0, 0];
  }
}

function adjustBulletDirection2(element, rotationAngle, direction) {
  switch (rotationAngle % 360) {
    case 0:
      return direction[1] === -1
        ? element === "Ricochet"
          ? [-1, 0]
          : [0, 0]
        : element === "Ricochet"
        ? [1, 0]
        : [1, 0];
    case 90:
      return direction[1] === -1
        ? element === "Ricochet"
          ? [1, 0]
          : [0, 0]
        : element === "Ricochet"
        ? [-1, 0]
        : [-1, 0];
    case 180:
      return direction[1] === -1
        ? element === "Ricochet"
          ? [-1, 0]
          : [1, 0]
        : element === "Ricochet"
        ? [1, 0]
        : [0, 0];
    case 270:
      return direction[1] === -1
        ? element === "Ricochet"
          ? [-1, 0]
          : [0, 0]
        : element === "Ricochet"
        ? [1, 0]
        : [1, 0];
    default:
      return [0, 0];
  }
}

// rotation of ricochet and semiricochet......................................................................................................

function rotateImage() {
  piece = clickedpieces[clickedpieces.length - 1];
  pic = piece.querySelector(".image");
  let rotationAngle = parseInt(pic.getAttribute("data-rotation")) || 0;
  rotationAngle += 90;
  pic.style.transform = `rotate(${rotationAngle}deg)`;
  pic.setAttribute("data-rotation", rotationAngle);
  firstmoveswap = true;

  cleanUpAfterMove(reqboxes, piece);

  reqboxes = [];
  const cannon = document.querySelector(".canon." + player);
  let startRow = Number(cannon.getAttribute("rownumberid"));
  let startCol = Number(cannon.getAttribute("columnnumberid"));
  player === "blue"
    ? bulletshoot([-1, 0], startRow, startCol)
    : bulletshoot([1, 0], startRow, startCol);

  button.removeEventListener("click", rotateImage);
  let previousrotationangle = rotationAngle - 90;
  let currentrotationangle = rotationAngle;
  const piecetype = Array.from(piece.classList).find((cls) =>
    ["canon", "titan", "tank", "Ricochet", "SemiRicochet"].includes(cls)
  );
  const rotationmove = {
    piecetype,
    previousrotationangle,
    currentrotationangle,
    player,
    piece,
    movementtype: "rotation",
    timestamp: Date.now(),
  };
  movehistory.push(rotationmove);
  localStorage.setItem("movementhistory", JSON.stringify(movehistory));
  storedHistory = JSON.parse(localStorage.getItem("movementhistory"));
  playaudio(audio);
}

// bullet display.............................................................................................................................

function addingbullet(direction, targetBox) {
  const bullet = document.createElement("div");
  bullet.innerHTML =
    direction[0] === -1
      ? '<img src="media/bullet2.png" alt="">'
      : direction[0] === 1
      ? '<img src="media/bulletred.png" alt="">'
      : direction[1] === -1
      ? '<img src="media/bulletleft.png" alt="">'
      : direction[1] === 1
      ? '<img src="media/bulletright.png" alt="">'
      : "";

  bullet.classList.add("bullet");
  targetBox.appendChild(bullet);
  setTimeout(() => {
    targetBox.removeChild(bullet);
  }, 200);
}

function bulletshoot(directions, row, column) {
  let direction = directions;
  let currentRow = row;
  let currentCol = column;
  if (direction[0] !== 0 || direction[1] !== 0) {
    const interval = setInterval(() => {
      let previousrow = currentRow;
      let previouscolumn = currentCol;
      currentRow += direction[0];
      currentCol += direction[1];
      const targetBox = document.querySelector(
        `[rownumberid='${currentRow}'][columnnumberid='${currentCol}']`
      );

      if (targetBox !== "null") {
        if (
          (direction[0] === -1 && currentRow < 0) ||
          (direction[0] === 1 && currentRow > 8) ||
          (direction[1] === -1 && currentCol < 0) ||
          (direction[1] === 1 && currentCol > 8)
        ) {
          player = player === "blue" ? "red" : "blue";
          clearInterval(interval);
          clicking();
        }
        if (targetBox && targetBox.innerHTML === "") {
          addingbullet(direction, targetBox);
        } else if (targetBox && targetBox.classList.contains("Ricochet")) {
          if (passthroughacitve) {
            addingbullet(direction, targetBox);
          } else {
            let row = Number(targetBox.getAttribute("rownumberid"));
            let column = Number(targetBox.getAttribute("columnnumberid"));
            const ricochetImage = targetBox.querySelector(".image");
            let rotationAngle =
              parseInt(ricochetImage.getAttribute("data-rotation")) || 0;
            firstdirection = direction;
            if (firstdirection[0] === 1 || firstdirection[0] === -1) {
              playaudio(bounce);
              direction2 = adjustBulletDirection(
                "Ricochet",
                player,
                rotationAngle,
                targetBox.classList.contains("blue") ? "blue" : "red"
              );
            } else {
              playaudio(bounce);
              direction2 = adjustBulletDirection2(
                "Ricochet",
                rotationAngle,
                firstdirection
              );
            }

            clearInterval(interval);
            bulletshoot(direction2, row, column);
          }
        } else if (
          targetBox &&
          targetBox.classList.contains("tank") &&
          direction[1] === -1
        ) {
          console.log(direction);
          {
          }
        } else if (targetBox && targetBox.classList.contains("SemiRicochet")) {
          if (passthroughacitve) {
            addingbullet(direction, targetBox);
          } else {
            let row = Number(targetBox.getAttribute("rownumberid"));
            let column = Number(targetBox.getAttribute("columnnumberid"));
            const semiricochetImage = targetBox.querySelector(".image");
            let rotationAngle2 =
              parseInt(semiricochetImage.getAttribute("data-rotation")) || 0;
            firstdirection = direction;
            if (firstdirection[0] === 1 || firstdirection[0] === -1) {
              direction2 = adjustBulletDirection(
                "Semiricochet",
                player,
                rotationAngle2,
                targetBox.classList.contains("blue") ? "blue" : "red"
              );

              playaudio(bounce);
            } else {
              playaudio(bounce);
              direction2 = adjustBulletDirection2(
                "Semiricochet",
                rotationAngle2,
                firstdirection
              );
            }
            if (direction2[0] === 0 && direction2[1] === 0) {
              playaudio(blast);
              targetBox.innerHTML = "";
              let newcolor = targetBox.classList.contains("blue")
                ? "blue"
                : "red";

              let targetboxclasses = Array.from(targetBox.classList).filter(
                (cls) => cls !== "box"
              );
              targetboxclasses.forEach((cls) => {
                targetBox.classList.remove(cls);
              });
              let colordestroyed =
                newcolor === "blue" ? "bluedestroyed" : "reddestroyed";
              targetBox.classList.add(colordestroyed);
              targetBox.removeEventListener("click", handleClick);
              targetBox.classList.add("semiricochetexisted");

              playertoggle();
              clearInterval(interval);

              clicking();
            }
            clearInterval(interval);
            bulletshoot(direction2, row, column);
          }
        } else if (targetBox && targetBox.innerHTML === "titan") {
          playaudio(blast);
          player = player === "blue" ? "red" : "blue";
          clearInterval(interval);
          resultdeclaration(targetBox);
        } else if (
          targetBox &&
          (!targetBox.classList.contains(player) ||
            (targetBox.classList.contains("tank") && direction[1] !== -1))
        ) {
          player = player === "blue" ? "red" : "blue";
          clearInterval(interval);
          clicking();
        }
      }
    }, 200);
  } else if (bulletshot) {
    clicking();
  }
}

function resultdeclaration(targetBox) {
  displayMoveHistory();
  result = document.createElement("div");
  result.classList.add("result");
  sidebox.insertBefore(result, timer);
  Gameon.remove();
  targetBox.classList.contains("blue")
    ? (result.innerHTML = "Red Won!!!!")
    : (result.innerHTML = "Blue Won!!!!");
  console.log(result.innerHTML);
  targetBox.classList.contains("blue")
    ? (result.style.color = "red")
    : (result.style.color = "blue");
  Removeeventlistener();
  clearInterval(timeinterval);
  replay.addEventListener("click", gamereplay);
}

// undo and redo movements..............................................................................................................

function undomovement() {
  const allboxes = document.querySelectorAll(".box");
  let semiremoved = false;
  allboxes.forEach((box) => {
    if (box.classList.contains("semiricochetexisted")) {
      box.innerHTML = box.classList.contains("bluedestroyed")
        ? '<img class="image" src="media/semi_ricochet_blue.png" alt="">'
        : '<img class="image" src="media/semi_ricochet_red.png" alt="">';
      box.classList.add(
        "SemiRicochet",
        box.classList.contains("bluedestroyed") ? "blue" : "red",
        "piece"
      );
      let removedsemiid = box.getAttribute("customid");
      box.classList.remove(
        box.classList.contains("bluedestroyed")
          ? "bluedestroyed"
          : "reddestroyed"
      );
      semiremoved = true;
      box.classList.remove(
        box.classList.contains("bluedestroyed")
          ? "bluedestroyed"
          : "reddestroyed",
        "semiricochetexisted"
      );
    }
  });
  if (movehistory.length === 0) {
    return;
  }
  const previousmove = movehistory[movehistory.length - 1];

  if (previousmove.movementtype === "linear") {
    let { piecetype, initialposition, endposition, player } = previousmove;
    [initialposition, endposition] = [endposition, initialposition];
    let startbox = document.querySelector(`[customid='${initialposition}']`);
    let endbox = document.querySelector(`[customid='${endposition}']`);

    endbox.innerHTML = startbox.innerHTML;
    endbox.classList.add(piecetype, player, "piece");
    startbox.innerHTML = "";
    startbox.classList.remove(piecetype, player, "piece");

    let newmove = {
      piecetype,
      initialposition,
      endposition,
      player,
      movementtype: "linear",
      timestamp: Date.now(),
    };
    movehistory.push(newmove);

    localStorage.setItem("movementhistory", JSON.stringify(movehistory));
    storedHistory = JSON.parse(localStorage.getItem("movementhistory"));
  } else if (previousmove.movementtype === "swap") {
    let pieces = previousmove.pieces;
    toactualswap(pieces[0].piece, pieces[1].piece);
    clicking();
  } else {
    let {
      piecetype,
      currentrotationangle,
      previousrotationangle,
      player,
      piece,
    } = previousmove;
    pieceid = piece.getAttribute("customid");
    [currentrotationangle, previousrotationangle] = [
      previousrotationangle,
      currentrotationangle,
    ];
    pic = piece.querySelector(".image");
    pic.removeAttribute("style");
    pic.style.transform = `rotate(${currentrotationangle}deg)`;
    piece.querySelector(".image").removeAttribute("data-rotation");
    piece
      .querySelector(".image")
      .setAttribute("data-rotation", currentrotationangle);

    let newmove = {
      piecetype,
      previousrotationangle,
      currentrotationangle,
      player,
      piece,
      movementtype: "rotation",
      timestamp: Date.now(),
    };
    movehistory.push(newmove);
    localStorage.setItem("movementhistory", JSON.stringify(movehistory));
    storedHistory = JSON.parse(localStorage.getItem("movementhistory"));
  }

  if (result) {
    result.remove();
    Gameon = document.createElement("div");
    Gameon.classList.add("gameon");
    Gameon.innerHTML = "Game on!!!";
    sidebox.insertBefore(Gameon, timer);
  }

  if (semiremoved == true) {
    movehistory[movehistory.length - 1]["removedsemiid"] = removedsemiid;
    semiremoved = false;
  }
  playertoggle();
  let undotimer = true;

  clicking();
}
function redomovement() {
  const allboxes = document.querySelectorAll(".box");
  let semiremoved = false;
  allboxes.forEach((box) => {
    if (box.classList.contains("semiricochetexisted")) {
      box.innerHTML = box.classList.contains("bluedestroyed")
        ? '<img class="image" src="media/semi_ricochet_blue.png" alt="">'
        : '<img class="image" src="media/semi_ricochet_red.png" alt="">';
      box.classList.add(
        "SemiRicochet",
        box.classList.contains("bluedestroyed") ? "blue" : "red",
        "piece"
      );
      removedsemiid = box.getAttribute("customid");
      box.classList.remove(
        box.classList.contains("bluedestroyed")
          ? "bluedestroyed"
          : "reddestroyed"
      );
      semiremoved = true;
      box.classList.remove(
        box.classList.contains("bluedestroyed")
          ? "bluedestroyed"
          : "reddestroyed",
        "semiricochetexisted"
      );
    }
  });
  if (movehistory.length === 0) {
    return;
  }
  previousmove = movehistory[movehistory.length - 1];
  console.log(previousmove);

  if (previousmove.movementtype === "linear") {
    let { piecetype, initialposition, endposition, player } = previousmove;
    [initialposition, endposition] = [endposition, initialposition];
    let startbox = document.querySelector(`[customid='${initialposition}']`);
    let endbox = document.querySelector(`[customid='${endposition}']`);

    endbox.innerHTML = startbox.innerHTML;
    endbox.classList.add(piecetype, player, "piece");
    startbox.innerHTML = "";
    startbox.classList.remove(piecetype, player, "piece");

    canonshooting(startbox, player, altreqboxes);

    let newmove = {
      piecetype,
      initialposition,
      endposition,
      player,
      movementtype: "linear",
      timestamp: Date.now(),
    };
    movehistory.push(newmove);

    localStorage.setItem("movementhistory", JSON.stringify(movehistory));
    storedHistory = JSON.parse(localStorage.getItem("movementhistory"));
  } else if (previousmove.movementtype === "swap") {
    let pieces = previousmove.pieces;
    toactualswap(pieces[0].piece, pieces[1].piece);

    canonshooting(pieces[0], player, altreqboxes);

    // clicking();
  } else {
    let {
      piecetype,
      currentrotationangle,
      previousrotationangle,
      player,
      piece,
    } = previousmove;
    pieceid = piece.getAttribute("customid");
    [currentrotationangle, previousrotationangle] = [
      previousrotationangle,
      currentrotationangle,
    ];
    pic = piece.querySelector(".image");
    pic.removeAttribute("style");
    pic.style.transform = `rotate(${currentrotationangle}deg)`;
    piece.querySelector(".image").removeAttribute("data-rotation");
    piece
      .querySelector(".image")
      .setAttribute("data-rotation", currentrotationangle);

    canonshooting(piece, player, altreqboxes);

    let newmove = {
      piecetype,
      previousrotationangle,
      currentrotationangle,
      player,
      piece,
      movementtype: "rotation",
      timestamp: Date.now(),
    };
    movehistory.push(newmove);
    localStorage.setItem("movementhistory", JSON.stringify(movehistory));
    storedHistory = JSON.parse(localStorage.getItem("movementhistory"));
  }

  if (result) {
    result.remove();
    Gameon = document.createElement("div");
    Gameon.classList.add("gameon");
    Gameon.innerHTML = "Game on!!!";
    sidebox.insertBefore(Gameon, timer);
  }

  if (semiremoved == true) {
    movehistory[movehistory.length - 1]["removedsemiid"] = removedsemiid;
    semiremoved = false;
  }
  let undotimer = true;
  // clicking();
}

function playaudio(audioElement) {
  audioElement.currentTime = 0;
  audioElement.play();
}
function playertoggle() {
  player = player === "blue" ? "red" : "blue";
}

// swapping ricochet.........................................................................................................

function swapping() {
  let piece = clickedpieces[clickedpieces.length - 1];

  if (!gamestarted) return;
  if (!firstmoveswap) {
    window.alert("You cant swap in your first move");
  } else {
    const ricochetcolor = piece.classList.contains("red") ? "red" : "blue";
    const possiblepieces = Array.from(pieces).filter(
      (piece) =>
        !piece.classList.contains("titan") &&
        (!piece.classList.contains(`Ricochet`) ||
          !piece.classList.contains(ricochetcolor))
    );
    randompiece =
      possiblepieces[Math.floor(Math.random() * possiblepieces.length)];
    toactualswap(randompiece, piece);
    swap.removeEventListener("click", swapping);
    canonshooting(piece, player, reqboxes);
    firstmoveswap = true;
  }
}
function toactualswap(randompiece, piece) {
  let randomisedpiece = randompiece;
  [piece.innerHTML, randomisedpiece.innerHTML] = [
    randomisedpiece.innerHTML,
    piece.innerHTML,
  ];
  const randompiececlassList = Array.from(piece.classList);
  const ricochetclassList = Array.from(randomisedpiece.classList);

  piece.className = "";
  randomisedpiece.className = "";

  ricochetclassList.forEach((cls) => piece.classList.add(cls));
  randompiececlassList.forEach((cls) => randomisedpiece.classList.add(cls));
  movehistory.push({
    movementtype: "swap",
    pieces: [
      { piece: piece, classes: ricochetclassList },
      { piece: randomisedpiece, classes: randompiececlassList },
    ],
    player,
    timestamp: Date.now(),
  });
  localStorage.setItem("movementhistory", JSON.stringify(movehistory));
  storedHistory = JSON.parse(localStorage.getItem("movementhistory"));
}
function convertToSeconds(milliseconds) {
  return milliseconds / 1000;
}

// replay feature.................................................................................................................

function gamereplay() {
  if (replaying) return;
  replaying = true;
  reset();
  cleanUpAfterMove(reqboxes, clickedpieces[clickedpieces.length - 1]);
  clickedpieces[clickedpieces.length - 1].removeAttribute("style");
  clearInterval(timeinterval);

  if (movehistory.length === 0) {
    replaying = false;
    timeinterval = setInterval(timerupdate, 1000);
    timerupdate();
    return;
  }

  let index = 0;
  let starttime = startingtimestamp;
  timeinterval = setInterval(timerupdate, 1000);
  timerupdate();

  function moveexecution() {
    if (index >= movehistory.length) {
      replaying = false;
      return;
    }

    const move = movehistory[index];
    let delay = move.timestamp - starttime;
    let timestampinseconds = delay / 1000;
    console.log(timestampinseconds);

    setTimeout(() => {
      starttime = move.timestamp;

      if (index == movehistory.length - 1) {
        replaying = false;
        Removeeventlistener();
      }
      implementmove(move);

      index++;
      setTimeout(clearingtime, 1000);
      function clearingtime() {
        clearInterval(timeinterval);
        timerupdate();
      }

      moveexecution();
    }, delay);
  }

  moveexecution();
}

function canonshooting(piece, player, boxarray) {
  const cannon = document.querySelector(".canon." + player);
  let startRow = Number(cannon.getAttribute("rownumberid"));
  let startCol = Number(cannon.getAttribute("columnnumberid"));

  player === "blue"
    ? bulletshoot([-1, 0], startRow, startCol)
    : bulletshoot([1, 0], startRow, startCol);
  playaudio(audio);
  piece.removeAttribute("style");
  cleanUpAfterMove(boxarray, piece);
}
function implementmove(move) {
  if (move.movementtype === "linear") {
    let { piecetype, initialposition, endposition, player, piece } = move;
    piece = document.querySelector(`[customid=${initialposition}]`);
    let startbox = document.querySelector(`[customid='${initialposition}']`);
    let endbox = document.querySelector(`[customid='${endposition}']`);

    endbox.innerHTML = startbox.innerHTML;
    endbox.classList.add(piecetype, player, "piece");
    startbox.innerHTML = "";
    startbox.classList.remove(piecetype, player, "piece");

    canonshooting(piece, player, newreqboxes);
  } else if (move.movementtype === "swap") {
    let swappingpieces = move.pieces;
    piece = swappingpieces[0].piece;
    let randompiece = swappingpieces[1].piece;
    [piece.innerHTML, randompiece.innerHTML] = [
      randompiece.innerHTML,
      piece.innerHTML,
    ];
    const ricochetclassList = Array.from(piece.classList);
    const randompiececlassList = Array.from(randompiece.classList);

    piece.className = "";
    randompiece.className = "";

    ricochetclassList.forEach((cls) => randompiece.classList.add(cls));
    randompiececlassList.forEach((cls) => piece.classList.add(cls));
    canonshooting(piece, player, newreqboxes);
  } else {
    let {
      piecetype,
      currentrotationangle,
      previousrotationangle,
      player,
      piece,
    } = move;
    console.log(move);
    pic = piece.querySelector(".image");
    console.log(pic);
    console.log(currentrotationangle);
    let rotationAngle = parseInt(pic.getAttribute("data-rotation")) || 0;
    console.log(rotationAngle);
    rotationAngle += 90;
    console.log(rotationAngle);
    pic.style.transform = `rotate(${rotationAngle}deg)`;
    console.log(pic);
    pic.setAttribute("data-rotation", rotationAngle);

    canonshooting(piece, player, newreqboxes);
  }
}

reset();
