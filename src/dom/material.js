/**
 * @fileoverview material parser/implementation
 * 
 * @author Tony Parisi
 */

goog.provide('glam.DOMMaterial');

glam.DOMMaterial.create = function(style, createCB, objtype) {
	var material = null;
	
	if (style) {
		var param = glam.DOMMaterial.parseStyle(style);
		if (style.shader) {
			switch (style.shader.toLowerCase()) {
				case "phong" :
				case "blinn" :
					material = new THREE.MeshPhongMaterial(param);
					break;
				case "lambert" :
					material = new THREE.MeshLambertMaterial(param);
					break;
				case "line" :
					material = new THREE.LineBasicMaterial(param);
					break;
				case "basic" :
				default :
					material = new THREE.MeshBasicMaterial(param);
					break;
			}
		}
		else if (style["vertex-shader"] && style["fragment-shader"] && style["shader-uniforms"]) {
			material = glam.DOMMaterial.createShaderMaterial(style, param, createCB);
		}
		else if (objtype == "line") {
			if (param.dashSize !== undefined  || param.gapSize !== undefined) {
				material = new THREE.LineDashedMaterial(param);
			}
			else {
				material = new THREE.LineBasicMaterial(param);
			}
		}
		else {
			material = new THREE.MeshBasicMaterial(param);
		}
	}
	else {
		material = new THREE.MeshBasicMaterial();
	}
	
	return material;
}

glam.DOMMaterial.parseStyle = function(style) {
	var image = "";
	if (style.image) {
		image = glam.DOMMaterial.parseUrl(style.image);
	}

	var normalMap = "";
	if (style["normal-image"]) {
		normalMap = glam.DOMMaterial.parseUrl(style["normal-image"]);
	}

	var bumpMap = "";
	if (style["bump-image"]) {
		bumpMap = glam.DOMMaterial.parseUrl(style["bump-image"]);
	}

	var specularMap = "";
	if (style["specular-image"]) {
		specularMap = glam.DOMMaterial.parseUrl(style["specular-image"]);
	}

	var reflectivity;
	if (style.reflectivity)
		reflectivity = parseFloat(style.reflectivity);
	
	var refractionRatio;
	if (style.refractionRatio)
		refractionRatio = parseFloat(style.refractionRatio);
	
	var envMap = glam.DOMMaterial.tryParseEnvMap(style);
	
	var color;
	var diffuse;
	var specular;
	var ambient;
	var css = "";

	if (css = style["color"]) {
		color = new THREE.Color().setStyle(css).getHex();
	}
	if (css = style["diffuse-color"]) {
		diffuse = new THREE.Color().setStyle(css).getHex();
	}
	if (css = style["specular-color"]) {
		specular = new THREE.Color().setStyle(css).getHex();
	}
	if (css = style["ambient-color"]) {
		ambient = new THREE.Color().setStyle(css).getHex();
	}
	
	var opacity;
	if (style.opacity)
		opacity = parseFloat(style.opacity);

	var side = THREE.FrontSide;
	if (style["backface-visibility"]) {
		switch (style["backface-visibility"].toLowerCase()) {
			case "visible" :
				side = THREE.DoubleSide;
				break;
			case "hidden" :
				side = THREE.FrontSide;
				break;
		}
	}
	
	var wireframe;
	if (style.hasOwnProperty("render-mode"))
		wireframe = (style["render-mode"] == "wireframe");
	
	var linewidth;
	if (style["line-width"]) {
		linewidth = parseInt(style["line-width"]);
	}
	
	var dashSize;
	if (style["dash-size"]) {
		dashSize = parseInt(style["dash-size"]);
	}

	var gapSize;
	if (style["gap-size"]) {
		gapSize = parseInt(style["gap-size"]);
	}
	
	var param = {
	};
	
	if (image)
		param.map = THREE.ImageUtils.loadTexture(image);
	if (envMap)
		param.envMap = envMap;
	if (normalMap)
		param.normalMap = THREE.ImageUtils.loadTexture(normalMap);
	if (bumpMap)
		param.bumpMap = THREE.ImageUtils.loadTexture(bumpMap);
	if (specularMap)
		param.specularMap = THREE.ImageUtils.loadTexture(specularMap);
	if (color !== undefined)
		param.color = color;
	if (diffuse !== undefined)
		param.color = diffuse;
	if (specular !== undefined)
		param.specular = specular;
	if (ambient !== undefined)
		param.ambient = ambient;
	if (opacity !== undefined) {
		param.opacity = opacity;
		param.transparent = opacity < 1;
	}
	if (wireframe !== undefined) {
		param.wireframe = wireframe;
	}
	if (linewidth !== undefined) {
		param.linewidth = linewidth;
	}
	if (dashSize !== undefined) {
		param.dashSize = dashSize;
	}
	if (gapSize !== undefined) {
		param.gapSize = gapSize;
	}
	if (reflectivity !== undefined)
		param.reflectivity = reflectivity;
	if (refractionRatio !== undefined)
		param.refractionRatio = refractionRatio;

	param.side = side;
	
	return param;
}

glam.DOMMaterial.parseUrl = function(image) {
	var regExp = /\(([^)]+)\)/;
	var matches = regExp.exec(image);
	image = matches[1];
	return image;
}

glam.DOMMaterial.tryParseEnvMap = function(style) {
	var urls = [];
	
	if (style["cube-image-right"])
		urls.push(glam.DOMMaterial.parseUrl(style["cube-image-right"]));
	if (style["cube-image-left"])
		urls.push(glam.DOMMaterial.parseUrl(style["cube-image-left"]));
	if (style["cube-image-top"])
		urls.push(glam.DOMMaterial.parseUrl(style["cube-image-top"]));
	if (style["cube-image-bottom"])
		urls.push(glam.DOMMaterial.parseUrl(style["cube-image-bottom"]));
	if (style["cube-image-front"])
		urls.push(glam.DOMMaterial.parseUrl(style["cube-image-front"]));
	if (style["cube-image-back"])
		urls.push(glam.DOMMaterial.parseUrl(style["cube-image-back"]));
	
	if (urls.length == 6) {
		//console.log("**** GLAM: Loading cubemap", urls[0]);
		var cubeTexture = THREE.ImageUtils.loadTextureCube( urls, THREE.Texture.DEFAULT_MAPPING,
			function(texture) {
				//console.log("**** GLAM: cubemap loaded", texture, urls[0]);
			} );
		return cubeTexture;
	}
	
	if (style["sphere-image"]) {
		var url = glam.DOMMaterial.parseUrl(style["sphere-image"]);
		//console.log("**** GLAM: Loading spheremap", url);
		return THREE.ImageUtils.loadTexture(url, THREE.SphericalRefractionMapping, 
			function(texture) {
				//console.log("**** GLAM: spheremap loaded", texture, url);
			});
	}
	
	return null;
}

glam.DOMMaterial.createShaderMaterial = function(style, param, createCB) {
	
	function done() {
		var material = new THREE.ShaderMaterial({
			vertexShader : vstext,
			fragmentShader : fstext,
			uniforms: uniforms,
		});
		
		glam.DOMMaterial.saveShaderMaterial(vsurl, fsurl, material);
		glam.DOMMaterial.callShaderMaterialCallbacks(vsurl, fsurl);
	}
	
	var vs = style["vertex-shader"];
	var fs = style["fragment-shader"];
	var uniforms = glam.DOMMaterial.parseUniforms(style["shader-uniforms"], param);

	var vsurl = glam.DOMMaterial.parseUrl(vs);
	var fsurl = glam.DOMMaterial.parseUrl(fs);

	if (!vsurl || !fsurl) {
		var vselt = document.getElementById(vs);
		var vstext = vselt.textContent;
		var fselt = document.getElementById(fs);
		var fstext = fselt.textContent;
		
		if (vstext && fstext) {
			return new THREE.ShaderMaterial({
				vertexShader : vstext,
				fragmentShader : fstext,
				uniforms: uniforms,
			});
		}
		else {
			return null;
		}
	}	
	
	var material = glam.DOMMaterial.getShaderMaterial(vsurl, fsurl);
	if (material)
		return material;
	
	glam.DOMMaterial.addShaderMaterialCallback(vsurl, fsurl, createCB);
	
	if (glam.DOMMaterial.getShaderMaterialLoading(vsurl, fsurl))
		return;
	
	glam.DOMMaterial.setShaderMaterialLoading(vsurl, fsurl);
	
	var vstext = "";
	var fstext = "";
	
	glam.System.ajax({
	      type: 'GET',
	      url: vsurl,
	      dataType: "text",
	      success: function(result) { vstext = result; if (fstext) done(); },
	});	
	
	
	glam.System.ajax({
	      type: 'GET',
	      url: fsurl,
	      dataType: "text",
	      success: function(result) { fstext = result; if (vstext) done(); },
	});	
}

glam.DOMMaterial.parseUniforms = function(uniformsText, param) {
	
	var uniforms = {
	};
	
	var tokens = uniformsText.split(" ");

	var i, len = tokens.length / 3;
	for (i = 0; i < len; i++) {
		var name = tokens[i * 3];
		var type = tokens[i * 3 + 1];
		var value = tokens[i * 3 + 2];
		
		if (type == "f")
			value = parseFloat(value);
		if (type == "c") {
			var c = new THREE.Color();
			c.setStyle(value);
			value = c;
		}
		else if (type == "t") {
			value = value.toLowerCase();
			if (value == "cube") {
				value = param.envMap;
			}
			else {
				var image = glam.DOMMaterial.parseUrl(value);
				value = THREE.ImageUtils.loadTexture(image);
				value.wrapS = value.wrapT = THREE.Repeat;
			}
		}
		
		var uniform =  {
			type : type,
			value : value,
		};
		
		uniforms[name] = uniform;
	}
		
	return uniforms;
}

glam.DOMMaterial.shaderMaterials = {};

glam.DOMMaterial.saveShaderMaterial = function(vsurl, fsurl, material) {
	var key = vsurl + fsurl;
	var entry = glam.DOMMaterial.shaderMaterials[key];
	entry.material = material;
	entry.loading = false;
}

glam.DOMMaterial.addShaderMaterialCallback = function(vsurl, fsurl, cb) {
	var key = vsurl + fsurl;
	
	var entry = glam.DOMMaterial.shaderMaterials[key];
	if (!entry) {
		glam.DOMMaterial.shaderMaterials[key] = {
			material : null,
			loading : false,
			callbacks : [],
		};
	}
	
	glam.DOMMaterial.shaderMaterials[key].callbacks.push(cb);
}

glam.DOMMaterial.callShaderMaterialCallbacks = function(vsurl, fsurl) {
	var key = vsurl + fsurl;
	
	var entry = glam.DOMMaterial.shaderMaterials[key];
	if (entry && entry.material) {
		for (var cb in entry.callbacks) {
			entry.callbacks[cb](entry.material);
		}
	}
}

glam.DOMMaterial.getShaderMaterial = function(vsurl, fsurl) {
	
	var key = vsurl + fsurl;
	var entry = glam.DOMMaterial.shaderMaterials[key];
	if (entry) {
		return entry.material;
	}
	else {
		return null;
	}
}

glam.DOMMaterial.setShaderMaterialLoading = function(vsurl, fsurl) {
	
	var key = vsurl + fsurl;
	var entry = glam.DOMMaterial.shaderMaterials[key];
	if (entry) {
		entry.loading = true;
	}
}

glam.DOMMaterial.getShaderMaterialLoading = function(vsurl, fsurl) {
	
	var key = vsurl + fsurl;
	var entry = glam.DOMMaterial.shaderMaterials[key];
	return (entry && entry.loading);
}

glam.DOMMaterial.addHandlers = function(docelt, style, obj) {

	docelt.glam.setAttributeHandlers.push(function(attr, val) {
		glam.DOMMaterial.onSetAttribute(obj, docelt, attr, val);
	});
	
	style.setPropertyHandlers.push(function(attr, val) {
		glam.DOMMaterial.onSetProperty(obj, docelt, attr, val);
	});
}

glam.DOMMaterial.onSetAttribute = function(obj, docelt, attr, val) {

	var material = obj.visuals[0].material;
	switch (attr) {
		case "color" :
		case "diffuse-color" :
		case "diffuseColor" :
			material.color.setStyle(val);
			break;
	}
}

glam.DOMMaterial.onSetProperty = function(obj, docelt, attr, val) {

	var material = obj.visuals[0].material;
	switch (attr) {
		case "color" :
		case "diffuse-color" :
		case "diffuseColor" :
			material.color.setStyle(val);
			break;
	}
}
