"use strict";

class Knight extends Piece {
	static getMoves(color, xPos, yPos) {
		let validMoves = [];
		
		let poses = [{dx: 2, dy: 1}, {dx: 1, dy: 2}, {dx: -1, dy: 2}, {dx: -2, dy: 1}, {dx: -2, dy: -1}, {dx: -1, dy: -2}, {dx: 1, dy: -2}, {dx: 2, dy: -1}]; //see king.js
		
		for (let pose of poses){
			if (!TheBoard.validPos(xPos + pose.dx, yPos + pose.dy)) { //skip if the pose isn't valid
				continue;
			}
			let forwardPiece = TheBoard.getPiece(xPos + pose.dx, yPos + pose.dy);
			
			validMoves.push({x: xPos + pose.dx, y: yPos + pose.dy}); //it's valid
		}
		
		return validMoves;
	}
/*	constructor(color) {
		super(color);
		this.name = "knight";
		this.castleable = true;
	}
	
	isTangible(otherPiece) {
		return true;
	}
	
	getMoves(board, xPos, yPos) {
		let validMoves = [];
		
		let poses = [{dx: 2, dy: 1}, {dx: 1, dy: 2}, {dx: -1, dy: 2}, {dx: -2, dy: 1}, {dx: -2, dy: -1}, {dx: -1, dy: -2}, {dx: 1, dy: -2}, {dx: 2, dy: -1}];
		
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