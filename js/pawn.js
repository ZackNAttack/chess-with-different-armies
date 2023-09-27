"use strict";

class Pawn extends Piece { //TODO: allow the mate checker to properly process move-only moves and cap-only moves.
	static getMoves(color, xPos, yPos) {
		let validMoves = [];
		
		let movPoses = [];
		let capPoses = [];
		
		switch (color) {
			case "Black":
				movPoses.push({dx: 0, dy: 1}); //we can move down
				capPoses.push({dx: -1, dy: 1}); //and capture down sideways
				capPoses.push({dx: 1, dy: 1});
				
				if (yPos == 1 && (TheBoard.getPiece(xPos, yPos+1) == null)) { //if we've not moved yet and there's nothing in the way
					movPoses.push({dx: 0, dy: 2}); //we can move two
				}
				if (yPos == TheBoard.numRows-4) {
					for (let xCheck = -1;xCheck<=1;xCheck+=2) {
						if (TheBoard.checkEnPassant("White", xPos+xCheck)) { //see if we can en passant white
							movPoses.push({dx: xCheck, dy: 1, cap: true}) //mark that we're capping indirectly, for display purposes.
						}
					}
				}
				break;
			case "White":
				movPoses.push({dx: 0, dy: -1});
				capPoses.push({dx: -1, dy: -1});
				capPoses.push({dx: 1, dy: -1});
				
				if (yPos == TheBoard.numRows-2 && (TheBoard.getPiece(xPos, yPos-1) == null)) {
					movPoses.push({dx: 0, dy: -2});
				}
				if (yPos == 3) {
					for (let xCheck = -1;xCheck<=1;xCheck+=2) {
						if (TheBoard.checkEnPassant("Black", xPos+xCheck)) { //see if we can en passant black
							movPoses.push({dx: xCheck, dy: -1, cap: true})
						}
					}
				}
				break;
		}
		
		for (let pose of movPoses){
			if (!TheBoard.validPos(xPos + pose.dx, yPos + pose.dy)) { //skip if the pose isn't valid
				continue;
			}
			let forwardPiece = TheBoard.getPiece(xPos + pose.dx, yPos + pose.dy);
			
			if (forwardPiece == null) { //if there's no piece
				validMoves.push({x: xPos + pose.dx, y: yPos + pose.dy, cap: pose.cap}); //if the pose is a cap pose (en passant), cap
			}
		}
		
		for (let pose of capPoses){
			if (!TheBoard.validPos(xPos + pose.dx, yPos + pose.dy)) { //skip if the pose isn't valid
				continue;
			}
			let forwardPiece = TheBoard.getPiece(xPos + pose.dx, yPos + pose.dy);
			
			if (forwardPiece != null) { //if there's a piece
				validMoves.push({x: xPos + pose.dx, y: yPos + pose.dy}); //it's valid
			}
		}
		
		
		
		return validMoves;
	}
/*	constructor(color) {
		super(color);
		this.name = "pawn";
		this.promotable = true;
	}
	
	isTangible(otherPiece) {
		return true;
	}
	
	getMoves(board, xPos, yPos) {
		let validMoves = [];
		
		let forwardPiece = board.getPiece(this, xPos, yPos+1);
		if (forwardPiece == null) {
			validMoves.push({xPos: xPos, yPos: yPos+1});
		}
		
		let forwardLeftPiece = board.getPiece(this, xPos-1, yPos+1);
		if (forwardLeftPiece != null && forwardLeftPiece.color != this.color) {
			validMoves.push({xPos: xPos-1, yPos: yPos+1});
		}
		
		let forwardRightPiece = board.getPiece(this, xPos+1, yPos+1);
		if (forwardRightPiece != null && forwardRightPiece.color != this.color) {
			validMoves.push({xPos: xPos+1, yPos: yPos+1});
		}
		
		return validMoves;
	}*/
}