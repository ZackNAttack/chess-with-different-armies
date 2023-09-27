"use strict";

class King extends Piece {
	static getMoves(color, xPos, yPos) {
		let validMoves = [];
		
		let poses = [{dx: 1, dy: 0}, {dx: 1, dy: 1}, {dx: 0, dy: 1}, {dx: -1, dy: 1}, {dx: -1, dy: 0}, {dx: -1, dy: -1}, {dx: 0, dy: -1}, {dx: 1, dy: -1}];
		
		for (let pose of poses){
			if (!TheBoard.validPos(xPos + pose.dx, yPos + pose.dy)) { //skip if the pose isn't valid
				continue;
			}
			let forwardPiece = TheBoard.getPiece(xPos + pose.dx, yPos + pose.dy);
			
			validMoves.push({x: xPos + pose.dx, y: yPos + pose.dy}); //it's valid
		}
		
		if (!TheBoard.getInCheck()) { //we can't castle to get out of check
			for (let side = 0; side <= 1; side++) { //check both sides
				let testDir = side*2 - 1; //go left if queenside, right if kingside
				if (TheBoard.getCastleTable()[color == "Black" ? 0 : 1][side]) { //check if we *can* castle this way
					let testXPos = xPos + testDir; //marching time
					let able = false;
					
					while ((testXPos > 0) && (testXPos < TheBoard.numCols - 1)) {
						let forwardPiece = TheBoard.getPiece(testXPos, yPos);
						
						if (forwardPiece != null) { //if there's a piece between king and rook
							able = false; //we can't castle
							break;
						}
						
						able = true; //able is only set true here so that the king must not already be right next to or at the edge
						testXPos += testDir;
					}
					
					if (able) { //true if there's no pieces between the king and the corner piece
						let dx = testDir*2; //the king moves by double test direction
						let castlePiece = TheBoard.getPiece(side*(TheBoard.numCols-1), yPos); //get the piece type we're castling with
						
						if (castlePiece && castlePiece[0] == "Bede" && dx == -2) {
							dx = -3; //if we're queenside castling with a bede, the king moves an extra space so the bede stays on the same color space
						}
						
						validMoves.push({x: xPos + dx, y: yPos}); //add it to the valid move list
					}
				}
			}
		}
		
		return validMoves;
	}
/*	constructor(color) {
		super(color);
		this.name = "king";
		this.castleable = true;
	}
	
	isTangible(otherPiece) {
		return true;
	}
	
	getMoves(board, xPos, yPos) {
		let validMoves = [];
		
		let poses = [{dx: 1, dy: 0}, {dx: 1, dy: 1}, {dx: 0, dy: 1}, {dx: -1, dy: 1}, {dx: -1, dy: 0}, {dx: -1, dy: -1}, {dx: 0, dy: -1}, {dx: 1, dy: -1}];
		
		for (let pose of poses){
			if (!board.validPos(xPos + pose.dx, yPos + pose.dy)) {
				continue;
			}
			let forwardPiece = board.getPiece(this, xPos + pose.dx, yPos + pose.dy);
			
			if (forwardPiece == null || forwardPiece.color != this.color) {
				validMoves.push({xPos: xPos + pose.dx, yPos: yPos + pose.dy});
			}
		}
		
		return validMoves;
	}*/
}