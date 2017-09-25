/**
 * Break faces with edges longer than maxEdgeLength
 * - not recursive
 *
 * @author alteredq / http://alteredqualia.com/
 */

THREE.TessellateModifier = function ( maxEdgeLength ) {

	this.maxEdgeLength = maxEdgeLength;

};
//将geometry中大的面拆分为小的面 更新geometry的数据信息
THREE.TessellateModifier.prototype.modify = function ( geometry ) {

	var edge;

	var faces = [];//保存geometry 拆分后的面的数据
	var faceVertexUvs = [];//保存geometry 拆分后的面的uv数据
	var maxEdgeLengthSquared = this.maxEdgeLength * this.maxEdgeLength;

	for ( var i = 0, il = geometry.faceVertexUvs.length; i < il; i ++ ) {

		faceVertexUvs[ i ] = [];

	}

	for ( var i = 0, il = geometry.faces.length; i < il; i ++ ) {

		var face = geometry.faces[ i ];

		if ( face instanceof THREE.Face3 ) {

			var a = face.a;
			var b = face.b;
			var c = face.c;

			var va = geometry.vertices[ a ];
			var vb = geometry.vertices[ b ];
			var vc = geometry.vertices[ c ];

			var dab = va.distanceToSquared( vb );//计算ab的长度的平方
			var dbc = vb.distanceToSquared( vc );//计算bc的长度的平方
			var dac = va.distanceToSquared( vc );//计算ac的长度的平方

			if ( dab > maxEdgeLengthSquared || dbc > maxEdgeLengthSquared || dac > maxEdgeLengthSquared ) {//判断三角形是否有一边的长度的平方大于maxEdgeLengthSquared

				var m = geometry.vertices.length;

				var triA = face.clone();
				var triB = face.clone();

				if ( dab >= dbc && dab >= dac ) {//ab边最长 拆分ab边 取ab的中点  将一个三角形分成两个三角形

					var vm = va.clone();
					vm.lerp( vb, 0.5 );//计算ab点的中点坐标
                    //赋值triA 面的索引值
					triA.a = a;
					triA.b = m;
					triA.c = c;
                    //赋值triB 面的索引值
					triB.a = m;
					triB.b = b;
					triB.c = c;

					if ( face.vertexNormals.length === 3 ) {//计算拆分后的三角形的顶点法线

						var vnm = face.vertexNormals[ 0 ].clone();
						vnm.lerp( face.vertexNormals[ 1 ], 0.5 );

						triA.vertexNormals[ 1 ].copy( vnm );
						triB.vertexNormals[ 0 ].copy( vnm );

					}

					if ( face.vertexColors.length === 3 ) {//计算拆分后的三角形的顶点颜色

						var vcm = face.vertexColors[ 0 ].clone();
						vcm.lerp( face.vertexColors[ 1 ], 0.5 );

						triA.vertexColors[ 1 ].copy( vcm );
						triB.vertexColors[ 0 ].copy( vcm );

					}

					edge = 0;

				} else if ( dbc >= dab && dbc >= dac ) {{//bc边最长 拆分bc边 取bc的中点  将一个三角形分成两个三角形

					var vm = vb.clone();
					vm.lerp( vc, 0.5 );//计算bc点的中点坐标

					triA.a = a;
					triA.b = b;
					triA.c = m;

					triB.a = m;
					triB.b = c;
					triB.c = a;

					if ( face.vertexNormals.length === 3 ) {

						var vnm = face.vertexNormals[ 1 ].clone();
						vnm.lerp( face.vertexNormals[ 2 ], 0.5 );

						triA.vertexNormals[ 2 ].copy( vnm );

						triB.vertexNormals[ 0 ].copy( vnm );
						triB.vertexNormals[ 1 ].copy( face.vertexNormals[ 2 ] );
						triB.vertexNormals[ 2 ].copy( face.vertexNormals[ 0 ] );

					}

					if ( face.vertexColors.length === 3 ) {

						var vcm = face.vertexColors[ 1 ].clone();
						vcm.lerp( face.vertexColors[ 2 ], 0.5 );

						triA.vertexColors[ 2 ].copy( vcm );

						triB.vertexColors[ 0 ].copy( vcm );
						triB.vertexColors[ 1 ].copy( face.vertexColors[ 2 ] );
						triB.vertexColors[ 2 ].copy( face.vertexColors[ 0 ] );

					}

					edge = 1;

				} else {{//ac边最长 拆分ac边 取ac的中点  将一个三角形分成两个三角形

					var vm = va.clone();
					vm.lerp( vc, 0.5 );//计算ac点的中点坐标

					triA.a = a;
					triA.b = b;
					triA.c = m;

					triB.a = m;
					triB.b = b;
					triB.c = c;

					if ( face.vertexNormals.length === 3 ) {

						var vnm = face.vertexNormals[ 0 ].clone();
						vnm.lerp( face.vertexNormals[ 2 ], 0.5 );

						triA.vertexNormals[ 2 ].copy( vnm );
						triB.vertexNormals[ 0 ].copy( vnm );

					}

					if ( face.vertexColors.length === 3 ) {

						var vcm = face.vertexColors[ 0 ].clone();
						vcm.lerp( face.vertexColors[ 2 ], 0.5 );

						triA.vertexColors[ 2 ].copy( vcm );
						triB.vertexColors[ 0 ].copy( vcm );

					}

					edge = 2;

				}

				faces.push( triA, triB );//插入拆分的三角形面的数据
				geometry.vertices.push( vm );//插入新增的点的数据
             
				for ( var j = 0, jl = geometry.faceVertexUvs.length; j < jl; j ++ ) {//计算拆分后的面的uv坐标

					if ( geometry.faceVertexUvs[ j ].length ) {

						var uvs = geometry.faceVertexUvs[ j ][ i ];

						var uvA = uvs[ 0 ];
						var uvB = uvs[ 1 ];
						var uvC = uvs[ 2 ];

						// AB

						if ( edge === 0 ) {

							var uvM = uvA.clone();
							uvM.lerp( uvB, 0.5 );

							var uvsTriA = [ uvA.clone(), uvM.clone(), uvC.clone() ];
							var uvsTriB = [ uvM.clone(), uvB.clone(), uvC.clone() ];

						// BC

						} else if ( edge === 1 ) {

							var uvM = uvB.clone();
							uvM.lerp( uvC, 0.5 );

							var uvsTriA = [ uvA.clone(), uvB.clone(), uvM.clone() ];
							var uvsTriB = [ uvM.clone(), uvC.clone(), uvA.clone() ];

						// AC

						} else {

							var uvM = uvA.clone();
							uvM.lerp( uvC, 0.5 );

							var uvsTriA = [ uvA.clone(), uvB.clone(), uvM.clone() ];
							var uvsTriB = [ uvM.clone(), uvB.clone(), uvC.clone() ];

						}

						faceVertexUvs[ j ].push( uvsTriA, uvsTriB );

					}

				}

			} else {//保存边长没有超过maxEdgeLength的面的信息

				faces.push( face );

				for ( var j = 0, jl = geometry.faceVertexUvs.length; j < jl; j ++ ) {

					faceVertexUvs[ j ].push( geometry.faceVertexUvs[ j ][ i ] );

				}

			}

		}

	}

	geometry.faces = faces;//更新面的信息
	geometry.faceVertexUvs = faceVertexUvs;//更新面的uv信息

};
