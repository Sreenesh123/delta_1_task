 import { adjustBulletDirection2, adjustBulletDirection, player, movehistory, playertoggle, clicking,audio,bounce,blast,playaudio,resultdeclaration,handleClick,pieces,toactualswap,gamereplay,implementmove,canonshooting,timeinterval,timerupdate,displayMoveHistory,getPieceImage,createMoveElement} from "./app.js";
export { botMove };

let direction2;
let finaldirection;
let redcanon = document.querySelector(".red.canon");
let firstdirection;
let bullet;
let currentCol;
let currentRow;
async function botMove() {
    if (player === "red") { 
        const redPieces = Array.from(document.querySelectorAll('.piece.red'));
        if (redPieces.length === 0) return;
        let moveMade = false;
        moveMade = await protectTitan();
        if (!moveMade) {
            await makeRandomMove(redPieces);
        }
        playertoggle();
        clicking();
    }
}


async function protectTitan() {
    const redTitan = document.querySelector('.titan.red');
    if (!redTitan) return false;

    const blueCanon = document.querySelector('.canon.blue');

    if (await checkingdeflectionhit(blueCanon, redTitan)) {
        const blockingPieces = Array.from(document.querySelectorAll('.piece.red'));
        for (let piece of blockingPieces) {
            const possibleMoves = getPossibleMoves(piece);
            for (let move of possibleMoves) {
                if (await isBlockingDeflectedShot(blueCanon, redTitan, move)) {
                    movePiece(piece, move);
                    return true; 
                }
            }
        }
    }
    return false;
}

async function isBlockingDeflectedShot(blueCanon, redTitan, move) {
    const startRow = Number(blueCanon.getAttribute("rownumberid"));
    const startCol = Number(blueCanon.getAttribute("columnnumberid"));

    if (await blockcheck([-1, 0], startRow, startCol, move, redTitan)) {
        return true;
    }

    return false;
}

async function makeRandomMove(redPieces) {
    let pieceMoved = false;
    while (!pieceMoved) {
        const randomPiece = redPieces[Math.floor(Math.random() * redPieces.length)];
        const possibleMoves = getPossibleMoves(randomPiece);
        const isRicochet = randomPiece.classList.contains("Ricochet");
        const isSemiRicochet = randomPiece.classList.contains("SemiRicochet");

        if (possibleMoves.length > 0 || isRicochet || isSemiRicochet) {
            let randomMove;
            if (isRicochet || isSemiRicochet) {
                const actions = ["linear", "rotation"];
                if (isRicochet) actions.push("swap");

                const chosenAction = actions[Math.floor(Math.random() * actions.length)];

                if (chosenAction === "linear" && possibleMoves.length > 0) {
                    randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
                    const moveCol = randomMove.getAttribute("columnnumberid");
                    const pieceCol = randomPiece.getAttribute("columnnumberid");

                    // If the piece is a red titan and the move is in the same column, skip this move
                    if (randomPiece.classList.contains("titan") && moveCol === pieceCol) {
                        continue;
                    }
                    movePiece(randomPiece, randomMove);
                } else if (chosenAction === "rotation") {
                    rotatePiece(randomPiece);
                } else if (chosenAction === "swap") {
                    swapRicochet(randomPiece);
                }

                pieceMoved = true;
            } else {
                randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
                if (randomPiece.classList.contains("titan")) {
                    let redcanon = document.querySelector(".red.canon");
                    const moveCol = randomMove.getAttribute("columnnumberid");
                    let redcanoncolumn = redcanon.getAttribute("columnnumberid");
                    if(moveCol===redcanoncolumn){
                    continue;}
                }
                else if(randomPiece.classList.contains("canon"))
                    {
                        let redTitan=document.querySelector(".red.titan");
                        const moveCol = randomMove.getAttribute("columnnumberid");
                        let redTitanCol=redTitan.getAttribute("columnnumberid");
                        if(moveCol===redTitanCol)
                            {
                                continue;
                            }
                    }
                movePiece(randomPiece, randomMove);
                pieceMoved = true;
            }
        }
    }

    let redcanon = document.querySelector(".red.canon");
    let redcanonrow = redcanon.getAttribute("rownumberid");
    let redcanoncolumn = redcanon.getAttribute("columnnumberid");
    await bulletshoot([1, 0], redcanonrow, redcanoncolumn);
}

function rotatePiece(piece) {
    const image = piece.querySelector(".image");
    let rotationAngle = parseInt(image.getAttribute("data-rotation")) || 0;
    rotationAngle = (rotationAngle + 90) % 360; // Rotate 90 degrees
    image.setAttribute("data-rotation", rotationAngle);
    image.style.transform = `rotate(${rotationAngle}deg)`;

    playaudio(audio);
    let previousrotationangle=rotationAngle-90;
  let currentrotationangle=rotationAngle;
  const piecetype = Array.from(piece.classList).find((cls) =>
    ["canon", "titan", "tank", "Ricochet", "SemiRicochet"].includes(cls)
  );
    movehistory.push({
        movementtype: "rotation",piecetype,piece,player:"red",previousrotationangle,currentrotationangle,timestamp: Date.now()
    });
    localStorage.setItem("movementhistory", JSON.stringify(movehistory));
    console.log(JSON.parse(localStorage.getItem("movementhistory")));
}

function swapRicochet(ricochetPiece) {
    const ricochetcolor=ricochetPiece.classList.contains("red")?"red":"blue";

    const possiblepieces=Array.from(pieces).filter((piece)=>!piece.classList.contains('titan') && (!piece.classList.contains(`Ricochet`) || !piece.classList.contains(ricochetcolor)));
    const randompiece=possiblepieces[Math.floor(Math.random()*possiblepieces.length)];
    toactualswap(randompiece,ricochetPiece);

}


function getPossibleMoves(piece) {
    const currentRow = Number(piece.getAttribute("rownumberid"));
    const currentCol = Number(piece.getAttribute("columnnumberid"));

    const directions = [
        [0, 1], [1, 0], [0, -1], [-1, 0],
        [1, 1], [1, -1], [-1, 1], [-1, -1] 
    ];

    const possibleMoves = [];

    directions.forEach(direction => {
        const newRow = currentRow + direction[0];
        const newCol = currentCol + direction[1];
        const targetBox = document.querySelector(`[rownumberid='${newRow}'][columnnumberid='${newCol}']`);

        if (targetBox && !targetBox.classList.contains('piece')) {
            possibleMoves.push(targetBox);
        }
    });

    return possibleMoves;
}

function movePiece(piece, targetBox) {
    const piecetype = Array.from(piece.classList).find(cls => ["canon", "titan", "tank", "Ricochet", "SemiRicochet"].includes(cls));
    const playerClass = Array.from(piece.classList).find(cls => ["red", "blue"].includes(cls));

    targetBox.innerHTML = piece.innerHTML;
    targetBox.classList.add(piecetype, playerClass, 'piece');

    piece.innerHTML = "";
    piece.className = "box"; // Reset the original box
    let redcanon = document.querySelector(".red.canon");
    let redcanonrow = redcanon.getAttribute("rownumberid");
    let redcanoncolumn = redcanon.getAttribute("columnnumberid");
    let initialposition=piece.getAttribute("customid");
    let endposition=targetBox.getAttribute("customid");

    movehistory.push({
        movementtype: "linear",piece,initialposition,endposition,targetBox,piecetype,player:"red",timestamp: Date.now()
    });
    localStorage.setItem("movementhistory", JSON.stringify(movehistory));
    let storedHistory = JSON.parse(localStorage.getItem("movementhistory"));
    playaudio(audio);
}

async function checkingdeflectionhit(blueCanon, redTitan) {
    

    let blueCanonRow = Number(blueCanon.getAttribute("rownumberid"));
    let blueCanonCol = Number(blueCanon.getAttribute("columnnumberid"));
    
    
    await botbulletshoot([-1, 0], blueCanonRow, blueCanonCol);
}

async function botbulletshoot(directions, row, column) {
    return new Promise((resolve) => {
        let direction = directions;
        let currentRow = row;
        let currentCol = column;

        const interval = setInterval(() => {
            currentRow += direction[0];
            currentCol += direction[1];

            let targetBox = document.querySelector(`[rownumberid='${currentRow}'][columnnumberid='${currentCol}']`);

            if (
                !targetBox ||
                (direction[0] === -1 && currentRow < 0) ||
                (direction[0] === 1 && currentRow > 8) ||
                (direction[1] === -1 && currentCol < 0) ||
                (direction[1] === 1 && currentCol > 8)
            ) {
                clearInterval(interval);
                resolve(false);
                return;
            }

            if (targetBox && targetBox.classList.contains("Ricochet")) {
                clearInterval(interval);
                handleRicochet(targetBox, direction, resolve);
            } else if (targetBox && targetBox.classList.contains("SemiRicochet")) {
                clearInterval(interval);
                handleSemiRicochet(targetBox, direction, resolve);
            } else if (targetBox && targetBox.innerHTML === "titan") {
                clearInterval(interval);
                resolve(true);
            } else if (targetBox && targetBox.innerHTML === "") {
            } else {
                clearInterval(interval);
                resolve(false);
            }
        }, 200);
    });
}

function handleRicochet(targetBox, direction, resolve) {
    let row = Number(targetBox.getAttribute("rownumberid"));
    let column = Number(targetBox.getAttribute("columnnumberid"));
    const ricochetImage = targetBox.querySelector(".image");
    let rotationAngle = parseInt(ricochetImage.getAttribute("data-rotation")) || 0;
    firstdirection = direction;

    if (firstdirection[0] === 1 || firstdirection[0] === -1) {
        direction2 = adjustBulletDirection(
            "Ricochet",
            player,
            rotationAngle,
            targetBox.classList.contains("blue") ? "blue" : "red"
        );
    } else {
        direction2 = adjustBulletDirection2(
            "Ricochet",
            rotationAngle,
            firstdirection
        );
    }

    botbulletshoot(direction2, row, column).then(resolve);
}

function handleSemiRicochet(targetBox, direction, resolve) {
    let row = Number(targetBox.getAttribute("rownumberid"));
    let column = Number(targetBox.getAttribute("columnnumberid"));
    const semiricochetImage = targetBox.querySelector(".image");
    let rotationAngle2 = parseInt(semiricochetImage.getAttribute("data-rotation")) || 0;
    firstdirection = direction;

    if (firstdirection[0] === 1 || firstdirection[0] === -1) {
        direction2 = adjustBulletDirection(
            "SemiRicochet",
            player,
            rotationAngle2,
            targetBox.classList.contains("blue") ? "blue" : "red"
        );
    } else {
        direction2 = adjustBulletDirection2(
            "SemiRicochet",
            rotationAngle2,
            firstdirection
        );
    }

    botbulletshoot(direction2, row, column).then(resolve);
}

async function blockcheck(direction, startRow, startCol, move, redTitan) {
    return new Promise((resolve) => {
        const interval = setInterval(() => {
            const newRow = startRow + direction[0];
            const newCol = startCol + direction[1];

            const targetBox = document.querySelector(`[rownumberid='${newRow}'][columnnumberid='${newCol}']`);

            if (!targetBox) {
                clearInterval(interval);
                resolve(false);
                return;
            }

            if (targetBox === move && move !== redTitan) {
                clearInterval(interval);
                resolve(true);
            } else {
                clearInterval(interval);
                resolve(false);
            }
        }, 200);
    });
}
function bulletshoot(directions, row, column) {
  let direction = directions;
  currentRow =Number(row);
   currentCol = Number(column);

  return new Promise((resolve) => {
      if (direction[0] !== 0 || direction[1] !== 0) {
          const interval = setInterval(() => {
              let previousrow = currentRow;
              let previouscolumn = currentCol;
              currentRow += direction[0];
              currentCol += direction[1];
              let targetBox = document.querySelector(
                  `[rownumberid='${currentRow}'][columnnumberid='${currentCol}']`
              );

              if (targetBox !== "null") {
                  if (
                      (direction[0] === -1 && currentRow < 0) ||
                      (direction[0] === 1 && currentRow > 8) ||
                      (direction[1] === -1 && currentCol < 0) ||
                      (direction[1] === 1 && currentCol > 8)
                  ) {
                      clearInterval(interval);
                      resolve(false);
                  } else if (targetBox && targetBox.innerHTML.trim() === "") {
                      bullet = document.createElement("div");
                      bullet.innerHTML = direction[0] === -1 ? '<img src="media/bullet2.png" alt="">' :
                          direction[0] === 1 ? '<img src="media/bulletred.png" alt="">' :
                          direction[1] === -1 ? '<img src="media/bulletleft.png" alt="">' :
                          direction[1] === 1 ? '<img src="media/bulletright.png" alt="">' : '';

                      addingbullet(bullet,targetBox);
                      
                  } else if (targetBox && targetBox.classList.contains("Ricochet")) {
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
                      bulletshoot(direction2, row, column).then(resolve);
                  } else if (targetBox && targetBox.classList.contains("tank") && direction[1] === -1) {
                      resolve(false);
                  } else if (targetBox && targetBox.classList.contains("SemiRicochet")) {

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
                          let newcolor = targetBox.classList.contains("blue") ? "blue" : "red";

                          let targetboxclasses = Array.from(targetBox.classList).filter(
                              (cls) => cls !== "box"
                          );
                          targetboxclasses.forEach((cls) => {
                              targetBox.classList.remove(cls);
                          });
                          let colordestroyed = newcolor === "blue" ? "bluedestroyed" : "reddestroyed";
                          targetBox.classList.add(colordestroyed);
                          targetBox.removeEventListener('click', handleClick);
                          targetBox.classList.add("semiricochetexisted");
                          clearInterval(interval);
                          resolve(true);
                      } else {
                          clearInterval(interval);
                          bulletshoot(direction2, row, column).then(resolve);
                      }
                  } else if (targetBox && targetBox.innerHTML === "titan") {
                      playaudio(blast);
                      clearInterval(interval);
                      resultdeclaration(targetBox);
                      resolve(true);
                  } else if (targetBox && (!targetBox.classList.contains(player) || (targetBox.classList.contains("tank") && direction[1] !== -1))) {
                      clearInterval(interval);
                      resolve(false);
                  }
              }
          }, 200);
      } else {
          resolve(false);
      }
  });
}
 function addingbullet(bullet,targetBox)
 {
  bullet.classList.add("bullet");
  targetBox.appendChild(bullet);
  setTimeout(() => {
      targetBox.removeChild(bullet);
  }, 200);
 }