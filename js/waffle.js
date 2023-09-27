"use strict";

class Waffle extends Piece {
	static getMoves(color, xPos, yPos) {
		let validMoves = [];
		
		let poses = [{dx: 1, dy: 0}, {dx: 2, dy: 2}, {dx: 0, dy: 1}, {dx: -2, dy: 2}, {dx: -1, dy: 0}, {dx: -2, dy: -2}, {dx: 0, dy: -1}, {dx: 2, dy: -2}];
		
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