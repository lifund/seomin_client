const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const path = require('path');

const port = 3000;

app.listen(port, ()=>{console.log('seomin client listening port:', port)});
app.set('trust proxy', true);
app.use(express.json({ limit: '5mb'}));
app.use('/public', express.static('public'));
app.use(bodyParser.json());
  

app.get('/',(req,res)=>{
	res.sendFile(path.join(__dirname,'public/temp.html'));
})
