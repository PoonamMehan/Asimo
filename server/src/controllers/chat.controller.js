import { getAnswerFromChatGPT } from "../utils/claude.js"
import { beautifyNextjs, existNotShownList, initialNextJSFoldersAndFiles, nextjsPrompt } from "../utils/nextjs_prompt/nextjs_prompt.js";
import { initialNodeJSFoldersAndFiles, nodejsPrompt } from "../utils/nodejsPrompt/nodejsPrompt.js";
import { commonPrompt, get_system_prompt } from "../utils/prompts.js";
import { beautifyReactPrompt, initialReactFoldersAndFiles, reactPrompt } from "../utils/react_prompt/react_prompt.js";


const template = async(req, res)=>{
    const reqPayload = req.body.prompt;
    const msgsArray = [
        {role: "user", content: "Based on the first user prompt return either 'react-vite-ts' or 'nextjs-shadcn' or 'node'. Do not return anything else. Return 'react-vite-ts' only even when user's query might need full stack app. Return 'nextjs-shadcn' only if user explicity mentions it. Return 'node' if user's query only needs a backend."},
        {role: "user", content: reqPayload}, 
    ];

    // const ans = await getAnswerFromChatGPT(msgsArray);
    // console.log(ans);
    // res.json({ans});
    let completeAns = "";
    const ansStream = await getAnswerFromChatGPT(msgsArray);
    for await (const chunk of ansStream) {
        // console.log(chunk.choices[0]?.delta?.content || "");
        completeAns += chunk.data.choices[0]?.delta?.content || ""

    }
    
    if(completeAns == "react-vite-ts"){
        res.json({
            prompts: [`Project Files:\n\nThe following is a list of all project files and their complete contents that are currently visible and accessible to you.\n\n${reactPrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`, 
                beautifyReactPrompt,
                `${commonPrompt[0]}${reqPayload}${commonPrompt[1]}`
            ],
            uiPrompts: initialReactFoldersAndFiles
        })
    }else if(completeAns == "nextjs-shadcn"){
        res.json({
            prompts: [`Project Files:\n\nThe following is a list of all project files and their complete contents that are currently visible and accessible to you.\n\n.${nextjsPrompt}${existNotShownList}`, 
            beautifyNextjs,
            `${commonPrompt[0]}${reqPayload}${commonPrompt[1]}`
            ],
            uiPrompts: initialNextJSFoldersAndFiles
        })
    }else if(completeAns == 'node'){
        res.json({
            prompts: [`Project Files:\n\nThe following is a list of all project files and their complete contents that are currently visible and accessible to you.\n\n${nodejsPrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
            "Build an efficient backend, modular in style.",
            `Current Message:\n\n${reqPayload}`
            ],
            uiPrompts: initialNodeJSFoldersAndFiles
        })
    }
}

const getContentFromLLM = async(req, res)=>{
    console.log("Request is processing")
    const msgs = req.body.msgs
    const msgsArray = [
        {role: "system", content: get_system_prompt()},
        ...msgs
    ]
    
    const ansStream = await getAnswerFromChatGPT(msgsArray);
    const encoder = new TextEncoder();

    for await (const chunk of ansStream) {
        let currChunk = chunk.data.choices[0]?.delta?.content || ""
        currChunk = encoder.encode(currChunk);
        res.write(currChunk)
    }
    res.end();
}


export {template, getContentFromLLM};