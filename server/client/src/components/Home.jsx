import axios from 'axios';
import {useState, useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import { addInitialFiles, addMessages, managePromptsArr, manageChatMsgHistory, manageAllFilesInWC} from '../store/filesAndFoldersSlice.js';
import { accessFileContentFromWC, createFilesInWCFromObj, createFilesInWCUsingArray, getAllCurrentFolderAndFileNamesInWC, runScriptInWC } from '../utils/webCon.js';
import { parseXml } from '../utils/respParser.js';
import {useNavigate} from 'react-router-dom'
import store from '../store/store.js';
import arrow from "./next.png"
import { useOutletContext } from "react-router-dom";
import { FitAddon } from '@xterm/addon-fit'


export function Home(){
    const dispatch = useDispatch();
    const messages = useSelector((state)=>state.filesAndFolders.messages)
    const navigate = useNavigate()
    const changedFiles = useSelector((state) => state.filesAndFolders.changedFiles)
    const [initialPrompt, setInitialPrompt] = useState("")
    const {instance} = useOutletContext()


    useEffect(()=>{
        
    }, [])

    const addMessagesInStore = (messagesNew)=>{
        dispatch(addMessages(messagesNew))
    }

    const fabricateLastMsg = async(updatedChangedFiles)=>{
        let msg = ''
        // file path + \n + ``` + \n + file content from WC (as an object) + \n + ``` + \n 
        // await Promise.all(await updatedChangedFiles.map(async(filePath)=>{
        //     msg += filePath
        //     msg += "\n```\n"
        //     let currFileContent = await accessFileContentFromWC(filePath)
        //     msg += currFileContent
        //     msg += "\n```\n"
        // })
        // )

        // for(const filePath of changedFiles){
        //     msg += filePath
        //     msg += "\n```\n"
        //     let currFileContent = await accessFileContentFromWC(filePath)
        //     msg += currFileContent
        //     msg += "\n```\n"
        // }
        // console.log("msg", msg)
        // return msg

        const fileContents = await Promise.all(updatedChangedFiles.map(async (filePath) => {
            let currFileContent = await accessFileContentFromWC(filePath);
            return `${filePath}\n\`\`\`\n${currFileContent}\n\`\`\`\n`;
            
        }));
        msg += fileContents.join(""); // Join all retrieved contents
        return msg;
    }

    const create = async ()=>{
        const tempResp = await axios.post('http://localhost:8000/api/v1/chat/template', {
            prompt: initialPrompt
        })
        const initialCodeStructure = tempResp.data.uiPrompts
        console.log(initialPrompt)
        //save the initial code files in session storage and redux store, TODO have to delete them after we save the get-code response
        dispatch(addInitialFiles(initialCodeStructure))

        // creating initial files in the web container
        await createFilesInWCFromObj(initialCodeStructure)

        const allFileAndFolderStruct = await getFilesAndFolderNames()
        dispatch(manageAllFilesInWC(allFileAndFolderStruct))

        let updatedChatMsgHistory = [{role: "user", msg: initialPrompt}]
        dispatch(manageChatMsgHistory(updatedChatMsgHistory));


        navigate('/current-project');

        
        //run 'npm install' manually
        console.log("here 1")
        instance?.writeln('npm install')
        await runScriptInWC('npm install', instance)
        console.log("it comes here")
        


        // the three resps, take the first resp the one with project files, save in first maessages(othr places -1 or 0), messages[1]="telling about the conversation history", the second resp in messages[2]
        const messagesNew = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        messagesNew[0] = {role: "user", content: tempResp.data.prompts[0]}
        messagesNew[1] = {role: "user", content: "Below is the conversation history, including all previous messages along with the most recent assistant response. Please reference this context to inform your future responses and maintain conversation continuity."}
        messagesNew[2] = {role: "user", content:`Previous Message #1: ${tempResp.data.prompts[1]}`}

        //save ths messages array in the store and session storage
        addMessagesInStore(messagesNew)

        //take the current prompt, add it in the prompts[5] at prompts[0]
        const prompts = [0, 0, 0, 0, 0]
        prompts[0] = initialPrompt


        //save the prompts array in store and session storage
        dispatch(managePromptsArr(prompts))


        

    
        //all the files mentioned in the resp, add them in changedFiles array



        //(move to the next get-code)




        // await accessFile()
        //the prompts to get-code, the first prompt in messages[0] and rest as '0'
        //the messages[1] as below is conversation history
        //messages[2] as Previous Message #1: For all designs. prompt[1]
        //add the current prompt in prompts array(prompts[0])
        //
        //after response, add the file names to the fileNames array
        //parse the response and create in wc
        //add the response in messages at [4] add the response
        //how do i parse the response?
        //we can get the file and folder structure(just add \t when writing down the nested files or folders)
            //response parsing: take the response, it has different tags, after ignoring the extra text, whe bolt artifact is encountered, start the parsing, bolt action, only a particular kind of actions will be given, to either crete a file or deleted it or create a folder and delete it etc., take them one by one, and according to the actions(6) make changes in the WC. 
        
        
        // get-code
        // the prompt from the prompts, start filling the mesasges array starting from [3] till the prompts(encountered 0 or if no 0 found then add all the prompts[] in messages starting from 3 to 7)
        // then add the prompt in prompts[] (becuase at the start we are accessing the old prompts)(if 0 found then, at 0 if not, then scoot up one place every entry and add the lastest prompt at the last)
        




        




        await fetch('http://localhost:8000/api/v1/chat/get-code', {
            method: "Post",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({"msgs": tempResp.data.prompts.map((x)=> {return {role: "user", content: x}})})
        }).then(async(res)=>{
            console.log("here 2")
            const reader = res.body.getReader()
            const decoder = new TextDecoder()
            let result = ""
            await reader.read().then(async function processText({done, value}){
                if(!done){
                    const text = decoder.decode(value || new Uint8Array(), {stream: true})
                    result += text
                    reader.read().then(processText)
                    //we want to stream the response on the left hand side area of our UI
                }else{
                    console.log(result)
                    //while sending initial request to get-code:
                    //get-code resp: messages[4] add in it, parse it and create in WC, now, run the commands too, npm install and then show on the left (this also in store and session storage because have to show upon refreshes, npm install install dependencies)
                    const msgs = messagesNew.map((msg)=> typeof msg === "object"? {...msg} : msg)
                    msgs[3] = {role: "assistant", content: result}
        
                    //after parsing the result -> create in wc -> have an updated changedFiles -> from the parsed response fabricate the chatMsgHistory[1] -> also chatMsgHistory(store ) = current prompt -> after the changedFiles updated, console.log(changedFiles), save their content by fetching from the WC and saving in msgs[4]

                    const parsedResp = parseXml(result)
                   
                    await createFilesInWCUsingArray(parsedResp, changedFiles, instance, dispatch)
                    const nowChangedFiles = store.getState().filesAndFolders.changedFiles
                    console.log('ChangedFiles:' , nowChangedFiles)

                    const lastPromptMsg = await fabricateLastMsg(nowChangedFiles);
                    console.log("prompt msg", lastPromptMsg)
                    msgs[4] = {role: "user", content: lastPromptMsg}
                    dispatch(addMessages(msgs))


                    let modifiedChatMsg = []
                    modifiedChatMsg.push(parsedResp[0]);//initial response text
                    modifiedChatMsg.push(parsedResp[1]);//artifact title
                    modifiedChatMsg.push({type: "CreateFile", title: "Create initial files"})
                    modifiedChatMsg.push({type: "CreateFile", title: "Install dependencies"})
                    modifiedChatMsg.push({type: "RunScript", code: "npm install"})
                    //add rest of the parsedResponse elements
                    let idx=2;
                    while(idx < parsedResp.length){
                        modifiedChatMsg.push(parsedResp[idx])
                        idx++
                    }
                    const updatedChatHistory = [...updatedChatMsgHistory]
                    updatedChatHistory.push({role: "assistant", msg: modifiedChatMsg});

                    dispatch(manageChatMsgHistory(updatedChatHistory));

                    const allFileAndFolderStruct2 = await getFilesAndFolderNames()
                    dispatch(manageAllFilesInWC(allFileAndFolderStruct2))

                    setInitialPrompt("")
            }})
        
        }).catch((err)=>{
            console.log(err);
        }) 

        
    }

    //after the /template, the package.json is being made, createFilesFromObj(), run 'npm install' just after the files are created in WC(here through runScriptInWC()). 
    //just after the click of /template, navigate to (/main page). there, asap show the files and folders in file explorer(clickable divs, connected to each monaco page) and in monaco.
    //as the scripts run show in sterm2 js -> also do the same for other /get-codes -> rather do it inside the runScriptsInWC()
    //
    // get-code hit(not using messages): the propmpt in prompts
    // messages: [3]prompts(not to do here), [3] response, [4] the files in response, thier code from changed files set
    //chatMessageHistory: save {role: "user", msg: firstPrompt here}, the response add "create initial files, package.json and all show them(showing names of relevent files), save this fabricated string in chatMsgHistory"
    
    


    //if the problem of filled session storage comes, or we are concerned, delete the initialFiles(store), and use the messages[0], use regex to create the files and folders(we would need another parser) -> else upon refresh just use initialFiles(store)


    function getParsedVal(resp){
        const parsedVal = parseXml(resp)
        console.log(parsedVal);
    }

    async function accessFile(){
        const content = await accessFileContentFromWC("src/App.tsx");
        console.log(content)
    }
    
    async function getFilesAndFolderNames(){
        const fullFileFolderStructure = await getAllCurrentFolderAndFileNamesInWC('', 0)
        fullFileFolderStructure.map((element)=>{
            console.log(element? (element):("some undefined bro"))
            console.log(element?.path)
        })
        return fullFileFolderStructure;
    }

    const initialUserPromptInput = (inputPrompt)=>{
        setInitialPrompt(inputPrompt)
    }

    return (
        <>
            <div className="flex min-h-screen min-w-screen items-center justify-center bg-[#0a0a0a]">
                <div className="flex flex-col items-center justify-center text-center absolute inset-0 bg-[radial-gradient(circle_450px_at_20%_-20%,rgba(128,0,255,0.7),rgba(128,0,255,0.2)_60%,transparent_100%)]">
                    <div className="flex flex-col items-center justify-center text-center absolute inset-0 bg-[radial-gradient(circle_450px_at_10%_-45%,rgba(128,0,255,0.7),rgba(128,0,255,0.2)_60%,transparent_100%)]">
                        <div>
                        <p className="text-4xl font-bold text-white mb-4">Ask Asimo to build your next Project</p>
                        <p className="text-gray-400 mb-6">Prompt and build full stack React, NodeJS and NextJS Web Apps.</p>
                    </div>
                    {/* <div className="bg-[#141414] w-[550px] max-w-[550px] h-32 flex relative rounded-md border-gray-600 border-[1px]">
                        <textarea className=" text-white absolute left-3 top-4 focus:outline-none focus:ring-0 h-20 w-[450px] overflow-y-auto break-words resize-none" type="text" placeholder="Enter your prompt here" onChange={(e) => initialUserPromptInput(e.target.value)} onKeyDown={(e)=>{ 
                            if(e.key == "Enter" && !e.shiftKey){
                            e.preventDefault()
                            create()
                        }}}></textarea>

                        <button className="absolute right-4 top-4" onClick={create}><div className="bg-[rgba(128,0,255,0.7)] px-1 py-1 rounded-md"><img src={arrow} alt="Create" className="w-7"></img></div></button>
                    </div>   */}
                    <div className="relative">
                        <div className="w-[550px] max-w-[550px] h-32 rounded-md border border-transparent bg-[#141414] [background:linear-gradient(45deg,#172033,theme(colors.slate.800)_50%,#172033)_padding-box,conic-gradient(from_var(--border-angle),theme(colors.slate.600/.48)_80%,theme(colors.indigo.500)_86%,theme(colors.indigo.300)_90%,theme(colors.indigo.500)_94%,theme(colors.slate.600/.48))_border-box] animate-border">
                            <div className="bg-[#141414] w-[550px] h-32 flex relative rounded-md border-gray-600 border-[1px]">
                                <textarea className="text-white absolute left-3 top-4 focus:outline-none focus:ring-0 h-20 w-[450px] overflow-y-auto break-words resize-none text-lg" type="text" placeholder="Enter your prompt here" onChange={(e) => initialUserPromptInput(e.target.value)} onKeyDown={(e)=>{ 
                                    if(e.key == "Enter" && !e.shiftKey){
                                    e.preventDefault()
                                    create()
                                }}}></textarea>

                                <button className="absolute right-4 top-4" onClick={create}>
                                    <div className="bg-[rgba(128,0,255,0.7)] px-1 py-1 rounded-md">
                                        <img src={arrow} alt="Create" className="w-7" />
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>


                    </div>
                     
                </div>
                 
            </div>
            
        </>
    )
}



