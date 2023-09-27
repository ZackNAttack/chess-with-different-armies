"use strict"
//if false, we're still in team-pick mode
let state = "setup"; //states: setup (we're... setting up) playing (standard gameplay) promoting (choosing a promo) finished (we're DONE)

let turn = "White";

let paused = false; //if the game's paused, the timer stops and the board stops being interactable

let timeOver = false; //set if the timer's ran out. come to think about it, it's kinda just a 2nd "paused"...

const MoveAudio = document.querySelector("#move"); //the piece move audio

//we're making a chess board here; just 8 rows and columns is good
const NumCols = 8;
const NumRows = 8;
const CellWidth = 5; //measured in vw


const Container = document.querySelector("#gridContainer");
const Container2 = document.querySelector("#gridContainer2"); //container1 is on the left (white view) 2 is on the right (black view)


const Span = document.createElement("span");
Span.classList.add("cell");

const Img = document.createElement("img"); //the piece image
Img.hidden = true;
Img.alt = "";
Img.src = "";

const Overlay = document.createElement("span"); //the select/capture/move overlay
Overlay.classList.add("overlay");


const Boards = []; //holds the cells, not the actual TheBoard board

let colLight = true;


for (let boardNum=0;boardNum<2;boardNum++) { //create the html board
	let board = [];
	colLight = true; //start each board with a light square
	
	for (let col=0;col<NumCols;col++) {
		board.push([]);
		
		let cellLight = colLight; //give the first cell the column color
		
		for (let row=0;row<NumRows;row++) {
			let cell = Span.cloneNode();
			let img = Img.cloneNode();
			let overlay = Overlay.cloneNode();
			
			cell.appendChild(img); //the order is important for whether the piece sprite is affected by select colors
			cell.appendChild(overlay);
			
			cell.style.left = `${col * (CellWidth)}vw`; //position relative to board top-left
			cell.style.top = `${row * (CellWidth)}vw`;
			
			if (cellLight) {
				cell.classList.add("cellLight");
			} else {
				cell.classList.add("cellDark");
			}
			
			switch (boardNum) { //add it to the correct container
				case 0:
					Container.appendChild(cell);
					break;
				case 1:
					Container2.appendChild(cell);
					break;
			}
			
			board[col].push(cell);
			cellLight = !cellLight; //next cell should swap color
		}
		
		colLight = !colLight; //next row should swap color
	}
	
	Boards.push(board);
}

const CapContainer = document.querySelector("#takenContainer");
const CapContainer2 = document.querySelector("#takenContainer2"); //these are the capture fields; 1 is left, holding the black pieces captured by white. 2 is right, holding white pieces capped by black

const CapBoards = [];

for (let capBoardNum=0;capBoardNum<2;capBoardNum++) { //create the html cap zones
	let capBoard = [];
	colLight = true;
	
	for (let col=0;col<NumCols;col++) {
		capBoard.push([]);
		
		let cellLight = colLight;
		
		for (let row=0;row<2;row++) { //this is the only logic difference
			let cell = Span.cloneNode();
			let img = Img.cloneNode();
			let overlay = Overlay.cloneNode();
			
			cell.appendChild(img);
			cell.appendChild(overlay);
			
			cell.style.left = `${col * (CellWidth)}vw`;
			cell.style.top = `${row * (CellWidth)}vw`;
			
			if (cellLight) {
				cell.classList.add("cellLight");
			} else {
				cell.classList.add("cellDark");
			}
			
			switch (capBoardNum) {
				case 0:
					CapContainer.appendChild(cell);
					break;
				case 1:
					CapContainer2.appendChild(cell);
					break;
			}
			
			capBoard[col].push(cell);
			cellLight = !cellLight;
		}
		
		colLight = !colLight;
	}
	
	CapBoards.push(capBoard);
}

function updatePieces() { //renders the pieces
	for (let col=0;col<NumCols;col++) {
		for (let row=0;row<NumRows;row++) { //go through every tile
			let imgElement = Boards[0][col][row].childNodes[0];
			
			let imgElement2
			if (state == "setup") {
				imgElement2 = Boards[1][col][row].childNodes[0]; //if we're setting up, the right board should be white's view
			} else {
				imgElement2 = Boards[1][NumCols-col-1][NumRows-row-1].childNodes[0];
			}
			let piece = TheBoard.getPiece(col, row);
			if (piece == null) { //if there's no piece, just hide the image element.
				imgElement.hidden = true;
				imgElement2.hidden = true;
			} else {
				imgElement.src = "images/" + piece[0].replaceAll("+", "-") + "-" + piece[1] + ".png"; //if there's a + in its name, replace that with a - for file name purposes
				imgElement.hidden = false;
				imgElement2.src = "images/" + piece[0].replaceAll("+", "-") + "-" + piece[1] + ".png";
				imgElement2.hidden = false;
			}
		}
	}
	
	let capList = TheBoard.getCapturedPieces();
	
	for (let capBoardNum=0;capBoardNum<CapBoards.length;capBoardNum++) { //go through both capboards
		let capBoard = CapBoards[capBoardNum];
		for (let capBoardCol of capBoard) { //clear out every cell in case a piece stopped being capped
			for (let capBoardCell of capBoardCol) {
				let imgElement = capBoardCell.childNodes[0];
				imgElement.hidden = true;
			}
		}
		
		for (let capIndex=0;capIndex<capList[capBoardNum].length;capIndex++) { //go through the capture list
			let capPiece = capList[capBoardNum][capIndex];
			
			let capBoardCol = capIndex % NumCols; //get position from cell number
			let capBoardRow = Math.floor(capIndex/NumCols);
			
			let imgElement = capBoard[capBoardCol][capBoardRow].childNodes[0];
			imgElement.src = "images/" + capPiece[0].replaceAll("+", "-") + "-" + capPiece[1] + ".png"; //see ^
			imgElement.hidden = false;
		}
	}
}

Container.onclick = e => {
	let rect = Container.getBoundingClientRect(); //get the rect
	let mouseX = 100*(e.clientX - rect.left)/window.innerWidth; //convert mouseX to relative vw
	let mouseY = 100*(e.clientY - rect.top)/window.innerWidth; //^
	let col = Math.floor(mouseX/CellWidth); //calculate which cell is being clicked
	let row = Math.floor(mouseY/CellWidth); //^
	processClick(col, row); //process the click
}

Container2.onclick = e => { //^
	let rect = Container2.getBoundingClientRect();
	let mouseX = 100*(e.clientX - rect.left)/window.innerWidth;
	let mouseY = 100*(e.clientY - rect.top)/window.innerWidth;
	let col = NumCols - Math.floor(mouseX/CellWidth) - 1;
	let row = NumRows - Math.floor(mouseY/CellWidth) - 1;
	processClick(col, row);
}

CapContainer.onclick = e => { //^ but capture board
	let rect = CapContainer.getBoundingClientRect();
	let mouseX = 100*(e.clientX - rect.left)/window.innerWidth;
	let mouseY = 100*(e.clientY - rect.top)/window.innerWidth;
	let col = Math.floor(mouseX/CellWidth);
	let row = Math.floor(mouseY/CellWidth);
	
	let capNum = col + row * NumCols; //turn row, col into index
	processCapClick(0, capNum); //process the click
}

CapContainer2.onclick = e => { //^
	let rect = CapContainer2.getBoundingClientRect();
	let mouseX = 100*(e.clientX - rect.left)/window.innerWidth;
	let mouseY = 100*(e.clientY - rect.top)/window.innerWidth;
	let col = Math.floor(mouseX/CellWidth);
	let row = Math.floor(mouseY/CellWidth);
	
	let capNum = col + row * NumCols;
	processCapClick(1, capNum); //^ but right cap board
}

let selection = null; //where have we selected?
let targets = []; //where can the piece move?

function processClick(col, row) {
	if (paused || timeOver) {return;} //if we've paused or we're out of time, ignore the click
	switch (state)
	{
		case "playing": //if we're in normal gameplay
			if (selection == null) { //if there's no selection
				let piece = TheBoard.getPiece(col, row); //choose the piece
				
				if (piece != null) { //if we've actually chosen a piece...
					selection = {x: col, y: row}; //mark it as selected!
					targets = TheBoard.getMoves(col, row); //find its possible moves. TODO: possibly use getMovesRaw to show pressured friendly pieces?
				}
			} else if (selection.x == col && selection.y == row) { //if we're clicking a selected piece...
				selection = null; //...deselect it!
				targets = [];
			} else { //we've selected a piece and chosen a spot to move
				if (turn == TheBoard.getPiece(selection.x, selection.y)[1]) { //the piece color DOES match the turn color... right?
					for (let target of targets) { //go through possible spaces
						if (col == target.x && row == target.y) { //if we clicked a valid space
							let capturedPiece = TheBoard.getPiece(target.x, target.y); //we're capturing whatever we're moving on!
							
							let success = TheBoard.makeMove(selection.x, selection.y, target.x, target.y); //make the move. were we successful?
							
							if (TheBoard.checkMated()) { //check if mate's been delivered. this can only happen if the move was successful.
								selection = null; //deselect
								targets = [];
								updatePieces(); //update
								
								state = "finished"; //set state. we won!
								
								updateTicker("FINISH", turn); //announce our victory
								
								switchTurn(true); //swap turn. this only matters if an undo is going to be done.
								setPaused(true); //pause the timer (if there is one).
							} else if (success) { //this move didn't mate but it was valid
								MoveAudio.play();
								
								selection = null; //deselect
								targets = [];
								updatePieces(); //update
								
								if (success == 2) { //a pawn is to be promoted
									updateTicker("PROMOTION"); //announce that
									state = "promoting"; //change state to promotion state!
								} else { //this is a standard success.. would a switch statement make more sense?
									switchTurn(true); //switch whose turn it is
									
									if (TheBoard.getInCheck()) //is the new player in check?
									{
										updateTicker("CHECK"); //announce it!
									} else {
										updateTicker(); // announce the new turn.
									}
								}
							} else { //we're doing an invalid move (one that would put us in check)
								if (TheBoard.getInCheck()) { //if we're already in check, state this *wouldn't un-*check us
									updateTicker("STILL_INVALID");
								} else { //otherwise, state this would check us
									updateTicker("INVALID");
								}
							}
							
							//we don't need to process any extra targets; besides... we already probably cleared out the target list by this point.
							break;
						}
					}
				} else { //it doesn't..
					updateTicker("WRONG_COLOR", turn == "Black" ? "White" : "Black"); //this is actually the best feature right here. i've attempted to make two moves in a row while testing SO MANY TIMES and got confused.
				}
			}
			
			updateColors(); //update (so usually remove) highlights
			break;
		case "promoting": //if we're promoting:
			let piece = TheBoard.getPiece(col, row); //take the piece we just clicked...
			
			tryPromo(piece); //try promoting whatever pawn is promoting into it!
			break;
	}
}

function processCapClick(capFieldNum, capSlotNum) { //the only time this is clicked is if we're promoting
	if (paused || timeOver) {return;} //don't try promoting while paused, man!
	switch (state) {
		case "promoting": //this is te only time the captures do anything, and it's to ensure one can't be locked out of a promotion due to capping all
			let capList = TheBoard.getCapturedPieces(); //get the list of captured pieces...
			let piece = capList[capFieldNum][capSlotNum]; //get the piece we've clicked
			
			tryPromo(piece); //try promoting it.
			break;
	}
}

function tryPromo(piece) { //promotion time! try to promote into the given piece.
	if (piece != null) { //first, we *did* actually click a piece, right?
		if (piece[0] != "King" && piece[0] != "Pawn") { //...and we're not trying to promote into a king or into a pawn, right?
			TheBoard.promote(piece); //promote!
			
			if (TheBoard.checkMated()) { //did we manage to mate via promotion?
				selection = null; //deselect
				targets = [];
				updatePieces(); //update
				
				state = "finished"; //set state. we won, through promotion, no less!
				
				updateTicker("FINISH", turn); //announce our victory
				
				switchTurn(true); //swap turn. this only matters if an undo is going to be done.
				
				updatePieces();
				setPaused(true); //pause the timer (if there is one).
			} else {
				state = "playing"; //promotion state is over. back to normal gameplay.
				switchTurn(true); //and now actually switch to the other's turn
				
				updatePieces();
				
				if (TheBoard.getInCheck()) //ok now we should check for check.
				{
					updateTicker("CHECK");
				} else {
					updateTicker();
				}
			}
		}
	}
}

function updateColors() { //updates the select/move/capture overlay.
	for (let col=0;col<NumCols;col++) {
		for (let row=0;row<NumRows;row++) { //go through every overlay
			let overlay = Boards[0][col][row].childNodes[1];
			let overlay2 = Boards[1][col][row].childNodes[1]; //no need to account for being upside-down if we're removing *every* overlay!
			
			overlay.classList.remove("select", "capture", "move");
			overlay2.classList.remove("select", "capture", "move"); //remove the overlays.
		}
	}
	
	if (selection) { //if there's a selection
		let selX = selection.x;
		let selY = selection.y;
		
		Boards[0][selX][selY].childNodes[1].classList.add("select"); //get the chosen spot and select it
			
		if (state == "setup"){ //check if it's setup
			Boards[1][selX][selY].childNodes[1].classList.add("select");
		} else {
			Boards[1][NumCols-selX-1][NumRows-selY-1].childNodes[1].classList.add("select"); //if it's not, turn it upside-down
		}
	}
	
	for (let target of targets) { //go through all targeted spaces
		let tarX = target.x;
		let tarY = target.y;
		let cap = target.cap; //if cap isn't null, override the piece check
		
		if (cap != false && (cap == true || TheBoard.getPiece(tarX, tarY))) { //if cap is false, this goes to the else statement. if cap is null, this just checks if piece. if cap is true, this ignores if there's a piece
			Boards[0][tarX][tarY].childNodes[1].classList.add("capture"); //mark it as a capture
			if (state == "setup"){ //^
				Boards[1][tarX][tarY].childNodes[1].classList.add("capture");
			} else {
				Boards[1][NumCols-tarX-1][NumRows-tarY-1].childNodes[1].classList.add("capture"); //^
			}
		} else { //^ but mark as a move
			Boards[0][tarX][tarY].childNodes[1].classList.add("move");
			if (state == "setup"){
				Boards[1][tarX][tarY].childNodes[1].classList.add("move");
			} else {
				Boards[1][NumCols-tarX-1][NumRows-tarY-1].childNodes[1].classList.add("move");
			}
		}
	}
}

const Ticker = document.querySelector("#ticker");
const Ticker2 = document.querySelector("#ticker2"); //the tickers display info like turn. ticker1 is use for whose turn it is and victories, ticker2 is for other info

function updateTicker(msgType, exdata) { //update the ticker; tell it what type of message it is. some messages have bonus data.
	let msg = Ticker.innerHTML;
	let msg2 = Ticker2.innerHTML; //we want to maintain existing messages, usually.
	
	switch (msgType) {
		case "INVALID": //tried to move into check
			msg2 = `That would put you in check.`;
			break;
		case "STILL_INVALID": //aren't successfully stopping check
			msg2 = `That would keep you in check.`;
			break;
		case "WRONG_COLOR": //moving wrong piece color
			msg2 = `It is ${turn}'s turn, not ${exdata}'s.`;
			break;
		case "CHECK": //it's a new turn and we're in check.
			msg = `It is ${turn}'s turn.`;
			msg2 = `You are in check.`;
			break;
		case "FINISH": //game end
			msg = `Winner: ${exdata}.`;
			msg2 = ``;
			break;
		case "PROMOTION": //we're promoting
			msg2 = `Choose a piece to promote to.`;
			break;
		case "TIMEOVER": //game end, specifically from time
			msg = `${exdata} wins due to time.`;
			msg2 = ``;
			break;
		default: //no special state
			msg = `It is ${turn}'s turn.`;
			msg2 = ``;
	}
	
	Ticker.innerHTML = msg; //update the tickers with the new message(s)
	Ticker2.innerHTML = msg2;
}

const PaundoButton = document.querySelector("#paundo"); //pause and undo button.

PaundoButton.onclick = e => { //if there's a timer, run the pause function. if there's not, run the undo function
	if (timer) {
		Pause();
	} else {
		Undo();
	}
};

function Undo() { //undoes the last half-turn.
	if (timeOver) {return;} //this never actually matters; if there's a timer then there's no undo button
	if (TheBoard.boardHistory.length > 1) { //don't undo if this is the first turn.
		TheBoard.undo(); //have the board, well, undo.
		switch (state) { //depending on the state we're in undoing changes different things.
			case "playing":
				switchTurn(); //if we're in a normal state, just switch whose turn it is.
				break;
			case "promoting": //if we're promoting, the previous turn is just before we moved the pawn.
				state = "playing"; //change state back to playing, switch whose turn it is.
				break;
			case "finished":
				switchTurn();
				state = "playing"; //if the game was finished, well, it no longer is.
				break;
		}
		
		if (TheBoard.getInCheck()) //standard check check
		{
			updateTicker("CHECK");
		} else {
			updateTicker();
		}
		
		selection = null; //standard select clear/update
		targets = [];
		updatePieces();
		updateColors();
	}
}

function Pause() { //eh
	setPaused(!paused)
}

const NewGameButton = document.querySelector("#newgame"); //it's.. the new game button.

NewGameButton.onclick = e => { //eh
	startSetup();
};

let startTime = Date.now(); //this is the time at start of the move

let whiteTime = 5*60*1000; //how much time white had at move start
let blackTime = 5*60*1000; //^ but black

let timeBonus = 5*1000; //how much time we get each move

let timer = false; //do we even have a timer?

const WhiteMinute = document.querySelector("#chessCounterWhiteContainer .MinutCont p"); //timer bits
const WhiteColon  = document.querySelector("#chessCounterWhiteContainer .ColonCont p");
const WhiteSecond = document.querySelector("#chessCounterWhiteContainer .SeconCont p");
const WhiteCenSec = document.querySelector("#chessCounterWhiteContainer .CeSecCont p");
const BlackMinute = document.querySelector("#chessCounterBlackContainer .MinutCont p");
const BlackColon  = document.querySelector("#chessCounterBlackContainer .ColonCont p");
const BlackSecond = document.querySelector("#chessCounterBlackContainer .SeconCont p");
const BlackCenSec = document.querySelector("#chessCounterBlackContainer .CeSecCont p");

setInterval(function() { //ok so we need to constantly update how the timer looks
	if (paused || timeOver) {return;} //unless the game's paused or time ran out, of course.
	if (!timer) { //if there is no timer, just clear it all.
		WhiteMinute.innerHTML = "";
		WhiteColon.innerHTML  = "";
		WhiteSecond.innerHTML = "";
		WhiteCenSec.innerHTML = "";
		BlackMinute.innerHTML = "";
		BlackColon.innerHTML  = "";
		BlackSecond.innerHTML = "";
		BlackCenSec.innerHTML = "";
		return;
	}
	let passedTime = Date.now() - startTime; //amount of time that's passed since the move's begun
	
	let whiteTimeDisplay = whiteTime; //we're modifying
	let blackTimeDisplay = blackTime; //one of these
	
	switch(turn) { //remove the passed time from whoever's turn it is.
		case "Black":
			blackTimeDisplay -= passedTime;
			break;
		case "White":
			whiteTimeDisplay -= passedTime;
			break;
	}
	
	if (whiteTimeDisplay<0) { //if we're out of time, say we're at 0 time
		whiteTimeDisplay=0;
	}
	if (blackTimeDisplay<0) { //^
		blackTimeDisplay=0;
	}
	
	let whiteTimeDisplayMinute = `0${Math.floor(whiteTimeDisplay/60/1000)}`.slice(-2); //convert time to minutes then floor. add a 0 to the left, then take the 2 rightmost parts i.e. 2 -> 02 -> 02, 12 -> 012 -> 12
	let whiteTimeDisplaySecond = `0${Math.floor(whiteTimeDisplay/1000 % 60)}`.slice(-2); //convert time to seconds, then remove the minute part, then floor. ^
	let whiteTimeDisplayCenSec = `0${Math.floor(whiteTimeDisplay/10 % 100)}`.slice(-2); //convert time to centiseconds, then remove the second part. ^
	let blackTimeDisplayMinute = `0${Math.floor(blackTimeDisplay/60/1000)}`.slice(-2); //^
	let blackTimeDisplaySecond = `0${Math.floor(blackTimeDisplay/1000 % 60)}`.slice(-2); //^
	let blackTimeDisplayCenSec = `0${Math.floor(blackTimeDisplay/10 % 100)}`.slice(-2); //^
	
	WhiteMinute.innerHTML = whiteTimeDisplayMinute; //display it
	WhiteColon.innerHTML  = ":"; //this actually does matter: if previously the : was blanked out (due to there being no timer) we set it back
	WhiteSecond.innerHTML = whiteTimeDisplaySecond; //^^
	WhiteCenSec.innerHTML = whiteTimeDisplayCenSec; //^
	BlackMinute.innerHTML = blackTimeDisplayMinute; //^
	BlackColon.innerHTML  = ":"; //^^^^
	BlackSecond.innerHTML = blackTimeDisplaySecond; //^^
	BlackCenSec.innerHTML = blackTimeDisplayCenSec; //^
	
	if (whiteTimeDisplay == 0) { //if white ran out of time
		updateTicker("TIMEOVER", "Black"); //say time's over, black's won.
	} else if (blackTimeDisplay == 0) { //^^ but black
		updateTicker("TIMEOVER", "White"); //^^ but white
	}
	
	if (whiteTimeDisplay == 0 || blackTimeDisplay == 0) { //code common to time running out (ending the game)
		timeOver = true; //TIME OVER
		state = "finished"; //it's finished
		selection = null; //clear selection
		targets = []; //clear targets
		updatePieces(); //maybe i should put these four into a function...
		updateColors();
	}
}, 1);

function switchTurn(addTime) { //switch whose turn it is, and if we should add time (deprecated, the only time we wouldn't add time would be if it was an undo, which can't happen without a timer)
	if (paused) {setPaused(false);} //if it's paused, unpause. deprecated. this would only run if we switched turn while it's paused, which would only happen if we did an undo while paused, but undo is only w/o timer and pause only w/ timer
	let passedTime = Date.now() - startTime; //calculate how much time this turn took
	
	switch (turn) {
		case "White":
			if (addTime) {whiteTime += timeBonus;} //give white the time bonus for making a move
			whiteTime -= passedTime; //remove the amount of time this turn took
			turn = "Black"; //switch the turn
			break;
		case "Black":
			if (addTime) {blackTime += timeBonus;}
			blackTime -= passedTime;
			turn = "White";
			break;
	}
	
	startTime = Date.now(); //update the start-of-turn time
}

function setPaused(pause) { //this... well... handles pausing and unpausing
	if (paused == pause) {return;} //if we're pausing mid-pause or unpausing mid-unpause, we don't need to do anything.
	
	paused = pause; //...
	
	if (pause) { //check if we're paused
		let passedTime = Date.now() - startTime; //if we're pausing, subtract the pause time
		
		switch (turn) { //we need to remove it from the proper player
			case "White":
				whiteTime -= passedTime;
				break;
			case "Black":
				blackTime -= passedTime;
				break;
		}
	} else {
		startTime = Date.now(); //if we're unpausing, update the start of turn(/unpause) timer
	}
}

pieceClasses = { //go from the piece id to its proper class
	Pawn: Pawn,
	Rook: Rook,
	Knight: Knight,
	Bishop: Bishop,
	Queen: Queen,
	King: King,
	Bede: Bede,
	Waffle: Waffle,
	Fad: Fad,
	Cardinal: Cardinal,
	"Charging-Rook": ChargingRook,
	Fibnif: Fibnif,
	"Charging-Knight": ChargingKnight,
	Colonel: Colonel,
	"Short-Rook": ShortRook,
	"Woody-Rook": WoodyRook,
	"Half+Duck": HalfDuck,
	"Chancellor": Chancellor,
};

const Teams = {}; //contains team display info: our loadout and the "see moves"
const TeamInputs = []; //list of checkmark objects

let FIDE = ["Rook", "Knight", "Bishop", "Queen", "King", "Bishop", "Knight", "Rook"]; //the fabulous FIDEs! "normal" chess.
let CoCl = ["Bede", "Waffle", "Fad", "Cardinal", "King", "Fad", "Waffle", "Bede"]; //the color-bound clobberers! btw the king is basically necessary.
let NuKn = ["Charging-Rook", "Fibnif", "Charging-Knight", "Colonel", "King", "Charging-Knight", "Fibnif", "Charging-Rook"]; //note: - becomes space in piece select
let ReRo = ["Short-Rook", "Woody-Rook", "Half+Duck", "Chancellor", "King", "Half+Duck", "Woody-Rook", "Short-Rook"]; //note: + becomes - in piece select and filenames

TheBoard.init(NumCols, NumRows, FIDE, FIDE); //this is technically still necessary. we still need a board to show moves on
//updatePieces(); //probably isn't necessary?

let choice = null; //this points to the checkbox of the chosen team, not the team itself.
const ConfirmBtn = document.querySelector("#confirmButton"); //the... the team confirm button.

let whiteChoice = null; //this points to the piece list of the chosen team.
let blackChoice = null; //^

const ChoiceTicker = document.querySelector("#selectionPanel p"); //just says who's turn it is to choose.

const SetupContainer = document.querySelector("#setupContainer"); //container for the list, piece guides, etc.

const TimerPanel = document.querySelector("#timerPanel"); //container for the timer settings
const InitialTime = document.querySelector("#initialTime"); //field containing initial time (in minutes)
const BonusTime = document.querySelector("#bonusTime"); //field containing bonus time (in seconds)

const RookDisplay = document.querySelector("#rookDisplay img"); //rook image
const KnightDisplay = document.querySelector("#knightDisplay img"); //knight image
const BishopDisplay = document.querySelector("#bishopDisplay img"); //bishop image
const QueenDisplay = document.querySelector("#queenDisplay img"); //queen image

const RookLabel = document.querySelector("#rookDisplay p"); //rook nametag
const KnightLabel = document.querySelector("#knightDisplay p"); //^
const BishopLabel = document.querySelector("#bishopDisplay p"); //^
const QueenLabel = document.querySelector("#queenDisplay p"); //^

const RookButton = document.querySelector("#rookButton"); //rook guide button
const KnightButton = document.querySelector("#knightButton"); //^
const BishopButton = document.querySelector("#bishopButton"); //^
const QueenButton = document.querySelector("#queenButton"); //^

function createSetup() {
	createTeam(FIDE, "FIDEs", "Fabulous FIDEs", [ //maybe i should move the examples to the pieces themselves...
		[
			[
				{x: 3, y: 3, piece: ["Rook", "White"]},
				{x: 0, y: 0, piece: ["Pawn", "White"]},
				{x: 1, y: 0, piece: ["Pawn", "White"]},
				{x: 2, y: 0, piece: ["Pawn", "White"]},
				{x: 3, y: 0, piece: ["Pawn", "White"]},
				{x: 4, y: 0, piece: ["Pawn", "White"]},
				{x: 5, y: 0, piece: ["Pawn", "White"]},
				{x: 6, y: 0, piece: ["Pawn", "Black"]},
				{x: 6, y: 1, piece: ["Pawn", "Black"]},
				{x: 6, y: 2, piece: ["Pawn", "Black"]},
				{x: 6, y: 3, piece: ["Pawn", "Black"]},
				{x: 6, y: 4, piece: ["Pawn", "Black"]},
				{x: 6, y: 5, piece: ["Pawn", "Black"]},
			],
			{x: 3, y: 3}
		],
		[
			[
				{x: 3, y: 3, piece: ["Knight", "White"]},
				{x: 1, y: 1, piece: ["Pawn", "White"]},
				{x: 2, y: 1, piece: ["Pawn", "White"]},
				{x: 3, y: 1, piece: ["Pawn", "White"]},
				{x: 4, y: 1, piece: ["Pawn", "White"]},
				{x: 5, y: 1, piece: ["Pawn", "Black"]},
				{x: 5, y: 2, piece: ["Pawn", "Black"]},
				{x: 5, y: 3, piece: ["Pawn", "Black"]},
				{x: 5, y: 4, piece: ["Pawn", "Black"]},
			],
			{x: 3, y: 3}
		],
		[
			[
				{x: 3, y: 3, piece: ["Bishop", "White"]},
				{x: 0, y: 0, piece: ["Pawn", "White"]},
				{x: 1, y: 0, piece: ["Pawn", "White"]},
				{x: 2, y: 0, piece: ["Pawn", "White"]},
				{x: 3, y: 0, piece: ["Pawn", "White"]},
				{x: 4, y: 0, piece: ["Pawn", "White"]},
				{x: 5, y: 0, piece: ["Pawn", "White"]},
				{x: 6, y: 0, piece: ["Pawn", "Black"]},
				{x: 6, y: 1, piece: ["Pawn", "Black"]},
				{x: 6, y: 2, piece: ["Pawn", "Black"]},
				{x: 6, y: 3, piece: ["Pawn", "Black"]},
				{x: 6, y: 4, piece: ["Pawn", "Black"]},
				{x: 6, y: 5, piece: ["Pawn", "Black"]},
			],
			{x: 3, y: 3}
		],
		[
			[
				{x: 3, y: 3, piece: ["Queen", "White"]},
				{x: 0, y: 0, piece: ["Pawn", "White"]},
				{x: 1, y: 0, piece: ["Pawn", "White"]},
				{x: 2, y: 0, piece: ["Pawn", "White"]},
				{x: 3, y: 0, piece: ["Pawn", "White"]},
				{x: 4, y: 0, piece: ["Pawn", "White"]},
				{x: 5, y: 0, piece: ["Pawn", "White"]},
				{x: 6, y: 0, piece: ["Pawn", "Black"]},
				{x: 6, y: 1, piece: ["Pawn", "Black"]},
				{x: 6, y: 2, piece: ["Pawn", "Black"]},
				{x: 6, y: 3, piece: ["Pawn", "Black"]},
				{x: 6, y: 4, piece: ["Pawn", "Black"]},
				{x: 6, y: 5, piece: ["Pawn", "Black"]},
			],
			{x: 3, y: 3}
		]
	]);
	createTeam(CoCl, "COCLs", "Colorbound Clobberers", [ //ok i definitely should, but i don't think i have enough time before i have to submit this
		[
			[
				{x: 3, y: 3, piece: ["Bede", "White"]},
				{x: 0, y: 0, piece: ["Pawn", "White"]},
				{x: 1, y: 0, piece: ["Pawn", "White"]},
				{x: 2, y: 0, piece: ["Pawn", "White"]},
				{x: 3, y: 0, piece: ["Pawn", "White"]},
				{x: 4, y: 0, piece: ["Pawn", "White"]},
				{x: 5, y: 0, piece: ["Pawn", "White"]},
				{x: 6, y: 0, piece: ["Pawn", "Black"]},
				{x: 6, y: 1, piece: ["Pawn", "Black"]},
				{x: 6, y: 2, piece: ["Pawn", "Black"]},
				{x: 6, y: 3, piece: ["Pawn", "Black"]},
				{x: 6, y: 4, piece: ["Pawn", "Black"]},
				{x: 6, y: 5, piece: ["Pawn", "Black"]},
			],
			{x: 3, y: 3}
		],
		[
			[
				{x: 3, y: 3, piece: ["Waffle", "White"]},
				{x: 0, y: 0, piece: ["Pawn", "White"]},
				{x: 1, y: 0, piece: ["Pawn", "White"]},
				{x: 2, y: 0, piece: ["Pawn", "White"]},
				{x: 3, y: 0, piece: ["Pawn", "White"]},
				{x: 4, y: 0, piece: ["Pawn", "White"]},
				{x: 5, y: 0, piece: ["Pawn", "White"]},
				{x: 6, y: 0, piece: ["Pawn", "Black"]},
				{x: 6, y: 1, piece: ["Pawn", "Black"]},
				{x: 6, y: 2, piece: ["Pawn", "Black"]},
				{x: 6, y: 3, piece: ["Pawn", "Black"]},
				{x: 6, y: 4, piece: ["Pawn", "Black"]},
				{x: 6, y: 5, piece: ["Pawn", "Black"]},
			],
			{x: 3, y: 3}
		],
		[
			[
				{x: 3, y: 3, piece: ["Fad", "White"]},
				{x: 0, y: 0, piece: ["Pawn", "White"]},
				{x: 1, y: 0, piece: ["Pawn", "White"]},
				{x: 2, y: 0, piece: ["Pawn", "White"]},
				{x: 3, y: 0, piece: ["Pawn", "White"]},
				{x: 4, y: 0, piece: ["Pawn", "White"]},
				{x: 5, y: 0, piece: ["Pawn", "White"]},
				{x: 6, y: 0, piece: ["Pawn", "Black"]},
				{x: 6, y: 1, piece: ["Pawn", "Black"]},
				{x: 6, y: 2, piece: ["Pawn", "Black"]},
				{x: 6, y: 3, piece: ["Pawn", "Black"]},
				{x: 6, y: 4, piece: ["Pawn", "Black"]},
				{x: 6, y: 5, piece: ["Pawn", "Black"]},
			],
			{x: 3, y: 3}
		],
		[
			[
				{x: 3, y: 3, piece: ["Cardinal", "White"]},
				{x: 1, y: 1, piece: ["Pawn", "White"]},
				{x: 2, y: 1, piece: ["Pawn", "White"]},
				{x: 3, y: 1, piece: ["Pawn", "White"]},
				{x: 4, y: 1, piece: ["Pawn", "White"]},
				{x: 5, y: 1, piece: ["Pawn", "Black"]},
				{x: 5, y: 2, piece: ["Pawn", "Black"]},
				{x: 5, y: 3, piece: ["Pawn", "Black"]},
				{x: 5, y: 4, piece: ["Pawn", "Black"]},
			],
			{x: 3, y: 3}
		]
	]);
	createTeam(NuKn, "NuKns", "Nutty Knights", [
		[
			[
				{x: 3, y: 3, piece: ["Charging-Rook", "White"]},
				{x: 0, y: 0, piece: ["Pawn", "White"]},
				{x: 1, y: 0, piece: ["Pawn", "White"]},
				{x: 2, y: 0, piece: ["Pawn", "White"]},
				{x: 3, y: 0, piece: ["Pawn", "White"]},
				{x: 4, y: 0, piece: ["Pawn", "White"]},
				{x: 5, y: 0, piece: ["Pawn", "White"]},
				{x: 6, y: 0, piece: ["Pawn", "Black"]},
				{x: 6, y: 1, piece: ["Pawn", "Black"]},
				{x: 6, y: 2, piece: ["Pawn", "Black"]},
				{x: 6, y: 3, piece: ["Pawn", "Black"]},
				{x: 6, y: 4, piece: ["Pawn", "Black"]},
				{x: 6, y: 5, piece: ["Pawn", "Black"]},
			],
			{x: 3, y: 3}
		],
		[
			[
				{x: 3, y: 3, piece: ["Fibnif", "White"]},
				{x: 1, y: 1, piece: ["Pawn", "Black"]},
				{x: 2, y: 1, piece: ["Pawn", "Black"]},
				{x: 3, y: 1, piece: ["Pawn", "Black"]},
				{x: 4, y: 1, piece: ["Pawn", "Black"]},
				{x: 5, y: 1, piece: ["Pawn", "White"]},
				{x: 5, y: 2, piece: ["Pawn", "White"]},
				{x: 5, y: 3, piece: ["Pawn", "White"]},
				{x: 5, y: 4, piece: ["Pawn", "White"]},
			],
			{x: 3, y: 3}
		],
		[
			[
				{x: 3, y: 3, piece: ["Charging-Knight", "White"]},
				{x: 1, y: 1, piece: ["Pawn", "Black"]},
				{x: 2, y: 1, piece: ["Pawn", "Black"]},
				{x: 3, y: 1, piece: ["Pawn", "Black"]},
				{x: 4, y: 1, piece: ["Pawn", "Black"]},
				{x: 5, y: 1, piece: ["Pawn", "White"]},
				{x: 5, y: 2, piece: ["Pawn", "White"]},
				{x: 5, y: 3, piece: ["Pawn", "White"]},
				{x: 5, y: 4, piece: ["Pawn", "White"]},
			],
			{x: 3, y: 3}
		],
		[
			[
				{x: 3, y: 3, piece: ["Colonel", "White"]},
				{x: 1, y: 1, piece: ["Pawn", "Black"]},
				{x: 2, y: 1, piece: ["Pawn", "Black"]},
				{x: 3, y: 1, piece: ["Pawn", "Black"]},
				{x: 4, y: 1, piece: ["Pawn", "Black"]},
				{x: 5, y: 1, piece: ["Pawn", "White"]},
				{x: 5, y: 2, piece: ["Pawn", "White"]},
				{x: 5, y: 3, piece: ["Pawn", "White"]},
				{x: 5, y: 4, piece: ["Pawn", "White"]},
			],
			{x: 3, y: 3}
		]
	]);
	createTeam(ReRo, "ReRos", "Remarkable Rookies", [
		[
			[
				{x: 3, y: 5, piece: ["Short-Rook", "White"]},
			],
			{x: 3, y: 5}
		],
		[
			[
				{x: 3, y: 3, piece: ["Woody-Rook", "White"]},
				{x: 1, y: 1, piece: ["Pawn", "Black"]},
				{x: 2, y: 1, piece: ["Pawn", "Black"]},
				{x: 3, y: 1, piece: ["Pawn", "Black"]},
				{x: 4, y: 1, piece: ["Pawn", "Black"]},
				{x: 5, y: 1, piece: ["Pawn", "White"]},
				{x: 5, y: 2, piece: ["Pawn", "White"]},
				{x: 5, y: 3, piece: ["Pawn", "White"]},
				{x: 5, y: 4, piece: ["Pawn", "White"]},
				{x: 2, y: 2, piece: ["Pawn", "White"]},
				{x: 3, y: 2, piece: ["Pawn", "White"]},
				{x: 4, y: 2, piece: ["Pawn", "Black"]},
				{x: 4, y: 3, piece: ["Pawn", "Black"]},
			],
			{x: 3, y: 3}
		],
		[
			[
				{x: 3, y: 3, piece: ["Half+Duck", "White"]},
				{x: 1, y: 1, piece: ["Pawn", "Black"]},
				{x: 2, y: 1, piece: ["Pawn", "Black"]},
				{x: 3, y: 1, piece: ["Pawn", "Black"]},
				{x: 4, y: 1, piece: ["Pawn", "Black"]},
				{x: 5, y: 1, piece: ["Pawn", "White"]},
				{x: 5, y: 2, piece: ["Pawn", "White"]},
				{x: 5, y: 3, piece: ["Pawn", "White"]},
				{x: 5, y: 4, piece: ["Pawn", "White"]},
			],
			{x: 3, y: 3}
		],
		[
			[
				{x: 3, y: 3, piece: ["Chancellor", "White"]},
				{x: 1, y: 1, piece: ["Pawn", "Black"]},
				{x: 2, y: 1, piece: ["Pawn", "Black"]},
				{x: 3, y: 1, piece: ["Pawn", "Black"]},
				{x: 4, y: 1, piece: ["Pawn", "Black"]},
				{x: 5, y: 1, piece: ["Pawn", "White"]},
				{x: 5, y: 2, piece: ["Pawn", "White"]},
				{x: 5, y: 3, piece: ["Pawn", "White"]},
				{x: 5, y: 4, piece: ["Pawn", "White"]},
			],
			{x: 3, y: 3}
		]
	]);
	
	ConfirmBtn.onclick = e => { //upon clicking to finish
		if (choice == null) {return;} //first check that we've acutally chosen
		
		switch (turn) {
			case "Black":
				blackChoice = Teams[choice.value][0]; //get the team pieces
				
				turn = "White";
				
				startGame(whiteChoice, blackChoice); //start the game.
				break;
			case "White": //keep in mind that white chooses first.
				whiteChoice = Teams[choice.value][0]; //get the team pieces
				
				turn = "Black"; //make it black's turn
				ChoiceTicker.innerHTML = "Black, select an army:"; //black's time to choose
				
				//choice.checked = false; //remove these lines to require black to choose a different team
				//choice.disabled = "disabled"; //btw it's intentional that black knows white's team. offsets the first-move advantage, i think.
				
				//choice = null;
				break;
		}
	};
}

createSetup();

function createTeam(team, name, displayName, example) { //register a team option; "team" is the piece loadout, "name"  is the internal name which... doesn't matter too much; "displayName" is what the name shows up as on the list. maybe i should combine the two
	//example is a four-entry list of rookEx, knightEx, bishopEx, queenEx; each ex is a two-entry list. entry 1 is a list of objects that contain positions and pieces to place on example board; entry 2 is a location for the selected piece.
	Teams[name] = [team, null, null, null, null] //the nulls are placeholder
	
	for (let exampleNum=0; exampleNum<4; exampleNum++){ //go through the examples
		let currExample = example[exampleNum]; //get the example we're processing
		let currPositions = currExample[0]; //get the position list
		let builtExample = [TheBoard.buildArray(NumCols, NumRows), null]; //get the template for the built version
		
		for (let position of currPositions) { //go through the positions
			builtExample[0][position.x][position.y] = position.piece; //change the proper part of the board
		}
		
		builtExample[1] = currExample[1]; //eh
		
		Teams[name][exampleNum+1] = builtExample; //fill the placeholder
	}
	
	let input = document.createElement("input"); //make the radio button
	input.type = "radio";
	input.id = name;
	input.name = "teamChoice";
	input.value = name;
	
	let label = document.createElement("label"); //make the label
	label.htmlFor = name;
	label.innerHTML = displayName;
	
	let item = document.createElement("li"); //make the item holding these
	item.appendChild(input);
	item.appendChild(label);
	
	let armyList = document.querySelector("#armyList"); //get the army list... this should probably be a const outside.
	armyList.appendChild(item); //add the new list item!
	
	input.onclick = e => { //when we select the team...
		choice = input; //make it our choice
		RookDisplay.src = `images/${Teams[choice.value][0][0].replaceAll("+", "-")}-White.png`; //update the images. + becomes -
		KnightDisplay.src = `images/${Teams[choice.value][0][1].replaceAll("+", "-")}-White.png`;
		BishopDisplay.src = `images/${Teams[choice.value][0][2].replaceAll("+", "-")}-White.png`;
		QueenDisplay.src = `images/${Teams[choice.value][0][3].replaceAll("+", "-")}-White.png`;
		
		RookLabel.innerHTML = Teams[choice.value][0][0].replaceAll("-", " ").replaceAll("+", "-"); //update the labels. - becomes " ", + becomes -
		KnightLabel.innerHTML = Teams[choice.value][0][1].replaceAll("-", " ").replaceAll("+", "-");
		BishopLabel.innerHTML = Teams[choice.value][0][2].replaceAll("-", " ").replaceAll("+", "-");
		QueenLabel.innerHTML = Teams[choice.value][0][3].replaceAll("-", " ").replaceAll("+", "-");
		
		let pieceBtnonclick = (e, index) => { //function for handling the piece "see moves" buttons; index is which number piece it is
			TheBoard.lastBoard = Teams[choice.value][index][0]; //change the board into the piece's example... yeah this should definitely be moved into the piece class later
			selection = Teams[choice.value][index][1] //get the selection spot
			targets = TheBoard.getMoves(selection.x, selection.y); //update targets as though we're actually about to move the piece
			updatePieces(); //show the new pieces and selections
			updateColors();
		}
		
		RookButton.onclick = e => { //hook the button up to the handler
			pieceBtnonclick(e, 1);
		}
		KnightButton.onclick = e => {
			pieceBtnonclick(e, 2);
		}
		BishopButton.onclick = e => {
			pieceBtnonclick(e, 3);
		}
		QueenButton.onclick = e => {
			pieceBtnonclick(e, 4);
		}
	};
	
	TeamInputs.push(input); //add the input button to the team input list
}

let gameElements = [WhiteMinute, WhiteColon, WhiteSecond, WhiteCenSec, BlackMinute, BlackColon, BlackSecond, BlackCenSec, Ticker, Ticker2, Container, NewGameButton, PaundoButton, CapContainer, CapContainer2]; //stuff to remove when setup and readd when gaming
let setupElements = [SetupContainer, TimerPanel]; //stuff to remove when gaming and readd when setup
function startSetup() { //go from game to setup
	setPaused(false);
	timeOver = false; //unset pause and timeOver. easier to do it here than in startGame
	
	for (let setupElement of setupElements){ //show setup stuff
		setupElement.style.top = "";
		setupElement.style.display = "";
	}
	
	for (let gameElement of gameElements){ //hide gaming stuff
		gameElement.style.top = "55vw"; //in case there's a weird overlap when clicking
		gameElement.style.display = "none"; //make it invisible, both to the user and to the scrollbar
	}
	
	timer = false; //just... remove the timer too, i guess. just in case.
	
	turn = "White"; //it's white's turn to choose the piece
	
	state = "setup"; //make it setup time. no game objects should react now.
	ChoiceTicker.innerHTML = "White, select an army:"; //it's white's turn to choose the piece
	
	for (let input of TeamInputs) { //go through the inputs
		input.checked = false; //and uncheck them
		input.disabled = ""; //..undisable, too.
	}
	
	TheBoard.lastBoard = TheBoard.buildArray(NumCols, NumRows); //clear out the last board. (re-initializing wouldn't do anything extra, we're just using the board layout to show how pieces move.
	
	selection = null; //clear stuff
	targets = [];
	updatePieces();
	updateColors();
	
	TeamInputs[0].checked = true; //make the first option checked
	TeamInputs[0].onclick(); //and run its onclick event
}

startSetup(); //start the game in setup

function startGame(whiteTeam, blackTeam) { //go from setup to game; we need to know the team pieces.
	for (let setupElement of setupElements){ //see startSetup
		setupElement.style.top = "55vw";
		setupElement.style.display = "none";
	}
	
	for (let gameElement of gameElements){
		gameElement.style.top = "";
		gameElement.style.display = "";
	}
	
	let bothTime = Math.max(0, InitialTime.valueAsNumber); //the timer for black and white should be set to the "initial time" field.
	if (Number.isNaN(bothTime)) {bothTime = 0;} //if it's nan, make it 0.
	
	timer = (bothTime != 0); //if the initial time is 0, there's no timer.
	
	PaundoButton.innerHTML = timer ? "Pause" : "Undo"; //change the pause/undo button appearance to match
	
	bothTime *= 60*1000; //make bothTime into hours
	whiteTime = bothTime; //and now update both timers to bothtime
	blackTime = bothTime;
	
	timeBonus = Math.max(0, BonusTime.valueAsNumber); //again, the time bonus should be set to the "bonus time" field
	if (Number.isNaN(timeBonus)) {timeBonus = 0;} //nan => 0
	timeBonus *= 1000; //convert to seconds
	
	startTime = Date.now(); //set the turn start
	
	turn = "White"; //it's white's turn to move
	
	TheBoard.init(NumCols, NumRows, whiteTeam, blackTeam); //start a new board
	
	state = "playing"; //we're playing now!
	
	selection = null; //clear stuff
	targets = [];
	updatePieces();
	updateColors();
	updateTicker(); //update the ticker
}