/**
 * R2和時計SVG
 */

const Wadokei = function (parentDrawAreaId, width, padding, sunrise, sunset){
	const _w = width;
	const _h = width;
	const _x = -1 * (width / 2);
	const _y = _x;
	const _r = (width / 2) - padding;
	
	let _sr = [6,0];
	let _ss = [18,0];
	const regexTime = new RegExp(/^([01][0-9]|2[0-3]):([0-5][0-9])$/);
	if (typeof sunrise !== 'undefined') {
		if (regexTime.test(sunrise.slice(0,5))) {
			const tmp = sunrise.split(':');
			_sr = { hour: parseInt(tmp[0]), minute:parseInt(tmp[1])} ;
		}
	}

	if (typeof sunset !== 'undefined') {
		if (regexTime.test(sunset.slice(0,5))) {
			const tmp = sunset.split(':');
			_ss = {hour:parseInt(tmp[0]), minute:parseInt(tmp[1])} ;
		}
	}
	
	const sizeRate = (_w / 500);
	const fsize_a = Math.floor(150 * sizeRate);
	const fsize_b = Math.floor(190 * sizeRate);
	const fsize_c = Math.floor(190 * sizeRate);
	const fsize_d = Math.floor(160 * sizeRate);
	
	
	// 中心座標を(0,0)とする円を描画するためviewBoxをマイナス座標に設定する
	const setting = {
		oneDayMSec: (60 * 60 * 24) * 1000,
		divisor: 24,
		circleRad: (Math.PI * 2),
		sunrise: _sr,
		sunset: _ss,
		radius: _r, 
		boundary:{'x': _x, 'y': _y, 'width': _w, 'height': _h},
		parentDrawAreaId: parentDrawAreaId,
		svgId: 'svg0',
		label_a:[6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,0,1,2,3,4,5],
		label_b:['卯','辰','巳','午','未','申','酉','戌','亥','子','丑','寅'],
		label_c:['六','五','四','九','八','七','六','五','四','九','八','七'],
		label_d:['夜','昼'],
		color_a:['darkslategray', 'silver'],
		color_b:['darkgoldenrod', 'goldenrod','moccasin'],
		color_c:['seagreen','mediumseagreen', 'palegreen'], 
		fontStyleClass: 'yusei-magic-regular',
		fontsize_a: `${fsize_a}%`, fontsize_b: `${fsize_b}%`, fontsize_c: `${fsize_c}%`, fontsize_d: `${fsize_d}%`,
	};
	console.log(setting);
	/**
	 * 割駒のrad角度を計算する
	 * @param {*} setting 
	 * @returns [object] {dayStartRad: 昼の開始rad角度, nightStartRad: 夜の開始rad角度, dayStepRad: 昼の半駒rad角度, nightStepRad: 夜の半駒rad角度} 
	 */
	function calcWarikomaStepRadian (setting) {
		const sr = setting.sunrise;
		const ss = setting.sunset;
		
		// 今日
		const today = new Date();

		// 0 deg = 06:00 を1日の始まりとする
		const baseDateMsc = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 6 , 0, 0 , 0).getTime();
		// 日の出ミリ秒
		const sunriseMsc = new Date(today.getFullYear(), today.getMonth(), today.getDate(), sr.hour , sr.minute, 0 , 0).getTime();
		// 日の入りミリ秒
		const sunsetMsc = new Date(today.getFullYear(), today.getMonth(), today.getDate(), ss.hour , ss.minute, 0 , 0).getTime();
		// 翌日の日の出ミリ秒(厳密に言うと翌日の日の出時刻は異なるが、見た目わからないので気にしない)
		const nextDateMsc = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, sr.hour , sr.minute, 0 , 0).getTime();
		
		// 0 deg = 06:00 を1日の始まりからの差分ミリ秒
		const dayStartMsc = sunriseMsc - baseDateMsc;// 昼の開始
		const dayEndMsc = sunsetMsc - baseDateMsc;// 昼の終了
		const nightStartMsc = dayEndMsc; // 夜の開始
		const nightEndMsc = nextDateMsc - baseDateMsc; // 夜の終了
		
		const noonRange = dayEndMsc - dayStartMsc; // 昼の期間
		const nightRange = nightEndMsc - nightStartMsc; // 夜の期間
		
		// 線と文字を交互に描画するので12分割する
		const noonStepMsc = noonRange / (setting.divisor/2);
		const nightStepMsc = nightRange / (setting.divisor/2);
		
		// 昼の開始rad角度
		const dayStartRad = (setting.circleRad) * (dayStartMsc/ setting.oneDayMSec);
		const nightStartRad = (setting.circleRad) * (nightStartMsc/ setting.oneDayMSec);
		
		// 昼のrad角度
		const dayStepRad = (setting.circleRad) * (noonStepMsc / setting.oneDayMSec);
		// 夜のrad角度
		const nightStepRad = (setting.circleRad) * (nightStepMsc / setting.oneDayMSec);
		
		return {
			dayStartRad: dayStartRad,
			nightStartRad:nightStartRad,
			dayStepRad: dayStepRad,
			nightStepRad: nightStepRad,
		};
	}
	/**
	 * 中心座標を(0,0)とする円周上の座標を取得する
	 * @param {number} radian ラジアン角度
	 * @param {number} radius 半径
	 * @returns [x座標, y座標] の配列
	 */
	function getPointOnTheCircle(radian, radius){
		let x = radius * Math.cos(radian);
		let y = radius * Math.sin(radian);
		return [x, y];
	}
	/**
	 * 割駒用円弧座標リストを作成する
	 * @param {number} radius 半径
	 * @param {*} divisor 分割数
	 * @param {*} startRad １日の始まりのrad角度
	 * @param {*} dayStepRad 昼の半駒のrad角度
	 * @param {*} nightStepRad 夜の半駒のrad角度
	 * @param {*} reduceKind リストを間引くか(0:間引かない(すべて返す), 1: 奇数indexのみ返す, 2:偶数indexのみ返す)
	 */
	function makeArcPointWarikoma(radius, divisor, startRad, dayStepRad, nightStepRad, reduceKind){
		let radian = startRad;					
		let pointsOnTheCircle =[];
		for (let i = 0 ; i < divisor; i++) {
			const p = getPointOnTheCircle(radian ,radius);
			pointsOnTheCircle.push({'x': p[0], 'y':p[1]});

			radian = radian + (i < (divisor/2) ? dayStepRad: nightStepRad);
		}
		
		// 必要なもののみに間引いて返す
		let ret = [];
		if (typeof reduceKind === 'undefined') {
			return pointsOnTheCircle;
		}
		for (let i = 0 ; i < pointsOnTheCircle.length; i++) {
			const isEven = (i % 2 == 0);
			if (reduceKind == 1) {
				if (!isEven){
					ret.push(pointsOnTheCircle[i]);
				}
			} else if (reduceKind == 2) {
				if (isEven){
					ret.push(pointsOnTheCircle[i]);
				}
			} else {
				ret.push(pointsOnTheCircle[i]);
			}
		}
		return  ret;
	}
	/**
	 * SVG要素を作成する
	 * @param {SVGElement} parent 親SVG要素 
	 * @param {String} childQualifiedName 作成するSVG要素の qualifiedName. eg, 'rect', 'circle', 'path', 'line', etc. 
	 * @param {Map} params 作成するSVG要素に設定する属性のマップ {'属性名': 属性値}
	 * @returns 作成したSVG要素
	 */
	function makeElement(parent, childQualifiedName, params) {
		const child = document.createElementNS("http://www.w3.org/2000/svg", childQualifiedName);
		for(var prop in params){
			// console.log(prop, params[prop]);
			if (typeof params[prop] === "undefined") {
				continue;
			}
			child.setAttribute(prop, params[prop]);
		}
		parent.appendChild(child);
		return child;
	}
	/**
	 * SVG円を作成する
	 * @param {SVGElement} parent 親SVG要素 
	 * @param {String} childId 作成するSVG要素のid名
	 * @param {Number} cx 円の中心のx座標
	 * @param {Number} cy 円の中心のy座標
	 * @param {Number} radius 円の半径
	 * @param {*} fillColor 塗りの色
	 * @param {*} strokeColor 線の色
	 */
	function makeCircle(parent,childId, cx, cy, radius, fillColor, strokeColor) {
		makeElement(parent, 'circle', 
			{'id':childId, 'cx':cx, 'cy':cy, 'r': radius, 'fill': fillColor, 'stroke':strokeColor});
	}
	/**
	 * SVG矩形を作成する
	 * @param {SVGElement} parent 親SVG要素 
	 * @param {String} childId 作成するSVG要素のid名
	 * @param {Number} x 始点のx座標
	 * @param {Number} y 始点のy座標
	 * @param {Number} width 矩形の幅
	 * @param {Number} height 矩形の高さ
	 * @param {*} fillColor 塗りの色
	 * @param {*} strokeColor 線の色
	 * @param {*} transform 
	 */
	function makeRect(parent, childId,x,y,width,height,fillColor, strokeColor, transform){
		makeElement(parent, 'rect', 
			{'id':childId, 'x':x, 'y':y, 'width':width, 'height':height, 'fill':fillColor, 'stroke':strokeColor,
			'transform': transform});
	}
	/**
	 * SVG円弧(中心座標(0,0))を作成する
	 * @param {SVGElement} parent 親SVG要素 
	 * @param {String} childId 作成するSVG要素のid名
	 * @param {Map} startPoints 円弧の開始座標 {'x': x座標, 'y':y座標}
	 * @param {Map} endPoints   円弧の終了座標 {'x': x座標, 'y':y座標}
	 * @param {Number} radius 円の半径
	 * @param {*} fillColor 塗りの色
	 * @param {*} strokeColor 線の色
	 * @param {*} fillOpacity 塗りの透明度 
	 */
	function makeArc(parent, childId, startPoints, endPoints, radius, fillColor, strokeColor, fillOpacity){
		const d = 'M '+  startPoints.x + ' ' + startPoints.y +
			' A '+ radius + ' ' + radius + ' 0 0 0 ' +  endPoints.x + ' ' + endPoints.y + 
			' L 0 0 Z';
		makeElement(parent, 'path', {'id':childId, 'd':d, 'fill':fillColor, 'stroke':strokeColor, 'fill-opacity': fillOpacity});
	}
	/**
	 * SVGテキストを作成する
	 * @param {SVGElement} parent 親SVG要素 
	 * @param {String} childId 作成するSVG要素のid名
	 * @param {String} textLabel 描画する文字列 
	 * @param {Number} x 配置するx座標
	 * @param {Number} y 配置するy座標
	 * @param {*} verticalAlign 垂直整列位置 
	 * @param {*} horizontalAlign 水平整列位置
	 * @param {*} fontFamily フォントファミリー
	 * @param {*} fontSize フォントサイズ
	 * @param {*} fontWeight フォント太さ
	 * @param {*} fillColor 塗りの色
	 * @param {*} strokeColor 線の色
	 */
	function makeText(parent, childId, textLabel, 
		x, y, verticalAlign, horizontalAlign, fontFamily, fontSize, fontWeight, fillColor, strokeColor, styleClass){
		const child = document.createElementNS("http://www.w3.org/2000/svg", 'text');
		child.setAttribute('x', x);
		child.setAttribute('y', y);
		child.setAttribute('id', childId);
		
		if (typeof verticalAlign !== "undefined") {
			child.setAttribute('text-anchor', verticalAlign);
		}
		if (typeof horizontalAlign !== "undefined") {
			child.setAttribute('dominant-baseline', horizontalAlign);
		}
		if (typeof fontFamily !== "undefined") {
			child.setAttribute('font-family', fontFamily);
		}
		if (typeof fontSize !== "undefined") {
			child.setAttribute('font-size', fontSize);
		}
		if (typeof fontWeight !== "undefined") {
			child.setAttribute('font-weight', fontWeight);
		}
		if (typeof fillColor !== "undefined") {
			child.setAttribute('fill', fillColor);
		}
		if (typeof strokeColor !== "undefined") {
			child.setAttribute('stroke', strokeColor);
		}
		if (typeof styleClass !== "undefined") {
			child.setAttribute('class', styleClass);
		}
		
		
		const textNode = document.createTextNode(textLabel);
		child.appendChild(textNode);
		parent.appendChild(child);
	}

	/**
	 * 割駒を描画する
	 * @param {SVGElement} parent 親SVG要素 
	 * @param {string} idPrefix 円弧id名のプレフィクス
	 * @param {Array<object>} arcPoints 円弧座標リスト
	 * @param {number} radius 円弧半径
	 * @param {*} fillColorA 塗りの色A
	 * @param {*} fillColorB 塗りの色B
	 * @param {*} strokeColor 線の色
	 */
	function makeWarikoma(parent, idPrefix, arcPoints, radius, fillColorA, fillColorB, strokeColor){
		const len = arcPoints.length;
		for (let i = 0; i < len ; i++) {
			const curr = i;
			const pre = i == 0 ? len - 1 : i -1;
			const fillColor = i % 2 == 0 ? fillColorA : fillColorB;
			const previousPoints = arcPoints[pre];
			const currentPoints = arcPoints[curr];
			
			makeArc(parent, `${idPrefix}${i}`, currentPoints, previousPoints, radius, fillColor, strokeColor);
		}
	}
	/**
	 * 文字盤を描画する
	 * @param {SVGElement} parent 親SVG要素 
	 * @param {string} idPrefix 円弧id名のプレフィクス
	 * @param {Array<object>} arcPoints 円弧座標リスト
	 * @param {*} labelList 描画文字列のリスト 
	 * @param {*} fontFamily フォント種類
	 * @param {*} fontSize フォントサイズ
	 * @param {*} fontWeight フォント太さ
	 * @param {*} textColor フォント色
	 * @param {*} styleClass フォントクラス 
	 */
	function makeMojiban(parent, idPrefix, arcPoints, labelList, fontFamily, fontSize, fontWeight, textColor, styleClass){
		const len = arcPoints.length;
		for (let i = 0; i < len; i++) {
			const x = arcPoints[i].x;
			const y = arcPoints[i].y;
			const myId = `${idPrefix}_${i}`;
			const myLabel = labelList[i];
			makeText(parent, myId, myLabel, 
				x, y, 'middle', 'middle', fontFamily, fontSize, fontWeight, textColor,null, styleClass);
		}
	}
	/**
	 * 昼夜文字
	 * @param {SVGElement} parent 親SVG要素 
	 * @param {Array<string>} idList 円弧id名のプレフィクス
	 * @param {*} polyLines 中心線座標
	 * @param {Array<object>} labelPoints 文字座標リスト
	 * @param {*} labelList 描画文字列のリスト 
	 * @param {*} fontFamily フォント種類
	 * @param {*} fontSize フォントサイズ
	 * @param {*} fontWeight フォント太さ
	 * @param {*} textColor フォント色
	 * @param {*} styleClass フォントクラス 
	 */
	function makeCenterDayNight(parent, idList, polyLines, labelPoints, labelList, fontFamily, fontSize, fontWeight, textColor, styleClass){
		
		// 昼夜線
		makeElement(parent, 'polyline', {'id':`${idList[0]}`,'points': polyLines, 'stroke':textColor, 'fill':'transparent'});
		
		// 昼夜文字
		makeText(parent, `${idList[1]}`, labelList[0], labelPoints[0].x, labelPoints[0].y, 'middle', 'auto', fontFamily, fontSize, fontWeight, textColor, null,styleClass);
		makeText(parent, `${idList[2]}`, labelList[1], labelPoints[1].x, labelPoints[1].y, 'middle', 'hanging', fontFamily, fontSize, fontWeight, textColor, null, styleClass);
				
	}
	/**
	 * 描画するSVGの土台をつくる 
	 * @param {Map} setting 描画する物体に関する設定 
	 */
	function initSvg(setting){
		const x = setting.boundary.x;
		const y = setting.boundary.y;
		const width = setting.boundary.width;
		const height = setting.boundary.height;
		const radius = setting.radius;
		
		// SVG要素
		const svgElement = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
		svgElement.setAttribute('viewBox', x + ' '+ y + ' ' + width + ' ' + height);
		svgElement.setAttribute('width', width);
		svgElement.setAttribute('height', height);
		svgElement.setAttribute('id', setting.svgId);
		
		svgElement.insertAdjacentHTML('afterbegin',
			`<defs>
				<style>
				  <![CDATA[@import url('https://fonts.googleapis.com/css2?family=Yusei+Magic&display=swap');
						.yusei-magic-regular {
						font-family: 'Yusei Magic', sans-serif;
						font-weight: 400;
						font-style: normal;
				  	}
				  ]]>
				</style>
			</defs>`);
		
		// 外枠の矩形
		makeRect(svgElement, '_rect_0', x, y, width, height, setting.color_a[1], setting.color_a[0]);
		// 外枠の円
		makeCircle(svgElement, "_circle_0", 0, 0, radius, setting.color_a[0], setting.color_a[1]);
		
		const drawArea = document.getElementById(setting.parentDrawAreaId);
		drawArea.appendChild(svgElement);
	}
	/**
	 * 和時計文字盤を描画する
	 * @param {*} setting 描画する物体に関する設定
	 */
	function drawWadokei(setting){
		const _radius0 = setting.radius * 0.9; // 英数字が乗る円の半径
		const _radius1 = _radius0 * 0.92; // 十二支割駒の円の半径
		const _radius2 = _radius1 * 0.88; // 十二支漢字が乗るの円の半径
		const _radius3 = _radius2 * 0.82; // 漢数字割駒の円の半径
		const _radius4 = _radius3 * 0.75; // 漢数字が乗る円の半径
		const _radius5 = _radius4 * 0.6; // 内側の円の半径
		
		// 不定時法割駒rad角度 [{昼始まりのrad角度}, {昼の半駒のrad角度}, {夜の半駒のrad角度}]
		const wkm = calcWarikomaStepRadian(setting);
		
		// 円弧座標リスト
		// 英数字が乗る座標リスト
		const stepRad = setting.circleRad / setting.divisor;
		const _arcPoints0 = makeArcPointWarikoma(_radius0, setting.divisor, 0, stepRad, stepRad, 0); 
		
		// 十二支割駒の座標リスト
		const _arcPoints1 = makeArcPointWarikoma(_radius1, setting.divisor, wkm.dayStartRad, wkm.dayStepRad, wkm.nightStepRad, 1);
		
		// 十二支漢字の座標リスト
		const _arcPoints2 = makeArcPointWarikoma(_radius2, setting.divisor, wkm.dayStartRad, wkm.dayStepRad, wkm.nightStepRad, 2);
		
		// 漢数字割駒の座標リスト
		const _arcPoints3 = makeArcPointWarikoma(_radius3, setting.divisor, wkm.dayStartRad, wkm.dayStepRad, wkm.nightStepRad, 1);
		
		// 漢数字が乗る座標リスト
		const _arcPoints4 = makeArcPointWarikoma(_radius4, setting.divisor, wkm.dayStartRad, wkm.dayStepRad, wkm.nightStepRad, 2);

		// SVGElement 
		const svgObj = document.getElementById(setting.svgId);
		
		// 英数字配置
		makeMojiban(svgObj, '_num_lb_', _arcPoints0, setting.label_a , 'Arial, Helvetica, sans-serif', setting.fontsize_a, 'bold', setting.color_a[1]);
		
		// 十二支割駒
		makeWarikoma(svgObj,'_eto_arc_', _arcPoints1, _radius1, setting.color_b[0], setting.color_b[1], setting.color_a[0]);
		
		// 十二支漢字
		makeMojiban(svgObj, '_eto_lb_', _arcPoints2, setting.label_b, 'serif', setting.fontsize_b, 'normal', setting.color_b[2], setting.fontStyleClass);
		
		// 漢数字割駒
		makeWarikoma(svgObj,'_kanji_arc_', _arcPoints3, _radius3, setting.color_c[0], setting.color_c[1], setting.color_a[0]);
		
		// 漢数字
		makeMojiban(svgObj, '_kanji_lb_', _arcPoints4, setting.label_c, 'serif', setting.fontsize_c, 'normal', setting.color_c[2], setting.fontStyleClass);
						
		// 内側の円
		makeCircle(svgObj, '_circle_1', 0, 0, _radius5, setting.color_a[0], setting.color_a[1]);
		
		// 中心　昼夜　文字
		const p1 = getPointOnTheCircle(wkm.dayStartRad, _radius5);
		const p2 = getPointOnTheCircle(wkm.nightStartRad, _radius5);
		const polyLines = `${p1[0]},${p1[1]}  0,0 ${p2[0]},${p2[1]}`;
		const idList = ['_center_polyline', '_center_text_0', '_center_text_1'];
		const labelPoints = [{x:0,y:-15},{x:0,y:15}];
		
		makeCenterDayNight(svgObj, idList, polyLines, labelPoints, setting.label_d, 'san-serif', setting.fontsize_d, 'normal', setting.color_a[1], setting.fontStyleClass);
	}
	/**
	 * 指針を描画する
	 * @param {*} setting 
	 */
	function drawArrow(setting){
		// SVGElement 
		const svgObj = document.getElementById(setting.svgId);
		const deg = getCurrentDegree(setting);
		const startX = -(setting.radius * 0.15);
		const startY = -1.5;
		const width = setting.radius;
		const height = 3;
		const transform = `rotate(${deg}, 0, 0)`;
		
		// line
		makeRect(svgObj, '_arrow_0', startX, startY, width, height, 'red', 'orange', transform);
		
		// 中心
		makeCircle(svgObj, '_arrow_center_0', 0, 0, 7, 'red', 'orange');
	}
	/**
	 * 現在時刻を示す角度(degree)を取得する
	 * @param {*} setting 
	 * @returns 現在時刻を示す角度(degree)
	 */
	function getCurrentDegree(setting){
		// 今日
		const today = new Date();
		
		// 0 deg = 06:00 を1日の始まりとする
		const baseDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 6 , 0, 0 , 0);
		
		// 開始ミリ秒
		const startMSec = baseDate.getTime();
		// 現在ミリ秒
		const currentMSec = new Date().getTime();
		// 経過ミリ秒
		const diffMSec = currentMSec - startMSec;
		// 現在の角度
		const currentDegree = (360) * (diffMSec / setting.oneDayMSec);
		
		return currentDegree;
	}
	function work () {
		initSvg(setting);
		drawWadokei(setting);
		drawArrow(setting);
	}
	return {
		'work': work
	};
};