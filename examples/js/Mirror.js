/**
 * @author Slayvin / http://slayvin.net
 */

THREE.Mirror = function ( width, height, options ) {

	THREE.Mesh.call( this, new THREE.PlaneBufferGeometry( width, height ) );

	var scope = this;

	scope.name = 'mirror_' + scope.id;
	scope.matrixNeedsUpdate = true;

	options = options || {};

	var viewport = new THREE.Vector4();

	var textureWidth = options.textureWidth !== undefined ? options.textureWidth : 512;
	var textureHeight = options.textureHeight !== undefined ? options.textureHeight : 512;

	var clipBias = options.clipBias !== undefined ? options.clipBias : 0.0;
	var mirrorColor = options.color !== undefined ? new THREE.Color( options.color ) : new THREE.Color( 0x7F7F7F );

	var mirrorPlane = new THREE.Plane();
	var normal = new THREE.Vector3();
	var mirrorWorldPosition = new THREE.Vector3();
	var cameraWorldPosition = new THREE.Vector3();
	var rotationMatrix = new THREE.Matrix4();
	var lookAtPosition = new THREE.Vector3( 0, 0, - 1 );
	var clipPlane = new THREE.Vector4();

	var view = new THREE.Vector3();
	var target = new THREE.Vector3();
	var q = new THREE.Vector4();

	var textureMatrix = new THREE.Matrix4();
    //我们日常生活中的镜子反射出的是透视关系
	var mirrorCamera = new THREE.PerspectiveCamera();

	var parameters = {
		minFilter: THREE.LinearFilter,
		magFilter: THREE.LinearFilter,
		format: THREE.RGBFormat,
		stencilBuffer: false
	};
    //WebGLRenderTarget 对应帧缓存对象，就是屏幕显示的一帧在内存的表示
	var renderTarget = new THREE.WebGLRenderTarget( textureWidth, textureHeight, parameters );

	if ( ! THREE.Math.isPowerOfTwo( textureWidth ) || ! THREE.Math.isPowerOfTwo( textureHeight ) ) {

		renderTarget.texture.generateMipmaps = false;

	}

	var mirrorShader = {

		uniforms: {
			mirrorColor: { value: new THREE.Color( 0x7F7F7F ) },
			mirrorSampler: { value: null },
			textureMatrix: { value: new THREE.Matrix4() }
		},

		vertexShader: [
		'varying vec2 vUv;',
			'uniform mat4 textureMatrix;',
			'varying vec4 mirrorCoord;',

			'void main() {',
'vUv = uv;',
			'	vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );',
			//镜子所在位置乘以纹理矩阵得到纹理坐标
			'	vec4 worldPosition = modelMatrix * vec4( position, 1.0 );',
			'	mirrorCoord = textureMatrix * worldPosition;',

			'	gl_Position = projectionMatrix * mvPosition;',

			'}'
		].join( '\n' ),

		fragmentShader: [
		'varying vec2 vUv;',
			'uniform vec3 mirrorColor;',
			'uniform sampler2D mirrorSampler;',
			'varying vec4 mirrorCoord;',

			'float blendOverlay(float base, float blend) {',
			'	return( base < 0.5 ? ( 2.0 * base * blend ) : (1.0 - 2.0 * ( 1.0 - base ) * ( 1.0 - blend ) ) );',
			'}',

			'void main() {',
			'	vec4 color = texture2DProj(mirrorSampler, mirrorCoord);',
			'	color = vec4(blendOverlay(mirrorColor.r, color.r), blendOverlay(mirrorColor.g, color.g), blendOverlay(mirrorColor.b, color.b), 1.0);',
			'	gl_FragColor = color;',
			'}'
		].join( '\n' )

	};

	var mirrorUniforms = THREE.UniformsUtils.clone( mirrorShader.uniforms );

	var material = new THREE.ShaderMaterial( {

		fragmentShader: mirrorShader.fragmentShader,
		vertexShader: mirrorShader.vertexShader,
		uniforms: mirrorUniforms

	} );

	material.uniforms.mirrorSampler.value = renderTarget.texture;
	material.uniforms.mirrorColor.value = mirrorColor;
	material.uniforms.textureMatrix.value = textureMatrix;

	scope.material = material;

	function updateTextureMatrix( camera ) {
        //更新世界矩阵，更新镜子的位置
		scope.updateMatrixWorld();
        //从镜子的世界矩阵中获取镜子的世界坐标
		mirrorWorldPosition.setFromMatrixPosition( scope.matrixWorld );
		//从相机的世界矩阵中获取相机的世界坐标
		cameraWorldPosition.setFromMatrixPosition( camera.matrixWorld );
        //从镜子的世界矩阵中获取镜子的旋转矩阵
		rotationMatrix.extractRotation( scope.matrixWorld );
        //设置镜子的法向量
		normal.set( 0, 0, 1 );
		//通过旋转矩阵更新法向量
		normal.applyMatrix4( rotationMatrix );
        //计算摄像机指向镜子的向量
		view.subVectors( mirrorWorldPosition, cameraWorldPosition );
		//根据normal计算反射向量然后取反
		view.reflect( normal ).negate();
		//计算摄像机关于镜子屏幕对称的点的坐标
		view.add( mirrorWorldPosition );
        //从相机的世界矩阵中获取相机的旋转矩阵
		rotationMatrix.extractRotation( camera.matrixWorld );
        //对相机的视线方向向量也进行旋转，并且加上相机目前的位置，得到相机目标点的位置
		lookAtPosition.set( 0, 0, - 1 );
		lookAtPosition.applyMatrix4( rotationMatrix );
		lookAtPosition.add( cameraWorldPosition );
        //计算摄像机目标点指向镜子的向量
		target.subVectors( mirrorWorldPosition, lookAtPosition );
		//根据normal计算反射向量然后取反
		target.reflect( normal ).negate();
		//计算摄像机目标点关于镜子屏幕对称的点的坐标
		target.add( mirrorWorldPosition );
        //设置mirrorCamera相机
		mirrorCamera.position.copy( view );
		mirrorCamera.up.set( 0, 1, 0 );
		mirrorCamera.up.applyMatrix4( rotationMatrix );
		mirrorCamera.up.reflect( normal );
		mirrorCamera.lookAt( target );

		mirrorCamera.aspect = camera.aspect;
		mirrorCamera.near = camera.near;
		mirrorCamera.far = camera.far;

		mirrorCamera.updateMatrixWorld();
		mirrorCamera.updateProjectionMatrix();

		// Update the texture matrix
		textureMatrix.set(
			0.5, 0.0, 0.0, 0.5,
			0.0, 0.5, 0.0, 0.5,
			0.0, 0.0, 0.5, 0.5,
			0.0, 0.0, 0.0, 1.0
		);
		textureMatrix.multiply( mirrorCamera.projectionMatrix );
		textureMatrix.multiply( mirrorCamera.matrixWorldInverse );

		// Now update projection matrix with new clip plane, implementing code from: http://www.terathon.com/code/oblique.html
		// Paper explaining this technique: http://www.terathon.com/lengyel/Lengyel-Oblique.pdf
		mirrorPlane.setFromNormalAndCoplanarPoint( normal, mirrorWorldPosition );
		mirrorPlane.applyMatrix4( mirrorCamera.matrixWorldInverse );

		clipPlane.set( mirrorPlane.normal.x, mirrorPlane.normal.y, mirrorPlane.normal.z, mirrorPlane.constant );

		var projectionMatrix = mirrorCamera.projectionMatrix;

		q.x = ( Math.sign( clipPlane.x ) + projectionMatrix.elements[ 8 ] ) / projectionMatrix.elements[ 0 ];
		q.y = ( Math.sign( clipPlane.y ) + projectionMatrix.elements[ 9 ] ) / projectionMatrix.elements[ 5 ];
		q.z = - 1.0;
		q.w = ( 1.0 + projectionMatrix.elements[ 10 ] ) / projectionMatrix.elements[ 14 ];

		// Calculate the scaled plane vector
		clipPlane.multiplyScalar( 2.0 / clipPlane.dot( q ) );

		// Replacing the third row of the projection matrix
		projectionMatrix.elements[ 2 ] = clipPlane.x;
		projectionMatrix.elements[ 6 ] = clipPlane.y;
		projectionMatrix.elements[ 10 ] = clipPlane.z + 1.0 - clipBias;
		projectionMatrix.elements[ 14 ] = clipPlane.w;

	}

	scope.onBeforeRender = function ( renderer, scene, camera ) {

		updateTextureMatrix( camera );

		scope.visible = false;

		var currentRenderTarget = renderer.getRenderTarget();

		var currentVrEnabled = renderer.vr.enabled;
		var currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;

		renderer.vr.enabled = false; // Avoid camera modification and recursion
		renderer.shadowMap.autoUpdate = false; // Avoid re-computing shadows

		renderer.render( scene, mirrorCamera, renderTarget, true );

		renderer.vr.enabled = currentVrEnabled;
		renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;

		renderer.setRenderTarget( currentRenderTarget );

		// Restore viewport

		var bounds = camera.bounds;

		if ( bounds !== undefined ) {

			var size = renderer.getSize();
			var pixelRatio = renderer.getPixelRatio();

			viewport.x = bounds.x * size.width * pixelRatio;
			viewport.y = bounds.y * size.height * pixelRatio;
			viewport.z = bounds.z * size.width * pixelRatio;
			viewport.w = bounds.w * size.height * pixelRatio;

			renderer.state.viewport( viewport );

		}

		scope.visible = true;

	};

};

THREE.Mirror.prototype = Object.create( THREE.Mesh.prototype );
