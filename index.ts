import express from 'express';
import cors from "cors";
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { client } from './client';

const app = express();
app.use(express.json());
app.use(cors());

const port = 3000;

//graphql
async function startServer() {
  const server =new ApolloServer({
    typeDefs:`
      type comments{
        id:ID
        body:String,
        postId:Int
        user:user
      }
      type user{
        id:Int
        username:String
      }
      type Query{
        getComments:[comments]
      }
    `,
    resolvers:{
      Query:{
        getComments: async () =>{
          //redis caching
          const cachedData=await client.get("comments")
          if (cachedData) return JSON.parse(cachedData)

          let res:any= await fetch('https://dummyjson.com/comments')
          res= await res.json()
          client.set("comments",JSON.stringify(res.comments))
          client.expire("comments",30)
          return res.comments
        }
      }
    }
  })
  await server.start();
  app.use("/graphql",expressMiddleware(server));
}
startServer();
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
