import express from 'express';
import pg from 'pg';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app=express();
const port=3000;
const db=new pg.Client({
    user:process.env.USER,
    password:process.env.PASSWORD,
    database:process.env.DATABASE,
    host:process.env.HOST,
    port:process.env.PORT,
});

app.use(express.json({ limit: '1mb', type: 'application/json' }));
app.use(express.urlencoded({extended:true}));
app.use(express.static("public"));


db.connect();

const searchBaseUrl="https://openlibrary.org/search.json?title=";
const imageBaseUrl="https://covers.openlibrary.org/b/id/";

await db.query("create table if not exists book(id serial primary key,title varchar(100) not null,started Date not null, cover bigint)");
await db.query("create table if not exists thoughts(id serial primary key,book_id integer references book(id),notes text, review text, rating int)");




app.get("/",async(req,res)=>{
    var results=await db.query("select * from books inner join thoughts on books.id=thoughts.book_id");
    var data=results.rows;
    //console.log(data);
    res.render("index.ejs",{books:data});
});

app.get("/create",(req,res)=>{   
    res.render("information.ejs");
});

app.get("/information/:id",async (req,res)=>{
    console.log("getting "+req.params.id);
    var results=await db.query(`select * from books inner join thoughts on books.id=thoughts.book_id where books.id=$1`,[req.params.id]);
    var data=results.rows[0];
    res.json({data});
});

app.get("/search",async(req,res)=>{
    var results=[];
    var column=req.query.searchBy;
    var parameter=req.query.searchText;
    var operator;
    if(column=="title"){
        operator="like";
        parameter=`'%${req.query.searchText}%'`;
    }
    else{
        operator="=";
        if(column=="started"){
            console.log("started");
            parameter=`'${parameter}'`;
        }else if(column=="review"){
            if(parameter=="on"){
                operator='is not NULL';
                parameter="and review !=''";
            }
            else{
                operator='is NULL';
                parameter=`or review = ''`
            }
        }
    }
    if(parameter && parameter.trim()!=""){
        console.log(parameter);
        console.log(`select * from books inner join thoughts on books.id=thoughts.book_id where ${column} ${operator} $1 order by ${req.query.sort} ASC`,[parameter])
         results=await db.query(`select * from books inner join thoughts on books.id=thoughts.book_id where ${column} ${operator} $1 order by ${req.query.sort} ASC`,[parameter]);
    }
    else{
        results=await db.query(`select * from books inner join thoughts on books.id=thoughts.book_id order by ${req.query.sort} ASC`);
    }
    var data=results.rows;
    res.render("index.ejs",{books:data});
});

app.patch("/:id",async(req,res)=>{
    try{
        var coverImage=await getImageId(req.body.title);
        await db.query(`update books set title=$1, started=$2, cover=${coverImage} where id=$3`,[req.body.title,req.body.start,req.params.id]);
        await db.query(`update thoughts set notes=$1, review=$2,rating=$3 where book_id=$4`,[req.body.notes,req.body.review,req.body.rating,req.params.id]);
        res.sendStatus(200);
    }catch(err){
        console.log(err);
        res.sendStatus(400);
    }
});

app.delete("/:id",async(req,res)=>{
    try{
        await db.query(`delete from books where id=$1`,[req.params.id]);
        await db.query(`delete from thoughts where book_id=$1`,[req.params.id]);
        res.sendStatus(200);
    }catch(err){
        res.sendStatus(400);
    }
});

app.post("/",async (req,res)=>{
    if(!req.body.title || !req.body.start){
            res.status(404).json({error: "The book title and start date must not be empty"});
    }
    else{
        var bookAlreadyExits=await db.query(`select * from books where title=$1`,[req.body.title]);
        if(bookAlreadyExits.rowCount>0){
            res.status(404).send({error: "A book with that title already exists"});
        }
        else{
            var coverImage= await getImageId(req.body.title);
            var results=await db.query(`insert into books(title,started,cover) values($1,$2,${coverImage}) returning books.id`,[req.body.title,req.body.start]);
            var id=(results.rows)[0].id;
            await db.query(`insert into thoughts(book_id,notes,review,rating) values(${id},$1,$2,$3)`,[req.body.notes,req.body.review,req.body.rating]);
            res.status(200).json({message: "Book created successfully"});
        }
    }
});

/*app.get("/image/:title",async(req,res)=>{
    console.log(req.params.title);
    const response=await axios.get(searchBaseUrl+req.params.title+"&fields=cover_i");
    const results=response.data;
    console.log(results);
    if(results.numFound>0){
        var coverImage="";
        for(let i=0;i<results.numFound;i++){
            if(results.docs[i].cover_i){
                coverImage=results.docs[i].cover_i;
            }
        }
        console.log(imageBaseUrl+coverImage+"-M.jpg");
        //var bookValue=results.docs[0].cover_i;
        //const coverResponse=await axios.get(imageBaseUrl+bookValue+"-S.jpg");
        //const FilecoverResults=coverResponse.date;
        res.(imageBaseUrl+coverImage+"-S.jpg");
    }
    else{
        res.json({noImage:true});
    }
});*/

async function getImageId(title){
    var titleUrl=title.replaceAll(" ","+");
    const response=await axios.get(searchBaseUrl+titleUrl+"&fields=cover_i");
    const results=response.data;
    var coverImage="";
    if(results.numFound>0){
        for(let i=0;i<results.numFound;i++){
            if(results.docs[i].cover_i){
                coverImage=results.docs[i].cover_i;
                break;
            }
        }
    }
    return coverImage;
}

app.listen(port,()=>{
    console.log("user connected");
});