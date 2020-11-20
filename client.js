const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
require('dotenv').config();
const mulang = require('@lifund/mulang');
var useragent = require('express-useragent');
app.use(useragent.express());

const port = 3000;

app.listen(port, ()=>{console.log('seomin client listening port:', port)});
app.set('trust proxy', true);
app.use(express.json({ limit: '5mb'}));
app.use('/public', express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));
  



//------------------------------------------------//
//-------------------- BASE PATHS --------------------//
//------------------------------------------------//
app.get('/robots.txt',(req,res)=>{
	res.sendFile(path.join(__dirname,'public/robots.txt'));
})
app.get('/',(req,res)=>{
	res.redirect('/temp');
});
app.get('/temp',(req,res)=>{
	res.sendFile(path.join(__dirname,'public/temp.html'));
});
app.get('/prototype',(req,res)=>{
	res.sendFile(path.join(__dirname,'public/proto.html'));
});





//------------------------------------------------//
//-------------------- CLIENT --------------------//
//------------------------------------------------//

//-------------------- HOME --------------------//
app.get('/home',(req,res)=>{
	mongoFind('menu',{"mainPage": true },(result)=>{
		// read HTML template
		let sourceHtml = fs.readFileSync(path.join(__dirname,'public/client/home.html'),'utf-8');

		// STYLE SHEET : MOBILE/DEKSTOP
		if(req.useragent.isMobile){
			sourceHtml = sourceHtml.replace('<!-- stylesheet_placeholder -->',`<link rel="stylesheet" href="public/client/home_mobile.css">`)
		}else{
			sourceHtml = sourceHtml.replace('<!-- stylesheet_placeholder -->',`<link rel="stylesheet" href="public/client/home_desktop.css">`)
		}

		// make banner slider
		let bannerHTML = ''
		if(req.useragent.isMobile){
			fs.readdirSync(path.join(__dirname,'public/banner/mobile'),'utf-8').forEach((bannerImage)=>{
				bannerHTML += '<img class="banner_image" src="public/banner/mobile/'+bannerImage+'">';
			});
		}else{
			fs.readdirSync(path.join(__dirname,'public/banner/desktop'),'utf-8').forEach((bannerImage)=>{
				bannerHTML += '<img class="banner_image" src="public/banner/desktop/'+bannerImage+'">';
			})
		}
		// make menu card
		let menuCardHTML = ''
		result.forEach((menu)=>{
			menuCardHTML += `
			<div class="menuCard" data-all="${encodeURIComponent(JSON.stringify(menu))}">
				<img src="public/menuImage/${menu.imageURL}" alt="이미지 준비중">
				<p> ${menu.productName} </p>`
			menu.price.forEach((priceTag)=>{
				menuCardHTML+=`<div class="menuCard_price">`
				if(priceTag.size!=''){
					menuCardHTML+=`
					<p class="menuCard_price_size">${priceTag.size}</p>`
				}
				menuCardHTML+=`
					<p class="menuCard_price_value">${priceTag.value}</p>
					<p class="menuCard_price_won"> 원 </p>
				</div>`
			})
			menuCardHTML+=`
			</div>`
		})
		let targetJson = {
			"meta":
			{
				"languages": ["kor"],
				"linebreak": "<br>",
			},
			"contents":
			{
				"banner_slider": { "kor": bannerHTML },
				"recommendation_slider": {"kor": menuCardHTML}
			}
		}
		const mulang_home = new mulang({
			sourceHtml: sourceHtml,
			targetJson: targetJson
		})
		res.send(mulang_home.render().kor)
	})
});


//-------------------- BRAND --------------------//
app.get('/brand',(req,res)=>{	
	let sourceHtml = fs.readFileSync(path.join(__dirname,'public/client/brand.html'),'utf-8');
	// STYLE SHEET : MOBILE/DEKSTOP
	if(req.useragent.isMobile){
		sourceHtml = sourceHtml.replace('<!-- stylesheet_placeholder -->',`<link rel="stylesheet" href="public/client/brand_mobile.css">`)
	}else{
		sourceHtml = sourceHtml.replace('<!-- stylesheet_placeholder -->',`<link rel="stylesheet" href="public/client/brand_desktop.css">`)
	}
	res.send(sourceHtml);
});


//-------------------- MENU --------------------//
app.get('/menu',(req,res)=>{
	// read HTML template
	let sourceHtml = fs.readFileSync(path.join(__dirname,'public/client/menu.html'),'utf-8');
	// STYLE SHEET : MOBILE/DEKSTOP
	if(req.useragent.isMobile){
		sourceHtml = sourceHtml.replace('<!-- stylesheet_placeholder -->',`<link rel="stylesheet" href="public/client/menu_mobile.css">`)
	}else{
		sourceHtml = sourceHtml.replace('<!-- stylesheet_placeholder -->',`<link rel="stylesheet" href="public/client/menu_desktop.css">`)
	}

	mongoFind('menu',{},(result)=>{
		// make menu card (main)
		let menuCardHTML_main = ''
		let menuCardHTML_dough = ''
		let menuCardHTML_set = ''
		let menuCardHTML_side = ''

		result.forEach((menu)=>{
			let tempCardHTML = '';
			tempCardHTML += 
			`<div class="menuCard" data-all="${encodeURIComponent(JSON.stringify(menu))}">
				<img src="public/menuImage/${menu.imageURL}" alt="이미지 준비중">
				<p class="menuCard_productName"> ${menu.productName} </p>`
			menu.price.forEach((priceTag)=>{
				tempCardHTML+=`<div class="menuCard_price">`
				if(priceTag.size!=''){
					tempCardHTML+=`
					<p class="menuCard_price_size">${priceTag.size}</p>`
				}
				tempCardHTML+=`
					<p class="menuCard_price_value">${priceTag.value}</p>
					<p class="menuCard_price_won"> 원 </p>
				</div>`
			})
			tempCardHTML+=
			`<p class="menuCard_description_short">${menu.description.short}</p>
			</div>`
			if(menu.categoryName == "메인메뉴"){
				menuCardHTML_main += tempCardHTML;
			}
			if(menu.categoryName == "도우종류"){
				menuCardHTML_dough += tempCardHTML;
			}
			if(menu.categoryName == "세트메뉴"){
				menuCardHTML_set += tempCardHTML;
			}
			if(menu.categoryName == "사이드메뉴"){
				menuCardHTML_side += tempCardHTML;
			}
		})

		let targetJson = {
			"meta":
			{
				"languages": ["kor"],
				"linebreak": "<br>",
			},
			"contents":
			{
				"menu_main": {"kor": menuCardHTML_main},
				"menu_dough": {"kor": menuCardHTML_dough},
				"menu_set": {"kor": menuCardHTML_set},
				"menu_side": {"kor": menuCardHTML_side}
			}
		}
		const mulang_home = new mulang({
			sourceHtml: sourceHtml,
			targetJson: targetJson
		})
		res.send(mulang_home.render().kor)
	}); //{ $exists: true }
});


//-------------------- SHOP --------------------//
app.get('/shop',(req,res)=>{
	
	var now = parseInt(Date().split(' ')[4].split(':').join('').substr(0,4));
	
	mongoFind('shop',{},(result)=>{

		// read HTML template
		let sourceHtml = fs.readFileSync(path.join(__dirname,'public/client/shop.html'),'utf-8');
		
		// STYLE SHEET : MOBILE/DEKSTOP
		if(req.useragent.isMobile){
			sourceHtml = sourceHtml.replace('<!-- stylesheet_placeholder -->',`<link rel="stylesheet" href="public/client/shop_mobile.css">`)
		}else{
			sourceHtml = sourceHtml.replace('<!-- stylesheet_placeholder -->',`<link rel="stylesheet" href="public/client/shop_desktop.css">`)
		}

		// make shop card
		let shopCardHTML = '';
		var region = {"전체":{"count":0}};
		result.forEach((shop)=>{
			// REGION COUNTS
			region['전체'].count += 1;
			if(region[shop.city]){
				region[shop.city].count += 1
			}else{
				region[shop.city] = {"count":1,"district":{"전체":0}};
			}
			if(region[shop.city].district[shop.district]){
				region[shop.city].district[shop.district] += 1
				region[shop.city].district['전체'] += 1;
			}else{
				region[shop.city].district[shop.district] = 1
				region[shop.city].district['전체'] += 1;
			}
			// NAME
			shopCardHTML += `
			<div class="shopCard ${shop.city} ${shop.district}">
				<p class="shopName">${shop.name}</p>`
			// time calculation
			var open = parseInt( shop.openingHours[0].replace(':','') );
			var close = parseInt( shop.openingHours[1].replace(':','') );
			var isopen = false;
			if(open<close && open<now && now<close){ isopen = true; }
			if(open>close){
				if(now<open && now<close){ isopen = true; }
				if(now>open){ isopen = true; }
			}
			if(open==close){ isopen = true; }
			// ADDRESS, PHONE, CALL
			shopCardHTML += `<p class="shopAddress"> ${shop.address} </p>`
			shopCardHTML += `<p class="shopPhone"> ${shop.phone} </p>`
			shopCardHTML += `<a href="tel:${shop.phone}"> <svg class="shopCall" width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M40 20C40 31.0457 31.0457 40 20 40C8.9543 40 0 31.0457 0 20C0 8.9543 8.9543 0 20 0C31.0457 0 40 8.9543 40 20Z" fill="#4C95F7"/><path fill-rule="evenodd" clip-rule="evenodd" d="M28.8674 24.6317L28.0341 28.2428C27.9469 28.6208 27.6104 28.8887 27.2224 28.8889C18.3335 28.8889 11.1113 21.6828 11.1113 12.7778C11.1249 12.3946 11.3871 12.0653 11.7574 11.9661L15.3685 11.1328C15.4301 11.1198 15.4928 11.1125 15.5558 11.1111C15.884 11.1277 16.1773 11.321 16.3219 11.6161L17.9885 15.505C18.0294 15.6099 18.0521 15.7209 18.0558 15.8333C18.0422 16.08 17.9325 16.3116 17.7502 16.4783L15.6452 18.2006C16.9207 20.9038 19.0964 23.0796 21.7997 24.355L23.5219 22.25C23.6886 22.0677 23.9202 21.958 24.1669 21.9444C24.2794 21.9481 24.3904 21.9708 24.4952 22.0117L28.3841 23.6783C28.6793 23.8227 28.8728 24.1162 28.8891 24.4444C28.888 24.5074 28.8807 24.5701 28.8674 24.6317H28.8674Z" fill="white"/></svg> </a>`
			shopCardHTML += `<p class="shopHours"> ${shop.openingHours[0]}~${shop.openingHours[1]}`
			// TIME
			if(isopen){
				shopCardHTML += `<svg class="isopen" width="38" height="11" viewBox="0 0 38 11" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.5428 7.9C11.5428 8.87 12.6028 9.66 14.3728 9.66C16.1428 9.66 17.2028 8.87 17.2028 7.9V7.5C17.2028 6.53 16.1428 5.74 14.3728 5.74C12.6028 5.74 11.5428 6.53 11.5428 7.5V7.9ZM14.3328 2.55C14.3328 1.66 13.6128 0.53 12.0428 0.53C10.4728 0.53 9.75282 1.66 9.75282 2.55V3.06C9.75282 3.95 10.4728 5.08 12.0428 5.08C13.6128 5.08 14.3328 3.95 14.3328 3.06V2.55ZM17.1628 5.62V0.179999H16.1928V1.33H14.7428V2.18H16.1928V3.41H14.7428V4.26H16.1928V5.62H17.1628ZM16.2328 7.84C16.2328 8.33 15.5128 8.85 14.3728 8.85C13.2328 8.85 12.5128 8.33 12.5128 7.84V7.56C12.5128 7.07 13.2328 6.55 14.3728 6.55C15.5128 6.55 16.2328 7.07 16.2328 7.56V7.84ZM13.3828 3.01C13.3828 3.6 12.9628 4.22 12.0428 4.22C11.1228 4.22 10.7028 3.6 10.7028 3.01V2.6C10.7028 2.01 11.1228 1.39 12.0428 1.39C12.9628 1.39 13.3828 2.01 13.3828 2.6V3.01ZM26.2644 4.9V0.179999H25.2844V2.18H23.4144C23.2844 1.33 22.5244 0.499999 21.1444 0.499999C19.6244 0.499999 18.8544 1.5 18.8544 2.43V2.81C18.8544 3.74 19.6244 4.74 21.1444 4.74C22.5444 4.74 23.3044 3.89 23.4144 3.03H25.2844V4.9H26.2644ZM25.2844 5.35V6.52H21.4944V5.35H20.5144V9.4H26.2644V5.35H25.2844ZM21.1444 3.89C20.2944 3.89 19.8044 3.31 19.8044 2.76V2.48C19.8044 1.93 20.2944 1.36 21.1444 1.36C21.9944 1.36 22.4844 1.93 22.4844 2.48V2.76C22.4844 3.31 21.9944 3.89 21.1444 3.89ZM21.4944 8.56V7.35H25.2844V8.56H21.4944ZM31.3959 5.25V6.06C29.9259 6.18 29.0159 6.82 29.0159 7.68V8.02C29.0159 8.96 30.1359 9.66 31.8959 9.66C33.6659 9.66 34.7759 8.95 34.7759 8.02V7.68C34.7759 6.83 33.8659 6.18 32.3959 6.06V5.25H36.1259V4.41H27.6659V5.25H31.3959ZM31.8959 2.58C31.9959 2.79 32.6959 3.12 33.1259 3.3C33.7659 3.56 34.3859 3.79 35.0459 4.02L35.4059 3.22C34.6259 2.97 34.0259 2.75 33.4959 2.52C32.8059 2.22 32.3859 1.91 32.3859 1.48V1.34H35.0259V0.52H28.7659V1.34H31.3959V1.48C31.3959 1.91 30.9559 2.25 30.2859 2.53C29.7459 2.75 29.1659 2.97 28.3759 3.22L28.7459 4.02C29.3859 3.8 30.0159 3.57 30.6859 3.3C31.1059 3.12 31.7859 2.79 31.8859 2.58H31.8959ZM31.8959 6.85C33.0259 6.85 33.7959 7.26 33.7959 7.74V7.96C33.7959 8.44 33.0259 8.85 31.8959 8.85C30.7659 8.85 29.9959 8.44 29.9959 7.96V7.74C29.9959 7.26 30.7659 6.85 31.8959 6.85Z" fill="#4C95F7"/><ellipse cx="2.93301" cy="5" rx="2.06997" ry="2" fill="#4C95F7"/></svg>`
			}else{
				shopCardHTML += `<svg class="isopen" width="38" height="11" viewBox="0 0 38 11" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="2.93301" cy="5" rx="2.06997" ry="2" fill="black" fill-opacity="0.54"/><path d="M13.6928 2.78C13.7928 2.99 14.4928 3.32 14.9228 3.5C15.5628 3.77 16.1528 3.99 16.8428 4.22L17.2028 3.42C16.3928 3.16 15.8228 2.96 15.2928 2.72C14.6128 2.41 14.1828 2.11 14.1828 1.68V1.39H16.8228V0.57H10.5628V1.39H13.1928V1.68C13.1928 2.11 12.7428 2.45 12.0828 2.73C11.5428 2.96 10.9928 3.16 10.1728 3.42L10.5428 4.22C11.2128 4 11.8128 3.78 12.4828 3.5C12.9028 3.32 13.5828 2.99 13.6828 2.78H13.6928ZM14.3128 7.37V5.57H17.9228V4.73H9.46282V5.57H13.3128V7.37H14.3128ZM11.6728 6.54H10.6828V9.3H16.8828V8.44H11.6728V6.54ZM26.2044 9.4V0.179999H25.2144V9.4H26.2044ZM23.5244 6.98V0.93H22.5444V3.11H20.2144V0.93H19.2344V6.98H23.5244ZM20.2144 3.95H22.5444V6.13H20.2144V3.95ZM31.3959 5.25V6.06C29.9259 6.18 29.0159 6.82 29.0159 7.68V8.02C29.0159 8.96 30.1359 9.66 31.8959 9.66C33.6659 9.66 34.7759 8.95 34.7759 8.02V7.68C34.7759 6.83 33.8659 6.18 32.3959 6.06V5.25H36.1259V4.41H27.6659V5.25H31.3959ZM31.8959 2.58C31.9959 2.79 32.6959 3.12 33.1259 3.3C33.7659 3.56 34.3859 3.79 35.0459 4.02L35.4059 3.22C34.6259 2.97 34.0259 2.75 33.4959 2.52C32.8059 2.22 32.3859 1.91 32.3859 1.48V1.34H35.0259V0.52H28.7659V1.34H31.3959V1.48C31.3959 1.91 30.9559 2.25 30.2859 2.53C29.7459 2.75 29.1659 2.97 28.3759 3.22L28.7459 4.02C29.3859 3.8 30.0159 3.57 30.6859 3.3C31.1059 3.12 31.7859 2.79 31.8859 2.58H31.8959ZM31.8959 6.85C33.0259 6.85 33.7959 7.26 33.7959 7.74V7.96C33.7959 8.44 33.0259 8.85 31.8959 8.85C30.7659 8.85 29.9959 8.44 29.9959 7.96V7.74C29.9959 7.26 30.7659 6.85 31.8959 6.85Z" fill="black" fill-opacity="0.54"/></svg>`
			}
			shopCardHTML += `</p>`
			// END
			shopCardHTML+=`
			</div>`
		})

		let targetJson = {
			"meta":
			{
				"languages": ["kor"],
				"linebreak": "<br>",
			},
			"contents":
			{
				"shop_container": {"kor": shopCardHTML},
				"region_data": {"kor": JSON.stringify(region)},
			}
		}

		const mulang_home = new mulang({
			sourceHtml: sourceHtml,
			targetJson: targetJson
		})
		res.send(mulang_home.render().kor)
	});
});



//-------------------- SHOP - INQUIRY --------------------//
app.get('/shop/inquiry',(req,res)=>{
	res.sendFile(path.join(__dirname,'public/client/shopInquiry.html'));
});
app.post('/shop/inquiry',(req,res)=>{
	res.sendStatus(200);
});



//-------------------- FRANCHISE --------------------//
app.get('/franchise',(req,res)=>{
	let sourceHtml = fs.readFileSync(path.join(__dirname,'public/client/franchise.html'),'utf-8');
	// STYLE SHEET : MOBILE/DEKSTOP
	if(req.useragent.isMobile){
		sourceHtml = sourceHtml.replace('<!-- stylesheet_placeholder -->',`<link rel="stylesheet" href="public/client/franchise_mobile.css">`)
	}else{
		sourceHtml = sourceHtml.replace('<!-- stylesheet_placeholder -->',`<link rel="stylesheet" href="public/client/franchise_desktop.css">`)
	}
	res.send(sourceHtml);
});



//-------------------- FRANCHISE - INQUIRY --------------------//
app.get('/franchise/inquiry',(req,res)=>{
	res.sendFile(path.join(__dirname,'public/client/franchiseInquiry.html'));
});

//-------------------- Terms Of Service --------------------//
app.get('/termsofservice',(req,res)=>{
	res.send("이용약관");
});

//-------------------- Privacy Statement --------------------//
app.get('/termsofservice',(req,res)=>{
	res.send("개인정보처리방침");
});





//------------------------------------------------------//
//-------------------- MONGO DB API --------------------//
//------------------------------------------------------//

var MongoClient = require('mongodb').MongoClient;
var mongoUrl = "mongodb://localhost:27017/";
var mongoOption = {useUnifiedTopology: true };

const mongoFind = (collection="",query={},callback=function(){}) => {
	MongoClient.connect(mongoUrl, mongoOption, function(err, db) {
		if (err) throw err;
		var dbo = db.db("seomin");
		dbo.collection(collection).find(query).toArray(function(err, result) {
			if (err) throw err;
			db.close();
			callback(result);
		});
	});
}

const mongoInsert = (collection="",document={}) => {
	MongoClient.connect(mongoUrl, mongoOption, function(err, db) {
		if (err) throw err;
		var dbo = db.db('seomin');
		dbo.collection(collection).insertOne(document,function(err,result){
			console.log("1 document inserted",'\n',result);
			db.close();
		});
	});
}



//-----------------------------------------------//
//-------------------- ADMIN --------------------//
//-----------------------------------------------//

//-------------------- MAINPAGE & LOGIN --------------------//
app.get('/admin',(req,res)=>{
	res.sendFile(path.join(__dirname,'public/admin/admin.html'));
});
app.post('/admin/login',(req,res)=>{
});
app.post('/admin/logout',(req,res)=>{
});


//-------------------- MENU --------------------//
app.post('/admin/menu/createUpdate',(req,res)=>{
	console.log( req.body );
	const data = {
		"productName":"메뉴 이름", 
		"price":[{"size":"L","value":17000},{"size":"M","value":14000}], 
		"description":{"short":"짧은 설명 or 키워드","long":"메인 설명글"}
	}
});
app.post('/admin/shop/delete',(req,res)=>{
	console.log( req.body );
	const targetID = "";
});


//-------------------- SHOP --------------------//
app.post('/admin/shop/createUpdate',(req,res)=>{
	console.log( req.body );
	res.send('success')
	const data = {
        "name":"서민피자 ㅇㅇㅇ 점",
		"address":"서울 중구 충무로5가 36-2",
		"road_address":"서울 중구 퇴계로49길 14",
        "city":"서울",
        "district":"중구",
        "phone":"가맹점 전화번호",
        "openingHours":["오픈시간","마감시간"],
    };
});
app.post('/admin/shop/delete',(req,res)=>{
	console.log( req.body );
	const targetID = "";
});


//-------------------- SHOP - INQUIRY --------------------//
app.post('/admin/shopInquiry/statusUpdate',(req,res)=>{
	console.log( req.body );
	data = {
		"targetID": "",
		"newStatus": "접수/완료"
	}
});

//-------------------- FRANCHISE - INQUIRY --------------------//
app.post('/admin/franchiseInquiry/statusUpdate',(req,res)=>{
	console.log( req.body );
	data = {
		"targetID": "",
		"newStatus": "접수/완료"
	}
});





//---------------------------------------------------//
//-------------------- Kakao API --------------------//
//---------------------------------------------------//

app.get('/admin/searchAddress',(req,res)=>{

	const queryString = encodeURIComponent(req.query.keyword);
	const url = 'https://dapi.kakao.com/v2/local/search/address.json?page=1&size=10&query='+queryString;

	fetch(url, {
		method: 'get',
		headers: { 'Authorization': 'KakaoAK '+process.env.Kakao_REST }
	})
	.then((res) => {
		return res.json() 
	})
	.then((json) => {
		if(json.documents.length==0){
			// NOT FOUND
			res.send('일치하는 주소가 없습니다.');
		} else {
			// MAKE DOCUMENT
			// console.log( json.documents );
			let mapped = json.documents.filter(dataset => {
				if ( dataset.address_type == "ROAD_ADDR" || dataset.address_type == "REGION_ADDR" ) {
					return true
				} else { 
					return false 
				}
			}).map(dataset => {
				let temp = {};
				temp["address"] = dataset.address.address_name;
				if (dataset.road_address != null){
					temp["road_address"] = dataset.road_address.address_name;
				} else {
					temp["road_address"] = "";
				}
				
				temp["city"] = dataset.address.region_1depth_name;
				temp["district"] = dataset.address.region_2depth_name;
				
				return temp
			})
			res.send(mapped);
		}
	});
})