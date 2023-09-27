"use strict";

class Bishop extends Piece {
	static getMoves(color, xPos, yPos) {
		let validMoves = [];
		
		let directions = [{dx: 1, dy: 1}, {dx: -1, dy: 1}, {dx: -1, dy: -1}, {dx: 1, dy: -1}]; //our move directions
		
		for (let direction of directions){ //for each direction
			let testXPos = xPos + direction.dx; //start marching
			let testYPos = yPos + direction.dy;
			
			while (TheBoard.validPos(testXPos, testYPos)) { //stop marching if the space is invalid
				let forwardPiece = TheBoard.getPiece(testXPos, testYPos);
				
				if (forwardPiece == null) { //if there's no piece this step
					validMoves.push({x: testXPos, y: testYPos}); //add it to the move list
					
					testXPos += direction.dx;
					testYPos += direction.dy;
					continue; //continue marching
				}
				validMoves.push({x: testXPos, y: testYPos}); //add it to the move list
				break; //stop marching at capture
			}
		}
		
		return validMoves;
	}
/*	constructor(color) {
		super(color);
		this.name = "bishop";
		this.castleable = true;
	}
	
	isTangible(otherPiece) {
		return true;
	}
	
	getMoves(board, xPos, yPos) {
		let validMoves = [];
		
		let directions = [{dx: 1, dy: 1}, {dx: -1, dy: 1}, {dx: -1, dy: -1}, {dx: 1, dy: -1}];
		
		for (let direction of directions){
			let testXPos = xPos + direction.dx;
			let testYPos = yPos + direction.dy;
			
			while (board.validPos(testXPos, testYPos)) {
				let forwardPiece = board.getPiece(this, testXPos, testYPos);
				
				if (forwardPiece == null) {
					validMoves.push({xPos: testXPos, yPos: testYPos});
					
					testXPos += direction.dx;
					testYPos += direction.dy;
					continue;
				}
				if (forwardPiece.color == this.color) {
					break;
				}
				validMoves.push({xPos: testXPos, yPos: testYPos});
				break;
			}
		}
		
		return validMoves;
	}*/
}