/**
 * R2和時計GUI
 */
const WadokeiGui = function () {
	const drawAreaId = 'drawArea'; 
	const drawArea = document.getElementById(drawAreaId);
	const wadokeiCtrl = document.getElementById('wadokeiCtrl');
	const baseDate = document.getElementById("base_date");
	const mdRange = document.getElementById("mdRange");
	const mdRangeDataList = document.getElementById('mdRangeDataList');
	const sunriseTime = document.getElementById("sunrise_time");
	const sunsetTime = document.getElementById("sunset_time");
	const locaMenu = document.getElementById('locaMenu');
	const goToday = document.getElementById('goToday');
	const autoHimekuri = document.getElementById("autoHimekuri");
	const url_pulldown = "js/data/cities.json";
	const url_koyomi = "js/data/city_";
	const dateFormatOption = {timeZone: 'Asia/Tokyo', year:"numeric", month:"2-digit",day:"2-digit"};
	const oneDayMillSec = (1000 * 60 * 60 * 24);

	const thisYear= new Date().getFullYear();
	const daysOfYear=Math.fround((Date.parse(`${thisYear+1}-01-01`) - Date.parse(`${thisYear}-01-01`)) /  oneDayMillSec);
	let rcnt = 0;
	// console.log(thisYear, daysOfYear);

	/**
	 * 指定した年月日に対応するスライダー値をセットする
	 * @param {*} targetYmd 
	 */
	function setTargetDateToRange(targetYmd){
		const targetDate = new Date(targetYmd).setFullYear(thisYear);
		const targetMs = targetDate - (new Date(`${thisYear}-01-01`));
		const rangeVal = Math.round(targetMs / oneDayMillSec);
		mdRange.max = daysOfYear -1;
		mdRange.value = rangeVal;
	}
	/**
	 * 指定したスライダー値に対応する年月日を取得する
	 * @param {*} currentValue 
	 */
	function getTargetDateFromRange(currentValue){
		const val = parseInt(currentValue);
		let targetMs = Date.parse(`${thisYear}-01-01`) + (val * oneDayMillSec);
		const targetDate = new Date(targetMs);
		const targetYmd = targetDate.toLocaleDateString('ja-JP', dateFormatOption);
		return targetYmd.substring(5);
	}
	/**
	 * 本日日付文字列を取得する
	 *
	 * @param {*} separator 日付区切り文字 
	 */
	function getToday(separator){
		let today = new Date();
		today.setFullYear(thisYear);
		return today.toLocaleDateString('ja-JP', dateFormatOption).replaceAll("/", separator);
	}

	/**
	 * 所在地プルダウンメニューを構築する
	 *
	 * @param {*} defaultVal 初期値とする市町村コード 
	 */
	function setupMenu(defaultVal){
		return fetch(url_pulldown).then(function (response) {
				if (! response.ok){
					throw new Error(`response status: ${response.status}`);
				}
				return response.json();
			}).then(function (json) {
				let isAuto = false;
				for (let key in json) {
					// 選択肢グループ
					const optGrp = document.createElement('optgroup');
					optGrp.setAttribute('label', key);
					
					// 選択肢
					const len = json[key].length;
					for(let i = 0; i < len; i++){
						const locData = json[key][i];
						for (let key in locData) {
							const op = document.createElement('option');
							op.setAttribute('value', key);
							if (typeof defaultVal !=="undefined" && key == defaultVal) {
								op.setAttribute('selected', true);
								isAuto = true;
							}
							op.insertAdjacentText('afterbegin', locData[key]);
							optGrp.appendChild(op);
						}
					}
					
					locaMenu.appendChild(optGrp);
				}
				autoHimekuri.setAttribute('checked',isAuto);
				toggleAutoHimekuri();
				return json;
			}).catch(function(e){
				console.log(e);
				return e;
			});
	}
	/**
	 * 日の出・日の入り時刻情報を取得する
	 */
	function getTimeData(){
		const [url,md] = makeUrl();
		console.log(url,md);
		if (typeof url === "undefined" || ! url || url.length <= 0) {
			return false;
		}
		if (typeof md === "undefined" || ! md || md.length <= 0) {
			return false;
		}
		
		return fetch(url).then(function(response){
			if (! response.ok){
				throw new Error(`response status: ${response.status}`);
			}
			return response.json();
		}).then(function(json){
			let sunrise_time;
			let sunset_time;
			let line;
			for (let i = 0; i < json.length; i++) {
				line = json[i];
				if (line.mmdd == md){
					sunrise_time = line.sunrise_time;
					sunset_time = line.sunset_time;
					break;
				}
			}
			if (sunrise_time) {
				sunriseTime.innerText = sunrise_time;
			}
			if (sunset_time) {
				sunsetTime.innerText = sunset_time;
			}

			return line;
		}).catch(function(e){
			console.log(e);
			return e;
		});
	}
	/**
	 * 日の出・日の入り時刻情報を取得し、和時計を再描画する
	 */
	function getTimeDataAndRefresh (){
		return getTimeData().then(function(result){
			// console.log(result);
			refreshWadokei();
			return result;
		}).then(function(result){
			toggleAutoHimekuri();
		});
	}
	/**
	 * 「auto」スイッチ切り替えに伴う、表示切替
	 * 「auto」スイッチ on のとき、プルダウンメニューやスライダーは操作不可。
	 * 「auto」スイッチ off のとき、プルダウンメニューやスライダーは操作可能。
	 */
	function toggleAutoHimekuri(){
		const isAuto = autoHimekuri.checked;
		Array.of(goToday, locaMenu, mdRange).forEach(function(item){
			item.disabled = isAuto;
		});
		Array.of(sunsetTime, sunriseTime, baseDate).forEach(function(item){
			if (isAuto) {
				item.classList.add("disabled");
			} else {
				item.classList.remove("disabled");
			}
			
		});
	}
	/**
	 * 初期描画処理
	 * 日付スライダー初期値設定
	 * 所在地プルダウンメニュー構築
	 * @param {*} cityCode 
	 */
	function init(cityCode){
		// スライダーに今日の日付をセット
		setSliderToday();
		// スライダー初期表示
		setSliderMarks();
		
		// 所在地メニュー構築
		setupMenu(cityCode).then(function(result){
			// console.log(result);
			// console.log(locaMenu.selected, locaMenu.value);
			if (!locaMenu.value || locaMenu.value.length <= 0 ) {
				refreshWadokei();
			} else {
				getTimeDataAndRefresh();
			}
		});
	}

	/**
	 * 日の出・日の入り時刻情報照会URLを組み立てる
	 */
	function makeUrl(){
		const locaVal = locaMenu.value;
		if (locaVal.length <= 0) {
			return null;
		}
		const baseDateValue = baseDate.innerText;
		const inValid = isNaN(Date.parse(`${thisYear}/${baseDateValue}`));
		if (inValid || baseDateValue.length <= 0) {
			return null;
		}
		const md = baseDateValue.replaceAll("/",""); 
		const url = `${url_koyomi}${locaVal}.json`;
		return Array.of(url,md);
	}
	/**
	 * 日付スライダーを本日の位置へセットする
	 */
	function setSliderToday(){
		setTargetDateToRange(getToday("-"));
		baseDate.innerText = getTargetDateFromRange(mdRange.value);
	}
	/**
	 * 日付スライダー目盛りを構築する
	 */
	function setSliderMarks(){
		const timestamp0 = Date.parse(`${thisYear}-01-01`);
		const lastValue = daysOfYear - 1;
		for (var i = 0; i <= lastValue; i++) {
			const dispDate = new Date(timestamp0 + (i * oneDayMillSec));
			if(dispDate.getDate() != 1) {
				continue;
			}
			const dispValue = dispDate.toLocaleDateString('ja-JP', dateFormatOption).substring(5);
			const opt = document.createElement('option');
			opt.setAttribute("value", i);
			opt.setAttribute("label", dispValue);
			mdRangeDataList.appendChild(opt);
		}
		const optLast = document.createElement('option');
		optLast.setAttribute("value", lastValue);
		optLast.setAttribute("label", "12/31");
		mdRangeDataList.appendChild(optLast);
		
		mdRangeDataList.style.width = mdRange.offsetWidth;
	}
	/**
	 * 和時計を描画する
	 */
	function refreshWadokei() {
		const _padding = 20;
		const dw = drawArea.offsetWidth;
		const wh = Math.min(window.innerHeight,screen.availHeight);
		let _w = dw;
		if (wh >= dw + 100) {
			_w = dw;
		} else {
			_w = Math.min(dw, wh) - 100;
			// _w = Math.min(dw, wh);
		}
		while(drawArea.firstChild){
			drawArea.removeChild(drawArea.firstChild);
		}

		// 和時計初期化
		const wadokei = Wadokei(drawAreaId, _w, _padding, sunriseTime.innerText, sunsetTime.innerText);

		// 和時計描画
		wadokei.work();
		
		wadokeiCtrl.style.width = `${_w}px`;
	}
	/**
	 * 「今日」の状態を再描画する
	 * 日付スライダーを本日の位置へ戻し、和時計を再描画する
	 */
	function refreshToday(){
		setSliderToday();
		getTimeDataAndRefresh();
	}
	/**
	 * 画面ロード時の処理
	 */
	function loadHandler(event) {
		// 所在地プルダウンメニューチェンジイベントリスナー
		locaMenu.addEventListener('change', function(event){
			getTimeDataAndRefresh();
		});
		
		// 日付スライダーイベントチェンジリスナー
		mdRange.addEventListener('input',function(event){
			baseDate.innerText = getTargetDateFromRange(event.currentTarget.value);
			getTimeDataAndRefresh();
		});
		
		// 「今日」ボタンクリックイベントリスナー
		goToday.addEventListener('click', function(event){
			refreshToday();
		});
		
		// 「auto」スイッチチェンジイベントリスナー
		autoHimekuri.addEventListener('change', function(event){
			if (event.currentTarget.checked) {
				refreshToday();
			} else {
				toggleAutoHimekuri();
			}
		});

		// 初期描画
		init('130001');

		// 定期的に描画更新
		setInterval(function(){
			if (autoHimekuri.checked) {
				const currentHour = (new Date()).getHours();
				if (currentHour == 0 && rcnt == 0){
					// データ取得しなおして再描画
					refreshToday();
					rcnt++;
				} else {
					// 取得済みのデータで再描画
					refreshWadokei();
					if (currentHour != 0 && rcnt != 0) {
						rcnt = 0;
					}
				}
			}
		}, 1000 * 60 * 3);
	}
	return {
		'loadHandler':loadHandler,
	};
};