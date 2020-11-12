const express = require('express');
const bodyParser = require('body-parser');
const app = express();

const port = 3000;

app.listen(port, ()=>{console.log('client listening port:', port)});
app.set('trust proxy', true);
app.use(express.json({ limit: '5mb'}));
app.use('/public', express.static('public'));
app.use(bodyParser.json());
  

app.get('/',(req,res)=>{
	res.send('서민피자.com 정상적으로 설치되었습니다.<br> 홈페이지 준비중입니다.');
})
