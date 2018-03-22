// Aurora is distributed under the MIT license.

export default {
	distance( p1, p2 ) {
		const dX = p2.x - p1.x;
		const dY = p2.y - p1.y;
		return Math.sqrt( Math.pow( dX, 2 ) + Math.pow( dY, 2 ) );
	},
	heading( p1, p2, deg = false ) {
		const dX = p2.x - p1.x;
		const dY = p2.y - p1.y;
		const radians = Math.atan2( dY, dX );
		if ( deg ) {
			return radians * ( 180 / Math.PI );
		}
		return radians;
	}
};
