"use strict";

class Bede extends Piece {
	static getMoves(color, xPos, yPos) {
		let validMoves = [];
		
		let directions = [{dx: 1, dy: 1}, {dx: -1, dy: 1}, {dx: -1, dy: -1}, {dx: 1, dy: -1}];
		
		for (let direction of directions){
			let testXPos = xPos + direction.dx;
			let testYPos = yPos + direction.dy;
			
			while (TheBoard.validPos(testXPos, testYPos)) {
				let forwardPiece = TheBoard.getPiece(testXPos, testYPos);
				
				if (forwardPiece == null) { //if there's no piece this step
					validMoves.push({x: testXPos, y: testYPos});
					
					testXPos += direction.dx;
					testYPos += direction.dy;
					continue; //continue marching
				}
				validMoves.push({x: testXPos, y: testYPos});
				break; //stop marching at capture
			}
		}
		
		let poses = [{dx: 2, dy: 0}, {dx: 0, dy: 2}, {dx: -2, dy: 0}, {dx: 0, dy: -2}];
		
		for (let pose of poses){
			if (!TheBoard.validPos(xPos + pose.dx, yPos + pose.dy)) { //skip if the pose isn't valid
				continue;
			}
			let forwardPiece = TheBoard.getPiece(xPos + pose.dx, yPos + pose.dy);
			
			validMoves.push({x: xPos + pose.dx, y: yPos + pose.dy}); //it's valid
		}
		
		return validMoves;
	}
}