// import Anthropic from '@anthropic-ai/sdk';
import OpenAI from "openai";
import { Mistral } from "@mistralai/mistralai";


// const getAnswerFromClaude = async(msgsArray)=>{
//     const anthropic = new Anthropic({
//         apiKey: process.env.ANTHROPIC_API_KEY,
//     });
//     const msg = await anthropic.messages.create({
//         model: "claude-3-7-sonnet-20250219",
//         max_tokens: 1024,
//         messages: msgsArray,
//     });
//     return msg;
// }






// const getAnswerFromClaude = async(msgsArray)=>{
//     const openai = new OpenAI({
//         baseURL: 'https://api.deepseek.com',
//         apiKey: process.env.DeepSeek_API_Key
// });
//     const completion = await openai.chat.completions.create({
//         messages: msgsArray,
//         model: "deepseek-chat",
//     });
    
//     return completion.choices[0].message.content;
// }




// const getAnswerFromChatGPT = async(msgsArray)=>{
//   console.log("msgsarr", msgsArray)
//   const openai = new OpenAI({
//     apiKey:process.env.OPEN_AI_API_KEY,
//   });

//   const stream = openai.chat.completions.create({
//     model: "gpt-4o-mini",
//     store: true,
//     messages: msgsArray,
//     stream: true,
//   });

//   // for await (const chunk of stream) {
//   //     process.stdout.write(chunk.choices[0]?.delta?.content || "");
//   // }
//   return stream;
// }

const getAnswerFromChatGPT = async (msgsArray) => {
  console.log("msgsarray", msgsArray)

    const client = new Mistral({apiKey: process.env.OPEN_AI_API_KEY});
        try{
            const resultStream = await client.chat.stream({
                model: "codestral-latest",
                messages: msgsArray,
            });
        
            return resultStream; 
        }catch(err){
            console.log("Something went wrong while generating response from Mistral AI.")
            throw err;
        }
}

export {getAnswerFromChatGPT};