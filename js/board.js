"use strict";

let pieceClasses; //main turns it into a map from piece names to piece classes
const TheBoard = { //TheBoard is basically a pseudo-class that handles piece moves, history, etc.
	
	init(numCols, numRows, pieceSetWhite, pieceSetBlack){
		this.numCols = numCols, //yeah set the board size.
		this.numRows = numRows,
		this.boardHistory = [this.buildInitialBoard(pieceSetWhite,pieceSetBlack)]; //and make the first board history entry
		this.lastBoard = this.boardHistory[this.boardHistory.length - 1][0]; //lastBoard is a shortcut to get the most recent board state
	},
	
	buildArray(width, height){ //helper function to build a new array
		let outerArray = [];
		for(let col=0;col<this.numRows;col++){
			let innerArray = [];
			for(let row=0;row<this.numCols;row++){
				innerArray.push(null);
			}
			outerArray.push(innerArray);
		}
		return outerArray;
	},
	
	buildInitialBoard(pieceSetWhite, pieceSetBlack){ //make the first the board state
		let board = this.buildArray(this.numCols, this.numRows); //first make the initial piece position list
		
		for (let xPos=0;xPos<this.numCols;xPos++){ //build time first board, column by colummn
			board[xPos][0] = [pieceSetBlack[xPos], "Black"]; //top row is black nobility
			board[xPos][1] = ["Pawn", "Black"]; //second-to-top is black pawns
			board[xPos][this.numRows-2] = ["Pawn", "White"]; //second-to-bottom is white pawns
			board[xPos][this.numRows-1] = [pieceSetWhite[xPos], "White"]; //bottom row is white nobility
		}
		
		let boardHistoryEntry = [ //this holds metadata about castling and en-passant
			[ //castleable? (black, white) (queenside, kingside)
				[true, true],
				[true, true]
			],
			[ //en-passant? (black, white) (queenside through kingside)
				Array(this.numCols).fill(false),
				Array(this.numCols).fill(false)
			]
		];
		
		let boardCaps = [ //2x list of captured pieces (black, white)
			[],
			[]
		]
		
		return [board, boardHistoryEntry, "White", false, boardCaps]; //the "white" is the current turn. "false" is whether this position is in check.
	},
	
	getPiece(xPos, yPos){ //just gets the piece
		if (!this.validPos(xPos, yPos)) { //don't try an invalid spot
			return null;
		}
		
		return this.lastBoard[xPos][yPos];
	},
	
	validPos(xPos, yPos) { //validates locations
		return !(xPos < 0 || yPos < 0 || xPos >= this.numCols || yPos >= this.numRows);
	},
	
	getMoves(xPos, yPos){ //takes the raw moves and removes self-capture
		let piece = this.getPiece(xPos, yPos); //get the piece
		
		if (piece == null) { //make sure it's not null
			return [];
		}
		
		let moves = this.getMovesRaw(xPos, yPos); //get the moves
		
		let cookedMoves = []; //yes i know "cooked" is a chess term with nothing relevant
		
		for (let move of moves) { //for every move...
			let targetPiece = this.getPiece(move.x, move.y); //check what it will capture
			
			if (targetPiece == null || targetPiece[1] != piece[1]) { //the move is legal if either no piece is captured or if the target is of different color. in other words, it's only illegal if it captures same color
				cookedMoves.push(move);
			}
		}
		
		return cookedMoves;
	},
	
	getMovesRaw(xPos, yPos){ //"raw" moves. this includes self-capture. used to figure out piece pressuring.
		let piece = this.getPiece(xPos, yPos);
		
		if (piece == null) {
			return [];
		}
		
		let moves = pieceClasses[piece[0]].getMoves(piece[1], xPos, yPos); //take the piece and get its class to see what its moves are
		
		return moves;
	},
	
	makeMove(xOrig, yOrig, xDest, yDest) { //time to actually make the move...
		if (!this.validPos(xOrig, yOrig)) {
			return;
		}
		if (!this.validPos(xDest, yDest)) { //ok obviously we should just... throw out moves that involve OoB locations
			return;
		}
		
		let nextBoardEntry = JSON.parse(JSON.stringify(this.boardHistory[this.boardHistory.length - 1])); //clone the previous board+meta-data
		let nextBoard = nextBoardEntry[0]; //shortcut to the board part of the board entry
		
		nextBoardEntry[1][1][0] = Array(8).fill(false);
		nextBoardEntry[1][1][1] = Array(8).fill(false); //clear out the en-passantabilities
		
		let piece = nextBoard[xOrig][yOrig]; //take the starting piece
		
		let capPiece = nextBoard[xDest][yDest]; //figure out what's being capped
		if (capPiece != null) {
			this.capture(nextBoardEntry, capPiece); //if we are actually capping something, add it to the metadata
		}
		
		nextBoard[xDest][yDest] = piece; //overwrite the destination with the piece moving
		nextBoard[xOrig][yOrig] = null; //and clear out the piece origin
		
		let promoting = false; //are we a promoting pawn?
		
		if (piece[0] == "Pawn") { //special pawn stuff: double-moves+en-passant and promotion.
			switch(yDest - yOrig) {
				case 2: //only way a pawn can move 2 down is by black en passant
					nextBoardEntry[1][1][0][xOrig] = true; //nextBoardEntry -> board metadata -> en passant -> black -> x pos
					break;
				case -2: //see ^
					nextBoardEntry[1][1][1][xOrig] = true; //nextBoardEntry -> board metadata -> en passant -> white -> x pos
					break;
			}
			
			if (Math.abs(xDest-xOrig) == 1) { //only way pawn can move sideways is by en passant or standard cap
				console.log(this.lastBoard[xDest][yDest])
				if (this.lastBoard[xDest][yDest] == null) {//if if's not capping the piece it's moving onto.. en passant
					let capPiece = nextBoard[xDest][yOrig] //the pawn being passant'd is in the original pawn's y
					if (capPiece != null) { //in case the pawn... doesn't exist?
						this.capture(nextBoardEntry, capPiece);
					}
					
					nextBoard[xDest][yOrig] = null;
				}
			}
			
			if (yDest == 0 || yDest == this.numRows-1) { //if we're at the top or bottom
				promoting = true; //we're going to be promoting
			}
		}
		else if (piece[0] == "King") { //if a king is moving
			nextBoardEntry[1][0][piece[1]=="Black" ? 0 : 1] = [false, false]; //get the castle table and clear it.
			
			if (Math.abs(xDest - xOrig) > 1) { //if we're moving more than two horizontally (only possible when castling)
				if ((xDest - xOrig) > 0) { //castle kingside; move the piece furthest kingside to 1 left of king
					nextBoard[xDest-1][yDest] = nextBoard[this.numCols-1][yDest];
					nextBoard[this.numCols-1][yOrig] = null;
				} else { //^ but queenside
					nextBoard[xDest+1][yDest] = nextBoard[0][yDest];
					nextBoard[0][yOrig] = null;
				}
			}
		}
		
		if (((xOrig == 0)||(xOrig == (this.numCols-1)))&&((yOrig == 0)||(yOrig == (this.numCols-1)))) { //if we're in a corner and moving
			let castleMetaTable = nextBoardEntry[1][0][(yOrig == 0) ? 0 : 1]; //if we're at 0, take the black castle table. otherwise, white castle table.
			castleMetaTable[(xOrig == 0) ? 0 : 1] = false; //if we're at 0, falsify queenside castle. otherwise, falsify kingside castle.
		}
		if (((xDest == 0)||(xDest == (this.numCols-1)))&&((yDest == 0)||(yDest == (this.numCols-1)))) { //do the same check but for if the corners were moved into
			let castleMetaTable = nextBoardEntry[1][0][(yDest == 0) ? 0 : 1]; //if we're at 0, take the black castle table. otherwise, white castle table.
			castleMetaTable[(xDest == 0) ? 0 : 1] = false; //if we're at 0, falsify queenside castle. otherwise, falsify kingside castle.
		}
		
		this.boardHistory.push(nextBoardEntry); //add the new move into board history
		this.lastBoard = this.boardHistory[this.boardHistory.length - 1][0]; //update lastboard
		
		if (this.checkInCheck()) { //if we end in check,
			this.boardHistory.pop(); //undo this move.
			this.lastBoard = this.boardHistory[this.boardHistory.length - 1][0]; //update lastboard
			return false; //return that this was a failure
		}
		
		if (promoting) { //if we're promoting we can't switch turn yet. we need to hand this back off now, for promotion.
			return 2; //return that we're promoting
		}
		
		this.boardHistory[this.boardHistory.length - 1][2] = (nextBoardEntry[2] == "Black" ? "White" : "Black") //switch player color
		this.boardHistory[this.boardHistory.length - 1][3] = this.checkInCheck() //set if the new player is in check
		
		return true; //move over.
	},
	
	checkInCheck() { //check if we're in check
		let color = this.boardHistory[this.boardHistory.length - 1][2]; //use the board metadata to get color to check
		let check = false;
		
		for (let xPos=0; xPos<this.numCols; xPos++) {
			for (let yPos=0; yPos<this.numRows; yPos++) { //go through every space
				let piece = this.getPiece(xPos, yPos) //get the piece there
				
				if (piece == null || piece[1] == color) { //if the piece doesn't exist or is friendly, continue.
					continue;
				}
				
				let moves = this.getMoves(xPos, yPos); //take the move list
				
				for (let move of moves) { //see each move in it
					let tarPiece = this.getPiece(move.x, move.y); //check what piece it's targeting
					
					if (tarPiece != null && tarPiece[0] == "King" && tarPiece[1] == color) { //if it's targeting our king, we're in check!
						check = true;
						break; //end early
					}
				}
				
				if (check) {
					break; //end early
				}
			}
			if (check) {
				break; //end early
			}
		}
		
		return check; //return
	},
	
	checkMated() { //see if we're mated
		if (!this.getInCheck()) {return false}; //if we're not in check we can't be mated. TODO: remove this to add stalemate detection
		
		let spacesToCheckAttack = []; //holds what spaces can be escaped to
		let attackingPiecePos = null; //holds the position of the piece threatening the king
		let defendingSpaces = []; //holds the spaces we can move pieces to
		
		let color = this.boardHistory[this.boardHistory.length-1][2]; //take our color
		
		let check = false; //are we mated?
		
		let kingPos = this.findKing(color); //...find our king.
		
		for (let xPos=kingPos.x-1; xPos<=kingPos.x+1; xPos++) {
			for (let yPos=kingPos.y-1; yPos<=kingPos.y+1; yPos++) { //go to every spot in a 3x3 square centered on the king
				if (this.validPos(xPos, yPos)) { //if it's a real spot
					let piece = this.getPiece(xPos, yPos); //check if there's a piece on it
					
					if (piece == null || piece[1] != color) { //if it's empty or enemy, we can escape there.
						spacesToCheckAttack.push({x: xPos, y: yPos});
					}
				}
			}
		}
		
		let king = this.getPiece(kingPos.x, kingPos.y); //we need to remove the king temporarily
		this.lastBoard[kingPos.x][kingPos.y] = null; //prevent the king from blocking unavailable space checks; otherwise a king would think it can just.. run straight away from an attacker.
		
		for (let xPos=0; xPos<this.numCols; xPos++) {
			for (let yPos=0; yPos<this.numRows; yPos++) {
				let piece = this.getPiece(xPos, yPos) //get every piece
				
				if (piece == null || piece[1] == color) { //ignore it if there's nothing here or a friendly.
					continue;
				}
				
				let moves = this.getMovesRaw(xPos, yPos); //get the pressured spaces. this way if there's two enemy rooks adjacent to the king, the king will recognize that both rooks pressure each other.
				
				for (let move of moves) { //get all the moves
					for (let spIndex = 0; spIndex<spacesToCheckAttack.length; spIndex++) { //get the remaining spaces the king can escape to
						if (move.x == spacesToCheckAttack[spIndex].x && move.y == spacesToCheckAttack[spIndex].y) { //if a move is blocking an escape space,
							spacesToCheckAttack.splice(spIndex, 1); //invalidate that escape space
							break; //might as well break from the space escape check; not like a enemy move can stop two spaces at once.
						}
					}
				}
			}
		}
		
		this.lastBoard[kingPos.x][kingPos.y] = king; //ok we can put the king back now
		
		if (spacesToCheckAttack.length > 0) {
			return false; //there is at least one space we can escape to. we're not in check
		}
		
		for (let xPos=0; xPos<this.numCols; xPos++) { //check how many pieces are attacking; if 2 or more are, that's mate. otherwise, get the spaces we could block. note: this doesn't work on certain fairy pieces, such as the woody rook. maybe i could add metadata later to see if the move is a slide or a jump.
			for (let yPos=0; yPos<this.numRows; yPos++) {
				let piece = this.getPiece(xPos, yPos) //get the pieces
				
				if (piece == null) { //if there's not a piece, skip
					continue;
				}
				
				if (piece[1] == color) { //if the piece is friendly, check what moves it can stop!
					if (piece[0] != "King") { //..assuming it's not the king. we already checked everything the king could do by himself.
						let moves = this.getMoves(xPos, yPos); //get the moves
						for (let move of moves) { //for each move in the move list
							defendingSpaces.push(move); //add it to the defended spaces.
						}
					}
					continue
				}
				
				let moves = this.getMoves(xPos, yPos); //get the attacker's moves
				
				for (let move of moves) {
					if (move.x == kingPos.x && move.y == kingPos.y) { //if this can cap the king
						if (attackingPiecePos == null || (attackingPiecePos.x == xPos && attackingPiecePos.y == yPos)) {//check that we have either no attacker pieces registered, or already reged this one.
							attackingPiecePos = {x: xPos, y: yPos}; //register this piece as the attacker
							break;
						}
						else
						{
							return true; //there's 2 or more attacking pieces. we're mated. this logic doesn't work if there's any fairy pieces that can capture through a blocker. thankfully, i don't think there's any that can do that. (for now..)
						}
					}
				}
			}
		}
		
		if (attackingPiecePos == null) {
			//console.log("we're in check, but no piece is checking us?!");
			return false; //this shouldn't happen
		}
		
		let attackingPieceMoves = this.getMoves(attackingPiecePos.x, attackingPiecePos.y); //get the attacker's moves
		
		for (let defSpace of defendingSpaces) {
			if (defSpace.x == attackingPiecePos.x && defSpace.y == attackingPiecePos.y) {
				return false; //we can capture the attacking piece
			}
		}
		
		for (let move of attackingPieceMoves) {
			let dx = move.x - attackingPiecePos.x;
			let dy = move.y - attackingPiecePos.y;
			
			let xDiff = kingPos.x - attackingPiecePos.x;
			let yDiff = kingPos.y - attackingPiecePos.y;
			
			if (xDiff % dx == 0 && yDiff % dy == 0 && dx*xDiff >= 0 && dy*yDiff >= 0) { //check if xDiff is a multiple of dx (so the move is part of a slide into the king) and that xDiff and dx have the same sign (the move is going TO not AWAY the king)		
				for (let defSpace of defendingSpaces) {
					if (defSpace.x == move.x && defSpace.y == move.y) {
						return false; //we can move a piece into the way. TODO: add a way to indicate if a move is a slide or a jump. this algorithm would incorrectly identify the woody rook as a slider, not a jumper.
					}
				}
			}
		}
		
		return true; //we can't move the king out, we can't capture the attacking piece, we can't move a piece in the way. we're mated.
	},
	
	getCastleTable() { //...gets the castle table.
		return this.boardHistory[this.boardHistory.length-1][1][0];
	},
	
	checkEnPassant(color, xPos) { //say a color and position, returns if that pawn is en-passantable
		if (xPos < 0 || xPos >= this.numCols) {
			return false
		}
		
		let colorIndex = (color == "Black" ? 0 : 1);
		
		return this.boardHistory[this.boardHistory.length-1][1][1][colorIndex][xPos]; //holy hell
	},
	
	getInCheck() { //see if this position is in check.
		return this.boardHistory[this.boardHistory.length-1][3];
	},
	
	findKing(color) { //find the king of the specified color.
		let kingPos = null;
		for (let xPos=0; xPos<this.numCols; xPos++) {
			for (let yPos=0; yPos<this.numRows; yPos++) { //loop through every spot
				let piece = this.getPiece(xPos, yPos)
				
				if (piece == null) {
					continue;
				}
				
				if (piece[0] == "King" && piece[1] == color) { //have we found our king?
					kingPos = {x: xPos, y: yPos}; //yes!
					break;
				}
			}
			if (kingPos != null) {
				break;
			}
		}
		
		return kingPos;
	},
	
	promote(piece) { //promote a pawn to the chosen piece.
		if (piece == null) { //this shouldn't happen
			//console.log("We're promoting to a null piece?");
			return;
		}
		
		let newType = piece[0]; //get what we're promoting to.
		let promotingPiece = null; //the pawn that's being promoted
		
		for (let xPos=0; xPos<this.numCols; xPos++) {
			for (let yPos=0; yPos<this.numRows; yPos+=this.numRows-1) { //go through the first and last rows
				let testPiece = this.getPiece(xPos, yPos);
				
				if (testPiece != null && testPiece[0] == "Pawn") { //is it a pawn?
					promotingPiece = testPiece; //we found our promoter!
					break;
				}
			}
			
			if (promotingPiece != null) {break;}
		}
		
		promotingPiece[0] = newType; //change the promoted piece type
		
		this.boardHistory[this.boardHistory.length - 1][2] = (this.boardHistory[this.boardHistory.length - 1][2] == "Black" ? "White" : "Black") //switch player color
		this.boardHistory[this.boardHistory.length - 1][3] = this.checkInCheck() //set if the new player is in check
		
		return true;
	},
	
	capture(nextBoard, piece) { //add to the captured piece list. this is called mid-move so we need the board state to modify.
		if (piece == null) {return;}
		
		switch(piece[1]) {
			case "Black":
				nextBoard[4][0].push(piece);
				break;
			case "White":
				nextBoard[4][1].push(piece);
				break;
		}
	},
	
	getCapturedPieces() { //get the captured piece list
		return this.boardHistory[this.boardHistory.length - 1][4];
	},
	
	undo() { //remove the latest move and update lastboard
		TheBoard.boardHistory.pop();
		this.lastBoard = this.boardHistory[this.boardHistory.length - 1][0];
	}
}