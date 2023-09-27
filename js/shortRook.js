"use strict";

class ShortRook extends Piece {
	static getMoves(color, xPos, yPos) {
		let validMoves = [];
		
		let directions = [{dx: 1, dy: 0}, {dx: 0, dy: 1}, {dx: -1, dy: 0}, {dx: 0, dy: -1}];
		
		for (let direction of directions){
			let maxDist = 4;
			let testXPos = xPos + direction.dx;
			let testYPos = yPos + direction.dy;
			let dist = 1;
			
			while (TheBoard.validPos(testXPos, testYPos) && dist <= maxDist) {
				let forwardPiece = TheBoard.getPiece(testXPos, testYPos);
				
				if (forwardPiece == null) { //if there's no piece this step
					validMoves.push({x: testXPos, y: testYPos});
					
					testXPos += direction.dx;
					testYPos += direction.dy;
					dist += 1;
					continue; //continue marching
				}
				validMoves.push({x: testXPos, y: testYPos});
				break; //stop marching at capture
			}
		}
		
		return validMoves;
	}
}